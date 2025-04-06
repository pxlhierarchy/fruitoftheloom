# Image Upload Serverless Function

This is a serverless function built for Vercel that handles image uploads. It stores images in Vercel Blob Storage and saves metadata in MongoDB. The system includes a secure authentication system with two user roles: regular users who can upload images and admins who can view a calendar of uploaded images.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in your Vercel project:
- `MONGODB_URI`: Your MongoDB connection string
- `MONGODB_DB`: Your MongoDB database name
- `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob Storage token (automatically set in Vercel deployments)
- `JWT_SECRET`: A secure secret key for JWT token generation

## Deployment to Vercel

### Prerequisites
- A Vercel account
- A MongoDB Atlas account (or another MongoDB provider)
- Git repository with your code

### Step 1: Push Your Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure your project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `next build`
   - Output Directory: `.next`

### Step 3: Configure Environment Variables
In the Vercel project settings, add the following environment variables:
- `MONGODB_URI`: Your MongoDB connection string
- `MONGODB_DB`: Your MongoDB database name
- `JWT_SECRET`: A secure secret key for JWT token generation

### Step 4: Deploy
Click "Deploy" and wait for the build to complete. Once deployed, Vercel will provide you with a URL for your application.

### Step 5: Set Up MongoDB
1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster
3. Set up a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and update the `MONGODB_URI` environment variable in Vercel

### Step 6: Create Initial Users
After deployment, you'll need to create at least one admin user and one regular user. You can do this by sending POST requests to your deployed API:

```bash
# Create an admin user
curl -X POST https://your-vercel-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"securepassword","role":"admin"}'

# Create a regular user
curl -X POST https://your-vercel-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepassword","role":"user"}'
```

## Authentication

### Register a New User

Send a POST request to `/api/auth/register` with:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "user" // or "admin" for admin users
}
```

### Login

Send a POST request to `/api/auth/login` with:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

The response will include a JWT token that should be included in subsequent requests:
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Usage

Send a POST request to `/api/upload` with a multipart form containing:
- `file`: The image file to upload
- `userId` (optional): The ID of the user uploading the image

Example using fetch:
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('userId', 'user123'); // optional

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

## Calendar View (Admin Role)

Send a GET request to `/api/images/calendar?year=2024&month=1` to view images uploaded in January 2024.

Include the JWT token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The response will include images grouped by day:
```json
{
  "success": true,
  "data": {
    "1": [
      {
        "id": "65f1234567890abcdef12345",
        "url": "https://public.blob.vercel-storage.com/...",
        "filename": "example.jpg",
        "uploadedBy": "user@example.com",
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ],
    "2": [
      // More images...
    ]
  }
}
```

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Secure API endpoints with proper validation

## Response Format

Successful response:
```json
{
  "success": true,
  "data": {
    "url": "https://public.blob.vercel-storage.com/...",
    "metadata": {
      "filename": "example.jpg",
      "blobUrl": "https://public.blob.vercel-storage.com/...",
      "blobPath": "/example.jpg",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "userId": "user123"
    }
  }
}
```

Error response:
```json
{
  "success": false,
  "error": "Error uploading image"
}
```

## Vercel Blob Storage

This project uses Vercel Blob Storage to store uploaded images. Vercel Blob Storage is a serverless storage solution that's integrated with Vercel deployments. It provides:

- Simple API for uploading and retrieving files
- Automatic CDN distribution
- Secure access control
- No need for external storage providers

The `BLOB_READ_WRITE_TOKEN` is automatically set in Vercel deployments, so you don't need to configure it manually. 