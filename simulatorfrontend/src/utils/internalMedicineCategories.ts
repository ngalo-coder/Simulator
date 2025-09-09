/**
 * Internal Medicine sub-specialty categories based on content analysis
 * These categories are used to organize Internal Medicine cases for better navigation
 */

export interface InternalMedicineSubCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const INTERNAL_MEDICINE_SUB_CATEGORIES: InternalMedicineSubCategory[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    description: 'Heart and cardiovascular system disorders',
    keywords: ['chest pain', 'heart failure', 'myocardial infarction', 'hypertension', 'arrhythmia', 'ECG', 'echocardiogram'],
    difficulty: 'Intermediate'
  },
  {
    id: 'pulmonology',
    name: 'Pulmonology',
    description: 'Respiratory system and lung disorders',
    keywords: ['shortness of breath', 'COPD', 'asthma', 'pneumonia', 'lung cancer', 'chest X-ray', 'spirometry'],
    difficulty: 'Intermediate'
  },
  {
    id: 'gastroenterology',
    name: 'Gastroenterology',
    description: 'Digestive system disorders',
    keywords: ['abdominal pain', 'GI bleed', 'hepatitis', 'cirrhosis', 'IBD', 'endoscopy', 'colonoscopy'],
    difficulty: 'Intermediate'
  },
  {
    id: 'nephrology',
    name: 'Nephrology',
    description: 'Kidney and urinary system disorders',
    keywords: ['renal failure', 'kidney disease', 'dialysis', 'electrolyte imbalance', 'urinalysis', 'creatinine'],
    difficulty: 'Advanced'
  },
  {
    id: 'endocrinology',
    name: 'Endocrinology',
    description: 'Hormonal and metabolic disorders',
    keywords: ['diabetes', 'thyroid', 'obesity', 'metabolic syndrome', 'hormones', 'insulin', 'glucose'],
    difficulty: 'Intermediate'
  },
  {
    id: 'hematology',
    name: 'Hematology',
    description: 'Blood disorders and malignancies',
    keywords: ['anemia', 'leukemia', 'lymphoma', 'coagulation', 'transfusion', 'blood count', 'bone marrow'],
    difficulty: 'Advanced'
  },
  {
    id: 'infectious_disease',
    name: 'Infectious Disease',
    description: 'Infections and communicable diseases',
    keywords: ['fever', 'infection', 'antibiotics', 'sepsis', 'HIV', 'tuberculosis', 'vaccination'],
    difficulty: 'Intermediate'
  },
  {
    id: 'rheumatology',
    name: 'Rheumatology',
    description: 'Autoimmune and musculoskeletal disorders',
    keywords: ['arthritis', 'lupus', 'inflammation', 'joint pain', 'autoimmune', 'rheumatoid', 'osteoporosis'],
    difficulty: 'Advanced'
  },
  {
    id: 'neurology',
    name: 'Neurology',
    description: 'Nervous system disorders',
    keywords: ['headache', 'stroke', 'seizure', 'dementia', 'neuropathy', 'MRI', 'CT scan'],
    difficulty: 'Advanced'
  },
  {
    id: 'general_internal_medicine',
    name: 'General Internal Medicine',
    description: 'Common internal medicine presentations and multi-system issues',
    keywords: ['general medicine', 'primary care', 'multiple complaints', 'chronic disease', 'preventive care', 'screening'],
    difficulty: 'Beginner'
  },
  {
    id: 'geriatrics',
    name: 'Geriatrics',
    description: 'Healthcare for elderly patients',
    keywords: ['elderly', 'aging', 'polypharmacy', 'falls', 'dementia', 'functional decline', 'palliative care'],
    difficulty: 'Intermediate'
  }
];

/**
 * Get sub-category by ID
 */
export const getSubCategoryById = (id: string): InternalMedicineSubCategory | undefined => {
  return INTERNAL_MEDICINE_SUB_CATEGORIES.find(cat => cat.id === id);
};

/**
 * Get sub-category by name
 */
export const getSubCategoryByName = (name: string): InternalMedicineSubCategory | undefined => {
  return INTERNAL_MEDICINE_SUB_CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};

/**
 * Check if a case belongs to a specific sub-category based on content analysis
 */
export const categorizeCase = (
  caseData: { title?: string; description?: string; chief_complaint?: string; tags?: string[] }
): string[] => {
  const categories: string[] = [];
  const content = `${caseData.title || ''} ${caseData.description || ''} ${caseData.chief_complaint || ''} ${caseData.tags?.join(' ') || ''}`.toLowerCase();

  INTERNAL_MEDICINE_SUB_CATEGORIES.forEach(category => {
    const hasKeyword = category.keywords.some(keyword => 
      content.includes(keyword.toLowerCase())
    );
    if (hasKeyword) {
      categories.push(category.id);
    }
  });

  // If no specific category found, assign to general internal medicine
  if (categories.length === 0) {
    categories.push('general_internal_medicine');
  }

  return categories;
};

/**
 * Get all sub-category IDs
 */
export const getAllSubCategoryIds = (): string[] => {
  return INTERNAL_MEDICINE_SUB_CATEGORIES.map(cat => cat.id);
};

/**
 * Get sub-categories with case counts
 */
export interface SubCategoryWithCount {
  id: string;
  name: string;
  description: string;
  count: number;
  difficulty?: string;
}

export const getSubCategoriesWithCounts = (cases: any[]): SubCategoryWithCount[] => {
  const counts: Record<string, number> = {};
  
  // Initialize all categories with 0 count
  INTERNAL_MEDICINE_SUB_CATEGORIES.forEach(cat => {
    counts[cat.id] = 0;
  });

  // Count cases in each category
  cases.forEach(case_ => {
    const categories = categorizeCase(case_);
    categories.forEach(catId => {
      if (counts[catId] !== undefined) {
        counts[catId]++;
      }
    });
  });

  return INTERNAL_MEDICINE_SUB_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    count: counts[cat.id],
    difficulty: cat.difficulty
  }));
};