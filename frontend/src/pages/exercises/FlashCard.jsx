import React, { useEffect, useRef } from 'react'
import { useTelegram } from '../../hooks/useTelegram'

const GENDER_CONFIG = {
  masculine: { label: '♂ Чоловічий', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  feminine: { label: '♀ Жіночий', color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  neutral: { label: '◆ Нейтральний', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

function getGenderConfig(gender) {
  if (!gender) return null
  const g = gender.toLowerCase()
  if (g.startsWith('masculine') || g === 'm') return GENDER_CONFIG.masculine
  if (g.startsWith('feminine') || g === 'f') return GENDER_CONFIG.feminine
  return GENDER_CONFIG.neutral
}

function speakWord(word) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(word)
  utter.lang = 'es-ES'
  utter.rate = 0.85
  window.speechSynthesis.speak(utter)
}

export default function FlashCard({ word, onNext }) {
  const { haptic } = useTelegram()
  const genderConfig = getGenderConfig(word.gender)

  useEffect(() => {
    // Auto-play TTS on mount
    const timer = setTimeout(() => speakWord(word.word_es), 400)
    return () => {
      clearTimeout(timer)
      window.speechSynthesis?.cancel()
    }
  }, [word.word_es])

  const handleSpeak = () => {
    haptic.impact('light')
    speakWord(word.word_es)
  }

  const handleNext = () => {
    haptic.impact('light')
    onNext(true) // FlashCard is always "correct" — just viewing
  }

  return (
    <div
      className="animate-slide-right"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        gap: 0,
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          borderRadius: 24,
          padding: '40px 28px 32px',
          textAlign: 'center',
          marginBottom: 24,
          position: 'relative',
        }}
      >
        {/* Gender badge */}
        {genderConfig && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: genderConfig.bg,
              color: genderConfig.color,
              fontSize: 13,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 8,
              marginBottom: 20,
              letterSpacing: '0.02em',
            }}
          >
            {genderConfig.label}
          </div>
        )}

        {/* Spanish word */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--tg-theme-text-color)',
            marginBottom: 12,
            lineHeight: 1.1,
          }}
        >
          {word.word_es}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 40,
            height: 2,
            background: 'var(--tg-theme-hint-color, #ccc)',
            opacity: 0.3,
            margin: '16px auto',
            borderRadius: 2,
          }}
        />

        {/* English translation */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: 'var(--tg-theme-hint-color)',
            letterSpacing: '-0.01em',
          }}
        >
          {word.word_en}
        </div>

        {/* TTS button */}
        <button
          onClick={handleSpeak}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--tg-theme-bg-color, #fff)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          🔊
        </button>
      </div>

      <p
        style={{
          fontSize: 13,
          color: 'var(--tg-theme-hint-color)',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        Запам'ятайте це слово
      </p>

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
        Далі →
      </button>
    </div>
  )
}
