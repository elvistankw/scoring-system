# Keyboard Navigation Test Procedures

**Task 28: Theme and Accessibility**  
**Requirement**: 11.5 - Keyboard Navigation Support

## Overview

This document provides step-by-step procedures for testing keyboard navigation across all pages and components in the Realtime Scoring System.

---

## General Keyboard Navigation Standards

### Expected Keyboard Behaviors

| Key | Expected Action |
|-----|----------------|
| **Tab** | Move focus to next interactive element |
| **Shift + Tab** | Move focus to previous interactive element |
| **Enter** | Activate button/link |
| **Space** | Activate button/checkbox |
| **Escape** | Close modal/dropdown |
| **Arrow Keys** | Navigate within dropdowns/lists |
| **Home** | Jump to first item in list |
| **End** | Jump to last item in list |

### Focus Indicators

All interactive elements must have visible focus indicators:
- Default browser outline
- Custom focus ring (e.g., `focus:ring-2 focus:ring-blue-500`)
- Visible in both light and dark themes

---

## Test Procedures by Page

### 1. Authentication Pages

#### Sign In Page (`/sign-in`)

**Tab Order**:
1. Email input field
2. Password input field
3. "Sign In" button
4. "Sign Up" link
5. Theme toggle button

**Test Steps**:
1. Load sign-in page
2. Press **Tab** - focus should move to email input
3. Type email address
4. Press **Tab** - focus should move to password input
5. Type password
6. Press **Tab** - focus should move to "Sign In" button
7. Press **Enter** - form should submit
8. Press **Tab** - focus should move to "Sign Up" link
9. Press **Enter** - should navigate to sign-up page

**Expected Results**:
- [ ] All form fields are keyboard accessible
- [ ] Tab order is logical (top to bottom)
- [ ] Focus indicators are visible
- [ ] Enter key submits form
- [ ] No keyboard traps

#### Sign Up Page (`/sign-up`)

**Tab Order**:
1. Username input
2. Email input
3. Password input
4. Confirm password input
5. Role dropdown
6. "Sign Up" button
7. "Sign In" link
8. Theme toggle button

**Test Steps**:
1. Navigate through all fields using **Tab**
2. Test dropdown navigation with **Arrow Keys**
3. Submit form with **Enter**
4. Verify all fields are accessible

**Expected Results**:
- [ ] All form fields keyboard accessible
- [ ] Dropdown navigable with arrow keys
- [ ] Form submits with Enter
- [ ] Focus indicators visible

---

### 2. Admin Pages

#### Admin Dashboard (`/admin-dashboard`)

**Tab Order**:
1. Navigation menu items
2. "Competition Management" card
3. "Athlete Management" card
4. "Statistics" card
5. Theme toggle button
6. Logout button

**Test Steps**:
1. Press **Tab** to navigate through cards
2. Press **Enter** on each card to verify navigation
3. Test theme toggle with **Enter**
4. Test logout with **Enter**

**Expected Results**:
- [ ] All cards are keyboard accessible
- [ ] Cards activate with Enter key
- [ ] Navigation is logical
- [ ] Focus indicators visible

#### Competition Management

**Tab Order**:
1. "Create Competition" button
2. Competition list items
3. Edit buttons
4. Delete buttons
5. Add athlete buttons

**Form Tab Order** (when creating/editing):
1. Competition name input
2. Competition type dropdown
3. Region input
4. Submit button
5. Cancel button

**Test Steps**:
1. Navigate to competition list
2. Press **Tab** to move through competitions
3. Press **Enter** on "Create Competition"
4. Navigate through form fields
5. Test dropdown with **Arrow Keys**
6. Submit with **Enter**
7. Cancel with **Escape**

**Expected Results**:
- [ ] All buttons keyboard accessible
- [ ] Form fields navigable
- [ ] Dropdowns work with arrow keys
- [ ] Modal closes with Escape
- [ ] Focus returns to trigger element after modal closes

#### Athlete Management

**Tab Order**:
1. "Add Athlete" button
2. Search input
3. Athlete list items
4. Edit buttons
5. Delete buttons

**Form Tab Order**:
1. Athlete name input
2. Region dropdown
3. Submit button
4. Cancel button

**Test Steps**:
1. Navigate athlete list with **Tab**
2. Test search input
3. Open add athlete form
4. Navigate form fields
5. Submit and cancel

