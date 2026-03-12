import { useEffect, useState } from 'react'

export function useTelegram() {
  const [tg, setTg] = useState(null)
  const [user, setUser] = useState(null)
  const [initData, setInitData] = useState('dev_mode')

  useEffect(() => {
    const webApp = window?.Telegram?.WebApp
    if (webApp) {
      webApp.ready()
      webApp.expand()
      setTg(webApp)

      if (webApp.initDataUnsafe?.user) {
        setUser(webApp.initDataUnsafe.user)
      }
      if (webApp.initData) {
        setInitData(webApp.initData)
      }
    }
  }, [])

  const haptic = {
    impact: (style = 'light') => {
      try {
        tg?.HapticFeedback?.impactOccurred(style)
      } catch (e) {
        // Haptic not available
      }
    },
    notification: (type = 'success') => {
      try {
        tg?.HapticFeedback?.notificationOccurred(type)
      } catch (e) {
        // Haptic not available
      }
    },
    selection: () => {
      try {
        tg?.HapticFeedback?.selectionChanged()
      } catch (e) {
        // Haptic not available
      }
    },
  }

  const mainButton = {
    show: (text, onClick) => {
      if (!tg?.MainButton) return
      tg.MainButton.setText(text)
      tg.MainButton.onClick(onClick)
      tg.MainButton.show()
    },
    hide: () => {
      if (!tg?.MainButton) return
      tg.MainButton.hide()
    },
    setColor: (color) => {
      if (!tg?.MainButton) return
      tg.MainButton.color = color
    },
  }

  return { tg, user, haptic, mainButton, initData }
}
