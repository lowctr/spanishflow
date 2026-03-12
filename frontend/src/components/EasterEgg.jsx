import React, { useEffect, useRef, useState } from 'react'

// Easter egg registry — add more here in the future
const EASTER_EGGS = [
  { id: 'siu', image: '/siu.png', audio: '/siu.mp3' },
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function EasterEgg({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out' | 'done'
  const [egg] = useState(() => pickRandom(EASTER_EGGS))
  const [position] = useState(() => ({
    top: 15 + Math.random() * 55, // 15–70% from top
    left: 10 + Math.random() * 65, // 10–75% from left
  }))
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const audio = new Audio(egg.audio)
    audioRef.current = audio

    const onLoaded = () => {
      const duration = audio.duration * 1000 || 1800
      audio.play().catch(() => {})

      // After audio ends → fade out
      timerRef.current = setTimeout(() => {
        setPhase('out')
        setTimeout(() => {
          setPhase('done')
          onDone?.()
        }, 400)
      }, duration)
    }

    audio.addEventListener('loadedmetadata', onLoaded)
    // Fallback if metadata loads slow
    audio.addEventListener('canplaythrough', onLoaded, { once: true })
    audio.load()

    return () => {
      clearTimeout(timerRef.current)
      audio.pause()
      audio.removeEventListener('loadedmetadata', onLoaded)
    }
  }, [egg, onDone])

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}%`,
        left: `${position.left}%`,
        zIndex: 999,
        pointerEvents: 'none',
        animation: phase === 'in'
          ? 'siu-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards'
          : phase === 'out'
          ? 'siu-fade 0.4s ease forwards'
          : 'none',
      }}
    >
      <img
        src={egg.image}
        alt="easter egg"
        style={{
          width: 72,
          height: 72,
          objectFit: 'cover',
          borderRadius: '50%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          border: '3px solid #fff',
        }}
      />
    </div>
  )
}
