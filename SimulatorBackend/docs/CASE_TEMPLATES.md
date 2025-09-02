# Discipline-Specific Case Templates

## Overview

The Case Template System provides comprehensive, discipline-specific templates for creating healthcare education cases. Each template is carefully designed to reflect the unique requirements, workflows, and assessment criteria of different healthcare disciplines including Medicine, Nursing, Laboratory, Radiology, and Pharmacy.

## Features

### 1. Discipline-Specific Design
- **Medical Cases**: Clinical presentation, diagnosis, and treatment planning
- **Nursing Cases**: Patient care scenarios with nursing interventions
- **Laboratory Cases**: Specimen processing and diagnostic testing workflows
- **Radiology Cases**: Imaging interpretation and diagnostic reporting
- **Pharmacy Cases**: Medication therapy management and patient counseling

### 2. Comprehensive Structure
- **Case Metadata**: Title, specialty, difficulty, duration, learning objectives
- **Patient Persona**: Demographics, history, and presentation details
- **Clinical Dossier**: Discipline-specific clinical information and workflows
- **Evaluation Criteria**: Weighted assessment criteria for each discipline

### 3. Validation System
- **Template Validation**: Ensures case data conforms to discipline requirements
- **Field Validation**: Type checking and constraint validation
- **Business Rules**: Discipline-specific validation rules
- **Error Reporting**: Detailed validation feedback with errors and warnings

### 4. Template Management
- **Template Retrieval**: Get templates by discipline or all at once
- **Case Creation**: Create cases from templates with custom data
- **Field Structure**: Extract template field structure for form building
- **Statistics**: Template usage and performance metrics

## API Endpoints

### Template Retrieval
```
GET /api/case-templates - Get all available templates
GET /api/case-templates/:discipline - Get template for specific discipline
GET /api/case-templates/:discipline/fields - Get template field structure
```

### Case Creation and Validation
```
POST /api/case-templates/:discipline/validate - Validate case data
POST /api/case-templates/:discipline/create - Create case from template
```

### Administration
```
GET /api/case-templates/admin/statistics - Get template statistics (Admin only)
```

## Template Structures

### Medical Case Template

#### Core Sections
- **Case Metadata**: Clinical specialty, difficulty, learning objectives
- **Patient Persona**: Demographics, chief complaint, medical history
- **Clinical Dossier**: HPI, ROS, physical exam, diagnostics, diagnosis
- **Evaluation Criteria**: History taking, examination, reasoning, treatment

#### Key Features
```typescript
interface MedicalTemplate {
  case_metadata: {
    specialty: 'medicine';
    subspecialty: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_duration: number;
    learning_objectives: string[];
    case_type: 'clinical_case' | 'emergency_medicine' | 'surgery';
    location: 'emergency_department' | 'clinic' | 'hospital_ward';
  };
  patient_persona: {
    chief_complaint: string;
    medical_history: string[];
    medications: string[];
    allergies: string[];
    social_history: SocialHistory;
    family_history: string[];
  };
  clinical_dossier: {
    history_of_presenting_illness: DetailedHPI;
    review_of_systems: SystemsReview;
    physical_examination: PhysicalExam;
    diagnostic_tests: DiagnosticTests;
    hidden_diagnosis: string;
    differential_diagnosis: string[];
    treatment_plan: TreatmentPlan;
  };
}
```

### Nursing Case Template

#### Core Sections
- **Case Metadata**: Nursing specialty, patient care focus
- **Patient Persona**: Admission reason, support system, mobility status
- **Clinical Dossier**: Nursing assessment, diagnoses, care plan
- **Evaluation Criteria**: Assessment skills, interventions, safety, communication

#### Key Features
```typescript
interface NursingTemplate {
  case_metadata: {
    specialty: 'nursing';
    case_type: 'patient_care' | 'medication_management' | 'emergency_nursing';
    location: 'medical_ward' | 'icu' | 'emergency_department';
  };
  patient_persona: {
    admission_reason: string;
    support_system: SupportSystem;
    mobility_status: string;
    cognitive_status: string;
  };
  clinical_dossier: {
    nursing_assessment: NursingAssessment;
    nursing_diagnoses: string[];
    care_plan: CarePlan;
    medication_administration: MedicationAdmin;
    patient_safety: SafetyAssessment;
  };
}
```

### Laboratory Case Template

