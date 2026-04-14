# Admin User Guide - Realtime Scoring System

Welcome to the Realtime Scoring System Admin Guide. This guide will help you manage competitions, athletes, and system operations.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Competition Management](#competition-management)
4. [Athlete Management](#athlete-management)
5. [User Management](#user-management)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to the application URL
2. Click "Sign In" or go to `/sign-in`
3. Enter your admin credentials
4. You will be redirected to the Admin Dashboard

### First Time Setup

After logging in for the first time:

1. **Create Competitions**: Set up your first competition event
2. **Add Athletes**: Register athletes who will participate
3. **Assign Athletes to Competitions**: Link athletes to specific competitions
4. **Create Judge Accounts**: Set up judge users who will score

---

## Dashboard Overview

The Admin Dashboard provides a quick overview of:

- **Active Competitions**: Currently running competitions
- **Total Athletes**: Number of registered athletes
- **Recent Scores**: Latest score submissions
- **Quick Actions**: Shortcuts to common tasks

### Navigation

- **Dashboard**: Overview and statistics
- **Competitions**: Manage competition events
- **Athletes**: Manage athlete roster
- **Users**: Manage admin and judge accounts (if available)

---

## Competition Management

### Creating a Competition

1. Navigate to **Competitions** page
2. Click **"Create Competition"** button
3. Fill in the competition details:

#### Competition Details

**Name** (Required)
- Example: "2024春季个人赛" or "Spring 2024 Individual Stage"
- Keep it descriptive and include the year/season

**Competition Type** (Required)
- **Individual Stage**: 5 scoring dimensions
  - Action Difficulty (动作难度)
  - Stage Artistry (舞台艺术性)
  - Action Creativity (动作创意性)
  - Action Fluency (动作流畅性)
  - Costume Styling (服装造型)
  
- **Duo/Team Stage**: 5 scoring dimensions
  - Action Difficulty (动作难度)
  - Stage Artistry (舞台艺术性)
  - Action Interaction (动作互动性)
  - Action Creativity (动作创意性)
  - Costume Styling (服装造型)
  
- **Challenge**: 3 scoring dimensions
  - Action Difficulty (动作难度)
  - Action Creativity (动作创意性)
  - Action Fluency (动作流畅性)

**Region** (Required)
- Example: "华东赛区", "华北赛区", "East Region"
- Used for organizing and filtering competitions

**Status** (Required)
- **Upcoming**: Competition not yet started
- **Active**: Competition currently running
- **Completed**: Competition finished

**Start Date** (Optional)
- Competition start date and time

**End Date** (Optional)
- Competition end date and time

4. Click **"Create"** to save the competition
5. Success notification will appear

### Editing a Competition

1. Navigate to **Competitions** page
2. Find the competition you want to edit
3. Click **"Edit"** button
4. Update the fields
5. Click **"Save Changes"**

**Note**: Changing competition type after scores have been submitted may cause data inconsistencies.

### Deleting a Competition

1. Navigate to **Competitions** page
2. Find the competition you want to delete
3. Click **"Delete"** button
4. Confirm the deletion

**Warning**: Deleting a competition will also delete all associated scores. This action cannot be undone.

### Managing Competition Athletes

#### Adding Athletes to a Competition

1. Navigate to the competition details page
2. Click **"Add Athletes"** button
3. Select athletes from the list
4. Click **"Add Selected"**

#### Removing Athletes from a Competition

1. Navigate to the competition details page
2. Find the athlete in the list
3. Click **"Remove"** button
4. Confirm the removal

**Note**: Removing an athlete will also delete their scores for this competition.

---

## Athlete Management

### Adding a New Athlete

1. Navigate to **Athletes** page
2. Click **"Add Athlete"** button
3. Fill in athlete details:

#### Athlete Details

**Name** (Required)
- Full name of the athlete or team
- Example: "张三" or "Team Phoenix"

**Athlete Number** (Required)
- Unique identifier for the athlete
- Example: "A001", "T042"
- Must be unique across all athletes

**Team Name** (Optional)
- For duo/team competitions
- Example: "龙腾队", "Phoenix Team"

**Contact Email** (Optional)
- Athlete's email address
- Used for communication

**Contact Phone** (Optional)
- Athlete's phone number
- Format: Any valid phone format

4. Click **"Create"** to save the athlete
5. Success notification will appear

### Editing Athlete Information

1. Navigate to **Athletes** page
2. Find the athlete you want to edit
3. Click **"Edit"** button
4. Update the fields
5. Click **"Save Changes"**

### Deleting an Athlete

1. Navigate to **Athletes** page
2. Find the athlete you want to delete
3. Click **"Delete"** button
4. Confirm the deletion

**Warning**: Deleting an athlete will remove them from all competitions and delete all their scores.

### Searching and Filtering Athletes

- **Search**: Use the search box to find athletes by name or number
- **Filter by Competition**: View only athletes in a specific competition
- **Sort**: Click column headers to sort by name, number, or registration date

---

## User Management

### Creating Judge Accounts

1. Navigate to **Users** page (if available)
2. Click **"Create User"** button
3. Fill in user details:
   - Username
   - Email
   - Password
   - Role: Select "Judge"
4. Click **"Create"**
5. Share credentials with the judge

### Managing Admin Accounts

- Only super admins can create other admin accounts
- Follow the same process as creating judge accounts
- Select "Admin" as the role

### Resetting Passwords

1. Navigate to **Users** page
2. Find the user
3. Click **"Reset Password"**
4. Enter new password
5. Share new credentials with the user

---

## Best Practices

### Competition Setup

1. **Create competitions in advance**: Set up competitions before the event day
2. **Use clear naming**: Include year, season, and type in competition names
3. **Set correct status**: Mark competitions as "Active" only when they start
4. **Verify athlete roster**: Double-check all athletes are registered before the event

### Athlete Management

1. **Unique athlete numbers**: Ensure each athlete has a unique number
2. **Complete information**: Fill in contact details for communication
3. **Team names for duo/team**: Always specify team name for duo/team competitions
4. **Pre-register athletes**: Add all athletes before the competition starts

### During Competition

1. **Monitor active competitions**: Keep the dashboard open to monitor progress
2. **Check score submissions**: Verify judges are submitting scores correctly
3. **Handle issues promptly**: Address any technical issues immediately
4. **Keep status updated**: Change competition status to "Completed" when finished

### After Competition

1. **Verify all scores**: Check that all athletes have been scored
2. **Export results**: Save competition results for records
3. **Update status**: Mark competition as "Completed"
4. **Backup data**: Ensure database backups are current

---

## Troubleshooting

### Cannot Create Competition

**Problem**: Error when creating competition

**Solutions**:
- Verify all required fields are filled
- Check that competition name is not too long
- Ensure dates are in correct format
- Try refreshing the page and logging in again

### Athlete Number Already Exists

**Problem**: Error "Athlete number already exists"

**Solutions**:
- Check if athlete is already registered
- Use a different unique number
- Search for existing athlete and edit instead

### Cannot Add Athlete to Competition

**Problem**: Error when adding athlete to competition

**Solutions**:
- Verify athlete exists in the system
- Check if athlete is already in the competition
- Ensure competition is not deleted
- Refresh the page and try again

### Scores Not Appearing

**Problem**: Judges submitted scores but they don't appear

**Solutions**:
- Verify competition status is "Active"
- Check that athletes are registered in the competition
- Ensure judges are logged in with correct credentials
- Check backend server is running
- Verify WebSocket connection is active

### Page Loading Slowly

**Problem**: Admin pages load slowly

**Solutions**:
- Check internet connection
- Clear browser cache
- Verify backend server is responsive
- Check database performance
- Contact system administrator

### Cannot Delete Competition

**Problem**: Error when trying to delete competition

**Solutions**:
- Check if you have admin permissions
- Verify competition exists
- Try refreshing the page
- Contact system administrator if issue persists

---

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Quick search
- **Esc**: Close modal dialogs
- **Tab**: Navigate between form fields

---

## Tips and Tricks

### Efficient Competition Management

1. **Use templates**: Create similar competitions by copying existing ones
2. **Bulk operations**: Select multiple athletes to add to competitions at once
3. **Quick filters**: Use region filters to manage regional competitions
4. **Status indicators**: Use color-coded status to quickly identify active competitions

### Data Organization

1. **Consistent naming**: Use a standard naming convention for competitions
2. **Regional grouping**: Organize competitions by region for easier management
3. **Athlete numbering**: Use a systematic numbering scheme (e.g., A001-A999 for individuals, T001-T999 for teams)

### Monitoring

1. **Dashboard widgets**: Customize dashboard to show most relevant information
2. **Recent activity**: Monitor recent scores to ensure judges are active
3. **Statistics**: Use statistics to track competition progress

---

## Requirements Satisfied

This admin guide supports:
- **Requirement 2**: Competition management (2.1-2.6)
- **Requirement 8**: Regional competition support (8.1-8.5)
- **Requirement 14**: User feedback notifications (14.1-14.5)
- **Requirement 15**: SEO metadata for admin pages (15.4)

---

## Support

For technical issues or questions:
- Contact system administrator
- Check system logs for error details
- Refer to deployment documentation for server issues

For feature requests or feedback:
- Submit through the feedback form
- Contact development team
