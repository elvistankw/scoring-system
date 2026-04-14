# Theme and Accessibility - Quick Reference

**Task 28 Deliverables** | Requirements: 11.1, 11.2, 11.3, 11.4, 11.5

---

## Quick Commands

```bash
# Run theme tests
npm test -- theme-provider.test.tsx

# Run accessibility audit
npm run audit:accessibility

# Run all tests
npm test

# Check for missing dark mode classes
grep -r "bg-white" components/ --include="*.tsx" | grep -v "dark:"
```

---

## Theme Usage

### Using the Theme Hook

```tsx
import { useTheme } from '@/components/shared/theme-provider';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // Get current theme: 'light' | 'dark' | 'system'
  console.log(theme);
  
  // Get resolved theme: 'light' | 'dark'
  console.log(resolvedTheme);
  
  // Change theme
  setTheme('dark');
}
```

### Adding Theme Toggle

```tsx
import { ThemeToggle } from '@/components/shared/theme-provider';

function MyLayout() {
  return (
    <nav>
      <ThemeToggle />
    </nav>
  );
}
```

### Styling Components for Dark Mode

```tsx
// ✅ Correct - supports both themes
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content
</div>

// ❌ Wrong - no dark mode support
<div className="bg-white text-gray-900">
  Content
</div>
```

---

## Role-Specific Defaults

| Role | Default Theme | Implementation |
|------|---------------|----------------|
| Judge | Light | System default |
| Admin | Light | System default |
| Display | Dark | `className="dark"` in layout |

### Force Dark Mode (Display Pages)

```tsx
// app/[locale]/(display)/layout.tsx
export default function DisplayLayout({ children }) {
  return (
    <div className="dark min-h-screen bg-gray-900">
      {children}
    </div>
  );
}
```

---

## Common Patterns

### Card Component

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
    Title
  </h2>
  <p className="text-gray-600 dark:text-gray-400">
    Description
  </p>
</div>
```

### Button Component

```tsx
<button className="
  bg-blue-600 hover:bg-blue-700 
  dark:bg-blue-500 dark:hover:bg-blue-600
  text-white
  px-4 py-2 rounded-lg
  focus:ring-2 focus:ring-blue-500
">
  Click Me
</button>
```

### Input Component

```tsx
<input
  className="
    bg-white dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    text-gray-900 dark:text-gray-100
    focus:ring-2 focus:ring-blue-500
    rounded-lg px-4 py-2
  "
  aria-label="Input field"
/>
```

---

## Keyboard Navigation

### Essential Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Next element |
| Shift+Tab | Previous element |
| Enter | Activate button/link |
| Space | Activate button |
| Escape | Close modal |
| Arrow Keys | Navigate dropdown |

### Making Elements Keyboard Accessible

```tsx
// Button
<button
  onClick={handleClick}
  aria-label="Descriptive label"
  className="focus:ring-2 focus:ring-blue-500"
>
  Click
</button>

// Custom interactive element
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  aria-label="Descriptive label"
  className="focus:ring-2 focus:ring-blue-500"
>
  Custom Button
</div>
```

---

## Testing Checklist

### Before Committing

- [ ] Run `npm test -- theme-provider.test.tsx`
- [ ] Run `npm run audit:accessibility`
- [ ] Manually test theme toggle
- [ ] Test keyboard navigation
- [ ] Verify focus indicators visible

### For New Components

- [ ] Add `dark:` classes for all colors
- [ ] Add focus styles (`focus:ring-2`)
- [ ] Add ARIA labels for interactive elements
- [ ] Test with keyboard only
- [ ] Verify in both light and dark themes

---

## Troubleshooting

### Theme doesn't persist

```javascript
// Check localStorage
console.log(localStorage.getItem('scoring-system-theme'));

// Clear and reset
localStorage.removeItem('scoring-system-theme');
```

### Flash of wrong theme

Ensure `suppressHydrationWarning` is set:
```tsx
<html lang={locale} suppressHydrationWarning>
```

### Component not updating theme

Add `dark:` classes:
```tsx
// Before
className="bg-white text-gray-900"

// After
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

---

## Documentation

- **Full Guide**: `THEME_ACCESSIBILITY_VERIFICATION.md`
- **Keyboard Tests**: `KEYBOARD_NAVIGATION_TEST.md`
- **Completion Summary**: `TASK_28_COMPLETION_SUMMARY.md`
- **Tests**: `components/shared/__tests__/theme-provider.test.tsx`
- **Audit Script**: `scripts/accessibility-audit.js`

---

## Requirements Coverage

✅ **11.1**: Light and dark theme support  
✅ **11.2**: Theme toggle < 100ms  
✅ **11.3**: Theme persistence  
✅ **11.4**: Role-specific defaults  
✅ **11.5**: Keyboard navigation  

**Status**: All requirements verified and tested
