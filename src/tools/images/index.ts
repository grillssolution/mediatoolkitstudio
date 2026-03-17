import { Film, Grid3X3, ImageIcon, Layers, Images } from 'lucide-react'
import type { Tool } from '@/types'

export const imageTools: Tool[] = [
  {
    id: 'create-gif',
    category: 'images',
    name: 'Create GIF',
    description: 'Turn a short video clip into an animated GIF for sharing.',
    icon: Film,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'startTime', label: 'Start Time', description: 'Where in the video to start the GIF.', type: 'text', defaultValue: '0:00:00' },
      { id: 'duration', label: 'Duration', description: 'How many seconds long the GIF should be.', type: 'number', defaultValue: 3, min: 0.5, max: 30, unit: 's' },
      { id: 'fps', label: 'Frame Rate', description: 'Higher FPS = smoother but larger file.', type: 'number', defaultValue: 15, min: 5, max: 30, unit: 'fps' },
      { id: 'width', label: 'Width', description: 'Width of the GIF in pixels.', type: 'number', defaultValue: 480, min: 50, max: 1920, unit: 'px' },
    ],
    buildCommand: (inp, out, opts) => [
      '-ss', opts.startTime as string,
      '-t', String(opts.duration),
      '-i', inp,
      '-vf', `fps=${opts.fps},scale=${opts.width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
      '-y', out,
    ],
    outputExtension: 'gif',
  },
  {
    id: 'extract-frames',
    category: 'images',
    name: 'Extract Frames',
    description: 'Save individual frames from a video as image files.',
    icon: Grid3X3,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'interval', label: 'Interval', description: 'Save one frame every N seconds. Set to 0 for every frame.', type: 'number', defaultValue: 1, min: 0, step: 0.1, unit: 's' },
      { id: 'format', label: 'Image Format', description: 'PNG is lossless, JPG is smaller.', type: 'select', defaultValue: 'jpg', options: [{ value: 'jpg', label: 'JPEG' }, { value: 'png', label: 'PNG (Lossless)' }, { value: 'webp', label: 'WebP' }] },
    ],
    buildCommand: (inp, out, opts) => {
      const vf = opts.interval && Number(opts.interval) > 0 ? `fps=1/${opts.interval}` : 'fps=1'
      return ['-i', inp, '-vf', vf, '-y', out.replace(/\.\w+$/, `_%04d.${opts.format}`)]
    },
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'create-thumbnail',
    category: 'images',
    name: 'Create Thumbnail',
    description: 'Generate a preview image from a specific moment in the video.',
    icon: ImageIcon,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'timestamp', label: 'Timestamp', description: 'Which moment in the video to capture as a thumbnail.', type: 'text', defaultValue: '0:00:01' },
      { id: 'format', label: 'Image Format', description: 'File format for the thumbnail.', type: 'select', defaultValue: 'jpg', options: [{ value: 'jpg', label: 'JPEG' }, { value: 'png', label: 'PNG' }, { value: 'webp', label: 'WebP' }] },
      { id: 'width', label: 'Width', description: 'Thumbnail width in pixels. Height auto-calculated.', type: 'number', defaultValue: 1280, min: 100, max: 3840, unit: 'px' },
    ],
    buildCommand: (inp, out, opts) => [
      '-ss', opts.timestamp as string,
      '-i', inp,
      '-vframes', '1',
      '-vf', `scale=${opts.width}:-2`,
      '-y', out,
    ],
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'video-to-image-sequence',
    category: 'images',
    name: 'Video to Image Sequence',
    description: 'Export every frame of a video as a numbered image file.',
    icon: Layers,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'format', label: 'Image Format', description: 'Format for each exported frame.', type: 'select', defaultValue: 'png', options: [{ value: 'png', label: 'PNG (Lossless)' }, { value: 'jpg', label: 'JPEG (Smaller)' }] },
      { id: 'startFrame', label: 'Start Frame', description: 'Which frame to start from. 0 = beginning.', type: 'number', defaultValue: 0, min: 0 },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp, '-vf', `select='gte(n,${opts.startFrame})'`, '-vsync', 'vfr',
      out.replace(/\.\w+$/, `_%06d.${opts.format}`),
    ],
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'slideshow-from-images',
    category: 'images',
    name: 'Slideshow from Images',
    description: 'Turn a collection of images into a video slideshow.',
    icon: Images,
    acceptedInputTypes: ['image'],
    requiresInput: true,
    options: [
      { id: 'files', label: 'Image Files', description: 'Select images in the order they should appear.', type: 'file-list', defaultValue: [], multiple: true, accept: 'jpg,jpeg,png,webp' },
      { id: 'duration', label: 'Duration Per Image', description: 'How many seconds each image is shown.', type: 'number', defaultValue: 3, min: 0.5, max: 60, unit: 's' },
      { id: 'transition', label: 'Transition', description: 'Effect between slides.', type: 'select', defaultValue: 'fade', options: [{ value: 'none', label: 'None (Cut)' }, { value: 'fade', label: 'Fade' }] },
      { id: 'audioFile', label: 'Background Music (Optional)', description: 'Add background music to the slideshow.', type: 'file-picker', defaultValue: '', accept: 'mp3,wav,aac' },
      { id: 'fps', label: 'Output FPS', description: 'Frame rate of the output video.', type: 'number', defaultValue: 30, min: 10, max: 60, unit: 'fps' },
    ],
    buildCommand: (inp, out, opts) => {
      const dur = opts.duration as number
      const files = (opts.files as string[]) || []
      const allFiles = inp ? [inp, ...files] : files
      
      if (allFiles.length === 0) return []

      const inputs = allFiles.flatMap(f => ['-loop', '1', '-t', String(dur), '-i', f])
      
      // We need to scale them all to a uniform size (e.g. 1920x1080) to avoid concat errors
      // and map them into the concat filter
      const filters: string[] = []
      let concatInputStr = ''
      
      allFiles.forEach((_, i) => {
        filters.push(`[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`)
        concatInputStr += `[v${i}]`
      })
      
      filters.push(`${concatInputStr}concat=n=${allFiles.length}:v=1:a=0[outv]`)

      const audioInput = opts.audioFile ? ['-i', opts.audioFile as string] : []
      const audioMap = opts.audioFile ? ['-map', `${allFiles.length}:a`, '-shortest'] : []

      return [
        ...inputs,
        ...audioInput,
        '-filter_complex', filters.join(';'),
        '-map', '[outv]',
        ...audioMap,
        '-c:v', 'libx264', '-r', String(opts.fps), '-pix_fmt', 'yuv420p',
        '-y', out,
      ]
    },
    outputExtension: 'mp4',
  },
]
