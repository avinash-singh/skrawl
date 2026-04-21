# Skrawl — Implementation Plan

## Current State

Phase 1 (HTML prototype) is complete. Mobile and desktop prototypes are functional with all core UX validated. Ready to build the real app.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Routing | Expo Router v4 (file-based) |
| State | Zustand |
| Local DB | expo-sqlite + FTS5 |
| Cloud | Supabase (Postgres + Auth + Storage) |
| AI | Claude API (Sonnet for speed, Opus for complex) |
| Voice | @jamsch/expo-speech-recognition |
| Calendar | expo-calendar |
| NL Dates | chrono-node |
| List | @shopify/flash-list |
| Images | expo-image-picker + expo-image-manipulator |
| Notifications | expo-notifications |
| Health | expo-health (HealthKit / Google Fit) |
| Widgets | react-native-widget-kit (iOS) / @mccsoft/react-native-widget (Android) |
| PDF | react-native-html-to-pdf |
| Haptics | expo-haptics |
| Gestures | react-native-gesture-handler + react-native-reanimated |

---

## Implementation Order

Work is ordered by dependency chain — each step builds on the previous. Steps within the same phase can be done in any order.

### Phase A: Skeleton

1. Init Expo project, install all deps, configure TypeScript, ESLint
2. Theme system — dark/light/system, all color tokens from prototype, typography scale
3. SQLite database — all tables, migrations, FTS5 virtual table
4. TypeScript interfaces for all models (Note, Folder, Reminder, Goal, MealEntry, ExerciseEntry, FocusSession)
5. Zustand stores — note-store, folder-store, goal-store, ui-store, sync-store, undo-store
6. Navigation skeleton — Expo Router tabs (Notes/Goals/Calendar/Search), stacks for detail/settings/focus

**Verify**: App launches. Tab navigation works. Theme toggles between dark/light. Insert a test note into SQLite and read it back. Stores hydrate from DB on launch.

### Phase B: Home Screen + CRUD

7. RowItem component — checkbox, type icon, title, subtitle, priority badge, color stripe
8. Home screen list — FlashList, section labels (Pinned/All Items), context toggle (Personal/Business)
9. Sort dropdown — priority/recent
10. Quick capture panel — text input, CTAs for details/list/reminder/priority/folder, Enter to submit
11. MorphingFAB — tap=open capture, long-press=voice placeholder. Mic badge, tooltip, icon morph
12. Detail bottom sheet — title, body, checklist editor, priority buttons, folder picker, reminder bar, auto-save on dismiss
13. Swipe actions — configurable left/right (done/pin/delete/archive), gesture handler, color-coded reveal
14. Drag to reorder — long-press to drag within same priority group, persist manual_order
15. Undo toast — global system for all destructive actions, 5s reversal window

**Verify**: Create items via capture panel. All items render in list with correct styling. Tap opens detail sheet, edits save. Swipe left marks done with celebration. Swipe right pins. Drag reorders. Undo reverses last action. Context toggle filters correctly.

### Phase C: Organization

16. Folder management — sidebar drawer, create/edit/delete with color picker, sub-folders, move items
17. Color picker — 8-color grid, applied to notes, reflected in row stripe
18. Image attachments — pick from camera/gallery, compress, thumbnail grid in detail sheet, indicator on row
19. Search — FTS5 queries, filter pills (notes/lists/tasks), include-completed toggle, highlighted matches, recently opened
20. Quick priority change — partial swipe reveals P0-P3 buttons

**Verify**: Create folders, move items between them. Folder colors show on rows. Attach an image, see thumbnail. Search finds items by title and body content. Priority change via swipe works without opening detail.

### Phase D: Voice + AI

21. Voice input — speech-to-text streaming with waveform UI, triggered from FAB long-press
22. Natural language parsing — Claude extracts title, reminder time, priority, folder from free-text input
23. AI reminder suggestions — debounced after typing, smart time options, confidence threshold
24. Auto-set reminders — AI auto-suggests reminders for P0/P1 items, undo-able
25. Smart categorization — AI suggests folder + priority on creation, shown as dismissable chips
26. Auto-title / summarize — AI generates title for notes with body content, shown as ghost text

