// Script to check if BLOB_READ_WRITE_TOKEN is set
console.log('=== BLOB TOKEN CHECK ===');
console.log('Checking for BLOB_READ_WRITE_TOKEN environment variable...');

const token = process.env.BLOB_READ_WRITE_TOKEN;

if (token) {
  console.log('✅ BLOB_READ_WRITE_TOKEN is set');
  console.log(`Token starts with: ${token.substring(0, 10)}...`);
} else {
  console.log('❌ BLOB_READ_WRITE_TOKEN is NOT set');
  console.log('\nTo fix this issue:');
  console.log('1. Go to the Vercel dashboard');
  console.log('2. Navigate to your project');
  console.log('3. Go to "Storage" tab');
  console.log('4. Create a new Blob store if you don\'t have one');
  console.log('5. Get the token from the Blob store settings');
  console.log('6. Add the token to your Vercel environment variables');
  console.log('   - Name: BLOB_READ_WRITE_TOKEN');
  console.log('   - Value: The token you got from the Blob store settings');
  console.log('7. Redeploy your application');
}

console.log('\n=== END OF CHECK ==='); 