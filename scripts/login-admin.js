const fetch = require('node-fetch');

async function loginAdmin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'noventa16@hotmail.com',
        password: '1307989kE!'
      }),
    });

    const data = await response.json();
    console.log('Response:', data);

    if (data.success) {
      console.log('Admin login successful!');
      console.log('Token:', data.data.token);
    } else {
      console.error('Failed to login:', data.error);
    }
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

loginAdmin(); 