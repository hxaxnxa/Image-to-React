import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Smartphone, Monitor, RefreshCw, AlertCircle } from 'lucide-react';

interface LivePreviewProps {
  code: string;
  deviceType: 'desktop' | 'mobile' | 'react-native' | 'flutter';
  codeFormat: 'react-mui' | 'react-native' | 'flutter';
  onClose: () => void;
  viewportWidth: number;
  previewRef: React.MutableRefObject<HTMLIFrameElement | null>;
}

// Helper function for Base64 encoding (used by Expo Snack)
const btoaUnicode = (str: string) => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    (match, p1) => String.fromCharCode(parseInt(p1, 16))
  ));
};

const LivePreview: React.FC<LivePreviewProps> = ({
  code,
  deviceType,
  codeFormat,
  onClose,
  viewportWidth: initialViewportWidth,
  previewRef
}) => {
  const [viewportWidth, setViewportWidth] = useState(initialViewportWidth);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(
    (deviceType === 'desktop' || deviceType === 'mobile') ? deviceType : 'mobile'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Function to create a DartPad URL for Flutter code
  const createDartPadUrl = useCallback(async (flutterCode: string): Promise<string> => {
    try {
      let cleanCode = flutterCode.trim();
      cleanCode = cleanCode.replace(/```(?:dart|flutter)?\s*|```\s*$/g, '').trim();
      if (!cleanCode.includes('import \'package:flutter/material.dart\'')) {
        cleanCode = 'import \'package:flutter/material.dart\';\n\n' + cleanCode;
      }
      if (!cleanCode.includes('void main()')) {
        const widgetMatch = cleanCode.match(/class\s+(\w+)\s+extends\s+(?:StatelessWidget|StatefulWidget)/);
        const widgetName = widgetMatch ? widgetMatch[1] : 'MyApp';
        if (!cleanCode.includes('runApp(')) {
          cleanCode = cleanCode + `\n\nvoid main() {\n  runApp(const ${widgetName}());\n}`;
        }
      }
      const maxUrlLength = 7000;
      const encodedCode = encodeURIComponent(cleanCode);
      if (encodedCode.length <= maxUrlLength) {
        return `https://dartpad.dev/?source=${encodedCode}&theme=dark&run=true&null_safety=true`;
      }
      const simpleFlutterApp = `import 'package:flutter/material.dart';
void main() {
  runApp(const MyApp());
}
class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Preview',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: Scaffold(
        appBar: AppBar(title: const Text('Flutter Preview'), backgroundColor: Colors.blue),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.flutter_dash, size: 100, color: Colors.blue),
              SizedBox(height: 20),
              Text('Flutter Preview', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              SizedBox(height: 10),
              Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  'Code was too complex for direct preview. Please copy the code to your local Flutter environment.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}`;
      const simpleEncodedCode = encodeURIComponent(simpleFlutterApp);
      return `https://dartpad.dev/?source=${simpleEncodedCode}&theme=dark&run=true&null_safety=true`;
    } catch (err) {
      console.error('Error creating DartPad URL:', err);
      throw new Error(`Failed to create DartPad preview: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  // Function to create an Expo Snack URL for React Native code
  const createSnackUrl = useCallback((reactNativeCode: string): string => {
    try {
      const snackConfig = {
        files: {
          'App.js': { type: 'CODE', contents: reactNativeCode }
        },
        dependencies: {
          'react-native': '0.73.0',
          'expo': '~50.0.0',
          '@react-native-picker/picker': '^2.7.0',
          '@expo/vector-icons': '^14.0.0'
        },
        platform: 'ios',
        theme: 'light'
      };
      const encodedConfig = encodeURIComponent(btoaUnicode(JSON.stringify(snackConfig)));
      return `https://snack.expo.dev/embed?screen=preview&theme=light&code=${encodedConfig}`;
    } catch (err) {
      console.error('Error creating Snack URL:', err);
      throw new Error(`Failed to create Expo Snack preview: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  // Utility function to fix import statements
  const fixImportStatements = useCallback((code: string, format: 'react-mui' | 'react-native' | 'flutter'): string => {
    if (format === 'flutter') {
      let cleanCode = code.trim();
      cleanCode = cleanCode.replace(/```(?:dart|flutter)?\s*|```\s*$/g, '').trim();
      return cleanCode;
    }
    const importRegex = /import\s*(?:(\w+)\s*,?\s*)*(?:{\s*([^}]*)\s*})?\s*from\s*['"]([^'"]+)['"]*;?/g;
    let codeWithoutImports = code.replace(importRegex, '').trim();
    if (format === 'react-native') {
      const reactNamedImports = new Set<string>();
      const rnNamedImports = new Set<string>();
      let needsReactNativePickerImport = false;
      const otherImports: string[] = [];
      let match;
      importRegex.lastIndex = 0;
      while ((match = importRegex.exec(code)) !== null) {
        const defaultImport = match[1];
        const namedImports = match[2];
        const modulePath = match[3];
        if (modulePath === 'react') {
          if (namedImports) {
            namedImports.split(',').forEach(name => {
              const trimmedName = name.trim();
              if (trimmedName) reactNamedImports.add(trimmedName);
            });
          }
        } else if (modulePath === 'react-native') {
          if (namedImports) {
            namedImports.split(',').forEach(name => {
              const trimmedName = name.trim();
              if (trimmedName === 'Picker') {
                needsReactNativePickerImport = true;
              } else if (trimmedName) {
                rnNamedImports.add(trimmedName);
              }
            });
          }
        } else if (modulePath === '@react-native-picker/picker') {
          needsReactNativePickerImport = true;
        } else if (!modulePath.includes('@mui')) {
          otherImports.push(match[0]);
        }
      }
      let cleanImports = '';
      const sortedReactNamedImports = Array.from(reactNamedImports).sort();
      let reactImportString = 'import React';
      if (sortedReactNamedImports.length > 0) {
        reactImportString += `, { ${sortedReactNamedImports.join(', ')} }`;
      }
      reactImportString += " from 'react';\n";
      cleanImports += reactImportString;
      const sortedRnNamedImports = Array.from(rnNamedImports).sort();
      if (sortedRnNamedImports.length > 0) {
        cleanImports += `import { ${sortedRnNamedImports.join(', ')} } from 'react-native';\n`;
      }
      if (needsReactNativePickerImport || code.includes('<Picker')) {
        cleanImports += `import { Picker } from '@react-native-picker/picker';\n`;
      }
      otherImports.forEach(imp => {
        cleanImports += imp + '\n';
      });
      return cleanImports + '\n' + codeWithoutImports;
    } else if (format === 'react-mui') {
      const reactNamedImports = new Set<string>();
      const muiComponents = new Set<string>();
      const otherImports: string[] = [];
      let match;
      importRegex.lastIndex = 0;
      while ((match = importRegex.exec(code)) !== null) {
        const defaultImport = match[1];
        const namedImports = match[2];
        const modulePath = match[3];
        if (modulePath === 'react') {
          if (namedImports) {
            namedImports.split(',').forEach(name => {
              const trimmedName = name.trim();
              if (trimmedName) reactNamedImports.add(trimmedName);
            });
          }
        } else if (modulePath === '@mui/material') {
          if (namedImports) {
            namedImports.split(',').forEach(name => {
              const trimmedName = name.trim();
              if (trimmedName) muiComponents.add(trimmedName);
            });
          }
        } else {
          otherImports.push(match[0]);
        }
      }
      let cleanImports = '';
      const sortedReactNamedImports = Array.from(reactNamedImports).sort();
      let reactImportString = 'import React';
      if (sortedReactNamedImports.length > 0) {
        reactImportString += `, { ${sortedReactNamedImports.join(', ')} }`;
      }
      reactImportString += " from 'react';\n";
      cleanImports += reactImportString;
      if (muiComponents.size > 0) {
        const sortedMuiComponents = Array.from(muiComponents).sort();
        cleanImports += `import { ${sortedMuiComponents.join(', ')} } from '@mui/material';\n`;
      }
      otherImports.forEach(imp => {
        cleanImports += imp + '\n';
      });
      return cleanImports + '\n' + codeWithoutImports;
    }
    return code;
  }, []);

  // Prepare code for preview
  const prepareCodeForPreview = useCallback((rawCode: string): string => {
    if (!rawCode || !rawCode.trim()) {
      return codeFormat === 'flutter' 
        ? `import 'package:flutter/material.dart';
void main() => runApp(MyApp());
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: Scaffold(body: Center(child: Text('No code provided'))));
  }
}`
        : 'function App() { return <div>No code provided.</div>; }';
    }
    let processedCode = rawCode.trim();
    processedCode = fixImportStatements(processedCode, codeFormat);
    processedCode = processedCode.replace(/```(?:jsx?|javascript|tsx?|typescript|dart|flutter)?\s*|```\s*$/g, '').trim();
    if (codeFormat === 'flutter') {
      return processedCode;
    }
    if (codeFormat === 'react-native') {
      if (processedCode.includes('GeneratedComponent')) {
        processedCode = processedCode.replace(/GeneratedComponent/g, 'App');
      }
      if (!processedCode.includes('export default App')) {
        if (processedCode.includes('function App') || processedCode.includes('const App =')) {
          processedCode = processedCode + '\n\nexport default App;';
        } else {
          processedCode = `function App() {\n  return (\n    ${processedCode}\n  );\n}\n\nexport default App;`;
        }
      }
      return processedCode;
    }
    if (processedCode.includes('GeneratedComponent')) {
      processedCode = processedCode.replace(/GeneratedComponent/g, 'App');
    }
    processedCode = processedCode.replace(/^\s*export\s+default\s+(?:GeneratedComponent|App|[^;]+);?\s*$/gm, '').trim();
    processedCode = processedCode.replace(/^\s*export\s+(?:const|let|var|function|class)\s+\w+.*?;?\s*$/gm, '').trim();
    const isAlreadyAppComponentDefinition = processedCode.includes('function App(') || processedCode.includes('const App =');
    if (!isAlreadyAppComponentDefinition) {
      const seemsLikeJSX = processedCode.includes('<') && processedCode.includes('>') && /<[a-zA-Z0-9]+[\s>]/g.test(processedCode);
      if (seemsLikeJSX) {
        const wrappedJsx = processedCode.includes('\n') && !processedCode.startsWith('(') ? `(\n${processedCode}\n)` : processedCode;
        processedCode = `function App() {\n  return ${wrappedJsx};\n}`;
      } else {
        processedCode = `function App() {\n  return (\n    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>\n      <h2>Preview Error: Could not parse component</h2>\n      <p>The generated code did not result in a valid React component structure.</p>\n      <pre>{${JSON.stringify(rawCode)}}</pre>\n    </div>
  );\n}`;
      }
    }
    if (!processedCode.includes('export default App')) {
      processedCode = `${processedCode}\n\nexport default App;`;
    }
    return processedCode;
  }, [fixImportStatements, codeFormat]);

  // Create CodeSandbox URL for React/MUI
  const createCodeSandboxUrl = useCallback(async (reactCode: string, isMui: boolean): Promise<string> => {
    const dependencies: { [key: string]: string } = {
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
    };
    if (isMui) {
      dependencies['@mui/material'] = '^5.15.15';
      dependencies['@emotion/react'] = '^11.11.1';
      dependencies['@emotion/styled'] = '^11.11.0';
      dependencies['@mui/icons-material'] = '^5.15.14';
      dependencies['formik'] = '^2.4.6';
      dependencies['yup'] = '^1.6.1';
    }
    const files: { [key: string]: { content: string, isBinary: boolean } } = {
      'package.json': {
        content: JSON.stringify({
          name: 'llm-generated-react-app',
          version: '1.0.0',
          private: true,
          dependencies: dependencies,
          browserslist: ['>0.2%', 'not dead', 'not op_mini all']
        }, null, 2),
        isBinary: false
      },
      'public/index.html': {
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  ${isMui ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />' : ''}
  ${isMui ? '<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />' : ''}
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
        isBinary: false
      },
      'src/App.js': {
        content: reactCode,
        isBinary: false
      },
      'src/index.js': {
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
${isMui ? `
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
const theme = createTheme();
` : ''}
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found!");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      ${isMui ? `<ThemeProvider theme={theme}><CssBaseline />` : ''}
      <App />
      ${isMui ? `</ThemeProvider>` : ''}
    </React.StrictMode>
  );
}
`,
        isBinary: false
      }
    };
    try {
      const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ files })
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(`CodeSandbox API error: ${response.status} - ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      if (!data.sandbox_id) {
        throw new Error('No sandbox ID returned from CodeSandbox API');
      }
      return `https://codesandbox.io/embed/${data.sandbox_id}?fontsize=14&hidenavigation=1&module=/src/App.js&theme=dark&view=preview`;
    } catch (error) {
      console.error('Error defining CodeSandbox:', error);
      // Wrap error to avoid modifying read-only properties
      throw new Error(`Failed to create CodeSandbox preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Initialize preview
  const initializePreview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPreviewUrl('');
      if (!code || !code.trim()) {
        throw new Error('No code provided for preview');
      }
      let url: string;
      if (codeFormat === 'react-mui') {
        const processedCode = prepareCodeForPreview(code);
        url = await createCodeSandboxUrl(processedCode, true);
      } else if (codeFormat === 'react-native') {
        const processedCode = prepareCodeForPreview(code);
        url = createSnackUrl(processedCode);
      } else if (codeFormat === 'flutter') {
        const processedCode = prepareCodeForPreview(code);
        url = await createDartPadUrl(processedCode);
      } else {
        throw new Error(`Unsupported code format: ${codeFormat}`);
      }
      if (!url) {
        throw new Error('Failed to create preview URL');
      }
      setPreviewUrl(url);
    } catch (error: unknown) {
      console.error('Failed to initialize preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during preview initialization.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [code, codeFormat, prepareCodeForPreview, createCodeSandboxUrl, createSnackUrl, createDartPadUrl]);

  useEffect(() => {
    if (!code || !code.trim()) {
      setError('No code provided for preview. Please enter some code.');
      setIsLoading(false);
      return;
    }
    initializePreview();
    return () => {};
  }, [code, codeFormat, initializePreview]);

  const handleIframeLoad = useCallback(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleIframeError = useCallback(() => {
    console.error('Iframe failed to load');
    setError('Failed to load preview content. The preview service might be temporarily unavailable.');
    setIsLoading(false);
  }, []);

  const renderIframe = (title: string) => (
    <iframe
      ref={(ref) => {
        iframeRef.current = ref;
        previewRef.current = ref;
      }}
      src={previewUrl}
      title={title}
      className="w-full h-full"
      style={{
        border: 'none',
        borderRadius: previewDevice === 'mobile' ? '1.8rem' : '0',
        width: '100%',
        height: '100%',
      }}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
      onLoad={handleIframeLoad}
      onError={handleIframeError}
    />
  );

  const renderDeviceFrame = (children: React.ReactNode) => {
    const phoneFrameWidth = 375 + 20;
    const phoneFrameHeight = 667 + 60;

    // Desktop dimensions calculation
    const maxDesktopPreviewWidth = 1000; // Max width for the desktop preview frame
    const minViewportPadding = 32; // Corresponds to p-4 (16px * 2) from the outer centering div

    const effectiveViewportWidth = viewportWidth; // Use the selected viewport width as a target
    
    const calculatedDesktopWidth = Math.min(
      effectiveViewportWidth,
      window.innerWidth - minViewportPadding, // Ensure it doesn't exceed window width
      maxDesktopPreviewWidth // Hard cap at 1000px
    );
    // Maintain 16:10 aspect ratio for height relative to calculated width, and ensure it fits vertically
    const calculatedDesktopHeight = Math.min(
      calculatedDesktopWidth * (10 / 16), // Approx 0.625 ratio (16:10 aspect ratio)
      window.innerHeight - 100 // Account for header/footer around the whole preview component
    );

    return (
      // Apply items-start for vertical alignment for both mobile and desktop
      <div className="w-full h-full flex justify-center items-start p-4">
        <div
          className={`${
            previewDevice === 'mobile'
              ? 'border-8 border-gray-800 rounded-[2.5rem] shadow-2xl transition-all duration-300'
              : 'border-2 border-gray-200 rounded-xl shadow-2xl transition-all duration-300 bg-white flex flex-col'
          } overflow-hidden relative`}
          style={{
            width: previewDevice === 'mobile' ? `${phoneFrameWidth}px` : `${calculatedDesktopWidth}px`,
            height: previewDevice === 'mobile' ? `${phoneFrameHeight}px` : `${calculatedDesktopHeight}px`,
            maxWidth: previewDevice === 'mobile' ? `${phoneFrameWidth}px` : '100%',
            maxHeight: previewDevice === 'mobile' ? `${phoneFrameHeight}px` : '100%',
            padding: previewDevice === 'mobile' ? '20px 10px 40px 10px' : '0', // Mobile padding for bezels, desktop has 0
          }}
        >
          {previewDevice === 'mobile' && (
            <>
              {/* Mobile device bezels */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2/5 h-6 bg-gray-800 rounded-b-xl z-20" />
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gray-600 rounded-full z-20" />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-gray-600 rounded-full z-20" />
              {children} {/* Children for mobile directly inside */}
            </>
          )}
          {previewDevice === 'desktop' && (
            <>
              {/* Simulated browser bar */}
              <div className="h-8 bg-gray-100 border-b border-gray-300 flex items-center px-4 flex-shrink-0">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="bg-white border border-gray-300 rounded px-3 py-1 text-xs text-gray-600 inline-block">
                    {codeFormat === 'flutter' ? 'DartPad Preview' : codeFormat === 'react-native' ? 'Expo Snack Preview' : 'CodeSandbox Preview'}
                  </div>
                </div>
              </div>
              {/* Content area (iframe) */}
              <div className="flex-1 w-full overflow-hidden"> {/* flex-1 makes it take remaining height */}
                {children}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
      <div className="flex flex-col items-center gap-4 text-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p>Loading preview...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10 p-4">
      <div className="text-center text-red-600 max-w-lg">
        <AlertCircle className="mx-auto mb-2" size={48} />
        <h3 className="text-lg font-semibold">Preview Error</h3>
        <p className="text-sm mb-4">{error}</p>
        <details className="text-left text-xs bg-white p-3 rounded border border-gray-200 shadow-sm">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <div className="mt-2">
            <strong>Code Format:</strong> {codeFormat}<br />
            <strong>Code Length:</strong> {code?.length || 0} characters<br />
            <strong>Preview URL:</strong> {previewUrl || 'Not generated'}<br />
            <strong>Original Code (first 200 chars):</strong>
            <pre className="bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-20 text-xs">
              {code?.substring(0, 200)}...
            </pre>
          </div>
        </details>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full relative bg-gray-100">
      <div className="flex items-center justify-between p-2 bg-gray-800 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewDevice('mobile')}
            className={`p-2 rounded transition-colors ${previewDevice === 'mobile' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
            title="Mobile View"
          >
            <Smartphone size={20} />
          </button>
          <button
            onClick={() => setPreviewDevice('desktop')}
            className={`p-2 rounded transition-colors ${previewDevice === 'desktop' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
            title="Desktop View"
          >
            <Monitor size={20} />
          </button>
          <select
            value={viewportWidth}
            onChange={(e) => setViewportWidth(Number(e.target.value))}
            className="bg-gray-600 text-white rounded p-1 text-sm"
            disabled={previewDevice === 'mobile'}
          >
            <option value={320}>Mobile (320px)</option>
            <option value={768}>Tablet (768px)</option>
            <option value={1280}>Desktop (1280px)</option>
            <option value={1920}>Wide (1920px)</option>
          </select>
          <button
            onClick={initializePreview}
            className="p-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors"
            title="Refresh Preview"
            disabled={isLoading}
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors"
          title="Close Preview"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-grow relative overflow-hidden w-full h-full">
        {isLoading && renderLoading()}
        {error && renderError()}
        {previewUrl && !error && renderDeviceFrame(
          renderIframe(`${codeFormat === 'flutter' ? 'DartPad' : codeFormat === 'react-native' ? 'Expo Snack' : 'CodeSandbox'} Preview`)
        )}
      </div>
    </div>
  );
};

export default LivePreview;