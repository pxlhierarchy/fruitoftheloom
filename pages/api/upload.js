import formidable from 'formidable';
import { uploadToBlob } from '../../lib/blob-storage';
import { verifyToken } from '../../lib/auth';
import { getRedisClient, addToRedisList } from '../../lib/redis';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Parse the form data
    const form = formidable({
      keepExtensions: true,
      multiples: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Get the uploaded file
    const file = files.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    console.log('File mimetype:', file.mimetype);
    
    // Check if the mimetype is in the allowed list or if it's a generic image type
    const isAllowedType = allowedTypes.includes(file.mimetype) || 
                          file.mimetype.startsWith('image/');
    
    if (!isAllowedType) {
      console.error('Invalid file type:', file.mimetype);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }

    // Read the file data
    const fileData = await new Promise((resolve, reject) => {
      const chunks = [];
      const stream = file.createReadStream();
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log('File data read successfully:', {
          size: buffer.length,
          mimetype: file.mimetype
        });
        resolve(buffer);
      });
      stream.on('error', (err) => {
        console.error('Error reading file stream:', err);
        reject(err);
      });
    });

    // Log the file details for debugging
    console.log('File to upload:', {
      type: file.mimetype,
      size: file.size,
      originalFilename: file.originalFilename,
      fileDataSize: fileData.length
    });

    // Upload to Vercel Blob Storage
    const { url, pathname, filename, mimeType } = await uploadToBlob(fileData, {
      access: 'public',
      folder: 'images',
      type: file.mimetype,
      originalFilename: file.originalFilename
    });

    // Log the upload result for debugging
    console.log('Upload result:', {
      url,
      pathname,
      filename,
      mimeType
    });

    // Get Redis client
    const redis = await getRedisClient();
    if (!redis) {
      throw new Error('Failed to connect to Redis');
    }

    // Generate a unique ID for the image
    const imageId = `image:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    // Store metadata in Redis
    const metadata = {
      id: imageId,
      url: url,
      pathname: pathname,
      filename: filename,
      mimeType: mimeType,
      size: file.size,
      uploadedBy: decoded.email,
      uploadedAt: new Date().toISOString(),
    };

    // Log the metadata for debugging
    console.log('Storing metadata:', metadata);

    // Store the image metadata
    await redis.set(imageId, JSON.stringify(metadata));

    // Add the image ID to a list of all images
    await addToRedisList(redis, 'images:list', imageId);

    // Return success response
    return res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ success: false, error: 'Error uploading image' });
  }
} 