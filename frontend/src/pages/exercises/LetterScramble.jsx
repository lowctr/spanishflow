import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useTelegram } from '../../hooks/useTelegram'

function shuffleLetters(word) {
  const letters = word.split('')
  // Ensure shuffle is different from original (retry up to 10 times)
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
    if (letters.join('') !== word || word.length === 1) break
  }
  return letters.map((char, idx) => ({ char, id: idx }))
}

export default function LetterScramble({ word, onNext }) {
  const { haptic } = useTelegram()
  const target = word.word_es
  const answerAreaRef = useRef(null)

  const initialTiles = useMemo(() => shuffleLetters(target), [target])
  const [sourceTiles, setSourceTiles] = useState(initialTiles)
  const [answerTiles, setAnswerTiles] = useState([])
  const [status, setStatus] = useState('idle') // idle | correct | wrong
  const [shake, setShake] = useState(false)

  useEffect(() => {
    setSourceTiles(shuffleLetters(target))
    setAnswerTiles([])
    setStatus('idle')
    setShake(false)
  }, [target])

  const handleSourceTap = (tile) => {
    if (status !== 'idle') return
    haptic.impact('light')
    setSourceTiles((prev) => prev.filter((t) => t.id !== tile.id))
    setAnswerTiles((prev) => [...prev, tile])

    // Check if complete
    const newAnswer = [...answerTiles, tile]
    if (newAnswer.length === target.length) {
      checkAnswer(newAnswer)
    }
  }

  const handleAnswerTap = (tile) => {
    if (status !== 'idle') return
    haptic.impact('light')
    setAnswerTiles((prev) => prev.filter((t) => t.id !== tile.id))
    setSourceTiles((prev) => [...prev, tile])
  }

  const checkAnswer = (tiles) => {
    const assembled = tiles.map((t) => t.char).join('')
    if (assembled === target) {
      setStatus('correct')
      haptic.notification('success')
      setTimeout(() => {
        onNext(true)
      }, 700)
    } else {
      setStatus('wrong')
      haptic.notification('error')
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setStatus('idle')
        setAnswerTiles([])
        setSourceTiles(shuffleLetters(target))
      }, 600)
    }
  }

  const tileBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 44,
    padding: '0 8px',
    borderRadius: 10,
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.15s ease',
    letterSpacing: '-0.01em',
    border: '2px solid transparent',
  }

  const sourceTileStyle = {
    ...tileBase,
    background: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
    color: 'var(--tg-theme-text-color)',
  }

  const answerTileStyle = (status) => ({
    ...tileBase,
    background:
      status === 'correct'
        ? 'var(--color-correct-bg)'
        : status === 'wrong'
        ? 'var(--color-wrong-bg)'
        : 'var(--tg-theme-button-color, #3b82f6)',
    color: status === 'correct' ? '#166534' : status === 'wrong' ? '#991b1b' : '#fff',
    border:
      status === 'correct'
        ? '2px solid var(--color-correct)'
        : status === 'wrong'
        ? '2px solid var(--color-wrong)'
        : '2px solid transparent',
  })

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
      {/* Hint */}
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
          Складіть слово
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

      {/* Answer area */}
      <div
        ref={answerAreaRef}
        className={shake ? 'animate-shake' : ''}
        style={{
          minHeight: 60,
          border: `2px dashed ${
            status === 'correct'
              ? 'var(--color-correct)'
              : status === 'wrong'
              ? 'var(--color-wrong)'
              : 'var(--tg-theme-hint-color, #ccc)'
          }`,
          borderRadius: 14,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 12px',
          marginBottom: 24,
          minWidth: '100%',
          background:
            status === 'correct'
              ? 'var(--color-correct-bg)'
              : status === 'wrong'
              ? 'var(--color-wrong-bg)'
              : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        {answerTiles.length === 0 ? (
          <span style={{ color: 'var(--tg-theme-hint-color)', fontSize: 14 }}>
            Тисніть на літери нижче
          </span>
        ) : (
          answerTiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleAnswerTap(tile)}
              style={answerTileStyle(status)}
            >
              {tile.char}
            </button>
          ))
        )}
      </div>

      {/* Source tiles */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          padding: '0 4px',
        }}
      >
        {sourceTiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => handleSourceTap(tile)}
            style={sourceTileStyle}
          >
            {tile.char}
          </button>
        ))}
      </div>

      {status === 'correct' && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            color: 'var(--color-correct)',
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          Правильно! ✓
        </div>
      )}

      {status === 'wrong' && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            color: 'var(--color-wrong)',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Спробуйте ще раз
        </div>
      )}
    </div>
  )
}
