// Specialty Configuration System
// This file contains all specialty metadata, color coding, and configuration

export interface SpecialtyConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  caseCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  estimatedDuration: string;
  phase: 'current' | 'phase1' | 'phase2' | 'future';
  category: 'primary' | 'secondary';
}

// Color coding system for specialties
export const SPECIALTY_COLORS = {
  primary: {
    internal_medicine: '#2E7D9A',
    cardiology: '#C62D42',
    neurology: '#7C3AED',
    emergency_medicine: '#DC2626',
    pediatrics: '#059669',
    psychiatry: '#7C2D92'
  },
  secondary: {
    dermatology: '#EA580C',
    orthopedics: '#1D4ED8',
    radiology: '#374151',
    pathology: '#92400E',
    anesthesiology: '#1F2937',
    surgery: '#BE123C'
  }
} as const;

// Medical icon mapping
export const MEDICAL_ICONS = {
  stethoscope: '🏥',
  heart_pulse: '❤️',
  brain: '🧠',
  ambulance: '🚑',
  baby: '👶',
  head_profile: '👤',
  microscope: '🔬',
  syringe: '💉',
  bone: '🦴',
  x_ray: '🩻',
  pill: '💊',
  scalpel: '🔪'
} as const;

// Specialty configurations with all metadata
export const SPECIALTY_CONFIGURATIONS: Record<string, SpecialtyConfig> = {
  internal_medicine: {
    id: 'internal_medicine',
    name: 'Internal Medicine',
    description: 'Complex medical cases focusing on diagnosis and management of internal conditions',
    color: SPECIALTY_COLORS.primary.internal_medicine,
    icon: MEDICAL_ICONS.stethoscope,
    caseCount: 53,
    difficulty: 'intermediate',
    estimatedDuration: '30-45 min',
    phase: 'current',
    category: 'primary'
  },
  cardiology: {
    id: 'cardiology',
    name: 'Cardiology',
    description: 'Heart and cardiovascular system cases',
    color: SPECIALTY_COLORS.primary.cardiology,
    icon: MEDICAL_ICONS.heart_pulse,
    caseCount: 28,
    difficulty: 'advanced',
    prerequisites: ['internal_medicine'],
    estimatedDuration: '45-60 min',
    phase: 'phase1',
    category: 'primary'
  },
  emergency_medicine: {
    id: 'emergency_medicine',
    name: 'Emergency Medicine',
    description: 'Acute care and trauma scenarios',
    color: SPECIALTY_COLORS.primary.emergency_medicine,
    icon: MEDICAL_ICONS.ambulance,
    caseCount: 35,
    difficulty: 'advanced',
    prerequisites: ['internal_medicine'],
    estimatedDuration: '30-45 min',
    phase: 'phase1',
    category: 'primary'
  },
  neurology: {
    id: 'neurology',
    name: 'Neurology',
    description: 'Neurological conditions and disorders',
    color: SPECIALTY_COLORS.primary.neurology,
    icon: MEDICAL_ICONS.brain,
    caseCount: 22,
    difficulty: 'advanced',
    prerequisites: ['internal_medicine'],
    estimatedDuration: '45-60 min',
    phase: 'phase2',
    category: 'primary'
  },
  pediatrics: {
    id: 'pediatrics',
    name: 'Pediatrics',
    description: 'Child and adolescent medicine',
    color: SPECIALTY_COLORS.primary.pediatrics,
    icon: MEDICAL_ICONS.baby,
    caseCount: 31,
    difficulty: 'intermediate',
    estimatedDuration: '30-45 min',
    phase: 'phase2',
    category: 'primary'
  },
  psychiatry: {
    id: 'psychiatry',
    name: 'Psychiatry',
    description: 'Mental health and behavioral cases',
    color: SPECIALTY_COLORS.primary.psychiatry,
    icon: MEDICAL_ICONS.head_profile,
    caseCount: 18,
    difficulty: 'intermediate',
    estimatedDuration: '45-60 min',
    phase: 'phase2',
    category: 'primary'
  },
  dermatology: {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Skin conditions and dermatological cases',
    color: SPECIALTY_COLORS.secondary.dermatology,
    icon: MEDICAL_ICONS.microscope,
    caseCount: 15,
    difficulty: 'intermediate',
    estimatedDuration: '20-30 min',
    phase: 'future',
    category: 'secondary'
  },
  orthopedics: {
    id: 'orthopedics',
    name: 'Orthopedics',
    description: 'Musculoskeletal system and bone-related cases',
    color: SPECIALTY_COLORS.secondary.orthopedics,
    icon: MEDICAL_ICONS.bone,
    caseCount: 24,
    difficulty: 'intermediate',
    estimatedDuration: '30-45 min',
    phase: 'future',
    category: 'secondary'
  },
  radiology: {
    id: 'radiology',
    name: 'Radiology',
    description: 'Medical imaging interpretation and diagnostic cases',
    color: SPECIALTY_COLORS.secondary.radiology,
    icon: MEDICAL_ICONS.x_ray,
    caseCount: 19,
    difficulty: 'advanced',
    estimatedDuration: '20-30 min',
    phase: 'future',
    category: 'secondary'
  },
  pathology: {
    id: 'pathology',
    name: 'Pathology',
    description: 'Laboratory medicine and diagnostic testing',
    color: SPECIALTY_COLORS.secondary.pathology,
    icon: MEDICAL_ICONS.microscope,
    caseCount: 12,
    difficulty: 'advanced',
    estimatedDuration: '30-45 min',
    phase: 'future',
    category: 'secondary'
  },
  anesthesiology: {
    id: 'anesthesiology',
    name: 'Anesthesiology',
    description: 'Perioperative care and anesthesia management',
    color: SPECIALTY_COLORS.secondary.anesthesiology,
    icon: MEDICAL_ICONS.syringe,
    caseCount: 16,
    difficulty: 'advanced',
    estimatedDuration: '45-60 min',
    phase: 'future',
    category: 'secondary'
  },
  surgery: {
    id: 'surgery',
    name: 'Surgery',
    description: 'General surgery and surgical procedures',
    color: SPECIALTY_COLORS.secondary.surgery,
    icon: MEDICAL_ICONS.scalpel,
    caseCount: 42,
    difficulty: 'advanced',
    estimatedDuration: '60+ min',
    phase: 'future',
    category: 'secondary'
  },
  gastroenterology: {
    id: 'gastroenterology',
    name: 'Gastroenterology',
    description: 'Digestive system and gastrointestinal cases',
    color: '#16A34A', // Green color for GI
    icon: MEDICAL_ICONS.microscope,
    caseCount: 20,
    difficulty: 'intermediate',
    estimatedDuration: '30-45 min',
    phase: 'current',
    category: 'secondary'
  },
  ophthalmology: {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    description: 'Eye care cases covering vision assessment and ocular disease management',
    color: '#7C3AED', // Purple color for Ophthalmology
    icon: '👁️',
    caseCount: 15,
    difficulty: 'intermediate',
    estimatedDuration: '20-30 min',
    phase: 'current',
    category: 'secondary'
  }
};

