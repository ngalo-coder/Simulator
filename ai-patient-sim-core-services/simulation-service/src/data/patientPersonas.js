//  Medical Training Program Areas - Patient Personas with Guardian Dynamics


// ai-patient-sim-core-services/simulation-service/src/data/patientPersonas.js

const PATIENT_PERSONAS = {
  
  // 🏥 INTERNAL MEDICINE PROGRAM
  chestPainMI: {
    id: 'internal_med_chest_pain_001',
    programArea: 'internal_medicine',
    specialty: 'cardiology',
    difficulty: 'resident',
    patientType: 'adult',
    learningObjectives: [
      'Recognize STEMI presentation',
      'Order appropriate cardiac workup', 
      'Calculate TIMI risk score',
      'Initiate dual antiplatelet therapy'
    ],
    demographics: {
      age: 58,
      gender: 'male',
      ethnicity: 'african_american',
      occupation: 'truck_driver',
      insurance: 'medicaid'
    },
    chiefComplaint: "I've been having crushing chest pain for 3 hours",
    medicalHistory: ['dm_type2_uncontrolled', 'htn', 'smoking_40_pack_years'],
    medications: ['metformin_irregular_compliance', 'lisinopril_cant_afford'],
    socialHistory: {
      smoking: '2_packs_daily',
      alcohol: 'beer_daily',
      housing: 'unstable',
      support: 'lives_alone_estranged_family'
    },
    currentCondition: 'acute_inferior_stemi',
    personality: 'stoic_minimizes_pain_reluctant_to_seek_help',
    culturalFactors: 'medical_mistrust_financial_concerns',
    vitalSigns: { bp: '180/100', hr: 110, temp: 98.1, rr: 20, o2sat: 95, pain: '8/10' },
    physicalExam: {
      general: 'diaphoretic_clutching_chest_anxious',
      cardiac: 'tachycardic_s4_gallop_no_murmur',
      lungs: 'bibasilar_rales'
    }
  },

  // 👶 PEDIATRICS PROGRAM  
  pediatricFeverGuardian: {
    id: 'pediatrics_fever_guardian_001',
    programArea: 'pediatrics',
    specialty: 'general_pediatrics',
    difficulty: 'student',
    patientType: 'pediatric_with_guardian',
    patient: {
      age: '18_months',
      name: 'Sofia',
      gender: 'female',
      developmentalStage: 'toddler_nonverbal_stranger_anxiety'
    },
    guardian: {
      relationship: 'mother',
      name: 'Maria',
      age: 28,
      primaryLanguage: 'spanish',
      englishProficiency: 'limited',
      education: 'high_school',
      anxiety_level: 'very_high',
      medicalKnowledge: 'limited'
    },
    learningObjectives: [
      'Assess febrile infant using guardian history',
      'Recognize serious bacterial infection signs',
      'Navigate language barriers effectively',
      'Calm anxious parent while examining child'
    ],
    chiefComplaint: "Mi bebé tiene fiebre y no quiere comer / My baby has fever and won't eat",
    guardianConcerns: [
      'fever_for_2_days_up_to_102F',
      'decreased_appetite_fussy',
      'not_sleeping_well',
      'worried_about_meningitis'
    ],
    medicalHistory: ['born_full_term', 'no_prior_hospitalizations', 'up_to_date_vaccines'],
    socialHistory: {
      daycare: 'home_with_grandmother',
      siblings: '3_year_old_brother_healthy',
      parentalAnxiety: 'first_time_mother_very_worried'
    },
    currentCondition: 'viral_upper_respiratory_infection',
    personality: {
      patient: 'cranky_clingy_to_mother_cries_with_examination',
      guardian: 'anxious_protective_needs_reassurance'
    },
    culturalFactors: 'hispanic_family_traditional_remedies_used',
    vitalSigns: { temp: '101.8F', hr: 140, rr: 35, bp: '85/45', o2sat: 98 },
    physicalExam: {
      general: 'fussy_but_consolable_good_color',
      eent: 'clear_rhinorrhea_no_signs_serious_illness',
      cardiac: 'tachycardic_no_murmur',
      lungs: 'clear_bilateral'
    },
    guardianInteractionScript: {
      opening: "Doctora, estoy muy preocupada. Ella nunca había estado tan enferma.",
      translation: "Doctor, I'm very worried. She's never been this sick before.",
      keyResponses: [
        "¿Es algo serio? ¿Necesita antibióticos?",
        "My mother says I should give her té de manzanilla",
        "She won't let me put her down. Is that normal?"
      ]
    }
  },

  // 🩺 FAMILY MEDICINE PROGRAM
  adolescentRiskyBehavior: {
    id: 'family_med_adolescent_001',
    programArea: 'family_medicine', 
    specialty: 'adolescent_medicine',
    difficulty: 'resident',
    patientType: 'adolescent_with_guardian',
    patient: {
      age: 16,
      name: 'Tyler',
      gender: 'male',
      developmentalStage: 'seeking_independence_risk_taking'
    },
    guardian: {
      relationship: 'stepfather',
      name: 'Robert',
      concerns: 'behavioral_changes_academic_decline',
      relationship_quality: 'strained_recent_blended_family'
    },
    learningObjectives: [
      'Conduct confidential adolescent interview',
      'Screen for substance use and risky behaviors',
      'Navigate guardian consent and patient autonomy',
      'Address mental health in adolescents'
    ],
    chiefComplaint: "His grades are dropping and he's been acting differently",
    guardianConcerns: [
      'failing_classes_previously_good_student',
      'staying_out_late_secretive',
      'new_friend_group_concerned_about_influence',
      'found_vape_in_backpack'
    ],
    patientConcerns: [
      'parents_dont_understand_him',
      'stress_about_college_applications',
      'peer_pressure_to_fit_in'
    ],
    medicalHistory: ['adhd_diagnosed_age_8', 'no_medications_currently'],
    socialHistory: {
      family: 'parents_divorced_2_years_ago_living_with_mom_stepfather',
      school: 'junior_year_high_school_previously_honor_roll',
      activities: 'quit_soccer_team_this_year',
      substances: 'vaping_nicotine_occasional_marijuana_denies_alcohol'
    },
    currentCondition: 'adjustment_disorder_substance_experimentation',
    personality: {
      patient: 'guarded_initially_defensive_opens_up_when_alone',
      guardian: 'frustrated_worried_wants_quick_fix'
    },
    confidentialityIssues: 'patient_requests_privacy_about_substance_use',
    physicalExam: 'normal_adolescent_male_no_acute_distress'
  },

  // 🚑 EMERGENCY MEDICINE PROGRAM
  traumaPediatricGuardian: {
    id: 'emergency_trauma_pediatric_001',
    programArea: 'emergency_medicine',
    specialty: 'pediatric_emergency',
    difficulty: 'resident',
    patientType: 'pediatric_trauma_with_guardian',
    patient: {
      age: '7_years',
      name: 'Aiden',
      gender: 'male',
      mechanism: 'fell_from_monkey_bars_playground'
    },
    guardian: {
      relationship: 'father',
      name: 'James',
      emotional_state: 'panicked_guilt_ridden',
      was_supervising: 'distracted_by_phone_call'
    },
    learningObjectives: [
      'Apply pediatric trauma assessment (ABCDE)',
      'Manage distraught parent during emergency',
      'Recognize child abuse vs accidental injury',
      'Calculate pediatric medication dosing'
    ],
    chiefComplaint: "He fell and hurt his arm, I think it's broken",
    mechanismOfInjury: {
      height: '6_feet_monkey_bars',
      surface: 'wood_chips',
      witnessed: 'other_children_saw_fall',
      consciousness: 'never_lost_crying_immediately'
    },
    guardianNarrative: [
      "I was right there but took a work call",
      "He's usually so careful on the playground",
      "Other kids said he just slipped",
      "Should I have caught him? This is my fault"
    ],
    medicalHistory: ['healthy_no_prior_injuries', 'all_vaccines_current'],
    socialHistory: {
      family: 'intact_family_both_parents_present',
      school: '2nd_grade_no_behavioral_issues',
      safety: 'uses_car_seat_helmet_when_biking'
    },
    currentCondition: 'closed_radius_ulna_fracture_no_other_injuries',
    personality: {
      patient: 'scared_crying_wants_daddy_cooperative_with_gentle_approach',
      guardian: 'anxious_self_blaming_needs_reassurance'
    },
    vitalSigns: { hr: 120, rr: 24, bp: '95/60', temp: 98.6, o2sat: 100, pain: '7/10' },
    physicalExam: {
      primary_survey: 'stable_airway_breathing_circulation_intact',
      secondary: 'obvious_forearm_deformity_guarding_arm'
    }
  },

  // 🧠 PSYCHIATRY PROGRAM
  mentalHealthAdolescent: {
    id: 'psychiatry_adolescent_001',
    programArea: 'psychiatry',
    specialty: 'child_adolescent_psychiatry',
    difficulty: 'resident',
    patientType: 'adolescent_with_guardian',
    patient: {
      age: 15,
      name: 'Emma',
      gender: 'female',
      presentation: 'withdrawn_refuses_to_speak_initially'
    },
    guardian: {
      relationship: 'mother',
      name: 'Jennifer',
      occupation: 'nurse',
      concernLevel: 'extremely_worried',
      medicalKnowledge: 'high_but_emotionally_involved'
    },
    learningObjectives: [
      'Conduct adolescent mental health assessment',
      'Screen for suicidal ideation safely',
      'Balance patient confidentiality with safety',
      'Manage healthcare provider parent dynamics'
    ],
    chiefComplaint: "She's been isolating herself and I found concerning things in her room",
    guardianConcerns: [
      'self_harm_evidence_cutting_wrists',
      'stopped_eating_meals_weight_loss',
      'quit_activities_drama_club_friends',
      'concerning_social_media_posts'
    ],
    patientEventualDisclosure: [
      'bullying_at_school_social_media',
      'body_image_issues_comparison_others',
      'feeling_hopeless_overwhelmed',
      'thoughts_of_self_harm_but_no_plan'
    ],
    medicalHistory: ['no_prior_mental_health_treatment'],
    socialHistory: {
      family: 'high_achieving_family_pressure_for_perfection',
      school: 'honor_student_perfectionist_tendencies',
      social: 'small_friend_group_recent_conflict',
      substances: 'denies_use'
    },
    currentCondition: 'major_depressive_episode_with_self_harm',
    personality: {
      patient: 'initially_silent_gradually_opens_up_intelligent_articulate',
      guardian: 'professional_but_emotional_wants_to_fix_everything'
    },
    riskAssessment: 'moderate_risk_self_harm_low_suicide_risk',
    confidentialityConflict: 'patient_doesnt_want_mother_to_know_details'
  },

  // 🩻 SURGERY PROGRAM
  appendicitisPediatric: {
    id: 'surgery_appendicitis_001',
    programArea: 'surgery',
    specialty: 'pediatric_surgery',
    difficulty: 'resident', 
    patientType: 'pediatric_with_guardian',
    patient: {
      age: '12_years',
      name: 'Marcus',
      gender: 'male',
      presentation: 'abdominal_pain_nausea_fever'
    },
    guardian: {
      relationship: 'grandmother',
      name: 'Dorothy',
      role: 'primary_caregiver',
      concerns: 'afraid_of_surgery_wants_conservative_treatment'
    },
    learningObjectives: [
      'Diagnose appendicitis in pediatric patient',
      'Obtain informed consent from guardian',
      'Explain surgical risks age-appropriately',
      'Address cultural concerns about surgery'
    ],
    chiefComplaint: "His stomach has been hurting since yesterday and now he has fever",
    guardianNarrative: [
      "Started with pain around his belly button",
      "Now it's moved to the right side and he can't walk straight",
      "He threw up twice this morning",
      "I gave him Tylenol but the fever won't break"
    ],
    medicalHistory: ['healthy_no_prior_surgeries', 'penicillin_allergy'],
    socialHistory: {
      family: 'lives_with_grandmother_parents_work_multiple_jobs',
      cultural: 'baptist_family_wants_prayer_before_procedures',
      insurance: 'medicaid'
    },
    currentCondition: 'acute_appendicitis_without_perforation',
    personality: {
      patient: 'scared_of_needles_wants_grandmother_present',
      guardian: 'protective_religious_needs_detailed_explanation'
    },
    vitalSigns: { temp: '101.2F', hr: 110, bp: '105/65', rr: 20, pain: '8/10' },
    physicalExam: {
      abdomen: 'mcburneys_point_tenderness_positive_rovsings_sign',
      general: 'appears_ill_guarding_abdomen'
    },
    culturalConsiderations: 'family_wants_pastor_called_before_surgery'
  },

  // 👩‍⚕️ OBSTETRICS/GYNECOLOGY PROGRAM
  adolescentContraception: {
    id: 'obgyn_contraception_001',
    programArea: 'obstetrics_gynecology',
    specialty: 'adolescent_gynecology',
    difficulty: 'student',
    patientType: 'adolescent_confidential',
    patient: {
      age: 17,
      name: 'Jasmine',
      gender: 'female',
      presentation: 'requests_birth_control_confidentially'
    },
    guardian: {
      relationship: 'mother',
      name: 'Patricia',
      awareness: 'thinks_visit_for_sports_physical',
      cultural_background: 'conservative_religious_family'
    },
    learningObjectives: [
      'Provide confidential reproductive healthcare',
      'Counsel on contraceptive options',
      'Navigate minor consent laws',
      'Address cultural and religious considerations'
    ],
    chiefComplaint: "I'm here for a sports physical (with guardian) / I actually want birth control (alone)",
    patientRealConcerns: [
      'sexually_active_with_boyfriend_6_months',
      'wants_reliable_contraception',
      'afraid_parents_would_be_very_upset',
      'friend_recommended_iud'
    ],
    medicalHistory: ['menarche_age_13', 'regular_periods', 'no_std_history'],
    socialHistory: {
      family: 'strict_household_expectations_abstinence',
      relationship: 'steady_boyfriend_same_age',
      education: 'high_school_senior_college_bound',
      substances: 'denies_smoking_drinking'
    },
    currentCondition: 'healthy_adolescent_seeking_contraception',
    personality: {
      patient: 'mature_responsible_nervous_about_confidentiality',
      guardian: 'loving_but_traditional_would_be_disappointed'
    },
    legalConsiderations: 'state_allows_minor_contraceptive_access',
    confidentialityRequirements: 'cannot_bill_insurance_without_parent_knowing'
  },

  // 🫀 CARDIOLOGY FELLOWSHIP
  congenitalHeartPediatric: {
    id: 'cardiology_congenital_001',
    programArea: 'cardiology_fellowship',
    specialty: 'pediatric_cardiology',
    difficulty: 'fellow',
    patientType: 'pediatric_with_guardian',
    patient: {
      age: '6_months',
      name: 'Baby_Chen',
      gender: 'female',
      presentation: 'failure_to_thrive_feeding_difficulties'
    },
    guardian: {
      relationship: 'parents',
      names: 'Li_and_David_Chen',
      background: 'first_time_parents_both_physicians',
      concerns: 'worried_about_development_weight_gain'
    },
    learningObjectives: [
      'Diagnose congenital heart disease in infant',
      'Interpret pediatric echocardiogram',
      'Counsel parents about surgical options',
      'Coordinate multidisciplinary care'
    ],
    chiefComplaint: "She's not gaining weight and gets tired during feeding",
    guardianObservations: [
      'feeds_slowly_sweats_during_bottles',
      'growth_curve_dropping_percentiles',
      'sometimes_blue_around_lips_when_crying',
      'more_tired_than_other_babies'
    ],
    medicalHistory: ['born_38_weeks_no_prenatal_diagnosis_chd'],
    currentCondition: 'ventricular_septal_defect_moderate_with_chf',
    personality: {
      patient: 'fussy_during_exam_consolable_with_parents',
      guardian: 'highly_educated_asking_detailed_questions'
    },
    vitalSigns: { hr: 160, rr: 45, bp: '85/45', o2sat: 94, weight: '5th_percentile' },
    physicalExam: {
      cardiac: 'grade_3_systolic_murmur_llsb_thrill_palpable',
      lungs: 'mild_tachypnea_no_retractions',
      general: 'failure_to_thrive_otherwise_alert'
    },
    diagnosticFindings: {
      echo: 'moderate_vsd_left_to_right_shunt',
      chest_xray: 'cardiomegaly_increased_pulmonary_markings'
    }
  }
};

