// Script to create an admin account
const fetch = require('node-fetch');

async function createAdminAccount() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'noventa16@hotmail.com',
        password: '1307989kE!',
        role: 'admin'
      }),
    });

    const data = await response.json();
    console.log('Response:', data);

    if (data.success) {
      console.log('Admin account created successfully!');
    } else {
      console.error('Failed to create admin account:', data.error);
    }
  } catch (error) {
    console.error('Error creating admin account:', error);
  }
}

createAdminAccount(); 