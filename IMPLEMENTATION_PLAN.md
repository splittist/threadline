# Threadline MVP — High-Level Implementation Plan

**Version:** v0.1  
**Date:** October 2025  
**Based on:** PRD_v_0.1.md  
**Status:** Draft for iterative refinement

---

## Executive Summary

This document provides a high-level implementation plan for the Threadline MVP, translating the PRD requirements into a phased development approach. The plan prioritizes core functionality that enables users to upload DOCX files, extract tracked changes, organize them into threads, and export results — all within a secure, client-side application.

**Key Success Criteria:**
- A lawyer can upload 5 redlined docs and export a coherent issue summary in <15 mins
- 100% client-side operation (no server calls)
- Smooth handling of 5-10 documents with ~100-200 tracked changes

---

## Implementation Philosophy

1. **Minimal Viable Feature Set**: Build only what's needed for the core user journey
2. **Iterative Refinement**: Start with basic functionality, enhance progressively
3. **Security First**: Client-side only, no data leaks, sanitized content
4. **User-Centered**: Design for legal professionals, not developers
5. **Quality Gates**: Each phase includes testing and validation

---

## Phase 0: Foundation (COMPLETED)

✅ **Status**: Tech stack initialized, basic structure in place

**Deliverables:**
- Vite + TypeScript + React + Tailwind setup
- Zustand state management boilerplate
- Basic project structure (components/, store/, utils/, workers/)
- Essential dependencies installed
- Testing infrastructure (Vitest + React Testing Library)
- Linting and formatting (ESLint + Prettier)
- Build pipeline working

**Current State:**
- Basic App component with welcome screen
- Skeleton store implementation
- Minimal DOCX utility functions
- Sanitization utils with DOMPurify
- Database utils with idb wrapper

---

## Phase 1: Document Ingestion & Parsing

**Goal**: Users can upload multiple DOCX files and see basic information about them

### 1.1 File Upload Interface
**Priority**: Critical  
**Complexity**: Low

**Tasks:**
- Create FileUpload component with drag-and-drop support
- Support multiple file selection
- File validation (DOCX format, reasonable size limits)
- Display uploaded files in a list
- Remove files from the list

**Acceptance Criteria:**
- Users can drag-and-drop or click to upload DOCX files
- Only .docx files are accepted
- File list shows document names and sizes
- Individual files can be removed before processing

**Technical Details:**
- Use File System Access API where supported, fall back to input[type=file]
- Store File objects in Zustand state
- Validate MIME type and file extension

---

### 1.2 DOCX Structure Extraction
**Priority**: Critical  
**Complexity**: High

**Tasks:**
- Implement Web Worker for DOCX parsing (non-blocking UI)
- Extract document.xml from DOCX ZIP archive
- Parse OOXML structure to identify:
  - Document hierarchy (sections, paragraphs)
  - Heading structure (for clause paths)
  - Text content with formatting
- Generate unique document IDs and content hashes
- Store parsed document structure in state

**Acceptance Criteria:**
- Parsing doesn't block UI (runs in Web Worker)
- Document hierarchy correctly extracted
- Clause paths identified (e.g., ["8", "Termination", "8.2 Force Majeure"])
- Handles common DOCX variations

**Technical Details:**
- Use JSZip to read DOCX as ZIP
- Parse XML with DOMParser
- Extract heading styles (Heading 1, Heading 2, etc.)
- Build clause path from heading hierarchy
- Compute SHA-256 hash for document identity

---

### 1.3 Tracked Changes Extraction
**Priority**: Critical  
**Complexity**: High

**Tasks:**
- Parse OOXML tracked changes elements:
  - `<w:ins>` (insertions)
  - `<w:del>` (deletions)
  - `<w:moveFrom>` / `<w:moveTo>` (moves)
- Extract change metadata:
  - Author name
  - Timestamp
  - Change type
- Extract change context:
  - Text before change (context window)
  - Changed text
  - Text after change (context window)
  - Clause path where change occurs
- Generate unique changeId for each change
- Store changes in normalized data structure

**Acceptance Criteria:**
- All tracked changes detected and extracted
- Change metadata complete and accurate
- Context windows provide enough information for understanding
- Changes correctly linked to clause paths
- Handles nested changes and complex formatting

