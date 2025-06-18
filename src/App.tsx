import React, { useState, useCallback } from 'react';
import { Upload, Code, Eye, Settings, Sparkles, Github, Bug, Trash2, Play, RefreshCw } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import UIDescriptionEditor from './components/UIDescriptionEditor';
import PromptBox from './components/PromptBox';
import CodeEditor from './components/CodeEditor';
import LivePreview from './components/LivePreview';
import ProgressBar from './components/ProgressBar';
import NotificationSystem from './components/NotificationSystem';
import { geminiService } from './services/geminiService';

interface ImageData {
  id: string;
  file: File;
  preview: string;
  description: string;
  code: string;
  isGenerating: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Modified validateCode to be aware of codeFormat
const validateCode = (code: string, format: 'react-mui' | 'react-native' | 'flutter') => {
  if (!code) {
    return { valid: false, message: 'No code provided' };
  }

  // Common checks for React-like structures
  if (!code.includes('return')) {
    return { valid: false, message: 'Code must contain a return statement' };
  }

  if (format === 'react-mui') {
    // For React MUI, the LLM usually generates 'GeneratedComponent'
    if (!code.includes('GeneratedComponent')) {
      return { valid: false, message: 'React-MUI code must define GeneratedComponent' };
    }
    if (!/<[A-Za-z][^>]*>/.test(code)) {
      return { valid: false, message: 'React-MUI code must contain valid JSX' };
    }
  } else if (format === 'react-native' || format === 'flutter') {
    // For React Native/Flutter, expect 'App' as the main component
    if (!code.includes('App')) {
      return { valid: false, message: `${format} code must define an 'App' component.` };
    }
  }
  
  return { valid: true, message: '' };
};

function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState('');
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'react-native' | 'flutter'>('desktop');
  const [codeFormat, setCodeFormat] = useState<'react-mui' | 'react-native' | 'flutter'>('react-mui');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const handleImagesUploaded = useCallback(async (files: File[]) => {
    const newImages: ImageData[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      description: '',
      code: '',
      isGenerating: false
    }));

    setImages(prev => [...prev, ...newImages]);
    
    if (newImages.length > 0 && !selectedImageId) {
      setSelectedImageId(newImages[0].id);
    }