**Expected Results**:
- [ ] Search input keyboard accessible
- [ ] List items navigable
- [ ] Form accessible
- [ ] Modal keyboard friendly

---

### 3. Judge Pages

#### Judge Dashboard (`/judge-dashboard`)

**Tab Order**:
1. Welcome message
2. "Start Scoring" button
3. Competition list
4. Theme toggle
5. Logout button

**Test Steps**:
1. Navigate with **Tab**
2. Activate "Start Scoring" with **Enter**
3. Test theme toggle
4. Test logout

**Expected Results**:
- [ ] All interactive elements accessible
- [ ] Buttons activate with Enter
- [ ] Focus indicators visible

#### Scoring Page (`/scoring`)

**Tab Order**:
1. Competition selector dropdown
2. Athlete list items
3. Score dimension inputs (5 for Individual/Duo, 3 for Challenge)
4. Submit button
5. Clear button
6. Theme toggle

**Test Steps**:
1. Press **Tab** to competition selector
2. Use **Arrow Keys** to select competition
3. Press **Tab** to athlete list
4. Use **Arrow Keys** to select athlete
5. Press **Tab** through score inputs
6. Enter scores using keyboard
7. Press **Tab** to submit button
8. Press **Enter** to submit

**Expected Results**:
- [ ] Competition selector keyboard accessible
- [ ] Athlete selection works with keyboard
- [ ] All score inputs accessible
- [ ] Number inputs accept keyboard input
- [ ] Submit button activates with Enter
- [ ] Clear button works with keyboard
- [ ] Focus management after submission

**Score Input Testing**:
```
For each score dimension:
1. Tab to input field
2. Type numeric value
3. Verify value is accepted
4. Tab to next field
5. Verify focus moves correctly
```

---

### 4. Display Pages

#### Scoreboard (`/scoreboard`)

**Tab Order**:
1. Competition filter dropdown
2. Region filter dropdown
3. Score cards (read-only, may not be focusable)
4. Theme toggle

**Test Steps**:
1. Navigate filters with **Tab**
2. Use **Arrow Keys** in dropdowns
3. Test theme toggle
4. Verify score display updates

**Expected Results**:
- [ ] Filter dropdowns keyboard accessible
- [ ] Dropdowns work with arrow keys
- [ ] Theme toggle accessible
- [ ] No keyboard traps

#### Rankings (`/rankings`)

**Tab Order**:
1. Competition selector
2. Region filter
3. Ranking table (may be read-only)
4. Theme toggle

**Test Steps**:
1. Navigate selectors with **Tab**
2. Use **Arrow Keys** in dropdowns
3. Test theme toggle

**Expected Results**:
- [ ] All filters keyboard accessible
- [ ] Table is readable (may not need focus)
- [ ] Theme toggle works

---

## Component-Specific Tests

### Theme Toggle Button

**Test Steps**:
1. Press **Tab** until theme toggle is focused
2. Verify focus indicator is visible
3. Press **Enter** or **Space**
4. Verify theme changes
5. Verify focus remains on button

**Expected Results**:
- [ ] Button is keyboard accessible
- [ ] Focus indicator visible in both themes
- [ ] Enter key toggles theme
- [ ] Space key toggles theme
- [ ] ARIA label is present
- [ ] Button state updates visually

**ARIA Attributes**:
```html
<button
  aria-label="切换到深色模式"
  title="切换到深色模式"
  role="button"
>
```

### Dropdown Menus

**Test Steps**:
1. **Tab** to dropdown trigger
2. Press **Enter** or **Space** to open
3. Use **Arrow Down** to move to first option
4. Use **Arrow Up/Down** to navigate options
5. Press **Enter** to select
6. Press **Escape** to close without selecting

**Expected Results**:
- [ ] Dropdown opens with Enter/Space
- [ ] Arrow keys navigate options
- [ ] Enter selects option
- [ ] Escape closes dropdown
- [ ] Focus returns to trigger after close

### Modal Dialogs

**Test Steps**:
1. Open modal (e.g., create competition form)
2. Verify focus moves to modal
3. Press **Tab** to navigate modal content
4. Verify focus stays within modal (focus trap)
5. Press **Escape** to close
6. Verify focus returns to trigger element

**Expected Results**:
- [ ] Focus moves to modal on open
- [ ] Tab cycles within modal only
- [ ] Escape closes modal
- [ ] Focus returns to trigger
- [ ] Background content not accessible while modal open

### Form Inputs