**Technical Details:**
- Parse `<w:ins>`, `<w:del>`, `<w:moveFrom>`, `<w:moveTo>` elements
- Extract w:author, w:date, w:id attributes
- Build context by walking surrounding paragraphs
- Normalize timestamps to ISO 8601
- Handle edge cases (changes at document boundaries, nested changes)

---

### 1.4 Data Model Implementation
**Priority**: Critical  
**Complexity**: Medium

**Tasks:**
- Implement core data structures:
  - `Document`: docId, name, hash, uploadedAt, parsedAt
  - `Change`: changeId, docId, type, author, timestamp, clausePath, textBefore, changedText, textAfter
  - `Thread`: threadId, title, userTopic, suggestedTopic, rationale, changeIds, status, notes
- Create Zustand store slices for:
  - Documents management
  - Changes management
  - Threads management
  - Selection state
- Implement state update actions

**Acceptance Criteria:**
- Data structures match PRD schema (Section 8)
- State updates are efficient and predictable
- TypeScript types enforce data integrity
- State can be serialized/deserialized for persistence

**Technical Details:**
- Use TypeScript interfaces/types for all data structures
- Zustand store organized into logical slices
- Immutable state updates
- Computed selectors for derived state (e.g., changes by thread)

---

## Phase 2: Automatic Clustering & Thread Creation

**Goal**: System automatically groups related changes and presents them as initial threads

### 2.1 Heuristic Clustering
**Priority**: High  
**Complexity**: Medium

**Tasks:**
- Implement clause-based clustering:
  - Group changes by clausePath similarity
  - Group changes by document
  - Combine into logical buckets
- Implement keyword extraction for topic suggestions:
  - Extract significant terms from changed text
  - Identify common patterns (e.g., "Force Majeure", "Termination")
  - Score terms by frequency and position
- Create initial "buckets" (not threads yet)
- Store buckets as suggested groupings

**Acceptance Criteria:**
- Changes with same/similar clause paths grouped together
- Related changes across documents identified
- Keyword-based topic suggestions generated
- Buckets stored in "Unassigned" state for user review

**Technical Details:**
- Run clustering in Web Worker for performance
- Use string similarity for clause path matching
- Simple TF-IDF or keyword frequency for topic extraction
- Maximum 15-20 initial buckets (manageable for users)

---

### 2.2 LLM-Assisted Clustering (Optional Path)
**Priority**: Medium  
**Complexity**: Medium

**Tasks:**
- Design "clustering packet" format:
  - JSON with changes (id, text, context, clausePath)
  - Instructions for LLM
  - Response schema specification
- Implement export of clustering packet
- Implement import of LLM response
- Validate LLM response:
  - Check changeIds match
  - Validate JSON schema
  - Check confidence scores
- Merge LLM suggestions into buckets

**Acceptance Criteria:**
- User can export clustering packet as JSON
- Packet includes clear instructions for LLM
- Import validates and sanitizes LLM response
- Invalid responses rejected with clear error messages
- LLM suggestions shown as "suggested topics" not auto-applied

**Technical Details:**
- Generate packet with ≤500 changes per batch
- Include example input/output in packet
- Schema validation for response
- Never auto-create threads from LLM suggestions
- Security: sanitize all imported text

---

## Phase 3: Manual Refinement UI (Core User Experience)

**Goal**: Users can review, reorganize, and annotate threads with an intuitive interface

### 3.1 Three-Panel Layout
**Priority**: Critical  
**Complexity**: Medium

**Tasks:**
- Implement responsive three-panel layout:
  - **Left Panel**: Thread List
  - **Center Panel**: Change List
  - **Right Panel**: Thread Metadata
- Handle panel resizing (optional for MVP)
- Ensure mobile-friendly (stacked on small screens)
- Implement panel state management

**Acceptance Criteria:**
- Three panels clearly delineated
- Layout works on desktop (primary) and tablet
- Panels maintain state when switching between threads
- Smooth transitions between views

**Technical Details:**
- CSS Grid or Flexbox for layout
- Responsive breakpoints for mobile/tablet
- Panel state in Zustand
- Tailwind for consistent styling

---

### 3.2 Thread List Panel
**Priority**: Critical  
**Complexity**: Medium

**Tasks:**
- Display all threads with:
  - Thread title
  - Change count
  - Status indicator (proposed, approved, rejected, escalate)
  - Visual highlighting for selected thread
