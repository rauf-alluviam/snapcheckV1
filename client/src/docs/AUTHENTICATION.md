# Authentication and Organization Management

This document explains how authentication and organization management work in the SnapCheck application.

## Authentication Flow

### User Registration

1. Users can register by providing:
   - Name, email, and password
   - Selecting an existing organization or creating a new one
   - Selecting a role within the organization

2. If creating a new organization, the client:
   - First creates the organization via `/api/organizations/register` endpoint
   - Then registers the user with the newly created organization's ID

3. Registration API endpoint (`/api/auth/register`):
   - Validates user input
   - Creates a new user account
   - Issues a JWT token for immediate authentication
   - Returns user data and token

### Login

1. Users login with email and password
2. The server verifies credentials and returns a JWT token
3. The token is stored in localStorage and used for all subsequent API calls

### Authentication State Management

1. All authentication state is managed by AuthContext
2. Token validation happens automatically on app startup
3. Authenticated user state is available throughout the app
4. Token expiration is handled automatically

## Organization Management

### Organization Listing

1. Public organization endpoint (`/api/organizations/public`):
   - Available without authentication
   - Returns minimal organization data needed for registration
   - Used in the registration form

2. Protected organization endpoints:
   - `/api/organizations` - List all organizations (admin only)
   - `/api/organizations/current` - Get current user's organization
   - Other endpoints for CRUD operations

### Organization Creation During Registration

1. New organizations can be created during user registration
2. The `/api/organizations/register` endpoint:
   - Creates a new organization with provided details
   - Returns the organization ID to be used in user registration

## Error Handling

1. API errors are properly handled and displayed to users
2. Registration process has proper error handling for both:
   - Organization creation errors
   - User registration errors
3. Error messages are standardized and user-friendly

## Implementation Notes

- JWT tokens are set automatically in API request headers
- The central API configuration in `apiConfig.ts` ensures consistent URL handling
- Environment variables control API base URL for different environments
- CORS is properly configured to allow requests from S3-hosted frontend
