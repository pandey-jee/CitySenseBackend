require('dotenv').config();
const { db } = require('./services/firebase');

async function testDatabaseConnection() {
  console.log('🔍 Testing Firebase Firestore connection...');
  
  try {
    // Test 1: Try to read from a collection (this will create it if it doesn't exist)
    const testRef = db.collection('health-check');
    const snapshot = await testRef.limit(1).get();
    console.log('✅ Successfully connected to Firestore!');
    console.log(`📊 Health check collection has ${snapshot.size} documents`);
    
    // Test 2: Try to write a test document
    const testDoc = await testRef.add({
      timestamp: new Date(),
      status: 'connection_test',
      message: 'Database connection successful'
    });
    console.log(`✅ Successfully wrote test document with ID: ${testDoc.id}`);
    
    // Test 3: Try to read the document we just wrote
    const docSnapshot = await testDoc.get();
    if (docSnapshot.exists) {
      console.log('✅ Successfully read back the test document');
      console.log('📄 Document data:', docSnapshot.data());
    }
    
    // Test 4: Clean up - delete the test document
    await testDoc.delete();
    console.log('🧹 Test document cleaned up');
    
    console.log('🎉 All database tests passed! Firebase Firestore is properly connected.');
    
    // Test Firebase Auth connection
    console.log('\n🔍 Testing Firebase Auth connection...');
    const { auth } = require('./services/firebase');
    
    // Try to list users (this will work even if there are no users)
    const listUsersResult = await auth.listUsers(1);
    console.log('✅ Successfully connected to Firebase Auth!');
    console.log(`👥 Found ${listUsersResult.users.length} users in Auth`);
    
    console.log('\n🎉 All Firebase services are properly connected!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error('Error details:', error.message);
    console.error('Full error:', error);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    // Check specific error types
    if (error.message.includes('private_key')) {
      console.error('🔑 Issue with private key format. Check FIREBASE_PRIVATE_KEY in .env file');
    }
    if (error.message.includes('project_id')) {
      console.error('🏗️ Issue with project ID. Check FIREBASE_PROJECT_ID in .env file');
    }
    if (error.message.includes('client_email')) {
      console.error('📧 Issue with client email. Check FIREBASE_CLIENT_EMAIL in .env file');
    }
  }
}

// Run the test
testDatabaseConnection().then(() => {
  console.log('\n🏁 Database connection test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unexpected error during database test:', error);
  process.exit(1);
});
