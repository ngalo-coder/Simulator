import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Mongoose connected to:', mongoose.connection.db.databaseName);
    
    // Check what collections exist in mongoose
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in mongoose database:', collections.map(c => c.name));
    
    // Check the cases collection via mongoose
    const Case = (await import('./src/models/CaseModel.js')).default;
    const mongooseCases = await Case.find().limit(5).select('case_metadata.case_id case_metadata.specialty').lean();
    console.log('First 5 cases via mongoose:', mongooseCases);
    
    // Check distinct specialties via mongoose
    const mongooseSpecialties = await Case.distinct('case_metadata.specialty');
    console.log('Mongoose distinct specialties:', mongooseSpecialties.sort());
    
    // Compare with direct MongoDB query
    const directSpecialties = await mongoose.connection.db.collection('cases').distinct('case_metadata.specialty');
    console.log('Direct distinct specialties:', directSpecialties.sort());
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
})();