- Show "Unassigned" bucket at top
- Support thread creation (+ New Thread button)
- Support thread deletion
- Support thread selection
- Display status badges and icons

**Acceptance Criteria:**
- All threads visible and selectable
- "Unassigned" clearly distinct from regular threads
- Change counts accurate
- Status indicators clear and consistent
- Easy to create new threads

**Technical Details:**
- List component with virtualization if >50 threads
- Heroicons for status indicators
- Color coding for different statuses
- Selected state styling
- "Unassigned" always at top, threads below

---

### 3.3 Change List Panel
**Priority**: Critical  
**Complexity**: High

**Tasks:**
- Display changes for selected thread:
  - Diff snippet (before/after text)
  - Document name
  - Clause path breadcrumb
  - Author and timestamp
  - Checkbox for selection
- Implement change selection (single and bulk)
- Implement "Move to..." dropdown action:
  - List all existing threads
  - Option to create new thread
  - Move selected changes
- Implement search/filter within changes
- Support virtualized rendering for performance

**Acceptance Criteria:**
- Changes display clearly with context
- Diff view shows what changed
- Bulk selection intuitive (checkboxes)
- Move operation fast and reliable
- Handles 200+ changes smoothly
- Search filters changes in real-time

**Technical Details:**
- Use react-window for virtualization
- Diff display with color coding (green=insert, red=delete)
- Multi-select state management
- Dropdown with Headless UI
- Context window (2-3 sentences before/after)
- Clause path as breadcrumb navigation

---

### 3.4 Thread Metadata Panel
**Priority**: Critical  
**Complexity**: Medium

**Tasks:**
- Display/edit thread properties:
  - **Title**: Editable text input
  - **User Topic**: Required, editable text
  - **Suggested Topic**: Read-only, shown as hint
  - **Rationale**: Multi-line text area
  - **Status**: Dropdown (proposed, approved, rejected, escalate)
  - **Notes**: List of notes with timestamps
- Implement auto-save on edits
- Display change IDs in thread (for debugging)
- Show thread creation/modification timestamps

**Acceptance Criteria:**
- All fields editable and persistent
- User topic is required (validation)
- Changes save automatically
- Rationale supports rich text (future) or plain text
- Status changes reflected immediately in thread list

**Technical Details:**
- Controlled inputs with Zustand state
- Debounced auto-save to prevent excessive updates
- Form validation (required fields)
- Notes stored as array with timestamps
- Headless UI components for dropdowns

---

### 3.5 Thread Operations
**Priority**: High  
**Complexity**: Medium

**Tasks:**
- Create new thread:
  - Prompt for user topic
  - Initialize with selected changes or empty
  - Add to thread list
- Merge threads:
  - Select multiple threads
  - Combine into one
  - Preserve all changes and merge rationales
- Split thread:
  - Select subset of changes
  - Move to new thread
- Delete thread:
  - Move changes back to Unassigned
  - Confirm action
- Rename thread:
  - Edit title inline

**Acceptance Criteria:**
- All operations are undoable (via UI state)
- Operations complete instantly (no lag)
- Data integrity maintained (every change in exactly one thread)
- Confirmations for destructive actions

**Technical Details:**
- Modal dialogs for confirmations
- State transactions for complex operations
- Validate data integrity after each operation
- Toast notifications for action feedback

---

## Phase 4: Review & Commenting

**Goal**: Reviewers can annotate threads and changes with decisions and comments

### 4.1 Thread-Level Review
**Priority**: High  
**Complexity**: Low

**Tasks:**
- Add review actions to thread:
  - Approve thread
  - Reject thread
  - Mark for escalation
  - Add reviewer comments
- Display review status in thread list
- Filter threads by review status
- Track review history

**Acceptance Criteria:**
- Review actions clear and accessible
- Status updates reflected immediately
- Comments timestamped and attributed
- Filter shows only threads with selected status

**Technical Details:**
- Status field in Thread model
- Comments array with author/timestamp
- Filter state in Zustand
- Visual indicators for review status

---

### 4.2 Change-Level Annotations
**Priority**: Medium  
**Complexity**: Low

**Tasks:**
- Add notes to individual changes
- Display notes inline in change list
- Support markdown in notes (future)
- Edit/delete notes

