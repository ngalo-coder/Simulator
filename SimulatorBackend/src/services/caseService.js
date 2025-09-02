import Case from '../models/CaseModel.js';

export class CaseService {
  static CASE_FIELDS = [
    'case_metadata.case_id',
    'case_metadata.title',
    'description',
    // 'case_metadata.difficulty', // Removed from API response but kept in DB for background grading
    // 'case_metadata.estimated_duration_min', // Removed from API response - duration is given in case data
    'case_metadata.program_area',
    'case_metadata.specialized_area',
    'patient_persona.age',
    'patient_persona.gender',
    'patient_persona.chief_complaint',
    'clinical_dossier.history_of_presenting_illness.associated_symptoms',
    'case_metadata.tags'
  ].join(' ');

  static DIAGNOSIS_TRIGGERS = [
    'heart attack',
    'myocardial infarction',
    'emergency',
    'admit',
    'admitted',
    'treatment',
    'ward',
    'emergency care'
  ];

  static buildQuery(filters) {
    const { program_area, specialty, specialized_area } = filters;
    const query = {};

    if (program_area) query['case_metadata.program_area'] = program_area;
    if (specialty) query['case_metadata.specialty'] = specialty;
    
    if (specialized_area) {
      query['case_metadata.specialized_area'] = ["null", "None", ""].includes(specialized_area)
        ? { $in: [null, ""] }
        : specialized_area;
    }

    return query;
  }

  static formatCase(caseData) {
    const { case_metadata: meta, patient_persona: patient, clinical_dossier: clinical } = caseData;
    
    return {
      id: meta?.case_id,
      title: meta?.title?.replace(/ with.*$/, ''),
      description: caseData.description,
      category: meta?.specialized_area,
      // estimated_time removed - duration is provided within case data
      program_area: meta?.program_area,
      specialized_area: meta?.specialized_area,
      patient_age: patient?.age,
      patient_gender: patient?.gender,
      chief_complaint: patient?.chief_complaint,
      presenting_symptoms: clinical?.history_of_presenting_illness?.associated_symptoms || [],
      tags: meta?.tags || []
    };
  }

  static async getCases(queryParams) {
    const { page = 1, limit = 20 } = queryParams;
    const query = this.buildQuery(queryParams);
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [casesFromDB, totalCases] = await Promise.all([
      Case.find(query).select(this.CASE_FIELDS).skip(skip).limit(limitNum).lean(),
      Case.countDocuments(query)
    ]);

    return {
      cases: casesFromDB.map(this.formatCase),
      currentPage: pageNum,
      totalPages: Math.ceil(totalCases / limitNum),
      totalCases
    };
  }

  static async getCaseCategories(program_area) {
    const baseQuery = program_area ? { 'case_metadata.program_area': program_area } : {};
    
    const [programAreas, specialties, specializedAreas] = await Promise.all([
      Case.distinct('case_metadata.program_area'),
      Case.distinct('case_metadata.specialty', baseQuery),
      Case.distinct('case_metadata.specialized_area')
    ]);

    // Get case counts for each specialty when program_area is specified
    let specialty_counts = {};
    if (program_area && specialties.length > 0) {
      const countPromises = specialties
        .filter(s => s?.trim())
        .map(async (specialty) => {
          const count = await Case.countDocuments({
            'case_metadata.program_area': program_area,
            'case_metadata.specialty': specialty
          });
          return { specialty, count };
        });
      
      const counts = await Promise.all(countPromises);
      specialty_counts = counts.reduce((acc, { specialty, count }) => {
        acc[specialty] = count;
        return acc;
      }, {});
    }

    return {
      program_areas: programAreas.sort(),
      specialties: specialties.filter(s => s?.trim()).sort(),
      specialized_areas: specializedAreas.filter(a => a?.trim()).sort(),
      specialty_counts
    };
  }

  static shouldEndSession(question) {
    return this.DIAGNOSIS_TRIGGERS.some(trigger => 
      question.toLowerCase().includes(trigger)
    );
  }
}

export default CaseService;