// Helper functions
export const getSpecialtyConfig = (specialtyId: string): SpecialtyConfig | undefined => {
  return SPECIALTY_CONFIGURATIONS[specialtyId];
};

export const getSpecialtyColor = (specialtyId: string): string => {
  const config = getSpecialtyConfig(specialtyId);
  return config?.color || '#6B7280'; // Default gray if not found
};

export const getSpecialtyIcon = (specialtyId: string): string => {
  const config = getSpecialtyConfig(specialtyId);
  return config?.icon || '🏥'; // Default stethoscope if not found
};

export const getSpecialtiesByPhase = (phase: SpecialtyConfig['phase']): SpecialtyConfig[] => {
  return Object.values(SPECIALTY_CONFIGURATIONS).filter(specialty => specialty.phase === phase);
};

export const getSpecialtiesByCategory = (category: SpecialtyConfig['category']): SpecialtyConfig[] => {
  return Object.values(SPECIALTY_CONFIGURATIONS).filter(specialty => specialty.category === category);
};

export const getAvailableSpecialties = (): SpecialtyConfig[] => {
  return Object.values(SPECIALTY_CONFIGURATIONS).filter(specialty =>
    specialty.phase === 'current' || specialty.phase === 'phase1' || specialty.phase === 'phase2'
  );
};

export const getDifficultyColor = (difficulty: SpecialtyConfig['difficulty']): string => {
  switch (difficulty) {
    case 'beginner':
      return '#10B981'; // Green
    case 'intermediate':
      return '#F59E0B'; // Yellow
    case 'advanced':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

export const getDifficultyLabel = (difficulty: SpecialtyConfig['difficulty']): string => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};