**Acceptance Criteria:**
- Notes visible in change cards
- Easy to add/edit notes
- Notes persist across sessions
- Notes included in exports

**Technical Details:**
- Notes array on Change model
- Inline note editor
- DOMPurify for sanitization
- Auto-save on edit

---

## Phase 5: Export & Reporting

**Goal**: Users can export structured data and human-readable summaries

### 5.1 JSON Export
**Priority**: High  
**Complexity**: Low

**Tasks:**
- Implement JSON export with complete data:
  - All documents (metadata only)
  - All changes with full context
  - All threads with rationales and status
  - Review decisions and comments
- Support "Save As" dialog
- Generate filename with timestamp
- Validate JSON before export

**Acceptance Criteria:**
- JSON is valid and complete
- File downloads automatically
- Filename descriptive (e.g., "threadline-export-2025-10-21.json")
- Can be reimported (future feature)

**Technical Details:**
- Serialize Zustand state
- Use File System Access API where available
- Fallback to Blob + download link
- JSON schema validation

---

### 5.2 HTML Summary Export
**Priority**: High  
**Complexity**: Medium

**Tasks:**
- Generate human-readable HTML report:
  - Executive summary (thread count, status breakdown)
  - Thread-by-thread breakdown:
    - Title and topic
    - Rationale
    - List of changes with context
    - Review status and comments
  - Appendix with full change details
- Style for email/print
- Support copy-paste into Word
- Include metadata (export date, document names)

**Acceptance Criteria:**
- HTML is well-formatted and readable
- Works in all modern browsers
- Copy-paste to Word preserves formatting
- Professional appearance
- Includes all essential information

**Technical Details:**
- Template-based generation (template literals)
- Inline CSS for portability
- DOMPurify for security
- Clean semantic HTML
- Print-friendly styles

---

### 5.3 Export Options
**Priority**: Medium  
**Complexity**: Low

**Tasks:**
- Export menu with options:
  - Full JSON export
  - HTML summary
  - Filtered export (selected threads only)
  - Review summary (approved/rejected only)
- Preview export before download (optional)
- Export settings (include/exclude fields)

**Acceptance Criteria:**
- Multiple export formats available
- Users can choose what to export
- Settings remembered across sessions
- Preview accurate (if implemented)

**Technical Details:**
- Headless UI menu component
- Export settings in Zustand
- Filter function for selective export
- Preview in modal (optional)

---

## Phase 6: Local Persistence

**Goal**: Users can save work-in-progress and resume later

### 6.1 Auto-Save
**Priority**: High  
**Complexity**: Medium

**Tasks:**
- Implement auto-save to IndexedDB:
  - Save state every 30 seconds
  - Save on significant actions (thread creation, moves)
  - Debounce rapid changes
- Store workspace in IndexedDB:
  - Documents (metadata + binary)
  - All changes
  - All threads
  - UI state (selections, filters)
- Handle storage quota errors

**Acceptance Criteria:**
- State persists across browser refreshes
- No data loss on crash/close
- Storage quota errors handled gracefully
- User notified of save status

**Technical Details:**
- idb wrapper for IndexedDB
- Debounced save function
- Storage quota checking
- Error handling and user feedback
- Clear/reset workspace option

---

### 6.2 Workspace Management
**Priority**: Medium  
**Complexity**: Medium

**Tasks:**
- Implement workspace management:
  - Create new workspace
  - Load existing workspace
  - Delete workspace
  - Rename workspace
  - List all workspaces
- Display workspace name in header
- Auto-load last workspace on app start
- Confirm before losing unsaved work

**Acceptance Criteria:**
- Multiple workspaces supported
- Easy to switch between workspaces
- Workspace names descriptive
- No accidental data loss

**Technical Details:**
- Workspace as top-level object in IndexedDB
- Workspace list in separate table
- Last workspace ID in localStorage
- Confirmation modals for destructive actions

---

## Phase 7: Polish & Performance

**Goal**: Ensure professional quality and smooth performance

### 7.1 Performance Optimization
**Priority**: High  
**Complexity**: Medium

**Tasks:**
- Optimize parsing performance:
  - Web Worker for all heavy processing
  - Batch processing for large document sets
  - Progress indicators during parsing
