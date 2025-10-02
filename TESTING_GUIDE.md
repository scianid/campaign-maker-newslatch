# Testing & Migration Guide

## Quick Start Testing

### 1. Start Development Server
```bash
npm run dev
# or
npm start
```

### 2. Navigate to Landing Page Editor
1. Login with your credentials
2. Go to "Landing Pages"
3. Click "Edit" on any landing page
4. You should see the new modular editor

### 3. Test Checklist

#### ✅ Page Load
- [ ] Page loads without errors
- [ ] Loading spinner shows initially
- [ ] Page data displays correctly
- [ ] Header shows with back button
- [ ] Save indicator works

#### ✅ Title Editing
- [ ] Click on page title to edit
- [ ] Type new title
- [ ] Click checkmark to save
- [ ] Click X to cancel
- [ ] "Saved" indicator appears

#### ✅ Section Subtitle
- [ ] Click on subtitle to edit
- [ ] Change subtitle text
- [ ] Save works correctly
- [ ] Cancel discards changes

#### ✅ Paragraph Management
- [ ] Click paragraph to edit
- [ ] Textarea expands correctly
- [ ] Save button works
- [ ] Delete button shows confirmation
- [ ] Delete removes paragraph
- [ ] Add paragraph creates new one

#### ✅ Section Management
- [ ] Delete section button appears on hover
- [ ] Delete shows confirmation modal
- [ ] Delete removes entire section
- [ ] Add section creates new section
- [ ] New section has default content

#### ✅ Image Functionality
- [ ] Generate image from prompt
- [ ] Loading spinner shows during generation
- [ ] Generated image displays
- [ ] Set custom image URL
- [ ] Regenerate image works
- [ ] Remove image works
- [ ] Image prompt editing works

#### ✅ CTA Configuration
- [ ] "Add CTA" button shows when no CTA
- [ ] Click opens configuration modal
- [ ] Type dropdown shows 6 options:
  - [ ] Simple CTA
  - [ ] Exclusive Offer CTA
  - [ ] Urgency CTA
  - [ ] Testimonial CTA
  - [ ] Guarantee CTA
  - [ ] Apply Discount CTA

#### ✅ CTA Type: Simple
- [ ] Title field works
- [ ] Subtitle field works
- [ ] Button text field (max 15 chars)
- [ ] Live preview shows correctly
- [ ] Save creates CTA in section

#### ✅ CTA Type: Exclusive Offer
- [ ] Badge field works (max 30 chars)
- [ ] Title field works
- [ ] Subtitle field (max 100 chars)
- [ ] Button text (max 15 chars)
- [ ] Red badge displays correctly
- [ ] Live preview matches

#### ✅ CTA Type: Urgency
- [ ] Badge field works
- [ ] Title with ⚡ emoji displays
- [ ] Subtitle works
- [ ] Button text works
- [ ] Urgency styling correct

#### ✅ CTA Type: Testimonial
- [ ] Quote field works (max 150 chars)
- [ ] Author field works (max 50 chars)
- [ ] Title field works
- [ ] Button text works
- [ ] Quote marks display
- [ ] Author formatting correct

#### ✅ CTA Type: Guarantee
- [ ] Guarantee text field (max 60 chars)
- [ ] Title field works
- [ ] Subtitle field works
- [ ] Button text works
- [ ] Checkmark displays
- [ ] Guarantee text shows

#### ✅ CTA Type: Apply Discount
- [ ] Discount code field (max 20 chars)
- [ ] Title field works
- [ ] Subtitle field works
- [ ] Button text works
- [ ] Discount code displays
- [ ] Copy button works
- [ ] "Copied!" message shows

#### ✅ CTA Editing
- [ ] Click edit button on saved CTA
- [ ] Modal opens with current values
- [ ] Make changes
- [ ] Save updates CTA
- [ ] Preview updates immediately

#### ✅ CTA Display
- [ ] Saved CTA shows preview
- [ ] Edit button appears on hover
- [ ] Delete button appears on hover
- [ ] Delete removes CTA
- [ ] CTA matches public page display

#### ✅ Sticky CTA
- [ ] Sticky CTA editor at bottom
- [ ] Title editing works
- [ ] Subtitle editing works
- [ ] Button text editing works
- [ ] Show/Hide toggle works
- [ ] Preview shows sticky CTA

#### ✅ Navigation
- [ ] Back button returns to list
- [ ] Preview button opens new tab
- [ ] Preview shows public page
- [ ] All changes reflected in preview

