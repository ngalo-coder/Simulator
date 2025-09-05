import mongoose from 'mongoose';
import natural from 'natural';
import { createIndex, searchIndex } from '../utils/searchEngine.js';

/**
 * Resource Integration Service
 * Provides integrated medical reference database, clinical guidelines,
 * drug reference, and diagnostic materials with search capabilities
 */
class ResourceIntegrationService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.resourceTypes = {
      CLINICAL_GUIDELINE: 'clinical_guideline',
      DRUG_REFERENCE: 'drug_reference',
      DIAGNOSTIC_REFERENCE: 'diagnostic_reference',
      PROCEDURAL_GUIDE: 'procedural_guide',
      LEARNING_RESOURCE: 'learning_resource'
    };

    this.specialties = {
      MEDICINE: 'medicine',
      NURSING: 'nursing',
      LABORATORY: 'laboratory',
      RADIOLOGY: 'radiology',
      PHARMACY: 'pharmacy',
      GENERAL: 'general'
    };

    // Initialize search index
    this.searchIndex = {};
    this.initializeResources();
  }

  /**
   * Initialize resource database with sample data
   */
  async initializeResources() {
    try {
      // Sample clinical guidelines
      this.clinicalGuidelines = [
        {
          id: 'cg001',
          title: 'Hypertension Management Guidelines',
          description: 'Comprehensive guidelines for diagnosis and management of hypertension in adults',
          content: 'Blood pressure classification: Normal: <120/<80, Elevated: 120-129/<80, Stage 1: 130-139/80-89, Stage 2: ≥140/≥90. Treatment recommendations based on risk factors...',
          type: this.resourceTypes.CLINICAL_GUIDELINE,
          specialty: this.specialties.MEDICINE,
          tags: ['hypertension', 'blood pressure', 'cardiovascular', 'treatment'],
          source: 'American Heart Association',
          version: '2024',
          lastUpdated: new Date('2024-01-15')
        },
        {
          id: 'cg002',
          title: 'Diabetes Mellitus Type 2 Management',
          description: 'Evidence-based guidelines for type 2 diabetes management',
          content: 'Diagnostic criteria: Fasting glucose ≥126 mg/dL, HbA1c ≥6.5%. Treatment algorithm: Lifestyle modification first, then metformin, then combination therapy...',
          type: this.resourceTypes.CLINICAL_GUIDELINE,
          specialty: this.specialties.MEDICINE,
          tags: ['diabetes', 'endocrinology', 'glucose', 'treatment'],
          source: 'American Diabetes Association',
          version: '2024',
          lastUpdated: new Date('2024-02-20')
        }
      ];

      // Sample drug references
      this.drugReferences = [
        {
          id: 'dr001',
          title: 'Metformin Hydrochloride',
          description: 'Biguanide antihyperglycemic agent',
          content: 'Indications: Type 2 diabetes mellitus. Dosage: 500-1000mg twice daily. Contraindications: Renal impairment, metabolic acidosis. Side effects: GI upset, lactic acidosis (rare)...',
          type: this.resourceTypes.DRUG_REFERENCE,
          specialty: this.specialties.PHARMACY,
          tags: ['metformin', 'diabetes', 'antihyperglycemic', 'biguanide'],
          interactions: ['Contraindicated with contrast media', 'Increased risk of lactic acidosis with alcohol'],
          pregnancyCategory: 'B',
          lastUpdated: new Date('2024-03-10')
        },
        {
          id: 'dr002',
          title: 'Amoxicillin',
          description: 'Penicillin antibiotic',
          content: 'Indications: Bacterial infections including otitis media, pneumonia, skin infections. Dosage: 250-500mg three times daily. Contraindications: Penicillin allergy...',
          type: this.resourceTypes.DRUG_REFERENCE,
          specialty: this.specialties.PHARMACY,
          tags: ['amoxicillin', 'antibiotic', 'penicillin', 'infection'],
          interactions: ['Reduced efficacy with oral contraceptives', 'Increased risk of rash with allopurinol'],
          pregnancyCategory: 'B',
          lastUpdated: new Date('2024-03-15')
        }
      ];

      // Sample diagnostic references
      this.diagnosticReferences = [
        {
          id: 'diag001',
          title: 'Complete Blood Count Interpretation',
          description: 'Guide to interpreting CBC results',
          content: 'Normal ranges: WBC 4.5-11.0 x 10^9/L, Hgb 13.5-17.5 g/dL (M), 12.0-15.5 g/dL (F), Platelets 150-450 x 10^9/L. Abnormal patterns: Leukocytosis (infection), anemia (various causes)...',
          type: this.resourceTypes.DIAGNOSTIC_REFERENCE,
          specialty: this.specialties.LABORATORY,
          tags: ['cbc', 'hematology', 'blood test', 'interpretation'],
          normalRanges: {
            wbc: '4.5-11.0 x 10^9/L',
            hgb: '13.5-17.5 g/dL (M), 12.0-15.5 g/dL (F)',
            platelets: '150-450 x 10^9/L'
          },
          lastUpdated: new Date('2024-01-30')
        },
        {
          id: 'diag002',
          title: 'ECG Interpretation Guide',
          description: 'Comprehensive guide to electrocardiogram interpretation',
          content: 'Basic rhythm analysis: Rate, rhythm, axis, intervals. Common abnormalities: ST elevation (MI), prolonged QT, atrial fibrillation. Systematic approach: Rate, rhythm, axis, hypertrophy, ischemia...',
          type: this.resourceTypes.DIAGNOSTIC_REFERENCE,
          specialty: this.specialties.MEDICINE,
          tags: ['ecg', 'ekg', 'cardiology', 'interpretation'],
          normalValues: {
            prInterval: '120-200ms',
            qrsDuration: '<120ms',
            qtInterval: '<440ms'
          },
          lastUpdated: new Date('2024-02-15')
        }
      ];

      // Build search index
      await this.buildSearchIndex();
      
    } catch (error) {
      console.error('Resource initialization error:', error);
    }
  }

  /**
   * Build search index for all resources
   */
  async buildSearchIndex() {
    try {
      const allResources = [
        ...this.clinicalGuidelines,
        ...this.drugReferences,
        ...this.diagnosticReferences
      ];

      this.searchIndex = createIndex(allResources, ['title', 'description', 'content', 'tags']);
    } catch (error) {
      console.error('Build search index error:', error);
    }
  }

  /**
   * Search resources with advanced filtering
   * @param {string} query - Search query
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} - Search results
   */
  async searchResources(query, filters = {}) {
    try {
      const {
        type = null,
        specialty = null,
        tags = [],
        source = null,
        minDate = null,
        maxDate = null,
        page = 1,
        limit = 10
      } = filters;

      let allResources = [
        ...this.clinicalGuidelines,
        ...this.drugReferences,
        ...this.diagnosticReferences
      ];

      // Apply filters
      if (type) {
        allResources = allResources.filter(resource => resource.type === type);
      }

      if (specialty) {
        allResources = allResources.filter(resource => resource.specialty === specialty);
      }

      if (tags.length > 0) {
        allResources = allResources.filter(resource =>
          tags.some(tag => resource.tags.includes(tag))
        );
      }

      if (source) {
        allResources = allResources.filter(resource => resource.source === source);
      }

      if (minDate) {
        allResources = allResources.filter(resource => 
          new Date(resource.lastUpdated) >= new Date(minDate)
        );
      }

      if (maxDate) {
        allResources = allResources.filter(resource => 
          new Date(resource.lastUpdated) <= new Date(maxDate)
        );
      }

      // Perform search if query provided
      let results = allResources;
      if (query && query.trim()) {
        const searchResults = searchIndex(this.searchIndex, query, allResources);
        results = searchResults.map(result => result.item);
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = results.slice(startIndex, endIndex);

      return {
        results: paginatedResults,
        total: results.length,
        page,
        totalPages: Math.ceil(results.length / limit),
        filters: {
          query,
          ...filters
        }
      };
    } catch (error) {
      console.error('Search resources error:', error);
      throw error;
    }
  }

  /**
   * Get resource by ID
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} - Resource details
   */
  async getResourceById(resourceId) {
    try {
      const allResources = [
        ...this.clinicalGuidelines,
        ...this.drugReferences,
        ...this.diagnosticReferences
      ];

      const resource = allResources.find(r => r.id === resourceId);
      if (!resource) {
        throw new Error('Resource not found');
      }

      // Get related resources
      const relatedResources = this.findRelatedResources(resource);

      return {
        ...resource,
        relatedResources,
        usageStats: await this.getResourceUsageStats(resourceId)
      };
    } catch (error) {
      console.error('Get resource by ID error:', error);
      throw error;
    }
  }

  /**
   * Find related resources based on tags and specialty
   */
  findRelatedResources(resource, limit = 5) {
    const allResources = [
      ...this.clinicalGuidelines,
      ...this.drugReferences,
      ...this.diagnosticReferences
    ];

    return allResources
      .filter(r => r.id !== resource.id && r.specialty === resource.specialty)
      .filter(r => r.tags.some(tag => resource.tags.includes(tag)))
      .slice(0, limit);
  }

  /**
   * Get resource usage statistics
   */
  async getResourceUsageStats(resourceId) {
    // This would typically query usage analytics
    return {
      views: Math.floor(Math.random() * 1000),
      downloads: Math.floor(Math.random() * 500),
      averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      lastAccessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Check drug interactions
   * @param {Array} medications - List of medications
   * @returns {Promise<Array>} - Interaction warnings
   */
  async checkDrugInteractions(medications) {
    try {
      const interactions = [];
      const drugList = this.drugReferences;

      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          const drug1 = drugList.find(d => d.title.toLowerCase().includes(medications[i].toLowerCase()));
          const drug2 = drugList.find(d => d.title.toLowerCase().includes(medications[j].toLowerCase()));

          if (drug1 && drug2 && drug1.interactions) {
            drug1.interactions.forEach(interaction => {
              if (interaction.toLowerCase().includes(drug2.title.toLowerCase())) {
                interactions.push({
                  drugs: [drug1.title, drug2.title],
                  interaction: interaction,
                  severity: 'high',
                  recommendation: 'Consider alternative therapy or close monitoring'
                });
              }
            });
          }
        }
      }

      return interactions;
    } catch (error) {
      console.error('Check drug interactions error:', error);
      throw error;
    }
  }

  /**
   * Get clinical guidelines by specialty
   * @param {string} specialty - Medical specialty
   * @returns {Promise<Array>} - Clinical guidelines
   */
  async getClinicalGuidelines(specialty = null) {
    try {
      let guidelines = this.clinicalGuidelines;

      if (specialty) {
        guidelines = guidelines.filter(g => g.specialty === specialty);
      }

      return guidelines.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    } catch (error) {
      console.error('Get clinical guidelines error:', error);
      throw error;
    }
  }

  /**
   * Get drug reference by name
   * @param {string} drugName - Drug name
   * @returns {Promise<Object>} - Drug information
   */
  async getDrugReference(drugName) {
    try {
      const drug = this.drugReferences.find(d =>
        d.title.toLowerCase().includes(drugName.toLowerCase())
      );

      if (!drug) {
        throw new Error('Drug not found in reference');
      }

      return {
        ...drug,
        similarDrugs: this.findSimilarDrugs(drug)
      };
    } catch (error) {
      console.error('Get drug reference error:', error);
      throw error;
    }
  }

  /**
   * Find similar drugs based on tags and indications
   */
  findSimilarDrugs(drug, limit = 5) {
    return this.drugReferences
      .filter(d => d.id !== drug.id)
      .filter(d => d.tags.some(tag => drug.tags.includes(tag)))
      .slice(0, limit);
  }

  /**
   * Get diagnostic reference by test name
   * @param {string} testName - Diagnostic test name
   * @returns {Promise<Object>} - Diagnostic information
   */
  async getDiagnosticReference(testName) {
    try {
      const diagnostic = this.diagnosticReferences.find(d =>
        d.title.toLowerCase().includes(testName.toLowerCase()) ||
        d.tags.some(tag => tag.toLowerCase().includes(testName.toLowerCase()))
      );

      if (!diagnostic) {
        throw new Error('Diagnostic test not found in reference');
      }

      return {
        ...diagnostic,
        relatedTests: this.findRelatedDiagnostics(diagnostic)
      };
    } catch (error) {
      console.error('Get diagnostic reference error:', error);
      throw error;
    }
  }

  /**
   * Find related diagnostic tests
   */
  findRelatedDiagnostics(diagnostic, limit = 5) {
    return this.diagnosticReferences
      .filter(d => d.id !== diagnostic.id)
      .filter(d => d.specialty === diagnostic.specialty)
      .slice(0, limit);
  }

  /**
   * Add new resource to the database
   * @param {Object} resourceData - Resource data
   * @returns {Promise<Object>} - Created resource
   */
  async addResource(resourceData) {
    try {
      const newResource = {
        id: `res_${Date.now()}`,
        ...resourceData,
        lastUpdated: new Date(),
        createdAt: new Date()
      };

      // Add to appropriate collection based on type
      switch (resourceData.type) {
        case this.resourceTypes.CLINICAL_GUIDELINE:
          this.clinicalGuidelines.push(newResource);
          break;
        case this.resourceTypes.DRUG_REFERENCE:
          this.drugReferences.push(newResource);
          break;
        case this.resourceTypes.DIAGNOSTIC_REFERENCE:
          this.diagnosticReferences.push(newResource);
          break;
        default:
          throw new Error('Invalid resource type');
      }

      // Rebuild search index
      await this.buildSearchIndex();

      return newResource;
    } catch (error) {
      console.error('Add resource error:', error);
      throw error;
    }
  }

  /**
   * Update existing resource
   * @param {string} resourceId - Resource ID
   * @param {Object} updates - Resource updates
   * @returns {Promise<Object>} - Updated resource
   */
  async updateResource(resourceId, updates) {
    try {
      let resource;
      let collection;

      // Find resource in appropriate collection
      resource = this.clinicalGuidelines.find(r => r.id === resourceId);
      if (resource) collection = this.clinicalGuidelines;
      
      if (!resource) {
        resource = this.drugReferences.find(r => r.id === resourceId);
        if (resource) collection = this.drugReferences;
      }

      if (!resource) {
        resource = this.diagnosticReferences.find(r => r.id === resourceId);
        if (resource) collection = this.diagnosticReferences;
      }

      if (!resource) {
        throw new Error('Resource not found');
      }

      // Update resource
      Object.assign(resource, {
        ...updates,
        lastUpdated: new Date()
      });

      // Rebuild search index
      await this.buildSearchIndex();

      return resource;
    } catch (error) {
      console.error('Update resource error:', error);
      throw error;
    }
  }

  /**
   * Delete resource
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteResource(resourceId) {
    try {
      // Remove from appropriate collection
      this.clinicalGuidelines = this.clinicalGuidelines.filter(r => r.id !== resourceId);
      this.drugReferences = this.drugReferences.filter(r => r.id !== resourceId);
      this.diagnosticReferences = this.diagnosticReferences.filter(r => r.id !== resourceId);

      // Rebuild search index
      await this.buildSearchIndex();

      return { success: true, message: 'Resource deleted successfully' };
    } catch (error) {
      console.error('Delete resource error:', error);
      throw error;
    }
  }

  /**
   * Get resource statistics
   * @returns {Promise<Object>} - Resource statistics
   */
  async getResourceStatistics() {
    try {
      return {
        totalResources: this.clinicalGuidelines.length + this.drugReferences.length + this.diagnosticReferences.length,
        byType: {
          [this.resourceTypes.CLINICAL_GUIDELINE]: this.clinicalGuidelines.length,
          [this.resourceTypes.DRUG_REFERENCE]: this.drugReferences.length,
          [this.resourceTypes.DIAGNOSTIC_REFERENCE]: this.diagnosticReferences.length
        },
        bySpecialty: {
          [this.specialties.MEDICINE]: [
            ...this.clinicalGuidelines,
            ...this.drugReferences,
            ...this.diagnosticReferences
          ].filter(r => r.specialty === this.specialties.MEDICINE).length,
          [this.specialties.NURSING]: [
            ...this.clinicalGuidelines,
            ...this.drugReferences,
            ...this.diagnosticReferences
          ].filter(r => r.specialty === this.specialties.NURSING).length,
          [this.specialties.LABORATORY]: [
            ...this.clinicalGuidelines,
            ...this.drugReferences,
            ...this.diagnosticReferences
          ].filter(r => r.specialty === this.specialties.LABORATORY).length,
          [this.specialties.RADIOLOGY]: [
            ...this.clinicalGuidelines,
            ...this.drugReferences,
            ...this.diagnosticReferences
          ].filter(r => r.specialty === this.specialties.RADIOLOGY).length,
          [this.specialties.PHARMACY]: [
            ...this.clinicalGuidelines,
            ...this.drugReferences,
            ...this.diagnosticReferences
          ].filter(r => r.specialty === this.specialties.PHARMACY).length
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Get resource statistics error:', error);
      throw error;
    }
  }

  /**
   * Export resources for backup or integration
   * @param {string} format - Export format (json, csv)
   * @returns {Promise<string>} - Exported data
   */
  async exportResources(format = 'json') {
    try {
      const allResources = [
        ...this.clinicalGuidelines,
        ...this.drugReferences,
        ...this.diagnosticReferences
      ];

      if (format === 'json') {
        return JSON.stringify(allResources, null, 2);
      } else if (format === 'csv') {
        // Simple CSV conversion
        const headers = Object.keys(allResources[0]).join(',');
        const rows = allResources.map(resource =>
          Object.values(resource).map(value =>
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          ).join(',')
        );
        return [headers, ...rows].join('\n');
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Export resources error:', error);
      throw error;
    }
  }

  /**
   * Import resources from external source
   * @param {Array} resources - Resources to import
   * @param {string} type - Resource type
   * @returns {Promise<Object>} - Import result
   */
  async importResources(resources, type) {
    try {
      if (!Object.values(this.resourceTypes).includes(type)) {
        throw new Error('Invalid resource type for import');
      }

      const validResources = resources.filter(resource =>
        resource.title && resource.description && resource.content
      );

      switch (type) {
        case this.resourceTypes.CLINICAL_GUIDELINE:
          this.clinicalGuidelines.push(...validResources);
          break;
        case this.resourceTypes.DRUG_REFERENCE:
          this.drugReferences.push(...validResources);
          break;
        case this.resourceTypes.DIAGNOSTIC_REFERENCE:
          this.diagnosticReferences.push(...validResources);
          break;
      }

      // Rebuild search index
      await this.buildSearchIndex();

      return {
        success: true,
        imported: validResources.length,
        skipped: resources.length - validResources.length,
        message: 'Resources imported successfully'
      };
    } catch (error) {
      console.error('Import resources error:', error);
      throw error;
    }
  }

  /**
   * Validate resource data
   */
  validateResource(resource) {
    const requiredFields = ['title', 'description', 'content', 'type', 'specialty'];
    const missingFields = requiredFields.filter(field => !resource[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!Object.values(this.resourceTypes).includes(resource.type)) {
      throw new Error('Invalid resource type');
    }

    if (!Object.values(this.specialties).includes(resource.specialty)) {
      throw new Error('Invalid specialty');
    }

    return true;
  }
}

export default new ResourceIntegrationService();