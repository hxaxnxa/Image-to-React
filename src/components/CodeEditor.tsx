import React, { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Play, RefreshCw, Download, Copy, Check } from 'lucide-react';

interface ImageData {
  id: string;
  file: File;
  preview: string;
  description: string;
  code: string;
  isGenerating: boolean;
}

interface CodeEditorProps {
  images: ImageData[];
  selectedImageId: string;
  onImageSelect: (id: string) => void;
  onCodeChange: (imageId: string, code: string) => void;
  onGenerateCode: (imageId: string) => void;
  onGenerateAll: () => void;
  isGeneratingAll: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  images,
  selectedImageId,
  onImageSelect,
  onCodeChange,
  onGenerateCode,
  onGenerateAll,
  isGeneratingAll
}) => {
  const [copied, setCopied] = React.useState(false);
  const [editorKey, setEditorKey] = React.useState(0);
  
  const selectedImage = images.find(img => img.id === selectedImageId);
  const hasValidImages = images.some(img => img.description);

  // Force editor re-render when code changes to ensure real-time sync
  useEffect(() => {
    setEditorKey(prev => prev + 1);
  }, [selectedImage?.code]);

  const handleCopyCode = async () => {
    if (selectedImage?.code) {
      await navigator.clipboard.writeText(selectedImage.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    if (selectedImage?.code) {
      const getFileExtension = () => {
        // Determine file extension based on code content
        if (selectedImage.code.includes('import \'package:flutter/material.dart\'') || 
            selectedImage.code.includes('void main()')) {
          return 'dart';
        } else if (selectedImage.code.includes('import React') && 
                   selectedImage.code.includes('react-native')) {
          return 'js';
        } else {
          return 'jsx';
        }
      };

      const extension = getFileExtension();
      const blob = new Blob([selectedImage.code], { 
        type: extension === 'dart' ? 'text/plain' : 'text/javascript' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedImage.file.name.split('.')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getEditorLanguage = () => {
    if (!selectedImage?.code) return 'javascript';
    
    if (selectedImage.code.includes('import \'package:flutter/material.dart\'') || 
        selectedImage.code.includes('void main()')) {
      return 'dart';
    } else if (selectedImage.code.includes('import React')) {
      return 'javascript';
    }
    return 'javascript';
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedImage && value !== undefined) {
      onCodeChange(selectedImage.id, value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Selector */}
      {images.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">
            Select Image to Edit Code
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onGenerateAll}
              disabled={!hasValidImages || isGeneratingAll}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isGeneratingAll
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
            >
              {isGeneratingAll ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              ALL
            </button>
            
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => onImageSelect(image.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedImageId === image.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Image {index + 1}
                {image.isGenerating && (
                  <RefreshCw className="h-3 w-3 ml-1 animate-spin" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Code Editor */}
      {selectedImage ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-900">
                {selectedImage.file.name}
              </span>
              {selectedImage.isGenerating && (
                <div className="flex items-center text-sm text-blue-600">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </div>
              )}
              
              {/* Language Badge */}
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                {getEditorLanguage().toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onGenerateCode(selectedImage.id)}
                disabled={!selectedImage.description || selectedImage.isGenerating}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {selectedImage.isGenerating ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                Generate
              </button>
              
              {selectedImage.code && (
                <>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  
                  <button
                    onClick={handleDownloadCode}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    title="Download code"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <Editor
              key={editorKey}
              height="400px"
              defaultLanguage={getEditorLanguage()}
              language={getEditorLanguage()}
              value={selectedImage.code || '// Generated code will appear here...'}
              onChange={handleEditorChange}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
                autoIndent: 'full',
                bracketPairColorization: { enabled: true },
                suggest: {
                  showKeywords: true,
                  showSnippets: true
                }
              }}
            />
          </div>
          
          {!selectedImage.description && (
            <div className="text-center py-8 text-slate-500">
              <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Generate a description first to create code</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Images Selected</p>
          <p>Upload images to start generating code</p>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;