import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Case, ApiError, CaseSearchParams } from '../types';
import { CaseCard } from '../components/Dashboard/CaseCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CaseBrowsingPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<CaseSearchParams>({
    q: '',
    specialty: '',
    difficulty: undefined,
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const data = await api.getStudentCases(searchParams);
        setCases(data.cases);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({ ...prev, q: e.target.value, page: 1 }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Browse Cases</h1>

      {/* Search and Filters */}
      <div className="md:flex space-y-4 md:space-y-0 md:space-x-4">
        <input
          type="text"
          placeholder="Search cases..."
          value={searchParams.q}
          onChange={handleSearchChange}
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg"
        />
        <select
          name="specialty"
          value={searchParams.specialty}
          onChange={handleFilterChange}
          className="w-full md:w-1/4 px-4 py-2 border rounded-lg"
        >
          <option value="">All Specialties</option>
          {/* Add specialty options here */}
        </select>
        <select
          name="difficulty"
          value={searchParams.difficulty}
          onChange={handleFilterChange}
          className="w-full md:w-1/4 px-4 py-2 border rounded-lg"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Case Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => (
          <CaseCard key={caseItem._id} caseItem={caseItem} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-4 py-2 rounded-lg ${searchParams.page === page ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CaseBrowsingPage;