import React, { useEffect, useState } from 'react'
import useStore from './store/useStore'
import { api } from './api/client'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import LearnFlow from './pages/LearnFlow'
import Arena from './pages/Arena'
import Stats from './pages/Stats'

export default function App() {
  const { currentPage, setPage, setUser } = useStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const alreadyOnboarded = localStorage.getItem('sf_onboarded')
    if (!alreadyOnboarded) {
      setInitializing(false)
      return
    }
    // Returning user — silently re-auth and go to home
    const initData = window?.Telegram?.WebApp?.initData || 'dev_mode'
    api.authenticate(initData, null)
      .then((res) => {
        setUser(res.data)
        setPage('home')
      })
      .catch(() => {
        // Auth failed — fall back to onboarding
        localStorage.removeItem('sf_onboarded')
      })
      .finally(() => setInitializing(false))
  }, [])

  if (initializing) {
    return (
      <div style={{
        flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--tg-theme-bg-color, #f4f4f4)',
      }}>
        <div style={{ fontSize: 48 }}>🇪🇸</div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'onboarding': return <Onboarding />
      case 'home':       return <Home />
      case 'learn':      return <LearnFlow />
      case 'arena':      return <Arena />
      case 'stats':      return <Stats />
      default:           return <Onboarding />
    }
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div key={currentPage} className="animate-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderPage()}
      </div>
    </div>
  )
}
