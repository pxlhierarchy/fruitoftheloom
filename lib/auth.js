import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';

if (!process.env.JWT_SECRET) {
  throw new Error('Please add your JWT secret to .env.local');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

/**
 * Generate a JWT token for a user
 * @param {Object} user - The user object
 * @returns {string} - The JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} - The decoded token or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash a password
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with a hash
 * @param {string} password - The password to compare
 * @param {string} hash - The hash to compare against
 * @returns {Promise<boolean>} - Whether the password matches the hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user
 * @param {Object} userData - The user data
 * @returns {Promise<Object>} - The created user
 */
export async function registerUser(userData) {
  const { email, password, role = 'user' } = userData;
  
  // Connect to the database
  const { db } = await connectToDatabase();
  
  // Check if user already exists
  const existingUser = await db.collection('users').findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash the password
  const hashedPassword = await hashPassword(password);
  
  // Create the user
  const result = await db.collection('users').insertOne({
    email,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  });
  
  // Get the created user
  const user = await db.collection('users').findOne({ _id: result.insertedId });
  
  // Remove the password from the user object
  const { password: _, ...userWithoutPassword } = user;
  
  return userWithoutPassword;
}

/**
 * Login a user
 * @param {Object} credentials - The login credentials
 * @returns {Promise<Object>} - The user and token
 */
export async function loginUser(credentials) {
  const { email, password } = credentials;
  
  // Connect to the database
  const { db } = await connectToDatabase();
  
  // Find the user
  const user = await db.collection('users').findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Check the password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate a token
  const token = generateToken(user);
  
  // Remove the password from the user object
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token,
  };
}

/**
 * Middleware to require a specific role
 * @param {string} role - The required role
 * @returns {Function} - The middleware function
 */
export function requireRole(role) {
  return (handler) => async (req, res) => {
    try {
      // Get the token from the Authorization header
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      
      // Verify the token
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
      
      // Check if the user has the required role
      if (decoded.role !== role) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
      }
      
      // Add the user to the request
      req.user = decoded;
      
      // Call the handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ success: false, error: 'Authentication error' });
    }
  };
} 