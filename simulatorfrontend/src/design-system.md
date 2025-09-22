# Medical Healthcare Simulation Design System

## Overview
This design system establishes a cohesive, professional, and accessible visual language for the healthcare simulation application. It ensures consistency across all pages and components while maintaining medical professionalism and user experience standards.

## 🎨 Color Palette

### Primary Medical Colors
```css
--medical-primary: #2196F3 (medical-500)
--medical-primary-rgb: 33, 150, 243
```

**Medical Blue Scale:**
- `medical-50`: #E3F2FD (Lightest)
- `medical-100`: #BBDEFB
- `medical-200`: #90CAF9
- `medical-300`: #64B5F6
- `medical-400`: #42A5F5
- `medical-500`: #2196F3 (Primary)
- `medical-600`: #1E88E5
- `medical-700`: #1976D2
- `medical-800`: #1565C0
- `medical-900`: #0D47A1 (Darkest)

### Status Colors
**Emergency/Critical:**
- `emergency-500`: #F44336 (Critical red)

**Success/Stable:**
- `stable-500`: #4CAF50 (Success green)

**Warning/Caution:**
- `warning-500`: #FFEB3B (Warning yellow)

**Information:**
- `info-500`: #03A9F4 (Info blue)

### Specialty Colors
```css
cardiology: #E91E63
neurology: #9C27B0
oncology: #673AB7
pediatrics: #3F51B5
surgery: #2196F3
radiology: #00BCD4
laboratory: #009688
pharmacy: #4CAF50
nursing: #8BC34A
emergency: #FF5722
```

### Dark Mode Colors
```css
dark-primary: #E3F2FD
dark-secondary: #B3E5FC
dark-surface: #121212
dark-card: #2A2A2A
dark-hover: #333333
dark-border: #404040
```

## 📝 Typography System

### Font Families
```css
Primary: 'Inter', system-ui, sans-serif
Monospace: 'JetBrains Mono', 'Fira Code', monospace
Medical: 'Georgia', 'Times New Roman', serif
```

### Heading Hierarchy
```css
h1: text-4xl md:text-5xl (2.25rem - 3rem)
h2: text-3xl md:text-4xl (1.875rem - 2.25rem)
h3: text-2xl md:text-3xl (1.5rem - 1.875rem)
h4: text-xl md:text-2xl (1.25rem - 1.5rem)
h5: text-lg md:text-xl (1.125rem - 1.25rem)
h6: text-base md:text-lg (1rem - 1.125rem)
```

### Body Text
```css
text-base: 1rem (16px) with 1.5rem line-height
text-sm: 0.875rem (14px) with 1.25rem line-height
text-xs: 0.75rem (12px) with 1rem line-height
```

## 📏 Spacing System

### Base Unit: 4px (0.25rem)
**Allowed Values:**
- 0, 4, 8, 12, 16, 20, 24, 32, 36, 48, 64, 80, 96, 128, 144

### Medical Spacing Utilities
```css
.space-medical: margin-top: 1.5rem (24px)
.space-medical-sm: margin-top: 1rem (16px)
.space-medical-lg: margin-top: 2rem (32px)
```

## 🧩 Component Library

### Buttons
**Variants:** primary, secondary, danger, success, warning, outline, ghost
**Sizes:** xs, sm, md, lg, xl
**States:** default, hover, focus, disabled, loading

**Usage:**
```tsx
<Button variant="primary" size="md" loading={false}>
  Primary Action
</Button>
```

### Cards
**Variants:** default, elevated, outlined, glass
**Padding:** none, sm, md, lg
**Features:** hover effects, interactive states

**Usage:**
```tsx
<Card variant="elevated" padding="md" hover={true}>
  <h3>Card Title</h3>
  <p>Card content...</p>
</Card>
```

### Form Elements
**Components:** Input, Textarea, Select, Checkbox, Radio
**States:** default, focus, error, disabled
**Features:** Icons, labels, helper text, error messages

**Usage:**
```tsx
<Input
  label="Patient Name"
  placeholder="Enter patient name"
  error={errors.name}
  leftIcon={<UserIcon />}
  fullWidth
/>
```

### Status Indicators
**Components:** Badge, Alert, Progress Bar
**Types:** success, warning, error, info

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Mobile-First Approach
- Base styles for mobile (320px+)
- Progressive enhancement for larger screens
- Touch-friendly interactive elements (44px minimum)

### Responsive Utilities
```css
medical-hidden-mobile: hidden md:block
medical-hidden-desktop: block md:hidden
medical-text-responsive: text-sm md:text-base
```

## ✨ Animation System

### Timing
```css
duration-200: 200ms (fast interactions)
duration-300: 300ms (standard transitions)
duration-500: 500ms (complex animations)
```

### Easing Functions
```css
ease-out: cubic-bezier(0, 0, 0.2, 1)
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Animation Patterns
```css
hover-lift: transform hover:-translate-y-1
hover-glow: transition-shadow hover:shadow-medical-lg
animate-medical-fade-in: opacity fade in
animate-medical-slide-up: slide up with fade
```

## 🎯 Usage Guidelines

### Color Usage Rules
1. **Primary Medical Blue** (#2196F3): Main brand color, CTAs, links, focus states
2. **Status Colors**: Use semantic colors for their intended purpose only
3. **Specialty Colors**: Use only for specialty-specific elements
4. **Neutral Colors**: Use gray scale for text, borders, backgrounds

### Component Consistency
1. **Always use established UI components** instead of creating custom styled elements
2. **Follow the variant system** - don't create new variants without approval
3. **Maintain consistent spacing** using the approved spacing scale
4. **Use semantic color names** instead of arbitrary hex values

### Accessibility Standards
1. **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
2. **Focus Indicators**: Visible focus rings on all interactive elements
3. **Screen Reader Support**: Proper ARIA labels and roles
4. **Keyboard Navigation**: Full keyboard accessibility

### Performance Guidelines
1. **Prefer CSS transforms** over layout-affecting properties for animations
2. **Use will-change** property for frequently animated elements
3. **Optimize images** and use appropriate formats
4. **Minimize repaints** and reflows

## 🔧 Implementation Checklist

### For New Pages/Components
- [ ] Use only approved color palette
- [ ] Follow typography hierarchy
- [ ] Use established UI components
- [ ] Implement responsive design
- [ ] Add appropriate animations
- [ ] Ensure accessibility compliance
- [ ] Test across different screen sizes

### For Existing Pages (Fixes Needed)
- [ ] Replace hardcoded colors with design system colors
- [ ] Replace custom components with UI library components
- [ ] Fix inconsistent spacing
- [ ] Update typography to follow hierarchy
- [ ] Ensure responsive behavior
- [ ] Add proper animations

## 📋 Maintenance

### Adding New Components
1. Follow existing naming conventions
2. Use established color and spacing systems
3. Ensure consistency with existing variants
4. Document new components in this guide
5. Add TypeScript interfaces if needed

### Updating the System
1. Changes must maintain backward compatibility
2. Update this documentation for any changes
3. Test across all existing pages
4. Communicate changes to the development team

---

*This design system is maintained by the development team. For questions or suggestions, please refer to the component library documentation or contact the design system maintainers.*