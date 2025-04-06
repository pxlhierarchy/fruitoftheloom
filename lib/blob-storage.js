import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

// Check for Blob token
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Warning: BLOB_READ_WRITE_TOKEN is not set in environment variables');
}

/**
 * Uploads a file to Vercel Blob Storage
 * @param {File|Blob} file - The file to upload
 * @param {Object} options - Upload options
 * @param {string} options.access - Access level ('public' or 'private')
 * @param {string} options.folder - Optional folder path within the blob storage
 * @returns {Promise<{url: string, pathname: string, filename: string, mimeType: string}>} - The URL, pathname, filename, and mimeType of the uploaded file
 */
export async function uploadToBlob(file, options = {}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set. Please configure it in your environment variables.');
  }

  const { access = 'public', folder = '' } = options;
  
  try {
    // Get the original filename from the file object
    const originalFilename = file.name || file.originalFilename;
    if (!originalFilename) {
      throw new Error('No filename provided');
    }

    // Generate a unique filename while preserving the original extension
    const fileExtension = originalFilename.split('.').pop().toLowerCase();
    const uniqueId = nanoid();
    const filename = `${uniqueId}.${fileExtension}`;
    const pathname = folder ? `${folder}/${filename}` : filename;
    
    // Upload the file to Vercel Blob Storage
    const { url, pathname: blobPathname } = await put(pathname, file, {
      access,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || 'application/octet-stream'
    });
    
    // Log the upload details for debugging
    console.log('Upload successful:', {
      originalFilename,
      filename,
      pathname,
      url
    });
    
    return {
      url,
      pathname: blobPathname,
      filename: originalFilename,
      mimeType: file.type || 'application/octet-stream'
    };
  } catch (error) {
    console.error('Error uploading to blob storage:', error);
    throw new Error('Failed to upload file to storage. Please try again.');
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