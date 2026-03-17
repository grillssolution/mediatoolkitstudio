import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Tool, Job, JobProgress, FileMetadata, AppSettings } from '@/types'

// ─── Default Settings ─────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  outputFolder: '',
  theme: 'dark',
  hardwareAcceleration: false,
  concurrentJobs: 1,
  ffmpegBinaryPath: '',
  defaultFormats: {
    video: 'mp4',
    audio: 'mp3',
    subtitles: 'srt',
    images: 'jpg',
    streaming: 'm3u8',
    metadata: 'json',
    advanced: 'mp4',
  },
  onboardingComplete: false,
  checkUpdates: true,
}

// ─── Store State ──────────────────────────────────────────────────────────────

interface AppState {
  // Active tool
  activeTool: Tool | null
  setActiveTool: (tool: Tool | null) => void

  // Active sidebar category
  activeCategory: string | null
  setActiveCategory: (cat: string | null) => void

  // Sidebar collapsed state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void

  // Input file
  inputFile: FileMetadata | null
  setInputFile: (file: FileMetadata | null) => void

  // Tool options (form values for current tool)
  toolOptions: Record<string, unknown>
  setToolOption: (id: string, value: unknown) => void
  resetToolOptions: () => void

  // Current job
  currentJob: Job | null
  setCurrentJob: (job: Job | null) => void
  updateJobProgress: (progress: JobProgress) => void
  updateJobStatus: (status: Job['status'], extra?: Partial<Job>) => void

  // Job history
  jobHistory: Job[]
  addJobToHistory: (job: Job) => void
  clearHistory: () => void
  removeFromHistory: (id: string) => void

  // Settings
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void

  // UI state
  showSettings: boolean
  setShowSettings: (v: boolean) => void
  showOnboarding: boolean
  setShowOnboarding: (v: boolean) => void
  showCommandViewer: boolean
  setShowCommandViewer: (v: boolean) => void

  // Search
  sidebarSearch: string
  setSidebarSearch: (q: string) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Active tool
      activeTool: null,
      setActiveTool: (tool) => {
        set({ activeTool: tool, toolOptions: {}, inputFile: null, currentJob: null })
      },

      // Category
      activeCategory: 'video',
      setActiveCategory: (cat) => set({ activeCategory: cat }),

      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // Input file
      inputFile: null,
      setInputFile: (file) => set({ inputFile: file }),

      // Tool options
      toolOptions: {},
      setToolOption: (id, value) =>
        set((s) => ({ toolOptions: { ...s.toolOptions, [id]: value } })),
      resetToolOptions: () => set({ toolOptions: {} }),

      // Current job
      currentJob: null,
      setCurrentJob: (job) => set({ currentJob: job }),
      updateJobProgress: (progress) => {
        const job = get().currentJob
        if (!job) return
        set({ currentJob: { ...job, progress } })
      },
      updateJobStatus: (status, extra = {}) => {
        const job = get().currentJob
        if (!job) return
        const updated = { ...job, status, ...extra }
        set({ currentJob: updated })
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          get().addJobToHistory(updated)
        }
      },

      // Job history
      jobHistory: [],
      addJobToHistory: (job) =>
        set((s) => ({ jobHistory: [job, ...s.jobHistory.filter(j => j.id !== job.id)].slice(0, 100) })),
      clearHistory: () => set({ jobHistory: [] }),
      removeFromHistory: (id) =>
        set((s) => ({ jobHistory: s.jobHistory.filter(j => j.id !== id) })),

      // Settings
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      // UI
      showSettings: false,
      setShowSettings: (v) => set({ showSettings: v }),
      showOnboarding: false,
      setShowOnboarding: (v) => set({ showOnboarding: v }),
      showCommandViewer: false,
      setShowCommandViewer: (v) => set({ showCommandViewer: v }),

      // Search
      sidebarSearch: '',
      setSidebarSearch: (q) => set({ sidebarSearch: q }),
    }),
    {
      name: 'ffmpegstudio-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        settings: s.settings,
        jobHistory: s.jobHistory,
        activeCategory: s.activeCategory,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
)