// Program Area Configuration
const PROGRAM_AREAS = {
  internal_medicine: {
    name: 'Internal Medicine',
    levels: ['student', 'intern', 'resident', 'chief_resident'],
    focus: 'adult_medicine_complex_cases'
  },
  pediatrics: {
    name: 'Pediatrics', 
    levels: ['student', 'intern', 'resident', 'chief_resident'],
    focus: 'child_development_guardian_dynamics',
    special_considerations: 'guardian_consent_child_comfort'
  },
  family_medicine: {
    name: 'Family Medicine',
    levels: ['student', 'resident', 'attending'],
    focus: 'lifespan_care_family_dynamics'
  },
  emergency_medicine: {
    name: 'Emergency Medicine',
    levels: ['student', 'resident', 'attending'],
    focus: 'acute_care_time_pressure_trauma'
  },
  psychiatry: {
    name: 'Psychiatry',
    levels: ['student', 'intern', 'resident', 'fellow'],
    focus: 'mental_health_therapeutic_communication'
  },
  surgery: {
    name: 'Surgery',
    levels: ['student', 'intern', 'resident', 'chief_resident', 'fellow'],
    focus: 'procedural_skills_operative_decision_making'
  },
  obstetrics_gynecology: {
    name: 'Obstetrics & Gynecology',
    levels: ['student', 'resident', 'fellow'],
    focus: 'womens_health_reproductive_medicine'
  }
};

// Guardian Interaction Dynamics
const GUARDIAN_DYNAMICS = {
  parent_infant: {
    communication: 'parent_primary_historian',
    patient_role: 'nonverbal_behavioral_cues_only',
    consent: 'parent_required_for_all_decisions'
  },
  parent_toddler: {
    communication: 'parent_primary_child_limited_verbal',
    patient_role: 'simple_yes_no_responses_fear_stranger',
    consent: 'parent_consent_child_assent_age_appropriate'
  },
  parent_school_age: {
    communication: 'both_parent_and_child_contribute',
    patient_role: 'can_describe_symptoms_basic_cooperation',
    consent: 'parent_consent_child_assent_important'
  },
  parent_adolescent: {
    communication: 'complex_confidentiality_issues',
    patient_role: 'primary_historian_developmental_independence',
    consent: 'state_laws_vary_confidential_services'
  },
  guardian_substitute: {
    communication: 'may_lack_complete_medical_history',
    consent: 'legal_guardianship_documentation_required',
    dynamics: 'different_relationship_than_biological_parent'
  }
};

module.exports = {
  PATIENT_PERSONAS,
  PROGRAM_AREAS,
  GUARDIAN_DYNAMICS
};
