import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Code, Eye, Settings, Sparkles, Github, Trash2, Play, RefreshCw } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import UIDescriptionEditor from './components/UIDescriptionEditor';
import PromptBox from './components/PromptBox';
import CodeEditor from './components/CodeEditor';
import LivePreview from './components/LivePreview';
import ProgressBar from './components/ProgressBar';
import NotificationSystem from './components/NotificationSystem';
import { enhancedAzureOpenAIService } from './services/azureOpenAIService';

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

interface ValidationResult {
  valid: boolean;
  message: string;
}

// Enhanced validateCode with accessibility and responsive checks
const validateCode = (code: string, format: 'react-mui' | 'react-native' | 'flutter'): ValidationResult => {
  if (!code) {
    return { valid: false, message: 'No code provided' };
  }
  if (!code.includes('return')) {
    return { valid: false, message: 'Code must contain a return statement' };
  }
  if (format === 'react-mui') {
    if (!code.includes('aria-label') && !code.includes('role')) {
      return { valid: false, message: 'React-MUI code must include accessibility attributes (e.g., aria-label, role)' };
    }
    if (!code.includes('GeneratedComponent')) {
      return { valid: false, message: 'React-MUI code must define GeneratedComponent' };
    }
    if (!/<[A-Za-z][^>]*>/.test(code)) {
      return { valid: false, message: 'React-MUI code must contain valid JSX' };
    }
    if (!code.includes('useMediaQuery') && !code.includes('breakpoints')) {
      return { valid: false, message: 'React-MUI code must include responsive breakpoints' };
    }
  } else if (format === 'react-native') {
    if (!code.includes('accessible={true}') && !code.includes('accessibilityLabel')) {
      return { valid: false, message: 'React Native code must include accessibility props (e.g., accessible, accessibilityLabel)' };
    }
    if (!code.includes('App')) {
      return { valid: false, message: 'React Native code must define an App component' };
    }
    if (!code.includes('Dimensions')) {
      return { valid: false, message: 'React Native code must use Dimensions for responsive design' };
    }
  } else if (format === 'flutter') {
    if (!code.includes('Semantics')) {
      return { valid: false, message: 'Flutter code must include Semantics widgets for accessibility' };
    }
    if (!code.includes('App')) {
      return { valid: false, message: 'Flutter code must define an App component' };
    }
    if (!code.includes('MediaQuery')) {
      return { valid: false, message: 'Flutter code must use MediaQuery for responsive design' };
    }
  }
  return { valid: true, message: '' };
};

