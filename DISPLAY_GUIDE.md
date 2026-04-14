# Display Screen Guide - Realtime Scoring System

Welcome to the Realtime Scoring System Display Guide. This guide will help you set up and operate display screens for real-time score broadcasting.

## Table of Contents

1. [Overview](#overview)
2. [Hardware Requirements](#hardware-requirements)
3. [Display Setup](#display-setup)
4. [Scoreboard Display](#scoreboard-display)
5. [Rankings Display](#rankings-display)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Overview

The Display interface provides two main views:

1. **Scoreboard**: Real-time score updates as judges submit scores
2. **Rankings**: Current standings and leaderboard

Both displays update automatically via WebSocket connections without page refresh.

### Key Features

- **Real-time Updates**: Scores appear instantly when submitted
- **Dark Theme**: Optimized for large screens and projectors
- **Auto-Reconnect**: Automatically reconnects if connection is lost
- **No Authentication**: Public display, no login required
- **Responsive Layout**: Adapts to different screen sizes

---

## Hardware Requirements

### Display Devices

**Recommended**:
- Large LED/LCD display (55" or larger)
- Projector (1080p or 4K)
- Smart TV with web browser
- Computer with HDMI output

**Minimum Requirements**:
- 1920x1080 resolution (Full HD)
- Web browser support (Chrome, Firefox, Safari, Edge)
- Stable network connection

### Computer/Media Player

**Options**:
- Desktop computer
- Laptop
- Raspberry Pi 4 or similar
- Android TV box
- Apple TV with browser app

**Specifications**:
- CPU: Dual-core or better
- RAM: 2GB minimum, 4GB recommended
- Network: Ethernet preferred, WiFi acceptable
- Browser: Latest version of Chrome, Firefox, or Safari

### Network Requirements

- **Bandwidth**: 5 Mbps minimum, 10 Mbps recommended
- **Latency**: <100ms to backend server
- **Connection**: Wired Ethernet preferred for stability
- **Firewall**: Allow WebSocket connections (port 5000 or custom)

---

## Display Setup

### Initial Setup

1. **Connect Display Device**
   - Connect display to computer/media player via HDMI
   - Power on display and select correct input source
   - Adjust display settings (brightness, contrast)

2. **Configure Computer**
   - Connect to network (Ethernet preferred)
   - Open web browser
   - Navigate to application URL
   - Set browser to fullscreen mode

3. **Access Display Interface**
   - Go to `/scoreboard` for real-time scores
   - Go to `/rankings` for leaderboard
   - No login required

### Browser Configuration

#### Chrome (Recommended)

1. Open Chrome
2. Navigate to display URL
3. Press **F11** for fullscreen
4. Disable sleep mode:
   - Install "Keep Awake" extension
   - Or adjust system power settings

#### Firefox

1. Open Firefox
2. Navigate to display URL
3. Press **F11** for fullscreen
4. Disable screen timeout in system settings

#### Safari (macOS)

1. Open Safari
2. Navigate to display URL
3. View → Enter Full Screen
4. System Preferences → Energy Saver → Prevent sleep

### Kiosk Mode Setup

For dedicated display computers, set up kiosk mode:

#### Windows

```batch
# Create shortcut with kiosk mode
chrome.exe --kiosk --app=http://your-url/scoreboard
```

#### macOS

```bash
# Launch Chrome in kiosk mode
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --app=http://your-url/scoreboard
```

#### Linux

```bash
# Launch Chromium in kiosk mode
chromium-browser --kiosk --app=http://your-url/scoreboard
```

### Auto-Start Configuration

#### Windows

1. Create Chrome kiosk shortcut
2. Place shortcut in Startup folder:
   - Press `Win + R`
   - Type `shell:startup`
   - Copy shortcut to folder

#### macOS

1. System Preferences → Users & Groups
2. Select user → Login Items
3. Add Chrome with kiosk mode script

#### Linux (systemd)

Create `/etc/systemd/system/display-kiosk.service`:

```ini
[Unit]
Description=Display Kiosk
After=network.target

[Service]
Type=simple
User=display
Environment=DISPLAY=:0
ExecStart=/usr/bin/chromium-browser --kiosk --app=http://your-url/scoreboard
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable display-kiosk
sudo systemctl start display-kiosk
```

---

## Scoreboard Display

### Features

- **Latest Scores**: Shows most recent score submissions
- **Athlete Information**: Name, number, team (if applicable)
- **Judge Information**: Judge name who submitted the score
- **Score Dimensions**: All scoring dimensions displayed
- **Timestamp**: When the score was submitted
- **Animation**: Smooth transitions when new scores appear

### Display Layout

**Grid Layout**:
- Multiple score cards displayed simultaneously
- Most recent scores at the top
- Automatic scrolling for older scores
- Color-coded by competition type

**Information Displayed**:
- Athlete name and number
- Judge name
- All score dimensions with values
- Submission timestamp
- Competition type indicator

### Real-time Updates

- New scores appear automatically
- Smooth fade-in animation
- No page refresh required
- WebSocket connection status indicator
- Auto-reconnect on connection loss

### Connection Status

**Indicators**:
- 🟢 **Connected**: Green indicator, receiving updates
- 🟡 **Reconnecting**: Yellow indicator, attempting reconnection
- 🔴 **Disconnected**: Red indicator, connection lost

**Auto-Reconnect**:
- Attempts reconnection every 3 seconds
- Maximum 10 reconnection attempts
- Fetches latest scores after reconnection

---

## Rankings Display

### Features

- **Leaderboard**: Current standings for selected competition
- **Athlete Rankings**: Sorted by average score
- **Score Breakdown**: Individual dimension scores
- **Judge Count**: Number of judges who scored each athlete
- **Real-time Updates**: Rankings update as new scores arrive

### Display Layout

**Table Layout**:
- Rank number
- Athlete name and number
- Score dimensions
- Average total score
- Number of judges

**Sorting**:
- Default: By average total score (descending)
- Can be configured to sort by specific dimensions

### Filtering

- **By Competition**: Select specific competition
- **By Region**: Filter by geographical region
- **Top N**: Show top 10, 20, or all athletes

---

## Troubleshooting

### Display Not Showing Scores

**Problem**: Scoreboard is blank or not updating

**Solutions**:
1. Check internet connection
2. Verify backend server is running
3. Check WebSocket connection status indicator
4. Refresh the page (F5)
5. Clear browser cache and reload
6. Verify correct URL is loaded

### Connection Lost Frequently

**Problem**: WebSocket disconnects repeatedly

**Solutions**:
1. Use wired Ethernet instead of WiFi
2. Check network stability
3. Verify firewall allows WebSocket connections
4. Check backend server logs
5. Increase WebSocket timeout settings
6. Contact network administrator

### Scores Delayed

**Problem**: Scores appear several seconds late

**Solutions**:
1. Check network latency (ping backend server)
2. Verify backend server performance
3. Check Redis cache is working
4. Reduce network congestion
5. Use wired connection

### Display Goes to Sleep

**Problem**: Screen turns off after inactivity

**Solutions**:
1. Disable screen saver in system settings
2. Disable sleep mode in power settings
3. Install browser extension to prevent sleep
4. Use kiosk mode with no-sleep flags
5. Adjust display's own power settings

### Browser Crashes

**Problem**: Browser closes or becomes unresponsive

**Solutions**:
1. Update browser to latest version
2. Clear browser cache and cookies
3. Disable unnecessary browser extensions
4. Increase system RAM if possible
5. Use Chrome instead of other browsers
6. Set up auto-restart script

### Wrong Competition Displayed

**Problem**: Showing scores from wrong competition

**Solutions**:
1. Verify correct URL with competition ID
2. Check URL parameters
3. Refresh the page
4. Contact admin to verify competition setup

### Display Resolution Issues

**Problem**: Layout doesn't fit screen properly

**Solutions**:
1. Adjust display resolution to 1920x1080
2. Use browser zoom (Ctrl + 0 to reset)
3. Check display scaling settings
4. Verify HDMI connection
5. Adjust display aspect ratio

---

## Best Practices

### Before Event

1. **Test Setup**: Test display 24 hours before event
2. **Verify Connection**: Ensure stable network connection
3. **Check Display**: Verify display is working properly
4. **Backup Plan**: Have backup display device ready
5. **Contact Info**: Have technical support contact information

### During Event

1. **Monitor Connection**: Watch connection status indicator
2. **Stay Alert**: Monitor for any display issues
3. **Quick Response**: Address issues immediately
4. **Backup Display**: Have secondary display ready
5. **Communication**: Maintain contact with technical team

### After Event

1. **Close Browser**: Exit fullscreen and close browser
2. **Power Down**: Properly shut down computer and display
3. **Document Issues**: Note any problems for future reference
4. **Feedback**: Provide feedback to technical team

### Maintenance

1. **Regular Updates**: Keep browser and OS updated
2. **Clean Cache**: Clear browser cache periodically
3. **Check Hardware**: Inspect cables and connections
4. **Test Regularly**: Test display setup before each event
5. **Backup Config**: Save browser and system configurations

---

## Advanced Configuration

### Multiple Displays

To run multiple displays:

1. **Same Competition**:
   - Use same URL on all displays
   - All will show identical content
   - Useful for different viewing angles

2. **Different Competitions**:
   - Use different URLs with competition IDs
   - Each display shows different competition
   - Useful for multi-competition events

3. **Mixed Views**:
   - Some displays show scoreboard
   - Others show rankings
   - Provides comprehensive information

### Custom Styling

For custom branding or styling:

1. Contact development team
2. Provide logo and color scheme
3. Custom CSS can be applied
4. Maintain dark theme for readability

### URL Parameters

```
# Scoreboard for specific competition
/scoreboard?competition=1

# Rankings for specific competition
/rankings?competition=1

# Filter by region
/rankings?competition=1&region=East

# Show top N athletes
/rankings?competition=1&limit=10
```

---

## Technical Specifications

### WebSocket Connection

- **Protocol**: Socket.io
- **Transport**: WebSocket (fallback to polling)
- **Reconnection**: Automatic with exponential backoff
- **Timeout**: 3 seconds between attempts
- **Max Attempts**: 10 reconnections

### Performance

- **Update Latency**: <100ms from score submission
- **Render Time**: <50ms for score display
- **Memory Usage**: <200MB typical
- **CPU Usage**: <10% on modern hardware

### Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |

---

## Requirements Satisfied

This display guide supports:
- **Requirement 6**: Real-time score broadcasting (6.1-6.5)
- **Requirement 9**: Score display without totals (9.1-9.5)
- **Requirement 11**: Dark theme support (11.4)
- **Requirement 13**: Loading state feedback (13.1-13.5)
- **Requirement 15**: SEO metadata (15.2)
- **Requirement 20**: WebSocket connection management (20.1-20.5)

---

## Support

### Technical Support

For technical issues:
- Contact system administrator
- Check backend server status
- Review network connectivity
- Consult deployment documentation

### Hardware Support

For hardware issues:
- Check display manufacturer documentation
- Verify cable connections
- Test with different computer/media player
- Contact hardware vendor

### Emergency Contacts

Keep these contacts readily available:
- System Administrator: [Contact Info]
- Network Administrator: [Contact Info]
- Technical Support: [Contact Info]
- Event Coordinator: [Contact Info]
