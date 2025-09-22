import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from './src/models/SpecialtyModel.js';

dotenv.config();

async function checkSpecialtyData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simulatech');
    console.log('Connected to MongoDB');

    // Get all specialties
    const specialties = await Specialty.find({}).select('name programArea programAreas isVisible');
    console.log('Current specialties in database:');
    console.log('=====================================');

    specialties.forEach(specialty => {
      console.log(`Name: ${specialty.name}`);
      console.log(`Program Area: ${specialty.programArea}`);
      console.log(`Program Areas: ${JSON.stringify(specialty.programAreas)}`);
      console.log(`Is Visible: ${specialty.isVisible}`);
      console.log('---');
    });

    console.log(`Total specialties: ${specialties.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkSpecialtyData();