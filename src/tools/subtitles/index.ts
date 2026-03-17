import { Captions, Flame, FileOutput, RefreshCw, Clock } from 'lucide-react'
import type { Tool } from '@/types'

export const subtitleTools: Tool[] = [
  {
    id: 'add-subtitles',
    category: 'subtitles',
    name: 'Add Subtitles',
    description: 'Attach a subtitle file so it appears in media players that support it.',
    icon: Captions,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'subtitleFile', label: 'Subtitle File', description: 'Choose an SRT, VTT, or ASS subtitle file.', type: 'file-picker', defaultValue: '', accept: 'srt,vtt,ass,ssa,sub' },
      { id: 'language', label: 'Language Tag', description: 'Language code for the subtitle track (e.g. "en" for English).', type: 'text', defaultValue: 'en' },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp, '-i', opts.subtitleFile as string,
      '-c', 'copy', '-c:s', 'mov_text',
      '-metadata:s:s:0', `language=${opts.language}`,
      '-y', out,
    ],
    outputExtension: 'mp4',
  },
  {
    id: 'burn-subtitles',
    category: 'subtitles',
    name: 'Burn Subtitles',
    description: 'Permanently embed subtitles into the video frames so they always show.',
    icon: Flame,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'subtitleFile', label: 'Subtitle File', description: 'The subtitle file to burn in.', type: 'file-picker', defaultValue: '', accept: 'srt,vtt,ass,ssa' },
      { id: 'fontSize', label: 'Font Size', description: 'Size of the subtitle text.', type: 'number', defaultValue: 22, min: 10, max: 60, unit: 'pt' },
      { id: 'position', label: 'Position', description: 'Where to place the subtitles.', type: 'select', defaultValue: 'bottom', options: [{ value: 'bottom', label: 'Bottom (Standard)' }, { value: 'top', label: 'Top' }, { value: 'middle', label: 'Middle' }] },
    ],
    buildCommand: (inp, out, opts) => {
      const subFile = (opts.subtitleFile as string).replace(/\\/g, '/').replace(/:/g, '\\:')
      const alignmentMap: Record<string, number> = { top: 8, middle: 5, bottom: 2 }
      const alignment = alignmentMap[opts.position as string] || 2
      return [
        '-i', inp,
        '-vf', `subtitles='${subFile}':force_style='FontSize=${opts.fontSize},Alignment=${alignment}'`,
        '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-y', out,
      ]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'extract-subtitles',
    category: 'subtitles',
    name: 'Extract Subtitles',
    description: 'Save embedded subtitle tracks from a video file to an external file.',
    icon: FileOutput,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'trackIndex', label: 'Track Index', description: 'If the video has multiple subtitle tracks, choose which one to extract (0 = first).', type: 'number', defaultValue: 0, min: 0, max: 20 },
      { id: 'format', label: 'Output Format', description: 'Which subtitle format to save as.', type: 'select', defaultValue: 'srt', options: [{ value: 'srt', label: 'SRT' }, { value: 'vtt', label: 'WebVTT' }, { value: 'ass', label: 'ASS/SSA' }] },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp, '-map', `0:s:${opts.trackIndex}`, '-y', out,
    ],
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'convert-subtitle-format',
    category: 'subtitles',
    name: 'Convert Subtitle Format',
    description: 'Change subtitle files between SRT, VTT, ASS, and other formats.',
    icon: RefreshCw,
    acceptedInputTypes: ['subtitle'],
    requiresInput: true,
    options: [
      { id: 'format', label: 'Output Format', description: 'Target subtitle format.', type: 'select', defaultValue: 'vtt', options: [{ value: 'srt', label: 'SRT (SubRip)' }, { value: 'vtt', label: 'WebVTT' }, { value: 'ass', label: 'ASS/SSA' }] },
    ],
    buildCommand: (inp, out) => ['-i', inp, '-y', out],
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'fix-subtitle-timing',
    category: 'subtitles',
    name: 'Fix Subtitle Timing',
    description: 'Shift all subtitle timings earlier or later to fix sync issues.',
    icon: Clock,
    acceptedInputTypes: ['subtitle'],
    requiresInput: true,
    options: [
      { id: 'offset', label: 'Time Offset', description: 'Positive = shift later (delay), negative = shift earlier. In seconds.', type: 'number', defaultValue: 0, min: -60, max: 60, step: 0.1, unit: 's' },
    ],
    buildCommand: (inp, out, opts) => {
      const offset = Number(opts.offset) || 0
      return ['-itsoffset', String(offset), '-i', inp, '-c', 'copy', '-y', out]
    },
    outputExtension: 'srt',
  },
]