#### Core Sections
- **Case Metadata**: Laboratory specialty, test focus
- **Patient Persona**: Clinical information, specimen source
- **Clinical Dossier**: Specimen handling, testing phases, quality control
- **Evaluation Criteria**: Specimen handling, QC, technical competency, interpretation

#### Key Features
```typescript
interface LaboratoryTemplate {
  case_metadata: {
    specialty: 'laboratory';
    case_type: 'diagnostic_testing' | 'quality_assurance' | 'laboratory_safety';
    location: 'clinical_laboratory';
  };
  patient_persona: {
    clinical_information: string;
    ordering_physician: string;
    urgency_level: 'routine' | 'urgent' | 'stat';
    specimen_source: string;
  };
  clinical_dossier: {
    specimen_information: SpecimenInfo;
    test_requests: TestRequests;
    pre_analytical_phase: PreAnalytical;
    analytical_phase: Analytical;
    post_analytical_phase: PostAnalytical;
  };
}
```

### Radiology Case Template

#### Core Sections
- **Case Metadata**: Radiology specialty, imaging focus
- **Patient Persona**: Clinical history, imaging indication
- **Clinical Dossier**: Imaging study, systematic review, findings
- **Evaluation Criteria**: Systematic approach, finding identification, diagnosis, reporting

#### Key Features
```typescript
interface RadiologyTemplate {
  case_metadata: {
    specialty: 'radiology';
    case_type: 'imaging_interpretation' | 'technique_optimization' | 'radiation_safety';
    location: 'radiology_department';
  };
  patient_persona: {
    clinical_history: string;
    referring_physician: string;
    clinical_question: string;
    previous_imaging: string[];
  };
  clinical_dossier: {
    imaging_study: ImagingStudy;
    systematic_review: SystematicReview;
    imaging_findings: ImagingFindings;
    differential_diagnosis: RadiologyDifferential;
    radiation_safety: RadiationSafety;
  };
}
```

### Pharmacy Case Template

#### Core Sections
- **Case Metadata**: Pharmacy specialty, therapy focus
- **Patient Persona**: Health literacy, adherence history
- **Clinical Dossier**: Medication history, therapy problems, counseling
- **Evaluation Criteria**: Medication review, therapy assessment, counseling, safety

#### Key Features
```typescript
interface PharmacyTemplate {
  case_metadata: {
    specialty: 'pharmacy';
    case_type: 'medication_therapy' | 'drug_interactions' | 'patient_counseling';
    location: 'community_pharmacy' | 'hospital_pharmacy' | 'clinic';
  };
  patient_persona: {
    chief_concern: string;
    insurance_status: string;
    health_literacy: string;
    adherence_history: string;
  };
  clinical_dossier: {
    medication_history: MedicationHistory;
    medical_conditions: MedicalConditions;
    prescription_review: PrescriptionReview;
    drug_therapy_problems: TherapyProblems;
    drug_interactions: DrugInteractions;
    patient_counseling: PatientCounseling;
  };
}
```

## Validation System

### Validation Levels

#### 1. Structural Validation
- Required sections presence
- Field type validation
- Data format validation
- Constraint checking

#### 2. Discipline-Specific Validation
- **Medical**: Chief complaint and diagnosis required
- **Nursing**: Admission reason and nursing diagnoses
- **Laboratory**: Specimen information and test requests
- **Radiology**: Imaging study and clinical question
- **Pharmacy**: Medication history and prescription review

#### 3. Business Rule Validation
- Age range validation (0-120 years)
- Duration limits (5-180 minutes)
- Difficulty level validation
- Specialty alignment

### Validation Response
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

## Usage Examples

### Creating a Medical Case
```javascript
const customData = {
  case_metadata: {
    title: 'Acute Myocardial Infarction',
    difficulty: 'intermediate',
    learning_objectives: [
      'Recognize MI symptoms',
      'Order appropriate tests',
      'Initiate treatment'
    ]
  },
  patient_persona: {
    name: 'John Smith',
    age: 58,
    chief_complaint: 'Chest pain'
  },
  clinical_dossier: {
    hidden_diagnosis: 'STEMI'
  }
};

const response = await fetch('/api/case-templates/medicine/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(customData)
});
```

### Validating Case Data
```javascript
const validation = await fetch('/api/case-templates/nursing/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(caseData)
});

const result = await validation.json();
if (!result.data.isValid) {
  console.log('Validation errors:', result.data.errors);
}
```

