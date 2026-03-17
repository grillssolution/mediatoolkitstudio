import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, HelpCircle, Minimize, Maximize } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Sidebar } from '@/components/Sidebar'
import { ToolPanel } from '@/components/ToolPanel'
import { OutputManager } from '@/components/OutputManager'
import { JobHistory } from '@/components/JobHistory'
import { Settings } from '@/components/Settings'
import { Onboarding } from '@/components/Onboarding'
import { categoryConfig } from '@/tools/registry'
import { cn } from '@/lib/utils'

export default function App() {
  const { settings, setShowSettings, setShowOnboarding, currentJob } = useAppStore()

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [settings.theme])

  // Load settings from Electron & show onboarding if needed
  useEffect(() => {
    const init = async () => {
      if (!window.electronAPI) return
      const saved = await window.electronAPI.getSettings()
      if (saved) {
        useAppStore.getState().updateSettings(saved)
      } else {
        // First launch
        if (!settings.onboardingComplete) {
          setShowOnboarding(true)
        }
      }
    }
    init()
  }, [])

  // Persist settings to Electron on change
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.saveSettings(settings)
    }
  }, [settings])

  const isRunning = currentJob?.status === 'running'

  return (
    <div className={cn('flex flex-col h-screen w-screen overflow-hidden', settings.theme === 'dark' ? 'dark' : '')}>
      {/* Titlebar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm h-11 flex-shrink-0 drag-region">
        <div className="flex items-center gap-2 no-drag">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold leading-none">MS</span>
          </div>
          <span className="text-sm font-semibold gradient-text">Media Studio Toolkit</span>
          {isRunning && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-xs text-primary ml-2"
            >
              ● Processing
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setShowOnboarding(true)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            title="Help / Onboarding"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sidebar */}
        <Sidebar />

        {/* Center: Workspace */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <ToolPanel />
        </main>

        {/* Right: Output + History */}
        <aside className="w-72 flex-shrink-0 border-l border-border flex flex-col overflow-hidden bg-card/30">
          {/* Output Panel */}
          <div className="border-b border-border">
            <div className="px-4 py-2.5 border-b border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output</span>
            </div>
            <div className="min-h-[200px]">
              <OutputManager />
            </div>
          </div>

          {/* History Panel */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <JobHistory />
            </div>
          </div>
        </aside>
      </div>

      {/* Overlays */}
      <Settings />
      <Onboarding />
    </div>
  )
}
