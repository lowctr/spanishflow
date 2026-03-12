import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import useStore from '../store/useStore'
import { useTelegram } from '../hooks/useTelegram'
import ProgressBar from '../components/ProgressBar'

export default function Stats() {
  const { setPage } = useStore()
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tg-theme-bg-color)' }}>
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
  const levelName = getLevelName(xp)
  const xpToNext = getXpToNext(xp)
  const levelProgress = getLevelProgress(xp)

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'auto', background: 'var(--tg-theme-bg-color, #f4f4f4)',
    }}>

      {/* Header gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        borderRadius: '0 0 28px 28px',
        padding: '0 20px 28px',
        paddingTop: 'calc(env(safe-area-inset-top, 14px) + 14px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => { haptic.impact('light'); setPage('home') }}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10,
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 18, color: '#fff',
            }}
          >←</button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Статистика
          </h1>
        </div>

        {/* Level badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Рівень</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{levelName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>До наступного</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{xpToNext} XP</p>
          </div>
        </div>

        {/* XP progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${levelProgress}%`, height: '100%',
            background: '#fff', borderRadius: 8,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{xp} XP</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>⚡ {xp} всього</span>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Streak + Today */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(239,68,68,0.1) 100%)',
            border: '1.5px solid rgba(251,146,60,0.3)',
            borderRadius: 18, padding: '18px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>🔥</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#f97316', letterSpacing: '-0.04em' }}>{streak}</div>
            <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginTop: 2 }}>днів поспіль</div>
          </div>

          <div style={{
            background: 'var(--tg-theme-secondary-bg-color, rgba(120,120,128,0.12))',
            borderRadius: 18, padding: '18px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>📅</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--tg-theme-text-color)', letterSpacing: '-0.04em' }}>{completedToday}</div>
            <div style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)', marginTop: 2 }}>з {dailyGoal} сьогодні</div>
          </div>
        </div>

        {/* Mastery progress — main visual */}
        <div style={{
          background: 'var(--tg-theme-secondary-bg-color, rgba(120,120,128,0.12))',
          borderRadius: 20, padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--tg-theme-text-color)' }}>Освоєно слів</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--tg-theme-hint-color)' }}>
              {totalLearned} / {totalWords}
            </p>
          </div>

          {/* Large percentage */}
          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <span style={{
              fontSize: 56, fontWeight: 900,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg,#ff6b35,#e63946)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{masteredPercent}%</span>
          </div>

          {/* Segmented progress bar */}
          <div style={{ position: 'relative', height: 12, borderRadius: 8, overflow: 'hidden', background: 'rgba(128,128,128,0.15)' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${Math.min(100, (totalLearned / totalWords) * 100)}%`,
              background: 'linear-gradient(90deg,#ff6b35,#e63946)',
              borderRadius: 8, transition: 'width 0.6s ease',
            }} />
            {/* in-progress overlay */}
            <div style={{
              position: 'absolute', left: `${(totalLearned / totalWords) * 100}%`, top: 0, bottom: 0,
              width: `${Math.min(100 - (totalLearned / totalWords) * 100, (wordsInProgress / totalWords) * 100)}%`,
              background: 'rgba(255,107,53,0.35)',
              transition: 'all 0.6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(135deg,#ff6b35,#e63946)' }} />
              <span style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>Вивчено: {totalLearned}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,107,53,0.35)', border: '1px solid rgba(255,107,53,0.5)' }} />
              <span style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>В процесі: {wordsInProgress}</span>
            </div>
          </div>
        </div>

        {/* Detail grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { emoji: '📚', value: totalLearned, label: 'вивчено' },
            { emoji: '🔄', value: wordsInProgress, label: 'в процесі' },
            { emoji: '⚡', value: xp, label: 'XP' },
          ].map((c) => (
            <div key={c.label} style={{
              background: 'var(--tg-theme-secondary-bg-color, rgba(120,120,128,0.12))',
              borderRadius: 14, padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{c.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tg-theme-text-color)' }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--tg-theme-hint-color)', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 16 }} />

        <button
          onClick={() => { haptic.impact('light'); setPage('home') }}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, fontSize: 16, fontWeight: 700,
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
          }}
        >← На головну</button>
      </div>
    </div>
  )
}

function getLevelName(xp) {
  if (xp >= 1000) return 'Майстер 🏆'
  if (xp >= 500)  return 'Просунутий ⭐'
  if (xp >= 200)  return 'Учень 📚'
  if (xp >= 50)   return 'Початківець 🌱'
  return 'Новачок 🐣'
}

function getXpToNext(xp) {
  for (const t of [50, 200, 500, 1000]) {
    if (xp < t) return t - xp
  }
  return 0
}

function getLevelProgress(xp) {
  const levels = [[0, 50], [50, 200], [200, 500], [500, 1000]]
  for (const [min, max] of levels) {
    if (xp < max) return Math.round(((xp - min) / (max - min)) * 100)
  }
  return 100
}
