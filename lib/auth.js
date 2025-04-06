import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Default JWT secret for development (not recommended for production)
const DEFAULT_JWT_SECRET = 'jwt_secret_123456789';

// Get JWT secret from environment variables or use default
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Check for Redis URL
if (!process.env.REDIS_URL) {
  console.error('Warning: REDIS_URL is not set in environment variables');
}

// Create Redis client
let redisClient = null;
let redisConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Initialize Redis connection
async function initRedis() {
  if (!redisClient) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not set. Please set it in your .env.local file and Vercel environment variables.');
    }
    
    console.log('Initializing Redis client with URL:', process.env.REDIS_URL);
    
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > MAX_RECONNECT_ATTEMPTS) {
            console.error('Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          console.log(`Retrying Redis connection... Attempt ${retries + 1}`);
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      redisConnected = false;
    });
    
    redisClient.on('connect', () => {
      console.log('Redis client connected');
      redisConnected = true;
      connectionAttempts = 0;
    });
    
    redisClient.on('ready', () => {
      console.log('Redis client ready');
      redisConnected = true;
    });
    
    redisClient.on('end', () => {
      console.log('Redis client connection ended');
      redisConnected = false;
    });
    
    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
      connectionAttempts++;
    });
  }
  
  if (!redisConnected) {
    try {
      console.log('Attempting to connect to Redis...');
      await redisClient.connect();
      console.log('Connected to Redis successfully');
      redisConnected = true;
      connectionAttempts = 0;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      redisConnected = false;
      
      if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        throw new Error(`Failed to connect to Redis after ${MAX_RECONNECT_ATTEMPTS} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return initRedis();
    }
  }
  
  return redisClient;
}

// Initialize Redis on module load
initRedis().catch(error => {
  console.error('Failed to initialize Redis:', error);
});

/**
 * Safely parse JSON data
 * @param {string} data - The JSON string to parse
 * @returns {Object|null} - The parsed object or null if invalid
 */
function safeJsonParse(data) {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - The user object
 * @returns {string} - The JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id,
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
 * @returns {Promise<boolean>} - Whether the password matches
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
  
  try {
    console.log('Registering user:', email);
    const redis = await initRedis();
    
    if (!redis) {
      throw new Error('Failed to initialize Redis client');
    }
    
    // Check if user already exists
    const existingUserJson = await redis.get(`user:${email}`);
    const existingUser = safeJsonParse(existingUserJson);
    if (existingUser) {
      console.log('User already exists:', email);
      throw new Error('User already exists');
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create the user
    const user = {
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
    };
    
    // Store the user in Redis
    console.log('Storing user in Redis:', email);
    await redis.set(`user:${email}`, JSON.stringify(user));
    console.log('User stored successfully:', email);
    
    // Remove the password from the user object
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Login a user
 * @param {Object} credentials - The login credentials
 * @returns {Promise<{user: Object, token: string}>} - The user object and JWT token
 */
export async function loginUser(credentials) {
  const { email, password } = credentials;
  
  try {
    console.log('Attempting login for user:', email);
    const redis = await initRedis();
    
    if (!redis) {
      throw new Error('Failed to initialize Redis client');
    }
    
    // Get the user from Redis
    console.log('Fetching user from Redis:', email);
    const userJson = await redis.get(`user:${email}`);
    const user = safeJsonParse(userJson);
    
    if (!user) {
      console.log('User not found:', email);
      throw new Error('Invalid credentials');
    }
    
    // Compare the password
    console.log('Comparing password');
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      console.log('Invalid password for user:', email);
      throw new Error('Invalid credentials');
    }
    
    // Remove the password from the user object
    const { password: _, ...userWithoutPassword } = user;
    
    // Generate a token
    console.log('Generating token for user:', email);
    const token = generateToken(userWithoutPassword);
    
    console.log('Login successful for user:', email);
    return {
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
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