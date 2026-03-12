import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import useStore from '../store/useStore'
import { useTelegram } from '../hooks/useTelegram'
import ProgressBar from '../components/ProgressBar'
import StreakBadge from '../components/StreakBadge'

export default function Stats() {
  const { user, setPage } = useStore()
  const { haptic } = useTelegram()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--tg-theme-bg-color)',
        }}
      >
        <p style={{ color: 'var(--tg-theme-hint-color)' }}>Завантаження...</p>
      </div>
    )
  }

  const totalLearned = stats?.total_learned || 0
  const totalWords = stats?.total_words || 2000
  const wordsInProgress = stats?.words_in_progress || 0
  const streak = stats?.streak || 0
  const xp = stats?.xp || 0
  const completedToday = stats?.completed_today || 0
  const dailyGoal = stats?.daily_goal || 10

  const masteredPercent = Math.round((totalLearned / totalWords) * 100)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 20px',
        paddingTop: 'env(safe-area-inset-top, 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          marginTop: 8,
        }}
      >
        <button
          onClick={() => {
            haptic.impact('light')
            setPage('home')
          }}
          style={{
            background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
            border: 'none',
            borderRadius: 10,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 18,
            color: 'var(--tg-theme-text-color)',
          }}
        >
          ←
        </button>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--tg-theme-text-color)',
          }}
        >
          Статистика
        </h1>
      </div>

      {/* Streak + XP row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(239,68,68,0.08) 100%)',
            border: '1px solid rgba(251,146,60,0.2)',
            borderRadius: 16,
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 4 }}>🔥</div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: '#f97316',
              letterSpacing: '-0.04em',
            }}
          >
            {streak}
          </div>
          <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginTop: 2 }}>
            днів поспіль
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 16,
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 4 }}>⚡</div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: 'var(--tg-theme-button-color, #6366f1)',
              letterSpacing: '-0.04em',
            }}
          >
            {xp}
          </div>
          <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginTop: 2 }}>
            XP зароблено
          </div>
        </div>
      </div>

      {/* Progress to mastery */}
      <div
        style={{
          background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          borderRadius: 18,
          padding: '20px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 14,
          }}
        >
          <div>
            <p style={{ fontSize: 13, color: 'var(--tg-theme-hint-color)', marginBottom: 2 }}>
              Прогрес
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--tg-theme-text-color)',
                letterSpacing: '-0.03em',
              }}
            >
              {masteredPercent}%
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--tg-theme-text-color)' }}>
              {totalLearned}
            </p>
            <p style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>
              з {totalWords} слів
            </p>
          </div>
        </div>
        <ProgressBar value={totalLearned} max={totalWords} height={10} color="#4ade80" />
      </div>

      {/* Detail stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
            borderRadius: 14,
            padding: '16px',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginBottom: 6 }}>
            В процесі
          </p>
          <p
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--tg-theme-text-color)',
              letterSpacing: '-0.03em',
            }}
          >
            {wordsInProgress}
          </p>
          <p style={{ fontSize: 11, color: 'var(--tg-theme-hint-color)', marginTop: 2 }}>
            активних слів
          </p>
        </div>

        <div
          style={{
            background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
            borderRadius: 14,
            padding: '16px',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginBottom: 6 }}>
            Сьогодні
          </p>
          <p
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--tg-theme-text-color)',
              letterSpacing: '-0.03em',
            }}
          >
            {completedToday}
          </p>
          <p style={{ fontSize: 11, color: 'var(--tg-theme-hint-color)', marginTop: 2 }}>
            з {dailyGoal} цілі
          </p>
        </div>
      </div>

      {/* Level progress */}
      <div
        style={{
          background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--tg-theme-hint-color)', marginBottom: 2 }}>
              Рівень
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--tg-theme-text-color)' }}>
              {getLevelName(xp)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, color: 'var(--tg-theme-hint-color)', marginBottom: 2 }}>
              До наступного
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--tg-theme-text-color)' }}>
              {getXpToNext(xp)} XP
            </p>
          </div>
        </div>
        <ProgressBar
          value={xp % 100}
          max={100}
          height={6}
          color="var(--tg-theme-button-color, #6366f1)"
        />
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={() => {
          haptic.impact('light')
          setPage('home')
        }}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          background: 'var(--tg-theme-button-color, #3b82f6)',
          color: 'var(--tg-theme-button-text-color, #fff)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        На головну
      </button>
    </div>
  )
}

function getLevelName(xp) {
  if (xp >= 1000) return 'Майстер 🏆'
  if (xp >= 500) return 'Просунутий ⭐'
  if (xp >= 200) return 'Учень 📚'
  if (xp >= 50) return 'Початківець 🌱'
  return 'Новачок 🐣'
}

function getXpToNext(xp) {
  const thresholds = [50, 200, 500, 1000]
  for (const t of thresholds) {
    if (xp < t) return t - xp
  }
  return 0
}
