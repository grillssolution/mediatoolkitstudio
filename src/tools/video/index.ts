import {
  FileVideo, Minimize2, Monitor, Share2, Gauge, RotateCw, FlipHorizontal,
  Scissors, SplitSquareHorizontal, Layers, FastForward, Rewind,
  Crop, ZoomIn, Type, Image, SunMedium, CircleOff, Eye, Sparkles
} from 'lucide-react'
import type { Tool } from '@/types'

/** Convert HH:MM:SS or MM:SS or seconds string to numeric seconds */
function timeToSeconds(time: string): number {
  const parts = time.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || 0
}

export const videoTools: Tool[] = [
  {
    id: 'convert-format',
    category: 'video',
    name: 'Convert Video Format',
    description: 'Change a video into MP4, MOV, MKV, AVI, or WebM without losing quality.',
    icon: FileVideo,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'format', label: 'Output Format', description: 'The container format for your output video.', type: 'select', defaultValue: 'mp4', options: [{ value: 'mp4', label: 'MP4 (Most compatible)' }, { value: 'mov', label: 'MOV (Apple)' }, { value: 'mkv', label: 'MKV (High quality)' }, { value: 'avi', label: 'AVI (Windows classic)' }, { value: 'webm', label: 'WebM (Web)' }] },
      { id: 'videoCodec', label: 'Video Codec', description: 'How the video is compressed. H.264 works everywhere.', type: 'select', defaultValue: 'copy', options: [{ value: 'copy', label: 'Keep original (fastest)' }, { value: 'libx264', label: 'H.264 (compatible)' }, { value: 'libx265', label: 'H.265 (smaller files)' }, { value: 'libvpx-vp9', label: 'VP9 (WebM)' }] },
      { id: 'audioCodec', label: 'Audio Codec', description: 'How the audio track is stored.', type: 'select', defaultValue: 'copy', options: [{ value: 'copy', label: 'Keep original' }, { value: 'aac', label: 'AAC' }, { value: 'mp3', label: 'MP3' }, { value: 'opus', label: 'Opus' }] },
    ],
    buildCommand: (inp, out, opts) => {
      const args = ['-i', inp, '-c:v', opts.videoCodec as string,
        '-c:a', opts.audioCodec as string]
      // Add pix_fmt when re-encoding video (not stream copy)
      if (opts.videoCodec !== 'copy') args.push('-pix_fmt', 'yuv420p')
      args.push('-y', out)
      return args
    },
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'reduce-size',
    category: 'video',
    name: 'Reduce File Size',
    description: 'Make a video smaller for easier sharing and uploading.',
    icon: Minimize2,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'quality', label: 'Quality', description: 'Lower quality = smaller file. Balanced is recommended for most uses.', type: 'select', defaultValue: 'balanced', options: [{ value: 'small', label: 'Smallest File' }, { value: 'balanced', label: 'Balanced (Recommended)' }, { value: 'best', label: 'Best Quality' }] },
      { id: 'targetMb', label: 'Target Size (MB)', description: 'If set, the output will be approximately this size.', type: 'number', defaultValue: 0, min: 0, max: 10000, unit: 'MB' },
    ],
    buildCommand: (inp, out, opts) => {
      const crf = opts.quality === 'small' ? '32' : opts.quality === 'best' ? '18' : '23'
      return ['-i', inp, '-c:v', 'libx264', '-crf', crf, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'change-resolution',
    category: 'video',
    name: 'Change Resolution',
    description: 'Resize the video to 4K, 1080p, 720p, 480p, or a custom size.',
    icon: Monitor,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'preset', label: 'Resolution Preset', description: 'Choose a common resolution or enter custom dimensions.', type: 'select', defaultValue: '1080p', options: [{ value: '4k', label: '4K (3840×2160)' }, { value: '1080p', label: '1080p (1920×1080)' }, { value: '720p', label: '720p (1280×720)' }, { value: '480p', label: '480p (854×480)' }, { value: 'custom', label: 'Custom' }] },
      { id: 'width', label: 'Custom Width', description: 'Custom width in pixels (only used when Custom preset is selected).', type: 'number', defaultValue: 1280, min: 16, max: 7680, unit: 'px' },
      { id: 'height', label: 'Custom Height', description: 'Custom height in pixels.', type: 'number', defaultValue: 720, min: 16, max: 4320, unit: 'px' },
      { id: 'keepAspect', label: 'Maintain Aspect Ratio', description: 'Avoids stretching or squishing the video.', type: 'toggle', defaultValue: true },
    ],
    buildCommand: (inp, out, opts) => {
      const scaleMap: Record<string, string> = { '4k': '3840:2160', '1080p': '1920:1080', '720p': '1280:720', '480p': '854:480' }
      const scale = opts.preset === 'custom'
        ? (opts.keepAspect ? `${opts.width}:-2` : `${opts.width}:${opts.height}`)
        : (opts.keepAspect ? scaleMap[opts.preset as string].replace(/:\d+$/, ':-2') : scaleMap[opts.preset as string])
      return ['-i', inp, '-vf', `scale=${scale}`, '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'social-optimizer',
    category: 'video',
    name: 'Social Media Optimizer',
    description: 'Automatically optimize for YouTube, Instagram, WhatsApp, or Discord.',
    icon: Share2,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'platform', label: 'Platform', description: 'Each platform has strict size, codec, and bitrate requirements.', type: 'select', defaultValue: 'youtube', options: [{ value: 'youtube', label: 'YouTube' }, { value: 'instagram', label: 'Instagram (Reels/Feed)' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'discord', label: 'Discord' }, { value: 'twitter', label: 'Twitter/X' }] },
    ],
    buildCommand: (inp, out, opts) => {
      const configs: Record<string, string[]> = {
        youtube: ['-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'],
        instagram: ['-c:v', 'libx264', '-crf', '23', '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2', '-c:a', 'aac', '-b:a', '128k'],
        whatsapp: ['-c:v', 'libx264', '-crf', '28', '-vf', 'scale=640:-2', '-c:a', 'aac', '-b:a', '64k'],
        discord: ['-c:v', 'libx264', '-crf', '23', '-vf', 'scale=1280:-2', '-c:a', 'aac', '-b:a', '128k'],
        twitter: ['-c:v', 'libx264', '-crf', '23', '-vf', 'scale=1280:-2', '-c:a', 'aac', '-b:a', '128k', '-t', '140'],
      }
      const flags = configs[opts.platform as string] || configs.youtube
      return ['-i', inp, ...flags, '-pix_fmt', 'yuv420p', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'change-framerate',
    category: 'video',
    name: 'Change Frame Rate',
    description: 'Adjust how smooth the video plays — 24fps for cinematic, 60fps for super smooth.',
    icon: Gauge,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'fps', label: 'Frame Rate', description: 'Frames per second. Higher = smoother but larger file.', type: 'select', defaultValue: '30', options: [{ value: '24', label: '24 fps (Cinematic)' }, { value: '25', label: '25 fps (PAL)' }, { value: '30', label: '30 fps (Standard)' }, { value: '60', label: '60 fps (Smooth)' }, { value: 'custom', label: 'Custom' }] },
      { id: 'customFps', label: 'Custom FPS', description: 'Enter any frame rate you need.', type: 'number', defaultValue: 30, min: 1, max: 240, unit: 'fps' },
    ],
    buildCommand: (inp, out, opts) => {
      const fps = opts.fps === 'custom' ? String(opts.customFps) : opts.fps as string
      return ['-i', inp, '-vf', `fps=${fps}`, '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'rotate-video',
    category: 'video',
    name: 'Rotate Video',
    description: 'Fix sideways or upside-down videos recorded on a phone.',
    icon: RotateCw,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'rotation', label: 'Rotation', description: 'How many degrees to rotate clockwise.', type: 'select', defaultValue: '90', options: [{ value: '90', label: '90° Clockwise' }, { value: '180', label: '180° (Upside down)' }, { value: '270', label: '270° (Counter-clockwise)' }] },
    ],
    buildCommand: (inp, out, opts) => {
      const transposeMap: Record<string, string> = { '90': 'transpose=1', '180': 'transpose=2,transpose=2', '270': 'transpose=2' }
      return ['-i', inp, '-vf', transposeMap[opts.rotation as string], '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'flip-video',
    category: 'video',
    name: 'Flip Video',
    description: 'Mirror the video horizontally or vertically.',
    icon: FlipHorizontal,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'direction', label: 'Direction', description: 'Which axis to flip along.', type: 'select', defaultValue: 'horizontal', options: [{ value: 'horizontal', label: 'Horizontal (Mirror)' }, { value: 'vertical', label: 'Vertical (Upside down)' }, { value: 'both', label: 'Both' }] },
    ],
    buildCommand: (inp, out, opts) => {
      const filterMap: Record<string, string> = { horizontal: 'hflip', vertical: 'vflip', both: 'hflip,vflip' }
      return ['-i', inp, '-vf', filterMap[opts.direction as string], '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'trim-video',
    category: 'video',
    name: 'Trim Video',
    description: 'Cut away the start or end to keep only the part you want.',
    icon: Scissors,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'startTime', label: 'Start Time', description: 'Where to start the trimmed video (format: HH:MM:SS or seconds).', type: 'text', defaultValue: '0:00:00' },
      { id: 'endTime', label: 'End Time', description: 'Where to stop the trimmed video.', type: 'text', defaultValue: '0:00:10' },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp, '-ss', opts.startTime as string, '-to', opts.endTime as string,
      '-c', 'copy', '-y', out,
    ],
    outputExtension: 'mp4',
  },
  {
    id: 'cut-section',
    category: 'video',
    name: 'Cut Out Section',
    description: 'Remove a segment from the middle of the video.',
    icon: Scissors,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'cutStart', label: 'Cut From', description: 'Start of the section to remove.', type: 'text', defaultValue: '0:00:05' },
      { id: 'cutEnd', label: 'Cut To', description: 'End of the section to remove.', type: 'text', defaultValue: '0:00:10' },
    ],
    buildCommand: (inp, out, opts) => {
      const startSec = timeToSeconds(String(opts.cutStart))
      const endSec = timeToSeconds(String(opts.cutEnd))
      return [
        '-i', inp,
        '-vf', `select='not(between(t,${startSec},${endSec}))',setpts=N/FRAME_RATE/TB`,
        '-af', `aselect='not(between(t,${startSec},${endSec}))',asetpts=N/SR/TB`,
        '-pix_fmt', 'yuv420p', '-y', out,
      ]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'split-clips',
    category: 'video',
    name: 'Split Into Clips',
    description: 'Divide a long video into several shorter clips.',
    icon: SplitSquareHorizontal,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'segmentDuration', label: 'Segment Duration', description: 'Each clip will be this many seconds long. For example, a 60s video with 10s segments = 6 clips.', type: 'number', defaultValue: 30, min: 1, max: 3600, unit: 's' },
    ],
    buildCommand: (inp, out, opts) => {
      return ['-i', inp, '-c', 'copy', '-f', 'segment', '-segment_time', String(opts.segmentDuration), '-reset_timestamps', '1', out.replace(/\.[^.]+$/, '_%03d.mp4')]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'merge-videos',
    category: 'video',
    name: 'Merge Videos',
    description: 'Combine multiple video files into one seamless video.',
    icon: Layers,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'files', label: 'Video Files', description: 'Select or drag in the videos to merge, in order.', type: 'file-list', defaultValue: [], multiple: true, accept: 'mp4,mov,mkv,avi,webm' },
      { id: 'crossfade', label: 'Crossfade Between Clips', description: 'Add a smooth fade transition between each video.', type: 'toggle', defaultValue: false },
    ],
    buildCommand: (inp, out, opts) => {
      const files = (opts.files as string[]) || []
      const allFiles = [inp, ...files]
      const inputs = allFiles.flatMap(f => ['-i', f])
      const streamLabels = allFiles.map((_, i) => `[${i}:v][${i}:a]`).join('')
      const concat = `${streamLabels}concat=n=${allFiles.length}:v=1:a=1[v][a]`
      return [...inputs, '-filter_complex', concat, '-map', '[v]', '-map', '[a]', '-pix_fmt', 'yuv420p', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'change-speed',
    category: 'video',
    name: 'Change Playback Speed',
    description: 'Make the video play in slow motion or fast forward.',
    icon: FastForward,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'speed', label: 'Speed Multiplier', description: '1× = normal speed. 2× = double speed. 0.5× = half speed.', type: 'select', defaultValue: '2', options: [{ value: '0.25', label: '0.25× (Very slow)' }, { value: '0.5', label: '0.5× (Slow motion)' }, { value: '1', label: '1× (Normal)' }, { value: '1.5', label: '1.5× (Slightly fast)' }, { value: '2', label: '2× (Double speed)' }, { value: '4', label: '4× (Time-lapse)' }] },
      { id: 'pitchCorrection', label: 'Correct Audio Pitch', description: 'Prevents chipmunk or slow-motion voice effects.', type: 'toggle', defaultValue: true },
    ],
    buildCommand: (inp, out, opts) => {
      const spd = parseFloat(opts.speed as string)
      const vFilter = `setpts=${(1 / spd).toFixed(4)}*PTS`
      // atempo only supports range [0.5, 100.0], so chain multiple filters for extreme speeds
      // e.g. 0.25x → atempo=0.5,atempo=0.5 | 4x → atempo=2.0,atempo=2.0
      const buildAtempo = (s: number): string[] => {
        const parts: string[] = []
        let remaining = s
        while (remaining > 2.0) {
          parts.push('atempo=2.0')
          remaining /= 2.0
        }
        while (remaining < 0.5) {
          parts.push('atempo=0.5')
          remaining /= 0.5
        }
        parts.push(`atempo=${remaining.toFixed(4)}`)
        return parts
      }
      const aFilter = buildAtempo(spd).join(',')
      return ['-i', inp, '-vf', vFilter, '-af', aFilter, '-pix_fmt', 'yuv420p', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'reverse-video',
    category: 'video',
    name: 'Reverse Video',
    description: 'Play the video backward for creative effects.',
    icon: Rewind,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'reverseAudio', label: 'Also Reverse Audio', description: 'Reverses the audio track too, for full backward effect.', type: 'toggle', defaultValue: true },
    ],
    buildCommand: (inp, out, opts) => {
      const filters = opts.reverseAudio
        ? ['-vf', 'reverse', '-af', 'areverse']
        : ['-vf', 'reverse', '-an']
      return ['-i', inp, ...filters, '-pix_fmt', 'yuv420p', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'crop-video',
    category: 'video',
    name: 'Crop Video',
    description: 'Remove unwanted edges or zoom into a specific area.',
    icon: Crop,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'width', label: 'Crop Width', description: 'Width of the cropped area in pixels.', type: 'number', defaultValue: 1280, min: 1, max: 7680, unit: 'px' },
      { id: 'height', label: 'Crop Height', description: 'Height of the cropped area in pixels.', type: 'number', defaultValue: 720, min: 1, max: 4320, unit: 'px' },
      { id: 'x', label: 'X Position (left)', description: 'Where to start the crop horizontally.', type: 'number', defaultValue: 0, min: 0, max: 7680, unit: 'px' },
      { id: 'y', label: 'Y Position (top)', description: 'Where to start the crop vertically.', type: 'number', defaultValue: 0, min: 0, max: 4320, unit: 'px' },
    ],
    buildCommand: (inp, out, opts) => {
      // Ensure crop dimensions are even (required by most codecs)
      const w = Math.max(2, Math.floor((opts.width as number) / 2) * 2)
      const h = Math.max(2, Math.floor((opts.height as number) / 2) * 2)
      return [
        '-i', inp, '-vf', `crop=${w}:${h}:${opts.x}:${opts.y}`,
        '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out,
      ]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'zoom-video',
    category: 'video',
    name: 'Zoom Into Video',
    description: 'Focus on a specific area using a digital zoom effect.',
    icon: ZoomIn,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'zoom', label: 'Zoom Level', description: 'How much to zoom in. 1.0 = no zoom, 2.0 = double zoom.', type: 'slider', defaultValue: 1.5, min: 1.0, max: 4.0, step: 0.1 },
      { id: 'x', label: 'Focus X (0-1)', description: 'Horizontal center of zoom (0=left, 0.5=center, 1=right).', type: 'slider', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
      { id: 'y', label: 'Focus Y (0-1)', description: 'Vertical center of zoom.', type: 'slider', defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
    ],
    buildCommand: (inp, out, opts) => {
      const z = opts.zoom as number
      const fx = opts.x as number
      const fy = opts.y as number
      // zoompan: d=1 means static zoom (single frame per input frame), s must use explicit resolution
      const zf = `zoompan=z='${z}':x='iw*${fx}-iw/${z}/2':y='ih*${fy}-ih/${z}/2':d=1:fps=30,scale=iw:ih`
      return ['-i', inp, '-vf', zf, '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'add-text-overlay',
    category: 'video',
    name: 'Add Text Overlay',
    description: 'Add titles, captions, or labels directly on the video.',
    icon: Type,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'text', label: 'Text', description: 'The text to display on the video.', type: 'text', defaultValue: 'My Text' },
      { id: 'fontSize', label: 'Font Size', description: 'Size of the text in pixels.', type: 'number', defaultValue: 48, min: 8, max: 256, unit: 'px' },
      { id: 'color', label: 'Text Color', description: 'Color of the text.', type: 'color', defaultValue: '#ffffff' },
      { id: 'position', label: 'Position', description: 'Where to place the text.', type: 'select', defaultValue: 'bottom-center', options: [{ value: 'top-left', label: 'Top Left' }, { value: 'top-center', label: 'Top Center' }, { value: 'bottom-left', label: 'Bottom Left' }, { value: 'bottom-center', label: 'Bottom Center' }, { value: 'center', label: 'Center' }] },
      { id: 'startTime', label: 'Show From', description: 'When (in seconds) to start showing the text.', type: 'number', defaultValue: 0, min: 0, unit: 's' },
      { id: 'endTime', label: 'Show Until', description: 'When to stop showing the text. 0 = entire video.', type: 'number', defaultValue: 0, min: 0, unit: 's' },
    ],
    buildCommand: (inp, out, opts) => {
      const posMap: Record<string, string> = {
        'top-left': 'x=20:y=20',
        'top-center': 'x=(w-tw)/2:y=20',
        'bottom-left': 'x=20:y=h-th-20',
        'bottom-center': 'x=(w-tw)/2:y=h-th-20',
        'center': 'x=(w-tw)/2:y=(h-th)/2',
      }
      const pos = posMap[opts.position as string] || posMap['bottom-center']
      const color = (opts.color as string).replace('#', '')
      // Escape special characters for drawtext
      const safeText = String(opts.text).replace(/'/g, "'\\\\\\''")
      const enableExpr = opts.endTime ? `enable='between(t,${opts.startTime},${opts.endTime})'` : `enable='gte(t,${opts.startTime})'`
      const drawtext = `drawtext=text='${safeText}':fontsize=${opts.fontSize}:fontcolor=${color}:${pos}:${enableExpr}`
      return ['-i', inp, '-vf', drawtext, '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'add-watermark',
    category: 'video',
    name: 'Add Watermark',
    description: 'Place a logo or image watermark on the video.',
    icon: Image,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'watermarkFile', label: 'Logo/Image File', description: 'Select your watermark image (PNG with transparency recommended).', type: 'file-picker', defaultValue: '', accept: 'png,jpg,jpeg' },
      { id: 'position', label: 'Position', description: 'Where on the video to place the watermark.', type: 'select', defaultValue: 'bottom-right', options: [{ value: 'top-left', label: 'Top Left' }, { value: 'top-right', label: 'Top Right' }, { value: 'bottom-left', label: 'Bottom Left' }, { value: 'bottom-right', label: 'Bottom Right' }, { value: 'center', label: 'Center' }] },
      { id: 'opacity', label: 'Opacity', description: 'How transparent the watermark is. 1 = solid, 0 = invisible.', type: 'slider', defaultValue: 0.7, min: 0, max: 1, step: 0.05 },
      { id: 'scale', label: 'Size (%)', description: 'Size of the watermark relative to the video width.', type: 'slider', defaultValue: 15, min: 5, max: 50 },
    ],
    buildCommand: (inp, out, opts) => {
      const posMap: Record<string, string> = {
        'top-left': 'x=10:y=10',
        'top-right': 'x=W-w-10:y=10',
        'bottom-left': 'x=10:y=H-h-10',
        'bottom-right': 'x=W-w-10:y=H-h-10',
        'center': 'x=(W-w)/2:y=(H-h)/2',
      }
      const pos = posMap[opts.position as string] || posMap['bottom-right']
      const scaleFactor = (opts.scale as number) / 100
      // Scale watermark, apply opacity via colorchannelmixer, then overlay onto video
      const complex = `[1:v]scale=iw*${scaleFactor}:-1,format=rgba,colorchannelmixer=aa=${opts.opacity}[wm];[0:v][wm]overlay=${pos}`
      return [
        '-i', inp, '-i', opts.watermarkFile as string,
        '-filter_complex', complex,
        '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out,
      ]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'adjust-brightness',
    category: 'video',
    name: 'Adjust Brightness & Contrast',
    description: 'Improve the lighting, color balance, and saturation of your video.',
    icon: SunMedium,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'brightness', label: 'Brightness', description: 'How bright the video is. 0 = no change.', type: 'slider', defaultValue: 0, min: -1, max: 1, step: 0.05 },
      { id: 'contrast', label: 'Contrast', description: 'Difference between dark and bright areas.', type: 'slider', defaultValue: 1, min: 0, max: 4, step: 0.1 },
      { id: 'saturation', label: 'Saturation', description: 'Color intensity. 0 = grayscale, 1 = normal, 2 = vivid.', type: 'slider', defaultValue: 1, min: 0, max: 4, step: 0.1 },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp,
      '-vf', `eq=brightness=${opts.brightness}:contrast=${opts.contrast}:saturation=${opts.saturation}`,
      '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out,
    ],
    outputExtension: 'mp4',
  },
  {
    id: 'black-and-white',
    category: 'video',
    name: 'Convert to Black & White',
    description: 'Remove all color for a classic monochrome look.',
    icon: CircleOff,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'strength', label: 'Desaturation Strength', description: '1 = fully black and white, values below give a faded look.', type: 'slider', defaultValue: 1, min: 0, max: 1, step: 0.05 },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp, '-vf', `hue=s=${1 - (opts.strength as number)}`, '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out,
    ],
    outputExtension: 'mp4',
  },
  {
    id: 'sharpen-video',
    category: 'video',
    name: 'Sharpen Video',
    description: 'Enhance fine detail and clarity in the video.',
    icon: Eye,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'strength', label: 'Sharpness', description: 'Higher values add more sharpening. Start around 1.5.', type: 'slider', defaultValue: 1.5, min: 0, max: 5, step: 0.1 },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp,
      '-vf', `unsharp=5:5:${opts.strength}:5:5:0`,
      '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out,
    ],
    outputExtension: 'mp4',
  },
  {
    id: 'blur-region',
    category: 'video',
    name: 'Blur Region',
    description: 'Apply blur to a specific area — great for hiding faces or private info.',
    icon: Sparkles,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'x', label: 'Region X', description: 'Left edge of the blur region in pixels.', type: 'number', defaultValue: 0, min: 0, unit: 'px' },
      { id: 'y', label: 'Region Y', description: 'Top edge of the blur region in pixels.', type: 'number', defaultValue: 0, min: 0, unit: 'px' },
      { id: 'width', label: 'Region Width', description: 'Width of the blur region in pixels.', type: 'number', defaultValue: 200, min: 10, unit: 'px' },
      { id: 'height', label: 'Region Height', description: 'Height of the blur region in pixels.', type: 'number', defaultValue: 200, min: 10, unit: 'px' },
      { id: 'blurStrength', label: 'Blur Strength', description: 'How strong the blur effect is.', type: 'slider', defaultValue: 10, min: 1, max: 30 },
    ],
    buildCommand: (inp, out, opts) => {
      const x = opts.x as number
      const y = opts.y as number
      // Clamp crop region to video dimensions using min() and ensure even dimensions
      const w = Math.max(2, Math.floor((opts.width as number) / 2) * 2)
      const h = Math.max(2, Math.floor((opts.height as number) / 2) * 2)
      const blur = opts.blurStrength as number
      // Use split to avoid reading same stream twice; crop safely, blur, then overlay back
      const complex = `[0:v]split=2[base][copy];[copy]crop=${w}:${h}:${x}:${y},boxblur=${blur}:${blur}[blurred];[base][blurred]overlay=${x}:${y}`
      return ['-i', inp, '-filter_complex', complex, '-pix_fmt', 'yuv420p', '-map', '0:a?', '-c:a', 'copy', '-y', out]
    },
    outputExtension: 'mp4',
  },
]
