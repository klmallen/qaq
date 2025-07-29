# QAQ Game Engine - Dependencies Guide

## 🚀 Quick Start

The QAQ Game Engine is designed to work with or without optional dependencies. The core functionality is available immediately, while advanced features require additional packages.

## 📦 Core Dependencies (Already Installed)

- ✅ **Vue 3** - Core framework
- ✅ **Nuxt 3** - Full-stack framework
- ✅ **Nuxt UI** - UI component library
- ✅ **Pinia** - State management
- ✅ **Three.js** - 3D graphics
- ✅ **Tailwind CSS** - Styling

## 🔧 Optional Dependencies

### Monaco Editor (Code Editor)

For the full-featured code editor experience:

```bash
npm install monaco-editor
# or
yarn add monaco-editor
```

**Without Monaco Editor**: A fallback message will be shown with installation instructions.

### Vue Flow (Advanced Material Editor)

For the professional node-based material editor:

```bash
npm install @vue-flow/core @vue-flow/controls @vue-flow/minimap @vue-flow/background
# or
yarn add @vue-flow/core @vue-flow/controls @vue-flow/minimap @vue-flow/background
```

**Without Vue Flow**: A simplified material editor is available as fallback.

## 🎯 Current Status

| Feature | Status | Fallback Available |
|---------|--------|-------------------|
| **Main Editor** | ✅ Working | N/A |
| **Scene Tree** | ✅ Working | N/A |
| **3D Viewport** | ✅ Working | N/A |
| **Property Inspector** | ✅ Working | N/A |
| **File Explorer** | ✅ Working | N/A |
| **Code Editor** | ⚠️ Needs Monaco | ✅ Simple text editor |
| **Material Editor (Simple)** | ✅ Working | N/A |
| **Material Editor (Vue Flow)** | ⚠️ Needs Vue Flow | ✅ Simplified version |
| **Terrain Editor** | ✅ Working | N/A |

## 🛠️ Installation Troubleshooting

### If npm install fails:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Try yarn instead**:
   ```bash
   npm install -g yarn
   yarn install
   ```

3. **Use force flag**:
   ```bash
   npm install --force
   ```

4. **Manual installation**:
   ```bash
   # Install one by one
   npm install monaco-editor --save
   npm install @vue-flow/core --save
   npm install @vue-flow/controls --save
   npm install @vue-flow/minimap --save
   npm install @vue-flow/background --save
   ```

## 🎮 Available Editors

### 1. Main Editor
- **Location**: Default view
- **Features**: Scene tree, 3D viewport, property inspector
- **Status**: ✅ Fully functional

### 2. Code Editor
- **Access**: Tools → Script Editor
- **Features**: Syntax highlighting, multi-file tabs, auto-completion
- **Requires**: Monaco Editor
- **Fallback**: Simple text editor with installation guide

### 3. Material Editor (Simple)
- **Access**: Tools → Material Editor
- **Features**: Basic node-based material editing
- **Status**: ✅ Fully functional

### 4. Material Editor (Vue Flow)
- **Access**: Tools → Vue Flow Material Editor
- **Features**: Professional node-based editor with advanced features
- **Requires**: Vue Flow packages
- **Fallback**: Simplified interface with installation guide

### 5. Terrain Editor
- **Access**: Tools → Terrain Editor
- **Features**: UE-style terrain sculpting with brushes
- **Status**: ✅ Fully functional

## 🚀 Getting Started

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**: http://localhost:3002

3. **Try the editors**:
   - Main editor works immediately
   - Terrain editor works immediately
   - Simple material editor works immediately
   - For advanced features, install optional dependencies

## 📝 Notes

- The engine is designed to be **progressive** - you can start using it immediately and add features as needed
- All fallback interfaces provide clear installation instructions
- The core game engine functionality (scenes, nodes, 3D rendering) works without any additional dependencies

## 🔄 Development Workflow

1. **Core Development**: Use the main editor for scene creation and basic scripting
2. **Advanced Scripting**: Install Monaco Editor for full IDE experience
3. **Material Creation**: Use simple editor or install Vue Flow for advanced features
4. **Terrain Design**: Use the built-in terrain editor (no additional deps needed)

---

**Happy coding with QAQ Game Engine! 🎮✨**
