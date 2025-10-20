import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SimulationPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to browse-cases page since cases are now rendered there
    // Use replace to avoid adding this redirect to browser history
    navigate('/browse-cases', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-stable-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto"></div>
          <div className="absolute inset-0 animate-pulse">
            <div className="rounded-full h-12 w-12 bg-blue-50 mx-auto opacity-75"></div>
          </div>
        </div>
        <p className="text-gray-600 mt-4 text-lg">Redirecting to case browser...</p>
        <p className="text-gray-500 mt-2 text-sm">Loading available cases and specialties</p>
      </div>
    </div>
  );
};

export default SimulationPage;
