import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './src/models/UserModel.js';
import { verifyToken } from './src/services/authService.js';

dotenv.config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODcyNjFjZTIxYWNiODQ3ODE2ZTk1MTMiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInByaW1hcnlSb2xlIjoic3R1ZGVudCIsImlhdCI6MTc1NjkxNjU0NSwiZXhwIjoxNzU3NTIxMzQ1fQ.xopVpd5XGjS4KWfcqmOdxfn0zvc32OpnGpbf_n_5dGk";

async function testMiddleware() {
  try {
    console.log('Testing token verification...');
    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);

    if (!decoded) {
      console.log('Token verification failed');
      return;
    }

    console.log('Looking up user with ID:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user) {
      console.log('User found:', user);
    } else {
      console.log('User not found with ID:', decoded.userId);
    }
  } catch (error) {
    console.error('Error in testMiddleware:', error);
  }
}

testMiddleware();