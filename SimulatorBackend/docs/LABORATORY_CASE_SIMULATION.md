# Laboratory Case Simulation System

## Overview

The Laboratory Case Simulation system provides comprehensive support for simulating medical laboratory workflows, including specimen processing, quality control, testing procedures, result interpretation, and safety protocols. This system is designed to train medical laboratory scientists, technicians, and healthcare professionals in proper laboratory procedures and decision-making.

## Key Features

### 1. Specimen Processing Workflows
- **Specimen Receipt and Verification**: Automated verification of specimen quality, labeling accuracy, and volume adequacy
- **Pre-analytical Phase**: Processing steps including centrifugation, aliquoting, and storage
- **Quality Checks**: Comprehensive quality assessment upon specimen receipt

### 2. Quality Control Procedures
- **Internal Quality Control**: Daily QC procedures with Westgard rules implementation
- **External Quality Assessment**: Proficiency testing simulation
- **QC Failure Management**: Automated detection and corrective action protocols

### 3. Testing and Analysis
- **Multi-instrument Support**: Simulation of various laboratory analyzers and equipment
- **Test Procedures**: Step-by-step guidance for different laboratory tests
- **Technical Issue Handling**: Simulation of instrument malfunctions and troubleshooting

### 4. Result Interpretation
- **Reference Range Application**: Automatic comparison against established reference ranges
- **Critical Value Detection**: Identification and handling of critical results
- **Clinical Correlation**: Guidance on result interpretation in clinical context

### 5. Safety and Compliance
- **Personal Protective Equipment**: Requirements and usage simulation
- **Biohazard Handling**: Procedures for handling hazardous materials
- **Incident Response**: Protocols for spills, exposures, and other safety incidents

## Laboratory Case Template Structure

### Case Metadata
```json
{
  "specialty": "laboratory",
  "department": "hematology|microbiology|chemistry|immunology",
  "accreditation_standards": ["ISO 15189", "CLIA", "CAP"],
  "case_type": "diagnostic_testing|quality_control|safety_training"
}
```

### Specimen Information
- **Specimen Type**: Blood, urine, tissue, etc.
- **Collection Details**: Method, time, conditions
- **Quality Assessment**: Acceptability criteria and rejection reasons
- **Stability Information**: Storage and handling requirements

### Test Requests
- **Ordered Tests**: Array of requested laboratory tests
- **Priority Levels**: Routine, urgent, stat
- **Special Instructions**: Add-on tests, repeat testing requirements
- **Turnaround Times**: Expected completion times

### Quality Control Section
- **QC Materials**: Control levels and frequencies
- **QC Rules**: Westgard rules and acceptance criteria
- **Corrective Actions**: Procedures for QC failures

### Safety Protocols
- **PPE Requirements**: Gloves, lab coats, eye protection
- **Emergency Procedures**: Spill response, exposure management
- **Waste Disposal**: Proper disposal methods for different waste types

## Simulation Actions

The laboratory simulation supports the following action types:

### 1. Specimen Receipt (`specimen_receipt`)
```json
{
  "type": "specimen_receipt",
  "data": {
    "specimen_id": "SP123",
    "verification_steps": ["check_label", "check_volume", "check_quality"]
  }
}
```

### 2. Quality Control (`quality_control`)
```json
{
  "type": "quality_control",
  "data": {
    "qc_type": "internal|external",
    "instrument": "Analyzer A",
    "test_name": "Glucose"
  }
}
```

### 3. Test Execution (`test_execution`)
```json
{
  "type": "test_execution",
  "data": {
    "test_name": "CBC",
    "instrument": "Hematology Analyzer",
    "parameters": {
      "mode": "standard",
      "dilution": "none"
    }
  }
}
```

### 4. Result Interpretation (`result_interpretation`)
```json
{
  "type": "result_interpretation",
  "data": {
    "test_name": "Potassium",
    "result": "5.8",
    "clinical_correlation": "Patient with renal disease"
  }
}
```

