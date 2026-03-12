import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import useStore from '../store/useStore'
import { useTelegram } from '../hooks/useTelegram'
import StreakBadge from '../components/StreakBadge'
import ProgressBar from '../components/ProgressBar'

const EXTRA_BATCH = 10

export default function Home() {
  const {
    user, setUser, setPage,
    sessionQueue, sessionWordIndex,
    startNewSession, setCompletedWords,
  } = useStore()
  const { haptic } = useTelegram()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  useEffect(() => { loadStats() }, [])

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

  // Is there an in-progress session we can resume?
  const hasActiveSession = sessionQueue.length > 0 && sessionWordIndex < sessionQueue.length

  const handleLearn = async (extra = 0) => {
    haptic.impact('medium')
    // Resume if a session is in progress and no extra words requested
    if (hasActiveSession && extra === 0) {
      setPage('learn')
      return
    }
    try {
      const res = await api.getDailySession(extra)
      const session = res.data
      const queue = [...session.new_words, ...session.review_words]
      if (!queue.length) { setPage('learn'); return }
      startNewSession(queue)
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
      if (!words.length) { setPage('arena'); return }
      startNewSession(words)
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
  const progressPct = Math.min(100, Math.round((completed / goal) * 100))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: 'var(--tg-theme-bg-color, #f4f4f4)' }}>

      {/* ── Hero gradient header ── */}
      <div
        style={{
          background: 'var(--accent-gradient, linear-gradient(135deg,#ff6b35,#e63946))',
          borderRadius: '0 0 28px 28px',
          padding: '0 20px 28px',
          paddingTop: 'calc(env(safe-area-inset-top, 14px) + 14px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -40, right: -30,
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: -10,
          width: 90, height: 90, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{stats?.streak || 0} днів</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{stats?.xp || 0} XP</span>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 2, letterSpacing: '-0.02em' }}>
            Привіт, {user?.first_name || 'друже'} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
            {isGoalMet ? 'Денна ціль виконана! 🎉' : `Залишилось ${Math.max(0, goal - completed)} слів до цілі`}
          </p>
        </div>

        {/* Progress ring + text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Mini circular progress */}
          <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke="#fff"
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPct / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{progressPct}%</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {completed}
              <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.8 }}> / {goal}</span>
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>слів сьогодні</p>
          </div>
          {/* Edit goal */}
          <button
            onClick={() => { setGoalInput(String(goal)); setShowGoalModal(true) }}
            style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none',
              borderRadius: 10, padding: '6px 10px', color: '#fff', fontSize: 18, cursor: 'pointer',
            }}
          >✏️</button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Stats cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Вивчено', value: stats.total_learned, sub: `з ${stats.total_words}`, emoji: '📚' },
              { label: 'В процесі', value: stats.words_in_progress, sub: 'слів', emoji: '🔄' },
              { label: 'Серія', value: stats.streak, sub: 'днів', emoji: '🔥' },
            ].map((c) => (
              <div key={c.label} className="sf-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{c.emoji}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tg-theme-text-color)', lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 10, color: 'var(--tg-theme-hint-color)', marginTop: 2 }}>{c.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Resume banner if session in progress */}
        {hasActiveSession && (
          <div
            className="sf-card"
            style={{ background: 'rgba(255,107,53,0.08)', border: '1.5px solid rgba(255,107,53,0.3)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <span style={{ fontSize: 24 }}>⏸</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--tg-theme-text-color)' }}>Незакінчена сесія</p>
              <p style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>
                Слово {sessionWordIndex + 1} з {sessionQueue.length}
              </p>
            </div>
            <button
              onClick={() => setPage('learn')}
              style={{
                background: 'var(--accent-gradient, linear-gradient(135deg,#ff6b35,#e63946))',
                color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >Продовжити</button>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* ── Action buttons ── */}
        <button
          onClick={isGoalMet ? handleReview : () => handleLearn(0)}
          style={{
            width: '100%', padding: '17px',
            borderRadius: 16, fontSize: 17, fontWeight: 700,
            background: 'var(--accent-gradient, linear-gradient(135deg,#ff6b35,#e63946))',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(230,57,70,0.35)',
            letterSpacing: '-0.01em',
            transition: 'opacity 0.15s ease',
          }}
          onTouchStart={(e) => (e.currentTarget.style.opacity = '0.85')}
          onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {isGoalMet ? '🔄 Повторити вивчені' : hasActiveSession ? '▶ Продовжити вивчення' : '▶ Почати вивчення'}
        </button>

        <button
          onClick={() => handleLearn(EXTRA_BATCH)}
          style={{
            width: '100%', padding: '14px',
            borderRadius: 14, fontSize: 15, fontWeight: 600,
            background: 'transparent',
            color: 'var(--accent, #ff6b35)',
            border: '1.5px solid var(--accent, #ff6b35)',
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          onTouchStart={(e) => (e.currentTarget.style.opacity = '0.7')}
          onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
        >
          ➕ Ще {EXTRA_BATCH} нових слів
        </button>

        <button
          onClick={canArena ? () => setPage('arena') : undefined}
          style={{
            width: '100%', padding: '17px',
            borderRadius: 14, fontSize: 17, fontWeight: 700,
            background: canArena
              ? 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)'
              : 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
            color: canArena ? '#fff' : 'var(--tg-theme-hint-color)',
            border: 'none',
            cursor: canArena ? 'pointer' : 'not-allowed',
            opacity: canArena ? 1 : 0.6,
            boxShadow: canArena ? '0 4px 16px rgba(124,58,237,0.3)' : 'none',
          }}
          onTouchStart={(e) => canArena && (e.currentTarget.style.opacity = '0.85')}
          onTouchEnd={(e) => canArena && (e.currentTarget.style.opacity = '1')}
        >
          ⚔️ Арена{!canArena && ' (потрібно 5 слів)'}
        </button>

        <button
          onClick={() => setPage('stats')}
          style={{
            width: '100%', padding: '13px',
            borderRadius: 14, fontSize: 14, fontWeight: 600,
            background: 'transparent',
            color: 'var(--tg-theme-hint-color)',
            border: '1.5px solid var(--tg-theme-secondary-bg-color, #e5e5e5)',
            cursor: 'pointer',
          }}
        >
          📊 Статистика
        </button>
      </div>

      {/* ── Daily goal modal ── */}
      {showGoalModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}
          onClick={() => setShowGoalModal(false)}
        >
          <div
            style={{ background: 'var(--tg-theme-bg-color, #fff)', borderRadius: 22, padding: '28px 24px', width: '100%', maxWidth: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tg-theme-text-color)', marginBottom: 8 }}>Денна ціль</h3>
            <p style={{ fontSize: 14, color: 'var(--tg-theme-hint-color)', marginBottom: 20 }}>Скільки нових слів вивчати щодня?</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[5, 10, 20, 30].map((v) => (
                <button
                  key={v}
                  onClick={() => setGoalInput(String(v))}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 16, fontWeight: 700,
                    border: '2px solid',
                    borderColor: goalInput === String(v) ? 'var(--accent,#ff6b35)' : 'var(--tg-theme-secondary-bg-color,#e5e5e5)',
                    background: goalInput === String(v) ? 'var(--accent,#ff6b35)' : 'transparent',
                    color: goalInput === String(v) ? '#fff' : 'var(--tg-theme-text-color)',
                    cursor: 'pointer',
                  }}
                >{v}</button>
              ))}
            </div>
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Або введи своє число"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                border: '1.5px solid var(--tg-theme-secondary-bg-color,#e5e5e5)',
                fontSize: 16, color: 'var(--tg-theme-text-color)',
                background: 'var(--tg-theme-secondary-bg-color,#f5f5f5)',
                boxSizing: 'border-box', marginBottom: 16,
              }}
            />
            <button
              onClick={handleGoalSave}
              style={{
                width: '100%', padding: '15px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                background: 'var(--accent-gradient,linear-gradient(135deg,#ff6b35,#e63946))',
                color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >Зберегти</button>
          </div>
        </div>
      )}
    </div>
  )
}
