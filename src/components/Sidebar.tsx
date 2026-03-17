import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Search, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { toolsByCategory, categoryConfig } from '@/tools/registry'
import type { ToolCategory } from '@/types'
import { cn } from '@/lib/utils'

const categories = Object.keys(categoryConfig) as ToolCategory[]

export function Sidebar() {
  const { activeTool, setActiveTool, activeCategory, setActiveCategory, sidebarCollapsed, setSidebarCollapsed, sidebarSearch, setSidebarSearch } = useAppStore()
  const [expandedCategories, setExpandedCategories] = useState<Set<ToolCategory>>(new Set(['video']))

  const toggleCategory = (cat: ToolCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
    setActiveCategory(cat)
  }

  const filteredTools = (cat: ToolCategory) => {
    const tools = toolsByCategory[cat]
    if (!sidebarSearch) return tools
    return tools.filter(t =>
      t.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(sidebarSearch.toLowerCase())
    )
  }

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 60 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col h-full border-r border-border bg-card/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-border min-h-[56px]">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">MS</span>
            </div>
            <span className="font-bold text-sm gradient-text truncate">Media Studio Toolkit</span>
          </motion.div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-accent transition-colors flex-shrink-0 no-drag"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
            : <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          }
        </button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 border-b border-border"
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tools…"
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-secondary rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool List */}
      <div className="flex-1 overflow-y-auto py-2 no-drag">
        {categories.map(cat => {
          const config = categoryConfig[cat]
          const tools = filteredTools(cat)
          const isExpanded = expandedCategories.has(cat)

          if (sidebarSearch && tools.length === 0) return null

          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'flex items-center w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all',
                  'hover:bg-accent rounded-lg mx-1',
                  sidebarCollapsed ? 'justify-center' : 'gap-2',
                  activeCategory === cat ? config.textColor : 'text-muted-foreground'
                )}
                title={sidebarCollapsed ? config.label : undefined}
              >
                <span className="text-base flex-shrink-0">{config.emoji}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">{config.label}</span>
                    <span className={cn('transition-transform', isExpanded ? 'rotate-0' : '-rotate-90')}>
                      <ChevronDown className="h-3 w-3" />
                    </span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {(isExpanded || sidebarSearch) && !sidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-2 space-y-0.5">
                      {tools.map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool)}
                          className={cn(
                            'tool-btn',
                            activeTool?.id === tool.id && 'active',
                            activeTool?.id === tool.id && config.bgColor,
                          )}
                          style={activeTool?.id === tool.id ? { color: config.color } : undefined}
                        >
                          <tool.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate text-xs">{tool.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.aside>
  )
}
