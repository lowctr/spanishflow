import { create } from 'zustand'

const useStore = create((set, get) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (partial) => set((state) => ({ user: { ...state.user, ...partial } })),

  // Daily session
  dailySession: null,
  setDailySession: (session) => set({ dailySession: session }),

  // Learn flow state
  currentWordIndex: 0,
  setCurrentWordIndex: (idx) => set({ currentWordIndex: idx }),

  currentStage: 0,
  setCurrentStage: (stage) => set({ currentStage: stage }),

  sessionQueue: [], // ordered list of word objects to review
  setSessionQueue: (queue) => set({ sessionQueue: queue }),

  completedWords: 0,
  setCompletedWords: (n) => set({ completedWords: n }),
  incrementCompleted: () => set((state) => ({ completedWords: state.completedWords + 1 })),

  // Arena state
  arenaWords: [],
  setArenaWords: (words) => set({ arenaWords: words }),

  arenaScore: 0,
  setArenaScore: (score) => set({ arenaScore: score }),
  incrementArenaScore: (delta) => set((state) => ({ arenaScore: state.arenaScore + delta })),

  arenaLives: 3,
  setArenaLives: (lives) => set({ arenaLives: lives }),
  loseArenaLife: () => set((state) => ({ arenaLives: Math.max(0, state.arenaLives - 1) })),

  arenaCombo: 0,
  setArenaCombo: (combo) => set({ arenaCombo: combo }),
  incrementArenaCombo: () => set((state) => ({ arenaCombo: state.arenaCombo + 1 })),
  resetArenaCombo: () => set({ arenaCombo: 0 }),

  arenaMissed: [],
  setArenaMissed: (missed) => set({ arenaMissed: missed }),
  addArenaMissed: (word) =>
    set((state) => ({
      arenaMissed: state.arenaMissed.some((w) => w.id === word.id)
        ? state.arenaMissed
        : [...state.arenaMissed, word],
    })),

  resetArena: () =>
    set({
      arenaScore: 0,
      arenaLives: 3,
      arenaCombo: 0,
      arenaMissed: [],
    }),

  // Navigation
  currentPage: 'onboarding',
  setPage: (page) => set({ currentPage: page }),

  // Onboarding done flag
  isOnboarded: false,
  setOnboarded: (v) => set({ isOnboarded: v }),
}))

export default useStore
