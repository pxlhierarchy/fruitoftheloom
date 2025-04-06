import { verify } from 'jsonwebtoken';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get token from cookie
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Find user
    const user = await db.collection('users').findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
} 