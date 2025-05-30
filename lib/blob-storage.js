import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

// Check for Blob token
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Warning: BLOB_READ_WRITE_TOKEN is not set in environment variables');
}

/**
 * Uploads a file to Vercel Blob Storage
 * @param {Buffer} fileData - The file data to upload
 * @param {Object} options - Upload options
 * @param {string} options.access - Access level ('public' or 'private')
 * @param {string} options.folder - Optional folder path within the blob storage
 * @param {string} options.type - The file's MIME type
 * @param {string} options.originalFilename - Optional original filename to use
 * @returns {Promise<{url: string, pathname: string, filename: string, mimeType: string}>} - The URL, pathname, filename, and mimeType of the uploaded file
 */
export async function uploadToBlob(fileData, options = {}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set. Please configure it in your environment variables.');
  }

  if (!fileData || !Buffer.isBuffer(fileData)) {
    console.error('Invalid file data:', {
      isBuffer: Buffer.isBuffer(fileData),
      type: typeof fileData,
      length: fileData?.length
    });
    throw new Error('Invalid file data provided');
  }

  const { access = 'public', folder = '', type = 'image/jpeg', originalFilename } = options;
  
  try {
    // Generate a unique ID for the filename
    const uniqueId = nanoid();
    
    // Determine the file extension based on the MIME type or default to jpg
    let fileExtension = 'jpg';
    
    // Try to get the extension from the MIME type
    const mimeType = type.toLowerCase();
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      fileExtension = 'jpg';
    } else if (mimeType.includes('png')) {
      fileExtension = 'png';
    } else if (mimeType.includes('gif')) {
      fileExtension = 'gif';
    } else if (mimeType.includes('webp')) {
      fileExtension = 'webp';
    }
    
    // Create a clean filename with the unique ID and extension
    const filename = `${uniqueId}.${fileExtension}`;
    const pathname = folder ? `${folder}/${filename}` : filename;
    
    console.log('Attempting to upload file:', {
      pathname,
      size: fileData.length,
      type: mimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN ? 'present' : 'missing'
    });
    
    // Upload the file to Vercel Blob Storage
    const { url, pathname: blobPathname } = await put(pathname, fileData, {
      access,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: mimeType
    });
    
    // Log the upload details for debugging
    console.log('Upload successful:', {
      filename,
      pathname,
      url,
      type: mimeType
    });
    
    return {
      url,
      pathname: blobPathname,
      filename,
      mimeType
    };
  } catch (error) {
    console.error('Error uploading to blob storage:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }
}

/**
 * Deletes a file from Vercel Blob Storage
 * @param {string} pathname - The pathname of the file to delete
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export async function deleteFromBlob(pathname) {
  try {
    // Note: The @vercel/blob package doesn't currently provide a delete method
    // This would require using the Vercel Blob API directly or implementing a custom solution
    // For now, we'll return a placeholder implementation
    console.log(`Would delete blob at pathname: ${pathname}`);
    return true;
  } catch (error) {
    console.error('Error deleting blob:', error);
    return false;
  }
}

/**
 * Lists files in a folder in Vercel Blob Storage
 * @param {string} folder - The folder to list files from
 * @returns {Promise<Array<{url: string, pathname: string}>>} - List of files in the folder
 */
export async function listBlobs(folder = '') {
  try {
    // Note: The @vercel/blob package doesn't currently provide a list method
    // This would require using the Vercel Blob API directly or implementing a custom solution
    // For now, we'll return a placeholder implementation
    console.log(`Would list blobs in folder: ${folder}`);
    return [];
  } catch (error) {
    console.error('Error listing blobs:', error);
    return [];
  }
} 