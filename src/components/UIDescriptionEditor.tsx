import React from 'react';
import { FileText, Loader2, Wand2 } from 'lucide-react';

interface UIDescriptionEditorProps {
  imageId: string;
  description: string;
  onChange: (imageId: string, description: string) => void;
  isGenerating: boolean;
}

const UIDescriptionEditor: React.FC<UIDescriptionEditorProps> = ({
  imageId,
  description,
  onChange,
  isGenerating
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-900 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          UI Description
        </label>
        {isGenerating && (
          <div className="flex items-center text-sm text-blue-600">
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Generating...
          </div>
        )}
      </div>
      
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => onChange(imageId, e.target.value)}
          placeholder="AI will automatically generate a detailed description of your uploaded image. You can edit it here to refine the output..."
          className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          disabled={isGenerating}
        />
        
        {!description && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-400">
              <Wand2 className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Upload an image to generate description</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>{description.length} characters</span>
        <span>AI-generated descriptions are editable</span>
      </div>
    </div>
  );
};

export default UIDescriptionEditor;