import { create } from 'zustand'

export function buildExerciseOrder() {
  const rest = [1, 2, 3]
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return [0, ...rest]
}

const useStore = create((set, get) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (partial) => set((state) => ({ user: { ...state.user, ...partial } })),

  // Daily session meta
  dailySession: null,
  setDailySession: (session) => set({ dailySession: session }),

  // Active session state — persisted in memory so resume works
  sessionQueue: [],
  setSessionQueue: (queue) => set({ sessionQueue: queue }),

  sessionWordIndex: 0,
  setSessionWordIndex: (idx) => set({ sessionWordIndex: idx }),

  sessionStage: 0,
  setSessionStage: (stage) => set({ sessionStage: stage }),

  sessionExerciseOrder: [0, 1, 2, 3],
  setSessionExerciseOrder: (order) => set({ sessionExerciseOrder: order }),

  // Start a brand new session (resets position)
  startNewSession: (queue) => set({
    sessionQueue: queue,
    sessionWordIndex: 0,
    sessionStage: 0,
    sessionExerciseOrder: buildExerciseOrder(),
  }),

  // Clear session when done
  clearSession: () => set({
    sessionQueue: [],
    sessionWordIndex: 0,
    sessionStage: 0,
    sessionExerciseOrder: [0, 1, 2, 3],
  }),

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
  resetArena: () => set({ arenaScore: 0, arenaLives: 3, arenaCombo: 0, arenaMissed: [] }),

  // Navigation
  currentPage: 'onboarding',
  setPage: (page) => set({ currentPage: page }),

  isOnboarded: false,
  setOnboarded: (v) => set({ isOnboarded: v }),
}))

export default useStore
