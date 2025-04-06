import { verifyToken } from '../../lib/auth';
import { getRedisClient, getFromRedisList } from '../../lib/redis';
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify authentication token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('No token provided in request');
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('Invalid token provided:', token);
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    console.log('Authenticated user:', decoded.email);

    // Get Redis client
    const redis = await getRedisClient();
    if (!redis) {
      throw new Error('Failed to connect to Redis');
    }

    // Get all image IDs
    const imageIds = await getFromRedisList(redis, 'images:list', 0, -1);
    console.log(`Found ${imageIds.length} image IDs to check`);
    
    // Get all blobs from Vercel Blob Storage
    const { blobs } = await list({ 
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: 'images/',
      limit: 100
    });
    
    console.log(`Found ${blobs.length} blobs in Vercel Blob Storage`);
    
    // Create a map of blob URLs to their pathnames
    const blobMap = new Map();
    blobs.forEach(blob => {
      blobMap.set(blob.url, blob.pathname);
    });
    
    let foundCount = 0;
    let missingCount = 0;
    let missingImages = [];
    
    // Check each image in Redis
    for (const id of imageIds) {
      const data = await redis.get(id);
      if (!data) {
        console.error(`No data found for image ID: ${id}`);
        missingCount++;
        continue;
      }
      
      try {
        const imageData = JSON.parse(data);
        
        // Check if the image URL exists in Vercel Blob Storage
        const exists = blobMap.has(imageData.url);
        
        if (exists) {
          console.log(`Image exists in storage: ${imageData.url}`);
          foundCount++;
        } else {
          console.log(`Image missing from storage: ${imageData.url}`);
          missingCount++;
          missingImages.push({
            id,
            url: imageData.url
          });
        }
      } catch (error) {
        console.error(`Error processing image ID ${id}:`, error);
        missingCount++;
        missingImages.push({
          id,
          url: 'Error parsing image data'
        });
      }
    }
    
    // Return the results
    return res.status(200).json({
      success: true,
      data: {
        total: imageIds.length,
        found: foundCount,
        missing: missingCount,
        missingImages
      }
    });
  } catch (error) {
    console.error('Error checking images:', error);
    return res.status(500).json({ success: false, error: 'Error checking images' });
  }
} 