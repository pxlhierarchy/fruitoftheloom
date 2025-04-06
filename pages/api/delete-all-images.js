import { verifyToken } from '../../lib/auth';
import { getRedisClient, getFromRedisList } from '../../lib/redis';

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
    console.log(`Found ${imageIds.length} image IDs to delete`);
    
    let deletedCount = 0;
    let failedCount = 0;
    let results = [];
    
    // Delete each image from Redis
    for (const id of imageIds) {
      try {
        // Get the image data first to log it
        const data = await redis.get(id);
        let imageData = null;
        
        if (data) {
          try {
            imageData = JSON.parse(data);
          } catch (e) {
            console.error(`Error parsing image data for ID ${id}:`, e);
          }
        }
        
        // Delete the image from Redis
        const deleted = await redis.del(id);
        
        if (deleted) {
          console.log(`Deleted image ID: ${id}`);
          deletedCount++;
          results.push({
            id,
            status: 'deleted',
            url: imageData?.url || 'unknown'
          });
        } else {
          console.error(`Failed to delete image ID: ${id}`);
          failedCount++;
          results.push({
            id,
            status: 'failed',
            reason: 'Redis delete operation failed',
            url: imageData?.url || 'unknown'
          });
        }
      } catch (error) {
        console.error(`Error deleting image ID ${id}:`, error);
        failedCount++;
        results.push({
          id,
          status: 'failed',
          reason: error.message
        });
      }
    }
    
    // Delete the images list from Redis
    await redis.del('images:list');
    console.log('Deleted images:list from Redis');
    
    // Return the results
    return res.status(200).json({
      success: true,
      data: {
        total: imageIds.length,
        deleted: deletedCount,
        failed: failedCount,
        results
      }
    });
  } catch (error) {
    console.error('Error deleting images:', error);
    return res.status(500).json({ success: false, error: 'Error deleting images' });
  }
} 