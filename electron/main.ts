import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { runFFmpeg, cancelFFmpeg, probeFile } from './ffmpeg-runner.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'default',
    icon: isDev ? path.join(__dirname, '../public/icon.png') : path.join(__dirname, '../dist/icon.png'),
    show: false,
  })

  // Remove the default File/Edit/View menu bar
  win.setMenu(null)

  win.once('ready-to-show', () => {
    win.show()
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Intercept links checking if target="_blank"
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      require('electron').shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  return win
}

app.whenReady().then(() => {
  const win = createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // ─── IPC: FFmpeg ───────────────────────────────────────────────────────────

  ipcMain.handle('run-ffmpeg', async (event, jobId: string, command: string[], outputPath: string) => {
    return runFFmpeg(jobId, command, outputPath, (type: any, data: any) => {
      event.sender.send(`ffmpeg-event-${jobId}`, { type, data })
    })
  })

  ipcMain.handle('cancel-ffmpeg', async (_, jobId: string) => {
    cancelFFmpeg(jobId)
  })

  ipcMain.handle('probe-file', async (_, filePath: string) => {
    return probeFile(filePath)
  })

  // ─── IPC: File System ──────────────────────────────────────────────────────

  ipcMain.handle('open-file', async (_, filePath: string) => {
    shell.openPath(filePath)
  })

  ipcMain.handle('open-folder', async (_, folderPath: string) => {
    shell.showItemInFolder(folderPath)
  })

  ipcMain.handle('pick-file', async (_, opts: { multiple?: boolean; accept?: string[] }) => {
    const result = await dialog.showOpenDialog(win, {
      properties: opts.multiple ? ['openFile', 'multiSelections'] : ['openFile'],
      filters: opts.accept
        ? [{ name: 'Media Files', extensions: opts.accept }]
        : [{ name: 'All Files', extensions: ['*'] }],
    })
    return result.filePaths
  })

  ipcMain.handle('pick-folder', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    })
    return result.filePaths[0] || null
  })

  // ─── IPC: Settings ────────────────────────────────────────────────────────

  const settingsPath = path.join(app.getPath('userData'), 'settings.json')
  const historyPath = path.join(app.getPath('userData'), 'job-history.json')

  ipcMain.handle('get-settings', async () => {
    try {
      if (fs.existsSync(settingsPath)) {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      }
    } catch {}
    return null
  })

  ipcMain.handle('save-settings', async (_, settings: unknown) => {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  })

  ipcMain.handle('get-job-history', async () => {
    try {
      if (fs.existsSync(historyPath)) {
        return JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
      }
    } catch {}
    return []
  })

  ipcMain.handle('save-job-history', async (_, jobs: unknown) => {
    fs.writeFileSync(historyPath, JSON.stringify(jobs, null, 2))
  })

  ipcMain.handle('get-default-output-folder', async () => {
    return app.getPath('videos')
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
