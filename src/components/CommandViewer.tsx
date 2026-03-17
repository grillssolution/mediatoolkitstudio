import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function CommandViewer() {
  const { activeTool, inputFile, toolOptions, showCommandViewer, setShowCommandViewer } = useAppStore()
  const [copied, setCopied] = useState(false)

  if (!activeTool) return null

  const buildPreview = () => {
    if (!activeTool.buildCommand) return ''
    try {
      const ext = typeof activeTool.outputExtension === 'function'
        ? activeTool.outputExtension(toolOptions)
        : activeTool.outputExtension
      const inp = inputFile?.path || '/path/to/input.mp4'
      const out = `/path/to/output.${ext}`

      // Initialize defaults for any unset options
      const opts: Record<string, unknown> = {}
      for (const o of activeTool.options) {
        opts[o.id] = toolOptions[o.id] !== undefined ? toolOptions[o.id] : o.defaultValue
      }

      const args = activeTool.buildCommand(inp, out, opts)
      return `ffmpeg ${args.join(' ')}`
    } catch {
      return '(unable to preview command)'
    }
  }

  const command = buildPreview()

  const handleCopy = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setShowCommandViewer(!showCommandViewer)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-accent transition-colors"
      >
        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">FFmpeg Command Preview</span>
        <span className="ml-auto">
          {showCommandViewer
            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          }
        </span>
      </button>

      <AnimatePresence>
        {showCommandViewer && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="relative">
              <pre className="code-block rounded-none text-xs overflow-x-auto leading-relaxed">
                {command.split(' ').map((part, i) => (
                  <span key={i} className={cn(
                    part.startsWith('-') ? 'text-yellow-400' : i === 0 ? 'text-blue-400' : 'text-green-300',
                    i > 0 ? 'ml-1' : ''
                  )}>
                    {part}
                  </span>
                ))}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
              >
                <Copy className="h-3 w-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
