import React, { useEffect, useRef } from 'react'

export default function Hearts({ count, max = 3 }) {
  const prevCount = useRef(count)
  const heartRefs = useRef([])

  useEffect(() => {
    if (count < prevCount.current) {
      // Animate the heart that was just lost
      const lostIdx = count // the one at index `count` just became empty
      const el = heartRefs.current[lostIdx]
      if (el) {
        el.classList.remove('animate-heartbeat')
        void el.offsetWidth
        el.classList.add('animate-heartbeat')
        setTimeout(() => el?.classList.remove('animate-heartbeat'), 400)
      }
    }
    prevCount.current = count
  }, [count])

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          ref={(el) => (heartRefs.current[i] = el)}
          style={{
            fontSize: 22,
            lineHeight: 1,
            filter: i < count ? 'none' : 'grayscale(1) opacity(0.3)',
            transition: 'filter 0.3s ease',
            display: 'inline-block',
          }}
        >
          ❤️
        </span>
      ))}
    </div>
  )
}