    for (const image of newImages) {
      try {
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, isGenerating: true } : img
        ));

        const description = await geminiService.generateUIDescription(image.file);
        
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, description, isGenerating: false }
            : img
        ));

        addNotification(`Description generated for ${image.file.name}`, 'success');
      } catch (error) {
        console.error('Error generating description:', error);
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, isGenerating: false } : img
        ));
        addNotification(`Failed to generate description for ${image.file.name}`, 'error');
      }
    }
  }, [selectedImageId, addNotification]);

  const handleDescriptionChange = useCallback((imageId: string, description: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, description } : img
    ));
  }, []);

  const handleCodeChange = useCallback((imageId: string, code: string) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, code } : img
    ));
  }, []);

  const generateCodeForImage = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image || !image.description) {
      addNotification('Please ensure the image has a description', 'warning');
      return;
    }

    try {
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, isGenerating: true } : img
      ));

      const code = await geminiService.generateReactCode(
        image.description,
        userPrompt,
        deviceType,
        codeFormat
      );

      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { ...img, code, isGenerating: false }
          : img
      ));

      addNotification(`Code generated for ${image.file.name}`, 'success');
    } catch (error) {
      console.error('Error generating code:', error);
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, isGenerating: false } : img
      ));
      addNotification(`Failed to generate code for ${image.file.name}`, 'error');
    }
  }, [images, userPrompt, deviceType, codeFormat, addNotification]);

  const generateAllCodes = useCallback(async () => {
    const validImages = images.filter(img => img.description);
    if (validImages.length === 0) {
      addNotification('No images with descriptions found', 'warning');
      return;
    }

    setIsGeneratingAll(true);
    setGlobalProgress(0);

    setImages(prev => prev.map(img => ({ ...img, code: '', isGenerating: true })));

    for (let i = 0; i < validImages.length; i++) {
      const image = validImages[i];
      try {
        const code = await geminiService.generateReactCode(
          image.description,
          userPrompt,
          deviceType,
          codeFormat
        );

        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, code, isGenerating: false }
            : img
        ));

        setGlobalProgress(((i + 1) / validImages.length) * 100);
      } catch (error) {
        console.error('Error generating code:', error);
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, isGenerating: false } : img
        ));
        addNotification(`Failed to generate code for ${image.file.name}`, 'error');
      }
    }

    setIsGeneratingAll(false);
    addNotification('All codes generated successfully!', 'success');
  }, [images, userPrompt, deviceType, codeFormat, addNotification]);

  const removeImage = useCallback((imageId: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      if (selectedImageId === imageId && filtered.length > 0) {
        setSelectedImageId(filtered[0].id);
      } else if (filtered.length === 0) {
        setSelectedImageId('');
      }
      return filtered;
    });
    addNotification('Image removed', 'info');
  }, [selectedImageId, addNotification]);

  const handlePreviewClick = useCallback(() => {
    const selectedImage = images.find(img => img.id === selectedImageId);
    if (!selectedImage?.code) {
      addNotification('No code available for preview', 'warning');
      return;
    }

    // Pass codeFormat to validateCode
    const validation = validateCode(selectedImage.code, codeFormat); 
    if (!validation.valid) {
      addNotification(validation.message, 'error');
      return;
    }

    // This check below is not strictly needed anymore because validateCode handles format-specific checks.
    // If you want to keep a redundant check for safety, ensure it's accurate.
    // The previous check was: `if (!['desktop', 'mobile'].includes(deviceType) && codeFormat === 'react-mui') { ... }`
    // Which was trying to prevent react-mui from opening with 'react-native' or 'flutter' deviceType,
    // but the `LivePreview` handles device type correctly based on `codeFormat` now.
    
    setIsPreviewOpen(true);
  }, [images, selectedImageId, codeFormat, addNotification]); // Added codeFormat to dependencies

  const selectedImage = images.find(img => img.id === selectedImageId);
  const hasImages = images.length > 0;
  const hasDescriptions = images.some(img => img.description);
  const hasCodes = images.some(img => img.code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Figma to React</h1>
                <p className="text-sm text-slate-500">AI-Powered Design Converter</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Github className="h-5 w-5" />
              </button>
              <button 
                onClick={() => console.log('Debug:', { images, selectedImageId, userPrompt, deviceType })}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bug className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Transform Designs into Production Code
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Upload UI designs, generate descriptions, and create responsive React components with AI
            </p>
          </div>
          
          <ProgressBar 
            steps={[
              { label: 'Upload Images', completed: hasImages, icon: Upload },
              { label: 'Generate Descriptions', completed: hasDescriptions, icon: Settings },
              { label: 'Add Requirements', completed: userPrompt.length > 0, icon: Code },
              { label: 'Generate Code', completed: hasCodes, icon: Play }
            ]}
            globalProgress={globalProgress}
            isGeneratingAll={isGeneratingAll}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Input Configuration
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Upload designs and configure requirements
                </p>
              </div>
              <div className="p-6 space-y-6">
                <ImageUpload 
                  onImagesUploaded={handleImagesUploaded}
                  images={images}
                  selectedImageId={selectedImageId}
                  onImageSelect={setSelectedImageId}
                  onImageRemove={removeImage}
                />
                {selectedImage && (
                  <UIDescriptionEditor
                    imageId={selectedImage.id}
                    description={selectedImage.description}
                    onChange={handleDescriptionChange}
                    isGenerating={selectedImage.isGenerating}
                  />
                )}
                <PromptBox
                  prompt={userPrompt}
                  onChange={setUserPrompt}
                  deviceType={deviceType === "desktop" || deviceType === "mobile" ? deviceType : "desktop"}
                  onDeviceTypeChange={setDeviceType}
                  codeFormat={codeFormat}
                  onCodeFormatChange={setCodeFormat}
                />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  Generated Code
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  AI-generated production-ready code
                </p>
              </div>
              <div className="p-6">
                <CodeEditor
                  images={images}
                  selectedImageId={selectedImageId}
                  onImageSelect={setSelectedImageId}
                  onCodeChange={handleCodeChange}
                  onGenerateCode={generateCodeForImage}
                  onGenerateAll={generateAllCodes}
                  isGeneratingAll={isGeneratingAll}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePreviewClick}
                disabled={!selectedImage?.code || isGeneratingAll}
                className="flex-1 min-w-[140px] bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Live Preview
              </button>
              <button
                onClick={generateAllCodes}
                disabled={!hasDescriptions || isGeneratingAll}
                className="flex-1 min-w-[140px] bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {isGeneratingAll ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Generate All
              </button>
            </div>
          </div>
        </div>
        {isPreviewOpen && selectedImage?.code && (
          <LivePreview
            code={selectedImage.code}
            deviceType={deviceType}
            codeFormat={codeFormat}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
      </main>
      <NotificationSystem notifications={notifications} />
    </div>
  );
}

export default App;