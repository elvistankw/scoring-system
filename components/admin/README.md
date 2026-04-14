# Admin Components

This directory contains all admin-specific components for the Scoring System.

## Components

### admin-dashboard-client.tsx
Main client component for the admin dashboard. Handles:
- Authentication check (admin role required)
- Competition list display
- Competition form display (create/edit)
- Navigation between views

### competition-form.tsx
Form component for creating and editing competitions. Features:
- Dynamic form fields based on competition type
- Validation for all required fields
- Date range validation
- Status management (for editing)
- Sonner toast notifications for success/error
- Loading states during submission

### competition-list.tsx
Displays a filterable list of competitions. Features:
- Filter by status (upcoming, active, completed)
- Filter by competition type (individual, duo_team, challenge)
- Filter by region
- Competition cards with key information
- Edit, view details, and delete actions
- Skeleton loading states
- Sonner toast notifications

## Usage

```tsx
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client';

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
```

## Requirements Satisfied

- 2.1: Competition creation and management
- 2.2: Competition-athlete associations
- 8.1: Admin role authorization
- 8.2: Competition filtering
- 13.1, 13.2: Loading skeleton states
- 14.1, 14.2: Sonner toast notifications
- 15.1, 15.4: SEO metadata
- 16.1: Kebab-case file naming
- 17.3: Centralized API configuration
- 18.1, 18.2, 18.3: Hook-based data fetching with SWR