// Simulate multiple viewport sizes for responsive validation
const validateResponsiveDesign = (code: string, format: string): string[] => {
  const issues = [];
  const viewportWidths = [320, 768, 1280]; // Mobile, tablet, desktop
  for (const width of viewportWidths) {
    if (format === 'react-mui' && !code.includes(`breakpoints\.down\('sm'\)`) && width <= 768) {
      issues.push(`Layout may not adapt correctly for mobile (width=${width}px). Add sm breakpoint handling.`);
    }
    if (format === 'react-native' && !code.includes(`Dimensions\.get\('window'\)\.width < ${width}`)) {
      issues.push(`Layout may not scale for width=${width}px. Use Dimensions for dynamic sizing.`);
    }
    if (format === 'flutter' && !code.includes(`screenWidth < ${width}`)) {
      issues.push(`Layout may not adjust for width=${width}px. Use MediaQuery for responsive design.`);
    }
  }
  return issues;
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
  const [viewportWidth, setViewportWidth] = useState(1280);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const handleImagesUploaded = useCallback(async (files: File[]) => {
    const newImages: ImageData[] = files.map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      description: '',
      code: '',
      isGenerating: false,
    }));
    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0 && !selectedImageId) {
      setSelectedImageId(newImages[0].id);
    }
    for (const image of newImages) {
      try {
        setImages((prev) => prev.map((img) =>
          img.id === image.id ? { ...img, isGenerating: true } : img
        ));
        const description = await enhancedAzureOpenAIService.generateUIDescription(image.file);
        setImages((prev) => prev.map((img) =>
          img.id === image.id ? { ...img, description, isGenerating: false } : img
        ));
        addNotification(`Description generated for ${image.file.name}`, 'success');
      } catch (error) {
        console.error('Error generating description:', error);
        setImages((prev) => prev.map((img) =>
          img.id === image.id ? { ...img, isGenerating: false } : img
        ));
        addNotification(`Failed to generate description for ${image.file.name}`, 'error');
      }
    }
  }, [selectedImageId, addNotification]);

  const handleDescriptionChange = useCallback((imageId: string, description: string) => {
    setImages((prev) => prev.map((img) =>
      img.id === imageId ? { ...img, description } : img
    ));
  }, []);

  const handleCodeChange = useCallback((imageId: string, code: string) => {
    setImages((prev) => prev.map((img) =>
      img.id === imageId ? { ...img, code } : img
    ));
  }, []);

  const generateCodeForImage = useCallback(async (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (!image || !image.description) {
      addNotification('Please ensure the image has a description', 'warning');
      return;
    }
    try {
      setImages((prev) => prev.map((img) =>
        img.id === imageId ? { ...img, isGenerating: true } : img
      ));
      const code = await enhancedAzureOpenAIService.generateReactCode(
        image.description,
        userPrompt,
        deviceType,
        codeFormat
      );
      const responsiveIssues = validateResponsiveDesign(code, codeFormat);
      if (responsiveIssues.length > 0) {
        responsiveIssues.forEach((issue) => addNotification(issue, 'warning'));
      }
      setImages((prev) => prev.map((img) =>
        img.id === image.id ? { ...img, code, isGenerating: false } : img
      ));
      addNotification(`Code generated for ${image.file.name}`, 'success');
    } catch (error) {
      console.error('Error generating code:', error);
      setImages((prev) => prev.map((img) =>
        img.id === image.id ? { ...img, isGenerating: false } : img
      ));
      addNotification(`Failed to generate code for ${image.file.name}`, 'error');
    }
  }, [images, userPrompt, deviceType, codeFormat, addNotification]);

  const generateAllCodes = useCallback(async () => {
    const validImages = images.filter((img) => img.description);
    if (validImages.length === 0) {
      addNotification('No images with descriptions found', 'warning');
      return;
    }
    setIsGeneratingAll(true);
    setGlobalProgress(0);
    setImages((prev) => prev.map((img) => ({ ...img, code: '', isGenerating: true })));
    for (let i = 0; i < validImages.length; i++) {
      const image = validImages[i];
      try {
        const code = await enhancedAzureOpenAIService.generateReactCode(
          image.description,
          userPrompt,
          deviceType,
          codeFormat
        );
        const responsiveIssues = validateResponsiveDesign(code, codeFormat);
        if (responsiveIssues.length > 0) {
          responsiveIssues.forEach((issue) => addNotification(issue, 'warning'));
        }
        setImages((prev) => prev.map((img) =>
          img.id === image.id ? { ...img, code, isGenerating: false } : img
        ));
        setGlobalProgress(((i + 1) / validImages.length) * 100);
      } catch (error) {
        console.error('Error generating code:', error);
        setImages((prev) => prev.map((img) =>
          img.id === image.id ? { ...img, isGenerating: false } : img
        ));
        addNotification(`Failed to generate code for ${image.file.name}`, 'error');
      }
    }
    setIsGeneratingAll(false);
    addNotification('All codes generated successfully!', 'success');
  }, [images, userPrompt, deviceType, codeFormat, addNotification]);

  const removeImage = useCallback((imageId: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imageId);
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
    const selectedImage = images.find((img) => img.id === selectedImageId);
    if (!selectedImage?.code) {
      addNotification('No code available for preview', 'warning');
      return;
    }
    const validation = validateCode(selectedImage.code, codeFormat);
    if (!validation.valid) {
      addNotification(validation.message, 'error');
      return;
    }
    setIsPreviewOpen(true);
  }, [images, selectedImageId, codeFormat, addNotification]);

  const selectedImage = images.find((img) => img.id === selectedImageId);
  const hasImages = images.length > 0;
  const hasDescriptions = images.some((img) => img.description);
  const hasCodes = images.some((img) => img.code);

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
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex">
        <div className="flex-grow">
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Transform Designs into Production Code
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload UI designs, generate descriptions, and create accessible, responsive React components with AI
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
                    deviceType={deviceType === 'desktop' || deviceType === 'mobile' ? deviceType : 'desktop'}
                    onDeviceTypeChange={setDeviceType}
                    codeFormat={codeFormat}
                    onCodeFormatChange={setCodeFormat}
                    viewportWidth={viewportWidth}
                    onViewportWidthChange={setViewportWidth}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Generated Code
                  </h3>
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
              viewportWidth={viewportWidth}
              previewRef={previewRef}
            />
          )}
        </div>
      </main>
      <NotificationSystem notifications={notifications} />
    </div>
  );
}

export default App;