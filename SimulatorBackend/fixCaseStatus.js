import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from './src/models/CaseModel.js';

dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

async function fixCaseStatus() {
  await connectToDatabase();
  
  console.log('=== Fixing Case Status for Allied Health Cases ===\n');
  
  const alliedHealthSpecialties = ['Nursing', 'Laboratory', 'Pharmacy', 'Radiology', 'Ophthalmology'];
  
  let totalUpdated = 0;
  
  for (const specialty of alliedHealthSpecialties) {
    console.log(`Processing ${specialty} cases...`);
    
    // Update cases with this specialty to published status
    const result = await Case.updateMany(
      { 
        'case_metadata.specialty': specialty,
        status: { $ne: 'published' } // Only update if not already published
      },
      { 
        $set: { 
          status: 'published',
          publishedAt: new Date(),
          publishedBy: new mongoose.Types.ObjectId('000000000000000000000001') // Default admin user
        } 
      }
    );
    
    console.log(`  Updated ${result.modifiedCount} ${specialty} cases to published status`);
    totalUpdated += result.modifiedCount;
  }
  
  // Also update cases with no status (null or undefined)
  const nullStatusResult = await Case.updateMany(
    { 
      status: { $in: [null, undefined, ''] },
      'case_metadata.specialty': { $in: alliedHealthSpecialties }
    },
    { 
      $set: { 
        status: 'published',
        publishedAt: new Date(),
        publishedBy: new mongoose.Types.ObjectId('000000000000000000000001')
      } 
    }
  );
  
  console.log(`\nUpdated ${nullStatusResult.modifiedCount} cases with null status to published`);
  totalUpdated += nullStatusResult.modifiedCount;
  
  console.log(`\n=== Summary ===`);
  console.log(`Total cases updated to published status: ${totalUpdated}`);
  
  // Verify the changes
  const publishedCounts = await Case.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$case_metadata.specialty', count: { $sum: 1 } } }
  ]);
  
  console.log('\nPublished cases by specialty:');
  publishedCounts.forEach(({ _id, count }) => {
    console.log(`- ${_id}: ${count}`);
  });
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

fixCaseStatus().catch(console.error);