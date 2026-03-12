import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { api } from '../api/client'
import useStore from '../store/useStore'
import { useTelegram } from '../hooks/useTelegram'
import Hearts from '../components/Hearts'

const ARENA_DURATION = 60

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getComboMultiplier(combo) {
  if (combo >= 10) return 4
  if (combo >= 6) return 3
  if (combo >= 3) return 2
  return 1
}

function ComboFlames({ combo }) {
  const mult = getComboMultiplier(combo)
  if (combo === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: mult }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 18,
            animation: 'pulse 0.6s ease infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        >
          🔥
        </span>
      ))}
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#f97316',
          marginLeft: 2,
          letterSpacing: '-0.01em',
        }}
      >
        ×{mult}
      </span>
    </div>
  )
}

function FlashOverlay({ type }) {
  if (!type) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background:
          type === 'correct'
            ? 'rgba(74,222,128,0.18)'
            : 'rgba(248,113,113,0.18)',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    />
  )
}

function GenderCheck({ word, onAnswer }) {
  const { haptic } = useTelegram()

  const isM = word.gender?.toLowerCase().startsWith('masculine') || word.gender === 'm'
  const isF = word.gender?.toLowerCase().startsWith('feminine') || word.gender === 'f'
  const correctAnswer = isM ? 'masculine' : isF ? 'feminine' : 'masculine'

  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)

  const handlePick = (answer) => {
    if (answered) return
    setAnswered(true)
    setSelected(answer)
    const isCorrect = answer === correctAnswer
    if (isCorrect) haptic.notification('success')
    else haptic.notification('error')
    setTimeout(() => onAnswer(isCorrect), 700)
  }

  const btnStyle = (gender) => {
    const isSelected = selected === gender
    const isCorrect = gender === correctAnswer
    let bg, color, border

    if (!answered) {
      if (gender === 'masculine') {
        bg = 'rgba(96,165,250,0.15)'
        color = '#2563eb'
        border = '2px solid rgba(96,165,250,0.4)'
      } else {
        bg = 'rgba(244,114,182,0.15)'
        color = '#db2777'
        border = '2px solid rgba(244,114,182,0.4)'
      }
    } else if (isCorrect) {
      bg = 'var(--color-correct-bg)'
      color = '#166534'
      border = '2px solid var(--color-correct)'
    } else if (isSelected) {
      bg = 'var(--color-wrong-bg)'
      color = '#991b1b'
      border = '2px solid var(--color-wrong)'
    } else {
      bg = 'rgba(150,150,150,0.08)'
      color = 'var(--tg-theme-hint-color)'
      border = '2px solid transparent'
    }

    return {
      flex: 1,
      padding: '20px 12px',
      borderRadius: 16,
      fontSize: 17,
      fontWeight: 700,
      cursor: answered ? 'default' : 'pointer',
      transition: 'all 0.2s ease',
      border,
      background: bg,
      color,
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 10,
          }}
        >
          Який рід?
        </p>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
          }}
        >
          {word.word_es}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => handlePick('masculine')} style={btnStyle('masculine')}>
          ♂ Чоловічий
        </button>
        <button onClick={() => handlePick('feminine')} style={btnStyle('feminine')}>
          ♀ Жіночий
        </button>
      </div>
    </div>
  )
}