**Verify**: Long-press FAB, speak "Call dentist tomorrow at 2pm" — voice transcribes, NL parser populates title + reminder. AI suggestions appear in detail sheet and can be accepted/dismissed. Auto-reminders appear with undo toast. Smart categorization suggests correct folder.

### Phase E: Automation + Productivity

27. Recurring tasks — NL recurrence ("Every Monday"), auto-recreate on completion, recurrence icon on row
28. Focus mode — distraction-free view, pomodoro timer (25/5/15), session tracking
29. Export — plain text + PDF from action sheet, share via system share sheet
30. Daily briefing — scheduled notification, due/overdue/streak summary, "start with this" pick
31. Slash commands — "/" menu in body editor (Heading, Checklist, Reminder, Color, Focus)
32. Inline tags — "#tag" with autocomplete, searchable, filterable

**Verify**: Create a recurring task "Every Monday", complete it, verify next Monday's instance appears. Enter focus mode, timer counts down, session logged. Export a note as PDF, open it. Daily briefing notification fires at configured time with correct content.

### Phase F: Goals + Health

33. Goals dashboard — summary card, progress rings, streak dots, period tabs, category filters
34. Goal AI assistant — suggest personalized goals based on profile, adjust difficulty from history
35. Calorie meal logger — text or camera input, Claude Vision detects calories, auto-suggest based on history + time of day
36. Exercise-based calorie adjustment — sync from Apple Health/Google Fit, adjust daily target dynamically
37. Calendar integration — assign calendars to Personal/Business, reminders create calendar events

**Verify**: Create goals, log progress, streaks increment correctly. AI suggests relevant goals. Log a meal via photo — calories auto-detected. Log exercise — calorie target adjusts. Reminder accepted → calendar event appears in native calendar app.

### Phase G: Cloud + Auth

38. Supabase auth — email + Apple + Google sign-in, anonymous pre-signup mode
39. Sync engine — dirty-flag push to Supabase, pull on foreground/reconnect/60s, last-write-wins, image upload to Storage
40. Settings screen — theme, default mode, swipe customization, AI vibe, notification prefs, calendar assignment, connected accounts, data export

**Verify**: Sign in on device A, create items. Sign in on device B — items appear. Edit on B, switch to A — changes sync. Offline edits sync when back online. Settings persist across devices.

### Phase H: Widgets

41. Top items widget — 3-5 prioritized items with checkboxes, tap to open
42. Quick add widget — single tap opens capture
43. Speech input widget — tap starts recording, creates note in background
44. AI assistant widget — today's briefing summary
45. Goal streak widget — progress rings for top 3 goals

**Verify**: Add each widget to home screen. Top items widget shows correct items, checkbox marks done. Quick add opens app to capture. Speech widget creates a note from voice. Goal widget shows current streaks.

### Phase I: Polish

46. Animations — row stagger entrance, checkbox bounce, swipe snap-back, sheet spring, FAB morph, context crossfade (reanimated, 60fps)
47. Haptics — light on checkbox/swipe, medium on drag/voice trigger, heavy on delete
48. Onboarding — 3-screen flow (context concept, FAB demo, swipe tutorial), first-time tooltips
49. Error handling — offline banner, sync retry UI, AI timeout fallback, empty states
50. Accessibility — VoiceOver/TalkBack labels, dynamic type, 44pt touch targets, color contrast
51. Performance — profile with Flipper, target <100ms list render, <16ms frame, <2s cold start

**Verify**: Full app walkthrough on both iOS and Android. Animations are smooth (60fps). VoiceOver reads all elements correctly. Dynamic type scales UI. App works fully offline. Cold start under 2s.

---

## Verification Checkpoints

### After each phase
Run on a physical iPhone and Android device via Expo Dev Build. Walk through every feature added in that phase. Fix bugs before moving to the next phase.

### After Phase B+C (core complete)
First full regression test. All CRUD operations, all gestures, all organization features. This is the "minimum useful app" — it should feel complete as a basic note/task app.

