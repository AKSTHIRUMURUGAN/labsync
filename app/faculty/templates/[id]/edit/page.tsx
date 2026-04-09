'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DragDropBuilder, { TemplateSection } from '@/app/components/TemplateEditor/DragDropBuilder';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'preview'>('basic');
  
  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [procedures, setProcedures] = useState<string[]>(['']);
  const [sections, setSections] = useState<TemplateSection[]>([]);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const initializeDefaultSections = () => {
    const defaultSections: TemplateSection[] = [
      {
        id: 'section-aim',
        type: 'heading',
        content: 'Aim',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-aim-content',
        type: 'text',
        content: '<p>Enter the aim of this experiment...</p>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-apparatus',
        type: 'heading',
        content: 'Apparatus Required',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-apparatus-content',
        type: 'text',
        content: '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-theory',
        type: 'heading',
        content: 'Theory/Formula',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-theory-content',
        type: 'text',
        content: '<p>Enter relevant formulas and theoretical concepts...</p>',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-divider-1',
        type: 'divider',
        content: '',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-observations',
        type: 'heading',
        content: 'Observations',
        settings: { alignment: 'left' }
      },
      {
        id: 'section-observations-content',
        type: 'text',
        content: '<p><em>Students will record their observations here.</em></p>',
        settings: { alignment: 'left' }
      }
    ];
    setSections(defaultSections);
  };

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${id}`);
      const data = await response.json();
      if (data.success) {
        const template = data.data;
        setFormData({
          title: template.title || '',
          description: template.description || '',
        });
        setObjectives(template.objectives && template.objectives.length > 0 ? template.objectives : ['']);
        setProcedures(template.steps && template.steps.length > 0 ? template.steps : ['']);
        // Load sections if they exist, otherwise initialize defaults
        if (template.sections && template.sections.length > 0) {
          setSections(template.sections);
        } else {
          initializeDefaultSections();
        }
      }
    } catch (error) {
      console.error('Failed to fetch template', error);
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addObjective = () => setObjectives([...objectives, '']);
  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };
  const removeObjective = (index: number) => {
    if (objectives.length > 1) {
      setObjectives(objectives.filter((_, i) => i !== index));
    }
  };

  const addProcedure = () => setProcedures([...procedures, '']);
  const updateProcedure = (index: number, value: string) => {
    const newProcedures = [...procedures];
    newProcedures[index] = value;
    setProcedures(newProcedures);
  };
  const removeProcedure = (index: number) => {
    if (procedures.length > 1) {
      setProcedures(procedures.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a template title');
      return;
    }

    const validObjectives = objectives.filter(obj => obj.trim() !== '');
    const validProcedures = procedures.filter(proc => proc.trim() !== '');

    if (validObjectives.length === 0) {
      alert('Please add at least one objective');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || 'No description provided',
          objectives: validObjectives,
          steps: validProcedures,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/faculty/templates');
      } else {
        alert(data.error?.message || 'Failed to update template');
      }
    } catch (error) {
      alert('Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const renderPreview = () => {
    return (
      <div className="bg-white rounded-xl border border-[var(--paper3)] p-8 max-w-4xl mx-auto">
        <div className="mb-8 border-b border-[var(--paper3)] pb-6">
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">
            {formData.title || 'Untitled Experiment'}
          </h1>
          {formData.description && (
            <p className="text-[var(--ink3)]">{formData.description}</p>
          )}
        </div>

        {objectives.some(obj => obj.trim()) && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-3">Objectives</h2>
            <ul className="list-disc list-inside space-y-2">
              {objectives.filter(obj => obj.trim()).map((objective, index) => (
                <li key={index} className="text-[var(--ink2)]">{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {procedures.some(proc => proc.trim()) && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-3">Procedure</h2>
            <ol className="list-decimal list-inside space-y-2">
              {procedures.filter(proc => proc.trim()).map((procedure, index) => (
                <li key={index} className="text-[var(--ink2)]">{procedure}</li>
              ))}
            </ol>
          </div>
        )}

        {sections.length > 0 && (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id}>
                {section.type === 'heading' && section.content && (
                  <h2 className="text-2xl font-bold text-[var(--ink)] heading mb-3">{section.content}</h2>
                )}
                {section.type === 'text' && section.content && (
                  <div 
                    className="prose max-w-none text-[var(--ink2)]" 
                    dangerouslySetInnerHTML={{ __html: section.content }} 
                  />
                )}
                {section.type === 'image' && section.content && (
                  <div className={`my-4 text-${section.settings?.alignment || 'left'}`}>
                    <img 
                      src={section.content} 
                      alt="Template content" 
                      className="max-w-full h-auto rounded-lg shadow-md inline-block" 
                    />
                  </div>
                )}
                {section.type === 'divider' && (
                  <hr className="my-6 border-t-2 border-[var(--paper3)]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/faculty/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
                LabSync
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/faculty/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/faculty/templates" className="text-[var(--accent)] font-medium">Templates</Link>
              </nav>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-[var(--ink3)] hover:text-[var(--ink)]">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/faculty/templates" className="text-[var(--accent)] hover:text-[var(--accent2)] mb-4 inline-block">
            ← Back to Templates
          </Link>
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Edit Experiment Template</h1>
          <p className="text-[var(--ink3)]">Update template information and content</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-[var(--paper3)]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'basic'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--ink3)] hover:text-[var(--ink)]'
              }`}
            >
              Basic Information
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'content'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--ink3)] hover:text-[var(--ink)]'
              }`}
            >
              Content Builder
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--ink3)] hover:text-[var(--ink)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'basic' ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <h2 className="text-xl font-bold text-[var(--ink)] heading mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Experiment Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Verification of Ohm's Law"
                    className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief overview of the experiment..."
                    className="w-full px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Objectives */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--ink)] heading">Objectives *</h2>
                <button
                  type="button"
                  onClick={addObjective}
                  className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-3">
                {objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      placeholder={`Objective ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                    />
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Procedure */}
            <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--ink)] heading">Procedure Steps</h2>
                <button
                  type="button"
                  onClick={addProcedure}
                  className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent2)] transition"
                >
                  + Add Step
                </button>
              </div>
              <div className="space-y-3">
                {procedures.map((procedure, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="px-3 py-2 bg-[var(--paper)] text-[var(--ink3)] rounded font-medium min-w-[40px] text-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={procedure}
                      onChange={(e) => updateProcedure(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-[var(--paper3)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] outline-none"
                    />
                    {procedures.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProcedure(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'content' ? (
          <div>
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Content Builder:</strong> Add rich content sections for Aim, Apparatus, Formulas, Diagrams, and more using the drag-and-drop editor.
              </p>
            </div>
            <DragDropBuilder sections={sections} onChange={setSections} />
          </div>
        ) : (
          <div>
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Preview Mode:</strong> This is how your template will appear to students.
              </p>
            </div>
            {renderPreview()}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="mt-8 flex gap-4 sticky bottom-4 bg-white border border-[var(--paper3)] rounded-lg p-4 shadow-lg">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/faculty/templates"
            className="px-6 py-3 bg-white border border-[var(--paper3)] text-[var(--ink)] rounded-lg hover:border-[var(--accent)] transition text-center"
          >
            Cancel
          </Link>
        </div>
      </main>
    </div>
  );
}