- Optimize rendering:
  - Virtual scrolling for long lists
  - Memoization for expensive computations
  - Lazy loading for change details
- Measure and optimize:
  - Initial parse time (<8s for 10 docs)
  - UI responsiveness (<3s for any action)
  - Memory usage (reasonable for 200 changes)

**Acceptance Criteria:**
- 10 documents parse in <8 seconds
- UI never freezes or stutters
- Smooth scrolling in long lists
- Memory usage stable

**Technical Details:**
- Web Workers for CPU-intensive tasks
- react-window for virtualization
- React.memo for component optimization
- Performance profiling with Chrome DevTools
- Consider code splitting if bundle >500KB

---

### 7.2 Error Handling & Validation
**Priority**: High  
**Complexity**: Low

**Tasks:**
- Implement comprehensive error handling:
  - Invalid DOCX files
  - Corrupt or unsupported formats
  - Parsing errors
  - Storage quota exceeded
  - Export failures
- User-friendly error messages
- Error recovery options
- Error logging (local only)

**Acceptance Criteria:**
- No unhandled errors crash the app
- Error messages clear and actionable
- Users can recover from errors
- Debugging information available (console)

**Technical Details:**
- Try-catch blocks around critical operations
- Error boundary components
- Toast notifications for errors
- Detailed console logging (dev mode)
- Graceful degradation

---

### 7.3 UI/UX Polish
**Priority**: Medium  
**Complexity**: Medium

**Tasks:**
- Enhance visual design:
  - Consistent color palette (red-gray-white per PRD)
  - Thread/weaving visual motif
  - Professional typography
  - Responsive spacing and layout
- Improve interactions:
  - Smooth animations/transitions
  - Loading states for all async operations
  - Empty states with helpful guidance
  - Tooltips and help text
- Keyboard shortcuts for power users
- Accessibility improvements (ARIA labels, keyboard nav)

**Acceptance Criteria:**
- Professional, polished appearance
- Consistent design language
- Smooth, delightful interactions
- Accessible to keyboard-only users
- Helpful for first-time users

**Technical Details:**
- Tailwind for consistent styling
- Heroicons for all icons
- Headless UI for accessible components
- CSS transitions for smooth animations
- Focus management for keyboard nav

---

### 7.4 Help & Onboarding
**Priority**: Medium  
**Complexity**: Low

**Tasks:**
- Create onboarding flow:
  - Welcome modal on first use
  - Step-by-step guide for first upload
  - Tooltips for key features
  - Sample data for testing
- Create help documentation:
  - In-app help panel
  - FAQ section
  - Keyboard shortcuts reference
  - Tips & tricks
- Video walkthrough (optional)

**Acceptance Criteria:**
- First-time users can complete basic workflow
- Help accessible from all screens
- Documentation clear and concise
- Sample data demonstrates key features

**Technical Details:**
- Tour library or custom modals
- Help panel as slide-over
- Markdown for documentation
- Sample DOCX files in repo

---

## Phase 8: Security & Testing

**Goal**: Ensure application is secure and thoroughly tested

### 8.1 Security Hardening
**Priority**: Critical  
**Complexity**: Medium

**Tasks:**
- Implement Content Security Policy:
  - No external scripts
  - No inline scripts (if possible)
  - No remote resources
- Sanitize all user input and document content:
  - DOMPurify for HTML
  - Validate all imports (JSON, LLM responses)
  - Escape special characters
- Verify no network calls:
  - Audit all dependencies
  - Test in offline mode
  - No analytics or tracking
- Security testing:
  - Test with malicious DOCX files
  - Test XSS vectors
  - Test import validation

**Acceptance Criteria:**
- CSP headers strict and enforced
- No XSS vulnerabilities
- All content sanitized
- Works offline (after initial load)
- No data leakage to network
- Passes security audit

**Technical Details:**
- CSP in HTML meta tag
- DOMPurify on all rendered content
- Input validation functions
- Offline mode testing
- Security linting with eslint-plugin-security

---

### 8.2 Comprehensive Testing
**Priority**: High  
**Complexity**: High

**Tasks:**
- Unit tests for all utilities:
  - DOCX parsing
  - Change extraction
  - Clustering algorithms
  - Export generation
- Integration tests for workflows:
  - Upload → Parse → Thread → Export
  - Thread operations (create, merge, split)
  - Review workflow
