Here's your enhanced prompt:

---

# FFmpegStudio — Offline Desktop Media Processing Suite (Electron + FFmpeg)

## Project Overview

Build a **production-quality Windows desktop application using Electron** that wraps FFmpeg in a clean, polished graphical interface. The application acts as a fully offline, beginner-friendly media processing studio — transforming FFmpeg's command-line complexity into an intuitive, visual workflow anyone can use without technical knowledge.

All processing runs **100% locally** using the user's CPU. FFmpeg is bundled inside the application package. There are no uploads, no accounts, no internet dependencies, and no subscriptions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron (latest stable) |
| Frontend framework | React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| FFmpeg integration | `fluent-ffmpeg` (Node.js wrapper) |
| FFmpeg binary | Bundled via `ffmpeg-static` or manually included |
| State management | Zustand |
| File handling | Node.js `fs`, `path`, `child_process` |
| Build & packaging | Electron Builder (produces `.exe` installer) |

---

## Application Architecture

```
ffmpegstudio/
├── electron/
│   ├── main.ts              # Main process — window, IPC, FFmpeg bridge
│   ├── preload.ts           # Secure IPC bridge to renderer
│   └── ffmpeg-runner.ts     # FFmpeg command execution & progress parsing
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Sidebar.tsx          # Tool category navigation
│   │   ├── DropZone.tsx         # Drag-and-drop file input
│   │   ├── ToolPanel.tsx        # Dynamic form for selected tool
│   │   ├── ProgressBar.tsx      # Real-time FFmpeg progress
│   │   ├── JobHistory.tsx       # Past jobs with re-run support
│   │   ├── OutputManager.tsx    # Output file preview + actions
│   │   └── CommandViewer.tsx    # Live FFmpeg command preview
│   ├── tools/
│   │   ├── video/           # One file per video tool
│   │   ├── audio/           # One file per audio tool
│   │   ├── subtitles/
│   │   ├── images/
│   │   ├── streaming/
│   │   ├── metadata/
│   │   └── advanced/
│   └── store/
│       └── useAppStore.ts   # Global app state (Zustand)
├── public/
│   └── ffmpeg/              # Bundled FFmpeg + FFprobe binaries
└── electron-builder.yml
```

---

## UI / UX Design Specification

### Layout

The application uses a **three-panel layout**:

- **Left panel (Sidebar)** — Collapsible category tree listing all tools, grouped into sections with icons. Each tool entry includes its plain-language name. Active tool is highlighted.
- **Center panel (Workspace)** — The active tool's form. Contains: file drop zone, tool-specific options, action button, and progress display.
- **Right panel (Output & History)** — Output file preview (thumbnail for videos/images, waveform for audio), file size before/after comparison, open-in-folder button, and scrollable job history log.

### Visual Style

- **Theme:** Dark mode by default with optional light mode toggle
- **Typography:** Clean sans-serif (Inter or Geist), large readable labels
- **Color coding:** Each tool category has a distinct accent color (e.g. blue for Video, green for Audio, purple for Subtitles)
- **Icons:** Lucide React icons throughout
- **Animations:** Subtle Framer Motion transitions on panel changes and progress states

### Onboarding

- First-launch welcome screen with a short animated walkthrough (3 steps max)
- Empty state for each tool shows an example use case with a sample command preview
- Tooltip on every option explaining what it does in plain English

---

## Core Features

### Drag-and-Drop File Input
- Drop zone accepts video, audio, image, and subtitle files
- Automatically detects file type and filters to tools compatible with that file
- Displays file metadata on drop: name, size, duration, resolution, codec (via FFprobe)
- Supports multi-file input for batch and merge tools

### Real-Time Progress
- FFmpeg progress is parsed from stderr output and shown as a live progress bar
- Displays: percentage complete, estimated time remaining, current processing speed
- Cancel button terminates the FFmpeg process cleanly

### Job History
- Every completed job is saved locally (stored in app data directory as JSON)
- History panel shows: input file, tool used, settings applied, output file path, timestamp
- One-click re-run repeats the same job with the same settings
- Jobs can be exported as a reusable preset

### Output File Management
- Output files are saved to a configurable default output folder
- Output panel shows a thumbnail preview (for video/image) or audio waveform
- Displays before/after file size with a compression ratio indicator
- Buttons: Open File, Open Folder, Copy Path, Share (opens OS share dialog)

### FFmpeg Command Transparency
- Every tool shows a live preview of the exact FFmpeg command it will run, updated as the user adjusts options
- "Copy Command" button lets power users take it to a terminal
- Collapsible by default so it doesn't intimidate beginners

