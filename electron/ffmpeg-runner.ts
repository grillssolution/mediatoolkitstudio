import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import type { FileMetadata, JobProgress } from '../src/types'

// ─── Binary Resolution ────────────────────────────────────────────────────────

function getFFmpegPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'ffmpeg-static', 'ffmpeg.exe')
  }
  // In dev: use ffmpeg-static npm package
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ffmpegStatic = require('ffmpeg-static') as string
  return ffmpegStatic
}

function getFFprobePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'ffprobe-static', 'bin', 'win32', 'x64', 'ffprobe.exe')
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ffprobeStatic = require('ffprobe-static') as { path: string }
  return ffprobeStatic.path
}

// ─── Active Jobs Map ─────────────────────────────────────────────────────────

const activeProcesses = new Map<string, ChildProcess>()

// ─── Progress Parsing ─────────────────────────────────────────────────────────

function parseProgress(line: string, totalDuration: number): JobProgress | null {
  // FFmpeg stderr format: frame=  240 fps= 60 q=28.0 size=    1024kB time=00:00:08.00 bitrate= 128.0kbits/s speed=2.00x
  const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/)
  const speedMatch = line.match(/speed=\s*([\d.]+)x/)
  const fpsMatch = line.match(/fps=\s*([\d.]+)/)

  if (!timeMatch) return null

  const currentTime =
    parseInt(timeMatch[1]) * 3600 +
    parseInt(timeMatch[2]) * 60 +
    parseFloat(timeMatch[3])

  const percent = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0
  const speed = speedMatch ? parseFloat(speedMatch[1]) : 1
  const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 0
  const remaining = speed > 0 && totalDuration > 0
    ? (totalDuration - currentTime) / speed
    : 0

  return {
    percent: Math.round(percent * 10) / 10,
    speed: speedMatch ? `${speedMatch[1]}x` : '—',
    eta: Math.max(0, Math.round(remaining)),
    fps,
    currentTime,
  }
}

// ─── FFprobe ──────────────────────────────────────────────────────────────────

export function probeFile(filePath: string): Promise<FileMetadata | null> {
  return new Promise((resolve) => {
    const ffprobe = getFFprobePath()
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-show_format',
      filePath,
    ]

    const proc = spawn(ffprobe, args)
    let output = ''
    let error = ''

    proc.stdout.on('data', (d: Buffer) => { output += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { error += d.toString() })

    proc.on('close', (code) => {
      if (code !== 0 || !output) {
        console.error('FFprobe error:', error)
        resolve(null)
        return
      }

      try {
        const data = JSON.parse(output)
        const videoStream = data.streams?.find((s: Record<string, unknown>) => s.codec_type === 'video')
        const audioStream = data.streams?.find((s: Record<string, unknown>) => s.codec_type === 'audio')
        const format = data.format

        const ext = path.extname(filePath).toLowerCase().slice(1)
        const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'opus']
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff']
        const subtitleExts = ['srt', 'vtt', 'ass', 'ssa', 'sub']

        let type: FileMetadata['type'] = 'any'
        if (videoStream) type = 'video'
        else if (audioExts.includes(ext)) type = 'audio'
        else if (imageExts.includes(ext)) type = 'image'
        else if (subtitleExts.includes(ext)) type = 'subtitle'

        const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null

        resolve({
          path: filePath,
          name: path.basename(filePath),
          size: stats ? stats.size : parseInt(format?.size || '0'),
          duration: format?.duration ? parseFloat(format.duration) : undefined,
          width: videoStream?.width,
          height: videoStream?.height,
          codec: videoStream?.codec_name,
          audioCodec: audioStream?.codec_name,
          bitrate: format?.bit_rate ? Math.round(parseInt(format.bit_rate) / 1000) : undefined,
          fps: videoStream?.avg_frame_rate
            ? eval(videoStream.avg_frame_rate as string) // "30000/1001" → 29.97
            : undefined,
          format: format?.format_name,
          type,
          rawProbe: data,
        })
      } catch (e) {
        console.error('Probe parse error:', e)
        resolve(null)
      }
    })
  })
}

// ─── Run FFmpeg ───────────────────────────────────────────────────────────────

export function runFFmpeg(
  jobId: string,
  command: string[],
  outputPath: string,
  emit: (type: 'progress' | 'log' | 'complete' | 'error', data: unknown) => void
): Promise<{ success: boolean; outputPath: string; error?: string; ffmpegLog?: string }> {
  return new Promise(async (resolve) => {
    const ffmpeg = getFFmpegPath()

    // First probe the input to get duration for progress calculation
    const inputPath = command[command.indexOf('-i') + 1]
    let totalDuration = 0

    if (inputPath && fs.existsSync(inputPath)) {
      const meta = await probeFile(inputPath)
      totalDuration = meta?.duration || 0
    }

    const proc = spawn(ffmpeg, command, { windowsHide: true })
    activeProcesses.set(jobId, proc)

    let ffmpegLog = ''
    let lastLog = ''

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      ffmpegLog += text
      lastLog = text

      // Emit log lines
      emit('log', text)

      // Parse progress from each line
      for (const line of text.split('\n')) {
        const progress = parseProgress(line, totalDuration)
        if (progress) emit('progress', progress)
      }
    })

    proc.on('close', (code) => {
      activeProcesses.delete(jobId)

      if (code === 0 && fs.existsSync(outputPath)) {
        resolve({ success: true, outputPath, ffmpegLog })
      } else if (code === null || code === -2) {
        // Cancelled
        resolve({ success: false, outputPath, error: 'Cancelled by user', ffmpegLog })
        // Clean up partial file
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      } else {
        const errorMsg = parseFFmpegError(lastLog, ffmpegLog)
        resolve({ success: false, outputPath, error: errorMsg, ffmpegLog })
      }
    })

    proc.on('error', (err) => {
      activeProcesses.delete(jobId)
      resolve({ success: false, outputPath, error: err.message, ffmpegLog })
    })
  })
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export function cancelFFmpeg(jobId: string): void {
  const proc = activeProcesses.get(jobId)
  if (proc) {
    proc.kill('SIGKILL')
    activeProcesses.delete(jobId)
  }
}

// ─── Error Parsing ────────────────────────────────────────────────────────────

function parseFFmpegError(lastLog: string, fullLog: string): string {
  const combined = lastLog + '\n' + fullLog

  if (combined.includes('No such file or directory')) {
    return 'Input file not found. Please check the file path.'
  }
  if (combined.includes('Invalid data found when processing input')) {
    return 'The file appears to be corrupted or in an unsupported format.'
  }
  if (combined.includes('Encoder') && combined.includes('not found')) {
    return 'The selected codec is not supported by this build of FFmpeg.'
  }
  if (combined.includes('No space left on device')) {
    return 'Not enough disk space to write the output file.'
  }
  if (combined.includes('Permission denied')) {
    return 'Permission denied writing to the output location.'
  }
  if (combined.includes('Invalid option') || combined.includes('Option')) {
    return 'Invalid FFmpeg option detected. Please check your settings.'
  }
  if (combined.includes('Subtitle') || combined.includes('subtitle')) {
    return 'Error processing subtitle file. Check the format is compatible.'
  }

  // Extract last error line from FFmpeg
  const lines = fullLog.split('\n').filter(l => l.trim())
  
  // Custom findLast for older ES targets
  let errorLine: string | undefined
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i]
    if (l.includes('Error') || l.includes('error') || l.includes('Invalid')) {
      errorLine = l
      break
    }
  }
  
  return errorLine || 'An unexpected error occurred during processing.'
}