function MCArena({ word, mode = 'es-to-en', onAnswer }) {
  const { haptic } = useTelegram()
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const options = useMemo(() => {
    const correct = mode === 'es-to-en' ? word.word_en : word.word_es
    const distractors = (word.distractors || []).slice(0, 3)
    return shuffle([correct, ...distractors])
  }, [word, mode])

  const correctAnswer = mode === 'es-to-en' ? word.word_en : word.word_es
  const prompt = mode === 'es-to-en' ? word.word_es : word.word_en
  const label = mode === 'es-to-en' ? 'Що означає?' : 'Як іспанською?'

  const handleSelect = (option) => {
    if (answered) return
    setSelected(option)
    setAnswered(true)
    const isCorrect = option === correctAnswer
    if (isCorrect) haptic.notification('success')
    else haptic.notification('error')
    setTimeout(() => onAnswer(isCorrect), 700)
  }

  const getOptionStyle = (option) => {
    if (!answered) {
      return {
        background: 'rgba(255,255,255,0.1)',
        border: '2px solid rgba(255,255,255,0.2)',
        color: '#fff',
      }
    }
    if (option === correctAnswer) {
      return {
        background: 'rgba(74,222,128,0.2)',
        border: '2px solid #4ade80',
        color: '#fff',
      }
    }
    if (option === selected) {
      return {
        background: 'rgba(248,113,113,0.2)',
        border: '2px solid #f87171',
        color: '#fff',
      }
    }
    return {
      background: 'rgba(255,255,255,0.05)',
      border: '2px solid transparent',
      color: 'rgba(255,255,255,0.4)',
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 10,
          }}
        >
          {label}
        </p>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {prompt}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            disabled={answered}
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              textAlign: 'left',
              cursor: answered ? 'default' : 'pointer',
              transition: 'all 0.15s ease',
              ...getOptionStyle(opt),
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function ListeningArena({ word, onAnswer }) {
  const { haptic } = useTelegram()
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const options = useMemo(() => {
    return shuffle([word.word_en, ...(word.distractors || []).slice(0, 3)])
  }, [word])

  useEffect(() => {
    const t = setTimeout(() => {
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(word.word_es)
      u.lang = 'es-ES'
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }, 200)
    return () => {
      clearTimeout(t)
      window.speechSynthesis?.cancel()
    }
  }, [word.word_es])

  const handleRepeat = () => {
    haptic.impact('light')
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word.word_es)
    u.lang = 'es-ES'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  const handleSelect = (option) => {
    if (answered) return
    setSelected(option)
    setAnswered(true)
    const isCorrect = option === word.word_en
    if (isCorrect) haptic.notification('success')
    else haptic.notification('error')
    setTimeout(() => onAnswer(isCorrect), 700)
  }

  const getOptionStyle = (option) => {
    if (!answered) {
      return {
        background: 'rgba(255,255,255,0.1)',
        border: '2px solid rgba(255,255,255,0.2)',
        color: '#fff',
      }
    }
    if (option === word.word_en) {
      return {
        background: 'rgba(74,222,128,0.2)',
        border: '2px solid #4ade80',
        color: '#fff',
      }
    }
    if (option === selected) {
      return {
        background: 'rgba(248,113,113,0.2)',
        border: '2px solid #f87171',
        color: '#fff',
      }
    }
    return {
      background: 'rgba(255,255,255,0.05)',
      border: '2px solid transparent',
      color: 'rgba(255,255,255,0.4)',
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 16,
          }}
        >
          Що ви чуєте?
        </p>
        <button
          onClick={handleRepeat}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            fontSize: 28,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            color: '#fff',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
          onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          🔊
        </button>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Повторити</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            disabled={answered}
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              textAlign: 'left',
              cursor: answered ? 'default' : 'pointer',
              transition: 'all 0.15s ease',
              ...getOptionStyle(opt),
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function ArenaResults({ score, missed, combo, onPlayAgain, onHome }) {
  const totalCorrect = Math.round(score / 10)
  const streakBonus = totalCorrect >= 20

  return (
    <div
      className="animate-fade"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 24px',
        paddingTop: 'env(safe-area-inset-top, 24px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
        background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        minHeight: '100%',
        overflow: 'auto',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>
          {score >= 200 ? '🏆' : score >= 100 ? '🥈' : '🥉'}
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
            marginBottom: 6,
          }}
        >
          {score >= 200 ? 'Неймовірно!' : score >= 100 ? 'Відмінно!' : 'Непогано!'}
        </h2>

        {/* Score */}
        <div
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '24px 36px',
            textAlign: 'center',
            marginTop: 20,
            marginBottom: 16,
            width: '100%',
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            Загальний рахунок
          </p>
          <p
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.04em',
            }}
          >
            {score}
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            {totalCorrect} правильних відповідей
          </p>
        </div>

        {streakBonus && (
          <div
            style={{
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 12,
              padding: '10px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
            }}
          >
            <span style={{ fontSize: 20 }}>⭐</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                Стрік-бонус!
              </p>
              <p style={{ fontSize: 12, color: 'rgba(251,191,36,0.7)' }}>
                20+ правильних підряд
              </p>
            </div>
          </div>
        )}

        {/* Missed words */}
        {missed.length > 0 && (
          <div
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Помилки ({missed.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {missed.slice(0, 5).map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{w.word_es}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{w.word_en}</span>
                </div>
              ))}
              {missed.length > 5 && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 4 }}>
                  +{missed.length - 5} ще
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <button
          onClick={onPlayAgain}
          style={{
            width: '100%',
            padding: '17px',
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ⚔️ Грати ще
        </button>
        <button
          onClick={onHome}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
          }}
        >
          На головну
        </button>
      </div>
    </div>
  )
}

const EXERCISE_TYPES = ['mc', 'gender', 'listening']

