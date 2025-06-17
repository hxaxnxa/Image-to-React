import React, { useState, useEffect, useRef } from 'react';
import { X, Smartphone, Monitor, RefreshCw, AlertCircle, ExternalLink, Code } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import {
  Sandpack,
  SandpackPreview,
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackConsole
} from '@codesandbox/sandpack-react';

interface LivePreviewProps {
  code: string;
  deviceType: 'desktop' | 'mobile' | 'react-native' | 'flutter';
  codeFormat: 'react-mui' | 'react-native' | 'flutter';
  onClose: () => void;
}

// Helper function for Base64 encoding
const btoaUnicode = (str: string) => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode(parseInt(p1, 16))
  ));
};

const LivePreview: React.FC<LivePreviewProps> = ({
  code,
  deviceType,
  codeFormat,
  onClose
}) => {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(
    (deviceType === 'desktop' || deviceType === 'mobile') ? deviceType : 'mobile'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showConsole, setShowConsole] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Fixed dimensions function for better desktop preview
  const getSandpackPreviewDimensions = () => {
    if (previewDevice === 'mobile') {
      return { 
        width: '375px', 
        height: '667px', 
        maxWidth: '375px', 
        maxHeight: '667px' 
      };
    }
    // Desktop dimensions - use fixed large dimensions for proper desktop view
    return { 
      width: '1200px', 
      height: '800px', 
      maxWidth: '100%', 
      maxHeight: '100%' 
    };
  };

  const getExternalPreviewDimensions = () => {
    return { width: '375px', height: '667px' };
  };

  const createDartPadUrl = (flutterCode: string) => {
    const encodedCode = encodeURIComponent(flutterCode);
    return `https://dartpad.dev/embed-flutter.html?id=${Date.now()}&split=60&theme=dark&run=true&null_safety=true&code=${encodedCode}`;
  };

  const createSnackUrl = (reactNativeCode: string) => {
    const snackConfig = {
      files: {
        'App.js': {
          type: 'CODE',
          contents: reactNativeCode
        }
      },
      dependencies: {
        'react-native': '0.73.0',
        'expo': '~50.0.0'
      },
      platform: 'ios',
      theme: 'light'
    };

    const encodedConfig = encodeURIComponent(btoaUnicode(JSON.stringify(snackConfig)));
    return `https://snack.expo.dev/embed?screen=preview&theme=light&code=${encodedConfig}`;
  };

  const prepareCodeForSandpack = (rawCode: string) => {
    if (!rawCode) return 'export default function GeneratedComponent() { return <div>No code provided</div>; }';

    let cleanCode = rawCode.trim();

    // Remove markdown code blocks if present
    cleanCode = cleanCode.replace(/```(?:jsx?|javascript|tsx?|typescript)?\s*/g, '').replace(/```\s*/g, '');

    // Remove ALL existing export default statements first
    cleanCode = cleanCode.replace(/^\s*export\s+default\s+\w+\s*;?\s*$/gm, '');
    cleanCode = cleanCode.replace(/export\s+default\s+(?:function\s+)?(\w+)/g, 'function $1');

    // Ensure the component is named 'GeneratedComponent' for consistency
    cleanCode = cleanCode.replace(/(function|const)\s+(App)\s*\(/g, '$1 GeneratedComponent(');
    cleanCode = cleanCode.replace(/(function|const)\s+(App)\s*=/g, '$1 GeneratedComponent =');
    cleanCode = cleanCode.replace(/function\s+App\s*\(/g, 'function GeneratedComponent(');

    // Replace React.useState with useState and other React hooks if needed
    cleanCode = cleanCode.replace(/React\.(useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer)/g, '$1');

    // Handle styled components - remove them as we expect sx props or direct MUI usage
    cleanCode = cleanCode.replace(/const\s+Styled\w+\s*=\s*styled\([^)]+\)\([^)]*\);?\s*/g, '');

    // Clean up any duplicate or malformed function declarations
    const functionMatches = cleanCode.match(/(?:function\s+GeneratedComponent|const\s+GeneratedComponent\s*=)/g);
    if (functionMatches && functionMatches.length > 1) {
      // Keep only the first function declaration and remove duplicates
      let firstFound = false;
      cleanCode = cleanCode.replace(/(?:function\s+GeneratedComponent.*?(?=\n(?:function|const|export|$))|const\s+GeneratedComponent\s*=.*?(?=\n(?:function|const|export|$)))/gs, (match) => {
        if (!firstFound) {
          firstFound = true;
          return match;
        }
        return '';
      });
    }

    // Ensure proper component structure
    const generatedComponentDefined = cleanCode.includes('function GeneratedComponent') || cleanCode.includes('const GeneratedComponent =');

    let finalCode = cleanCode;

    // If 'GeneratedComponent' component is not defined, provide a fallback structure
    if (!generatedComponentDefined) {
      // If it's just JSX, wrap it in a function GeneratedComponent
      if (cleanCode.trim().startsWith('<')) {
        finalCode = `import React from 'react';
import { Box, Typography } from '@mui/material';

function GeneratedComponent() {
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6">Generated Content</Typography>
      <Typography>The generated code structure has been corrected.</Typography>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8em', background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        {${JSON.stringify(cleanCode.substring(0, 500))}...}
      </pre>
    </Box>
  );
}

export default GeneratedComponent;`;
      } else {
        // If it's not JSX and no GeneratedComponent component, create a basic one
        finalCode = `import React from 'react';
import { Box, Typography } from '@mui/material';

function GeneratedComponent() {
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6">Generated Content</Typography>
      <Typography>The generated code has been processed successfully.</Typography>
    </Box>
  );
}

export default GeneratedComponent;`;
      }
    } else {
      // Add single export default at the end
      finalCode = finalCode.trim();
      if (!finalCode.includes('export default GeneratedComponent')) {
        finalCode += '\n\nexport default GeneratedComponent;';
      }
    }

    // Final cleanup - remove any remaining duplicate exports
    const exportLines = finalCode.match(/^\s*export\s+default\s+GeneratedComponent\s*;?\s*$/gm);
    if (exportLines && exportLines.length > 1) {
      // Remove all export default lines first
      finalCode = finalCode.replace(/^\s*export\s+default\s+GeneratedComponent\s*;?\s*$/gm, '');
      // Add single export at the end
      finalCode = finalCode.trim() + '\n\nexport default GeneratedComponent;';
    }

    return finalCode;
  };

  const getSandpackFiles = (processedCode: string) => {
    return {
      '/GeneratedComponent.js': {
        code: processedCode,
        active: true,
      },
      '/App.js': {
        code: `import React from 'react';
import GeneratedComponent from './GeneratedComponent';

export default function App() {
  return <GeneratedComponent />;
}`,
      },
      '/index.js': {
        code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);`,
      },
      '/public/index.html': {
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
      },
    };
  };

  const sandpackDependencies = {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    '@mui/material': '^5.14.0',
    '@mui/icons-material': '^5.14.0',
    '@emotion/react': '^11.11.0',
    '@emotion/styled': '^11.11.0',
  };

  useEffect(() => {
    if (code && (codeFormat === 'flutter' || codeFormat === 'react-native')) {
      setIsLoading(true);
      let url = '';
      if (codeFormat === 'flutter') {
        url = createDartPadUrl(code);
      } else if (codeFormat === 'react-native') {
        url = createSnackUrl(code);
      }
      setPreviewUrl(url);

      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 7000);

      const currentIframe = iframeRef.current;
      const handleLoad = () => {
        setIsLoading(false);
        clearTimeout(timer);
      };
      if (currentIframe) {
        currentIframe.addEventListener('load', handleLoad);
      }

      return () => {
        clearTimeout(timer);
        if (currentIframe) {
          currentIframe.removeEventListener('load', handleLoad);
        }
      };
    } else if (codeFormat === 'react-mui') {
      setIsLoading(false);
      setPreviewUrl('');
    }
  }, [code, codeFormat]);

  const sandpackDimensions = getSandpackPreviewDimensions();
  const externalDimensions = getExternalPreviewDimensions();

  const renderReactMUIPreview = () => {
    const processedCode = prepareCodeForSandpack(code);
    const files = getSandpackFiles(processedCode);

    return (
      <SandpackProvider
        theme="light"
        files={files}
        template="react"
        customSetup={{ dependencies: sandpackDependencies }}
      >
        <SandpackLayout className="flex flex-col h-full">
          <div
            className={`flex-grow relative overflow-hidden ${
              previewDevice === 'desktop' 
                ? 'flex items-center justify-center p-2' 
                : 'flex justify-center items-center p-4'
            }`}
            style={{ 
              minHeight: previewDevice === 'desktop' ? '800px' : '667px',
              width: '100%'
            }}
          >
            <SandpackPreview
              showOpenInCodeSandbox={false}
              showRefreshButton={true}
              style={{
                width: sandpackDimensions.width,
                height: sandpackDimensions.height,
                maxWidth: sandpackDimensions.maxWidth,
                maxHeight: sandpackDimensions.maxHeight,
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'white',
                boxShadow: previewDevice === 'mobile' ? '0 4px 15px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                ...(previewDevice === 'desktop' && {
                  transform: 'scale(0.8)',
                  transformOrigin: 'center center'
                })
              }}
            />
          </div>
          {showConsole && (
            <div className="mt-4 border-t pt-4">
              <Typography variant="subtitle2" className="mb-2 flex items-center gap-1 text-slate-700">
                <Code size={16} /> Console & Code
              </Typography>
              <SandpackCodeEditor
                showTabs={true}
                showLineNumbers={true}
                style={{
                  height: '250px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}
              />
              <SandpackConsole
                style={{
                  height: '150px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}
        </SandpackLayout>
      </SandpackProvider>
    );
  };

  const renderExternalPreview = () => {
    const platformName = codeFormat === 'flutter' ? 'DartPad' : 'Expo Snack';
    const phoneFrameWidth = parseInt(externalDimensions.width) + 20;
    const phoneFrameHeight = parseInt(externalDimensions.height) + 20;

    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 text-blue-600">
            <CircularProgress />
            <Typography>
              Loading {platformName} preview... This may take a moment.
            </Typography>
            {codeFormat === 'flutter' && (
              <Typography variant="caption" className="text-gray-500 text-center">
                (Note: Very long Flutter code might exceed URL limits for DartPad.)
              </Typography>
            )}
          </div>
        ) : previewUrl ? (
          <div
            className="relative flex items-center justify-center overflow-hidden border-[10px] border-gray-800 rounded-[40px] shadow-2xl bg-gray-900"
            style={{
              width: `${phoneFrameWidth}px`,
              height: `${phoneFrameHeight}px`,
              margin: '0 auto',
              transition: 'all 0.3s ease',
            }}
          >
            <div className="absolute top-0 w-20 h-4 bg-gray-800 rounded-b-lg z-20"></div>
            <div className="absolute bottom-2 w-20 h-1.5 bg-gray-500 rounded-full z-20"></div>
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title={`${platformName} Preview`}
              style={{
                width: externalDimensions.width,
                height: externalDimensions.height,
                border: 'none',
                borderRadius: '30px',
                backgroundColor: 'white',
                zIndex: 1,
              }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-pointer-lock allow-downloads allow-top-navigation"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-red-600">
            <AlertCircle size={48} />
            <Typography variant="h6">
              Unable to load preview for {platformName}
            </Typography>
            <Typography variant="body2" className="text-gray-700 text-center">
              Please check your internet connection or try again. The code might have syntax errors, or unsupported features, or be too large for the embed service.
            </Typography>
            <button
              onClick={() => {
                if (codeFormat === 'flutter') {
                  setPreviewUrl(createDartPadUrl(code));
                } else if (codeFormat === 'react-native') {
                  setPreviewUrl(createSnackUrl(code));
                }
                setIsLoading(true);
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}
      </div>
    );
  };

  const openInCodeSandbox = () => {
    const processedCode = prepareCodeForSandpack(code);
    const files = getSandpackFiles(processedCode);

    const sandboxConfig = {
      files,
      dependencies: sandpackDependencies,
      template: 'react'
    };

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'parameters';
    input.value = JSON.stringify(sandboxConfig);

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getDeviceIcon = (device: 'desktop' | 'mobile') => {
    return device === 'desktop' ? <Monitor size={16} /> : <Smartphone size={16} />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Typography variant="h6" className="font-semibold text-gray-800">
              Live Preview - {codeFormat === 'react-mui' ? 'React MUI' : codeFormat === 'react-native' ? 'React Native' : 'Flutter'}
            </Typography>
            
            {/* Device Toggle - Only show for React MUI */}
            {codeFormat === 'react-mui' && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {getDeviceIcon('mobile')} Mobile
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {getDeviceIcon('desktop')} Desktop
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Console Toggle - Only for React MUI */}
            {codeFormat === 'react-mui' && (
              <button
                onClick={() => setShowConsole(!showConsole)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  showConsole
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Code size={16} /> Console
              </button>
            )}

            {/* Open in CodeSandbox - Only for React MUI */}
            {codeFormat === 'react-mui' && (
              <button
                onClick={openInCodeSandbox}
                className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <ExternalLink size={16} /> CodeSandbox
              </button>
            )}

            {/* Open in New Tab - For external previews */}
            {(codeFormat === 'react-native' || codeFormat === 'flutter') && previewUrl && (
              <button
                onClick={openInNewTab}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <ExternalLink size={16} /> Open in {codeFormat === 'flutter' ? 'DartPad' : 'Expo'}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {codeFormat === 'react-mui' ? renderReactMUIPreview() : renderExternalPreview()}
        </div>
      </div>
    </div>
  );
};

export default LivePreview;