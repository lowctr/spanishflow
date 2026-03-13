import React, { useState, useEffect, useCallback, useRef } from 'react'
import useStore, { buildExerciseOrder } from '../store/useStore'
import { api } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'
import ProgressBar from '../components/ProgressBar'
import EasterEgg from '../components/EasterEgg'
import FlashCard from './exercises/FlashCard'
import MultipleChoice from './exercises/MultipleChoice'
import LetterScramble from './exercises/LetterScramble'
import ContextExercise from './exercises/ContextExercise'
import ListeningTest from './exercises/ListeningTest'

const EXERCISE_TYPES = ['flashcard', 'multiple_choice', 'context', 'listening']
const STAGE_LABELS = ['Картка', 'Вибір', 'Контекст', 'Аудіо']

function Confetti() {
  const colors = ['#f87171', '#4ade80', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#ff6b35']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 100 }}>
      {Array.from({ length: 52 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: -20,
            width: 7 + Math.random() * 7,
            height: (7 + Math.random() * 7) * (Math.random() > 0.5 ? 1 : 2.2),
            background: colors[i % colors.length],
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            animation: `confetti-fall ${2.5 + Math.random() * 1.5}s ${Math.random() * 1.5}s ease-in forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

function FlashFeedback({ type }) {
  if (!type) return null
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: type === 'correct' ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)',
      zIndex: 50, pointerEvents: 'none',
      animation: 'fadeIn 0.1s ease forwards',
    }} />
  )
}

export default function LearnFlow() {
  const {
    sessionQueue, setSessionQueue,
    sessionWordIndex, setSessionWordIndex,
    sessionStage, setSessionStage,
    sessionExerciseOrder, setSessionExerciseOrder,
    completedWords, incrementCompleted,
    clearSession, setPage,
  } = useStore()
  const { haptic } = useTelegram()

  const [flash, setFlash] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [renderKey, setRenderKey] = useState(0)

  // Easter egg: triggered once per session at a random word index
  const easterEggIndexRef = useRef(
    sessionQueue.length > 0 ? Math.floor(Math.random() * sessionQueue.length) : -1
  )
  const [easterEggVisible, setEasterEggVisible] = useState(false)
  const easterEggFiredRef = useRef(false)

  const wordIndex = sessionWordIndex
  const stage = sessionStage
  const exerciseOrder = sessionExerciseOrder
  const totalWords = sessionQueue.length
  const currentWord = sessionQueue[wordIndex]

  const bump = () => setRenderKey((k) => k + 1)

  const showFlash = (type) => {
    setFlash(type)
    setTimeout(() => setFlash(null), 300)
  }

  const maybeShowEasterEgg = (idx) => {
    if (easterEggFiredRef.current) return
    if (idx === easterEggIndexRef.current) {
      easterEggFiredRef.current = true
      setEasterEggVisible(true)
    }
  }

  const handleAnswer = useCallback(
    async (isCorrect) => {
      if (!currentWord) return
      const exerciseIndex = exerciseOrder[stage] ?? stage
      const exerciseType = EXERCISE_TYPES[exerciseIndex] || 'flashcard'

      try {
        await api.submitAnswer(currentWord.id, exerciseType, isCorrect, stage)
      } catch (e) {
        console.error('Failed to submit answer', e)
      }

      if (isCorrect) {
        showFlash('correct')
        haptic.notification('success')

        // Check if easter egg should fire NOW (before transition)
        const willShowEgg = !easterEggFiredRef.current && wordIndex === easterEggIndexRef.current
        if (willShowEgg) {
          easterEggFiredRef.current = true
          setEasterEggVisible(true)
        }

        // Delay transition so egg renders first on screen
        const doTransition = () => {
          const nextStage = stage + 1
          if (nextStage >= 4) {
            incrementCompleted()
            const nextIndex = wordIndex + 1
            if (nextIndex >= totalWords) {
              clearSession()
              setShowConfetti(true)
              setSessionDone(true)
            } else {
              setSessionWordIndex(nextIndex)
              setSessionStage(0)
              setSessionExerciseOrder(buildExerciseOrder())
              bump()
            }
          } else {
            setSessionStage(nextStage)
            bump()
          }
        }

        if (willShowEgg) {
          setTimeout(doTransition, 350)
        } else {
          doTransition()
        }
      } else {
        showFlash('wrong')
        haptic.notification('error')

        const next = [...sessionQueue]
        const [removed] = next.splice(wordIndex, 1)
        next.push({ ...removed, stage: 0 })
        setSessionQueue(next)
        if (wordIndex >= next.length) setSessionWordIndex(0)
        setSessionStage(0)
        setSessionExerciseOrder(buildExerciseOrder())
        bump()
      }
    },
    [currentWord, stage, wordIndex, exerciseOrder, sessionQueue, totalWords, haptic,
     incrementCompleted, setSessionQueue, setSessionWordIndex, setSessionStage, setSessionExerciseOrder, clearSession]
  )

  const renderExercise = () => {
    if (!currentWord) return null
    const exerciseIndex = exerciseOrder[stage] ?? stage
    const nextWord = wordIndex + 1 < totalWords ? sessionQueue[wordIndex + 1] : null
    const wordLength = currentWord.word_en.length

    switch (exerciseIndex) {
      case 0: return <FlashCard key={`fc-${renderKey}`} word={currentWord} onNext={handleAnswer} />
      case 1: return <MultipleChoice key={`mc-${renderKey}`} word={currentWord} onNext={handleAnswer} mode="en-to-es" />
      case 2: return <ContextExercise key={`ctx-${renderKey}`} word={currentWord} nextWord={nextWord} onNext={handleAnswer} />
      case 3: return wordLength >= 6
        ? <LetterScramble key={`ls-${renderKey}`} word={currentWord} onNext={handleAnswer} />
        : <ListeningTest key={`lt-${renderKey}`} word={currentWord} onNext={handleAnswer} />
      default: return null
    }
  }

  if (sessionDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', background: 'var(--tg-theme-bg-color,#f4f4f4)' }}>
        {showConfetti && <Confetti />}
        <div style={{ fontSize: 80, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--tg-theme-text-color)', marginBottom: 8 }}>
          Чудова робота!
        </h2>
        <p style={{ fontSize: 16, color: 'var(--tg-theme-hint-color)', marginBottom: 32 }}>
          Сеанс навчання завершено
        </p>
        <div className="sf-card" style={{ marginBottom: 32, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--accent,#ff6b35)', marginBottom: 4 }}>
            {completedWords}
          </div>
          <div style={{ fontSize: 15, color: 'var(--tg-theme-hint-color)' }}>слів вивчено сьогодні</div>
        </div>
        <button
          onClick={() => setPage('home')}
          style={{
            width: '100%', padding: '17px', borderRadius: 16, fontSize: 17, fontWeight: 700,
            background: 'var(--accent-gradient,linear-gradient(135deg,#ff6b35,#e63946))',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(230,57,70,0.35)',
          }}
        >На головну</button>
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

  const progressValue = wordIndex + stage / 4

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top,12px)', paddingBottom: 'max(env(safe-area-inset-bottom,16px),16px)', overflow: 'hidden', background: 'var(--tg-theme-bg-color,#f4f4f4)' }}>
      <FlashFeedback type={flash} />
      {easterEggVisible && <EasterEgg onDone={() => setEasterEggVisible(false)} />}

      {/* Header */}
      <div style={{ padding: '12px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button
            onClick={() => setPage('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--tg-theme-hint-color)', fontSize: 20, lineHeight: 1, flexShrink: 0 }}
          >✕</button>
          <ProgressBar value={progressValue} max={totalWords} height={6} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tg-theme-hint-color)', flexShrink: 0 }}>
            {wordIndex + 1}/{totalWords}
          </span>
        </div>

        {/* Stage dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {STAGE_LABELS.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: i < stage
                ? 'var(--color-correct,#34d399)'
                : i === stage
                ? 'var(--accent,#ff6b35)'
                : 'var(--tg-theme-secondary-bg-color,#e5e5e5)',
              transition: 'background 0.3s ease',
            }} />
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
