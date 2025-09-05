# Enhanced Medical Simulation System

## Overview

This document describes the enhanced medical simulation system that includes comprehensive patient presentation, diagnostic workup tracking, treatment decision simulation, and clinical reasoning assessment capabilities.

## New Features

### 1. Patient Presentation & History Management
- **Enhanced Medical History**: Complete clinical dossier integration including:
  - History of Presenting Illness (HPI)
  - Past Medical History (PMH)
  - Medications
  - Allergies
  - Surgical History
  - Family History
  - Social History
  - Review of Systems (ROS)

### 2. Diagnostic Workup & Differential Diagnosis Tracking
- **Differential Diagnosis Array**: Track clinician's differential diagnoses with confidence levels
- **Diagnostic Tests Array**: Record diagnostic tests ordered with rationale and results
- **Decision Tracking**: Monitor diagnostic reasoning progression

### 3. Treatment Decision & Outcome Simulation
- **Treatment Plan Analysis**: Evaluate appropriateness, completeness, and safety of treatment plans
- **Outcome Simulation**: Predict medication effectiveness and side effects
- **Decision Recording**: Track treatment decisions with feedback and correctness assessment

### 4. Clinical Reasoning Assessment
- **Comprehensive Evaluation**: 7 competency areas with detailed ratings
- **Performance Metrics**: Quantitative scoring and qualitative feedback
- **Learning Recommendations**: Actionable improvement suggestions

## API Endpoints

### Simulation Management

#### POST `/simulation/start`
Start a new simulation session.

**Request Body:**
```json
{
  "caseId": "TEST-001"
}
```

**Response:**
```json
{
  "sessionId": "session-123",
  "initialPrompt": "Hello doctor, I have chest pain.",
  "patientName": "John Doe",
  "speaks_for": "Self"
}
```

#### POST `/simulation/ask/:sessionId`
Ask the patient a question during simulation.

**Request Body:**
```json
{
  "question": "What are your symptoms?"
}
```

**Response:** Server-Sent Events (SSE) stream with patient responses.

#### POST `/simulation/end/:sessionId`
End the simulation session and generate evaluation.

**Request Body:**
```json
{
  "user": {
    "id": "user-123"
  }
}
```

**Response:**
```json
{
  "sessionEnded": true,
  "evaluation": "Comprehensive evaluation text...",
  "history": []
}
```

### Treatment Management

#### POST `/simulation/treatment-plan/:sessionId`
Submit a treatment plan for analysis.

**Request Body:**
```json
[
  {
    "medication": "Aspirin",
    "dosage": "81 mg daily",
    "duration": "Lifelong",
    "rationale": "Cardioprotection"
  },
  {
    "medication": "Atorvastatin",
    "dosage": "40 mg daily",
    "duration": "Lifelong",
    "rationale": "Cholesterol management"
  }
]
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "appropriateness": 85,
    "completeness": 90,
    "safety": 95,
    "feedback": "Appropriate treatment plan for ACS"
  }
}
```

#### GET `/simulation/treatment-outcomes/:sessionId`
Get simulated treatment outcomes.

**Response:**
```json
[
  {
    "medication": "Aspirin",
    "effectiveness": 0.9,
    "side_effects": ["GI upset"],
    "patient_response": "Tolerating well"
  }
]
```

#### GET `/simulation/treatment-history/:sessionId`
Get treatment decision history.

**Response:**
```json
[
  {
    "type": "treatment_plan",
    "content": "Prescribed Aspirin 81mg daily",
    "timestamp": "2024-01-15T10:30:00Z",
    "confidence": 0.8,
    "is_correct": true,
    "feedback": "Appropriate cardioprotection"
  }
]
```

## Data Structures

### Session Model Enhancements
```javascript
{
  // ... existing session fields
  "differential_diagnosis": [
    {
      "condition": "Acute Coronary Syndrome",
      "confidence": 0.8,
      "rationale": "Chest pain with risk factors",
      "timestamp": Date
    }
  ],
  "diagnostic_tests": [
    {
      "test": "ECG",
      "rationale": "Assess for STEMI",
      "results": "Normal sinus rhythm",
      "timestamp": Date
    }
  ],
  "treatment_plan": [
    {
      "medication": "Aspirin",
      "dosage": "81 mg daily",
      "duration": "Lifelong",
      "rationale": "Cardioprotection"
    }
  ],
  "treatment_decisions": [
    {
      "type": "treatment_plan", // or "differential_diagnosis", "diagnostic_test"
      "content": "Prescribed Aspirin",
      "timestamp": Date,
      "confidence": 0.9,
      "is_correct": true,
      "feedback": "Appropriate choice"
    }
  ]
}
```

### Clinical Reasoning Evaluation Format

The evaluation follows a structured format:

```
SESSION END
Thank you for completing the simulation. Here is a comprehensive evaluation of your clinical reasoning performance based on the case of [Patient Name].
Hidden Diagnosis: [Diagnosis]

CLINICAL REASONING EVALUATION:
1. History Taking: (Rating: Excellent)
[Detailed assessment with examples]

2. Risk Factor Assessment: (Rating: Very Good)
[Detailed assessment with examples]

3. Differential Diagnosis Generation: (Rating: Good)
[Detailed assessment with examples]

4. Diagnostic Reasoning: (Rating: Very Good)
[Detailed assessment with examples]

5. Clinical Decision Making: (Rating: Excellent)
[Detailed assessment with examples]

6. Communication and Empathy: (Rating: Excellent)
[Detailed assessment with examples]

7. Clinical Urgency Recognition: (Rating: Excellent)
[Detailed assessment with examples]

CLINICAL REASONING ANALYSIS:
[Comprehensive analysis of reasoning patterns]

DIAGNOSTIC ACCURACY: [Reached/Partially Reached/Missed]

Overall Clinical Reasoning Score: [Score]%
Performance Label: [Excellent/Very good/Good/Fair/Poor]

KEY RECOMMENDATIONS:
[3-5 specific, actionable recommendations]
```

## Performance Metrics

The system extracts the following metrics from evaluations:

- `history_taking_rating`: Quality of history gathering
- `risk_factor_assessment_rating`: Risk factor identification
- `differential_diagnosis_questioning_rating`: Differential generation quality
- `communication_and_empathy_rating`: Patient communication skills
- `clinical_urgency_rating`: Recognition of urgent conditions
- `overall_diagnosis_accuracy`: Diagnostic success (Reached/Partially Reached/Missed)
- `overall_score`: Quantitative performance score (0-100%)
- `performance_label`: Qualitative performance rating
- `evaluation_summary`: Comprehensive feedback text

## Validation Rules

### Treatment Plan Validation
- Must be an array of intervention objects
- Each intervention requires:
  - `intervention`: String description (required)
  - `dosage`: String (optional)
  - `frequency`: String (optional)
- All string fields must be valid strings if provided

### Object ID Validation
- All MongoDB ObjectIds are validated using `mongoose.Types.ObjectId.isValid()`
- Invalid IDs return 400 status with appropriate error messages

## Testing Coverage

The enhanced system includes comprehensive test coverage:

- **Service Tests**: [`/services/__tests__/`](SimulatorBackend/src/services/__tests__/)
  - `aiService.test.js`: AI response generation and evaluation
  - `treatmentService.test.js`: Treatment analysis and simulation
  - `simulationService.test.js`: Core simulation functionality

- **Controller Tests**: [`/controllers/__tests__/`](SimulatorBackend/src/controllers/__tests__/)
  - `simulationController.test.js`: API endpoint controllers

- **Middleware Tests**: [`/middleware/__tests__/`](SimulatorBackend/src/middleware/__tests__/)
  - `validation.test.js`: Request validation middleware

- **Route Tests**: [`/routes/__tests__/`](SimulatorBackend/src/routes/__tests__/)
  - `simulationRoutes.test.js`: HTTP route handlers

## Usage Examples

### Starting a Simulation
```javascript
const response = await fetch('/simulation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ caseId: 'TEST-001' })
});
const { sessionId, initialPrompt } = await response.json();
```

### Submitting Treatment Plan
```javascript
const treatmentPlan = [
  {
    medication: 'Aspirin',
    dosage: '81 mg daily',
    duration: 'Lifelong',
    rationale: 'Cardioprotection in suspected ACS'
  }
];

const response = await fetch(`/simulation/treatment-plan/${sessionId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(treatmentPlan)
});
const analysis = await response.json();
```

### Getting Evaluation Results
```javascript
const response = await fetch(`/simulation/end/${sessionId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user: { id: 'user-123' } })
});
const { evaluation, history } = await response.json();
```

## Error Handling

The system uses consistent error responses:

```json
{
  "status": 400,
  "message": "Descriptive error message"
}
```

Common error scenarios:
- Invalid session IDs
- Missing required fields
- Invalid treatment plan format
- Session not found
- Case data missing

## Performance Considerations

- **Streaming Responses**: Patient responses are streamed via SSE for real-time interaction
- **Database Transactions**: Critical operations use MongoDB transactions for data consistency
- **AI Service Optimization**: Evaluation requests use lower temperature (0.4) for consistent scoring
- **Validation Middleware**: Request validation occurs before controller processing

## Security Considerations

- **Input Validation**: All user inputs are validated before processing
- **Object ID Validation**: Prevents NoSQL injection attacks
- **Role-Based Access**: Integration with existing RBAC system
- **Data Sanitization**: Treatment plan inputs are validated and sanitized

## Integration Points

The enhanced simulation system integrates with:

1. **Existing Case Management**: Uses case metadata and clinical dossiers
2. **User Progress Tracking**: Updates clinician progress after simulation completion
3. **Performance Analytics**: Stores evaluation metrics for reporting
4. **AI Service**: Leverages OpenAI GPT-4o for patient responses and evaluations

## Future Enhancements

Potential areas for further development:

1. **Multi-modal Interactions**: Support for images, lab results, and physical exam findings
2. **Time-based Progression**: Simulate disease progression over time
3. **Team-based Simulations**: Support for multiple clinicians in a session
4. **Custom Evaluation Criteria**: Allow educators to define custom evaluation rubrics
5. **Real-time Feedback**: Provide immediate feedback during simulations
6. **Integration with EMR**: Simulate electronic medical record interactions