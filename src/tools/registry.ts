import { videoTools } from './video'
import { audioTools } from './audio'
import { subtitleTools } from './subtitles'
import { imageTools } from './images'
import { streamingTools } from './streaming'
import { metadataTools } from './metadata'
import { advancedTools } from './advanced'
import type { Tool, ToolCategory } from '@/types'

export const allTools: Tool[] = [
  ...videoTools,
  ...audioTools,
  ...subtitleTools,
  ...imageTools,
  ...streamingTools,
  ...metadataTools,
  ...advancedTools,
]

export const toolsByCategory: Record<ToolCategory, Tool[]> = {
  video: videoTools,
  audio: audioTools,
  subtitles: subtitleTools,
  images: imageTools,
  streaming: streamingTools,
  metadata: metadataTools,
  advanced: advancedTools,
}

export const getToolById = (id: string): Tool | undefined =>
  allTools.find(t => t.id === id)

export const categoryConfig: Record<ToolCategory, {
  label: string
  color: string
  textColor: string
  bgColor: string
  borderColor: string
  emoji: string
}> = {
  video: {
    label: 'Video',
    color: '#3b82f6',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    emoji: '🎬',
  },
  audio: {
    label: 'Audio',
    color: '#22c55e',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    emoji: '🎵',
  },
  subtitles: {
    label: 'Subtitles',
    color: '#a855f7',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    emoji: '💬',
  },
  images: {
    label: 'Image & GIF',
    color: '#f97316',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    emoji: '🖼️',
  },
  streaming: {
    label: 'Streaming & Web',
    color: '#06b6d4',
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    emoji: '📡',
  },
  metadata: {
    label: 'Metadata',
    color: '#eab308',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    emoji: '🏷️',
  },
  advanced: {
    label: 'Advanced',
    color: '#6b7280',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    emoji: '⚙️',
  },
}
