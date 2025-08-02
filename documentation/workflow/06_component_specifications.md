# Component Specifications & Technical Details

## Component Hierarchy

```
Dashboard (Page)
├── TodaysSchedule (Primary Component)
│   ├── AppointmentRow (Repeatable)
│   └── PatientConsultationPanel (Modal)
│       ├── PatientSummary
│       ├── PreConsultationChecklist
│       ├── ConsultationControls
│       └── ConsultationStatus
├── QuickStats (Widget)
├── PendingActions (Widget)
└── RecentActivity (Widget)
```

## Detailed Component Specifications

### 1. TodaysSchedule Component

**File:** `src/components/dashboard/TodaysSchedule.tsx`

```typescript
interface TodaysScheduleProps {
  clinicianId: string;
  date?: Date; // defaults to today
  onAppointmentClick: (appointment: Appointment) => void;
  refreshInterval?: number; // minutes, defaults to 5
}

interface TodaysScheduleState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date;
}
```

**Key Features:**
- Auto-refresh appointments every 5 minutes
- Real-time status updates via WebSocket
- Optimistic updates for status changes
- Skeleton loading states
- Error boundary with retry functionality

**Component Structure:**
```tsx
export function TodaysSchedule({ clinicianId, date, onAppointmentClick }: TodaysScheduleProps) {
  const { appointments, loading, error, refetch } = useAppointments(clinicianId, date);
  
  if (loading) return <ScheduleSkeleton />;
  if (error) return <ScheduleError onRetry={refetch} />;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2>Today's Schedule</h2>
          <RefreshButton onClick={refetch} lastUpdated={lastUpdated} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {appointments.map(appointment => (
            <AppointmentRow
              key={appointment.id}
              appointment={appointment}
              onClick={() => onAppointmentClick(appointment)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. AppointmentRow Component

**File:** `src/components/dashboard/AppointmentRow.tsx`

```typescript
interface AppointmentRowProps {
  appointment: Appointment;
  onClick: () => void;
  showPatientDetails?: boolean;
}

interface AppointmentStatus {
  status: 'waiting' | 'in-progress' | 'recording' | 'completed' | 'cancelled';
  color: string;
  icon: React.ComponentType;
  label: string;
}
```

**Visual Design:**
```tsx
export function AppointmentRow({ appointment, onClick }: AppointmentRowProps) {
  const status = getAppointmentStatus(appointment);
  
  return (
    <div 
      className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-16 text-sm font-medium text-gray-600">
        {formatTime(appointment.scheduledTime)}
      </div>
      
      <div className="flex-1 ml-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{appointment.patientName}</span>
          <span className="text-sm text-gray-500">
            ({appointment.patientAge}{appointment.patientGender})
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {appointment.appointmentType} • {appointment.duration} min
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <StatusBadge status={status} />
        {appointment.isRecording && <RecordingIndicator />}
      </div>
    </div>
  );
}
```

### 3. PatientConsultationPanel Component

**File:** `src/components/dashboard/PatientConsultationPanel.tsx`

```typescript
interface PatientConsultationPanelProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onConsultationStart: (appointmentId: string) => void;
  onConsultationComplete: (consultationData: ConsultationResult) => void;
}

