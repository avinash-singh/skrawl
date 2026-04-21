# Skrawl — Implementation Plan

## Context
Skrawl is a new cross-platform note-taking app. The user wants a **clean, minimal** experience with a Personal/Business toggle, voice input, AI-powered reminder suggestions (Claude API), folder organization, checklist mode, color coding, and light/dark themes. The approach is **prototype first** (HTML) → get user feedback → build the real app (React Native + Expo).

---

## PHASE 1: HTML Interactive Prototype

**Goal**: A single self-contained HTML file that simulates all major screens and interactions. User reviews this before any real code is written.

**File**: `/Users/asingh39/Workspace/skrawl/prototype/index.html`

### Screens

1. **Home / Note List**
   - "Skrawl" header, search icon, settings gear
   - Note cards with: title, body preview, color strip, timestamp, folder badge, checklist progress
   - **FAB "+"** bottom-right for new note
   - **Personal/Business toggle** — pill-shaped control above the tab bar (blue=personal, green=business)
   - Switching context animates the note list with a crossfade

2. **Note Editor** (slide from right)
   - Editable title + body area
   - Bottom toolbar: mic icon, checklist toggle, "/" slash command, color palette, AI sparkle
   - Mic tap → pulsing red recording animation → simulated transcription
   - Checklist mode → lines become checkbox items
   - **AI reminder popup**: slides up after typing — "Remind you about 'dentist appointment' tomorrow at 9am?" Accept/Dismiss

3. **Folder List** (slide from right)
   - Folders with note counts, "+" to create folder
   - Default: "All Notes", "Inbox"

4. **Search** (slides down)
   - Large search input, real-time filtering, highlighted matches

5. **Settings** (slide from right)
   - Theme toggle (live preview)
   - Calendar integration: Personal Calendar / Business Calendar dropdowns
   - Account placeholder

6. **Color Picker** (modal overlay)
   - 8 colors in a 4×2 grid

