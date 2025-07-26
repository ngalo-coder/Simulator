const { MongoClient } = require('mongodb');

// Base connection string
const baseUri = 'mongodb+srv://otieno:w4irLT91dEJToxA2@cluster0.pw9g31t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Databases to create
const dbNames = [
  'ai_patient_sim_users',
  'ai_patient_sim_simulation',
  'ai_patient_sim_clinical',
  'ai_patient_sim_cases',
  'ai_patient_sim_analytics'
];

// Connect and create databases
(async () => {
  const client = new MongoClient(baseUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();

    for (const dbName of dbNames) {
      const db = client.db(dbName);
      const collection = db.collection('init');
      await collection.insertOne({ initialized: true });
      const dbUri = baseUri.replace('/?', `/${dbName}?`);
      console.log(`✅ Created and initialized: ${dbName}`);
      console.log(`🔗 Connection URI: ${dbUri}\n`);
    }

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
  } finally {
    await client.close();
  }
})();
