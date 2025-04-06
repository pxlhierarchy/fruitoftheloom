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
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Get query parameters
    const { skip = 0, limit = 20 } = req.query;
    const skipNum = parseInt(skip, 10);
    const limitNum = parseInt(limit, 10);

    // Get Redis client
    const redis = await getRedisClient();
    if (!redis) {
      throw new Error('Failed to connect to Redis');
    }

    // Get all image IDs
    const imageIds = await getFromRedisList(redis, 'images:list', skipNum, skipNum + limitNum - 1);
    
    // Get image metadata for each ID
    const images = await Promise.all(
      imageIds.map(async (id) => {
        const data = await redis.get(id);
        return data ? JSON.parse(data) : null;
      })
    );

    // Filter out any null values and sort by upload date
    const validImages = images
      .filter(Boolean)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Get total count
    const total = await getRedisListLength(redis, 'images:list');

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        images: validImages,
        pagination: {
          total,
          skip: skipNum,
          limit: limitNum,
          hasMore: skipNum + limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving images:', error);
    return res.status(500).json({ success: false, error: 'Error retrieving images' });
  }
} 