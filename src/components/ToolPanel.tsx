import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Loader2, AlertCircle, FolderOpen } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { categoryConfig } from '@/tools/registry'
import { DropZone } from './DropZone'
import { ProgressBar } from './ProgressBar'
import { CommandViewer } from './CommandViewer'
import { cn, generateJobId, getOutputPath } from '@/lib/utils'
import type { Job } from '@/types'

// ─── Option Field Renderers ────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-muted-foreground cursor-help text-xs">?</span>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 mb-2 z-50 w-56 p-2.5 rounded-lg bg-popover border border-border text-xs text-popover-foreground shadow-xl"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

function OptionField({
  option,
  value,
  onChange,
}: {
  option: import('@/types').ToolOption
  value: unknown
  onChange: (v: unknown) => void
}) {
  const { type, label, description, options: selectOpts = [], min, max, step = 1, unit, accept } = option

  const labelEl = (
    <label className="block text-xs font-medium text-foreground mb-1.5">
      {label}
      {unit && <span className="ml-1 text-muted-foreground">({unit})</span>}
      <Tooltip text={description} />
    </label>
  )

  if (type === 'select') {
    return (
      <div>
        {labelEl}
        <select
          value={value as string}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {selectOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    )
  }

  if (type === 'slider') {
    const numVal = typeof value === 'number' && !isNaN(value) ? value : (typeof option.defaultValue === 'number' ? option.defaultValue : (min ?? 0))
    return (
      <div>
        {labelEl}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min ?? 0} max={max ?? 100} step={step}
            value={numVal}
            onChange={e => {
              const parsed = parseFloat(e.target.value)
              onChange(isNaN(parsed) ? option.defaultValue : parsed)
            }}
            className="flex-1 h-1.5 accent-primary"
          />
          <span className="text-sm font-mono w-12 text-right text-muted-foreground">{numVal}</span>
        </div>
      </div>
    )
  }

  if (type === 'toggle') {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}<Tooltip text={description} /></span>
        <button
          onClick={() => onChange(!value)}
          className={cn(
            'relative w-9 h-5 rounded-full transition-colors',
            value ? 'bg-primary' : 'bg-secondary border border-border'
          )}
        >
          <span className={cn(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
            value ? 'translate-x-4' : 'translate-x-0'
          )} />
        </button>
      </div>
    )
  }

  if (type === 'number') {
    const numVal = typeof value === 'number' && !isNaN(value) ? value : (typeof option.defaultValue === 'number' ? option.defaultValue : 0)
    return (
      <div>
        {labelEl}
        <input
          type="number"
          min={min} max={max} step={step}
          value={numVal}
          onChange={e => {
            const parsed = parseFloat(e.target.value)
            onChange(isNaN(parsed) ? option.defaultValue : parsed)
          }}
          className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    )
  }

  if (type === 'text' || type === 'color') {
    return (
      <div>
        {labelEl}
        <div className="flex gap-2">
          {type === 'color' && (
            <input
              type="color"
              value={value as string}
              onChange={e => onChange(e.target.value)}
              className="h-9 w-9 rounded cursor-pointer border border-border"
            />
          )}
          <input
            type="text"
            value={value as string}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />
        </div>
      </div>
    )
  }

  if (type === 'textarea') {
    return (
      <div>
        {labelEl}
        <textarea
          value={value as string}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring font-mono resize-none"
        />
      </div>
    )
  }

  if (type === 'file-picker') {
    return (
      <div>
        {labelEl}
        <div className="flex gap-2">
          <input
            type="text"
            value={value as string}
            readOnly
            placeholder="No file selected…"
            className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none truncate text-muted-foreground"
          />
          <button
            onClick={async () => {
              if (!window.electronAPI) return
              const exts = accept ? accept.split(',') : []
              const files = await window.electronAPI.pickFile({ accept: exts })
              if (files[0]) onChange(files[0])
            }}
            className="px-3 py-2 text-sm bg-secondary border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Browse
          </button>
        </div>
      </div>
    )
  }

  if (type === 'file-list') {
    const files = Array.isArray(value) ? value as string[] : []
    return (
      <div>
        {labelEl}
        <div className="space-y-2">
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={`${f}-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary border border-border rounded-lg">
                  <span className="flex-1 truncate text-muted-foreground font-mono text-xs">{f.split(/[\\/]/).pop()}</span>
                  <button
                    onClick={() => {
                      const next = files.filter((_, idx) => idx !== i)
                      onChange(next)
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={async () => {
              if (!window.electronAPI) return
              const exts = accept ? accept.split(',') : []
              const picked = await window.electronAPI.pickFile({ accept: exts, multiple: true })
              if (picked.length > 0) onChange([...files, ...picked])
            }}
            className="w-full px-3 py-2 text-sm bg-secondary border border-border border-dashed rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-1.5 text-muted-foreground"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Add Files{files.length > 0 ? ` (${files.length} selected)` : ''}
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ─── Main ToolPanel Component ─────────────────────────────────────────────────

export function ToolPanel() {
  const { activeTool, inputFile, toolOptions, setToolOption, currentJob, setCurrentJob, updateJobStatus, updateJobProgress, settings } = useAppStore()
  const [error, setError] = useState<string | null>(null)

  const handleRun = useCallback(async () => {
    if (!activeTool || (!inputFile && activeTool.requiresInput)) return
    if (!window.electronAPI) return

    setError(null)

    // Resolve options: merge user-set values over tool defaults
    // This is critical because toolOptions is {} when no options are changed,
    // and buildCommand/outputExtension would receive undefined for every option.
    const resolvedOptions: Record<string, unknown> = {}
    for (const opt of activeTool.options) {
      resolvedOptions[opt.id] = toolOptions[opt.id] !== undefined ? toolOptions[opt.id] : opt.defaultValue
    }

    // Validate required file-picker / file-list options before running
    for (const opt of activeTool.options) {
      const val = resolvedOptions[opt.id]
      if (opt.type === 'file-picker' && (!val || val === '')) {
        setError(`Please select a file for "${opt.label}" before running.`)
        return
      }
      if (opt.type === 'file-list') {
        const files = Array.isArray(val) ? val : []
        // file-list options with empty defaults are optional (e.g., merge-videos additional files)
        // but if the tool primarily needs them (accept is defined and no input file covers it), skip validation
      }
    }

    // Build output path
    const outFolder = settings.outputFolder || (await window.electronAPI.getDefaultOutputFolder())
    const ext = typeof activeTool.outputExtension === 'function'
      ? activeTool.outputExtension(resolvedOptions)
      : activeTool.outputExtension
    const outputPath = getOutputPath(inputFile?.path || '', outFolder, ext)

    // Build command
    const command = activeTool.buildCommand(
      inputFile?.path || '',
      outputPath,
      resolvedOptions
    )

    // Handle probe-only tools (e.g., View File Info) that return empty commands
    if (command.length === 0) {
      if (inputFile?.path) {
        // Use probeFile to get info instead of running FFmpeg
        const jobId = generateJobId()
        const job: Job = {
          id: jobId,
          toolId: activeTool.id,
          toolName: activeTool.name,
          category: activeTool.category,
          inputPath: inputFile.path,
          inputName: inputFile.name,
          outputPath: '',
          options: toolOptions,
          command: [],
          status: 'running',
          startedAt: Date.now(),
          inputSizeBytes: inputFile.size,
        }
        setCurrentJob(job)

        try {
          const probeResult = await window.electronAPI.probeFile(inputFile.path)
          if (probeResult) {
            const infoLines = [
              `File: ${probeResult.name}`,
              `Format: ${probeResult.format || 'Unknown'}`,
              `Duration: ${probeResult.duration ? probeResult.duration.toFixed(2) + 's' : 'N/A'}`,
              `Resolution: ${probeResult.width && probeResult.height ? `${probeResult.width}×${probeResult.height}` : 'N/A'}`,
              `Video Codec: ${probeResult.codec || 'N/A'}`,
              `Audio Codec: ${probeResult.audioCodec || 'N/A'}`,
              `Bitrate: ${probeResult.bitrate ? probeResult.bitrate + ' kbps' : 'N/A'}`,
              `FPS: ${probeResult.fps ? probeResult.fps.toFixed(2) : 'N/A'}`,
              `Size: ${probeResult.size ? (probeResult.size / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'}`,
            ].join('\n')

            updateJobStatus('completed', {
              completedAt: Date.now(),
              ffmpegLog: infoLines,
            })
          } else {
            setError('Could not read file information.')
            updateJobStatus('failed', { error: 'Could not read file information.' })
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error'
          setError(msg)
          updateJobStatus('failed', { error: msg })
        }
      } else {
        setError('This tool requires an input file.')
      }
      return
    }

    const jobId = generateJobId()
    const job: Job = {
      id: jobId,
      toolId: activeTool.id,
      toolName: activeTool.name,
      category: activeTool.category,
      inputPath: inputFile?.path || '',
      inputName: inputFile?.name || '',
      outputPath,
      options: toolOptions,
      command,
      status: 'running',
      startedAt: Date.now(),
      inputSizeBytes: inputFile?.size,
    }

    setCurrentJob(job)

    // Subscribe to progress
    const unsubProgress = window.electronAPI.onFFmpegProgress(jobId, (progress) => {
      updateJobProgress(progress)
    })

    try {
      const result = await window.electronAPI.runFFmpeg(jobId, command, outputPath)
      unsubProgress()

      if (result.success) {
        updateJobStatus('completed', {
          completedAt: Date.now(),
          outputSizeBytes: undefined,
          ffmpegLog: result.ffmpegLog,
        })
      } else {
        if (result.error !== 'Cancelled by user') {
          setError(result.error || 'Unknown error')
        }
        updateJobStatus(result.error === 'Cancelled by user' ? 'cancelled' : 'failed', {
          error: result.error,
          ffmpegLog: result.ffmpegLog,
        })
      }
    } catch (e) {
      unsubProgress()
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      updateJobStatus('failed', { error: msg })
    }
  }, [activeTool, inputFile, toolOptions, settings, setCurrentJob, updateJobProgress, updateJobStatus])

  if (!activeTool) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Play className="h-8 w-8" />
        </div>
        <p className="text-sm font-medium">Select a tool from the sidebar</p>
        <p className="text-xs mt-1">44 tools across 7 categories</p>
      </div>
    )
  }

  const config = categoryConfig[activeTool.category]
  const isRunning = currentJob?.status === 'running'
  const canRun = (!activeTool.requiresInput || !!inputFile) && !isRunning

  // Initialize default values for options not yet set
  const getOptionValue = (opt: import('@/types').ToolOption) => {
    return toolOptions[opt.id] !== undefined ? toolOptions[opt.id] : opt.defaultValue
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tool Header */}
      <div className={cn('px-4 py-3 border-b border-border flex items-center gap-3', config.bgColor)}>
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', config.bgColor, 'border', config.borderColor)}>
          <activeTool.icon className={cn('h-5 w-5', config.textColor)} />
        </div>
        <div>
          <h2 className="font-semibold text-sm">{activeTool.name}</h2>
          <p className="text-xs text-muted-foreground">{activeTool.description}</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Drop Zone */}
        {activeTool.requiresInput && <DropZone />}

        {/* Options */}
        {activeTool.options.length > 0 && (
          <div className="form-section space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Options</h3>
            {activeTool.options.map(opt => (
              <OptionField
                key={opt.id}
                option={opt}
                value={getOptionValue(opt)}
                onChange={v => setToolOption(opt.id, v)}
              />
            ))}
          </div>
        )}

        {/* Command Viewer */}
        <CommandViewer />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        {(currentJob?.status === 'running') && <ProgressBar />}
      </div>

      {/* Run Button */}
      <div className="px-4 pb-4 pt-2 border-t border-border">
        <button
          onClick={handleRun}
          disabled={!canRun}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2',
            canRun
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {isRunning
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            : <><Play className="h-4 w-4" /> Run {activeTool.name}</>
          }
        </button>
      </div>
    </div>
  )
}
