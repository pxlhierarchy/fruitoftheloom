import { loginUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Login the user
    const { user, token } = await loginUser({ email, password });

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Check if the error is due to invalid credentials
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    return res.status(500).json({ success: false, error: 'Error logging in' });
  }
} 