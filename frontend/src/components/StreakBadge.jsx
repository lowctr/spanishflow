import React from 'react'

export default function StreakBadge({ streak, large = false }) {
  const size = large ? { fontSize: 32, padding: '10px 18px', borderRadius: 16 } : { fontSize: 15, padding: '4px 10px', borderRadius: 10 }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: streak > 0
          ? 'linear-gradient(135deg, rgba(251,146,60,0.18) 0%, rgba(239,68,68,0.12) 100%)'
          : 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
        border: streak > 0 ? '1px solid rgba(251,146,60,0.3)' : '1px solid transparent',
        ...size,
        fontWeight: 700,
        color: streak > 0 ? '#f97316' : 'var(--tg-theme-hint-color, #888)',
        letterSpacing: '-0.01em',
      }}
    >
      <span style={{ fontSize: large ? 28 : 16 }}>🔥</span>
      <span>{streak}</span>
    </div>
  )
}
