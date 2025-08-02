# Dashboard Layout Specification

## Overall Layout Structure

### Grid Layout (Desktop)
```
┌─────────────────────────────────────────────────────────────────┐
│                        Header (Fixed)                           │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar │                Main Content Area                      │
│  (Nav)  │  ┌─────────────────────────────────────────────────┐  │
│         │  │           Today's Schedule                      │  │
│         │  │  ┌─────────────────────────────────────────────┐│  │
│         │  │  │ 9:00 AM  John Smith (45M)  [In Progress]🎙️││  │
│         │  │  │ 9:30 AM  Sarah Jones (32F) [Waiting]       ││  │
│         │  │  │ 10:00 AM Mary Wilson (67F) [Completed] ✅  ││  │
│         │  │  └─────────────────────────────────────────────┘│  │
│         │  └─────────────────────────────────────────────────┘  │
│         │  ┌─────────────────┐ ┌─────────────────────────────┐  │
│         │  │  Quick Stats    │ │    Pending Actions          │  │
│         │  │  • 3 Completed  │ │  • 2 Notes to Review        │  │
│         │  │  • 1 Recording  │ │  • 1 Audio Processing       │  │
│         │  │  • 4 Remaining  │ │  • 0 Consent Pending        │  │
│         │  └─────────────────┘ └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Responsive)
```
┌─────────────────────────────┐
│         Header              │
├─────────────────────────────┤
│     Today's Schedule        │
│  ┌─────────────────────────┐│
│  │ 9:00 AM John Smith     ││
│  │ [In Progress] 🎙️       ││
│  ├─────────────────────────┤│
│  │ 9:30 AM Sarah Jones    ││
│  │ [Waiting]              ││
│  └─────────────────────────┘│
├─────────────────────────────┤
│ Quick Actions               │
│ [Review Notes] [Settings]   │
└─────────────────────────────┘
```

## Component Specifications

### 1. Today's Schedule (Primary Component)

**Purpose:** Show doctor's appointments for the current day with actionable status

**Layout:**
- Full width card taking 60% of main content area
- Scrollable list if more than 6 appointments
- Each appointment row shows: Time | Patient Name | Age/Gender | Status | Actions

**Appointment Row Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ 9:00 AM │ John Smith (45M) │ Consultation │ [In Progress]🎙️ │
│         │ Last visit: 2 weeks ago         │                 │
└─────────────────────────────────────────────────────────────┘
```

**Status Indicators:**
- `Waiting` - Gray dot, patient ready
- `In Progress` - Blue dot, consultation active
- `Recording` - Red dot + microphone icon, audio capture active
- `Completed` - Green checkmark, consultation finished
- `Notes Pending` - Orange dot, needs review

**Interactive Elements:**
- Entire row clickable to open Patient Consultation Panel
- Status indicator shows hover tooltip with details
- Right-click context menu for quick actions

### 2. Quick Stats Card

**Purpose:** At-a-glance productivity metrics for the day

**Metrics Displayed:**
- Consultations completed today
- Currently recording/processing
- Appointments remaining
- Average consultation time

**Layout:**
```
┌─────────────────┐
│   Quick Stats   │
├─────────────────┤
│ ✅ 3 Completed  │
│ 🎙️ 1 Recording  │
│ ⏰ 4 Remaining  │
│ 📊 Avg: 18 min  │
└─────────────────┘
```

### 3. Pending Actions Card

**Purpose:** Show items requiring doctor attention

**Action Types:**
- Notes awaiting review
- Audio files processing
- Consent forms pending
- Failed EHR syncs

**Layout:**
```
┌─────────────────────────────┐
│     Pending Actions         │
├─────────────────────────────┤
│ 📝 2 Notes to Review        │
│ 🔄 1 Audio Processing       │
│ ⚠️ 0 Sync Issues            │
│                             │
│ [Review All] [Dismiss]      │
└─────────────────────────────┘
```

## Responsive Behavior

### Desktop (≥1024px)
- Three-column layout: Sidebar + Main Content + Quick Actions
- Full appointment details visible
- Hover states for enhanced interactivity

### Tablet (768px - 1023px)
- Two-column layout: Collapsible sidebar + Main Content
- Condensed appointment rows
- Touch-friendly button sizes

### Mobile (≤767px)
- Single column layout
- Hamburger menu for navigation
- Swipe gestures for appointment actions
- Simplified appointment cards

## Color Coding & Visual Hierarchy

### Status Colors
- **Waiting:** `#6B7280` (Gray)
- **In Progress:** `#3B82F6` (Blue)
- **Recording:** `#EF4444` (Red)
- **Completed:** `#10B981` (Green)
- **Needs Attention:** `#F59E0B` (Orange)

### Typography Hierarchy
- **H1:** Page title (Dashboard) - 24px, bold
- **H2:** Section headers (Today's Schedule) - 18px, semibold
- **H3:** Card titles - 16px, medium
- **Body:** Appointment details - 14px, regular
- **Caption:** Timestamps, metadata - 12px, light

### Spacing & Layout
- **Grid gap:** 24px between major sections
- **Card padding:** 16px internal padding
- **Row spacing:** 12px between appointment rows
- **Button spacing:** 8px between action buttons

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- Minimum contrast ratio 4.5:1 for normal text
- Minimum contrast ratio 3:1 for large text
- All interactive elements keyboard accessible
- Screen reader compatible with proper ARIA labels

### Keyboard Navigation
- Tab order: Schedule → Quick Stats → Pending Actions
- Enter/Space to activate appointment rows
- Arrow keys to navigate within lists
- Escape to close modals/panels

### Screen Reader Support
- Appointment status announced clearly
- Time-based updates announced
- Loading states communicated
- Error states clearly described