# SnapCheck Backend User and Organization Setup Guide

This guide explains how to set up users and organizations in the SnapCheck application, addressing the circular dependency issue (needing an organization to create a user, but needing a user to create an organization).

## Initial Setup Process

### 1. Register Admin User (First User)

The first step is to create an admin user, which will automatically create a default organization.

**Endpoint:** `POST /api/auth/register-admin`

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
- A token
- The admin user details
- The default organization details

### 2. Login with Admin Credentials

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
- A token that you'll use for authenticated requests
- User details

### 3. Create Additional Organizations (Optional)

As an admin, you can create additional organizations:

**Endpoint:** `POST /api/organizations`

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "name": "New Organization",
  "address": "123 Main St, City, Country",
  "phone": "123-456-7890",
  "email": "contact@organization.com"
}
```

### 4. Register Regular Users

Now that you have organizations, you can register regular users:

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Regular User",
  "email": "user@example.com",
  "password": "UserPassword123",
  "organizationId": "ORGANIZATION_ID_HERE",
  "role": "inspector"
}
```

## Postman Collection

A complete Postman collection has been created at `/server/snapcheck-api.postman_collection.json`. Import this collection into Postman to easily test all endpoints.

**Environment Variables to Set:**
- `base_url`: Your API base URL (e.g., `http://localhost:4000`)
- `authToken`: The token received after login
- `organizationId`: The ID of an organization

## Authentication Flow

1. Register the first admin user without organization requirement
2. The system automatically creates a default organization
3. The admin can create more organizations
4. Regular users can be created with organization IDs

## Roles in the System

- `admin`: Can manage organizations and users
- `inspector`: Regular user who can perform inspections
- `approver`: User who can approve inspections

## Important Notes

- The special admin registration endpoint (`register-admin`) only works once when no admin exists in the system
- All users need to be associated with an organization
- Tokens expire after 24 hours