#### ✅ Error Handling
- [ ] Network errors show error state
- [ ] Invalid permissions show error
- [ ] Image generation failures show modal
- [ ] Save failures show alert

#### ✅ Loading States
- [ ] Initial page load shows spinner
- [ ] Image generation shows spinner
- [ ] No flickering during saves
- [ ] Smooth transitions

## Browser Testing

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Responsive Testing

Test on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Performance Testing

### Check Performance
```bash
# Open Chrome DevTools
# Go to Performance tab
# Record interaction
# Check for:
- [ ] No memory leaks
- [ ] Fast re-renders
- [ ] Smooth scrolling
- [ ] No layout shifts
```

### Bundle Size
```bash
npm run build

# Check dist folder size
# Should be similar to before refactoring
```

## Debugging Issues

### Common Issues

#### 1. Component Not Rendering
**Check**: Import statements in `EditLandingPage.jsx`
```jsx
import { EditorHeader, SectionEditor, ... } from './landing-page-editor';
```

#### 2. Props Not Passing
**Check**: Hook return values
```jsx
const {
  landingPage,
  handleSaveTitle,
  // ... all handlers
} = useLandingPageEditor(pageId, user);
```

#### 3. State Not Updating
**Check**: Hook handlers are being called
```jsx
// Add console.log in hook
console.log('Saving title:', newTitle);
```

#### 4. Modal Not Showing
**Check**: Modal state and handler
```jsx
<Modal
  modal={modal}
  onClose={() => setModal(null)}
  onConfirm={handleModalConfirm}
/>
```

### Using React DevTools

1. Install React DevTools extension
2. Open DevTools → React tab
3. Find `EditLandingPage` component
4. Check hooks state:
   - landingPage
   - loading
   - error
   - editingField
   - modal

### Console Errors

Check browser console for:
- Import errors
- Prop type warnings
- React hooks warnings
- Network errors

## Rollback Instructions

If issues occur, rollback to original:

```bash
# PowerShell
Copy-Item "src\components\EditLandingPage.backup.jsx" "src\components\EditLandingPage.jsx" -Force

# Delete new files
Remove-Item "src\components\landing-page-editor" -Recurse
Remove-Item "src\hooks\useLandingPageEditor.js"
```

## Migration Checklist

- [x] Create custom hook
- [x] Extract editable components
- [x] Extract CTA components
- [x] Extract image section
- [x] Extract sticky CTA editor
- [x] Create modal component
- [x] Create loading/error states
- [x] Create section editor
- [x] Create editor header
- [x] Create barrel exports
- [x] Refactor main component
- [x] Backup original file
- [x] Replace main file
- [x] No compilation errors
- [ ] **Manual testing**
- [ ] **Browser testing**
- [ ] **Responsive testing**
- [ ] **Performance testing**

## Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **No visual regressions**
✅ **Same functionality as before**
✅ **Better code organization**
✅ **Faster development workflow**

## Next Steps After Testing

1. **Delete temporary file**
   ```bash
   Remove-Item "src\components\EditLandingPage-new.jsx"
   ```

2. **Commit changes**
   ```bash
   git add .
   git commit -m "refactor: modularize EditLandingPage component"
   ```

3. **Push to repository**
   ```bash
   git push origin main
   ```

4. **Update documentation**
   - Update README with new structure
   - Add component documentation
   - Update contributing guidelines

## Performance Benchmarks

### Expected Results
- **Initial Load**: < 500ms
- **Save Operation**: < 200ms
- **Image Generation**: 5-15s (external API)
- **Component Render**: < 50ms
- **Memory Usage**: Stable (no leaks)

### Monitoring
```javascript
// Add to development
console.time('render');
// component code
console.timeEnd('render');
```

## Automated Testing (Future)

### Unit Tests Setup
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Example Test
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import EditableTitle from './EditableTitle';

test('edits and saves title', () => {
  const onSave = jest.fn();
  render(
    <EditableTitle
      value="Old Title"
      isEditing={false}
      onEdit={() => {}}
      onSave={onSave}
      onCancel={() => {}}
    />
  );
  
  fireEvent.click(screen.getByText('Old Title'));
  // ... test editing flow
});
```

## Documentation

After successful testing:
1. ✅ REFACTORING_SUMMARY.md created
2. ✅ COMPONENT_ARCHITECTURE.md created
3. ✅ TESTING_GUIDE.md created (this file)
4. Consider adding:
   - Component API documentation
   - Storybook stories
   - Architecture decision records (ADR)

---

**Status**: Ready for Testing
**Risk Level**: Low (backup exists)
**Rollback**: Available
**Next Action**: Manual testing

