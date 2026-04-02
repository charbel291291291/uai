# UAi Accessibility Guide

This document outlines the accessibility features implemented in UAi and provides guidance for maintaining accessibility standards.

## Implemented Features

### 1. Keyboard Navigation

- **Focus Management**: All interactive elements are keyboard accessible
- **Focus Trap**: Modals trap focus within their content
- **Skip Links**: Users can skip to main content using keyboard
- **Arrow Key Navigation**: Lists support arrow key navigation

### 2. ARIA Labels & Roles

All UI components include proper ARIA attributes:

```tsx
// Button with ARIA support
<Button 
  ariaLabel="Close dialog"
  ariaPressed={isOpen}
  ariaExpanded={isExpanded}
>
  Close
</Button>

// Input with proper labeling
<Input
  label="Email"
  ariaDescribedBy="email-help"
  error={errorMessage}
/>

// Card with click handler
<Card 
  onClick={handleClick}
  ariaLabel="User profile card"
  role="button"
>
  Content
</Card>
```

### 3. Screen Reader Support

- **Live Regions**: Dynamic content announcements
- **Status Messages**: Success/error notifications announced
- **Hidden Decorations**: Visual-only elements hidden from screen readers
- **Semantic HTML**: Proper heading hierarchy and landmarks

### 4. Focus Visibility

- Custom focus styles that are always visible for keyboard users
- Focus indicators hidden for mouse users
- High contrast mode support

### 5. Motion Preferences

Respects `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from './hooks/useAccessibility';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { scale: 1.1 }}
    />
  );
}
```

## Components

### SkipLink
Allows keyboard users to skip navigation:

```tsx
<SkipLink targetId="main-content" label="Skip to main content" />
```

### LiveAnnouncer
Announce messages to screen readers:

```tsx
import { announce } from './components/accessibility';

// Announce success
announce('Profile saved successfully', 'polite');

// Announce error (interrupts)
announce('Error saving profile', 'assertive');
```

### AccessibleModal
Modal with full accessibility:

```tsx
<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  ariaDescribedBy="modal-description"
>
  <p id="modal-description">Are you sure you want to proceed?</p>
</AccessibleModal>
```

## Hooks

### useFocusTrap
Trap focus within a container:

```tsx
const { containerRef, handleKeyDown } = useFocusTrap(isActive);

return (
  <div ref={containerRef} onKeyDown={handleKeyDown}>
    {/* Focusable content */}
  </div>
);
```

### useAnnouncer
Component-level announcements:

```tsx
const { announce, announcement, politeness } = useAnnouncer();
```

### useListKeyboardNavigation
Keyboard navigation for lists:

```tsx
const { focusedIndex, handleKeyDown } = useListKeyboardNavigation(
  items.length,
  (index) => selectItem(index)
);
```

### useReducedMotion
Detect reduced motion preference:

```tsx
const prefersReducedMotion = useReducedMotion();
```

### useAccessibleModal
Full modal accessibility:

```tsx
const { containerRef, handleKeyDown } = useAccessibleModal(isOpen, onClose);
```

## Best Practices

### 1. Always Provide Labels

```tsx
// Good
<Button ariaLabel="Close menu">X</Button>

// Good
<Input label="Email" />

// Bad - no label
<button>X</button>
```

### 2. Use Semantic HTML

```tsx
// Good
<section aria-labelledby="features-heading">
  <h2 id="features-heading">Features</h2>
</section>

// Bad
<div className="section">
  <div className="title">Features</div>
</div>
```

### 3. Hide Decorative Elements

```tsx
// Good
<div aria-hidden="true">
  <DecorativeIcon />
</div>

// Good
<img src="decorative.png" alt="" />
```

### 4. Handle Loading States

```tsx
<Button isLoading ariaLabel="Saving profile">
  Save
</Button>
// Screen reader hears: "Saving profile, Loading..."
```

### 5. Error Announcements

```tsx
<Input 
  error={error} 
  aria-invalid={!!error}
/>
// Error message automatically announced via aria-live
```

## Testing

### Manual Testing Checklist

- [ ] Tab through entire page
- [ ] Verify skip link works
- [ ] Test modal focus trap
- [ ] Check heading hierarchy
- [ ] Verify alt text on images
- [ ] Test with screen reader
- [ ] Check color contrast
- [ ] Test reduced motion

### Screen Reader Testing

Test with popular screen readers:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

### Automated Testing

Use tools like:
- axe DevTools
- Lighthouse Accessibility Audit
- WAVE Evaluation Tool

## WCAG Compliance

Current implementation targets **WCAG 2.1 Level AA**:

- ✅ 1.1.1 Non-text Content
- ✅ 1.3.1 Info and Relationships
- ✅ 1.3.2 Meaningful Sequence
- ✅ 1.4.3 Contrast (Minimum)
- ✅ 1.4.4 Resize Text
- ✅ 1.4.10 Reflow
- ✅ 1.4.11 Non-text Contrast
- ✅ 1.4.13 Content on Hover or Focus
- ✅ 2.1.1 Keyboard
- ✅ 2.1.2 No Keyboard Trap
- ✅ 2.4.3 Focus Order
- ✅ 2.4.4 Link Purpose
- ✅ 2.4.6 Headings and Labels
- ✅ 2.4.7 Focus Visible
- ✅ 2.5.3 Label in Name
- ✅ 3.2.1 On Focus
- ✅ 3.2.2 On Input
- ✅ 3.3.1 Error Identification
- ✅ 3.3.2 Labels or Instructions
- ✅ 4.1.2 Name, Role, Value

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
