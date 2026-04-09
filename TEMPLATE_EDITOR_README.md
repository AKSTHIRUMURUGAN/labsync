# 🎨 LabSync Template Editor

## Professional Drag-and-Drop Template Builder

A powerful, intuitive template editor for creating custom experiment templates with rich text formatting, images, and flexible layouts - similar to Canva, Medium, and Notion.

---

## ✨ Key Features

### 📝 Rich Text Editor (TipTap)
- **Full WYSIWYG editing** with professional toolbar
- **Text formatting**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1, H2, H3 for structured content
- **Alignment**: Left, Center, Right, Justify
- **Lists**: Bullet and numbered lists
- **Colors**: Text color picker and highlighting
- **Links**: Insert and manage hyperlinks
- **Images**: Inline image insertion
- **Keyboard shortcuts** for power users

### 🖼️ Advanced Image Management
- **Drag & Drop upload** - Simply drag images into the editor
- **URL support** - Paste image URLs directly
- **Size presets** - Small, Medium, Large
- **Alignment controls** - Left, Center, Right
- **Real-time preview** - See changes instantly
- **Multiple formats** - PNG, JPG, GIF, WebP

### 🎯 Drag & Drop Builder
- **Reorderable sections** - Drag to rearrange
- **Multiple section types**:
  - 📄 **Heading** - Large title sections
  - 📝 **Text Block** - Rich formatted content
  - 🖼️ **Image** - Visual content with controls
  - ➖ **Divider** - Visual separators
- **Easy management** - Add/remove sections with one click
- **Smooth animations** - Professional drag feedback
- **Keyboard accessible** - Full keyboard navigation

### 👁️ Live Preview
- **Toggle view** - Switch between edit and preview
- **Real-time rendering** - See exactly what students see
- **Responsive design** - Adapts to all screen sizes

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
http://localhost:3000/faculty/templates/create
```

### Create Your First Template

1. **Login as Faculty**
2. **Navigate to Templates** → Create Template
3. **Configure Settings** (name, subject, difficulty)
4. **Add Sections** (click section type buttons)
5. **Edit Content** (use rich text editor)
6. **Add Images** (drag & drop or paste URL)
7. **Preview** (toggle to see student view)
8. **Publish** (make available to students)

---

## 📦 Technology Stack

### Core Libraries

| Library | Purpose | Version |
|---------|---------|---------|
| **TipTap** | Rich text editor | 2.1.13 |
| **DND Kit** | Drag and drop | 6.1.0 |
| **React Dropzone** | File uploads | 14.2.3 |
| **Next.js** | Framework | 16.2.2 |
| **React** | UI library | 19.2.4 |

### TipTap Extensions

- `@tiptap/starter-kit` - Essential features
- `@tiptap/extension-text-align` - Text alignment
- `@tiptap/extension-color` - Text colors
- `@tiptap/extension-text-style` - Text styling
- `@tiptap/extension-font-family` - Font selection
- `@tiptap/extension-image` - Image support
- `@tiptap/extension-link` - Hyperlinks
- `@tiptap/extension-underline` - Underline text
- `@tiptap/extension-highlight` - Text highlighting

### DND Kit Packages

- `@dnd-kit/core` - Core functionality
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - Helper functions

---

## 🎨 Component Architecture

```
app/components/TemplateEditor/
├── RichTextEditor.tsx      # TipTap WYSIWYG editor
├── DragDropBuilder.tsx     # Main builder component
├── ImageUploader.tsx       # Image upload & management
└── editor.css             # Editor styling
```

### RichTextEditor
- Professional toolbar with all formatting options
- Extensible plugin system
- Keyboard shortcuts
- Custom styling support

### DragDropBuilder
- Section management (add/remove/reorder)
- Drag & drop orchestration
- Section type rendering
- State management

### ImageUploader
- File upload with drag & drop
- URL input support
- Size and alignment controls
- Preview functionality

---

## 🎯 Use Cases

### Physics Lab
- Circuit diagrams
- Formula explanations
- Step-by-step procedures
- Safety warnings

### Chemistry Experiment
- Chemical equations
- Titration procedures
- Data tables
- Safety protocols

### Biology Practical
- Microscope diagrams
- Cell drawings
- Observation templates
- Specimen identification

### Computer Science
- Algorithm pseudocode
- Code templates
- Flowcharts
- Test cases

---

## ⌨️ Keyboard Shortcuts

### Text Formatting
- `Ctrl/Cmd + B` - **Bold**
- `Ctrl/Cmd + I` - *Italic*
- `Ctrl/Cmd + U` - <u>Underline</u>
- `Ctrl/Cmd + Shift + X` - ~~Strikethrough~~

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

---

## 🎓 Best Practices

### Template Design
1. ✅ Start with clear structure (headings first)
2. ✅ Use consistent formatting throughout
3. ✅ Include visual aids (images, diagrams)
4. ✅ Add dividers between major sections
5. ✅ Preview frequently during creation
6. ✅ Test with sample student data

### Content Guidelines
- **Clear headings** - Descriptive section titles
- **Concise text** - Brief, focused instructions
- **Visual balance** - Mix text and images
- **Logical flow** - Proper section ordering
- **Accessibility** - Readable fonts and colors

### Image Guidelines
- **High quality** - Clear, professional images
- **Appropriate size** - Match content importance
- **Proper alignment** - Consistent positioning
- **Compressed files** - Optimize for web
- **Alt text** - Descriptive captions

---

## 🔧 Customization

### Add New Section Types

```typescript
// In DragDropBuilder.tsx
export interface TemplateSection {
  type: 'text' | 'image' | 'heading' | 'divider' | 'video';
  // ...
}