export default function Arena() {
  const { setPage, arenaWords, setArenaWords, resetArena } = useStore()
  const { haptic } = useTelegram()

  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState([])
  const [gameState, setGameState] = useState('playing') // playing | gameover | results
  const [timeLeft, setTimeLeft] = useState(ARENA_DURATION)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [missed, setMissed] = useState([])
  const [wordIndex, setWordIndex] = useState(0)
  const [exerciseType, setExerciseType] = useState('mc')
  const [flash, setFlash] = useState(null)
  const [key, setKey] = useState(0)
  const timerRef = useRef(null)

  // Load words
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getArenaWords()
        const loaded = res.data
        setWords(shuffle(loaded))
        resetArena()
        setLoading(false)
      } catch (e) {
        console.error('Arena load error', e)
        setLoading(false)
      }
    }
    load()
  }, [])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || loading) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setGameState('results')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [gameState, loading])

  const pickExercise = (word) => {
    // If word has no gender info, skip gender check
    const hasGender = word.gender && word.gender !== 'masculine/feminine'
    const types = hasGender
      ? EXERCISE_TYPES
      : EXERCISE_TYPES.filter((t) => t !== 'gender')
    return types[Math.floor(Math.random() * types.length)]
  }

  const nextQuestion = useCallback(() => {
    if (words.length === 0) return
    const nextIdx = (wordIndex + 1) % words.length
    setWordIndex(nextIdx)
    const nextWord = words[nextIdx]
    setExerciseType(pickExercise(nextWord))
    setKey((k) => k + 1)
  }, [wordIndex, words])

  const handleAnswer = useCallback(
    (isCorrect) => {
      if (gameState !== 'playing') return

      if (isCorrect) {
        const newCombo = combo + 1
        const mult = getComboMultiplier(newCombo)
        const points = 10 * mult
        setCombo(newCombo)
        setScore((s) => s + points)
        setFlash('correct')
        haptic.impact('medium')
        setTimeout(() => setFlash(null), 250)
        nextQuestion()
      } else {
        setCombo(0)
        const currentWord = words[wordIndex]
        if (currentWord) {
          setMissed((prev) =>
            prev.some((w) => w.id === currentWord.id) ? prev : [...prev, currentWord]
          )
        }
        const newLives = lives - 1
        setLives(newLives)
        setFlash('wrong')
        haptic.notification('error')
        setTimeout(() => setFlash(null), 250)

        if (newLives <= 0) {
          clearInterval(timerRef.current)
          setGameState('gameover')
          setTimeout(() => setGameState('results'), 600)
        } else {
          nextQuestion()
        }
      }
    },
    [gameState, combo, lives, words, wordIndex, haptic, nextQuestion]
  )

  const handlePlayAgain = async () => {
    setLoading(true)
    setGameState('playing')
    setTimeLeft(ARENA_DURATION)
    setLives(3)
    setScore(0)
    setCombo(0)
    setMissed([])
    setWordIndex(0)
    setKey(0)

    try {
      const res = await api.getArenaWords()
      setWords(shuffle(res.data))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        }}
      >
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚔️</div>
          <p style={{ fontSize: 16 }}>Завантаження арени...</p>
        </div>
      </div>
    )
  }

  if (gameState === 'results') {
    return (
      <ArenaResults
        score={score}
        missed={missed}
        combo={combo}
        onPlayAgain={handlePlayAgain}
        onHome={() => setPage('home')}
      />
    )
  }

  const currentWord = words[wordIndex]
  if (!currentWord) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white' }}>Немає слів для арени</p>
      </div>
    )
  }

  const timerDanger = timeLeft <= 15
  const timerColor = timerDanger ? '#f87171' : '#fff'

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        paddingTop: 'env(safe-area-inset-top, 12px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
        overflow: 'hidden',
      }}
    >
      <FlashOverlay type={flash} />

      {/* HUD */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 0',
        }}
      >
        {/* Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '8px 14px',
            animation: timerDanger ? 'timerPulse 1s ease infinite' : 'none',
          }}
        >
          <span style={{ fontSize: 16, color: timerColor }}>⏱</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: timerColor,
              letterSpacing: '-0.03em',
              minWidth: 28,
              textAlign: 'center',
              transition: 'color 0.3s ease',
            }}
          >
            {timeLeft}
          </span>
        </div>

        {/* Score + Combo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.03em',
            }}
          >
            {score}
          </div>
          <ComboFlames combo={combo} />
        </div>

        {/* Hearts */}
        <Hearts count={lives} max={3} />
      </div>

      {/* Exercise area */}
      <div
        key={key}
        className="animate-fade"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 20px',
          gap: 0,
        }}
      >
        {exerciseType === 'mc' && (
          <MCArena key={`mc-${key}`} word={currentWord} mode="es-to-en" onAnswer={handleAnswer} />
        )}
        {exerciseType === 'gender' && (
          <GenderCheck key={`gc-${key}`} word={currentWord} onAnswer={handleAnswer} />
        )}
        {exerciseType === 'listening' && (
          <ListeningArena key={`la-${key}`} word={currentWord} onAnswer={handleAnswer} />
        )}
      </div>

      {/* Bottom: exit button */}
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={() => setPage('home')}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer',
          }}
        >
          Вийти з арени
        </button>
      </div>
    </div>
  )
}
