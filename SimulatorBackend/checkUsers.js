import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/UserModel.js';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database:', mongoose.connection.name);

    const users = await User.find({}, 'username email primaryRole isActive').limit(5);
    console.log('Users in database:', users.length);
    users.forEach(u => console.log(`- ${u.username} (${u.email}) - ${u.primaryRole} - Active: ${u.isActive}`));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();