### After Phase D+E (AI + automation complete)
Second regression test. Focus on AI reliability — test with 20+ varied natural language inputs. Verify AI never blocks the UI. Verify undo works for every AI auto-action. Recurring tasks tested across actual date boundaries (set device clock forward).

### After Phase G (sync complete)
Multi-device sync test. Two physical devices, sign in with same account. Create/edit/delete on each, verify convergence. Test offline → online transition. Test conflict resolution (edit same note on both devices while offline, then go online).

### After Phase I (polish complete)
Full end-to-end test on:
- iPhone 15 Pro (iOS 18)
- iPhone SE 3 (smallest screen, performance floor)
- Pixel 8 (Android 15)
- Samsung Galaxy A14 (low-end Android, performance floor)
- iPad Air (tablet layout — list-detail split)

Test: every screen, every gesture, every AI feature, light + dark theme, large + small dynamic type, VoiceOver on, airplane mode.

---

## App Store Release Plan

### Pre-Submission

1. **Apple Developer Account** ($99/year) + **Google Play Console** ($25 one-time) — set up if not already
2. **App metadata**
   - Name: Skrawl
   - Subtitle: Notes, tasks & goals — AI powered
   - Category: Productivity
   - Keywords: notes, tasks, reminders, goals, AI, voice, checklist, planner
   - Description: 4000-char App Store description, 80-char Google Play short description
   - Privacy policy URL (required) — host on a simple page
   - Support URL
3. **Visual assets**
   - App icon: 1024×1024 (no transparency, no rounded corners for iOS — system applies them)
   - Screenshots: iPhone 6.7" (1290×2796), iPhone 6.1" (1179×2556), iPad 12.9" (2048×2732) — at minimum 3 per size, max 10
   - Android: phone (1080×1920 minimum), 7" tablet, 10" tablet
   - Optional: 15-30s app preview video (autoplay in store listing)
4. **Splash screen** — branded Skrawl logo, matches theme
5. **EAS Build setup** — `eas.json` with production profile, signing credentials

### TestFlight / Internal Testing

6. **EAS Build**: `eas build --platform ios --profile production` and `eas build --platform android --profile production`
7. **TestFlight** (iOS): Upload via EAS Submit or Transporter. Add internal testers (up to 100 without review). 
8. **Google Play Internal Testing**: Upload AAB to internal testing track. Add testers via email list.
9. Run the final verification checklist (Phase I) on TestFlight/internal builds
10. Fix any issues found — new build, re-test

### Submission

11. **Apple App Store**
    - Submit for review via App Store Connect
    - Include review notes: demo account credentials, description of AI features, explanation of health data usage
    - Review typically takes 24-48 hours
    - Common rejection reasons to pre-address:
      - Privacy: declare all data collection in App Privacy section (HealthKit, camera, microphone, location if applicable)
      - HealthKit: must have clear user-facing explanation of why health data is needed
      - AI: if using Claude API, ensure no user data is logged/trained on — state this in review notes
      - Sign in with Apple: required if you offer any third-party sign-in (Google)
    - If rejected: read feedback carefully, fix, resubmit (usually faster second review)

12. **Google Play Store**
    - Submit to production track (or open testing first for wider beta)
    - Fill out Data Safety section (equivalent of Apple's privacy labels)
    - Content rating questionnaire
    - Target API level must meet Google's current requirement (API 34+ for 2026)
    - Review typically takes a few hours to a few days

### Post-Launch

13. **Monitor**
    - Crash reporting: Sentry or expo-updates crash reports
    - Analytics: basic usage metrics (DAU, feature adoption, AI usage)
    - App Store reviews: respond to 1-star reviews within 24 hours
    - Supabase dashboard: monitor DB size, sync queue depth, storage usage

14. **OTA Updates** (Expo)
    - Bug fixes and minor UI tweaks can be pushed via `eas update` without App Store review
    - Major native changes (new SDK, new native module) require a new build + store submission

15. **Version cadence**
    - v1.0: initial launch (everything through Phase I)
    - v1.1: bug fixes from user feedback (2 weeks post-launch)
    - v1.2: first feature iteration based on usage data (1 month post-launch)
    - v2.0: collaboration, backlinks, web app (v2 backlog)
