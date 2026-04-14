# Priority System Design — Skrawl

## P0-P3 Priority Tiers

| Priority | Label | Color | Use Case |
|----------|-------|-------|----------|
| P0 | Critical | Red (#FF5A5A) | Drop everything — due today, blockers |
| P1 | High | Orange (#FFB86A) | Important — this week, key deliverables |
| P2 | Medium | Blue (#6AB4FF) | Normal — scheduled work, non-urgent |
| P3 | Low | Gray | Backlog — nice to have, someday |
| None | Unset | No badge | Default — user must actively escalate |

## 7 Re-Prioritization Strategies (for app build)

### 1. Soft Cap with Warning
When a user has more than **5 P0 items**, show an AI-powered banner:
> "You have 8 items at P0. Consider if some are really P1."

Surface this in the AI Insight banner on the home screen. Threshold: 5+ P0 items.

### 2. Staleness Nudge
P0 items untouched for **7+ days** get a subtle visual indicator (e.g., dimmed border, clock icon) and an optional prompt:
> "Sprint Planning has been P0 for 12 days. Still critical?"

Options: Keep P0 | Downgrade to P1 | Dismiss

### 3. Stack Ranking Within Tiers (Linear model)
Allow **drag-to-reorder** within the same priority group. This solves tie-breaking without adding more priority levels. Persist the manual order in the database.

### 4. Smart/Blended Sort Algorithm
When sorting by priority, use a composite score that factors in deadline proximity:
```
effective_score = (4 - priority_level) * 100 + urgency_boost
urgency_boost = max(0, 50 - days_until_due * 5)
```
This means a P1 due tomorrow ranks above a P0 due next week.

### 5. AI Priority Suggestion on Creation
When a user creates a note/task, analyze the content with Claude for keywords:
- "urgent", "blocker", "ASAP", "deadline today" → suggest P0
- "this week", "important", "review" → suggest P1
- "when you get a chance", "low priority", "someday" → suggest P3
- No urgency signals → leave unset

Show as a dismissable suggestion, not auto-applied.

### 6. Weekly Review Prompt
Every Sunday/Monday, trigger a notification:
> "Weekly Review: You have N items at P0. Here are 3 that may no longer need P0 status."

Use AI to identify candidates based on:
- Age (older P0s are more likely to be stale)
- No recent edits
- No upcoming reminder/deadline

### 7. Context-Aware Auto-Boost
Notes linked to calendar events happening **within 24 hours** get a temporary visual boost (glow border, moved to top of list) regardless of their set priority. This ensures timely items surface without the user manually adjusting priority.

## Visual Design Rules

1. **Default to no priority (unset)** — users must actively escalate. Prevents inflation.
2. **Hide badge for unset items** — reduces visual noise (Todoist/Linear pattern).
3. **P0 = visually loud** (red, filled badge). P3 = visually quiet (gray, small).
4. **Color + text together** for accessibility — never color alone.
5. **In compact views** (calendar, search results), show only P0-P1 badges by default.

## Sort Modes

Two user-togglable modes:
- **Priority** (default): P0 first → P3 last, recency within same tier
- **Recent**: Newest first, priority as visual indicator only

Both modes are available on: Home screen, Calendar reminders, Search results.

## Research Sources

Based on analysis of: Todoist (P1-P4), Linear (Urgent/High/Medium/Low), Asana, TickTick (Eisenhower Matrix), Motion (AI scheduling), Sunsama, Reclaim.ai, RICE/ICE scoring frameworks.