- Component tests:
  - All major UI components
  - User interactions (click, drag, type)
  - State updates
- E2E tests (optional):
  - Complete user journeys
  - Browser compatibility

**Acceptance Criteria:**
- >80% code coverage
- All critical paths tested
- Tests run fast (<30s)
- Tests reliable (no flakiness)
- CI/CD integration ready

**Technical Details:**
- Vitest for unit tests
- React Testing Library for component tests
- Mock File API for testing uploads
- Sample DOCX files for testing
- GitHub Actions for CI (future)

---

### 8.3 Browser Compatibility
**Priority**: Medium  
**Complexity**: Low

**Tasks:**
- Test in major browsers:
  - Chrome/Edge (primary)
  - Firefox
  - Safari
  - Mobile browsers (secondary)
- Handle browser-specific quirks:
  - File System Access API fallbacks
  - IndexedDB differences
  - Web Worker support
- Document minimum browser versions
- Graceful degradation for unsupported features

**Acceptance Criteria:**
- Works in Chrome, Edge, Firefox, Safari (latest 2 versions)
- Core functionality works in all tested browsers
- Fallbacks work when APIs unavailable
- Clear messaging for unsupported browsers

**Technical Details:**
- Feature detection, not browser detection
- Polyfills where needed
- BrowserStack or local testing
- Browser support documented in README

---

## Phase 9: Documentation & Deployment

**Goal**: Prepare for distribution and provide comprehensive documentation

### 9.1 Technical Documentation
**Priority**: Medium  
**Complexity**: Low

**Tasks:**
- Document architecture:
  - Component hierarchy
  - State management patterns
  - Data flow diagrams
  - Key algorithms
- Code documentation:
  - TSDoc comments for complex functions
  - README for each major module
  - Contributing guidelines
- Development guide:
  - Setup instructions
  - Build/test commands
  - Debugging tips
  - Common issues

**Acceptance Criteria:**
- Architecture clear to new developers
- Code comments explain "why" not "what"
- Developer can contribute after reading docs
- Common issues documented

**Technical Details:**
- TSDoc for exported functions
- Markdown for docs
- Diagrams with Mermaid
- Keep docs in /docs folder

---

### 9.2 User Documentation
**Priority**: Medium  
**Complexity**: Low

**Tasks:**
- User guide:
  - Getting started
  - Core workflows (upload, thread, export)
  - Advanced features
  - Tips & best practices
- Video tutorial (optional)
- FAQ
- Troubleshooting guide
- Privacy & security statement

**Acceptance Criteria:**
- Non-technical users can learn the app
- All features documented
- Common questions answered
- Privacy concerns addressed

**Technical Details:**
- Markdown or simple HTML
- Screenshots/screencasts
- Hosted in repo or as static site

---

### 9.3 Distribution Package
**Priority**: High  
**Complexity**: Low

**Tasks:**
- Build optimized production bundle:
  - Minimize bundle size
  - Code splitting if needed
  - Asset optimization (images, fonts)
  - Generate SRI hashes
- Create distribution package:
  - Single HTML file (if possible) or HTML + assets/
  - README with usage instructions
  - License file
  - Version info
- Test distribution package:
  - Works when served from file://
  - Works from simple HTTP server
  - Works from SharePoint/internal portal

