import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderOpen, Moon, Sun, Cpu, Hash } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function Settings() {
  const { showSettings, setShowSettings, settings, updateSettings } = useAppStore()

  const handlePickFolder = async () => {
    if (!window.electronAPI) return
    const folder = await window.electronAPI.pickFolder()
    if (folder) updateSettings({ outputFolder: folder })
  }

  return (
    <AnimatePresence>
      {showSettings && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowSettings(false)}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 z-50 bg-card border-l border-border flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-bold text-base">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Theme */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {settings.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Theme
                  </span>
                  <div className="flex rounded-lg overflow-hidden border border-border">
                    {(['dark', 'light'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateSettings({ theme: t })}
                        className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${settings.theme === t ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Output */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output</h3>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Output Folder</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.outputFolder}
                      readOnly
                      placeholder="Default: Videos folder"
                      className="flex-1 px-3 py-2 text-xs bg-secondary border border-border rounded-lg truncate text-muted-foreground"
                    />
                    <button onClick={handlePickFolder} className="px-3 py-2 rounded-lg bg-secondary border border-border hover:bg-accent transition-colors">
                      <FolderOpen className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Performance */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performance</h3>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Hash className="h-4 w-4" />
                    Concurrent Jobs
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={1} max={8}
                      value={settings.concurrentJobs}
                      onChange={e => updateSettings({ concurrentJobs: parseInt(e.target.value) })}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-mono w-6 text-center">{settings.concurrentJobs}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Hardware Acceleration
                  </label>
                  <button
                    onClick={() => updateSettings({ hardwareAcceleration: !settings.hardwareAcceleration })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${settings.hardwareAcceleration ? 'bg-primary' : 'bg-secondary border border-border'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${settings.hardwareAcceleration ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </section>

              {/* FFmpeg Binary */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advanced</h3>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Custom FFmpeg Path</label>
                  <p className="text-xs text-muted-foreground mb-2">Leave empty to use the bundled FFmpeg binary.</p>
                  <input
                    type="text"
                    value={settings.ffmpegBinaryPath}
                    onChange={e => updateSettings({ ffmpegBinaryPath: e.target.value })}
                    placeholder="/path/to/ffmpeg"
                    className="w-full px-3 py-2 text-xs bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                </div>
              </section>
            </div>
            
            {/* Footer */}
            <div className="px-5 py-4 border-t border-border mt-auto">
              <p className="text-xs text-muted-foreground text-center">
                Developed by{' '}
                <a 
                  href="https://www.grillstech.in/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Grills Tech
                </a>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
