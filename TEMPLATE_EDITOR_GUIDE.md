# LabSync Template Editor - Complete Guide

## Overview
The LabSync Template Editor is a powerful, professional drag-and-drop builder that allows faculty to create custom experiment templates with rich text formatting, images, and flexible layouts.

## Features

### 🎨 Rich Text Editor (TipTap)
- **Text Formatting**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1, H2, H3 for structured content
- **Text Alignment**: Left, Center, Right, Justify
- **Lists**: Bullet lists and numbered lists
- **Colors**: Text color picker and highlighting
- **Links**: Insert and manage hyperlinks
- **Images**: Inline image insertion
- **Professional toolbar** with intuitive icons

### 🖼️ Image Management
- **Drag & Drop Upload**: Simply drag images into the upload area
- **URL Support**: Paste image URLs directly
- **Size Control**: Small, Medium, Large presets
- **Alignment**: Left, Center, Right alignment options
- **Preview**: Real-time image preview
- **Supported Formats**: PNG, JPG, GIF, WebP

### 📦 Drag & Drop Builder (@dnd-kit)
- **Reorderable Sections**: Drag sections to rearrange
- **Multiple Section Types**:
  - **Heading**: Large title sections
  - **Text Block**: Rich text content with full formatting
  - **Image**: Visual content with alignment controls
  - **Divider**: Visual separators between sections
- **Add/Remove**: Easy section management
- **Visual Feedback**: Smooth animations during drag

### 👁️ Live Preview
- **Toggle View**: Switch between edit and preview modes
- **Real-time Rendering**: See exactly how students will view the template
- **Responsive Design**: Preview adapts to different screen sizes

## Installation

### 1. Install Dependencies

```bash
npm install
```

The following packages are included:
- `@dnd-kit/core` - Core drag and drop functionality
- `@dnd-kit/sortable` - Sortable list implementation
- `@dnd-kit/utilities` - Utility functions
- `@tiptap/react` - React wrapper for TipTap
- `@tiptap/starter-kit` - Essential TipTap extensions
- `@tiptap/extension-*` - Additional formatting extensions
- `react-dropzone` - File upload with drag & drop

### 2. Run Development Server

```bash
npm run dev
```

### 3. Access Template Creator

Navigate to: `http://localhost:3000/faculty/templates/create`

## Usage Guide

### Creating a Template

1. **Login as Faculty**
   - Use faculty credentials
   - Navigate to Templates section

2. **Click "Create Template"**
   - Opens the template builder

3. **Configure Settings** (Left Sidebar)
   - Template Name (required)
   - Subject (Physics, Chemistry, Biology, etc.)
   - Difficulty Level (Beginner, Intermediate, Advanced)
   - Description

4. **Build Content** (Main Area)
   - Click section type buttons to add:
     - **Heading**: For section titles
     - **Text Block**: For detailed content
     - **Image**: For diagrams, photos
     - **Divider**: For visual separation

5. **Edit Sections**
   - **Drag Handle**: Click and drag to reorder
   - **Delete Button**: Remove unwanted sections
   - **Content Area**: Edit directly in each section

6. **Format Text**
   - Use toolbar for formatting
   - Apply styles, colors, alignment
   - Insert links and images inline

7. **Add Images**
   - Drag & drop files
   - Or paste image URLs
   - Adjust size and alignment

8. **Preview**
   - Click "Preview" button
   - See student view
   - Switch back to "Edit" to continue

9. **Save**
   - **Publish Template**: Make available to students
   - **Save as Draft**: Continue editing later

## Component Architecture

### RichTextEditor.tsx
- TipTap-based WYSIWYG editor
- Full formatting toolbar
- Extensible with plugins
- Keyboard shortcuts support

### DragDropBuilder.tsx
- Main builder component
- Section management
- Drag & drop orchestration
- Add/remove section controls

### ImageUploader.tsx
- File upload with react-dropzone
- URL input support
- Size and alignment controls
- Preview functionality

## Customization

### Adding New Section Types

Edit `DragDropBuilder.tsx`:

