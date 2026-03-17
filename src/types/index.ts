import { LucideIcon } from 'lucide-react'

// ─── Tool System ─────────────────────────────────────────────────────────────

export type ToolCategory =
  | 'video'
  | 'audio'
  | 'subtitles'
  | 'images'
  | 'streaming'
  | 'metadata'
  | 'advanced'

export type MediaType =
  | 'video'
  | 'audio'
  | 'image'
  | 'subtitle'
  | 'any'

export type OptionType =
  | 'select'
  | 'slider'
  | 'text'
  | 'toggle'
  | 'file-picker'
  | 'time-range'
  | 'number'
  | 'color'
  | 'file-list'
  | 'textarea'

export interface SelectOption {
  value: string
  label: string
}

export interface ToolOption {
  id: string
  label: string
  description: string   // Plain-English tooltip
  type: OptionType
  defaultValue: string | number | boolean | string[]
  options?: SelectOption[]           // For 'select'
  min?: number                        // For 'slider' / 'number'
  max?: number
  step?: number
  unit?: string                       // e.g. 'fps', 'kbps', 's'
  accept?: string                     // For 'file-picker'
  multiple?: boolean                  // For 'file-picker'
}

export interface Tool {
  id: string
  category: ToolCategory
  name: string
  description: string
  icon: LucideIcon
  acceptedInputTypes: MediaType[]
  options: ToolOption[]
  requiresInput: boolean              // false for viewFileInfo
  buildCommand: (
    input: string,
    output: string,
    options: Record<string, unknown>
  ) => string[]
  outputExtension: string | ((options: Record<string, unknown>) => string)
  estimatedDuration?: (fileDuration: number, options: Record<string, unknown>) => number
}

// ─── File Metadata ────────────────────────────────────────────────────────────

export interface FileMetadata {
  path: string
  name: string
  size: number          // bytes
  duration?: number     // seconds
  width?: number
  height?: number
  codec?: string
  audioCodec?: string
  bitrate?: number      // kbps
  fps?: number
  format?: string
  type: MediaType
  rawProbe?: unknown
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface JobProgress {
  percent: number        // 0-100
  speed: string          // e.g. "2.3x"
  eta: number            // seconds remaining
  fps: number
  currentTime: number    // seconds processed
}

export interface Job {
  id: string
  toolId: string
  toolName: string
  category: ToolCategory
  inputPath: string
  inputName: string
  outputPath: string
  options: Record<string, unknown>
  command: string[]
  status: JobStatus
  progress?: JobProgress
  startedAt?: number
  completedAt?: number
  error?: string
  ffmpegLog?: string
  inputSizeBytes?: number
  outputSizeBytes?: number
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  outputFolder: string
  theme: 'dark' | 'light' | 'system'
  hardwareAcceleration: boolean
  concurrentJobs: number
  ffmpegBinaryPath: string
  defaultFormats: Record<ToolCategory, string>
  onboardingComplete: boolean
  checkUpdates: boolean
}

// ─── IPC API (exposed via contextBridge) ─────────────────────────────────────

export interface ElectronAPI {
  runFFmpeg: (jobId: string, command: string[], outputPath: string) => Promise<{ success: boolean; outputPath: string; error?: string; ffmpegLog?: string }>
  cancelFFmpeg: (jobId: string) => Promise<void>
  probeFile: (filePath: string) => Promise<FileMetadata | null>
  openFile: (filePath: string) => Promise<void>
  openFolder: (folderPath: string) => Promise<void>
  pickFile: (options: { multiple?: boolean; accept?: string[] }) => Promise<string[]>
  pickFolder: () => Promise<string | null>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
  getJobHistory: () => Promise<Job[]>
  saveJobHistory: (jobs: Job[]) => Promise<void>
  getDefaultOutputFolder: () => Promise<string>
  onFFmpegProgress: (jobId: string, callback: (progress: JobProgress) => void) => () => void
  onFFmpegLog: (jobId: string, callback: (log: string) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
