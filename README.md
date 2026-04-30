# ✦ Airforge

**A gesture-controlled creative workspace — draw in 2D and build in 3D using only your hands.**

Airforge runs entirely in the browser. No installation, no plugins, no stylus — just a webcam and your hands. Powered by MediaPipe hand tracking, it maps your gestures to drawing and 3D construction in real time.

---

## ✨ Features

### ✍️ Ink Space — 2D Gesture Drawing

* Draw smooth neon-glow lines using your **index finger**
* Shape modes: **Free draw, Line, Circle, Rectangle**
* Background templates: **Blank, Lined, Grid, Dotted**
* 5 neon colour presets with adjustable brush size
* **Select and move** strokes using a pinch gesture
* Full **Undo / Redo** stack
* Export drawing as **PNG (2× resolution)**

---

### 🧊 Build Space — 3D Voxel Construction

* Place glowing 3D blocks by **pinching to preview** and **opening your palm to place**
* **Orbit camera** using two open palms
* **Scroll wheel zoom**
* 9-button **orbit control panel** for quick camera presets
* Toggle grid on / off
* Full **Undo / Redo** stack
* Export scene as **PNG (2× resolution)**

---

### 🤲 Gesture Controls

| Gesture                  | Action                     |
| ------------------------ | -------------------------- |
| ☝️ Index finger          | Draw                       |
| 🤏 Pinch (near stroke)   | Select & move stroke       |
| 🤏 Hold pinch (1 second) | Select stroke              |
| ✋ Open palm              | Stop drawing / drop        |
| 🤲 Two open palms        | Orbit camera (Build Space) |
| 🖱️ Scroll wheel         | Zoom (Build Space)         |

---

### 🎛️ Sidebar UI

* Mouse-controlled sidebar with all tools
* Undo / Redo controls
* Colour palette and brush size slider
* Shape and background controls
* One-click mode switching (**Ink ↔ Build**)

---

## 🚀 Getting Started

### Prerequisites

* A modern browser (**Chrome recommended**)
* A webcam

---

### Run Locally

```bash
git clone https://github.com/your-username/airforge.git
cd airforge
npm install
npm run dev
```

Open your browser at:

```
http://localhost:3000
```

> Webcam access is required. Works only on **HTTPS or localhost**.

---

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` directory.

---

## 🛠️ Tech Stack

| Technology                      | Purpose                           |
| ------------------------------- | --------------------------------- |
| MediaPipe Hands                 | Real-time hand landmark detection |
| Three.js                        | 3D scene rendering (Build Space)  |
| HTML5 Canvas                    | 2D stroke rendering (Ink Space)   |
| Vite                            | Development server & bundler      |
| Vanilla JavaScript (ES Modules) | Application logic                 |
| CSS Glassmorphism               | UI styling                        |

---

## 📁 Project Structure

```
airforge/
├── index.html              # Entry point & CSS
├── vite.config.js          # Vite configuration
├── package.json
├── src/
│   ├── main.js             # App init, render loop, mode switching
│   ├── camera.js           # Webcam setup
│   ├── constants.js        # Shared constants & thresholds
│   ├── gestures/
│   │   ├── detector.js     # Gesture classification
│   │   └── landmarks.js    # Landmark utilities
│   ├── ink/
│   │   ├── inkCanvas.js    # Canvas manager
│   │   ├── strokes.js      # Stroke model + undo/redo
│   │   ├── neon.js         # Neon glow renderer
│   │   ├── shapes.js       # Shape modes (line, circle, rect)
│   │   ├── gestureHandler.js
│   │   └── background.js
│   ├── build/
│   │   ├── buildScene.js   # Three.js scene + screenshot
│   │   ├── buildGestureHandler.js
│   │   ├── blocks.js       # Block manager + undo/redo
│   │   ├── grid.js
│   │   ├── preview.js      # Ghost block preview
│   │   ├── viewcube.js     # Orbit control panel
│   │   ├── gizmo.js
│   │   └── orbit.js        # Two-hand orbit control
│   └── ui/
│       ├── sidebar.js      # Sidebar controller
│       ├── helpModal.js    # Gesture guide modal
│       ├── onboarding.js   # First-visit welcome card
│       ├── statusBar.js    # Hand tracking status
│       └── simpleMode.js   # Simple mode toggle
└── LICENSE
```

---

## 📄 License

MIT License

---

## 👤 Author

**Sumanth Mamidi**
