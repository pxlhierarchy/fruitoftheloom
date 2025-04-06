import { createClient } from 'redis';

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

/**
 * Get the Redis client
 * @returns {Promise<RedisClient>} - The Redis client
 */
export async function getRedisClient() {
  if (!redisClient || !redisConnected) {
    await initRedis();
  }
  return redisClient;
}

/**
 * Safely parse JSON data
 * @param {string} data - The JSON string to parse
 * @returns {Object|null} - The parsed object or null if invalid
 */
export function safeJsonParse(data) {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

/**
 * Add an item to a Redis list
 * @param {RedisClient} redis - The Redis client
 * @param {string} key - The list key
 * @param {string} value - The value to add
 * @returns {Promise<number>} - The new length of the list
 */
export async function addToRedisList(redis, key, value) {
  if (!redis || !redisConnected) {
    throw new Error('Redis client not connected');
  }
  return redis.lPush(key, value);
}

/**
 * Get items from a Redis list
 * @param {RedisClient} redis - The Redis client
 * @param {string} key - The list key
 * @param {number} start - The start index
 * @param {number} stop - The stop index
 * @returns {Promise<string[]>} - The list items
 */
export async function getFromRedisList(redis, key, start, stop) {
  if (!redis || !redisConnected) {
    throw new Error('Redis client not connected');
  }
  return redis.lRange(key, start, stop);
}

/**
 * Get the length of a Redis list
 * @param {RedisClient} redis - The Redis client
 * @param {string} key - The list key
 * @returns {Promise<number>} - The length of the list
 */
export async function getRedisListLength(redis, key) {
  if (!redis || !redisConnected) {
    throw new Error('Redis client not connected');
  }
  return redis.lLen(key);
} 