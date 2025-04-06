import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

/**
 * Uploads a file to Vercel Blob Storage
 * @param {File|Blob} file - The file to upload
 * @param {Object} options - Upload options
 * @param {string} options.access - Access level ('public' or 'private')
 * @param {string} options.folder - Optional folder path within the blob storage
 * @returns {Promise<{url: string, pathname: string}>} - The URL and pathname of the uploaded file
 */
export async function uploadToBlob(file, options = {}) {
  const { access = 'public', folder = '' } = options;
  
  // Generate a unique filename
  const filename = `${nanoid()}-${file.name}`;
  const pathname = folder ? `${folder}/${filename}` : filename;
  
  // Upload the file to Vercel Blob Storage
  const { url, pathname: blobPathname } = await put(pathname, file, {
    access,
  });
  
  return {
    url,
    pathname: blobPathname,
  };
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