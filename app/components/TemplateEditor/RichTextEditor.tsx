'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  // Update editor content when content prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-[var(--paper3)] rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-[var(--paper3)] bg-[var(--paper)] p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-[var(--paper3)] pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive('bold') ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Bold"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3H6v14h5.5c2.5 0 4.5-2 4.5-4.5 0-1.5-.7-2.8-1.8-3.7C15.3 7.9 16 6.5 16 5c0-2.2-1.8-4-4-4h-1zm-3 2h2c1.1 0 2 .9 2 2s-.9 2-2 2H8V5zm0 6h3c1.1 0 2 .9 2 2s-.9 2-2 2H8v-4z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive('italic') ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Italic"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3h6v2h-2l-4 10h2v2H6v-2h2l4-10H10V3z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive('underline') ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 16c-3.3 0-6-2.7-6-6V3h2v7c0 2.2 1.8 4 4 4s4-1.8 4-4V3h2v7c0 3.3-2.7 6-6 6zm-6 2h12v2H4v-2z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive('strike') ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Strikethrough"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 4c-1.7 0-3 .6-3.9 1.7l1.5 1.3c.5-.6 1.3-1 2.4-1 1.5 0 2.5.8 2.5 2 0 .7-.3 1.2-.9 1.6H14c.6-.7 1-1.6 1-2.6C15 4.9 13 4 10 4zM3 10h14v2H3v-2zm7 6c1.7 0 3-.6 3.9-1.7l-1.5-1.3c-.5.6-1.3 1-2.4 1-1.5 0-2.5-.8-2.5-2h-2c0 2.1 2 3 4.5 3z"/>
            </svg>
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-[var(--paper3)] pr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded text-sm font-bold hover:bg-white transition ${
              editor.isActive('heading', { level: 1 }) ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded text-sm font-bold hover:bg-white transition ${
              editor.isActive('heading', { level: 2 }) ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded text-sm font-bold hover:bg-white transition ${
              editor.isActive('heading', { level: 3 }) ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-[var(--paper3)] pr-2">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4h14v2H3V4zm0 4h10v2H3V8zm0 4h14v2H3v-2zm0 4h10v2H3v-2z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4h14v2H3V4zm2 4h10v2H5V8zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4h14v2H3V4zm4 4h10v2H7V8zm-4 4h14v2H3v-2zm4 4h10v2H7v-2z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Justify"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h14v2H3v-2zm0 4h14v2H3v-2z"/>
            </svg>
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-[var(--paper3)] pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive('bulletList') ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm4-11h10v2H8V7zm0 6h10v2H8v-2zm0 6h10v2H8v-2z"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive('orderedList') ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4h2v2H3V4zm0 4h2v2H3V8zm0 4h2v2H3v-2zm0 4h2v2H3v-2zm5-11h10v2H8V5zm0 4h10v2H8V9zm0 4h10v2H8v-2zm0 4h10v2H8v-2z"/>
            </svg>
          </button>
        </div>

        {/* Insert */}
        <div className="flex gap-1 border-r border-[var(--paper3)] pr-2">
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-white transition text-[var(--ink3)]"
            title="Insert Image"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
          </button>
          <button
            onClick={setLink}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive('link') ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Insert Link"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
            </svg>
          </button>
        </div>

        {/* Text Color */}
        <div className="flex gap-1">
          <input
            type="color"
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-8 rounded cursor-pointer"
            title="Text Color"
          />
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-white transition ${
              editor.isActive('highlight') ? 'bg-white text-[var(--accent)]' : 'text-[var(--ink3)]'
            }`}
            title="Highlight"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
