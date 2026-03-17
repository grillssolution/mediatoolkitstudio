import {
  Music, RefreshCw, VolumeX, Volume2, BarChart2, Sliders, Radio, Wind
} from 'lucide-react'
import type { Tool } from '@/types'

export const audioTools: Tool[] = [
  {
    id: 'extract-audio',
    category: 'audio',
    name: 'Extract Audio',
    description: 'Save just the sound from a video as a standalone audio file.',
    icon: Music,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'format', label: 'Output Format', description: 'Audio file format for the extracted audio.', type: 'select', defaultValue: 'mp3', options: [{ value: 'mp3', label: 'MP3 (Most compatible)' }, { value: 'aac', label: 'AAC (High quality)' }, { value: 'wav', label: 'WAV (Uncompressed)' }, { value: 'flac', label: 'FLAC (Lossless)' }, { value: 'ogg', label: 'OGG (Open source)' }] },
      { id: 'bitrate', label: 'Audio Bitrate', description: 'Higher bitrate = better quality but larger file.', type: 'select', defaultValue: '192k', options: [{ value: '64k', label: '64 kbps (Small)' }, { value: '128k', label: '128 kbps (Good)' }, { value: '192k', label: '192 kbps (Great)' }, { value: '320k', label: '320 kbps (Best)' }] },
    ],
    buildCommand: (inp, out, opts) => ['-i', inp, '-vn', '-acodec', opts.format === 'wav' ? 'pcm_s16le' : opts.format === 'flac' ? 'flac' : opts.format === 'ogg' ? 'libvorbis' : opts.format === 'aac' ? 'aac' : 'libmp3lame', '-ab', opts.bitrate as string, '-y', out],
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'convert-audio',
    category: 'audio',
    name: 'Convert Audio Format',
    description: 'Change an audio file from one format to another.',
    icon: RefreshCw,
    acceptedInputTypes: ['audio'],
    requiresInput: true,
    options: [
      { id: 'format', label: 'Output Format', description: 'Target audio format.', type: 'select', defaultValue: 'mp3', options: [{ value: 'mp3', label: 'MP3' }, { value: 'aac', label: 'AAC' }, { value: 'wav', label: 'WAV' }, { value: 'flac', label: 'FLAC' }, { value: 'ogg', label: 'OGG' }, { value: 'opus', label: 'Opus' }, { value: 'm4a', label: 'M4A' }] },
      { id: 'bitrate', label: 'Bitrate', description: 'Audio quality. Not applicable to lossless formats like WAV and FLAC.', type: 'select', defaultValue: '192k', options: [{ value: '64k', label: '64 kbps' }, { value: '128k', label: '128 kbps' }, { value: '192k', label: '192 kbps' }, { value: '256k', label: '256 kbps' }, { value: '320k', label: '320 kbps' }] },
    ],
    buildCommand: (inp, out, opts) => {
      const codecMap: Record<string, string> = { mp3: 'libmp3lame', aac: 'aac', wav: 'pcm_s16le', flac: 'flac', ogg: 'libvorbis', opus: 'libopus', m4a: 'aac' }
      return ['-i', inp, '-acodec', codecMap[opts.format as string] || 'aac', '-ab', opts.bitrate as string, '-y', out]
    },
    outputExtension: (opts) => opts.format as string,
  },
  {
    id: 'remove-audio',
    category: 'audio',
    name: 'Remove Audio',
    description: 'Delete the audio track completely from a video file.',
    icon: VolumeX,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [],
    buildCommand: (inp, out) => ['-i', inp, '-an', '-c:v', 'copy', '-y', out],
    outputExtension: 'mp4',
  },
  {
    id: 'replace-audio',
    category: 'audio',
    name: 'Replace Audio',
    description: "Swap a video's existing audio track with a new audio file.",
    icon: Volume2,
    acceptedInputTypes: ['video'],
    requiresInput: true,
    options: [
      { id: 'audioFile', label: 'New Audio File', description: 'The audio file to use as the new soundtrack.', type: 'file-picker', defaultValue: '', accept: 'mp3,wav,aac,flac,ogg' },
      { id: 'offset', label: 'Audio Offset', description: 'Delay the new audio by this many seconds to sync it.', type: 'number', defaultValue: 0, min: -60, max: 60, unit: 's' },
    ],
    buildCommand: (inp, out, opts) => {
      const offset = Number(opts.offset) || 0
      const offsetFlag = offset !== 0 ? ['-itsoffset', String(offset)] : []
      return ['-i', inp, ...offsetFlag, '-i', opts.audioFile as string, '-c:v', 'copy', '-map', '0:v:0', '-map', '1:a:0', '-shortest', '-y', out]
    },
    outputExtension: 'mp4',
  },
  {
    id: 'normalize-volume',
    category: 'audio',
    name: 'Normalize Volume',
    description: 'Automatically balance the volume to a consistent level.',
    icon: BarChart2,
    acceptedInputTypes: ['video', 'audio'],
    requiresInput: true,
    options: [
      { id: 'targetLufs', label: 'Target Loudness (LUFS)', description: 'Standard loudness level. -14 LUFS is recommended for streaming platforms.', type: 'slider', defaultValue: -14, min: -30, max: -6, step: 0.5, unit: 'LUFS' },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp, '-af', `loudnorm=I=${opts.targetLufs}:TP=-1.5:LRA=11`, '-c:v', 'copy', '-y', out,
    ],
    outputExtension: 'mp4',
  },
  {
    id: 'change-bitrate',
    category: 'audio',
    name: 'Change Audio Bitrate',
    description: 'Adjust audio quality — higher bitrate sounds better but takes more space.',
    icon: Sliders,
    acceptedInputTypes: ['audio'],
    requiresInput: true,
    options: [
      { id: 'bitrate', label: 'Audio Bitrate', description: 'Higher = better quality. 128kbps is fine for most listening.', type: 'select', defaultValue: '192k', options: [{ value: '64k', label: '64 kbps (Voice only)' }, { value: '96k', label: '96 kbps (Podcast)' }, { value: '128k', label: '128 kbps (Music streaming)' }, { value: '192k', label: '192 kbps (High quality)' }, { value: '256k', label: '256 kbps' }, { value: '320k', label: '320 kbps (Best)' }] },
    ],
    buildCommand: (inp, out, opts) => ['-i', inp, '-b:a', opts.bitrate as string, '-y', out],
    outputExtension: 'mp3',
  },
  {
    id: 'change-sample-rate',
    category: 'audio',
    name: 'Change Sample Rate',
    description: 'Modify the audio sampling frequency for compatibility.',
    icon: Radio,
    acceptedInputTypes: ['audio'],
    requiresInput: true,
    options: [
      { id: 'sampleRate', label: 'Sample Rate', description: '44100 Hz is standard for music. 48000 Hz is standard for video.', type: 'select', defaultValue: '44100', options: [{ value: '22050', label: '22050 Hz (Low quality)' }, { value: '44100', label: '44100 Hz (CD quality)' }, { value: '48000', label: '48000 Hz (Professional)' }, { value: '96000', label: '96000 Hz (Studio)' }] },
    ],
    buildCommand: (inp, out, opts) => ['-i', inp, '-ar', opts.sampleRate as string, '-y', out],
    outputExtension: 'mp3',
  },
  {
    id: 'reduce-noise',
    category: 'audio',
    name: 'Reduce Background Noise',
    description: 'Clean up hiss, hum, or ambient noise from audio recordings.',
    icon: Wind,
    acceptedInputTypes: ['audio', 'video'],
    requiresInput: true,
    options: [
      { id: 'strength', label: 'Noise Reduction Strength', description: 'How aggressively to remove background noise. Too high may make voice sound hollow.', type: 'slider', defaultValue: 0.21, min: 0.01, max: 0.95, step: 0.01 },
    ],
    buildCommand: (inp, out, opts) => [
      '-i', inp, '-af', `anlmdn=s=${opts.strength}`, '-c:v', 'copy', '-y', out,
    ],
    outputExtension: 'mp4',
  },
]
