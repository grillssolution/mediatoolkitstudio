# Contributing to Media Studio Toolkit

Thank you for your interest in contributing to Media Studio Toolkit! This guide will help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Adding a New Tool](#adding-a-new-tool)
- [FFmpeg Guidelines](#ffmpeg-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

By participating in this project, you agree to be respectful and constructive. We are committed to providing a welcoming and inclusive experience for everyone.

---

## Getting Started

1. **Fork** this repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/media-studio-toolkit.git
   cd media-studio-toolkit
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start development:**
   ```bash
   npm run dev
   ```

---

## Development Setup

### Prerequisites

- **Node.js** 18 or higher
- **Git**
- **Windows** (primary platform — Electron builder targets Windows/NSIS)

### Running the App

| Command | What it does |
|---------|-------------|
| `npm run dev` | Starts the Vite dev server (renderer only, opens in browser) |
| `npm run electron:dev` | Starts the full Electron app in development mode |
| `npm run build` | Type-checks, builds renderer, and packages the Electron app |
| `npm run lint` | Runs ESLint |

### Architecture Overview

```
Electron Main Process (electron/)
├── main.ts          → Window management, IPC handlers, app lifecycle
├── preload.ts       → Secure bridge between main and renderer
└── ffmpeg-runner.ts → Spawns FFmpeg/FFprobe processes, parses progress

React Renderer (src/)
├── components/      → UI components (Sidebar, ToolPanel, DropZone, etc.)
├── tools/           → Tool definitions organized by category
├── store/           → Zustand state management
├── types/           → TypeScript interfaces
└── lib/             → Utility functions
```

**Data flow:** User selects tool → configures options → clicks Run → `ToolPanel` builds FFmpeg command → sends to Electron main via IPC → `ffmpeg-runner.ts` spawns FFmpeg → progress emitted back via IPC → UI updates in real-time.

---

## How to Contribute

### Types of Contributions

- 🐛 **Bug fixes** — Fix broken tools, UI glitches, or edge cases
- 🔧 **New tools** — Add new media processing capabilities
- 🎨 **UI improvements** — Better design, animations, accessibility
- 📝 **Documentation** — Fix typos, improve guides, add examples
- 🧪 **Testing** — Test tools with various media formats and report issues
- 🌍 **Platform support** — Help with macOS/Linux builds

---

## Adding a New Tool

This is the most common contribution. Each tool is a simple object — no backend code needed!

### Step 1: Choose the Right Category

| Category | File | What belongs here |
|----------|------|-------------------|
| Video | `src/tools/video/index.ts` | Video manipulation, effects, encoding |
| Audio | `src/tools/audio/index.ts` | Audio extraction, conversion, effects |
| Images | `src/tools/images/index.ts` | GIFs, thumbnails, frame extraction |
| Subtitles | `src/tools/subtitles/index.ts` | Subtitle embedding, extraction, conversion |
| Streaming | `src/tools/streaming/index.ts` | Web streaming, HLS, optimization |
| Metadata | `src/tools/metadata/index.ts` | File info, tag editing |
| Advanced | `src/tools/advanced/index.ts` | Batch processing, custom commands |

### Step 2: Define the Tool

Add a new object to the array in the appropriate category file:

```typescript
{
  id: 'stabilize-video',           // Unique kebab-case ID
  category: 'video',
  name: 'Stabilize Video',         // Human-readable name
  description: 'Remove camera shake for smoother footage.',
  icon: Move,                      // Import from lucide-react
  acceptedInputTypes: ['video'],   // What file types this tool accepts
  requiresInput: true,             // Does it need an input file?
  options: [                       // User-configurable parameters
    {
      id: 'strength',
      label: 'Stabilization Strength',
      description: 'How aggressively to remove shakiness.',
      type: 'slider',
      defaultValue: 10,
      min: 1,
      max: 30,
      step: 1,
    },
  ],
  buildCommand: (inputPath, outputPath, options) => [
    '-i', inputPath,
    '-vf', `vidstabdetect,vidstabtransform=smoothing=${options.strength}`,
    '-pix_fmt', 'yuv420p',
    '-c:a', 'copy',
    '-y', outputPath,
  ],
  outputExtension: 'mp4',
}
```

### Step 3: Available Option Types

| Type | Description | Properties |
|------|-------------|------------|
| `select` | Dropdown menu | `options: [{ value, label }]` |
| `slider` | Range slider | `min`, `max`, `step` |
| `number` | Numeric input | `min`, `max`, `step`, `unit` |
| `text` | Text input | — |
| `textarea` | Multi-line text | — |
| `toggle` | On/off switch | — |
| `color` | Color picker | — |
| `file-picker` | File browser | `accept: 'png,jpg'` |
| `file-list` | Multiple file picker | `accept`, `multiple: true` |

### Step 4: Test Your Tool

1. Run `npm run dev` or `npm run electron:dev`
2. Find your tool in the sidebar under its category
3. Load a test file and run the tool
4. Check the FFmpeg log output for errors
5. Verify the output file is correct

---

## FFmpeg Guidelines

These rules prevent the most common runtime errors. **Please follow them carefully.**

### ✅ Always Do

- **Add `-pix_fmt yuv420p`** when your tool re-encodes video (uses `-vf` or `-filter_complex`). This ensures H.264 compatibility regardless of the input pixel format.

- **Use even dimensions** for crop and scale values. H.264 requires width/height to be divisible by 2:
  ```typescript
  const w = Math.max(2, Math.floor((opts.width as number) / 2) * 2)
  ```

- **Use `-y`** flag to overwrite without prompting.

- **Use `-c:a copy`** when only modifying video — avoids unnecessary audio re-encoding.

- **Use `split` in `filter_complex`** when you need the same stream twice:
  ```
  [0:v]split=2[base][copy];[copy]crop=...,boxblur=...[blurred];[base][blurred]overlay=...
  ```

- **Use `-map 0:a?`** (with the question mark) when mapping audio that might not exist.

### ❌ Never Do

- **Don't escape commas** — FFmpeg is spawned via `child_process.spawn()` (arguments are passed as an array), so shell escaping is not needed. Write `between(t,5,10)` not `between(t\,5\,10)`.

- **Don't reference `[0:v]` twice** in a filter_complex without splitting first — this causes "Invalid argument" errors.

- **Don't use `s=iw` in zoompan** — the `s` parameter requires a fixed resolution like `s=1920x1080`, not expressions. Use a separate `scale` filter instead.

- **Don't omit pixel format** — Some inputs use `yuv444p`, `yuv422p10le` or other formats that can't be encoded to H.264 without specifying `yuv420p`.

---

## Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/my-new-tool
   ```

2. **Make your changes** following the guidelines above.

3. **Test thoroughly:**
   - Run `npx tsc --noEmit` to check for TypeScript errors
   - Run `npm run lint` to check for linting issues
   - Test the tool with at least 2–3 different media files
   - Check edge cases (very short files, large files, unusual codecs)

4. **Commit with a clear message:**
   ```bash
   git commit -m "feat: add video stabilization tool"
   ```

5. **Push and create a Pull Request:**
   ```bash
   git push origin feature/my-new-tool
   ```

6. **In your PR description, include:**
   - What the tool/change does
   - The FFmpeg command it generates (example)
   - Screenshots of the UI if applicable
   - Test results with sample files

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature or tool |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | UI/styling changes (no logic changes) |
| `refactor:` | Code restructuring |
| `chore:` | Build config, dependencies, etc. |

---

## Reporting Bugs

When reporting a bug, please include:

1. **Steps to reproduce** — Which tool, what settings, what input file
2. **FFmpeg log** — Click "Show FFmpeg Log" in the output panel and copy the full log
3. **Input file info** — Resolution, codec, format (visible in the DropZone metadata)
4. **Expected vs actual behavior**
5. **System info** — Windows version, app version

Use the [GitHub Issues](../../issues) page with the **Bug Report** template.

---

## Suggesting Features

Have an idea for a new tool or improvement? Open a [GitHub Issue](../../issues) with the **Feature Request** template. Include:

1. **What problem does it solve?**
2. **How should it work?** (describe the UI and options)
3. **What FFmpeg command would it use?** (if you know)

---

## 💡 Tips for First-Time Contributors

- **Start small** — Fix a typo, improve a description, or add a simple tool
- **Look for `good first issue` labels** in the Issues tab
- **Ask questions** — Open an issue if you're unsure about anything
- **Test on real files** — Download sample videos from [sample-videos.com](https://sample-videos.com/) for testing

---

<p align="center">
  Thank you for helping make Media Studio Toolkit better! 🎉
</p>
