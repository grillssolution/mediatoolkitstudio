import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { categoryConfig } from '@/tools/registry'
import { cn, formatTimeAgo } from '@/lib/utils'
import type { Job } from '@/types'

function StatusIcon({ status }: { status: Job['status'] }) {
  if (status === 'completed') return <CheckCircle className="h-3.5 w-3.5 text-green-400" />
  if (status === 'failed') return <XCircle className="h-3.5 w-3.5 text-destructive" />
  if (status === 'running') return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
  if (status === 'cancelled') return <XCircle className="h-3.5 w-3.5 text-yellow-400" />
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
}

export function JobHistory() {
  const { jobHistory, removeFromHistory, clearHistory } = useAppStore()

  if (jobHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-center px-4">
        <Clock className="h-8 w-8 mb-2" />
        <p className="text-sm font-medium">No jobs yet</p>
        <p className="text-xs mt-1">Processed jobs will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Jobs ({jobHistory.length})
        </span>
        <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
          Clear
        </button>
      </div>

      <div className="space-y-1 px-2">
        <AnimatePresence initial={false}>
          {jobHistory.slice(0, 30).map(job => {
            const config = categoryConfig[job.category]
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                className="glass-card p-3 group"
              >
                <div className="flex items-start gap-2">
                  <StatusIcon status={job.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs font-semibold', config.textColor)}>{job.toolName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{job.inputName || 'No input'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.startedAt ? formatTimeAgo(job.startedAt) : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeFromHistory(job.id)}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
