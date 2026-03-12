import React, { useEffect, useState, useMemo } from 'react'
import { useTelegram } from '../../hooks/useTelegram'

function speakWord(word) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(word)
  utter.lang = 'es-ES'
  utter.rate = 0.85
  window.speechSynthesis.speak(utter)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ListeningTest({ word, onNext }) {
  const { haptic } = useTelegram()
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const options = useMemo(() => {
    const correct = word.word_en
    const distractors = (word.distractors || []).slice(0, 3)
    return shuffle([correct, ...distractors])
  }, [word])

  useEffect(() => {
    const timer = setTimeout(() => speakWord(word.word_es), 300)
    return () => {
      clearTimeout(timer)
      window.speechSynthesis?.cancel()
    }
  }, [word.word_es])

  const handleRepeat = () => {
    haptic.impact('light')
    speakWord(word.word_es)
  }

  const handleSelect = (option) => {
    if (answered) return
    setSelected(option)
    setAnswered(true)

    const isCorrect = option === word.word_en
    if (isCorrect) {
      haptic.notification('success')
    } else {
      haptic.notification('error')
    }

    setTimeout(() => {
      onNext(isCorrect)
      setSelected(null)
      setAnswered(false)
    }, 850)
  }

  const getOptionStyle = (option) => {
    if (!answered) {
      return {
        background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
        border: '2px solid transparent',
        color: 'var(--tg-theme-text-color)',
      }
    }
    if (option === word.word_en) {
      return {
        background: 'var(--color-correct-bg)',
        border: '2px solid var(--color-correct)',
        color: '#166534',
      }
    }
    if (option === selected) {
      return {
        background: 'var(--color-wrong-bg)',
        border: '2px solid var(--color-wrong)',
        color: '#991b1b',
      }
    }
    return {
      background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
      border: '2px solid transparent',
      color: 'var(--tg-theme-hint-color)',
      opacity: 0.5,
    }
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
      }}
    >
      {/* Listening prompt */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--tg-theme-hint-color)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          Що ви чуєте?
        </p>

        {/* Big speaker button */}
        <button
          onClick={handleRepeat}
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'var(--tg-theme-button-color, #3b82f6)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          🔊
        </button>

        <p style={{ fontSize: 13, color: 'var(--tg-theme-hint-color)' }}>
          🔊 Повторити
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((option, idx) => {
          const style = getOptionStyle(option)
          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={answered}
              style={{
                padding: '16px 20px',
                borderRadius: 14,
                fontSize: 17,
                fontWeight: 600,
                textAlign: 'left',
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                ...style,
              }}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
