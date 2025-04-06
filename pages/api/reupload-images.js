import { verifyToken } from '../../lib/auth';
import { getRedisClient, getFromRedisList } from '../../lib/redis';
import { list, put } from '@vercel/blob';
import fetch from 'node-fetch';

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
    
    let reuploadedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let results = [];
    
    // Check each image in Redis
    for (const id of imageIds) {
      const data = await redis.get(id);
      if (!data) {
        console.error(`No data found for image ID: ${id}`);
        skippedCount++;
        continue;
      }
      
      try {
        const imageData = JSON.parse(data);
        
        // Check if the image URL exists in Vercel Blob Storage
        const exists = blobMap.has(imageData.url);
        
        if (exists) {
          console.log(`Image already exists in storage: ${imageData.url}`);
          skippedCount++;
          results.push({
            id,
            url: imageData.url,
            status: 'skipped',
            reason: 'already exists'
          });
          continue;
        }
        
        // Try to fetch the image from the URL
        try {
          const response = await fetch(imageData.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          
          const imageBuffer = await response.buffer();
          
          // Generate a new filename
          const fileExtension = imageData.filename.split('.').pop() || 'jpg';
          const newFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
          const pathname = `images/${newFilename}`;
          
          // Upload the image to Vercel Blob Storage
          const { url } = await put(pathname, imageBuffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            contentType: imageData.mimeType || 'image/jpeg'
          });
          
          // Update the image metadata in Redis
          imageData.url = url;
          imageData.pathname = pathname;
          imageData.filename = newFilename;
          
          await redis.set(id, JSON.stringify(imageData));
          
          console.log(`Re-uploaded image: ${url}`);
          reuploadedCount++;
          results.push({
            id,
            oldUrl: imageData.url,
            newUrl: url,
            status: 're-uploaded'
          });
        } catch (fetchError) {
          console.error(`Failed to re-upload image ${id}:`, fetchError);
          failedCount++;
          results.push({
            id,
            url: imageData.url,
            status: 'failed',
            reason: fetchError.message
          });
        }
      } catch (error) {
        console.error(`Error processing image ID ${id}:`, error);
        failedCount++;
        results.push({
          id,
          status: 'failed',
          reason: error.message
        });
      }
    }
    
    // Return the results
    return res.status(200).json({
      success: true,
      data: {
        total: imageIds.length,
        reuploaded: reuploadedCount,
        skipped: skippedCount,
        failed: failedCount,
        results
      }
    });
  } catch (error) {
    console.error('Error re-uploading images:', error);
    return res.status(500).json({ success: false, error: 'Error re-uploading images' });
  }
} 