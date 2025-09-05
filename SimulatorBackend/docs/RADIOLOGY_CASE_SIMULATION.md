# Radiology Case Simulation System

## Overview

The Radiology Case Simulation system provides comprehensive support for simulating radiology workflows, including imaging study selection, technique optimization, image interpretation, finding documentation, reporting, and radiation safety. This system is designed to train radiologists, radiology technicians, and healthcare professionals in proper radiology procedures and diagnostic decision-making.

## Key Features

### 1. Imaging Study Selection and Technique
- **Study Appropriateness**: Automated assessment of imaging modality selection based on clinical indications
- **Technique Optimization**: Protocol parameter optimization and patient positioning guidance
- **Contrast Considerations**: Contrast usage assessment and contraindication identification

### 2. Image Interpretation Workflows
- **Systematic Review**: Structured approach to image analysis and anatomical evaluation
- **Finding Identification**: Detection and characterization of pathological findings
- **Differential Diagnosis**: Generation of appropriate differential considerations
- **Incidental Findings**: Management and documentation of unexpected findings

### 3. Reporting and Documentation
- **Structured Reporting**: Comprehensive report generation with standardized sections
- **Finding Documentation**: Complete and accurate documentation of imaging findings
- **Communication Protocols**: Procedures for critical finding communication and consultation

### 4. Radiation Safety and Optimization
- **ALARA Principles**: Application of As Low As Reasonably Achievable radiation safety principles
- **Dose Optimization**: Techniques for minimizing radiation exposure while maintaining diagnostic quality
- **Safety Compliance**: Adherence to radiation safety protocols and regulations

## Radiology Case Template Structure

### Case Metadata
```json
{
  "specialty": "radiology",
  "subspecialty": "neuroradiology|musculoskeletal|thoracic|abdominal",
  "case_type": "imaging_interpretation|technique_optimization|radiation_safety",
  "location": "radiology_department|emergency_radiology|outpatient_imaging"
}
```

### Imaging Study Information
- **Modality**: CT, MRI, X-ray, Ultrasound, Nuclear Medicine
- **Study Type**: Specific examination type (e.g., Chest CT, Brain MRI)
- **Technique Parameters**: Acquisition settings, contrast usage, positioning
- **Image Quality**: Technical adequacy, artifacts, limitations

### Systematic Review Structure
- **Anatomical Structures**: Comprehensive anatomical coverage assessment
- **Pathological Findings**: Expected abnormal findings for the case
- **Normal Variants**: Common normal anatomical variations
- **Comparison Studies**: Previous imaging for comparison

### Radiation Safety Considerations
- **Dose Documentation**: Radiation dose parameters and optimization
- **Safety Justification**: Clinical justification for radiation exposure
- **Optimization Techniques**: Methods used to minimize radiation dose

## Simulation Actions

The radiology simulation supports the following action types:

### 1. Study Selection (`study_selection`)
```json
{
  "type": "study_selection",
  "data": {
    "clinical_indication": "chest_pain|headache|abdominal_pain",
    "patient_factors": {
      "renal_impairment": false,
      "pregnancy": false,
      "contrast_allergy": false
    },
    "priority": "routine|urgent|stat"
  }
}
```

### 2. Imaging Technique (`imaging_technique`)
```json
{
  "type": "imaging_technique",
  "data": {
    "protocol_parameters": {
      "slice_thickness": "1mm",
      "kvp": 120,
      "ma": 200
    },
    "patient_positioning": "supine|prone|decubitus",
    "contrast_considerations": "renal_function_normal|contrast_contraindicated"
  }
}
```

### 3. Image Interpretation (`image_interpretation`)
```json
{
  "type": "image_interpretation",
  "data": {
    "anatomical_region": "chest|abdomen|brain|extremities",
    "findings": [
      {
        "description": "Pulmonary nodule",
        "location": "Right lower lobe",
        "size": "8mm",
        "characteristics": "solid, spiculated"
      }
    ],
    "measurements": {
      "nodule_size": "8mm",
      "effusion_volume": "small"
    }
  }
}
```

### 4. Finding Documentation (`finding_documentation`)
```json
{
  "type": "finding_documentation",
  "data": {
    "findings": [
      {
        "description": "Right lower lobe nodule",
        "location": "RLL",
        "size": "8mm",
        "characteristics": "solid",
        "significance": "suspicious for malignancy"
      }
    ],
    "categorization": [
      {
        "type": "primary",
        "findings": ["pulmonary nodule"]
      }
    ],
    "urgency_level": "routine|urgent|critical"
  }
}
```

### 5. Report Generation (`report_generation`)
```json
{
  "type": "report_generation",
  "data": {
    "report_structure": [
      "clinical_history",
      "technique",
      "findings",
      "impression",
      "recommendations"
    ],
    "findings_summary": "Right lower lobe 8mm solid nodule...",
    "impressions": "Suspicious pulmonary nodule...",
    "recommendations": ["PET-CT", "3-month follow-up"]
  }
}
```

