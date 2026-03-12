import React from 'react'

export default function ProgressBar({ value, max, height = 6, color }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div
      style={{
        width: '100%',
        height,
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
        borderRadius: height,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: color || 'var(--tg-theme-button-color, #3b82f6)',
          borderRadius: height,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  )
}
