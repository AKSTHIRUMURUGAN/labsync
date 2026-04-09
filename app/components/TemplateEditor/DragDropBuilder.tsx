'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import RichTextEditor from './RichTextEditor';
import ImageUploader from './ImageUploader';

export interface TemplateSection {
  id: string;
  type: 'text' | 'image' | 'heading' | 'divider';
  content: string;
  settings?: {
    alignment?: 'left' | 'center' | 'right';
    size?: 'small' | 'medium' | 'large';
    style?: any;
  };
}

interface DragDropBuilderProps {
  sections: TemplateSection[];
  onChange: (sections: TemplateSection[]) => void;
}

function SortableSection({
  section,
  onUpdate,
  onDelete,
}: {
  section: TemplateSection;
  onUpdate: (content: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="bg-white rounded-lg border-2 border-[var(--paper3)] hover:border-[var(--accent)] transition">
        {/* Drag Handle & Controls */}
        <div className="flex items-center justify-between p-2 border-b border-[var(--paper3)] bg-[var(--paper)]">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="p-1 hover:bg-white rounded cursor-move"
              title="Drag to reorder"
            >
              <svg className="w-5 h-5 text-[var(--ink3)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 10-.001 4.001A2 2 0 007 2zm0 6a2 2 0 10-.001 4.001A2 2 0 007 8zm0 6a2 2 0 10-.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10-.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10-.001 4.001A2 2 0 0013 14z"/>
              </svg>
            </button>
            <span className="text-sm font-medium text-[var(--ink3)] capitalize">
              {section.type}
            </span>
          </div>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-50 rounded text-red-600"
            title="Delete section"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Section Content */}
        <div className="p-4">
          {section.type === 'text' && (
            <RichTextEditor
              content={section.content}
              onChange={onUpdate}
              placeholder="Enter your text here..."
            />
          )}

          {section.type === 'heading' && (
            <input
              type="text"
              value={section.content}
              onChange={(e) => onUpdate(e.target.value)}
              className="w-full text-2xl font-bold text-[var(--ink)] border-none outline-none focus:ring-2 focus:ring-[var(--accent)] rounded p-2"
              placeholder="Enter heading..."
            />
          )}

          {section.type === 'image' && (
            <ImageUploader
              imageUrl={section.content}
              onUpload={onUpdate}
              alignment={section.settings?.alignment}
            />
          )}

          {section.type === 'divider' && (
            <div className="flex items-center gap-4">
              <hr className="flex-1 border-t-2 border-[var(--paper3)]" />
              <span className="text-sm text-[var(--ink3)]">Section Divider</span>
              <hr className="flex-1 border-t-2 border-[var(--paper3)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DragDropBuilder({ sections, onChange }: DragDropBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      onChange(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const addSection = (type: TemplateSection['type']) => {
    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      type,
      content: '',
      settings: {
        alignment: 'left',
      },
    };
    onChange([...sections, newSection]);
  };

  const updateSection = (id: string, content: string) => {
    onChange(
      sections.map((section) =>
        section.id === id ? { ...section, content } : section
      )
    );
  };

  const deleteSection = (id: string) => {
    onChange(sections.filter((section) => section.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Add Section Toolbar */}
      <div className="bg-white rounded-lg border border-[var(--paper3)] p-4">
        <h3 className="text-sm font-bold text-[var(--ink)] mb-3">Add Section</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => addSection('heading')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] hover:bg-[var(--accent3)] text-[var(--ink)] rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h10v2H3v-2z"/>
            </svg>
            Heading
          </button>
          <button
            onClick={() => addSection('text')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] hover:bg-[var(--accent3)] text-[var(--ink)] rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4h12v2H4V4zm0 4h12v2H4V8zm0 4h8v2H4v-2z"/>
            </svg>
            Text Block
          </button>
          <button
            onClick={() => addSection('image')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] hover:bg-[var(--accent3)] text-[var(--ink)] rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
            Image
          </button>
          <button
            onClick={() => addSection('divider')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] hover:bg-[var(--accent3)] text-[var(--ink)] rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 10h14v2H3v-2z"/>
            </svg>
            Divider
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-[var(--paper3)] p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[var(--ink3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[var(--ink3)] mb-4">No sections yet. Add your first section above!</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onUpdate={(content) => updateSection(section.id, content)}
                  onDelete={() => deleteSection(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
