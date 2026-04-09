'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Template {
  _id: string;
  title: string;
  description: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollmentNumber: string;
}

export default function NewLabGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    className: '',
    semester: '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchUserData();
    fetchTemplates();
    fetchStudents();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success && data.data.departmentId) {
        setDepartmentId(data.data.departmentId);
      }
    } catch (error) {
      console.error('Failed to fetch user data', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // In a real app, this would fetch students from the department
      // For now, we'll just show an empty list
      setStudents([]);
    } catch (error) {
      console.error('Failed to fetch students', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/lab-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          departmentId,
          students: selectedStudents,
          experimentTemplates: selectedTemplates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/coordinator/groups');
      } else {
        if (data.error?.fields) {
          setErrors(data.error.fields);
        } else {
          setErrors({ general: data.error?.message || 'Failed to create lab group' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Failed to create lab group' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--paper3)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/coordinator/dashboard" className="text-2xl font-bold text-[var(--ink)] heading">
                LabSync
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/coordinator/dashboard" className="text-[var(--ink3)] hover:text-[var(--ink)]">Dashboard</Link>
                <Link href="/coordinator/groups" className="text-[var(--accent)] font-medium">Lab Groups</Link>
                <Link href="/coordinator/faculty" className="text-[var(--ink3)] hover:text-[var(--ink)]">Faculty</Link>
                <Link href="/coordinator/reports" className="text-[var(--ink3)] hover:text-[var(--ink)]">Reports</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/coordinator/groups" className="text-[var(--accent)] hover:text-[var(--accent2)] mb-4 inline-block">
            ← Back to Lab Groups
          </Link>
          <h1 className="text-3xl font-bold text-[var(--ink)] heading mb-2">Create New Lab Group</h1>
          <p className="text-[var(--ink3)]">Set up a new lab group with students and experiments</p>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h2 className="text-xl font-bold text-[var(--ink)] heading mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--ink)] mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., CSE Batch A"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                    errors.name ? 'border-red-500' : 'border-[var(--paper3)]'
                  }`}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="className" className="block text-sm font-medium text-[var(--ink)] mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  id="className"
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                  placeholder="e.g., Third Year CSE"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                    errors.className ? 'border-red-500' : 'border-[var(--paper3)]'
                  }`}
                  required
                />
                {errors.className && (
                  <p className="mt-1 text-sm text-red-600">{errors.className}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Semester *
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                      errors.semester ? 'border-red-500' : 'border-[var(--paper3)]'
                    }`}
                    required
                  >
                    <option value="">Select semester</option>
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                  {errors.semester && (
                    <p className="mt-1 text-sm text-red-600">{errors.semester}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="academicYear" className="block text-sm font-medium text-[var(--ink)] mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    id="academicYear"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    placeholder="e.g., 2024-2025"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                      errors.academicYear ? 'border-red-500' : 'border-[var(--paper3)]'
                    }`}
                    required
                  />
                  {errors.academicYear && (
                    <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Experiment Templates */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h2 className="text-xl font-bold text-[var(--ink)] heading mb-4">Experiment Templates</h2>
            <p className="text-sm text-[var(--ink3)] mb-4">Select the experiments this group will perform</p>
            
            {templates.length === 0 ? (
              <p className="text-[var(--ink3)] text-center py-4">No templates available. Create templates first.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {templates.map(template => (
                  <label
                    key={template._id}
                    className="flex items-start gap-3 p-3 border border-[var(--paper3)] rounded-lg hover:bg-[var(--paper)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template._id)}
                      onChange={() => toggleTemplate(template._id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[var(--ink)]">{template.title}</div>
                      <div className="text-sm text-[var(--ink3)]">{template.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Students */}
          <div className="bg-white rounded-xl border border-[var(--paper3)] p-6">
            <h2 className="text-xl font-bold text-[var(--ink)] heading mb-4">Students</h2>
            <p className="text-sm text-[var(--ink3)] mb-4">Add students to this lab group (optional - can be added later)</p>
            
            {students.length === 0 ? (
              <p className="text-[var(--ink3)] text-center py-4">No students available. Students can be added later.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map(student => (
                  <label
                    key={student._id}
                    className="flex items-center gap-3 p-3 border border-[var(--paper3)] rounded-lg hover:bg-[var(--paper)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => toggleStudent(student._id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[var(--ink)]">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-[var(--ink3)]">
                        {student.enrollmentNumber} • {student.email}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Lab Group'}
            </button>
            <Link
              href="/coordinator/groups"
              className="px-6 py-3 bg-white text-[var(--ink3)] border border-[var(--paper3)] rounded-lg hover:border-[var(--accent)] transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