interface PanelState {
  patientData: PatientContext | null;
  checklist: ChecklistState;
  consultation: ConsultationState;
  loading: boolean;
  error: string | null;
}
```

**Panel Structure:**
```tsx
export function PatientConsultationPanel({ 
  appointment, 
  isOpen, 
  onClose 
}: PatientConsultationPanelProps) {
  const { patientData, loading } = usePatientData(appointment.patientId);
  const [checklist, updateChecklist] = useChecklist();
  const consultation = useConsultation();
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[480px] sm:w-[540px]">
        <SheetHeader>
          <PatientHeader patient={patientData?.summary} appointment={appointment} />
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          <PatientSummary 
            data={patientData} 
            loading={loading}
            onRefresh={() => refetchPatientData()}
          />
          
          <PreConsultationChecklist
            checklist={checklist}
            onUpdate={updateChecklist}
            appointment={appointment}
          />
          
          <ConsultationControls
            appointment={appointment}
            checklist={checklist}
            consultation={consultation}
            onStart={handleStartConsultation}
            onStop={handleStopConsultation}
          />
          
          <ConsultationStatus consultation={consultation} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### 4. PreConsultationChecklist Component

**File:** `src/components/consultation/PreConsultationChecklist.tsx`

```typescript
interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  autoComplete?: boolean;
  helpText?: string;
}

interface PreConsultationChecklistProps {
  checklist: ChecklistState;
  onUpdate: (itemId: string, completed: boolean) => void;
  appointment: Appointment;
}
```

**Implementation:**
```tsx
export function PreConsultationChecklist({ 
  checklist, 
  onUpdate, 
  appointment 
}: PreConsultationChecklistProps) {
  const items: ChecklistItem[] = [
    {
      id: 'identity-verified',
      label: 'Patient identity verified',
      required: true,
      completed: checklist.identityVerified,
      helpText: 'Confirm patient name and DOB match records'
    },
    {
      id: 'consent-obtained',
      label: 'Consent for recording obtained',
      required: true,
      completed: checklist.consentObtained,
      helpText: 'Patient has agreed to audio recording'
    },
    {
      id: 'template-selected',
      label: 'Note template selected',
      required: false,
      completed: checklist.templateSelected,
      autoComplete: true,
      helpText: 'Default template will be used if not selected'
    },
    {
      id: 'summary-reviewed',
      label: 'Patient summary reviewed',
      required: false,
      completed: checklist.summaryReviewed,
      autoComplete: true
    }
  ];
  
  const completedRequired = items.filter(item => item.required && item.completed).length;
  const totalRequired = items.filter(item => item.required).length;
  const canProceed = completedRequired === totalRequired;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3>Pre-Consultation Checklist</h3>
          <Progress value={(completedRequired / totalRequired) * 100} className="w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={(completed) => onUpdate(item.id, completed)}
            />
          ))}
        </div>
        {!canProceed && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Complete all required items before starting consultation
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5. ConsultationControls Component

**File:** `src/components/consultation/ConsultationControls.tsx`

```typescript
interface ConsultationControlsProps {
  appointment: Appointment;
  checklist: ChecklistState;
  consultation: ConsultationState;
  onStart: () => void;
  onStop: () => void;
  onPause?: () => void;
  onResume?: () => void;
}
```

**Recording Button States:**
```tsx
export function ConsultationControls({ 
  checklist, 
  consultation, 
  onStart, 
  onStop 
}: ConsultationControlsProps) {
  const canStart = checklist.identityVerified && checklist.consentObtained;
  const isRecording = consultation.status === 'recording';
  
  return (
    <Card>
      <CardHeader>
        <h3>Consultation Controls</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-3">
          {!isRecording ? (
            <Button
              size="lg"
              className="h-12 bg-red-600 hover:bg-red-700 text-white"
              disabled={!canStart}
              onClick={onStart}
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-red-600 text-red-600 hover:bg-red-50"
              onClick={onStop}
            >
              <Square className="mr-2 h-5 w-5" />
              Stop Recording
            </Button>
          )}
          
          <TemplateSelector
            selectedTemplate={consultation.template}
            onTemplateChange={handleTemplateChange}
            appointmentType={appointment.appointmentType}
          />
          
          {isRecording && (
            <RecordingIndicator
              duration={consultation.duration}
              audioLevel={consultation.audioLevel}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Custom Hooks

### 1. useAppointments Hook

```typescript
export function useAppointments(clinicianId: string, date: Date = new Date()) {
  return useQuery({
    queryKey: ['appointments', clinicianId, format(date, 'yyyy-MM-dd')],
    queryFn: () => ehrService.getTodaysAppointments(clinicianId, date),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

### 2. usePatientData Hook

```typescript
export function usePatientData(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => ehrService.getPatientContext(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
}
```

### 3. useConsultation Hook

```typescript
export function useConsultation() {
  const [state, setState] = useState<ConsultationState>({
    status: 'ready',
    duration: 0,
    audioLevel: 0,
    template: null,
    transcription: '',
    generatedNote: null
  });
  
  const startRecording = useCallback(async () => {
    try {
      await audioService.startRecording();
      setState(prev => ({ ...prev, status: 'recording' }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, []);
  
  const stopRecording = useCallback(async () => {
    try {
      const audioFile = await audioService.stopRecording();
      setState(prev => ({ ...prev, status: 'processing' }));
      
      // Start transcription and note generation
      const transcription = await transcriptionService.transcribe(audioFile);
      const note = await noteService.generateNote(transcription);
      
      setState(prev => ({
        ...prev,
        status: 'review',
        transcription,
        generatedNote: note
      }));
    } catch (error) {
      setState(prev => ({ ...prev, status: 'error' }));
      throw error;
    }
  }, []);
  
  return {
    ...state,
    startRecording,
    stopRecording
  };
}
```

## Styling & Theme Integration

### Tailwind Classes
- **Status Colors:** Consistent color scheme across components
- **Spacing:** 4px base unit with consistent spacing scale
- **Typography:** Clear hierarchy with readable font sizes
- **Animations:** Smooth transitions for state changes

### Component Variants
```typescript
const appointmentRowVariants = cva(
  "flex items-center p-4 border rounded-lg cursor-pointer transition-colors",
  {
    variants: {
      status: {
        waiting: "border-gray-200 hover:bg-gray-50",
        'in-progress': "border-blue-200 bg-blue-50 hover:bg-blue-100",
        recording: "border-red-200 bg-red-50 hover:bg-red-100",
        completed: "border-green-200 bg-green-50 hover:bg-green-100",
        cancelled: "border-gray-200 bg-gray-50 opacity-60"
      }
    }
  }
);
```

### Responsive Design
- **Mobile First:** Components designed for mobile, enhanced for desktop
- **Breakpoints:** Tailwind's standard breakpoints (sm, md, lg, xl)
- **Touch Targets:** Minimum 44px touch targets for mobile
- **Readable Text:** Minimum 16px font size on mobile