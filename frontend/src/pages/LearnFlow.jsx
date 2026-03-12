import React, { useState, useEffect, useCallback } from 'react'
import useStore from '../store/useStore'
import { api } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'
import ProgressBar from '../components/ProgressBar'
import FlashCard from './exercises/FlashCard'
import MultipleChoice from './exercises/MultipleChoice'
import LetterScramble from './exercises/LetterScramble'
import ListeningTest from './exercises/ListeningTest'

const STAGE_NAMES = ['Картка', 'Вибір', 'Складання', 'Аудіо']
const EXERCISE_TYPES = ['flashcard', 'multiple_choice', 'scramble', 'listening']

// After flashcard (stage 0), shuffle remaining exercises for variety
function buildExerciseOrder() {
  const rest = [1, 2, 3]
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return [0, ...rest] // flashcard always first
}

function Confetti() {
  const colors = ['#f87171', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6']
  const pieces = Array.from({ length: 48 }, (_, i) => i)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {pieces.map((i) => {
        const color = colors[i % colors.length]
        const left = Math.random() * 100
        const delay = Math.random() * 1.5
        const size = 6 + Math.random() * 8
        const duration = 2.5 + Math.random() * 1.5
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: -20,
              width: size,
              height: size * (Math.random() > 0.5 ? 1 : 2.5),
              background: color,
              borderRadius: Math.random() > 0.5 ? '50%' : 2,
              animation: `confetti-fall ${duration}s ${delay}s ease-in forwards`,
              opacity: 0,
            }}
          />
        )
      })}
    </div>
  )
}

function FlashFeedback({ type }) {
  if (!type) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: type === 'correct' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
        zIndex: 50,
        pointerEvents: 'none',
        animation: 'fadeIn 0.1s ease forwards',
      }}
    />
  )
}

export default function LearnFlow() {
  const {
    sessionQueue,
    setSessionQueue,
    completedWords,
    incrementCompleted,
    setPage,
  } = useStore()
  const { haptic } = useTelegram()

  const [wordIndex, setWordIndex] = useState(0)
  const [stage, setStage] = useState(0)
  const [exerciseOrder, setExerciseOrder] = useState(() => buildExerciseOrder())
  const [flash, setFlash] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [key, setKey] = useState(0)

  const totalWords = sessionQueue.length
  const currentWord = sessionQueue[wordIndex]

  const showFlash = (type) => {
    setFlash(type)
    setTimeout(() => setFlash(null), 300)
  }

  const handleAnswer = useCallback(
    async (isCorrect) => {
      if (!currentWord) return

      const exerciseType = EXERCISE_TYPES[stage] || 'flashcard'

      try {
        await api.submitAnswer(currentWord.id, exerciseType, isCorrect, stage)
      } catch (e) {
        console.error('Failed to submit answer', e)
      }

      if (isCorrect) {
        showFlash('correct')
        haptic.notification('success')

        const nextStage = stage + 1
        if (nextStage >= 4) {
          // Word complete
          incrementCompleted()
          const nextIndex = wordIndex + 1
          if (nextIndex >= totalWords) {
            setShowConfetti(true)
            setSessionDone(true)
          } else {
            setWordIndex(nextIndex)
            setStage(0)
            setExerciseOrder(buildExerciseOrder()) // new random order for next word
            setKey((k) => k + 1)
          }
        } else {
          setStage(nextStage)
          setKey((k) => k + 1)
        }
      } else {
        showFlash('wrong')
        haptic.notification('error')

        // Move current word to end of queue, reset stage and exercise order
        const next = [...sessionQueue]
        const [removed] = next.splice(wordIndex, 1)
        next.push({ ...removed, stage: 0 })
        setSessionQueue(next)
        if (wordIndex >= next.length) {
          setWordIndex(0)
        }
        setStage(0)
        setExerciseOrder(buildExerciseOrder())
        setKey((k) => k + 1)
      }
    },
    [currentWord, stage, wordIndex, sessionQueue, totalWords, haptic, incrementCompleted, setSessionQueue]
  )

  const renderExercise = () => {
    if (!currentWord) return null

    const exerciseIndex = exerciseOrder[stage] ?? stage
    switch (exerciseIndex) {
      case 0:
        return <FlashCard key={`fc-${key}`} word={currentWord} onNext={handleAnswer} />
      case 1:
        return <MultipleChoice key={`mc-${key}`} word={currentWord} onNext={handleAnswer} mode="en-to-es" />
      case 2:
        return <LetterScramble key={`ls-${key}`} word={currentWord} onNext={handleAnswer} />
      case 3:
        return <ListeningTest key={`lt-${key}`} word={currentWord} onNext={handleAnswer} />
      default:
        return null
    }
  }

  if (sessionDone) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        {showConfetti && <Confetti />}
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--tg-theme-text-color)',
            marginBottom: 8,
          }}
        >
          Чудова робота!
        </h2>
        <p style={{ fontSize: 16, color: 'var(--tg-theme-hint-color)', marginBottom: 32 }}>
          Ви завершили сеанс навчання
        </p>
        <div
          style={{
            background: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
            borderRadius: 18,
            padding: '24px 28px',
            marginBottom: 32,
            width: '100%',
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--tg-theme-text-color)', marginBottom: 4 }}>
            {completedWords}
          </div>
          <div style={{ fontSize: 15, color: 'var(--tg-theme-hint-color)' }}>
            слів вивчено сьогодні
          </div>
        </div>
        <button
          onClick={() => setPage('home')}
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
          На головну
        </button>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--tg-theme-hint-color)' }}>Немає слів для навчання</p>
      </div>
    )
  }

  const progressValue = wordIndex + (stage / 4)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 12px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
        overflow: 'hidden',
      }}
    >
      <FlashFeedback type={flash} />

      {/* Header */}
      <div style={{ padding: '12px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => setPage('home')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--tg-theme-hint-color)',
              fontSize: 22,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
          <ProgressBar value={progressValue} max={totalWords} height={6} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--tg-theme-hint-color)',
              flexShrink: 0,
            }}
          >
            {wordIndex + 1}/{totalWords}
          </span>
        </div>

        {/* Stage indicator */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {STAGE_NAMES.map((name, i) => (
            <div
              key={i}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                background:
                  i < stage
                    ? 'var(--color-correct)'
                    : i === stage
                    ? 'var(--tg-theme-button-color, #3b82f6)'
                    : 'var(--tg-theme-secondary-bg-color, #e5e5e5)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Exercise */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderExercise()}
      </div>
    </div>
  )
}
