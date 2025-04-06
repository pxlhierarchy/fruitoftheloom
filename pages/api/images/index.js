import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';

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
    const { page = 1, limit = 20, year, month } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build the query
    const query = {};
    
    // Filter by year and month if provided
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query.uploadedAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // Get total count
    const total = await db.collection('images').countDocuments(query);

    // Get images with pagination
    const images = await db.collection('images')
      .find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        images,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving images:', error);
    return res.status(500).json({ success: false, error: 'Error retrieving images' });
  }
} 