### Settings Panel
- Default output folder (with folder picker)
- Default output format per category
- Hardware acceleration toggle (NVENC, QSV, AMF detection)
- Concurrent job limit for batch processing
- Theme toggle (dark / light)
- FFmpeg binary path override (for users with a custom FFmpeg installation)

---

## Tool Specifications

Each tool is defined as a structured object:

```typescript
interface Tool {
  id: string;
  category: ToolCategory;
  name: string;               // Plain-language name shown in UI
  description: string;        // One-sentence explanation for non-technical users
  icon: LucideIcon;
  acceptedInputTypes: MediaType[];
  options: ToolOption[];      // Dynamic form fields
  buildCommand: (input: string, output: string, options: Record<string, any>) => string[];
  outputExtension: string | ((options: Record<string, any>) => string);
  estimatedDuration?: (fileDuration: number, options: Record<string, any>) => number;
}
```

---

## Tool Categories & Full Tool List

### 🎬 Video Tools

| Tool | Plain-Language Description | Key Options |
|---|---|---|
| Convert Video Format | Change a video into MP4, MOV, MKV, AVI, or WebM | Target format, video codec, audio codec |
| Reduce File Size | Make a video smaller for sharing or uploading | Quality level (slider: Smallest / Balanced / Best), target file size in MB |
| Change Resolution | Resize to 4K, 1080p, 720p, 480p, or custom | Preset dropdown + custom width/height, maintain aspect ratio toggle |
| Social Media Optimizer | Optimize for YouTube, Instagram, WhatsApp, or Discord | Platform selector (auto-applies correct specs) |
| Change Frame Rate | Adjust how smooth the video plays | FPS selector (24, 30, 60, custom) |
| Rotate Video | Fix sideways or upside-down videos | Rotation selector (90°, 180°, 270°) |
| Flip Video | Mirror the video | Direction: Horizontal / Vertical / Both |
| Trim Video | Cut away the start or end | Start time, end time, visual timeline scrubber |
| Cut Out Section | Remove a segment from the middle | Start of cut, end of cut |
| Split Into Clips | Divide into several parts | Split by: equal parts (N clips), specific timestamps, or every X seconds |
| Merge Videos | Combine multiple videos into one | File list with drag-to-reorder, crossfade option |
| Change Playback Speed | Make video play slower or faster | Speed multiplier (0.25×, 0.5×, 1×, 1.5×, 2×, 4×, custom), audio pitch correction toggle |
| Reverse Video | Play the video backward | Reverse audio too (toggle) |
| Crop Video | Remove unwanted edges | Visual crop box overlay on preview, or numeric pixel inputs |
| Zoom Into Video | Focus on a specific area | X/Y position, zoom level, animate zoom (toggle) |
| Add Text Overlay | Add titles, captions, or labels | Text input, font, size, color, position, time range |
| Add Watermark | Place a logo or image on the video | Logo file picker, position (9-point grid), opacity, size |
| Adjust Brightness & Contrast | Improve lighting and color balance | Brightness slider, contrast slider, saturation slider |
| Convert to Black & White | Remove all color from the video | Strength slider (partial desaturation or full) |
| Blur Region | Apply blur for privacy or style | Region selector, blur type (pixelate / gaussian), start/end time |
| Sharpen Video | Enhance fine detail and clarity | Sharpness slider |

### 🎵 Audio Tools

| Tool | Description | Key Options |
|---|---|---|
| Extract Audio | Save the sound from a video as an audio file | Output format (MP3, WAV, AAC, FLAC, OGG) |
| Convert Audio Format | Change audio between formats | Input/output format, bitrate |
| Remove Audio | Delete the audio track from a video | — |
| Replace Audio | Swap the audio track in a video | New audio file picker, sync offset (seconds) |
| Normalize Volume | Make audio louder or more balanced automatically | Target loudness (LUFS), peak limit |
| Change Audio Bitrate | Adjust audio quality and file size | Bitrate selector (64k – 320k) |
| Change Sample Rate | Modify sampling frequency | Sample rate selector (22050, 44100, 48000, 96000 Hz) |
| Reduce Background Noise | Clean up unwanted noise from recordings | Noise reduction strength slider |

### 💬 Subtitle Tools

| Tool | Description | Key Options |
|---|---|---|
| Add Subtitles | Attach a subtitle file so it appears during playback | Subtitle file picker, language tag |
| Burn Subtitles | Embed subtitles permanently into video frames | Subtitle file, font style, position |
| Extract Subtitles | Save subtitle tracks from a video to a file | Track selector (if multiple tracks exist) |
| Convert Subtitle Format | Change between SRT, VTT, ASS, and other formats | Target format |
| Fix Subtitle Timing | Shift subtitles earlier or later | Offset in seconds (positive or negative) |

