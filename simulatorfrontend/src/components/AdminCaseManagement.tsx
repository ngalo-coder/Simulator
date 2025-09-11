import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface CaseData {
  _id: string;
  case_metadata: {
    case_id: string;
    title: string;
    specialty: string;
    program_area: string;
    difficulty: string;
    estimated_duration?: number;
    learning_objectives?: string[];
  };
  createdAt: string;
  updatedAt?: string;
}

interface CasesResponse {
  cases: CaseData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const AdminCaseManagement: React.FC = () => {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('');
  const [filterProgramArea, setFilterProgramArea] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchCases();
  }, [currentPage, filterSpecialty, filterProgramArea]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        page: currentPage,
        limit,
        ...(filterSpecialty && { specialty: filterSpecialty }),
        ...(filterProgramArea && { programArea: filterProgramArea })
      };
      
      const response: CasesResponse = await api.getAdminCases(filters);
      console.log('Admin cases response:', response);
      
      if (response.cases) {
        setCases(response.cases);
        if (response.pagination) {
          setTotalCases(response.pagination.total);
          setTotalPages(response.pagination.pages);
        }
      } else {
        setCases(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError('Failed to load cases. Please try again.');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.case_metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.case_metadata.case_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCaseAction = async (caseId: string, action: string) => {
    try {
      setError(null);
      
      if (action === 'delete') {
        if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
          await api.deleteAdminCase(caseId);
          setCases(prev => prev.filter(case_ => case_._id !== caseId));
          setTotalCases(prev => prev - 1);
        }
      } else if (action === 'view') {
        const case_ = cases.find(c => c._id === caseId);
        if (case_) {
          setSelectedCase(case_);
          setShowCaseDetails(true);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing case:`, error);
      setError(`Failed to ${action} case. Please try again.`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Case Management</h2>
          <p className="text-gray-600">Manage patient simulation cases</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Cases: {totalCases}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cases..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specialties</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Surgery">Surgery</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Area</label>
            <select
              value={filterProgramArea}
              onChange={(e) => setFilterProgramArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              <option value="Medicine">Medicine</option>
              <option value="Nursing">Nursing</option>
              <option value="Allied Health">Allied Health</option>
              <option value="Pharmacy">Pharmacy</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSpecialty('');
                setFilterProgramArea('');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Error Message */}
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                      {error}
                    </div>
                  </td>
                </tr>
              )}
              
              {filteredCases.map((case_) => (
                <tr key={case_._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{case_.case_metadata.title}</div>
                      <div className="text-sm text-gray-500">{case_.case_metadata.case_id}</div>
                      <div className="text-xs text-gray-400">
                        Created: {new Date(case_.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {case_.case_metadata.specialty}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {case_.case_metadata.program_area}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(case_.case_metadata.difficulty)}`}>
                      {case_.case_metadata.difficulty}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {case_.case_metadata.estimated_duration ? `${case_.case_metadata.estimated_duration} min` : 'N/A'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleCaseAction(case_._id, 'view')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    
                    <button
                      onClick={() => handleCaseAction(case_._id, 'delete')}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCases.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p>No cases found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-md">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span> ({totalCases} total cases)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {showCaseDetails && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Case Details</h3>
              <button
                onClick={() => setShowCaseDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Case ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedCase.case_metadata.case_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCase.case_metadata.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialty</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCase.case_metadata.specialty}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Program Area</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCase.case_metadata.program_area}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedCase.case_metadata.difficulty}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Duration</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCase.case_metadata.estimated_duration ? `${selectedCase.case_metadata.estimated_duration} minutes` : 'Not specified'}
                  </p>
                </div>
              </div>
              
              {selectedCase.case_metadata.learning_objectives && selectedCase.case_metadata.learning_objectives.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-1">
                      {selectedCase.case_metadata.learning_objectives.map((objective, index) => (
                        <li key={index} className="text-sm text-gray-700">{objective}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timestamps</label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(selectedCase.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedCase.updatedAt && (
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span>{new Date(selectedCase.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Database ID:</span>
                    <span className="font-mono text-xs">{selectedCase._id}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 space-x-3">
              <button
                onClick={() => setShowCaseDetails(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCaseManagement;