import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import useStore from '../store/useStore'
import { useTelegram } from '../hooks/useTelegram'
import StreakBadge from '../components/StreakBadge'
import ProgressBar from '../components/ProgressBar'

const EXTRA_BATCH = 10

export default function Home() {
  const { user, setUser, setPage, setDailySession, setSessionQueue, setCompletedWords } = useStore()
  const { haptic } = useTelegram()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await api.getStats()
      setStats(res.data)
      if (user) setUser({ ...user, streak: res.data.streak, xp: res.data.xp })
    } catch (e) {
      console.error('Failed to load stats', e)
    } finally {
      setLoading(false)
    }
  }

  const startSession = async (extra = 0) => {
    haptic.impact('medium')
    try {
      const res = await api.getDailySession(extra)
      const session = res.data
      setDailySession(session)
      const queue = [...session.new_words, ...session.review_words]
      setSessionQueue(queue)
      setCompletedWords(session.completed_today)
      setPage('learn')
    } catch (e) {
      console.error('Failed to load session', e)
    }
  }

  const handleReview = async () => {
    haptic.impact('medium')
    try {
      const res = await api.getReviewSession()
      const words = res.data
      if (!words.length) {
        // Nothing due — go to Arena instead
        setPage('arena')
        return
      }
      setSessionQueue(words)
      setCompletedWords(stats?.completed_today || 0)
      setPage('learn')
    } catch (e) {
      console.error('Failed to load review session', e)
    }
  }

  const handleGoalSave = async () => {
    const val = parseInt(goalInput, 10)
    if (!val || val < 1 || val > 100) return
    haptic.impact('light')
    try {
      const res = await api.updateSettings(val)
      setUser({ ...user, daily_goal: res.data.daily_goal })
      setStats((s) => s ? { ...s, daily_goal: res.data.daily_goal } : s)
    } catch (e) {
      console.error('Failed to update goal', e)
    }
    setShowGoalModal(false)
    setGoalInput('')
  }

  const canArena = (stats?.total_learned || 0) >= 5 || (stats?.words_in_progress || 0) >= 5
  const completed = stats?.completed_today || 0
  const goal = stats?.daily_goal || user?.daily_goal || 10
  const isGoalMet = completed >= goal

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 20px',
        paddingTop: 'env(safe-area-inset-top, 20px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
        overflow: 'auto',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 28 }}>
        <StreakBadge streak={stats?.streak || user?.streak || 0} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
            padding: '6px 12px',
            borderRadius: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>⚡</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tg-theme-text-color)' }}>
            {stats?.xp || user?.xp || 0} XP
          </span>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--tg-theme-text-color)', marginBottom: 4 }}>
          Привіт, {user?.first_name || 'друже'} 👋
        </h1>
        <p style={{ fontSize: 15, color: 'var(--tg-theme-hint-color)' }}>
          {isGoalMet ? 'Денна ціль виконана! Молодець!' : `Залишилось ${Math.max(0, goal - completed)} слів до цілі`}
        </p>
      </div>

      {/* Daily progress card */}
      <div style={{ background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)', borderRadius: 18, padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--tg-theme-hint-color)', marginBottom: 2 }}>Сьогодні вивчено</p>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--tg-theme-text-color)' }}>
              {completed}{' '}
              <span style={{ fontSize: 18, fontWeight: 500, color: 'var(--tg-theme-hint-color)' }}>/ {goal}</span>
            </p>
          </div>
          {/* Edit daily goal button */}
          <button
            onClick={() => { setGoalInput(String(goal)); setShowGoalModal(true) }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              padding: 4,
              opacity: 0.5,
            }}
            title="Змінити ціль"
          >
            ✏️
          </button>
        </div>
        <ProgressBar value={completed} max={goal} height={8} color={isGoalMet ? '#4ade80' : undefined} />
      </div>

      {/* Stats cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <div style={{ background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginBottom: 4 }}>Вивчено слів</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--tg-theme-text-color)' }}>{stats.total_learned}</p>
            <p style={{ fontSize: 11, color: 'var(--tg-theme-hint-color)' }}>з {stats.total_words}</p>
          </div>
          <div style={{ background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginBottom: 4 }}>В процесі</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--tg-theme-text-color)' }}>{stats.words_in_progress}</p>
            <p style={{ fontSize: 11, color: 'var(--tg-theme-hint-color)' }}>слів</p>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Main learn / review button */}
        <button
          onClick={isGoalMet ? handleReview : () => startSession(0)}
          style={{
            width: '100%',
            padding: '17px',
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 700,
            background: 'var(--tg-theme-button-color, #3b82f6)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease',
            letterSpacing: '-0.01em',
          }}
          onTouchStart={(e) => (e.currentTarget.style.opacity = '0.85')}
          onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {isGoalMet ? '🔄 Повторити вивчені' : '▶ Продовжити'}
        </button>

        {/* Extra words button — always available */}
        <button
          onClick={() => startSession(EXTRA_BATCH)}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--tg-theme-button-color, #3b82f6)',
            border: '1.5px solid var(--tg-theme-button-color, #3b82f6)',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease',
          }}
          onTouchStart={(e) => (e.currentTarget.style.opacity = '0.7')}
          onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
        >
          ➕ Ще {EXTRA_BATCH} нових слів
        </button>

        <button
          onClick={canArena ? () => setPage('arena') : undefined}
          style={{
            width: '100%',
            padding: '17px',
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 700,
            background: canArena
              ? 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)'
              : 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
            color: canArena ? '#fff' : 'var(--tg-theme-hint-color)',
            border: 'none',
            cursor: canArena ? 'pointer' : 'not-allowed',
            opacity: canArena ? 1 : 0.6,
          }}
          onTouchStart={(e) => canArena && (e.currentTarget.style.opacity = '0.85')}
          onTouchEnd={(e) => canArena && (e.currentTarget.style.opacity = '1')}
        >
          ⚔️ Арена{!canArena && ' (потрібно 5 слів)'}
        </button>

        <button
          onClick={() => setPage('stats')}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--tg-theme-hint-color)',
            border: '1.5px solid var(--tg-theme-secondary-bg-color, #e5e5e5)',
            cursor: 'pointer',
          }}
        >
          📊 Статистика
        </button>
      </div>

      {/* Daily goal modal */}
      {showGoalModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
          onClick={() => setShowGoalModal(false)}
        >
          <div
            style={{
              background: 'var(--tg-theme-bg-color, #fff)',
              borderRadius: 20,
              padding: '28px 24px',
              width: '100%',
              maxWidth: 360,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tg-theme-text-color)', marginBottom: 8 }}>
              Денна ціль
            </h3>
            <p style={{ fontSize: 14, color: 'var(--tg-theme-hint-color)', marginBottom: 20 }}>
              Скільки нових слів вивчати щодня?
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[5, 10, 20, 30].map((v) => (
                <button
                  key={v}
                  onClick={() => setGoalInput(String(v))}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    border: '2px solid',
                    borderColor: goalInput === String(v) ? 'var(--tg-theme-button-color, #3b82f6)' : 'var(--tg-theme-secondary-bg-color, #e5e5e5)',
                    background: goalInput === String(v) ? 'var(--tg-theme-button-color, #3b82f6)' : 'transparent',
                    color: goalInput === String(v) ? 'var(--tg-theme-button-text-color, #fff)' : 'var(--tg-theme-text-color)',
                    cursor: 'pointer',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Або введи своє число"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--tg-theme-secondary-bg-color, #e5e5e5)',
                fontSize: 16,
                color: 'var(--tg-theme-text-color)',
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />
            <button
              onClick={handleGoalSave}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                background: 'var(--tg-theme-button-color, #3b82f6)',
                color: 'var(--tg-theme-button-text-color, #fff)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Зберегти
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
