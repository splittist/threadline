# threadline

Threadline brings clarity to the chaos of redlines.

## Technology Stack

This application is built with:

### Core Framework
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React 19** - UI library

### Styling
- **Tailwind CSS** - Utility-first CSS framework

### UI and State Management
- **Zustand** - Lightweight state management
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful hand-crafted SVG icons

### DOCX Manipulation
- **JSZip** - Create, read and edit .zip files
- **docx-preview** - Preview DOCX files in the browser
- **File System Access API** (with fallback) - Native file system access

### Storage
- **idb** - IndexedDB wrapper for efficient client-side storage

### Testing
- **Vitest** - Fast unit test framework
- **React Testing Library** - React component testing utilities

### Code Quality
- **ESLint** - Linter with security plugin
- **Prettier** - Code formatter

### Security
- **DOMPurify** - XSS sanitizer for HTML

### Performance
- **Web Workers** - Background processing
- **react-window** - Efficient rendering of large lists

## Getting Started

### Install Dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

This creates a static bundle with:
- `dist/threadline.html` - Main HTML file
- `dist/assets/` - All CSS, JS, and other assets

### Run Tests
```bash
npm run test
```

### Lint Code
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Project Structure

```
threadline/
├── src/
│   ├── components/      # React components
│   ├── store/          # Zustand stores
│   ├── utils/          # Utility functions (DB, sanitization, DOCX)
│   ├── workers/        # Web Workers
│   └── test/           # Test utilities
├── dist/               # Production build output
├── threadline.html     # Main HTML entry point
└── vite.config.ts      # Vite configuration
```

## License

GNU AGPL v3 - See LICENSE file for details