**Test Steps**:
1. **Tab** to input field
2. Type value
3. Press **Tab** to next field
4. Verify validation messages are announced
5. Test error states

**Expected Results**:
- [ ] All inputs keyboard accessible
- [ ] Labels associated with inputs
- [ ] Validation errors announced
- [ ] Required fields indicated
- [ ] Error messages visible

**ARIA Attributes**:
```html
<input
  aria-label="Competition Name"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="error-message"
/>
```

---

## Accessibility Testing Tools

### Browser Extensions

1. **axe DevTools** (Chrome/Firefox)
   - Automated accessibility scanning
   - Keyboard navigation testing
   - ARIA attribute validation

2. **WAVE** (Chrome/Firefox)
   - Visual accessibility feedback
   - Keyboard navigation issues
   - Focus order visualization

3. **Lighthouse** (Chrome DevTools)
   - Accessibility audit
   - Best practices
   - Performance metrics

### Manual Testing Tools

1. **Tab Key Navigation**
   - Most important test
   - Reveals focus order issues
   - Tests keyboard traps

2. **Screen Reader Testing**
   - NVDA (Windows, free)
   - JAWS (Windows, paid)
   - VoiceOver (macOS, built-in)

3. **Keyboard Only Challenge**
   - Unplug mouse
   - Complete all tasks using keyboard only
   - Reveals usability issues

---

## Common Keyboard Navigation Issues

### Issue: Focus Not Visible

**Problem**: Focus indicator is too subtle or missing.

**Solution**: Add visible focus styles:
```tsx
className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
```

### Issue: Keyboard Trap

**Problem**: User cannot Tab out of a component.

**Solution**: Ensure all interactive elements are in tab order and Escape key works.

### Issue: Illogical Tab Order

**Problem**: Tab order doesn't follow visual layout.

**Solution**: 
- Use semantic HTML
- Avoid positive `tabindex` values
- Ensure DOM order matches visual order

### Issue: Dropdown Not Keyboard Accessible

**Problem**: Dropdown requires mouse to open/navigate.

**Solution**: Implement keyboard handlers:
```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    toggleDropdown();
  }
  if (e.key === 'ArrowDown') {
    navigateNext();
  }
  if (e.key === 'ArrowUp') {
    navigatePrevious();
  }
}}
```

### Issue: Modal Doesn't Trap Focus

**Problem**: Tab key moves focus outside modal.

**Solution**: Use focus trap library or implement manually:
```tsx
import { FocusTrap } from '@headlessui/react';

<FocusTrap>
  <div role="dialog" aria-modal="true">
    {/* Modal content */}
  </div>
</FocusTrap>
```

---

## Automated Keyboard Testing

### Vitest + Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('keyboard navigation works', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  // Tab to button
  await user.tab();
  expect(screen.getByRole('button')).toHaveFocus();
  
  // Activate with Enter
  await user.keyboard('{Enter}');
  expect(mockHandler).toHaveBeenCalled();
});
```

### Playwright E2E Testing

```typescript
test('keyboard navigation', async ({ page }) => {
  await page.goto('/scoring');
  
  // Tab through elements
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="email"]')).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="password"]')).toBeFocused();
  
  // Submit with Enter
  await page.keyboard.press('Enter');
});
```

---

## Acceptance Criteria Checklist

### Requirement 11.5: Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and follows visual layout
- [ ] Focus indicators are visible in both light and dark themes
- [ ] Enter/Space keys activate buttons and links
- [ ] Arrow keys navigate dropdowns and lists
- [ ] Escape key closes modals and dropdowns
- [ ] No keyboard traps exist
- [ ] Focus management works correctly (modals, forms)
- [ ] ARIA labels are present and descriptive
- [ ] Skip links provided for long navigation (if applicable)

---

## Quick Test Script

Use this script to quickly test keyboard navigation on any page:

1. **Load page**
2. **Press Tab repeatedly** - verify focus moves logically
3. **Press Shift+Tab** - verify reverse navigation works
4. **Press Enter on buttons** - verify activation
5. **Press Escape on modals** - verify closing
6. **Use Arrow keys in dropdowns** - verify navigation
7. **Complete a full task using keyboard only** - verify usability

---

## Conclusion

Keyboard navigation is essential for accessibility. All interactive elements must be keyboard accessible, have visible focus indicators, and follow logical tab order.

**Status**: ✅ Keyboard navigation verification procedures documented and ready for testing.
