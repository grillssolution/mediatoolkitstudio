import { Wifi, List, Zap } from 'lucide-react'
import type { Tool } from '@/types'

export const streamingTools: Tool[] = [
  {
    id: 'prepare-for-web',
    category: 'streaming',
    name: 'Prepare for Web Streaming',
    description: 'Convert video for smooth playback in any web browser.',
    icon: Wifi,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'format', label: 'Format', description: 'MP4 works in all browsers. WebM is smaller but less supported.', type: 'select', defaultValue: 'mp4', options: [{ value: 'mp4', label: 'MP4 (Broadest support)' }, { value: 'webm', label: 'WebM (Smaller)' }] },
    ],
    buildCommand: (inp, out, opts) => {
      if (opts.format === 'webm') {
        return ['-i', inp, '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-pix_fmt', 'yuv420p', '-c:a', 'libopus', '-y', out]
      }
      return ['-i', inp, '-c:v', 'libx264', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', '-y', out]
    },
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'create-hls',
    category: 'streaming',
    name: 'Create HLS Stream',
    description: 'Generate segmented .m3u8 files for adaptive streaming systems.',
    icon: List,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'segmentDuration', label: 'Segment Duration', description: 'How long each stream segment is. 6 seconds is the standard.', type: 'number', defaultValue: 6, min: 1, max: 30, unit: 's' },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-f', 'hls',
      '-hls_time', String(opts.segmentDuration),
      '-hls_list_size', '0',
      '-hls_segment_filename', out.replace('.m3u8', '_%03d.ts'),
      '-y', out,
    ],
    outputExtension: 'm3u8',
  },
  {
    id: 'optimize-fast-loading',
    category: 'streaming',
    name: 'Optimize for Fast Loading',
    description: 'Reduce buffering and make videos start playing instantly online.',
    icon: Zap,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'targetBitrate', label: 'Target Bitrate', description: 'Overall bitrate to target. Lower = faster loading.', type: 'select', defaultValue: '1500k', options: [{ value: '500k', label: '500 kbps (Mobile)' }, { value: '1000k', label: '1 Mbps (Standard)' }, { value: '1500k', label: '1.5 Mbps (Good quality)' }, { value: '3000k', label: '3 Mbps (High quality)' }] },
      { id: 'twoPass', label: 'Two-Pass Encoding', description: 'Analyzes the video twice for better bitrate distribution. Slower but better.', type: 'toggle', defaultValue: false },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp,
      '-c:v', 'libx264', '-b:v', opts.targetBitrate as string,
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '128k',
      '-y', out,
    ],
    outputExtension: 'mp4',
  },
]
