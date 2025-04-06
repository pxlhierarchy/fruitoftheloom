import { verifyToken } from '../../../lib/auth';
import { getRedisClient, getFromRedisList, getRedisListLength } from '../../../lib/redis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Get query parameters
    const { skip = 0, limit = 20, startDate, endDate } = req.query;
    const skipNum = parseInt(skip, 10);
    const limitNum = parseInt(limit, 10);

    // Get Redis client
    const redis = await getRedisClient();
    if (!redis) {
      throw new Error('Failed to connect to Redis');
    }

    // Get all image IDs
    const imageIds = await getFromRedisList(redis, 'images:list', skipNum, skipNum + limitNum - 1);
    console.log(`Found ${imageIds.length} image IDs`);
    
    // Get image metadata for each ID
    const images = await Promise.all(
      imageIds.map(async (id) => {
        const data = await redis.get(id);
        if (!data) {
          console.error(`No data found for image ID: ${id}`);
          return null;
        }
        try {
          return JSON.parse(data);
        } catch (error) {
          console.error(`Error parsing data for image ID ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out any null values and sort by upload date
    const validImages = images
      .filter(Boolean)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    console.log(`Returning ${validImages.length} valid images`);

    // Get total count
    const total = await getRedisListLength(redis, 'images:list');

    // Return the images
    return res.status(200).json({
      success: true,
      data: {
        images: validImages || [],
        total: total || 0,
        skip: skipNum,
        limit: limitNum,
        pagination: {
          hasMore: (skipNum + limitNum) < total,
          total: total || 0,
          skip: skipNum,
          limit: limitNum
        }
      },
    });
  } catch (error) {
    console.error('Error retrieving images:', error);
    return res.status(500).json({ success: false, error: 'Error retrieving images' });
  }
} 