**Acceptance Criteria:**
- Bundle < 500KB (gzipped)
- Works when double-clicked (file://)
- Works on corporate networks
- No dependencies on external resources
- SRI hashes for all assets

**Technical Details:**
- Vite build optimization
- Consider inline critical CSS/JS
- Test with python -m http.server
- Test in isolated environment
- Document hosting requirements

---

## Phase 10: MVP Release Readiness

**Goal**: Final validation and preparation for initial release

### 10.1 User Acceptance Testing
**Priority**: Critical  
**Complexity**: Medium

**Tasks:**
- Recruit 2-3 pilot users
- Prepare test scenarios:
  - Real-world document sets
  - Various complexity levels
  - Different workflow patterns
- Conduct supervised testing sessions
- Gather feedback on:
  - Usability
  - Performance
  - Feature completeness
  - Pain points
- Iterate based on feedback

**Acceptance Criteria:**
- Users complete core workflow in <15 mins
- Users report "clearer view of issues"
- No critical bugs discovered
- Users willing to use in real work

**Technical Details:**
- Test with real DOCX files (redacted if needed)
- Record sessions for analysis
- Structured feedback forms
- Prioritized issue list

---

### 10.2 Security & Privacy Review
**Priority**: Critical  
**Complexity**: Low

**Tasks:**
- Security audit:
  - Code review for vulnerabilities
  - Dependency audit
  - CSP validation
  - Network traffic analysis (should be zero)
- Privacy review:
  - Data handling documentation
  - Storage scope and duration
  - Third-party dependencies audit
- Legal review (if needed):
  - License compliance
  - Terms of use
  - Disclaimers

**Acceptance Criteria:**
- No security vulnerabilities
- Privacy policy clear
- Passes IT security review
- Legal approval obtained

**Technical Details:**
- npm audit for dependencies
- CSP testing tools
- Network monitoring during use
- Document data flow

---

### 10.3 Release Preparation
**Priority**: High  
**Complexity**: Low

**Tasks:**
- Version 0.1 tagging
- Release notes
- Distribution package creation
- Deployment instructions
- Support plan:
  - How to report issues
  - How to request features
  - Update mechanism
- Announcement materials:
  - Demo video
  - Email template
  - Presentation deck

**Acceptance Criteria:**
- Clean build from tagged version
- Release notes complete and accurate
- Distribution package tested
- Support channels established

**Technical Details:**
- Git tag v0.1
- CHANGELOG.md
- GitHub release with assets
- Issue templates in repo

---

## Success Metrics & Validation

### Definition of Done for MVP

The MVP is complete when:

1. ✅ **Core Workflow**: User can upload 5 DOCX files, see auto-clustered changes, manually refine threads, add rationales, and export HTML summary in <15 minutes
2. ✅ **Security**: 100% client-side operation verified (no network calls, CSP enforced)
3. ✅ **Performance**: Handles 10 documents with 200 changes smoothly (<8s parse, <3s UI response)
4. ✅ **Quality**: All critical tests pass, no known critical bugs
5. ✅ **Usability**: 3+ pilot users successfully complete workflow
6. ✅ **Documentation**: User guide and technical docs complete

### Key Performance Indicators

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Parse Time | <8s for 10 medium docs | Performance profiling |
| UI Response | <3s for any action | User observation |
| Time to Export | <15 min total workflow | User testing |
| User Satisfaction | "Clearer view" feedback | User surveys |
| Security Compliance | Pass IT review | Formal audit |
| Code Coverage | >80% | Vitest coverage report |
| Bundle Size | <500KB gzipped | Build output |

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| DOCX parsing edge cases | High | Medium | Extensive test corpus, graceful error handling |
| Performance with large docs | High | Low | Web Workers, virtualization, profiling |
| Browser compatibility | Medium | Medium | Feature detection, polyfills, testing matrix |
| Storage quota limits | Medium | Low | Quota checking, compression, user notifications |

### Product Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User confusion (complex UI) | High | Medium | Onboarding, help system, user testing iterations |
| Heuristic clustering inaccuracy | Medium | High | Easy manual refinement, bulk operations |
| LLM integration complexity | Low | Medium | Optional feature, clear instructions |
| Resistance to new workflow | High | Medium | Familiar export formats, pilot program, training |

---

## Dependencies & Prerequisites

### Required Before Starting Phase 1
- ✅ Tech stack initialized (DONE)
- ✅ Development environment set up (DONE)
- ✅ Team familiar with React + TypeScript
- ✅ Access to sample DOCX files with tracked changes

### External Dependencies
- None (fully client-side)

### Optional Enhancements
- Design system or style guide
- Sample/template starter packs
- Legal terminology dictionary
- Integration with document management systems (future)

---

## Timeline Estimate (Rough)

**Total MVP Development Time: 8-12 weeks** (single full-time developer)

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 0: Foundation | ✅ DONE | Critical |
| Phase 1: Ingestion & Parsing | 2-3 weeks | Critical |
| Phase 2: Auto-Clustering | 1-2 weeks | High |
| Phase 3: Manual Refinement UI | 2-3 weeks | Critical |
| Phase 4: Review & Comments | 1 week | High |
| Phase 5: Export | 1 week | High |
| Phase 6: Persistence | 1 week | High |
| Phase 7: Polish & Performance | 1-2 weeks | High |
| Phase 8: Security & Testing | 1-2 weeks | Critical |
| Phase 9: Documentation | 1 week | Medium |
| Phase 10: Release Prep | 1 week | Critical |

**Note**: Phases can overlap. For example, testing happens throughout, not just in Phase 8.

---

## Next Steps

### Immediate Actions
1. **Validate this plan** with stakeholders
2. **Prioritize phases** - confirm must-haves vs. nice-to-haves
3. **Set up test corpus** - collect diverse DOCX files for testing
4. **Begin Phase 1.1** - File upload interface (lowest risk, immediate progress)

### Iteration Strategy
- Implement in phase order, but validate continuously
- Build horizontal slices (end-to-end thin features) before vertical depth
- User feedback after Phases 3, 5, and 7
- Security review after Phase 8
- Adjust plan based on learnings

### Future Considerations (Post-MVP)
- Real-time collaboration (v0.2+)
- Round-trip Word integration (v1.0+)
- Direct change acceptance (v1.2+)
- Multi-user cloud sync (v2.0+)
- Analytics dashboard (v2.0+)

---

## Appendices

### A. Technology Stack Reference

| Category | Technology | Purpose | Priority |
|----------|-----------|---------|----------|
| Build | Vite | Fast dev server, optimized builds | Critical |
| Language | TypeScript | Type safety, better DX | Critical |
| UI Framework | React 19 | Component-based UI | Critical |
| Styling | Tailwind CSS | Consistent, rapid styling | High |
| State | Zustand | Lightweight state management | High |
| Components | Headless UI | Accessible primitives | High |
| Icons | Heroicons | Consistent iconography | Medium |
| File Parsing | JSZip | DOCX unzipping | Critical |
| DOCX Preview | docx-preview | Document rendering | Medium |
| Storage | idb | IndexedDB wrapper | High |
| Sanitization | DOMPurify | XSS prevention | Critical |
| Virtualization | react-window | Large list performance | High |
| Testing | Vitest | Fast unit tests | High |
| Testing | React Testing Library | Component tests | High |
| Linting | ESLint | Code quality | High |
| Security | eslint-plugin-security | Vulnerability detection | Critical |
| Formatting | Prettier | Code consistency | Medium |

### B. Data Flow Diagram

```
┌─────────────────┐
│  User Uploads   │
│  DOCX Files     │
└────────┬────────┘
         │
         v
┌─────────────────────────┐
│  Web Worker:            │
│  Parse DOCX             │
│  Extract Changes        │
│  Generate Hashes        │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  Zustand Store:         │
│  - documents[]          │
│  - changes[]            │
│  - threads[]            │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  Auto-Clustering:       │
│  - Group by clause      │
│  - Suggest topics       │
│  - Create buckets       │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  Manual Refinement UI:  │
│  - Thread List          │
│  - Change List          │
│  - Thread Metadata      │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  Review & Annotate:     │
│  - Approve/Reject       │
│  - Add comments         │
│  - Mark status          │
└────────┬────────────────┘
         │
         v
┌─────────────────────────┐
│  Export:                │
│  - JSON (structured)    │
│  - HTML (readable)      │
└─────────────────────────┘
```

### C. Core User Flows

**Flow 1: Outbound Drafting**
1. Upload own redlined documents
2. Review auto-suggested threads
3. Refine threads (rename, merge, split)
4. Add rationale to each thread
5. Mark threads as "Ready for Review"
6. Export HTML summary for counterparty

**Flow 2: Inbound Review**
1. Upload counterparty's redlined documents
2. Review auto-clustered changes
3. Manually refine threads by issue
4. Approve/reject each thread
5. Add reviewer comments
6. Export review summary + JSON log

**Flow 3: LLM-Assisted Clustering**
1. Upload documents
2. Export clustering packet (JSON)
3. Paste into approved LLM tool
4. Copy LLM's clustering suggestions
5. Import and review suggestions
6. Accept/modify suggested threads
7. Continue with manual refinement

---

**End of Implementation Plan**

This plan is designed to be iterative and adaptable. As development progresses and user feedback is gathered, priorities may shift and new insights may emerge. The plan should be reviewed and updated regularly to reflect the current state and direction of the project.
