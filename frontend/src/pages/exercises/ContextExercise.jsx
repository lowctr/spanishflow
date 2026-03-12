import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { useTelegram } from '../../hooks/useTelegram'

function SkeletonLoader() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', gap: 16 }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ background: 'var(--tg-theme-secondary-bg-color, #f0f0f0)', borderRadius: 12, height: 80, animation: 'pulse 2s infinite' }} />
      ))}
    </div>
  )
}

export default function ContextExercise({ word, onNext }) {
  const { haptic } = useTelegram()
  const [examples, setExamples] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchExamples = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await api.getExamples(word.word_es)
        setExamples(response.data || [])
      } catch (e) {
        console.error('Failed to fetch examples:', e)
        setError(true)
        setExamples([])
      } finally {
        setLoading(false)
      }
    }

    fetchExamples()
  }, [word.word_es])

  const handleNext = () => {
    haptic.impact('light')
    onNext(true)
  }

  if (loading) {
    return <SkeletonLoader />
  }

  return (
    <div
      className="animate-slide-right"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 20px',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--tg-theme-hint-color)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Використання в контексті
        </p>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--tg-theme-text-color)',
          }}
        >
          {word.word_en}
        </div>
      </div>

      {/* Examples or error message */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
        {error || examples.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📚</div>
            <p
              style={{
                fontSize: 15,
                color: 'var(--tg-theme-hint-color)',
                marginBottom: 8,
              }}
            >
              Немає прикладів
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--tg-theme-hint-color)',
                opacity: 0.7,
              }}
            >
              {word.word_es} - {word.word_en}
            </p>
          </div>
        ) : (
          examples.map((example, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                borderRadius: 12,
                padding: '16px',
                borderLeft: '4px solid var(--accent, #ff6b35)',
              }}
            >
              {/* Spanish sentence */}
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--tg-theme-text-color)',
                  marginBottom: 10,
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}
              >
                {example.text_es}
              </p>

              {/* English translation */}
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--tg-theme-hint-color)',
                  margin: 0,
                  lineHeight: 1.4,
                  fontStyle: 'italic',
                }}
              >
                {example.text_en}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
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
        }}
      >
        Зрозуміло! →
      </button>
    </div>
  )
}
