// API configuration for consistent API URL usage across the application
import axios from 'axios';

// Get the base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_APP_API_STRING || 'http://localhost:5000';

// Create axios instance with base URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL, // we'll prepend /api in the requests where needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && 
        (error.response.status === 401 || error.response.status === 403) && 
        error.response.data?.expired) {
      console.log('Token expired intercepted in API response');
    }
    return Promise.reject(error);
  }
);

/**
 * Helper functions for common API operations
 */

// Function to build API endpoint URL
export const buildApiUrl = (endpoint: string): string => {
  console.log('Building API URL for endpoint:', endpoint);
  
  // Remove leading slash if present
  let normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Handle api prefix properly
  // If the endpoint already includes 'api/' prefix, don't add it again
  if (!normalizedEndpoint.startsWith('api/')) {
    normalizedEndpoint = `api/${normalizedEndpoint}`;
  }
  
  // Remove trailing slash from API_BASE_URL if it exists
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  
  const fullUrl = `${baseUrl}/${normalizedEndpoint}`;
  console.log('Full API URL:', fullUrl);
  
  return fullUrl;
};

// File upload helper function
export const uploadFiles = async (files: File[]): Promise<string[]> => {
  console.log('Starting file upload using centralized uploadFiles function');
  
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('media', file);
  });
  
  try {
    // Use absolute URL to avoid path issues
    const response = await apiClient.post('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Upload successful with apiClient:', response.data);
    return response.data.urls;
  } catch (error) {
    console.error('Error in centralized upload function:', error);
    
    // Fall back to fetch API if axios fails
    console.log('Falling back to fetch API for upload');
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found');
    
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const endpoint = `${baseUrl}/api/media/upload`;
    
    console.log(`Uploading to endpoint: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Upload failed with status: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        errorMessage += ` - Response was not valid JSON: ${errorText.substring(0, 100)}...`;
      }
      throw new Error(errorMessage);
    }
    
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Upload successful with fetch API:', data);
      return data.urls;
    } catch (parseError) {
      throw new Error(`Server returned invalid JSON response: ${responseText.substring(0, 100)}...`);
    }
  }
};

export default apiClient;