### 5. Safety Incidents (`safety_incident`)
```json
{
  "type": "safety_incident",
  "data": {
    "incident_type": "chemical_spill|biological_exposure",
    "severity": "low|moderate|high",
    "location": "Chemistry lab bench 5"
  }
}
```

### 6. Critical Values (`critical_value`)
```json
{
  "type": "critical_value",
  "data": {
    "test_name": "Glucose",
    "result": "25",
    "patient_info": "Patient ID: 123, Room: 456"
  }
}
```

## Evaluation Criteria

Laboratory cases are evaluated based on six key competency areas:

1. **Specimen Handling (15%)**: Proper collection, processing, and storage
2. **Quality Control (20%)**: QC procedures and troubleshooting
3. **Technical Competency (20%)**: Test execution and instrument operation
4. **Result Interpretation (20%)**: Analysis and clinical correlation
5. **Safety Protocols (15%)**: Compliance and incident response
6. **Timeliness (10%)**: Meeting turnaround times and deadlines

## Integration with Existing System

### Case Template Service Integration
The laboratory template is available through the [`CaseTemplateService.getTemplate('laboratory')`](../src/services/CaseTemplateService.js) method and includes enhanced validation for laboratory-specific requirements.

### Simulation Service Integration
Laboratory cases are automatically detected by the simulation service ([`handleAsk` function](../src/services/simulationService.js)) and routed to the [`LaboratorySimulationService`](../src/services/LaboratorySimulationService.js) for processing.

### AI Service Integration
Laboratory case evaluations utilize the existing AI evaluation system with laboratory-specific scoring rubrics and feedback generation.

## Example Laboratory Case

```json
{
  "case_metadata": {
    "title": "Complete Blood Count with Abnormal Results",
    "specialty": "laboratory",
    "department": "hematology",
    "difficulty": "intermediate"
  },
  "clinical_dossier": {
    "specimen_information": {
      "specimen_type": "Whole blood",
      "collection_method": "Venipuncture",
      "specimen_quality": "acceptable",
      "volume_adequacy": "sufficient"
    },
    "test_requests": {
      "ordered_tests": ["CBC", "Differential"],
      "reference_ranges": {
        "WBC": "4.5-11.0 x 10^9/L",
        "HGB": "12.0-16.0 g/dL"
      }
    },
    "hidden_results": {
      "WBC": "15.5 x 10^9/L",
      "HGB": "10.2 g/dL"
    }
  }
}
```

## Testing

Comprehensive tests are available in [`laboratorySimulation.test.js`](../tests/laboratorySimulation.test.js) covering:

- Specimen receipt and verification
- Quality control procedures
- Test execution and result generation
- Safety incident handling
- Critical value management

## Usage Examples

### Starting a Laboratory Simulation
```javascript
// Use existing simulation start endpoint
const response = await fetch('/api/simulation/start', {
  method: 'POST',
  body: JSON.stringify({ caseId: 'LAB_HEMA_001' })
});
```

### Processing Laboratory Actions
```javascript
// Example: Process specimen receipt
const action = {
  type: 'specimen_receipt',
  data: {
    specimen_id: 'SP123',
    verification_steps: ['check_label', 'check_quality']
  }
};

const response = await fetch(`/api/simulation/${sessionId}/ask`, {
  method: 'POST',
  body: JSON.stringify(action)
});
```

## Compliance and Standards

The laboratory simulation system aligns with:
- ISO 15189:2012 Medical laboratories requirements
- CLIA (Clinical Laboratory Improvement Amendments)
- CAP (College of American Pathologists) standards
- Local and international laboratory accreditation requirements

## Future Enhancements

1. **Advanced Instrument Simulation**: More detailed instrument-specific workflows
2. **Inter-laboratory Comparison**: Proficiency testing simulation across multiple labs
3. **Inventory Management**: Reagent and supply tracking integration
4. **Digital Pathology**: Integration with digital microscopy and image analysis
5. **Molecular Testing**: PCR, sequencing, and other molecular techniques

## Support

For technical support or questions about laboratory case simulation, contact the simulation system administrators or refer to the main system documentation.