### 🖼️ Image & GIF Tools

| Tool | Description | Key Options |
|---|---|---|
| Create GIF | Turn a short video clip into an animated GIF | Start/end time, FPS, width, color palette quality |
| Extract Frames | Save individual video frames as image files | Interval (every N seconds or every N frames), output format (JPG, PNG) |
| Create Thumbnail | Generate a preview image at a specific moment | Timestamp, output format, resolution |
| Video to Image Sequence | Export every frame as a numbered image | Frame range, format, naming pattern |
| Slideshow from Images | Combine multiple images into a video | Image list (drag-to-reorder), duration per image, transition type, background music |

### 📡 Streaming & Web Tools

| Tool | Description | Key Options |
|---|---|---|
| Prepare for Web Streaming | Convert for smooth browser playback | Fast-start optimization (moov atom), format selector |
| Create HLS Stream | Generate segmented `.m3u8` files for streaming systems | Segment duration, output folder |
| Optimize for Fast Loading | Reduce buffering and improve loading speed | Two-pass encoding toggle, target bitrate |

### 🏷️ Metadata Tools

| Tool | Description | Key Options |
|---|---|---|
| View File Info | Show resolution, codec, bitrate, duration, and all stream details | — (output display only, using FFprobe) |
| Edit Metadata | Change title, artist, year, or other embedded tags | Tag key-value editor |
| Strip All Metadata | Remove all hidden embedded data from a file | — |

### ⚙️ Advanced Tools

| Tool | Description | Key Options |
|---|---|---|
| Batch Process | Apply any tool to multiple files at once | File queue, output naming pattern, concurrency setting |
| Custom Workflow | Chain multiple operations (trim → resize → compress) into one pass | Step builder with drag-to-reorder steps |
| View FFmpeg Command | See the exact command any tool would generate | Live preview, copy to clipboard |
| Run Custom Command | Type or paste your own FFmpeg command and execute it | Command input, variable substitution (e.g. `{input}`, `{output}`) |

---

## FFmpeg Integration Details

### Bundling Strategy
- Include pre-built FFmpeg and FFprobe static binaries in `resources/ffmpeg/`
- Binaries should be separated per platform (`win32/ffmpeg.exe`, `darwin/ffmpeg`, `linux/ffmpeg`)
- Electron Builder's `extraResources` copies binaries to the app's resource directory at install time
- At runtime, resolve binary path using `process.resourcesPath`

### Progress Parsing
Parse FFmpeg stderr output to extract real-time progress:
```
frame=  240 fps= 60 q=28.0 size=    1024kB time=00:00:08.00 speed=2.00x
```
Calculate percentage from `time` vs total duration from FFprobe metadata.

### Process Management
- Each FFmpeg job spawns a child process via Node.js `child_process.spawn`
- IPC bridge (via `preload.ts` and `contextBridge`) communicates job state to the renderer
- Jobs are queued; maximum concurrent jobs is user-configurable (default: 1)
- Cancellation sends `SIGKILL` to the child process and cleans up partial output files

### Error Handling
- Parse FFmpeg error output and display a human-readable explanation
- Common errors (unsupported codec, missing input file, insufficient disk space) show specific guidance
- Full FFmpeg log available via an expandable "Show Details" section in the error dialog

---

## Packaging & Distribution

- Built with **Electron Builder**
- Outputs: `.exe` NSIS installer for Windows, `.dmg` for macOS, `.AppImage` for Linux
- Auto-updater via `electron-updater` (optional, points to GitHub Releases)
- App icon provided in multiple resolutions (`256x256`, `512x512`, `1024x1024`)
- App signed with a code signing certificate for Windows SmartScreen compatibility (configurable)

---

## Non-Functional Requirements

- **Performance:** UI must remain responsive during FFmpeg processing (all FFmpeg work happens in the main process or a worker, never blocking the renderer)
- **Startup time:** Cold start under 3 seconds
- **Accessibility:** All interactive elements are keyboard-navigable and have ARIA labels
- **Localization-ready:** All user-facing strings extracted into a locale file (`en.json`) for future translation
- **Offline-first:** Zero network requests at runtime (update checks are opt-in and can be disabled)
- **Disk safety:** Never overwrites the original input file; always writes to a new output path

---

## Deliverables

1. Full Electron + React + TypeScript project source code
2. All tool definitions wired to real FFmpeg commands
3. Working drag-and-drop, progress tracking, and job history
4. `electron-builder.yml` configured for Windows `.exe` packaging
5. `README.md` with setup, development, and build instructions

---