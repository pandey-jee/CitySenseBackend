require('dotenv').config();
const { auth, db } = require('./services/firebase');

async function deleteAdminUser(email) {
  try {
    console.log('🔍 Finding user with email:', email);
    
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ Found user:', userRecord.uid);

    // Delete from Firestore first
    await db.collection('users').doc(userRecord.uid).delete();
    console.log('✅ Deleted user profile from Firestore');

    // Delete from Firebase Auth
    await auth.deleteUser(userRecord.uid);
    console.log('✅ Deleted user from Firebase Auth');

    console.log('\n🎉 Admin user deleted successfully!');
    console.log('📧 Deleted Email:', email);
    console.log('🆔 Deleted UID:', userRecord.uid);

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('ℹ️ User not found - may already be deleted');
    } else {
      console.error('❌ Error deleting admin user:', error);
    }
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node delete-admin.js <email>');
  process.exit(1);
}

deleteAdminUser(email)
  .then(() => {
    console.log('✨ Admin deletion completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to delete admin:', error);
    process.exit(1);
  });
