import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileVideo, Music, Image as ImageIcon, FileText, X, RefreshCw, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatBytes, formatDuration } from '@/lib/utils'

const typeIcons = {
  video: FileVideo,
  audio: Music,
  image: ImageIcon,
  subtitle: FileText,
  any: Upload,
}

export function DropZone() {
  const { inputFile, setInputFile, activeTool } = useAppStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProbing, setIsProbing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Use a counter to handle child-element drag leave without flickering
  const dragCounter = useRef(0)

  const processFile = useCallback(async (filePath: string) => {
    setError(null)
    if (!window.electronAPI) {
      setError('Electron API not available. Make sure you launched the app via Electron, not a browser.')
      return
    }
    setIsProbing(true)
    try {
      const meta = await window.electronAPI.probeFile(filePath)
      if (meta) {
        setInputFile(meta)
      } else {
        setError('Could not read file info. Make sure FFprobe is available.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error reading file')
    } finally {
      setIsProbing(false)
    }
  }, [setInputFile])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    dragCounter.current = 0
    const files = Array.from(e.dataTransfer.files) as (File & { path: string })[]
    if (files.length > 0 && files[0].path) {
      processFile(files[0].path)
    }
  }, [processFile])

  const handleBrowse = useCallback(async (e: React.MouseEvent) => {
    // Prevent bubbling from inner buttons
    e.stopPropagation()
    setError(null)
    if (!window.electronAPI) {
      setError('File picker is only available in the Electron app.')
      return
    }
    try {
      const paths = await window.electronAPI.pickFile({
        multiple: false,
        accept: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a',
          'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'srt', 'vtt', 'ass'],
      })
      if (paths && paths.length > 0) {
        processFile(paths[0])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open file picker')
    }
  }, [processFile])

  // ─── File loaded state ────────────────────────────────────────────────────────
  if (inputFile) {
    const TypeIcon = typeIcons[inputFile.type as keyof typeof typeIcons] || Upload
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TypeIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{inputFile.name}</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span className="stat-chip">{formatBytes(inputFile.size)}</span>
              {inputFile.duration && <span className="stat-chip">{formatDuration(inputFile.duration)}</span>}
              {inputFile.width && inputFile.height && (
                <span className="stat-chip">{inputFile.width}×{inputFile.height}</span>
              )}
              {inputFile.codec && <span className="stat-chip uppercase">{inputFile.codec}</span>}
              {inputFile.fps && <span className="stat-chip">{Math.round(inputFile.fps)} fps</span>}
              {inputFile.bitrate && <span className="stat-chip">{inputFile.bitrate} kbps</span>}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={handleBrowse}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="Change file"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setInputFile(null) }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              title="Remove file"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── Empty / drop state ───────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowse}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 select-none',
          isDragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
        )}
      >
        <AnimatePresence mode="wait">
          {isProbing ? (
            <motion.div
              key="probing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Reading file info…</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={isDragOver ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <Upload className="h-7 w-7 text-primary" />
              </motion.div>
              <div>
                <p className="font-semibold text-sm">
                  {isDragOver ? 'Drop your file here' : 'Drop a file or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTool
                    ? `Accepts: ${activeTool.acceptedInputTypes.map(t => t.toUpperCase()).join(', ')} files`
                    : 'Video, audio, image, and subtitle files supported'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
