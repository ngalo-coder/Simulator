import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';

interface Specialty {
  id: string;
  name: string;
  programArea: string;
  active: boolean;
  casesCount: number;
}


const AdminSpecialtyManagement: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramArea, setFilterProgramArea] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, active, inactive
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getAdminSpecialtiesWithCounts();
      console.log('Admin specialties response:', response);

      // Handle the API response structure: {data: {specialties: [...]}, message: "Success"}
      if (response.data && response.data.specialties) {
        setSpecialties(response.data.specialties);
      } else if (response.specialties) {
        // Fallback for direct specialties property
        setSpecialties(response.specialties);
      } else {
        setSpecialties([]);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      setError('Failed to load specialties. Please try again.');
      setSpecialties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (specialtyId: string, specialtyName: string) => {
    try {
      setToggling(prev => new Set(prev).add(specialtyId));
      setError(null);
      
      const response = await api.toggleSpecialtyVisibility(specialtyId);

      // Update the specialty in the list (optimistically update UI)
      setSpecialties(prev =>
        prev.map(specialty =>
          specialty.id === specialtyId
            ? { ...specialty, active: !specialty.active }
            : specialty
        )
      );

      // Handle API response structure: {data: {specialty: {...}}, message: "Success"}
      let updatedSpecialty = null;
      if (response.data && response.data.specialty) {
        updatedSpecialty = response.data.specialty;
      } else if (response.specialty) {
        updatedSpecialty = response.specialty;
      }

      // Show success message briefly
      const action = updatedSpecialty?.active ? 'shown to' : 'hidden from';
      console.log(`Specialty "${specialtyName}" is now ${action} users`);
      
    } catch (error) {
      console.error('Error toggling specialty visibility:', error);
      setError(`Failed to update visibility for ${specialtyName}. Please try again.`);
    } finally {
      setToggling(prev => {
        const newSet = new Set(prev);
        newSet.delete(specialtyId);
        return newSet;
      });
    }
  };

  const filteredSpecialties = specialties.filter(specialty => {
    const matchesSearch = specialty.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgramArea = !filterProgramArea || specialty.programArea === filterProgramArea;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && specialty.active) ||
                         (filterStatus === 'inactive' && !specialty.active);
    
    return matchesSearch && matchesProgramArea && matchesStatus;
  });

  const uniqueProgramAreas = [...new Set(specialties.map(s => s.programArea))].sort();

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        ✓ Visible to Users
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        ✕ Hidden from Users
      </span>
    );
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
          <h2 className="text-2xl font-bold text-gray-900">Specialty Visibility Management</h2>
          <p className="text-gray-600">Control which specialties are visible to users</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Specialties: {specialties.length} ({specialties.filter(s => s.active).length} visible, {specialties.filter(s => !s.active).length} hidden)
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search specialties..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Area</label>
            <select
              value={filterProgramArea}
              onChange={(e) => setFilterProgramArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Program Areas</option>
              {uniqueProgramAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Specialties</option>
              <option value="active">Visible Only</option>
              <option value="inactive">Hidden Only</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterProgramArea('');
                setFilterStatus('all');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Specialties Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cases Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSpecialties.map((specialty) => (
                <tr key={specialty.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{specialty.name}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {specialty.programArea}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {specialty.casesCount} case{specialty.casesCount !== 1 ? 's' : ''}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(specialty.active)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleVisibility(specialty.id, specialty.name)}
                      disabled={toggling.has(specialty.id)}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        specialty.active
                          ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                          : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                      } ${
                        toggling.has(specialty.id) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {toggling.has(specialty.id) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                          Updating...
                        </>
                      ) : specialty.active ? (
                        <>
                          <span className="mr-1">👁️‍🗨️</span>
                          Hide from Users
                        </>
                      ) : (
                        <>
                          <span className="mr-1">👁️</span>
                          Show to Users
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSpecialties.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p>No specialties found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">👁️</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">
                {specialties.filter(s => s.active).length}
              </div>
              <div className="text-sm text-green-700 font-medium">Visible Specialties</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚫</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">
                {specialties.filter(s => !s.active).length}
              </div>
              <div className="text-sm text-red-700 font-medium">Hidden Specialties</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">
                {specialties.reduce((sum, s) => sum + s.casesCount, 0)}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total Cases</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSpecialtyManagement;