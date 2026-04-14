# Judge User Guide - Realtime Scoring System

Welcome to the Realtime Scoring System Judge Guide. This guide will help you submit scores efficiently and accurately during competitions.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Judge Dashboard](#judge-dashboard)
3. [Selecting a Competition](#selecting-a-competition)
4. [Scoring Athletes](#scoring-athletes)
5. [Score Dimensions](#score-dimensions)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Judge Interface

1. Navigate to the application URL
2. Click "Sign In" or go to `/sign-in`
3. Enter your judge credentials (provided by admin)
4. You will be redirected to the Judge Dashboard

### Device Requirements

**Recommended Devices**:
- iPad or Android tablet (10-12 inches)
- Laptop or desktop computer

**Browser Requirements**:
- Chrome, Safari, Firefox, or Edge (latest versions)
- JavaScript enabled
- Stable internet connection

**Screen Orientation**:
- **Portrait**: Scoring inputs stacked vertically
- **Landscape**: Scoring inputs in grid layout (recommended)

### First Time Login

After logging in for the first time:

1. Familiarize yourself with the dashboard
2. Review available competitions
3. Test the scoring interface with a practice submission
4. Ensure you understand the scoring dimensions for your competition type

---

## Judge Dashboard

The Judge Dashboard shows:

- **Available Competitions**: Competitions you can score
- **Active Competition**: Currently selected competition (if any)
- **Recent Scores**: Your recent score submissions
- **Quick Actions**: Shortcuts to scoring interface

### Navigation

- **Dashboard**: Overview and competition selection
- **Scoring**: Score submission interface
- **Profile**: Your account information (if available)

---

## Selecting a Competition

### How to Select a Competition

1. From the Judge Dashboard, view the list of available competitions
2. Competitions are organized by:
   - **Region**: Geographical division
   - **Type**: Individual, Duo/Team, or Challenge
   - **Status**: Only "Active" competitions are available for scoring
3. Click on a competition card to select it
4. You will be redirected to the scoring interface

### Competition Information

Each competition card shows:
- **Competition Name**: Event title
- **Type**: Individual Stage, Duo/Team Stage, or Challenge
- **Region**: Geographical division
- **Status**: Active, Upcoming, or Completed
- **Dates**: Start and end dates

### Switching Competitions

To switch to a different competition:
1. Click "Change Competition" button
2. Select a new competition from the list
3. Confirm the switch

**Note**: You can score multiple competitions in the same session.

---

## Scoring Athletes

### Scoring Interface Overview

The scoring interface consists of:
- **Athlete Information**: Name, number, team (if applicable)
- **Score Input Fields**: Dimension-specific input fields
- **Submit Button**: Save and submit scores
- **Navigation**: Previous/Next athlete buttons

### How to Submit Scores

1. **Select Competition**: Ensure correct competition is selected
2. **View Athlete**: Athlete information is displayed at the top
3. **Enter Scores**: Fill in all required score dimensions
4. **Review**: Double-check all scores before submitting
5. **Submit**: Click "Submit Score" button
6. **Confirmation**: Success notification will appear
7. **Next Athlete**: Move to the next athlete

### Score Input Rules

- **Range**: Typically 0-30 per dimension (check competition rules)
- **Decimal Places**: Up to 2 decimal places (e.g., 28.50)
- **Required Fields**: All dimensions must be filled
- **Validation**: System validates scores before submission

### Real-time Updates

- Scores are saved immediately upon submission
- Display screens update in real-time
- You can see other judges' scores (if enabled)
- WebSocket connection ensures instant updates

---

## Score Dimensions

### Individual Stage Competition (5 Dimensions)

#### 1. Action Difficulty (动作难度)
- **Range**: 0-30 points
- **Criteria**: Technical difficulty of movements
- **Consider**: Complexity, risk level, skill requirements

#### 2. Stage Artistry (舞台艺术性)
- **Range**: 0-30 points
- **Criteria**: Artistic expression and stage presence
- **Consider**: Emotion, expression, stage use, audience engagement

#### 3. Action Creativity (动作创意性)
- **Range**: 0-30 points
- **Criteria**: Originality and innovation
- **Consider**: Unique movements, creative combinations, novelty

#### 4. Action Fluency (动作流畅性)
- **Range**: 0-30 points
- **Criteria**: Smoothness and flow of movements
- **Consider**: Transitions, rhythm, continuity, timing

#### 5. Costume Styling (服装造型)
- **Range**: 0-10 points
- **Criteria**: Costume design and presentation
- **Consider**: Appropriateness, aesthetics, theme alignment

**Total Maximum**: 130 points

---

### Duo/Team Stage Competition (5 Dimensions)

#### 1. Action Difficulty (动作难度)
- **Range**: 0-30 points
- **Criteria**: Technical difficulty of movements
- **Consider**: Complexity, synchronization difficulty, skill level

#### 2. Stage Artistry (舞台艺术性)
- **Range**: 0-30 points
- **Criteria**: Artistic expression and stage presence
- **Consider**: Group expression, stage composition, visual impact

#### 3. Action Interaction (动作互动性)
- **Range**: 0-30 points
- **Criteria**: Interaction and coordination between performers
- **Consider**: Synchronization, cooperation, partner work, chemistry

#### 4. Action Creativity (动作创意性)
- **Range**: 0-30 points
- **Criteria**: Originality and innovation
- **Consider**: Unique formations, creative partnerships, novelty

#### 5. Costume Styling (服装造型)
- **Range**: 0-10 points
- **Criteria**: Costume design and coordination
- **Consider**: Team coordination, theme consistency, visual harmony

**Total Maximum**: 130 points

---

### Challenge Competition (3 Dimensions)

#### 1. Action Difficulty (动作难度)
- **Range**: 0-30 points
- **Criteria**: Technical difficulty of movements
- **Consider**: Complexity, risk level, technical requirements

#### 2. Action Creativity (动作创意性)
- **Range**: 0-30 points
- **Criteria**: Originality and innovation
- **Consider**: Unique approaches, creative solutions, novelty

#### 3. Action Fluency (动作流畅性)
- **Range**: 0-30 points
- **Criteria**: Smoothness and flow of movements
- **Consider**: Execution quality, transitions, timing

**Total Maximum**: 90 points

---

## Best Practices

### Before Competition

1. **Test Equipment**: Verify tablet/device is working
2. **Check Connection**: Ensure stable internet connection
3. **Review Criteria**: Familiarize yourself with scoring dimensions
4. **Practice**: Test the scoring interface before the event
5. **Charge Device**: Ensure device is fully charged

### During Competition

1. **Stay Focused**: Concentrate on each performance
2. **Take Notes**: Use paper notes if needed (don't rely on memory)
3. **Be Consistent**: Apply the same standards to all athletes
4. **Submit Promptly**: Submit scores immediately after each performance
5. **Verify Submission**: Check for success notification
6. **Stay Connected**: Monitor WebSocket connection status

### Scoring Guidelines

1. **Be Fair**: Apply criteria objectively and consistently
2. **Use Full Range**: Don't hesitate to use the full 0-30 range
3. **Decimal Precision**: Use decimals to differentiate close performances
4. **Consider Context**: Account for competition level and athlete experience
5. **No Bias**: Score based on performance, not personal preference

### Handling Issues

1. **Connection Lost**: System will attempt to reconnect automatically
2. **Submission Failed**: Wait for reconnection, then resubmit
3. **Wrong Score**: Contact admin immediately (scores cannot be edited by judges)
4. **Technical Issues**: Alert technical support without delay

---

## Troubleshooting

### Cannot Submit Score

**Problem**: Submit button is disabled or error occurs

**Solutions**:
- Verify all required fields are filled
- Check that scores are within valid range
- Ensure you're connected to the internet
- Verify you haven't already scored this athlete
- Refresh the page and try again

### Score Submission Timeout

**Problem**: Submission takes too long or times out

**Solutions**:
- Check internet connection
- Verify backend server is running
- Wait a moment and try again
- Contact technical support if issue persists

### WebSocket Connection Lost

**Problem**: "Connection lost" message appears

**Solutions**:
- System will automatically attempt to reconnect
- Wait 3-10 seconds for reconnection
- Refresh the page if reconnection fails
- Check internet connection
- Contact technical support

### Cannot See Athletes

**Problem**: No athletes appear in the scoring interface

**Solutions**:
- Verify competition is selected
- Check that competition status is "Active"
- Ensure athletes are registered in the competition
- Refresh the page
- Contact admin to verify athlete roster

### Already Scored This Athlete

**Problem**: Error "You have already scored this athlete"

**Solutions**:
- This is expected behavior (one score per judge per athlete)
- If you need to change your score, contact admin
- Move to the next athlete

### Page Not Loading

**Problem**: Scoring page is blank or loading indefinitely

**Solutions**:
- Check internet connection
- Clear browser cache
- Try a different browser
- Verify you're logged in
- Contact technical support

### Scores Not Appearing on Display

**Problem**: Submitted scores don't show on display screens

**Solutions**:
- Verify submission was successful (check for notification)
- Check that display screens are connected
- Verify WebSocket server is running
- Contact technical support

---

## Keyboard Shortcuts

- **Tab**: Move to next input field
- **Enter**: Submit score (when all fields are filled)
- **Esc**: Cancel current action
- **Arrow Keys**: Navigate between athletes (if enabled)

---

## Tips and Tricks

### Efficient Scoring

1. **Use Tab Key**: Quickly navigate between input fields
2. **Prepare Scores**: Have scores ready before opening the form
3. **Batch Entry**: Enter all dimensions quickly, then review
4. **Double-Check**: Always verify before submitting

### Tablet Optimization

1. **Landscape Mode**: Use landscape orientation for better layout
2. **Touch Targets**: Input fields are optimized for touch
3. **Zoom**: Pinch to zoom if needed (not recommended during scoring)
4. **Screen Brightness**: Adjust for venue lighting conditions

### Consistency

1. **Reference Scores**: Keep track of your scoring patterns
2. **Calibration**: Discuss with other judges to align standards
3. **Notes**: Use paper notes for detailed observations
4. **Breaks**: Take breaks between sessions to maintain focus

---

## Competition Etiquette

1. **Punctuality**: Arrive early and be ready to score
2. **Professionalism**: Maintain professional demeanor
3. **Confidentiality**: Keep scores confidential until official announcement
4. **Respect**: Treat all athletes fairly and with respect
5. **Communication**: Coordinate with other judges and organizers

---

## Requirements Satisfied

This judge guide supports:
- **Requirement 1**: Judge authentication (1.1-1.5)
- **Requirement 3**: Individual stage scoring (3.1-3.5)
- **Requirement 4**: Duo/team scoring (4.1-4.5)
- **Requirement 5**: Challenge scoring (5.1-5.5)
- **Requirement 7**: Competition selection (7.1-7.5)
- **Requirement 12**: Tablet responsive layout (12.1-12.5)
- **Requirement 14**: User feedback notifications (14.1-14.5)

---

## Support

For technical issues during competition:
- Alert technical support immediately
- Do not attempt to fix issues yourself
- Document the issue for later review

For scoring questions:
- Consult head judge or competition organizer
- Refer to official competition rules
- Discuss with fellow judges during breaks

For system access issues:
- Contact admin for password reset
- Verify your account is active
- Ensure you have judge role assigned
