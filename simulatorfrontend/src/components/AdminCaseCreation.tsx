import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface Template {
  discipline: string;
  metadata: {
    name: string;
    description: string;
    icon: string;
    color: string;
    version: string;
  };
  template: any;
}

interface AdminCaseCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (caseId: string) => void;
}

const AdminCaseCreation: React.FC<AdminCaseCreationProps> = ({
  isOpen,
  onClose,
  onCaseCreated
}) => {
  const [step, setStep] = useState<'template' | 'form'>('template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'intermediate',
    estimatedDuration: 45,
    specialty: '',
    programArea: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      resetForm();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAdminCaseTemplates();
      setTemplates(response.templates || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      setError('Failed to load case templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('template');
    setSelectedTemplate(null);
    setFormData({
      title: '',
      description: '',
      difficulty: 'intermediate',
      estimatedDuration: 45,
      specialty: '',
      programArea: '',
    });
    setError(null);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Pre-populate form with template defaults
    setFormData(prev => ({
      ...prev,
      specialty: template.discipline,
      programArea: template.discipline === 'medicine' ? 'Internal Medicine' : 
                   template.discipline === 'nursing' ? 'Nursing' :
                   template.discipline === 'laboratory' ? 'Allied Health' :
                   template.discipline === 'radiology' ? 'Allied Health' :
                   template.discipline === 'pharmacy' ? 'Pharmacy' : template.discipline,
    }));
    setStep('form');
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate) {
      setError('Please select a template first');
      return;
    }

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const caseData = {
        discipline: selectedTemplate.discipline,
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        estimatedDuration: formData.estimatedDuration,
        specialty: formData.specialty || selectedTemplate.discipline,
        programArea: formData.programArea || selectedTemplate.discipline,
      };

      const response = await api.createAdminCase(caseData);
      
      if (response.success) {
        onCaseCreated(response.caseId);
        onClose();
      } else {
        setError(response.message || 'Failed to create case');
      }
    } catch (error: any) {
      console.error('Error creating case:', error);
      setError(error.message || 'Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'medicine': return '🩺';
      case 'nursing': return '💉';
      case 'laboratory': return '🧪';
      case 'radiology': return '📷';
      case 'pharmacy': return '💊';
      default: return '📋';
    }
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case 'medicine': return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'nursing': return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'laboratory': return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      case 'radiology': return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      case 'pharmacy': return 'bg-green-50 border-green-200 hover:bg-green-100';
      default: return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'template' ? 'Create New Case - Select Template' : 'Create New Case - Case Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {step === 'template' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Case Template</h3>
                <p className="text-gray-600">Choose a discipline-specific template to start creating your case.</p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-32 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.discipline}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${getDisciplineColor(template.discipline)}`}
                    >
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">{getDisciplineIcon(template.discipline)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{template.metadata.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{template.discipline}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{template.metadata.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'form' && selectedTemplate && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setStep('template')}
                  className="text-blue-600 hover:text-blue-800 text-sm mb-2"
                  disabled={loading}
                >
                  ← Back to template selection
                </button>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Case Details</h3>
                <p className="text-gray-600">
                  Creating case using <span className="font-medium">{selectedTemplate.metadata.name}</span> template
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Case Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter case title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => handleInputChange('specialty', e.target.value)}
                      placeholder="Enter specialty..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program Area</label>
                    <input
                      type="text"
                      value={formData.programArea}
                      onChange={(e) => handleInputChange('programArea', e.target.value)}
                      placeholder="Enter program area..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 45)}
                      min="5"
                      max="180"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter case description..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !formData.title.trim()}
                  >
                    {loading ? 'Creating...' : 'Create Case'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCaseCreation;