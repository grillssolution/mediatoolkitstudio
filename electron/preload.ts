import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, Job, JobProgress } from '../src/types'

contextBridge.exposeInMainWorld('electronAPI', {
  runFFmpeg: (jobId: string, command: string[], outputPath: string) =>
    ipcRenderer.invoke('run-ffmpeg', jobId, command, outputPath),

  cancelFFmpeg: (jobId: string) =>
    ipcRenderer.invoke('cancel-ffmpeg', jobId),

  probeFile: (filePath: string) =>
    ipcRenderer.invoke('probe-file', filePath),

  openFile: (filePath: string) =>
    ipcRenderer.invoke('open-file', filePath),

  openFolder: (folderPath: string) =>
    ipcRenderer.invoke('open-folder', folderPath),

  pickFile: (options: { multiple?: boolean; accept?: string[] }) =>
    ipcRenderer.invoke('pick-file', options),

  pickFolder: () =>
    ipcRenderer.invoke('pick-folder'),

  getSettings: () =>
    ipcRenderer.invoke('get-settings'),

  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke('save-settings', settings),

  getJobHistory: () =>
    ipcRenderer.invoke('get-job-history'),

  saveJobHistory: (jobs: Job[]) =>
    ipcRenderer.invoke('save-job-history', jobs),

  getDefaultOutputFolder: () =>
    ipcRenderer.invoke('get-default-output-folder'),

  onFFmpegProgress: (jobId: string, callback: (progress: JobProgress) => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: { type: string; data: JobProgress }) => {
      if (event.type === 'progress') callback(event.data)
    }
    ipcRenderer.on(`ffmpeg-event-${jobId}`, handler)
    return () => ipcRenderer.removeListener(`ffmpeg-event-${jobId}`, handler)
  },

  onFFmpegLog: (jobId: string, callback: (log: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: { type: string; data: string }) => {
      if (event.type === 'log') callback(event.data)
    }
    ipcRenderer.on(`ffmpeg-event-${jobId}`, handler)
    return () => ipcRenderer.removeListener(`ffmpeg-event-${jobId}`, handler)
  },
})
