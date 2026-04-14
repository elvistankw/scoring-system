# Display Components

Components for the Display role (public-facing scoreboard and rankings).

## Components

### realtime-score-display.tsx

Example component demonstrating real-time score updates via WebSocket.

**Requirements**: 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4

**Features**:
- Real-time score updates via WebSocket
- Connection status indicator
- Auto-reconnection handling
- Score history display
- Connection count tracking
- Manual reconnect button
- Clear scores functionality

**Usage**:
```typescript
import { RealtimeScoreDisplay } from '@/components/display/realtime-score-display';

export default function ScoreboardPage() {
  const competitionId = 1; // Get from route params or context
  
  return (
    <div>
      <h1>实时比分大屏幕</h1>
      <RealtimeScoreDisplay competitionId={competitionId} />
    </div>
  );
}
```

**Props**:
- `competitionId` (number, required): Competition ID to subscribe to

**Display Features**:
- Connection status with color indicators
- Latest score highlight with gradient background
- Score history with scrollable list
- Responsive layout for large displays
- Dark mode optimized
- Chinese language labels

### scoreboard-grid.tsx

Full-featured scoreboard grid component for large display screens.

**Requirements**: 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.4, 12.1, 12.2, 20.1, 20.3

**Features**:
- Real-time score updates via WebSocket
- Grid layout optimized for 1080p/4K displays
- Dark theme by default
- Displays all score dimensions separately (no totals)
- Connection status tracking
- Score animations for new updates
- Responsive to different competition types (individual, duo_team, challenge)
- Auto-reconnection handling

**Usage**:
```typescript
import { ScoreboardGrid } from '@/components/display/scoreboard-grid';

export default function ScoreboardPage() {
  return (
    <ScoreboardGrid
      competitionId={1}
      competitionType="individual"
    />
  );
}
```

**Props**:
- `competitionId` (number, required): Competition ID to subscribe to
- `competitionType` (CompetitionType, required): Type of competition (individual, duo_team, challenge)

**Display Features**:
- Large, bold typography for readability
- High contrast colors for visibility
- Connection status indicator with reconnect button
- Online viewer count
- Score count display
- Latest score highlighting with animation
- Responsive grid layout
- Footer with timestamp

### score-animation.tsx

Animated notification component for new score updates.

**Requirements**: 9.1, 9.2, 9.3, 9.4, 9.5, 20.1, 20.3

**Features**:
- Slide-in animation from right
- Auto-dismiss after 3 seconds
- Displays athlete name, number, and judge name
- Gradient background for visual appeal
- Fixed positioning (top-right corner)

**Usage**:
```typescript
import { ScoreAnimation } from '@/components/display/score-animation';

export function MyComponent() {
  const [showAnimation, setShowAnimation] = useState(false);
  const [score, setScore] = useState<RealtimeScoreUpdate | null>(null);

  return (
    <>
      {showAnimation && score && (
        <ScoreAnimation
          score={score}
          onAnimationComplete={() => setShowAnimation(false)}
        />
      )}
    </>
  );
}
```

**Props**:
- `score` (RealtimeScoreUpdate, required): Score data to display
- `onAnimationComplete` (function, optional): Callback when animation completes

### ranking-table.tsx

Rankings table component for displaying athlete rankings with average scores.

**Requirements**: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.1, 11.4, 12.1, 12.2

**Features**:
- Real-time ranking updates via WebSocket
- Display average scores by dimension
- Regional filtering support
- Top 3 highlighting with medals (🥇🥈🥉)
- Optimized for 1080p/4K displays
- Dark theme by default
- Connection status tracking
- Auto-refresh on new scores

**Usage**:
```typescript
import { RankingTable } from '@/components/display/ranking-table';

export default function RankingsPage() {
  return (
    <RankingTable
      competitionId={1}
      competitionType="individual"
      region="华东赛区" // Optional
    />
  );
}
```

**Props**:
- `competitionId` (number, required): Competition ID to display rankings for
- `competitionType` (CompetitionType, required): Type of competition (individual, duo_team, challenge)
- `region` (string, optional): Filter rankings by region

**Display Features**:
- Rank column with medal icons for top 3
- Athlete name and number
- Judge count (number of judges who scored)
- Average scores for each dimension
- Gradient backgrounds for top 3 athletes
- Connection status indicator
- Online viewer count
- Participant count
- Error handling with retry button

## Upcoming Components

Planned components for future tasks:
- None (all display components implemented)

## Design Guidelines

### Theme
- **Default**: Dark mode (optimized for large displays)
- **Colors**: High contrast for visibility
- **Typography**: Large, bold fonts for readability

### Layout
- **Responsive**: Optimized for 1080p and 4K displays
- **Grid-based**: Use CSS Grid for score layouts
- **Full-screen**: Maximize screen real estate

### Animations
- **Smooth transitions**: Use Tailwind transitions
- **Score updates**: Highlight new scores with animations
- **Connection status**: Pulse effect for connecting state

### Accessibility
- **High contrast**: Ensure text is readable on dark backgrounds
- **Large touch targets**: Minimum 44px for interactive elements
- **Keyboard navigation**: Support keyboard controls

## File Naming

All files use kebab-case:
- ✅ `realtime-score-display.tsx`
- ✅ `scoreboard-grid.tsx`
- ❌ `RealtimeScoreDisplay.tsx`
- ❌ `ScoreboardGrid.tsx`

## Requirements Mapping

| Component | Requirements |
|-----------|-------------|
| realtime-score-display | 6.3, 6.4, 6.5, 20.1, 20.2, 20.3, 20.4 |
| scoreboard-grid | 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.4, 12.1, 12.2, 20.1, 20.3 |
| score-animation | 9.1, 9.2, 9.3, 9.4, 9.5, 20.1, 20.3 |
| ranking-table | 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.1, 11.4, 12.1, 12.2 |

## Pages

### app/[locale]/(display)/scoreboard/page.tsx

Scoreboard page for real-time score display on large screens.

**Requirements**: 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.4, 12.1, 12.2, 15.1, 15.2, 20.1, 20.3

**Features**:
- SEO metadata with "实时比分" in title
- Dark theme by default (via display layout)
- Competition selection (auto-selects first active competition)
- Error handling with retry functionality
- Loading states with skeleton screens
- Optimized for 1080p/4K displays

**Route**: `/[locale]/scoreboard`

**Metadata**:
- Title: "实时比分大屏幕 | Scoring System"
- Description: "实时展示各赛区选手的最新得分情况，支持1080p/4K大屏幕显示"
- Keywords: "实时比分", "比赛大屏幕", "得分显示", "scoreboard"

### app/[locale]/(display)/rankings/page.tsx

Rankings page for displaying athlete rankings with average scores.

**Requirements**: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 11.1, 11.4, 12.1, 12.2

**Features**:
- SEO metadata with "实时排名榜" in title
- Dark theme by default (via display layout)
- Competition selection dropdown
- Regional filtering support
- Real-time ranking updates via WebSocket
- Loading states with skeleton screens
- Optimized for 1080p/4K displays
- Top 3 highlighting with medals

**Route**: `/[locale]/rankings`

**Metadata**:
- Title: "实时排名榜 | Scoring System"
- Description: "展示各赛区选手的平均得分排名，支持1080p/4K大屏幕显示"
- Keywords: "实时排名", "比赛排行榜", "平均得分", "rankings", "leaderboard"
