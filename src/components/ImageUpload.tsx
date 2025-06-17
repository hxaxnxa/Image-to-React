import React, { useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageData {
  id: string;
  file: File;
  preview: string;
  description: string;
  code: string;
  isGenerating: boolean;
}

interface ImageUploadProps {
  onImagesUploaded: (files: File[]) => void;
  images: ImageData[];
  selectedImageId: string;
  onImageSelect: (id: string) => void;
  onImageRemove: (id: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesUploaded,
  images,
  selectedImageId,
  onImageSelect,
  onImageRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onImagesUploaded(files);
    }
  }, [onImagesUploaded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onImagesUploaded(files);
    }
  }, [onImagesUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          Upload UI Design Images
        </h3>
        <p className="text-slate-600 mb-4">
          Drag and drop your design files here, or click to browse
        </p>
        <p className="text-sm text-slate-500">
          Supports: JPG, PNG, GIF, WebP (Max 10MB each)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 flex items-center">
            <ImageIcon className="h-4 w-4 mr-2" />
            Uploaded Images ({images.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedImageId === image.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => onImageSelect(image.id)}
              >
                <div className="aspect-video bg-slate-100 relative">
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {image.isGenerating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageRemove(image.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="p-2">
                  <p className="text-xs text-slate-600 truncate" title={image.file.name}>
                    {image.file.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">
                      {(image.file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                    <div className="flex space-x-1">
                      {image.description && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Description generated" />
                      )}
                      {image.code && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="Code generated" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;