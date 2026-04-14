# Judge Components

This directory contains components for the judge scoring interface.

## Components

### competition-selector.tsx
Competition selection component for judge dashboard.

**Props:**
- `onSelect: (competition: Competition) => void` - Callback when competition is selected
- `selectedCompetition?: Competition | null` - Currently selected competition

**Features:**
- Displays all available competitions in a grid layout
- Filter by status (upcoming, active, completed)
- Filter by region (dynamic based on available competitions)
- Filter by competition type (individual, duo_team, challenge)
- Visual feedback for selected competition
- Loading skeleton during data fetch
- Error handling with user-friendly messages
- Responsive grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
- Dark mode support
- Touch-optimized cards with hover effects

**Requirements:** 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 13.1, 13.2, 14.1, 14.2, 18.1, 18.2, 18.3

---

### athlete-card.tsx
Displays athlete information in a selectable card format.

**Props:**
- `athlete: Athlete` - Athlete data to display
- `onSelect: () => void` - Callback when card is selected
- `isSelected: boolean` - Whether this athlete is currently selected

**Features:**
- Touch-optimized (44px minimum height)
- Visual feedback for selection state
- Displays athlete name, number, and team name
- Dark mode support

**Requirements:** 7.2, 7.3, 12.1, 12.2, 12.3, 12.4, 12.5

---

### score-input-form.tsx
Dynamic scoring form that adapts to competition type.

**Props:**
- `competition: Competition` - Competition being scored
- `athlete: Athlete` - Athlete being scored
- `onSubmitSuccess: () => void` - Callback after successful submission

**Features:**
- Dynamic fields based on competition type:
  - Individual: 5 fields (difficulty, artistry, creativity, fluency, costume)
  - Duo/Team: 5 fields (difficulty, artistry, interaction, creativity, costume)
  - Challenge: 3 fields (difficulty, creativity, fluency)
- Score validation (0-30 range)
- Required field validation
- Loading states during submission
- Sonner toast notifications
- Touch-optimized inputs (44px minimum height)
- Tablet-responsive layout (grid on landscape, stack on portrait)
- Dark mode support

**Requirements:** 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 12.1, 12.2, 12.3, 12.4, 12.5, 14.1, 14.2, 14.3

---

## Usage Example

```tsx
import { useState } from 'react';
import { CompetitionSelector } from '@/components/judge/competition-selector';
import { AthleteCard } from '@/components/judge/athlete-card';
import { ScoreInputForm } from '@/components/judge/score-input-form';

function JudgeDashboard() {
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  
  return (
    <div>
      {/* Competition Selection */}
      <CompetitionSelector
        onSelect={setSelectedCompetition}
        selectedCompetition={selectedCompetition}
      />
    </div>
  );
}

function ScoringPage() {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  
  return (
    <div>
      {/* Athlete Selection */}
      {athletes.map(athlete => (
        <AthleteCard
          key={athlete.id}
          athlete={athlete}
          onSelect={() => setSelectedAthlete(athlete)}
          isSelected={selectedAthlete?.id === athlete.id}
        />
      ))}
      
      {/* Score Input */}
      {selectedAthlete && (
        <ScoreInputForm
          competition={competition}
          athlete={selectedAthlete}
          onSubmitSuccess={() => setSelectedAthlete(null)}
        />
      )}
    </div>
  );
}
```

## Design Principles

1. **Touch-First**: All interactive elements meet 44px minimum touch target
2. **Responsive**: Optimized for tablet devices (iPad)
3. **Accessible**: Clear labels, proper contrast, keyboard navigation
4. **Feedback**: Immediate visual and toast feedback for all actions
5. **Validation**: Client-side validation before API submission
6. **Theme Support**: Full light/dark mode support

## API Integration

Components use:
- `API_ENDPOINTS.scores.submit` for score submission
- `getAuthHeaders()` for JWT authentication
- Sonner for user feedback notifications

## Testing

See `app/[locale]/(judge)/scoring/__tests__/` for component tests.
