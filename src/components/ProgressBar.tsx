import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function ProgressBar() {
  const { currentJob, updateJobStatus } = useAppStore()
  if (!currentJob || currentJob.status !== 'running') return null

  const prog = currentJob.progress
  const percent = prog?.percent ?? 0

  const handleCancel = async () => {
    if (!window.electronAPI) return
    await window.electronAPI.cancelFFmpeg(currentJob.id)
    updateJobStatus('cancelled')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Processing…</span>
        <div className="flex items-center gap-3 text-muted-foreground">
          {prog?.speed && prog.speed !== '—' && <span>{prog.speed}</span>}
          {prog?.eta != null && prog.eta > 0 && (
            <span>ETA: {prog.eta < 60
              ? `${prog.eta}s`
              : `${Math.floor(prog.eta / 60)}m ${prog.eta % 60}s`}
            </span>
          )}
          <span className="font-semibold text-foreground">{percent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-400 rounded-full progress-shimmer"
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </motion.div>
  )
}
