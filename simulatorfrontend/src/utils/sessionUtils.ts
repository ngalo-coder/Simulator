// Session management utilities

export const getTokenExpiry = (): number | null => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  
  return Date.now() >= expiry;
};

export const getTimeUntilExpiry = (): number => {
  const expiry = getTokenExpiry();
  if (!expiry) return 0;
  
  const timeLeft = expiry - Date.now();
  return Math.max(0, Math.floor(timeLeft / 60000)); // Return minutes
};

export const shouldShowSessionWarning = (): boolean => {
  const timeLeft = getTimeUntilExpiry();
  return timeLeft <= 5 && timeLeft > 0; // Show warning in last 5 minutes
};

export const formatTimeLeft = (minutes: number): string => {
  if (minutes <= 0) return 'expired';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
};