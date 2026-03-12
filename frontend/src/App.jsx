import React, { useEffect } from 'react'
import useStore from './store/useStore'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import LearnFlow from './pages/LearnFlow'
import Arena from './pages/Arena'
import Stats from './pages/Stats'

export default function App() {
  const { currentPage } = useStore()

  // Page transition wrapper
  const renderPage = () => {
    switch (currentPage) {
      case 'onboarding':
        return <Onboarding />
      case 'home':
        return <Home />
      case 'learn':
        return <LearnFlow />
      case 'arena':
        return <Arena />
      case 'stats':
        return <Stats />
      default:
        return <Onboarding />
    }
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        key={currentPage}
        className="animate-fade"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {renderPage()}
      </div>
    </div>
  )
}
