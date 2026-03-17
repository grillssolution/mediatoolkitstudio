import { motion, AnimatePresence } from 'framer-motion'
import { FolderOpen, Copy, ExternalLink, CheckCircle, XCircle, ArrowDownRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function OutputManager() {
  const { currentJob } = useAppStore()

  const openFile = () => {
    if (currentJob?.outputPath) window.electronAPI?.openFile(currentJob.outputPath)
  }

  const openFolder = () => {
    if (currentJob?.outputPath) window.electronAPI?.openFolder(currentJob.outputPath)
  }

  const copyPath = () => {
    if (currentJob?.outputPath) navigator.clipboard.writeText(currentJob.outputPath)
  }

  if (!currentJob || currentJob.status === 'queued') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-6">
        <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
          <ArrowDownRight className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium">Output will appear here</p>
        <p className="text-xs mt-1">Run a tool to see results</p>
      </div>
    )
  }

  const status = currentJob.status
  const isSuccess = status === 'completed'
  const isFailed = status === 'failed'
  const isCancelled = status === 'cancelled'
  const isRunning = status === 'running'

  return (
    <div className="p-4 space-y-4">
      {/* Status Badge */}
      <div className={cn(
        'flex items-center gap-2 p-3 rounded-xl text-sm font-medium',
        isSuccess && 'bg-green-500/10 text-green-400 border border-green-500/20',
        isFailed && 'bg-destructive/10 text-destructive border border-destructive/20',
        isCancelled && 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        isRunning && 'bg-primary/10 text-primary border border-primary/20',
      )}>
        {isSuccess && <CheckCircle className="h-4 w-4" />}
        {isFailed && <XCircle className="h-4 w-4" />}
        {isCancelled && <XCircle className="h-4 w-4" />}
        <span>
          {isSuccess && 'Done! File saved successfully'}
          {isFailed && `Failed: ${currentJob.error}`}
          {isCancelled && 'Cancelled'}
          {isRunning && 'Processing…'}
        </span>
      </div>

      {/* File Info */}
      {isSuccess && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Output path */}
            <div className="glass-card p-3">
              <p className="text-xs text-muted-foreground mb-1">Output File</p>
              <p className="text-xs font-mono break-all text-foreground" title={currentJob.outputPath}>
                {currentJob.outputPath}
              </p>
            </div>

            {/* Size comparison */}
            {currentJob.inputSizeBytes && (
              <div className="grid grid-cols-2 gap-2">
                <div className="glass-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Input</p>
                  <p className="text-sm font-semibold mt-1">{formatBytes(currentJob.inputSizeBytes)}</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">Processing Time</p>
                  <p className="text-sm font-semibold mt-1">
                    {currentJob.completedAt && currentJob.startedAt
                      ? `${((currentJob.completedAt - currentJob.startedAt) / 1000).toFixed(1)}s`
                      : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={openFile} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-xs">
                <ExternalLink className="h-4 w-4" />
                Open File
              </button>
              <button onClick={openFolder} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-xs">
                <FolderOpen className="h-4 w-4" />
                Show in Folder
              </button>
              <button onClick={copyPath} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-xs">
                <Copy className="h-4 w-4" />
                Copy Path
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Error log */}
      {isFailed && currentJob.ffmpegLog && (
        <details className="text-xs">
          <summary className="text-muted-foreground cursor-pointer hover:text-foreground">Show FFmpeg Log</summary>
          <pre className="mt-2 code-block whitespace-pre-wrap overflow-auto max-h-48">{currentJob.ffmpegLog}</pre>
        </details>
      )}
    </div>
  )
}
