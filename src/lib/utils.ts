import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function getOutputPath(inputPath: string, outputFolder: string, ext: string): string {
  // Get base name without extension
  const baseName = inputPath
    ? inputPath.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || 'output'
    : 'output'
  const timestamp = Date.now()
  const fileName = `${baseName}_output_${timestamp}.${ext}`
  if (outputFolder) {
    return `${outputFolder.replace(/[\\/]+$/, '')}\\${fileName}`
  }
  // Fallback: same directory as input
  if (inputPath) {
    const dir = inputPath.replace(/[\\/][^\\/]+$/, '')
    return `${dir}\\${fileName}`
  }
  return fileName
}
