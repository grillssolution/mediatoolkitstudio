import { Layers, GitBranch, Terminal, Code2 } from 'lucide-react'
import type { Tool } from '@/types'

export const advancedTools: Tool[] = [
  {
    id: 'batch-process',
    category: 'advanced',
    name: 'Batch Process',
    description: 'Apply any tool to multiple files at once. Process entire folders of videos in one go.',
    icon: Layers,
    acceptedInputTypes: ['any'],
    requiresInput: false,
    options: [
      { id: 'files', label: 'Input Files', description: 'Select all the files to process.', type: 'file-list', defaultValue: [], multiple: true, accept: '*' },
      { id: 'outputPattern', label: 'Output Name Pattern', description: 'Use {name} for the original filename and {ext} for the extension. Example: {name}_processed.{ext}', type: 'text', defaultValue: '{name}_output.{ext}' },
      { id: 'concurrency', label: 'Concurrent Jobs', description: 'How many files to process at the same time. Higher = faster but uses more CPU.', type: 'slider', defaultValue: 1, min: 1, max: 8 },
    ],
    buildCommand: (inp, out) => ['-i', inp, '-c', 'copy', '-y', out],
    outputExtension: 'mp4',
  },
  {
    id: 'custom-workflow',
    category: 'advanced',
    name: 'Custom Workflow',
    description: 'Chain multiple operations (trim → resize → compress) into one efficient pass.',
    icon: GitBranch,
    acceptedInputTypes: ['any'],
    requiresInput: true,
    options: [
      { id: 'description', label: 'Workflow Steps', description: 'Describe the steps you want to chain together. For example: Trim from 0:00 to 0:30, then scale to 720p, then compress.', type: 'textarea', defaultValue: '' },
    ],
    buildCommand: (inp, out) => ['-i', inp, '-c', 'copy', '-y', out],
    outputExtension: 'mp4',
  },
  {
    id: 'view-ffmpeg-command',
    category: 'advanced',
    name: 'View FFmpeg Command',
    description: 'See exactly what FFmpeg command any tool would run. Great for learning.',
    icon: Code2,
    acceptedInputTypes: ['any'],
    requiresInput: false,
    options: [],
    buildCommand: () => [],
    outputExtension: 'txt',
  },
  {
    id: 'run-custom-command',
    category: 'advanced',
    name: 'Run Custom Command',
    description: 'Type or paste your own FFmpeg command and execute it directly.',
    icon: Terminal,
    acceptedInputTypes: ['any'],
    requiresInput: false,
    options: [
      { id: 'command', label: 'FFmpeg Command', description: 'Enter your FFmpeg command. Use {input} and {output} as placeholders for the file paths.', type: 'textarea', defaultValue: 'ffmpeg -i {input} -c copy {output}' },
    ],
    buildCommand: (inp, out, opts) => {
      const cmd = (opts.command as string)
        .replace('{input}', inp)
        .replace('{output}', out)
        .split(' ')
        .filter(Boolean)
        .slice(1) // remove 'ffmpeg' prefix if present
      return cmd
    },
    outputExtension: 'mp4',
  },
]
