'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  imageUrl: string;
  onUpload: (url: string) => void;
  alignment?: 'left' | 'center' | 'right';
}

export default function ImageUploader({ imageUrl, onUpload, alignment = 'center' }: ImageUploaderProps) {
  const [currentAlignment, setCurrentAlignment] = useState(alignment);
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('medium');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Convert to base64 for preview (in production, upload to server/cloud)
      const reader = new FileReader();
      reader.onload = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
  });

  const handleUrlUpload = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      onUpload(url);
    }
  };

  const getSizeClass = () => {
    switch (imageSize) {
      case 'small': return 'max-w-xs';
      case 'medium': return 'max-w-md';
      case 'large': return 'max-w-2xl';
      default: return 'max-w-md';
    }
  };

  const getAlignmentClass = () => {
    switch (currentAlignment) {
      case 'left': return 'mr-auto';
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto';
      default: return 'mx-auto';
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Controls */}
      {imageUrl && (
        <div className="flex items-center gap-4 p-3 bg-[var(--paper)] rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--ink3)]">Size:</span>
            <button
              onClick={() => setImageSize('small')}
              className={`px-3 py-1 text-sm rounded ${
                imageSize === 'small' ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--ink3)]'
              }`}
            >
              Small
            </button>
            <button
              onClick={() => setImageSize('medium')}
              className={`px-3 py-1 text-sm rounded ${
                imageSize === 'medium' ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--ink3)]'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setImageSize('large')}
              className={`px-3 py-1 text-sm rounded ${
                imageSize === 'large' ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--ink3)]'
              }`}
            >
              Large
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-[var(--paper3)] pl-4">
            <span className="text-sm text-[var(--ink3)]">Align:</span>
            <button
              onClick={() => setCurrentAlignment('left')}
              className={`p-2 rounded ${
                currentAlignment === 'left' ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--ink3)]'
              }`}
              title="Align Left"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4h14v2H3V4zm0 4h10v2H3V8zm0 4h14v2H3v-2zm0 4h10v2H3v-2z"/>
              </svg>
            </button>
            <button
              onClick={() => setCurrentAlignment('center')}
              className={`p-2 rounded ${
                currentAlignment === 'center' ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--ink3)]'
              }`}
              title="Align Center"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4h14v2H3V4zm2 4h10v2H5V8zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z"/>
              </svg>
            </button>
            <button
              onClick={() => setCurrentAlignment('right')}
              className={`p-2 rounded ${
                currentAlignment === 'right' ? 'bg-[var(--accent)] text-white' : 'bg-white text-[var(--ink3)]'
              }`}
              title="Align Right"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4h14v2H3V4zm4 4h10v2H7V8zm-4 4h14v2H3v-2zm4 4h10v2H7v-2z"/>
              </svg>
            </button>
          </div>

          <button
            onClick={() => onUpload('')}
            className="ml-auto p-2 hover:bg-red-50 rounded text-red-600"
            title="Remove Image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Image Display or Upload Area */}
      {imageUrl ? (
        <div className={`${getSizeClass()} ${getAlignmentClass()}`}>
          <img
            src={imageUrl}
            alt="Uploaded content"
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>
      ) : (
        <div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-[var(--accent)] bg-[var(--accent3)]'
                : 'border-[var(--paper3)] hover:border-[var(--accent)] hover:bg-[var(--paper)]'
            }`}
          >
            <input {...getInputProps()} />
            <svg
              className="w-12 h-12 mx-auto mb-4 text-[var(--ink3)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {isDragActive ? (
              <p className="text-[var(--accent)] font-medium">Drop the image here...</p>
            ) : (
              <div>
                <p className="text-[var(--ink)] font-medium mb-2">
                  Drag & drop an image here, or click to select
                </p>
                <p className="text-sm text-[var(--ink3)]">
                  Supports: PNG, JPG, GIF, WebP
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={handleUrlUpload}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Or paste an image URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
