# API Configuration Usage Guide

## Overview

This guide explains how to properly access API endpoints in the SnapCheck application. Following these patterns will ensure consistent behavior across environments.

> **IMPORTANT UPDATE (May 23, 2025)**: We've resolved several critical issues with API URL handling. All components should now follow the patterns described in this guide to avoid "Unexpected token" errors when parsing JSON responses.

## Core API Configuration Files

- `apiConfig.ts`: The central configuration for all API calls
- `api.ts`: A compatibility layer that re-exports from apiConfig.ts

## How to Use the API Configuration

### For Axios-based API Calls

```typescript
import api from '../utils/api';

// Example GET request
const fetchData = async () => {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Example POST request
const submitData = async (data) => {
  try {
    const response = await api.post('/endpoint', data);
    return response.data;
  } catch (error) {
    console.error('Error submitting data:', error);
  }
};
```

### For Fetch API Calls

```typescript
import { buildApiUrl } from '../utils/apiConfig';

// Example fetch request
const fetchWithNativeFetch = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(buildApiUrl('/endpoint'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
};
```

### For File Uploads

```typescript
import { uploadFiles } from '../utils/api';

// Example file upload
const handleFileUpload = async (files) => {
  try {
    const fileUrls = await uploadFiles(files);
    return fileUrls;
  } catch (error) {
    console.error('Error uploading files:', error);
  }
};
```

## Environment Variables

API base URLs are configured using environment variables:

- `VITE_APP_API_STRING`: The base URL for API calls (e.g., `http://api.example.com` or `http://localhost:5000`)

Do not hardcode API URLs in components. Always use the central configuration.

## Best Practices

1. Always import API utilities from `api.ts` or `apiConfig.ts`
2. Never use string concatenation for API URLs
3. For direct fetch calls, always use `buildApiUrl('/endpoint')` from apiConfig.ts
4. Handle errors consistently using try/catch blocks
5. Include authorization headers automatically via the API client when possible

## Troubleshooting

If API calls are not working correctly:

1. Check that environment variables are properly set in .env files
2. Ensure you're using the correct import patterns 
3. Use browser developer tools to examine network requests
4. Check for correct authentication token usage

### Common Errors

#### "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error usually means:

1. Your API URL is incorrect and you're getting an HTML error page instead of JSON
2. The server route doesn't exist or is returning HTML instead of JSON
3. You have a double prefix issue (e.g., using `/api/` twice in the URL)

**Solution**: 
- Always use our centralized `uploadFiles` function for file uploads
- For other API calls, use `api.get()`, `api.post()` etc. from `api.ts`
- If you need to use direct fetch calls, use `buildApiUrl()` from `apiConfig.ts`
- Add better error handling to catch and report these errors clearly (see examples in FileUpload.tsx)

#### Server returns 404 Not Found

This usually means:
1. Missing `/api` prefix in the URL
2. Wrong endpoint path
3. Server not running

**Solution**:
- Always check network requests in DevTools to see the actual URL being requested
- Ensure server is running and accessible