// Add button
<button onClick={() => addSection('video')}>
  Video
</button>

// Add rendering
{section.type === 'video' && (
  <VideoPlayer url={section.content} />
)}
```

### Custom Toolbar Buttons

```typescript
// In RichTextEditor.tsx
<button
  onClick={() => editor.chain().focus().toggleCode().run()}
  className={/* styles */}
>
  <CodeIcon />
</button>
```

### Custom Styling

```css
/* In editor.css */
.ProseMirror h1 {
  font-size: 2.5rem;
  color: #custom-color;
  font-family: 'Custom Font';
}
```

---

## 📊 API Integration

### Save Template

```typescript
POST /api/templates
{
  title: "Ohm's Law Experiment",
  subject: "Physics",
  difficulty: "Beginner",
  description: "Verify Ohm's Law...",
  sections: [
    {
      id: "section-1",
      type: "heading",
      content: "Aim"
    },
    {
      id: "section-2",
      type: "text",
      content: "<p>To verify...</p>"
    }
  ],
  status: "published"
}
```

### Response

```typescript
{
  success: true,
  data: {
    template: {
      _id: "...",
      title: "...",
      // ...
    }
  }
}
```

---

## 🐛 Troubleshooting

### Images Not Uploading
- ✅ Check file size (max 5MB)
- ✅ Verify file format (PNG, JPG, GIF, WebP)
- ✅ Ensure proper permissions

### Drag & Drop Not Working
- ✅ Check browser compatibility
- ✅ Disable conflicting extensions
- ✅ Clear cache and reload

### Formatting Not Saving
- ✅ Verify HTML structure
- ✅ Check for CSS conflicts
- ✅ Test API response

### Preview Not Matching
- ✅ Check CSS specificity
- ✅ Verify section rendering
- ✅ Test in different browsers

---

## 🚀 Performance Tips

### Optimize Images
- Compress before upload
- Use WebP format when possible
- Lazy load images
- Use appropriate sizes

### Reduce Bundle Size
- Import only needed extensions
- Use dynamic imports
- Minimize custom CSS
- Tree-shake unused code

### Improve Rendering
- Limit section count
- Debounce auto-save
- Use React.memo for sections
- Optimize re-renders

---

## 📚 Documentation

- **Installation Guide**: `INSTALLATION.md`
- **Template Examples**: `TEMPLATE_EXAMPLES.md`
- **Complete Guide**: `TEMPLATE_EDITOR_GUIDE.md`
- **API Documentation**: `API_TESTING_GUIDE.md`

---

## 🎯 Roadmap

### Coming Soon
- [ ] Video embedding
- [ ] Table editor
- [ ] Math equation editor
- [ ] Collaborative editing
- [ ] Version history
- [ ] Template marketplace
- [ ] AI content suggestions
- [ ] Mobile app

---

## 💡 Examples

### Simple Template
```typescript
const sections = [
  { type: 'heading', content: 'Aim' },
  { type: 'text', content: '<p>To verify...</p>' },
  { type: 'image', content: 'https://...' },
  { type: 'divider', content: '' }
];
```

### Complex Template
```typescript
const sections = [
  { 
    type: 'heading', 
    content: 'Introduction',
    settings: { alignment: 'center' }
  },
  { 
    type: 'text', 
    content: '<p><strong>Key concepts:</strong></p><ul>...</ul>'
  },
  { 
    type: 'image', 
    content: 'data:image/png;base64,...',
    settings: { 
      alignment: 'center',
      size: 'large'
    }
  }
];
```

---

## 🤝 Contributing

We welcome contributions! Areas for improvement:
- New section types
- Additional formatting options
- Performance optimizations
- Bug fixes
- Documentation improvements

---

## 📞 Support

- **Email**: support@labsync.edu
- **Documentation**: `/docs`
- **Video Tutorials**: `/docs/videos`
- **Community Forum**: [forum-url]
- **GitHub Issues**: [repository-url]

---

## 📄 License

© 2026 LabSync. All rights reserved.

---

## 🌟 Credits

Built with:
- [TipTap](https://tiptap.dev/) - Headless editor framework
- [DND Kit](https://dndkit.com/) - Modern drag and drop toolkit
- [React Dropzone](https://react-dropzone.js.org/) - File upload library
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

**Made with ❤️ for educators and students**
