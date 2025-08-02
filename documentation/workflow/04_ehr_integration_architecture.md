# EHR Integration Architecture

## Integration Philosophy

### Single Source of Truth
- EHR systems (Best Practice, MedicalDirector, etc.) remain the authoritative source for all patient data
- Aria Scribe acts as a workflow accelerator, not a data repository
- Minimal data duplication - fetch what's needed, when needed
- Real-time data fetching preferred over local caching

### Multi-EHR Support Strategy
- Abstract EHR operations behind a common interface
- Provider-specific implementations for each EHR system
- Graceful degradation when EHR features aren't available
- Configuration-driven integration settings

## EHR Provider Abstraction

### Core Interface
```typescript
interface EHRProvider {
  // Authentication & Connection
  authenticate(credentials: EHRCredentials): Promise<AuthResult>;
  testConnection(): Promise<ConnectionStatus>;
  
  // Appointment Management
  getTodaysAppointments(clinicianId: string): Promise<Appointment[]>;
  getAppointment(appointmentId: string): Promise<Appointment>;
  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void>;
  
  // Patient Data
  getPatientSummary(patientId: string): Promise<PatientSummary>;
  getPatientMedications(patientId: string): Promise<Medication[]>;
  getPatientAllergies(patientId: string): Promise<Allergy[]>;
  getRecentNotes(patientId: string, limit: number): Promise<ClinicalNote[]>;
  
  // Clinical Documentation
  createClinicalNote(patientId: string, note: ClinicalNoteInput): Promise<ClinicalNote>;
  updateClinicalNote(noteId: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote>;
  attachAudioToNote(noteId: string, audioFile: File): Promise<void>;
  
  // Billing Integration
  getMBSItems(): Promise<MBSItem[]>;
  createBillingItem(patientId: string, mbsItem: MBSItem): Promise<BillingItem>;
  
  // System Information
  getProviderInfo(): EHRProviderInfo;
  getSupportedFeatures(): EHRFeature[];
}
```

### Provider-Specific Implementations

#### Best Practice Provider
```typescript
class BestPracticeProvider implements EHRProvider {
  private apiClient: BestPracticeAPIClient;
  private authToken: string;
  
  async authenticate(credentials: BestPracticeCredentials): Promise<AuthResult> {
    // Best Practice specific OAuth flow
    // Handle practice selection
    // Store authentication tokens
  }
  
  async getTodaysAppointments(clinicianId: string): Promise<Appointment[]> {
    // Use Best Practice appointment API
    // Transform BP appointment format to standard format
    // Handle BP-specific appointment types
  }
  
  async getPatientSummary(patientId: string): Promise<PatientSummary> {
    // Fetch from BP patient API
    // Parse BP-specific data structures
    // Handle BP privacy/consent settings
  }
  
  // ... other method implementations
}
```

#### MedicalDirector Provider
```typescript
class MedicalDirectorProvider implements EHRProvider {
  // Similar structure but with MedicalDirector-specific implementations
  // Handle MD's different API patterns
  // Transform MD data formats to standard interface
}
```

#### Generic FHIR Provider
```typescript
class FHIRProvider implements EHRProvider {
  // Standard FHIR R4 implementation
  // Fallback for EHR systems with FHIR support
  // Configurable FHIR endpoints
}
```

## Data Models

### Standard Data Structures
```typescript
interface Appointment {
  id: string;
  patientId: string;
  clinicianId: string;
  scheduledTime: Date;
  duration: number; // minutes
  appointmentType: string;
  status: 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  location?: string;
}

interface PatientSummary {
  id: string;
  ehrPatientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F' | 'Other' | 'Unknown';
  contactInfo: ContactInfo;
  lastVisit?: Date;
  ehrSystem: string;
  lastSyncedAt: Date;
}

interface PatientContext {
  summary: PatientSummary;
  medications: Medication[];
  allergies: Allergy[];
  recentNotes: ClinicalNote[];
  alerts: ClinicalAlert[];
  appointments: Appointment[];
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  active: boolean;
}

interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  verifiedDate: Date;
  notes?: string;
}

interface ClinicalNote {
  id: string;
  patientId: string;
  clinicianId: string;
  createdAt: Date;
  consultationType: string;
  content: string;
  status: 'draft' | 'final' | 'amended';
  ehrNoteId?: string;
}
```