```typescript
// Add new type to interface
export interface TemplateSection {
  type: 'text' | 'image' | 'heading' | 'divider' | 'video' | 'table';
  // ...
}

// Add button in toolbar
<button onClick={() => addSection('video')}>
  Video
</button>

// Add rendering in SortableSection
{section.type === 'video' && (
  <VideoPlayer url={section.content} />
)}
```

### Customizing Toolbar

Edit `RichTextEditor.tsx`:

```typescript
// Add new button
<button
  onClick={() => editor.chain().focus().toggleCode().run()}
  className={/* styles */}
>
  Code
</button>
```

### Styling

Edit `app/components/TemplateEditor/editor.css`:

```css
.ProseMirror h1 {
  font-size: 2.5rem; /* Customize heading size */
  color: #custom-color;
}
```

## API Integration

### Save Template

```typescript
POST /api/templates
{
  title: string,
  subject: string,
  difficulty: string,
  description: string,
  sections: TemplateSection[],
  status: 'draft' | 'published'
}
```

### Update Template

```typescript
PUT /api/templates/:id
{
  // Same as create
}
```

### Get Templates

```typescript
GET /api/templates
Response: {
  success: boolean,
  data: {
    templates: Template[]
  }
}
```

## Best Practices

### Template Design
1. **Start with Structure**: Add all headings first
2. **Add Content**: Fill in text blocks
3. **Enhance with Images**: Add visual elements
4. **Use Dividers**: Separate major sections
5. **Preview Often**: Check student view regularly

### Content Guidelines
- **Clear Headings**: Use descriptive section titles
- **Concise Text**: Keep instructions brief
- **Visual Aids**: Include diagrams and images
- **Consistent Formatting**: Maintain uniform style
- **Logical Flow**: Order sections appropriately

### Performance
- **Optimize Images**: Compress before upload
- **Limit Sections**: Keep templates focused
- **Test Preview**: Ensure smooth rendering
- **Save Regularly**: Use draft feature

## Keyboard Shortcuts

### Text Formatting
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + U` - Underline
- `Ctrl/Cmd + Shift + X` - Strikethrough

### Structure
- `Ctrl/Cmd + Alt + 1` - Heading 1
- `Ctrl/Cmd + Alt + 2` - Heading 2
- `Ctrl/Cmd + Alt + 3` - Heading 3

### Lists
- `Ctrl/Cmd + Shift + 8` - Bullet list
- `Ctrl/Cmd + Shift + 7` - Numbered list

### Other
- `Ctrl/Cmd + K` - Insert link
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

## Troubleshooting

### Images Not Uploading
- Check file size (max 5MB recommended)
- Verify file format (PNG, JPG, GIF, WebP)
- Ensure proper permissions

### Drag & Drop Not Working
- Check browser compatibility
- Disable browser extensions
- Clear cache and reload

### Formatting Not Saving
- Ensure proper HTML structure
- Check for conflicting styles
- Verify API response

### Preview Not Matching
- Check CSS conflicts
- Verify section rendering
- Test in different browsers

## Advanced Features

### Custom Extensions

Add TipTap extensions in `RichTextEditor.tsx`:

```typescript
import CustomExtension from '@tiptap/extension-custom';

const editor = useEditor({
  extensions: [
    StarterKit,
    CustomExtension.configure({
      // options
    }),
  ],
});
```

### Section Templates

Create predefined section layouts:

```typescript
const sectionTemplates = {
  'aim-theory-procedure': [
    { type: 'heading', content: 'Aim' },
    { type: 'text', content: '' },
    { type: 'heading', content: 'Theory' },
    { type: 'text', content: '' },
    // ...
  ],
};
```

### Export/Import

Add template export functionality:

```typescript
const exportTemplate = () => {
  const json = JSON.stringify(sections);
  const blob = new Blob([json], { type: 'application/json' });
  // Download logic
};
```

## Future Enhancements

- [ ] Video embedding support
- [ ] Table insertion
- [ ] Mathematical equation editor
- [ ] Collaborative editing
- [ ] Version history
- [ ] Template marketplace
- [ ] AI-assisted content generation
- [ ] Mobile app support

## Support

For issues or questions:
- Email: support@labsync.edu
- Documentation: /docs
- GitHub Issues: [repository-url]

## License

This template editor is part of the LabSync platform.
© 2026 LabSync. All rights reserved.
