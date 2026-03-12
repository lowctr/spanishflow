import React, { useState } from 'react'
import { api } from '../api/client'
import useStore from '../store/useStore'
import { useTelegram } from '../hooks/useTelegram'

const GOAL_OPTIONS = [
  { value: 5, label: '5 слів', sub: 'Легкий старт' },
  { value: 10, label: '10 слів', sub: 'Оптимально', recommended: true },
  { value: 20, label: '20 слів', sub: 'Інтенсивно' },
]

export default function Onboarding() {
  const [selectedGoal, setSelectedGoal] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { setUser, setPage, setOnboarded } = useStore()
  const { haptic, initData } = useTelegram()

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    haptic.impact('medium')

    try {
      const response = await api.authenticate(initData || 'dev_mode', selectedGoal)
      setUser(response.data)
      setOnboarded(true)
      haptic.notification('success')
      setPage('home')
    } catch (err) {
      setError('Не вдалося підключитись. Спробуйте ще раз.')
      haptic.notification('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px',
        paddingTop: 'env(safe-area-inset-top, 24px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginTop: 48, marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🇪🇸</div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--tg-theme-text-color)',
            marginBottom: 10,
          }}
        >
          SpanishFlow
        </h1>
        <p
          style={{
            fontSize: 16,
            color: 'var(--tg-theme-hint-color)',
            lineHeight: 1.5,
            maxWidth: 260,
            margin: '0 auto',
          }}
        >
          Вивчайте іспанські слова щодня — легко та ефективно
        </p>
      </div>

      {/* Daily goal selection */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--tg-theme-hint-color)',
            marginBottom: 14,
          }}
        >
          Скільки слів на день?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSelectedGoal(opt.value)
                haptic.selection()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: 14,
                border: `2px solid ${
                  selectedGoal === opt.value
                    ? 'var(--tg-theme-button-color, #3b82f6)'
                    : 'var(--tg-theme-secondary-bg-color, #f0f0f0)'
                }`,
                background:
                  selectedGoal === opt.value
                    ? 'rgba(59,130,246,0.08)'
                    : 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--tg-theme-text-color)',
                    marginBottom: 2,
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--tg-theme-hint-color)',
                  }}
                >
                  {opt.sub}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {opt.recommended && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(59,130,246,0.15)',
                      color: 'var(--tg-theme-button-color, #3b82f6)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    РЕКОМЕНДОВАНО
                  </span>
                )}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `2px solid ${
                      selectedGoal === opt.value
                        ? 'var(--tg-theme-button-color, #3b82f6)'
                        : 'var(--tg-theme-hint-color, #ccc)'
                    }`,
                    background:
                      selectedGoal === opt.value
                        ? 'var(--tg-theme-button-color, #3b82f6)'
                        : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {selectedGoal === opt.value && (
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path
                        d="M1 4L4.5 7.5L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--color-wrong)', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
          {error}
        </p>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={loading}
        style={{
          width: '100%',
          padding: '17px',
          borderRadius: 14,
          fontSize: 17,
          fontWeight: 700,
          background: loading
            ? 'var(--tg-theme-hint-color, #ccc)'
            : 'var(--tg-theme-button-color, #3b82f6)',
          color: 'var(--tg-theme-button-text-color, #fff)',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? 'Завантаження...' : 'Почати вчитись →'}
      </button>

      <p
        style={{
          fontSize: 12,
          color: 'var(--tg-theme-hint-color)',
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        2000 найпопулярніших іспанських слів
      </p>
    </div>
  )
}
