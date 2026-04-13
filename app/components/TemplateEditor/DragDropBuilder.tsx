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
import AIBlockAssistant from './AIBlockAssistant';
import ObservationTableBuilder from './ObservationTableBuilder';
import CodeCompiler from './CodeCompiler';

export interface TemplateSection {
  id: string;
  type: 'text' | 'image' | 'heading' | 'divider' | 'table' | 'code' | 'fileUpload' | 'imageUpload';
  title?: string;
  content: string | any;
  editable?: boolean; // Whether students can edit this section
  settings?: {
    alignment?: 'left' | 'center' | 'right';
    size?: 'small' | 'medium' | 'large';
    style?: any;
  };
}

interface DragDropBuilderProps {
  sections: TemplateSection[];
  onChange: (sections: TemplateSection[]) => void;
  experimentTitle?: string;
  experimentDescription?: string;
}

function SortableSection({
  section,
  onUpdate,
  onToggleEditable,
  onDelete,
  experimentTitle,
  experimentDescription,
}: {
  section: TemplateSection;
  onUpdate: (content: string | any) => void;
  onToggleEditable: () => void;
  onDelete: () => void;
  experimentTitle?: string;
  experimentDescription?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  
  const [showTableBuilder, setShowTableBuilder] = useState(false);

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
          <div className="flex items-center gap-2">
            {/* Editable Toggle - Only for text, heading, table, code, imageUpload, and fileUpload sections */}
            {(section.type === 'text' || section.type === 'heading' || section.type === 'table' || section.type === 'code' || section.type === 'imageUpload' || section.type === 'fileUpload') && (
              <button
                onClick={onToggleEditable}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition ${
                  section.editable 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={section.editable ? 'Students can edit this section' : 'Students cannot edit this section (read-only)'}
              >
                {section.editable ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <span>Editable</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Read-only</span>
                  </>
                )}
              </button>
            )}
            {/* AI Assistant - Only for text and heading blocks */}
            {(section.type === 'text' || section.type === 'heading') && section.content && (
              <AIBlockAssistant
                content={section.content}
                onApply={onUpdate}
                blockType={section.type}
              />
            )}
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

          {section.type === 'code' && (
            <div>
              {!showTableBuilder && section.content && section.content.problemTitle ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-bold text-[var(--ink)]">{section.content.problemTitle}</h4>
                      <p className="text-sm text-[var(--ink3)]">{section.content.selectedLanguage?.toUpperCase()}</p>
                    </div>
                    <button
                      onClick={() => setShowTableBuilder(true)}
                      className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition"
                    >
                      Edit Code Problem
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded p-4 border border-[var(--paper3)]">
                    <p className="text-sm text-[var(--ink2)] whitespace-pre-wrap">{section.content.problemDescription}</p>
                    <div className="mt-3 text-xs text-[var(--ink3)]">
                      {section.content.testCases?.filter((tc: any) => !tc.isHidden).length || 0} visible test cases, 
                      {' '}{section.content.testCases?.filter((tc: any) => tc.isHidden).length || 0} hidden test cases
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <CodeCompiler
                    onSave={(codeData) => {
                      onUpdate(codeData);
                      setShowTableBuilder(false);
                    }}
                    initialData={section.content}
                  />
                  {section.content && section.content.problemTitle && (
                    <button
                      onClick={() => setShowTableBuilder(false)}
                      className="mt-4 px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {section.type === 'table' && (
            <div>
              {!showTableBuilder && section.content ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[var(--ink)]">{section.content.name || 'Observation Table'}</h4>
                    <button
                      onClick={() => setShowTableBuilder(true)}
                      className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition"
                    >
                      Edit Table
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-[var(--paper3)]">
                      <thead>
                        <tr className="bg-[var(--paper)]">
                          {section.content.columns?.map((col: any) => (
                            <th key={col.id} className="px-4 py-2 text-left text-sm font-medium border border-[var(--paper3)]">
                              {col.name}
                              {col.unit && <span className="text-xs text-[var(--ink3)] ml-1">({col.unit})</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.content.rows?.map((row: any) => (
                          <tr key={row.id}>
                            {section.content.columns?.map((col: any) => (
                              <td key={col.id} className="px-4 py-2 border border-[var(--paper3)]">
                                {row.values[col.id]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <ObservationTableBuilder
                    onSave={(tableData) => {
                      onUpdate(tableData);
                      setShowTableBuilder(false);
                    }}
                    experimentTitle={experimentTitle}
                    experimentDescription={experimentDescription}
                  />
                  {section.content && (
                    <button
                      onClick={() => setShowTableBuilder(false)}
                      className="mt-4 px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {section.type === 'imageUpload' && (
            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                </svg>
                <input
                  type="text"
                  value={section.title || 'Upload Image'}
                  onChange={(e) => {
                    onChange(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s));
                  }}
                  className="flex-1 px-3 py-1 text-sm font-medium text-blue-900 bg-transparent border-none outline-none"
                  placeholder="Section title (e.g., 'Upload Circuit Diagram')"
                />
              </div>
              <p className="text-sm text-blue-700">
                Students will be able to upload an image here (e.g., experimental setup photo, circuit diagram, graph, etc.)
              </p>
            </div>
          )}

          {section.type === 'fileUpload' && (
            <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                </svg>
                <input
                  type="text"
                  value={section.title || 'Upload File'}
                  onChange={(e) => {
                    onChange(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s));
                  }}
                  className="flex-1 px-3 py-1 text-sm font-medium text-purple-900 bg-transparent border-none outline-none"
                  placeholder="Section title (e.g., 'Upload Data File')"
                />
              </div>
              <p className="text-sm text-purple-700">
                Students will be able to upload a file here (e.g., data file, report, spreadsheet, etc.)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DragDropBuilder({ sections, onChange, experimentTitle, experimentDescription }: DragDropBuilderProps) {
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
      content: type === 'imageUpload' || type === 'fileUpload' ? '' : '',
      title: type === 'imageUpload' ? 'Upload Image' : type === 'fileUpload' ? 'Upload File' : undefined,
      settings: {
        alignment: 'left',
      },
      editable: type === 'imageUpload' || type === 'fileUpload' ? true : undefined,
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

  const toggleEditable = (id: string) => {
    onChange(
      sections.map((section) =>
        section.id === id ? { ...section, editable: !section.editable } : section
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
          <button
            onClick={() => addSection('table')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] hover:bg-[var(--accent3)] text-[var(--ink)] rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            Observation Table
          </button>
          <button
            onClick={() => addSection('code')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] hover:bg-[var(--accent3)] text-[var(--ink)] rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            Code Compiler
          </button>
          <button
            onClick={() => addSection('imageUpload')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] hover:bg-[var(--accent3)] text-[var(--ink)] rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
              <path d="M10 8a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
            Image Upload
          </button>
          <button
            onClick={() => addSection('fileUpload')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--paper)] hover:bg-[var(--accent3)] text-[var(--ink)] rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
            </svg>
            File Upload
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
                  onToggleEditable={() => toggleEditable(section.id)}
                  onDelete={() => deleteSection(section.id)}
                  experimentTitle={experimentTitle}
                  experimentDescription={experimentDescription}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
