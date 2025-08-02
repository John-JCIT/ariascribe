# Patient Consultation Panel Specification

## Overview
The Patient Consultation Panel is the core interface that opens when a doctor clicks on an appointment. This panel serves as the command center for individual patient consultations, providing essential patient information and consultation controls.

## Panel Behavior

### Opening Animation
- Slides in from right side of screen (desktop)
- Fades in as overlay (mobile)
- 300ms smooth transition
- Backdrop blur effect on main dashboard

### Panel Dimensions
- **Desktop:** 480px width, full height
- **Tablet:** 400px width, full height  
- **Mobile:** Full screen overlay

### Closing Options
- Click backdrop to close
- Press Escape key
- Click X button in top-right
- Complete consultation workflow

## Panel Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Patient Consultation Panel               [×]       │
├─────────────────────────────────────────────────────┤
│  👤 John Smith (45M) - DOB: 1979-03-15            │
│  📅 Appointment: 9:00 AM - General Consultation    │
│  🏥 Last Visit: 2 weeks ago                        │
├─────────────────────────────────────────────────────┤
│  📋 PATIENT SUMMARY                                 │
│  • Current Medications: Metformin, Lisinopril      │
│  • Allergies: Penicillin                           │
│  • Recent Notes: Diabetes follow-up                │
│  [Refresh Patient Data]                            │
├─────────────────────────────────────────────────────┤
│  ✅ PRE-CONSULTATION CHECKLIST                      │
│  ☐ Patient identity verified                       │
│  ☐ Consent for recording obtained                  │
│  ☐ Note template selected                          │
│  ☐ Patient summary reviewed                        │
├─────────────────────────────────────────────────────┤
│  🎙️ CONSULTATION CONTROLS                          │
│  [🎤 START RECORDING] (Large, prominent button)    │
│  Template: [General Consultation ▼]                │
│  Duration: 00:00 (when recording)                  │
├─────────────────────────────────────────────────────┤
│  📝 CONSULTATION STATUS                             │
│  Status: Ready to Start                            │
│  Audio: Not Recording                              │
│  Transcription: Waiting                            │
│  Note Generation: Pending                          │
└─────────────────────────────────────────────────────┘
```

## Section Specifications

### 1. Patient Header
**Purpose:** Quick patient identification and appointment context

**Information Displayed:**
- Patient name, age, gender
- Date of birth (for verification)
- Appointment time and type
- Last visit date (from EHR)

**Data Source:** EHR API real-time fetch

**Error Handling:** Show placeholder if EHR unavailable, with retry option

### 2. Patient Summary
**Purpose:** Essential clinical context for the consultation

**Information Displayed:**
- Current medications (top 5 most recent)
- Known allergies and adverse reactions
- Recent consultation notes (last 2-3 visits)
- Chronic conditions/problem list
- Any clinical alerts or warnings

**Interactive Elements:**
- "Refresh Patient Data" button to re-fetch from EHR
- Expandable sections for detailed medication/allergy info
- Click to view full medical history (opens in EHR)

**Loading States:**
- Skeleton loaders while fetching
- Progressive loading - show cached data first, then fresh data
- Clear indicators when data is stale

### 3. Pre-Consultation Checklist
**Purpose:** Ensure clinical safety and compliance requirements

**Checklist Items:**
1. **Patient Identity Verified** - Manual checkbox
2. **Consent for Recording Obtained** - Required before recording
3. **Note Template Selected** - Auto-selects default, can override
4. **Patient Summary Reviewed** - Auto-checks when summary viewed

**Behavior:**
- All items must be checked before recording can start
- Visual progress indicator (2/4 complete)
- Persist checklist state during consultation
- Reset checklist for each new patient

### 4. Consultation Controls
**Purpose:** Primary action area for starting and managing consultations

**Start Recording Button:**
- Large, prominent button (min 48px height)
- Disabled until checklist complete
- Changes to "Stop Recording" when active
- Shows recording duration when active
- Red background when recording

**Template Selection:**
- Dropdown with practice's note templates
- Default selection based on appointment type
- Recently used templates at top
- Option to create new template

**Recording Indicators:**
- Visual waveform display when recording
- Recording duration timer
- Audio level indicator
- Clear stop button

### 5. Consultation Status
**Purpose:** Real-time feedback on consultation processing

**Status Indicators:**
- **Ready to Start** - All systems ready
- **Recording** - Audio capture active
- **Processing** - Transcription in progress
- **Generating Note** - AI creating clinical note
- **Review Required** - Note ready for doctor review
- **Complete** - Note approved and sent to EHR

**Progress Visualization:**
```
Audio Capture → Transcription → Note Generation → Review → Complete
    ✅             🔄              ⏳              ❌        ❌
```

## State Management

### Panel States
1. **Loading** - Fetching patient data from EHR
2. **Ready** - Patient data loaded, ready for consultation
3. **Recording** - Audio capture in progress
4. **Processing** - Post-consultation processing
5. **Review** - Generated note ready for review
6. **Complete** - Consultation finished and synced

### Error States
- **EHR Connection Failed** - Show retry options
- **Recording Failed** - Technical issue with audio
- **Processing Failed** - AI/transcription error
- **Sync Failed** - Unable to send note to EHR

### Data Refresh Strategy
- Auto-refresh patient data every 5 minutes
- Manual refresh button always available
- Show "last updated" timestamp
- Cache patient data for offline scenarios

## Integration Points

### EHR Integration
```typescript
interface PatientSummary {
  patientId: string;
  demographics: PatientDemographics;
  medications: Medication[];
  allergies: Allergy[];
  recentNotes: ClinicalNote[];
  appointments: Appointment[];
  alerts: ClinicalAlert[];
}
```

### Audio Recording Integration
- WebRTC for browser-based recording
- Real-time transcription stream
- Audio quality monitoring
- Automatic backup to cloud storage

### Note Generation Integration
- Send transcription + patient context to AI
- Stream generated note back to panel
- Allow real-time editing of generated content
- Version control for note revisions

## Mobile Adaptations

### Touch Interactions
- Larger touch targets (min 44px)
- Swipe gestures for checklist items
- Pull-to-refresh for patient data
- Voice commands for hands-free operation

### Screen Space Optimization
- Collapsible sections
- Horizontal scrolling for long medication lists
- Floating action button for recording
- Bottom sheet for note review

### Offline Capabilities
- Cache patient summary data
- Queue actions when offline
- Sync when connection restored
- Clear offline indicators