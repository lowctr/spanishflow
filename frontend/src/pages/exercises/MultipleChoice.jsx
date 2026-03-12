import React, { useState, useMemo } from 'react'
import { useTelegram } from '../../hooks/useTelegram'

export default function MultipleChoice({ word, onNext, mode = 'en-to-es' }) {
  // mode: 'en-to-es' → show EN, pick ES | 'es-to-en' → show ES, pick EN
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const { haptic } = useTelegram()

  // Build options: 1 correct + 3 distractors
  const options = useMemo(() => {
    if (mode === 'es-to-en') {
      // Show Spanish word, pick English
      const correct = word.word_en
      const distractors = (word.distractors || []).slice(0, 3)
      const all = [correct, ...distractors]
      return shuffle(all)
    } else {
      // Show English word, pick Spanish — use es_distractors (word_es values)
      const correct = word.word_es
      const distractors = (word.es_distractors || []).slice(0, 3)
      const all = [correct, ...distractors]
      return shuffle(all)
    }
  }, [word, mode])

  const correctAnswer = mode === 'es-to-en' ? word.word_en : word.word_es
  const prompt = mode === 'es-to-en' ? word.word_es : word.word_en
  const promptLabel = mode === 'es-to-en'
    ? 'Що означає це слово?'
    : 'Як це перекладається іспанською?'

  const handleSelect = (option) => {
    if (answered) return
    setSelected(option)
    setAnswered(true)

    const isCorrect = option === correctAnswer
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
    if (option === correctAnswer) {
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
      {/* Prompt */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--tg-theme-hint-color)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {promptLabel}
        </p>
        <div
          style={{
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--tg-theme-text-color)',
            lineHeight: 1.15,
          }}
        >
          {prompt}
        </div>
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

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
