# Copilot Instructions for Threadline

## Project Overview

Threadline is a web application that brings clarity to the chaos of redlines (document revision tracking). It's a client-side application built with React and TypeScript, designed to help users manage and compare document revisions efficiently.

## Technology Stack

### Core Framework
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript (strict mode enabled)
- **React 19** - UI library with modern patterns

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework

### UI and State Management
- **Zustand** - Lightweight state management (prefer over Context API for global state)
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - SVG icon library

### Document Processing
- **JSZip** - For handling .docx files (which are ZIP archives)
- **docx-preview** - Preview DOCX files in the browser
- **File System Access API** (with fallback) - Native file system access

### Storage
- **idb** - IndexedDB wrapper for efficient client-side storage

### Testing
- **Vitest** - Fast unit test framework
- **React Testing Library** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM

### Code Quality
- **ESLint** - Linter with React hooks, React refresh, and security plugins
- **Prettier** - Code formatter

### Security
- **DOMPurify** - XSS sanitizer for HTML content
- **eslint-plugin-security** - Security linting rules

### Performance
- **Web Workers** - Background processing for heavy operations
- **react-window** - Efficient rendering of large lists

## Development Workflow

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts Vite dev server with hot module replacement.

### Building
```bash
npm run build
```
- Runs TypeScript compiler first (`tsc -b`)
- Then builds production bundle with Vite
- Output goes to `dist/` directory

### Testing
```bash
npm run test        # Run tests in watch mode
npm run test:ui     # Run tests with Vitest UI
```
- All tests must pass before submitting changes
- Write tests for new components and utilities
- Use React Testing Library patterns

### Linting
```bash
npm run lint
```
- Must pass with no errors before committing
- Uses ESLint with TypeScript, React, and security rules

### Formatting
```bash
npm run format
```
- Uses Prettier for consistent code style
- Formats TypeScript, TSX, JavaScript, JSX, JSON, CSS, and Markdown files

## Project Structure

```
threadline/
├── src/
│   ├── components/      # React components
│   ├── store/          # Zustand stores for state management
│   ├── utils/          # Utility functions (DB, sanitization, DOCX processing)
│   ├── workers/        # Web Workers for background tasks
│   ├── test/           # Test utilities and setup
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles (Tailwind imports)
├── dist/               # Production build output (gitignored)
├── threadline.html     # Main HTML entry point
└── vite.config.ts      # Vite configuration
```

## Coding Guidelines

### TypeScript
- Use TypeScript for all new files (`.ts`, `.tsx`)
- Enable strict mode features (already configured)
- Prefer interfaces for object types
- Use proper typing, avoid `any` unless absolutely necessary
- Export types alongside components when useful for consumers

### React
- Use functional components with hooks (no class components)
- Use React 19 patterns and features
- Keep components focused and single-responsibility
- Extract complex logic into custom hooks
- Use `memo` only when performance testing shows it's needed

### State Management
- Use Zustand for global state
- Use local component state (`useState`) for component-specific state
- Keep state as close to where it's used as possible
- Follow Zustand patterns for store creation

### Styling
- Use Tailwind CSS utility classes
- Follow existing component patterns for styling
- Keep inline styles minimal
- Use Headless UI components for accessible UI patterns

### File Organization
- Components go in `src/components/`
- Keep test files next to the components they test (e.g., `Component.test.tsx`)
- Utility functions go in `src/utils/`
- Store definitions go in `src/store/`
- Web Workers go in `src/workers/`

### Testing
- Write tests for new components using React Testing Library
- Test user interactions, not implementation details
- Use descriptive test names that explain the behavior
- Follow existing test patterns in the codebase
- Ensure tests are deterministic and don't rely on timing
- Mock external dependencies appropriately

### Security
- Always sanitize HTML content with DOMPurify before rendering
- Be cautious with file uploads (already limited to 50MB)
- Use the security ESLint plugin recommendations
- Never expose sensitive data in client-side code
- Validate and sanitize user inputs

### Performance
- Use Web Workers for CPU-intensive tasks
- Use `react-window` for rendering large lists
- Lazy load components where appropriate
- Be mindful of bundle size when adding dependencies

### Error Handling
- Handle errors gracefully with user-friendly messages
- Log errors appropriately for debugging
- Use try-catch blocks for async operations
- Provide fallbacks for critical features

## Code Style

### Naming Conventions
- Components: PascalCase (e.g., `FileUpload.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useDocumentStore`)
- Utilities: camelCase (e.g., `sanitizeHtml`)
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

### Imports
- Group imports: React, third-party, local
- Use absolute imports from `src/` when configured
- Keep imports organized and remove unused ones

### Comments
- Write self-documenting code when possible
- Add JSDoc comments for exported functions and complex logic
- Explain "why" not "what" in comments
- Keep comments up to date with code changes

## Dependencies

### Adding New Dependencies
- Consider bundle size impact
- Check for security vulnerabilities
- Prefer well-maintained libraries
- Ensure compatibility with React 19 and TypeScript
- Update package.json with appropriate version constraints

### Updating Dependencies
- Test thoroughly after updates
- Check for breaking changes in changelogs
- Update related code if APIs change

## Build Output

Production build creates:
- `dist/threadline.html` - Main HTML file
- `dist/assets/` - All CSS, JS, and other assets
- Optimized and minified bundles
- Source maps for debugging

## License

This project is licensed under GNU AGPL v3. All contributions must be compatible with this license.

## Common Tasks

### Adding a New Component
1. Create component file in `src/components/`
2. Write the component with TypeScript
3. Add tests in `ComponentName.test.tsx`
4. Export from appropriate location
5. Run tests and linting

### Working with Documents
- DOCX files are ZIP archives containing XML
- Use JSZip for reading/writing DOCX structure
- Process document content in Web Workers for large files
- Store document metadata in IndexedDB using idb wrapper

### Debugging
- Use browser DevTools
- Check console for errors and warnings
- Use React DevTools for component inspection
- Use Vitest UI for test debugging (`npm run test:ui`)

## Best Practices

1. **Make minimal changes** - Change only what's necessary to fix the issue or add the feature
2. **Test early and often** - Run tests after each significant change
3. **Keep it simple** - Don't over-engineer solutions
4. **Follow existing patterns** - Stay consistent with the codebase
5. **Security first** - Always consider security implications
6. **Performance matters** - But don't optimize prematurely
7. **Accessibility** - Use semantic HTML and Headless UI for accessible components
8. **Documentation** - Update README and comments when adding features

## Getting Help

- Check existing code for patterns and examples
- Review test files for usage examples
- Consult the official documentation for libraries used
- Check PRD and implementation plan documents for project context
