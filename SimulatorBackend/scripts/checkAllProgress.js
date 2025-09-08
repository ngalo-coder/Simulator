import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkAllProgress() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simulator');
        console.log('Connected to MongoDB');

        // Check StudentProgress
        const StudentProgress = (await import('../src/models/StudentProgressModel.js')).default;
        const studentRecords = await StudentProgress.find({}).populate('userId', 'username email');
        console.log('\n=== StudentProgress Records ===');
        console.log('Total records:', studentRecords.length);
        studentRecords.forEach(record => {
            console.log(`User: ${record.userId?.username || record.userId}, Case Attempts: ${record.caseAttempts?.length || 0}, Overall Score: ${record.overallProgress?.overallScore || 0}`);
        });

        // Check ClinicianProgress
        const ClinicianProgress = (await import('../src/models/ClinicianProgressModel.js')).default;
        const clinicianRecords = await ClinicianProgress.find({}).populate('userId', 'username email');
        console.log('\n=== ClinicianProgress Records ===');
        console.log('Total records:', clinicianRecords.length);
        clinicianRecords.forEach(record => {
            console.log(`User: ${record.userId?.username || record.userId}, Total Cases: ${record.totalCasesCompleted || 0}, Level: ${record.currentProgressionLevel || 'N/A'}`);
        });

        // Check all users to see who might be missing progress records
        const User = (await import('../src/models/UserModel.js')).default;
        const allUsers = await User.find({}, 'username email _id');
        console.log('\n=== All Users ===');
        console.log('Total users:', allUsers.length);
        
        const usersWithStudentProgress = new Set(studentRecords.map(r => r.userId?.toString()));
        const usersWithClinicianProgress = new Set(clinicianRecords.map(r => r.userId?.toString()));
        
        console.log('\n=== Users Missing Progress Records ===');
        allUsers.forEach(user => {
            const hasStudent = usersWithStudentProgress.has(user._id.toString());
            const hasClinician = usersWithClinicianProgress.has(user._id.toString());
            if (!hasStudent || !hasClinician) {
                console.log(`User: ${user.username} (${user.email}) - StudentProgress: ${hasStudent}, ClinicianProgress: ${hasClinician}`);
            }
        });

        await mongoose.connection.close();
        console.log('\nDatabase check completed');
    } catch (error) {
        console.error('Error checking progress:', error);
        process.exit(1);
    }
}

checkAllProgress();