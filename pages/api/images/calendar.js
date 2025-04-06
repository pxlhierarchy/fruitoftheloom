import clientPromise from '../../../lib/mongodb';
import { requireRole } from '../../../lib/auth';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, month } = req.query;
    
    // Validate input
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }
    
    // Create date range for the specified month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    // Query images for the specified month
    const images = await db.collection('images')
      .find({
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ timestamp: 1 })
      .toArray();
    
    // Group images by day
    const calendarData = {};
    
    images.forEach(image => {
      const day = image.timestamp.getDate();
      if (!calendarData[day]) {
        calendarData[day] = [];
      }
      calendarData[day].push({
        id: image._id.toString(),
        url: image.cloudinaryUrl,
        filename: image.filename,
        uploadedBy: image.uploadedBy,
        timestamp: image.timestamp
      });
    });
    
    return res.status(200).json({
      success: true,
      data: calendarData
    });
  } catch (error) {
    console.error('Calendar error:', error);
    return res.status(500).json({ error: 'Error fetching calendar data' });
  }
};

// Only admins can access the calendar
export default requireRole('admin')(handler); 