### 6. Radiation Safety (`radiation_safety`)
```json
{
  "type": "radiation_safety",
  "data": {
    "dose_optimization": {
      "dose_reduction": true,
      "modulation": true,
      "iterative_reconstruction": true
    },
    "safety_protocols": {
      "shielding": true,
      "pregnancy_screening": true,
      "time_out_procedure": true
    },
    "patient_protection": {
      "lead_apron": true,
      "thyroid_shield": true,
      "gonadal_shielding": true
    }
  }
}
```

### 7. Critical Finding (`critical_finding`)
```json
{
  "type": "critical_finding",
  "data": {
    "finding": "Aortic dissection",
    "severity": "immediate|urgent|routine",
    "communication_method": "phone|in_person|electronic",
    "recipient": "ordering_physician|emergency_department|icu"
  }
}
```

### 8. Consultation Request (`consultation_request`)
```json
{
  "type": "consultation_request",
  "data": {
    "consult_reason": "complex_mass|uncertain_diagnosis",
    "requested_specialty": "thoracic_surgery|oncology",
    "urgency": "routine|urgent",
    "clinical_question": "Surgical resectability assessment"
  }
}
```

## Evaluation Criteria

Radiology cases are evaluated based on five key competency areas:

1. **Systematic Approach (25%)**: Structured image review and comprehensive anatomical coverage
2. **Finding Identification (30%)**: Accurate detection and characterization of pathological findings
3. **Differential Diagnosis (25%)**: Appropriate differential considerations and clinical correlation
4. **Reporting Quality (15%)**: Clear, comprehensive, and structured reporting
5. **Radiation Safety (5%)**: Adherence to ALARA principles and safety protocols

## Integration with Existing System

### Case Template Service Integration
The radiology template is available through the [`CaseTemplateService.getTemplate('radiology')`](../src/services/CaseTemplateService.js) method and includes validation for radiology-specific requirements.

### Simulation Service Integration
Radiology cases are automatically detected by the simulation service ([`handleAsk` function](../src/services/simulationService.js)) and routed to the [`RadiologySimulationService`](../src/services/RadiologySimulationService.js) for processing.

### AI Service Integration
Radiology case evaluations utilize the existing AI evaluation system with radiology-specific scoring rubrics and feedback generation.

## Example Radiology Case

```json
{
  "case_metadata": {
    "title": "Suspicious Pulmonary Nodule Evaluation",
    "specialty": "radiology",
    "subspecialty": "thoracic",
    "difficulty": "intermediate"
  },
  "clinical_dossier": {
    "imaging_study": {
      "modality": "CT",
      "study_type": "Chest CT with Contrast",
      "technique": {
        "contrast_used": true,
        "contrast_type": "IV iodinated",
        "acquisition_parameters": {
          "kvp": 120,
          "ma": 200,
          "slice_thickness": "1mm"
        }
      }
    },
    "systematic_review": {
      "pathological_findings": [
        "Right lower lobe pulmonary nodule",
        "Minimal pleural effusion"
      ],
      "normal_structures": [
        "Heart size normal",
        "No pneumothorax",
        "No lymphadenopathy"
      ]
    },
    "radiation_safety": {
      "dose_considerations": "Low-dose protocol used",
      "justification": "Cancer screening in high-risk patient",
      "optimization": ["Dose modulation", "Iterative reconstruction"]
    }
  }
}
```

## Testing

Comprehensive tests are available in [`radiologySimulation.test.js`](../tests/radiologySimulation.test.js) covering:

- Study selection appropriateness
- Imaging technique optimization
- Image interpretation accuracy
- Finding documentation completeness
- Report generation quality
- Radiation safety compliance
- Critical finding communication
- Consultation request handling

## Usage Examples

### Starting a Radiology Simulation
```javascript
// Use existing simulation start endpoint
const response = await fetch('/api/simulation/start', {
  method: 'POST',
  body: JSON.stringify({ caseId: 'RAD_THOR_001' })
});
```

### Processing Radiology Actions
```javascript
// Example: Process image interpretation
const action = {
  type: 'image_interpretation',
  data: {
    anatomical_region: 'chest',
    findings: [
      {
        description: 'Right lower lobe pulmonary nodule',
        location: 'RLL',
        size: '8mm',
        characteristics: 'solid, spiculated'
      }
    ]
  }
};

const response = await fetch(`/api/simulation/${sessionId}/ask`, {
  method: 'POST',
  body: JSON.stringify(action)
});
```

## Compliance and Standards

The radiology simulation system aligns with:

- ACR (American College of Radiology) Appropriateness Criteria
- Image Wisely and Image Gently radiation safety campaigns
- IAEA (International Atomic Energy Agency) safety standards
- Local and international radiology practice guidelines
- ALARA (As Low As Reasonably Achievable) principles

## Future Enhancements

1. **Advanced Imaging Modalities**: PET-CT, MRI spectroscopy, functional imaging
2. **3D Reconstruction**: Volume rendering and multi-planar reconstruction tools
3. **AI-Assisted Detection**: Integration with AI-based lesion detection algorithms
4. **Interventional Radiology**: Simulation of biopsy and drainage procedures
5. **Workflow Integration**: PACS/RIS system integration and workflow simulation

## Support

For technical support or questions about radiology case simulation, contact the simulation system administrators or refer to the main system documentation.