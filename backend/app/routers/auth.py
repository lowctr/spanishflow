import hashlib
import hmac
import json
from urllib.parse import unquote, parse_qs
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User
from app.schemas import TelegramAuthIn, UserOut
from app.routers.session import get_current_user
from typing import Optional
from pydantic import BaseModel


class UpdateSettingsIn(BaseModel):
    daily_goal: Optional[int] = None
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def validate_telegram_init_data(init_data: str, bot_token: str) -> dict:
    """
    Validates Telegram WebApp initData HMAC signature.
    Returns parsed user data if valid, raises HTTPException if invalid.
    """
    parsed = parse_qs(init_data, keep_blank_values=True)
    received_hash = parsed.get("hash", [None])[0]
    if not received_hash:
        raise HTTPException(status_code=401, detail="Missing hash in initData")

    # Build data-check-string: sort keys (except hash), join with \n
    data_check_parts = []
    for key, values in sorted(parsed.items()):
        if key == "hash":
            continue
        data_check_parts.append(f"{key}={values[0]}")
    data_check_string = "\n".join(data_check_parts)

    # Compute secret key: HMAC-SHA256(bot_token, "WebAppData")
    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    # Compute expected hash
    expected_hash = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid initData signature")

    # Extract user object
    user_json = parsed.get("user", [None])[0]
    if not user_json:
        raise HTTPException(status_code=401, detail="No user in initData")

    return json.loads(unquote(user_json))


@router.post("/telegram", response_model=UserOut)
async def telegram_auth(
    payload: TelegramAuthIn,
    db: AsyncSession = Depends(get_db),
):
    """
    Receives Telegram WebApp initData, validates it, upserts user in DB.
    Returns user object.
    """
    init_data = payload.init_data

    # Dev mode: skip validation
    if not settings.BOT_TOKEN or init_data == "dev_mode":
        tg_user = {
            "id": 12345,
            "username": "dev_user",
            "first_name": "Dev",
        }
    else:
        tg_user = validate_telegram_init_data(init_data, settings.BOT_TOKEN)

    user_id = int(tg_user["id"])
    username = tg_user.get("username")
    first_name = tg_user.get("first_name", "")

    # Upsert user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            id=user_id,
            username=username,
            first_name=first_name,
            daily_goal=payload.daily_goal or 10,
        )
        db.add(user)
        await db.flush()
    else:
        # Update mutable fields
        user.username = username
        user.first_name = first_name
        if payload.daily_goal is not None:
            user.daily_goal = payload.daily_goal

    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/settings", response_model=UserOut)
async def update_settings(
    body: UpdateSettingsIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.daily_goal is not None and body.daily_goal > 0:
        user.daily_goal = body.daily_goal
    await db.commit()
    await db.refresh(user)
    return user
