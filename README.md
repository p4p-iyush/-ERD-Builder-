Here are all the features of ERD Builder:

---

## Core Canvas
- Infinite zoomable and pannable canvas
- Grid background with dot and line overlay
- Minimap navigation panel
- Smooth drag animations
- Canvas lock/unlock toggle
- Grid show/hide toggle
- Zoom in, zoom out, fit to screen controls
- Multi-select with Shift click and drag selection
- Canvas boundary limits (no infinite scroll off-screen)

## Table Management
- Create new tables with auto-generated default columns
- Rename tables by double-clicking header
- Delete tables (removes connected edges automatically)
- Duplicate tables with offset positioning
- Color-code tables from 10 color palette
- Drag and reposition tables freely on canvas
- Table column count badge in header
- Click table to open properties panel

## Column Management
- Add columns with one click
- Rename columns inline
- Delete columns (PK columns protected)
- Drag to reorder columns (DnD Kit)
- Set data type from 18 PostgreSQL types
- Set default value
- Visual badges — PK, FK, UQ, NN
- Data type color indicators per category

## Column Constraints
- Primary Key (PK) — auto sets unique + not null
- Foreign Key (FK) — with referenced table and column
- Unique (UQ)
- Not Null (NN)
- Nullable toggle
- Default value field

## Supported Data Types (18 total)
- Numeric — INTEGER, BIGINT, SMALLINT, SERIAL, BIGSERIAL, FLOAT, DECIMAL, NUMERIC
- Text — STRING, VARCHAR, TEXT, UUID, JSON, JSONB
- Boolean — BOOLEAN
- Date/Time — DATE, TIMESTAMP, TIMESTAMPTZ

## Relationship System
- One-to-One relationships
- One-to-Many relationships
- Many-to-Many relationships (with junction table in SQL)
- Drag connection handles between tables
- Click edge to open relationship panel
- Edit relationship type (1:1, 1:M, M:M)
- Add optional relationship label
- Delete relationships
- Relationship symbols on edge labels (1, ∞)
- Dashed lines for Many-to-Many
- Color-coded edges per relationship type

## Smart Relationship Highlighting
- Hover table to highlight all connected tables
- Connected edges animate/highlight
- Unrelated tables fade out
- Scale effect on highlighted node
- Reset on mouse leave

## Bidirectional SQL Sync
- Diagram → SQL (live, auto-updates on every change)
- SQL → Diagram (paste and apply)
- Supports CREATE TABLE parsing
- Supports ALTER TABLE ADD FOREIGN KEY parsing
- Supports INSERT INTO (table detection)
- Silently skips CREATE EXTENSION, CREATE INDEX
- 600ms debounce on live parse
- Live change preview before applying (add/replace/keep)
- Auto-generates FK relationship edges on apply
- Smart replace — replaces matching tables, keeps others
- Auto-layout all nodes in grid after apply
- fitView after apply so nothing goes off-screen

## SQL Preview Panel
- Syntax-highlighted SQL output
- Keywords, identifiers, strings, numbers all color-coded
- Line count indicator
- Copy SQL to clipboard with one click
- Download as .sql file
- Preview mode (read-only) and Edit SQL mode (input)
- Parse error display with line info
- Parse warning display
- Collapsible panel
- Live stats — tables, relationships, columns count
- Auto-relationship indicator

## Export Features
- Export as PNG (2x resolution, controls excluded)
- Export as SVG (scalable vector)
- Export as JSON (full diagram state with metadata)
- Export as SQL (PostgreSQL schema file)
- Copy SQL to clipboard
- Download .sql file directly from SQL panel
- Export modal with format descriptions and notes

## Undo / Redo
- 50-step undo history
- Redo stack
- Snapshot pushed before every destructive action
- Snapshot on drag end (not during drag)
- Undo/Redo via keyboard (Ctrl+Z, Ctrl+Shift+Z)
- Undo/Redo buttons in floating toolbar

## Auto Save
- Automatically saves to Supabase every 2 seconds
- Debounced — no save during rapid changes
- Manual save with Ctrl+S (bypasses debounce)
- Save status indicator — idle, saving, saved, error
- Retry on error via click
- Restores last session on editor open

## Search & Navigation
- Search tables by name (Ctrl+F)
- Live filtered results dropdown
- Click result to fly camera to that table
- setCenter with smooth animation
- Show column count per result
- Close with Escape or clicking away

## Keyboard Shortcuts (15 total)
- Ctrl+N — Add new table
- Ctrl+S — Save now
- Ctrl+Z — Undo
- Ctrl+Shift+Z — Redo
- Ctrl+C — Copy selected
- Ctrl+V — Paste
- Ctrl+D — Duplicate
- Ctrl+A — Select all
- Delete — Delete selected
- Ctrl+F — Search tables
- Ctrl+` — Toggle SQL preview
- Ctrl+Shift+F — Fit view
- Ctrl+/ — Show shortcuts modal
- Escape — Deselect / close
- F2 — Rename table

## Project Management
- Create new projects
- Rename projects (inline in dashboard and editor header)
- Delete projects
- Recent projects tab (persisted in localStorage)
- All projects tab with search filter
- Project card with table/relationship count preview
- Last updated timestamp (relative time)
- Public/private badge on card

## Authentication
- Email and password signup
- Email and password login
- Google OAuth (one-click)
- Email confirmation flow
- Password strength indicators (signup)
- Show/hide password toggle
- Forgot password link
- Auth middleware protecting editor and dashboard routes
- Session persistence via Supabase SSR cookies

## Sharing System
- Toggle project public/private
- Unique share ID per project (UUID)
- Public share URL — /shared/{share_id}
- Read-only canvas (no editing)
- Pan and zoom still available for viewers
- No account required to view shared diagram
- Shared page shows table/relationship/column counts
- Revoke access instantly by toggling private
- Server-rendered shared page for fast load
- SEO metadata per shared diagram

## Starter Templates (4 total)
- E-Commerce — users, products, categories, orders, order items, addresses (6 tables)
- Blog CMS — users, posts, tags, post_tags, comments (5 tables)
- School Management — students, teachers, courses, enrollments, grades (5 tables)
- Chat Application — users, workspaces, channels, members, messages (5 tables)
- All templates include pre-built relationships

## UI / UX
- Dark mode (default)
- Light mode
- Theme toggle with persistent preference
- Floating toolbar (centered bottom)
- Properties panel slides in from right
- Toast notifications — success, error, info, warning
- Auto-dismiss toasts with progress bar
- Keyboard shortcuts modal with category grouping
- Confirm dialog for destructive actions
- Responsive layout (mobile toolbar scrolls horizontally)
- Smooth animations throughout (fade, slide, scale)
- Error boundary for graceful crash handling
- Loading states on editor and dashboard

## Properties Panels
- Table Properties — name, color, stats, column list
- Column Properties — full constraint editor with toggles
- Relationship Properties — type selector, label, delete
- Back navigation between panels
- Done button to close

---

That's the complete feature list — **100+ features across 15 categories**. Let me know what you want to discuss!