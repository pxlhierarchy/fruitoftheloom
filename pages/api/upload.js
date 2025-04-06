import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { uploadToBlob } from '../../lib/blob-storage';
import { connectToDatabase } from '../../lib/mongodb';
import { verifyToken } from '../../lib/auth';

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
    const form = formidable({});
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

    // Upload to Vercel Blob Storage
    const { url, pathname } = await uploadToBlob(file, {
      access: 'public',
      folder: 'images',
    });

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Store metadata in MongoDB
    const metadata = {
      url,
      pathname,
      filename: file.originalFilename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: decoded.email,
      uploadedAt: new Date(),
    };

    const result = await db.collection('images').insertOne(metadata);

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        id: result.insertedId,
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ success: false, error: 'Error uploading image' });
  }
} 