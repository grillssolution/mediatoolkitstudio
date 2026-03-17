import { Info, Tag, Trash2 } from 'lucide-react'
import type { Tool } from '@/types'

export const metadataTools: Tool[] = [
  {
    id: 'view-file-info',
    category: 'metadata',
    name: 'View File Info',
    description: 'Show detailed technical information about any media file — resolution, codec, bitrate, duration.',
    icon: Info,
    acceptedInputTypes: ['video', 'audio', 'image', 'any'],
    requiresInput: true,
    options: [],
    buildCommand: () => [], // Handled specially — uses FFprobe only, no FFmpeg output needed
    outputExtension: 'json',
  },
  {
    id: 'edit-metadata',
    category: 'metadata',
    name: 'Edit Metadata',
    description: 'Change embedded title, artist, album, year, or other tag information.',
    icon: Tag,
    acceptedInputTypes: ['video', 'audio'],
    requiresInput: true,
    options: [
      { id: 'title', label: 'Title', description: 'The title of the media file.', type: 'text', defaultValue: '' },
      { id: 'artist', label: 'Artist', description: 'The creator or artist name.', type: 'text', defaultValue: '' },
      { id: 'album', label: 'Album', description: 'Album or series name.', type: 'text', defaultValue: '' },
      { id: 'year', label: 'Year', description: 'Year of creation or publication.', type: 'number', defaultValue: new Date().getFullYear(), min: 1900, max: 2100 },
      { id: 'comment', label: 'Comment', description: 'A note or description about the file.', type: 'text', defaultValue: '' },
    ],
    buildCommand: (inp, out, opts) => {
      const flags: string[] = []
      if (opts.title && String(opts.title).trim()) flags.push('-metadata', `title=${opts.title}`)
      if (opts.artist && String(opts.artist).trim()) flags.push('-metadata', `artist=${opts.artist}`)
      if (opts.album && String(opts.album).trim()) flags.push('-metadata', `album=${opts.album}`)
      if (opts.year !== undefined && opts.year !== null) flags.push('-metadata', `date=${opts.year}`)
      if (opts.comment && String(opts.comment).trim()) flags.push('-metadata', `comment=${opts.comment}`)
      return ['-i', inp, ...flags, '-c', 'copy', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'strip-metadata',
    category: 'metadata',
    name: 'Strip All Metadata',
    description: 'Remove all hidden embedded data from a file for privacy.',
    icon: Trash2,
    acceptedInputTypes: ['video', 'audio'],
    requiresInput: true,
    options: [],
    buildCommand: (inp, out) => ['-i', inp, '-map_metadata', '-1', '-c', 'copy', '-y', out],
    outputExtension: 'mp4',
  },
]