### Design System
- **Light**: white bg (#FFFFFF), gray surface (#F5F5F7), dark text (#1C1C1E), accent blue (#007AFF)
- **Dark**: near-black bg (#1C1C1E), dark surface (#2C2C2E), white text, accent blue (#0A84FF)
- **Note colors**: 8 options (default, red, orange, yellow, green, blue, purple, pink)
- **Typography**: system font stack, 28px title, 20px heading, 16px body, 13px caption
- **Layout**: 390px max-width (iPhone frame), 16px card radius, 12px button radius

### Mock Data
8-10 pre-populated notes across Personal/Business, various folders and colors, some as checklists.

---

## PHASE 2: React Native + Expo App

### Tech Stack
- **Framework**: React Native + Expo (SDK 54)
- **Routing**: Expo Router (file-based)
- **State**: Zustand
- **Local DB**: expo-sqlite (with FTS5 for search)
- **Cloud Sync**: Supabase (Postgres + Auth)
- **AI**: Claude API (Sonnet for reminder extraction)
- **Voice**: @jamsch/expo-speech-recognition
- **Calendar**: expo-calendar
- **Dates**: chrono-node (natural language parsing)
- **List**: @shopify/flash-list (virtualized)

### Project Structure
```
skrawl/
  prototype/index.html
  skrawl-app/
    app/
      _layout.tsx              # Root layout (providers)
      (tabs)/
        _layout.tsx            # Tab navigator
        index.tsx              # Home / Note list
        folders.tsx            # Folder list
        search.tsx             # Search
        settings.tsx           # Settings
      note/
        [id].tsx               # Note editor
        new.tsx                # Instant capture
    src/
      components/notes/        # note-card, editor, checklist, color-picker, ai-reminder, voice-overlay
      components/common/       # context-toggle, fab, search-bar, slash-command-menu, themed-view/text
      hooks/                   # use-notes, use-folders, use-search, use-sync, use-theme, use-voice-input, use-ai-reminders, use-calendar, use-context
      services/                # database, sync-engine, supabase-client, ai-service, calendar-service, speech-service, date-parser
      models/                  # note, folder, reminder, tag (TypeScript interfaces)
      store/                   # Zustand: note-store, folder-store, ui-store, sync-store
      theme/                   # colors, typography, spacing, ThemeProvider
```

### Data Models

**Note**: id, title, body, context (personal|business), folder_id, color, is_checklist, checklist_items[], tags[], images[], priority (null|0-3), manual_order, recurrence (null|cron_expression|natural_text), created_at, updated_at, deleted_at, synced_at, is_dirty

**Folder**: id, name, context, parent_id, icon, order, created_at, updated_at, is_dirty

**Reminder**: id, note_id, text, remind_at, calendar_event_id, context, status, ai_suggested, auto_set, created_at, is_dirty

**FocusSession**: id, note_id, duration_planned, duration_actual, started_at, completed_at, context

**MealEntry**: id, goal_id, description, image_url, calories_detected, calories_override, meal_type (breakfast|lunch|dinner|snack), ai_confidence, source (manual|image|suggestion), created_at, is_dirty

**ExerciseEntry**: id, goal_id, type, duration_min, calories_burned, source (manual|health_kit), created_at, is_dirty

### Key Architecture Decisions

1. **Personal/Business = data filter**, not navigation branch. Same screens, one toggle sets the filter.
2. **Local-first sync**: All writes → SQLite immediately → mark dirty → background push to Supabase. Pull on foreground/reconnect/60s interval. Last-write-wins conflict resolution.
3. **Instant capture**: `note/new` opens with cursor in title, keyboard up, note pre-created in SQLite. Empty notes auto-deleted on back.
4. **AI reminders**: Debounced 1.5s after typing stops, notes > 20 chars. Claude Sonnet extracts dates/actions. Suggestions shown as dismissable card. Confidence threshold 0.7. Silent fail on error — never blocks note-taking.
5. **Calendar integration**: User assigns one calendar to Personal, one to Business in settings. Accepted reminders create events in the matching calendar via expo-calendar.
6. **Soft deletes** everywhere (deleted_at timestamp).
7. **FTS5** for fast full-text search.

### Implementation Sequence

| Step | What |
|------|------|
| **Phase 1** | |
| 1.1 | Build HTML prototype |
| 1.2 | User review + iterate |
| **Phase 2 — Core** | |
| 2.1 | Init Expo project, install deps, configure TS |
| 2.2 | Theme system (colors, typography, ThemeProvider) |
| 2.3 | SQLite database + migrations (include new models: FocusSession, MealEntry, ExerciseEntry) |
| 2.4 | Data models + Zustand stores |
| 2.5 | Navigation skeleton (Expo Router, tabs, stack) |
| 2.6 | Home screen — compact row list + swipe actions + drag to reorder |
| 2.7 | Quick capture (FAB tap + long-press voice) + detail bottom sheet |
| 2.8 | Checklist mode + image attachments |
| 2.9 | Color picker + quick priority change |
| 2.10 | Folder management + smart categorization (AI auto-folder) |
| 2.11 | Search (FTS5) |
| 2.12 | Voice input + natural language parsing (title + reminder extraction) |
| 2.13 | Undo toast system (global undo for destructive/AI actions) |
| **Phase 2 — AI & Automation** | |
| 2.14 | AI reminder suggestions + auto-set for critical tasks (Claude API) |
| 2.15 | Auto-title / summarize note (Claude API) |
| 2.16 | Natural language recurring tasks ("Every Monday", "Daily at 9am") |
| 2.17 | Daily briefing notification |
| 2.18 | Focus mode with pomodoro/countdown timer |
| **Phase 2 — Goals & Health** | |
| 2.19 | Goal setting AI assistant (suggest targets, adjust difficulty) |
| 2.20 | Calorie intake meal updater (image/NL → calorie detection, time-based suggestions, exercise adjustment) |
| 2.21 | Apple Health / fitness sync for exercise-based calorie adjustment |
| **Phase 2 — Infrastructure** | |
| 2.22 | Calendar integration |
| 2.23 | Supabase auth + sync engine |
| 2.24 | Export (plain text + PDF) |
| 2.25 | Settings screen (swipe customization, AI vibe, integrations) |
| 2.26 | Slash commands + inline tags |
| **Phase 2 — Widgets** | |
| 2.27 | Top items widget (3-5 prioritized items) |
| 2.28 | Quick add widget (single-tap create) |
| 2.29 | Speech input widget (one-tap voice capture) |
| 2.30 | AI assistant widget (briefing, suggestions) |
| 2.31 | Goal streak widget (ring visualizations) |
| **Phase 2 — Polish** | |
| 2.32 | Animations, haptics, onboarding, first-time tooltips |

### Verification
- **Prototype**: Open `prototype/index.html` in browser. Test all screens, theme toggle, context switch, note creation, checklist mode, AI popup, search, color picker.
- **App**: Run `npx expo start` → test on Expo Go (iOS/Android). Verify: note CRUD, search, folders, voice input, AI suggestions, calendar events, sync, themes.

---

## Competitive Research Summary

Analyzed 12 apps (Apple Notes, Bear, Notion, Obsidian, Google Keep, Simplenote, Drafts, Craft, Todoist, TickTick, Evernote, OneNote). Key takeaways:

### Patterns to Adopt
- **Instant capture** (Drafts): open to blank cursor, zero friction
- **Note coloring** (Google Keep): 8 background colors, fast visual scanning
- **Progressive disclosure**: clean by default, slash commands for power features
- **Inline tags** (Bear): `#work/projects` — hierarchy without rigid folders

### Pain Points to Avoid
- Sync failures / data loss (#1 complaint across all apps)
- Too many taps to create a note
- Performance degradation at scale (use virtualized lists + SQLite)
- Notes written and never seen again (consider "On this day" resurfacing later)

### Suggested Feature List (beyond core requirements)

**Include in v1:**
- Inline `#tags` with nesting
- Slash commands (/, Heading, Checklist, Reminder, Color)
- Quick capture widget
- Natural language date parsing in reminders
- **Drag to reorder** — Long-press + drag to manually sort items within the same priority group. Persist manual order in DB.
- **Undo toast** — On any destructive/automatic action (mark done, delete, AI auto-updates), show a toast with "Undo" button (5s window).
- **Quick priority change** — Partial swipe to reveal P0-P3 buttons, change priority without opening detail sheet.
- **Image attachments** — Attach photos to notes/tasks from detail sheet. Thumbnail indicator on row. Store via Supabase Storage.
- **Natural language input** — Parse "Call dentist tomorrow at 2pm" into structured title + reminder automatically using Claude.
- **Auto-recurring tasks** — Natural language recurrence: "Every Monday", "Daily at 9am", "First of every month". Auto-recreate completed tasks on schedule.
- **Export** — Export any note as plain text or PDF from the action sheet.

**Include in v1 — AI Features:**
- **Auto reminder set** — AI analyzes critical/time-sensitive tasks and auto-suggests or auto-sets reminders. User gets undo toast to revert.
- **Smart categorization** — AI auto-suggests folder and priority on creation based on content analysis. Suggestion shown as dismissable chip, not auto-applied.
- **Daily briefing** — Morning notification: what's due today, what's overdue, streak progress, AI-prioritized "start with this" suggestion.
- **Summarize note / Auto-title** — For notes with body content, AI generates a 1-line title. Shown as suggestion in the detail sheet.
- **Focus mode** — Tap a single item to enter distraction-free view with just that item and a countdown/pomodoro timer. Track focus sessions.

**Include in v1 — Widgets:**
- **Top items widget** — Shows top 3-5 prioritized items on home screen.
- **Quick add widget** — Single-tap to create from home screen, opens directly into capture.
- **Speech input widget** — One-tap voice capture from home screen, creates note via speech-to-text.
- **AI assistant widget** — Quick access to AI features (briefing, suggestions, search).
- **Goal streak widget** — Shows current streak progress for active goals with ring visualizations.

**Include in v1 — Goals & Health:**
- **Goal Setting AI Assistant** — AI-powered goal creation: suggest targets based on user profile, adjust difficulty based on history, recommend related goals.
- **Calorie Intake Meal Updater:**
  - Allow image upload or natural language meal description ("grilled chicken with rice and salad")
  - Auto-detect calories from description/image using Claude vision
  - Auto-suggest meal entries based on user history and time of day (e.g., suggest "morning coffee 50cal" at 8am)
  - Adjust daily calorie target dynamically based on logged exercise/gym activity (e.g., burned 400cal at gym → increase intake allowance)
  - Weekly nutrition summary with trends

**Consider for v2:**
- Bidirectional note links / backlinks
- Smart resurfacing ("On this day")
- One-click share as web page
- AI-powered natural language search
- Shared lists & task assignment (collaboration)
- Note version history
- Batch operations (multi-select + bulk actions)