## Integration Patterns

### Real-Time Data Fetching
```typescript
class EHRDataService {
  private provider: EHRProvider;
  private cache: Map<string, CachedData> = new Map();
  
  async getPatientForConsultation(patientId: string): Promise<PatientContext> {
    // Check cache first (with TTL)
    const cached = this.getCachedPatient(patientId);
    if (cached && !this.isStale(cached)) {
      return cached.data;
    }
    
    // Fetch fresh data from EHR
    const [summary, medications, allergies, notes] = await Promise.all([
      this.provider.getPatientSummary(patientId),
      this.provider.getPatientMedications(patientId),
      this.provider.getPatientAllergies(patientId),
      this.provider.getRecentNotes(patientId, 5)
    ]);
    
    const context: PatientContext = {
      summary,
      medications,
      allergies,
      recentNotes: notes,
      alerts: this.generateAlerts(summary, medications, allergies),
      appointments: []
    };
    
    // Cache for future requests
    this.cachePatientData(patientId, context);
    
    return context;
  }
}
```

### Error Handling & Resilience
```typescript
class ResilientEHRService {
  private primaryProvider: EHRProvider;
  private fallbackProvider?: EHRProvider;
  private circuitBreaker: CircuitBreaker;
  
  async getPatientSummary(patientId: string): Promise<PatientSummary> {
    try {
      return await this.circuitBreaker.execute(() => 
        this.primaryProvider.getPatientSummary(patientId)
      );
    } catch (error) {
      // Log error for monitoring
      this.logEHRError(error, 'getPatientSummary', patientId);
      
      // Try fallback provider if available
      if (this.fallbackProvider) {
        return await this.fallbackProvider.getPatientSummary(patientId);
      }
      
      // Return cached data if available
      const cached = this.getCachedPatientSummary(patientId);
      if (cached) {
        return { ...cached, isStale: true };
      }
      
      // Final fallback - return minimal patient info
      throw new EHRUnavailableError('Patient data temporarily unavailable');
    }
  }
}
```

### Configuration Management
```typescript
interface EHRConfiguration {
  provider: 'bestpractice' | 'medicaldirector' | 'fhir' | 'none';
  credentials: EHRCredentials;
  endpoints: EHREndpoints;
  features: {
    appointmentSync: boolean;
    patientData: boolean;
    noteCreation: boolean;
    billingIntegration: boolean;
  };
  caching: {
    patientDataTTL: number; // minutes
    appointmentTTL: number; // minutes
    enableOfflineMode: boolean;
  };
  fallback: {
    enableFallbackProvider: boolean;
    fallbackProvider?: EHRProvider;
    gracefulDegradation: boolean;
  };
}
```

## Practice Settings Integration

### EHR Setup Wizard
1. **Provider Selection** - Choose EHR system
2. **Credential Configuration** - API keys, OAuth setup
3. **Feature Selection** - Enable/disable specific integrations
4. **Test Connection** - Verify EHR connectivity
5. **Data Mapping** - Map EHR fields to Aria Scribe concepts
6. **Sync Preferences** - Configure refresh intervals

### Ongoing Management
- Connection status monitoring
- Credential renewal alerts
- Feature availability updates
- Performance metrics tracking
- Error rate monitoring

## Security & Compliance

### Data Protection
- All EHR communications over HTTPS/TLS 1.3
- OAuth 2.0 / OIDC for authentication
- Token refresh and rotation
- Minimal data retention policies
- Audit logging for all EHR interactions

### Australian Privacy Compliance
- Australian Privacy Principles (APP) compliance
- Healthcare data handling requirements
- Consent management integration
- Data residency requirements
- Right to data portability

### Clinical Safety
- Graceful degradation when EHR unavailable
- Clear indicators of data freshness
- Fallback workflows for critical functions
- Error reporting and escalation procedures

## Performance Optimization

### Caching Strategy
- Smart caching with TTL-based invalidation
- Progressive loading (show cached, then fresh)
- Background refresh for frequently accessed data
- Cache warming for scheduled appointments

### API Optimization
- Batch requests where possible
- Parallel data fetching
- Request deduplication
- Rate limiting and throttling
- Connection pooling

### Monitoring & Alerting
- EHR API response times
- Error rates by provider
- Cache hit/miss ratios
- Data freshness metrics
- User experience impact tracking