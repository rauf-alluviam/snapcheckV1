// Import from the centralized API configuration
import apiClient, { uploadFiles } from './apiConfig';

// Re-export for backwards compatibility
export { uploadFiles };

// Export the API client for existing components
export default apiClient;
