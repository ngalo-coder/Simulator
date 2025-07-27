import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ServiceWakeup = ({ children }) => {
  const [wakingUp, setWakingUp] = useState(true);

  useEffect(() => {
    const wakeUpServices = async () => {
      try {
        console.log('🔄 Waking up services...');
        
        // Wake up gateway and user service
        const promises = [
          axios.get('https://ai-patient-sim-gateway.onrender.com/health', { timeout: 30000 }),
          axios.get('https://simulator-zpen.onrender.com/health', { timeout: 30000 })
        ];

        await Promise.all(promises);
        console.log('✅ Services are awake');
      } catch (error) {
        console.error('❌ Error waking up services:', error);
        // Continue anyway after timeout
      } finally {
        setWakingUp(false);
      }
    };

    wakeUpServices();
  }, []);

  if (wakingUp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Waking up services...</p>
          <p className="text-sm text-gray-500">This may take up to 30 seconds</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ServiceWakeup;