## Template Metadata

### Discipline Configuration
```typescript
interface TemplateMetadata {
  medicine: {
    name: 'Medical Case Template';
    description: 'Comprehensive template for clinical presentation and diagnosis';
    icon: 'stethoscope';
    color: '#e74c3c';
    version: '1.0.0';
  };
  nursing: {
    name: 'Nursing Case Template';
    description: 'Patient care scenarios with nursing interventions';
    icon: 'heart';
    color: '#3498db';
    version: '1.0.0';
  };
  // ... other disciplines
}
```

## Evaluation Criteria

### Medical Cases
- **History Taking** (25%): Comprehensive patient history collection
- **Physical Examination** (20%): Systematic physical assessment
- **Diagnostic Reasoning** (25%): Clinical reasoning and differential diagnosis
- **Treatment Planning** (20%): Evidence-based treatment decisions
- **Communication** (10%): Patient communication skills

### Nursing Cases
- **Assessment Skills** (25%): Comprehensive nursing assessment
- **Nursing Interventions** (25%): Appropriate nursing interventions
- **Patient Safety** (20%): Safety measures and risk assessment
- **Communication** (15%): Patient and family communication
- **Documentation** (15%): Accurate nursing documentation

### Laboratory Cases
- **Specimen Handling** (20%): Proper specimen processing
- **Quality Control** (25%): QC procedures and validation
- **Technical Competency** (25%): Laboratory techniques and procedures
- **Result Interpretation** (20%): Accurate result analysis
- **Safety Protocols** (10%): Laboratory safety compliance

### Radiology Cases
- **Systematic Approach** (25%): Structured image review
- **Finding Identification** (30%): Accurate finding detection
- **Differential Diagnosis** (25%): Appropriate differential considerations
- **Reporting Quality** (15%): Clear and accurate reporting
- **Radiation Safety** (5%): Safety considerations and optimization

### Pharmacy Cases
- **Medication Review** (25%): Comprehensive medication assessment
- **Drug Therapy Assessment** (25%): Therapy problem identification
- **Patient Counseling** (25%): Effective patient education
- **Safety Monitoring** (15%): Drug safety and monitoring
- **Documentation** (10%): Pharmaceutical care documentation

## Integration Points

### Case Management System
- Template-based case creation
- Validation integration
- Metadata inheritance
- Evaluation criteria mapping

### Learning Management Systems
- Template export for external systems
- Competency mapping alignment
- Assessment integration
- Progress tracking

### Content Management
- Template versioning
- Content updates
- Localization support
- Custom template creation

## Performance Considerations

### Template Caching
- In-memory template storage
- Fast template retrieval
- Minimal database queries
- Efficient validation processing

### Validation Optimization
- Parallel validation rules
- Early termination on critical errors
- Cached validation results
- Optimized error reporting

### Scalability
- Stateless template service
- Horizontal scaling support
- Load balancing compatibility
- Database optimization

## Security and Access Control

### Authentication
- JWT token validation
- Role-based access control
- Session management
- API rate limiting

### Authorization
- Template access by role
- Case creation permissions
- Validation access control
- Administrative functions

### Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection
- Audit logging

## Future Enhancements

### Planned Features
1. **Custom Templates**: User-defined template creation
2. **Template Marketplace**: Sharing and collaboration platform
3. **AI-Powered Validation**: Machine learning validation rules
4. **Multi-Language Support**: Internationalization and localization
5. **Advanced Analytics**: Template usage and effectiveness metrics

### Research Integration
1. **Evidence-Based Templates**: Integration with medical literature
2. **Competency Mapping**: Professional standard alignment
3. **Outcome Tracking**: Learning outcome measurement
4. **Quality Metrics**: Template effectiveness assessment

## Support and Documentation

### Developer Resources
- **API Reference**: Complete endpoint documentation
- **Code Examples**: Implementation examples and best practices
- **Testing Guide**: Unit and integration testing approaches
- **Troubleshooting**: Common issues and solutions

### Content Creator Resources
- **Template Guide**: How to use templates effectively
- **Best Practices**: Case creation recommendations
- **Quality Standards**: Content quality guidelines
- **Review Process**: Template review and approval workflow

The Case Template System provides a robust foundation for creating high-quality, discipline-specific healthcare education cases that maintain consistency while allowing for customization and creativity in case development.