# Workflow Management Guide for SnapCheck

This guide explains how to create and manage inspection workflows in the SnapCheck application using the API endpoints.

## Prerequisites

Before working with workflows, you need:

1. An admin user account
2. A valid authentication token

## Workflow Structure

A workflow consists of:

- **name**: The name of the workflow
- **category**: The category it belongs to (e.g., "Export", "Import", "Safety")
- **description**: A detailed description of the workflow
- **steps**: An array of inspection steps with the following structure:
  - **title**: Step title
  - **instructions**: Detailed instructions for the inspector
  - **mediaRequired**: Boolean indicating if photos/videos are required

## API Endpoints

### Create a Workflow (Admin only)

**Endpoint:** `POST /api/workflows`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_TOKEN`

**Request Body Example:**
```json
{
  "name": "Container Inspection",
  "category": "Export",
  "description": "Standard inspection workflow for export containers",
  "steps": [
    {
      "title": "Container Exterior Inspection",
      "instructions": "Check the exterior of the container for any damages, rust, or structural issues. Take photos of all four sides.",
      "mediaRequired": true
    },
    {
      "title": "Container Number Verification",
      "instructions": "Verify the container number matches the shipping documents. Take a clear photo of the container number.",
      "mediaRequired": true
    },
    {
      "title": "Door Seal Check",
      "instructions": "Check that the container seal is intact and matches the seal number on the documentation. Take a close-up photo of the seal.",
      "mediaRequired": true
    },
    {
      "title": "Interior Inspection",
      "instructions": "Check the interior of the container for cleanliness, damages, and any potential issues that could affect cargo.",
      "mediaRequired": true
    },
    {
      "title": "Ventilation Check",
      "instructions": "For ventilated containers, ensure all ventilation mechanisms are working properly.",
      "mediaRequired": false
    }
  ]
}
```

### Get All Workflows

**Endpoint:** `GET /api/workflows`

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

### Get Workflow by ID

**Endpoint:** `GET /api/workflows/:id`

**Headers:**
- `Authorization: Bearer YOUR_TOKEN`

### Update Workflow (Admin only)

**Endpoint:** `PUT /api/workflows/:id`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
Same structure as the create endpoint

## Common Workflow Categories

- **Export**: For export container inspections
- **Import**: For import container inspections
- **Safety**: For safety compliance checks
- **Quality**: For quality assurance inspections
- **Damage**: For damage assessment

## Best Practices

1. **Step Organization**: Order steps logically from exterior to interior, or general to specific
2. **Clear Instructions**: Provide specific, actionable instructions for each step
3. **Media Requirements**: Require photos for critical inspection points
4. **Consistent Categories**: Maintain consistent categories across your organization
5. **Descriptive Names**: Use clear, concise names that describe the workflow purpose

## Example Workflow Types

1. **Container Inspection**
2. **Vehicle Inspection**
3. **Equipment Inspection**
4. **Facility Safety Check**
5. **Cargo Verification**

## Testing with Postman

The provided Postman collection includes all workflow endpoints for easy testing:

1. First, set up your environment variables:
   - `base_url`: Your API base URL
   - `authToken`: Your authentication token (from login)

2. Use the "Create Workflow" request to create a new workflow
3. Copy the returned workflow ID to the `workflowId` variable to test other endpoints
