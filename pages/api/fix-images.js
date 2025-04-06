import { verifyToken } from '../../lib/auth';
import { getRedisClient, getFromRedisList, getRedisListLength } from '../../lib/redis';

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
    console.log(`Found ${imageIds.length} image IDs to fix`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    // Fix each image metadata
    for (const id of imageIds) {
      const data = await redis.get(id);
      if (!data) {
        console.error(`No data found for image ID: ${id}`);
        skippedCount++;
        continue;
      }
      
      try {
        const imageData = JSON.parse(data);
        
        // Check if the URL contains 'undefined'
        if (imageData.url && imageData.url.includes('undefined')) {
          // Create a new URL without 'undefined'
          const newUrl = imageData.url.replace('-undefined-', '-');
          
          // Update the image metadata
          imageData.url = newUrl;
          
          // Store the updated metadata
          await redis.set(id, JSON.stringify(imageData));
          
          console.log(`Fixed image URL for ID: ${id}`);
          fixedCount++;
        } else {
          console.log(`Skipped image ID: ${id} (no 'undefined' in URL)`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error fixing image ID ${id}:`, error);
        skippedCount++;
      }
    }
    
    // Return the results
    return res.status(200).json({
      success: true,
      data: {
        total: imageIds.length,
        fixed: fixedCount,
        skipped: skippedCount
      }
    });
  } catch (error) {
    console.error('Error fixing images:', error);
    return res.status(500).json({ success: false, error: 'Error fixing images' });
  }
} 