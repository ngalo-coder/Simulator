import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODcyNjFjZTIxYWNiODQ3ODE2ZTk1MTMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInByaW1hcnlSb2xlIjoic3R1ZGVudCIsImlhdCI6MTc1NjkxNjU0NSwiZXhwIjoxNzU3NTIxMzQ1fQ.xopVpd5XGjS4KWfcqmOdxfn0zvc32OpnGpbf_n_5dGk";
const JWT_SECRET = process.env.JWT_SECRET;

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded token with verification:', decoded);
} catch (error) {
  console.error('Error verifying token:', error);
}