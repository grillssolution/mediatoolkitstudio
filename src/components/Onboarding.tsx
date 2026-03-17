import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Zap, History, ChevronRight, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const steps = [
  {
    icon: Upload,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    title: 'Drop Your File',
    description: "Drag any video, audio, image, or subtitle file into the workspace. FFmpegStudio will instantly read its format, duration, resolution, and codec.",
    hint: 'Tip: Works completely offline — no file ever leaves your computer'
  },
  {
    icon: Zap,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    title: 'Pick a Tool & Configure',
    description: "Choose from 44 tools across 7 categories in the sidebar. Set your options — every setting has a plain-English explanation. See the exact FFmpeg command in real time.",
    hint: 'Tip: Color-coded by category — blue for video, green for audio, purple for subtitles'
  },
  {
    icon: History,
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    title: 'Process & Review',
    description: "Hit Run and watch the real-time progress bar. When done, open or share your file directly from the output panel. All jobs are saved in history.",
    hint: 'Tip: Output folder is configurable in Settings — your originals are never overwritten'
  },
]

export function Onboarding() {
  const { showOnboarding, setShowOnboarding, updateSettings } = useAppStore()
  const [step, setStep] = useState(0)

  const handleClose = () => {
    updateSettings({ onboardingComplete: true })
    setShowOnboarding(false)
  }

  return (
    <AnimatePresence>
      {showOnboarding && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 text-center border-b border-border">
                <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl font-bold">FF</span>
                </div>
                <h2 className="text-lg font-bold gradient-text">Welcome to FFmpegStudio</h2>
                <p className="text-sm text-muted-foreground mt-1">Professional media processing, no terminal required</p>
              </div>

              {/* Step Content */}
              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className={`h-14 w-14 rounded-2xl ${steps[step].iconBg} flex items-center justify-center`}>
                      {(() => { const Icon = steps[step].icon; return <Icon className={`h-7 w-7 ${steps[step].iconColor}`} /> })()}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">
                        Step {step + 1}: {steps[step].title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {steps[step].description}
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <span className="text-xs text-primary leading-relaxed">{steps[step].hint}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex items-center gap-4">
                {/* Step dots */}
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
                    />
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={handleClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Skip
                  </button>
                  {step < steps.length - 1 ? (
                    <button
                      onClick={() => setStep(s => s + 1)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
