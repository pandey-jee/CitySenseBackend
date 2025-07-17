require('dotenv').config();
const { auth, db } = require('./services/firebase');

async function createAdminUser(email, password, displayName) {
  try {
    console.log('🔧 Creating admin user...');
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });

    console.log('✅ User created in Firebase Auth:', userRecord.uid);

    // Add user to Firestore with admin role
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: 'admin',
      createdAt: new Date().toISOString(),
      issuesReported: 0,
      issuesUpvoted: 0,
      isActive: true,
      lastLogin: new Date().toISOString()
    });

    console.log('✅ User profile created in Firestore with admin role');

    // Set custom claims for admin access
    await auth.setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin'
    });

    console.log('✅ Admin custom claims set');

    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Display Name:', displayName);
    console.log('🆔 UID:', userRecord.uid);
    console.log('\n🚀 You can now login to the admin dashboard at: http://localhost:5174/dashboard');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('\n🔄 Email already exists. Updating existing user to admin...');
      try {
        const existingUser = await auth.getUserByEmail(email);
        
        // Update Firestore document
        await db.collection('users').doc(existingUser.uid).update({
          role: 'admin',
          displayName: displayName,
          updatedAt: new Date().toISOString()
        });

        // Set custom claims
        await auth.setCustomUserClaims(existingUser.uid, {
          admin: true,
          role: 'admin'
        });

        console.log('✅ Existing user updated to admin role');
        console.log('🆔 UID:', existingUser.uid);
      } catch (updateError) {
        console.error('❌ Error updating existing user:', updateError);
      }
    }
  }
}

// Command line usage
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node create-admin.js <email> <password> <displayName>');
  console.log('Example: node create-admin.js admin@citysense.com admin123 "Admin User"');
  process.exit(1);
}

const [email, password, displayName] = args;

createAdminUser(email, password, displayName).then(() => {
  console.log('\n✨ Admin user creation completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Failed to create admin user:', error);
  process.exit(1);
});
