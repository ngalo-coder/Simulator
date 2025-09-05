import jwt from 'jsonwebtoken';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODcyNjFjZTIxYWNiODQ3ODE2ZTk1MTMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInByaW1hcnlSb2xlIjoic3R1ZGVudCIsImlhdCI6MTc1NjkxNjU0NSwiZXhwIjoxNzU3NTIxMzQ1fQ.xopVpd5XGjS4KWfcqmOdxfn0zvc32OpnGpbf_n_5dGk";

try {
  const decoded = jwt.decode(token);
  console.log('Decoded token payload:', decoded);
} catch (error) {
  console.error('Error decoding token:', error);
}