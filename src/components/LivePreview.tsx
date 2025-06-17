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
    if (!rawCode) return 'export default function App() { return <div>No code provided</div>; }';

    let cleanCode = rawCode.trim();

    // Remove markdown code blocks
    cleanCode = cleanCode.replace(/```(jsx?|javascript|tsx?|typescript)?\s*/g, '').replace(/```/g, '');

    // Remove import statements that we'll handle in dependencies
    cleanCode = cleanCode.replace(/import\s+[\s\S]*?from\s+['"]@mui\/[^'"]*['"];?\s*/g, '');
    cleanCode = cleanCode.replace(/import\s+[\s\S]*?from\s+['"]react['"];?\s*/g, '');
    cleanCode = cleanCode.replace(/import\s+[\s\S]*?from\s+['"]react-dom['"];?\s*/g, '');
    cleanCode = cleanCode.replace(/import\s+[\s\S]*?from\s+['"]@emotion\/[^'"]*['"];?\s*/g, '');

    // Remove export default statements if LLM adds it prematurely
    cleanCode = cleanCode.replace(/export\s+default\s+/g, '');

    // Replace LLM's common component name with 'App' for Sandpack's entry
    cleanCode = cleanCode.replace(/(function|const)\s+(GeneratedComponent|App)\s*=/g, 'const App =');
    cleanCode = cleanCode.replace(/function\s+GeneratedComponent/g, 'function App');

    // Handle styled components - remove them as we'll use sx props or expect direct MUI usage
    cleanCode = cleanCode.replace(/const\s+Styled\w+\s*=\s*styled\([^)]+\)\([^)]*\);?\s*/g, '');

    // Replace React.useState with useState and other React hooks
    cleanCode = cleanCode.replace(/React\.(useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer)/g, '$1');

    // Add necessary imports at the top
    const imports = [
      "import React, { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer } from 'react';",
      "import { Box, Typography, Button, TextField, Grid, Card, CardContent, CircularProgress, IconButton, CardMedia } from '@mui/material';",
      "import { Brightness4, Brightness7, Facebook, Instagram, Twitter } from '@mui/icons-material';"
    ];

    // Ensure proper component structure by wrapping if necessary
    const appComponentDefined = cleanCode.includes('function App') || cleanCode.includes('const App =');

    let finalCode = cleanCode;

    if (!appComponentDefined) {
      // If it's just JSX, wrap it in a function App
      if (cleanCode.trim().startsWith('<')) {
        finalCode = `function App() {\n  return (\n    <Box sx={{ padding: 2 }}>\n      ${cleanCode}\n    </Box>\n  );\n}`;
      } else {
        finalCode = `function App() {\n  ${cleanCode}\n}`;
      }
    }

    // Add imports and ensure export default
    if (!finalCode.includes('export default App')) {
      finalCode = finalCode.replace(/(function|const)\s+App/, 'export default $1 App');
    }

    return `${imports.join('\n')}\n\n${finalCode}`;
  };

  const getSandpackFiles = (processedCode: string) => {
    return {
      '/App.js': {
        code: processedCode,
        active: true,
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
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-[95vw] h-[95vh] max-w-7xl flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <Typography variant="h6" component="h2" className="font-semibold text-slate-800">
              Live Preview
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({codeFormat === 'react-mui' && 'Sandpack'}
                {codeFormat === 'react-native' && 'Expo Snack'}
                {codeFormat === 'flutter' && 'DartPad'})
              </span>
            </Typography>
            {codeFormat === 'react-mui' && (
              <div className="flex gap-2 p-1 bg-white rounded-md shadow-sm border border-gray-200">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-2 rounded-md transition-colors flex items-center gap-1 ${
                    previewDevice === 'desktop'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Desktop View"
                >
                  <Monitor size={18} /> <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-2 rounded-md transition-colors flex items-center gap-1 ${
                    previewDevice === 'mobile'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone size={18} /> <span className="hidden sm:inline">Mobile</span>
                </button>
                <button
                  onClick={() => setShowConsole(!showConsole)}
                  className={`p-2 rounded-md transition-colors flex items-center gap-1 ${
                    showConsole
                      ? 'bg-green-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Toggle Console"
                >
                  <Code size={18} /> <span className="hidden sm:inline">Console</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {codeFormat === 'react-mui' && (
              <button
                onClick={openInCodeSandbox}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Open in CodeSandbox"
              >
                <ExternalLink size={20} />
              </button>
            )}
            {(codeFormat === 'flutter' || codeFormat === 'react-native') && previewUrl && !isLoading && (
              <button
                onClick={openInNewTab}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-100 flex justify-center items-center">
          {codeFormat === 'react-mui' ? renderReactMUIPreview() : renderExternalPreview()}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
          <Typography variant="body2" className="flex items-center">
            {codeFormat === 'react-mui' && (
              <>
                <RefreshCw size={14} className="inline mr-2 text-blue-500" />
                Auto-refresh on code changes
              </>
            )}
          </Typography>
          <Typography variant="body2" className="font-medium">
            Powered by {codeFormat === 'react-mui' ? 'CodeSandbox Sandpack' :
                        codeFormat === 'flutter' ? 'DartPad' : 'Expo Snack'}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;