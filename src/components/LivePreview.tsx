import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Smartphone, Monitor, RefreshCw, AlertCircle } from 'lucide-react';

interface LivePreviewProps {
  code: string;
  deviceType: 'desktop' | 'mobile' | 'react-native' | 'flutter';
  codeFormat: 'react-mui' | 'react-native' | 'flutter';
  onClose: () => void;
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
  onClose
}) => {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(
    (deviceType === 'desktop' || deviceType === 'mobile') ? deviceType : 'mobile'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Function to create a DartPad URL for Flutter code
  const createDartPadUrl = useCallback((flutterCode: string) => {
    const encodedCode = encodeURIComponent(flutterCode);
    // DartPad embed URL with the code
    return `https://dartpad.dev/embed-flutter.html?id=${Date.now()}&split=60&theme=dark&run=true&null_safety=true&code=${encodedCode}`;
  }, []);

  // Function to create an Expo Snack URL for React Native code
  const createSnackUrl = useCallback((reactNativeCode: string) => {
    // Configuration object for Expo Snack
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
      platform: 'ios', // Default platform
      theme: 'light' // Default theme
    };

    // Encode the configuration object for the URL
    const encodedConfig = encodeURIComponent(btoaUnicode(JSON.stringify(snackConfig)));
    return `https://snack.expo.dev/embed?screen=preview&theme=light&code=${encodedConfig}`;
  }, []);

  // Function to prepare React code (from LLM) for CodeSandbox
  const prepareCodeForCodeSandbox = useCallback((rawCode: string) => {
    if (!rawCode || !rawCode.trim()) {
        console.warn("prepareCodeForCodeSandbox: No raw code provided.");
        return 'function App() { return <div>No code provided.</div>; }';
    }

    let processedCode = rawCode.trim();

    // 1. Remove markdown code block fences (```jsx, ```)
    processedCode = processedCode.replace(/```(?:jsx?|javascript|tsx?|typescript)?\s*|```\s*$/g, '').trim();

    // Store existing imports to merge/reconstruct later
    const existingImports: { [key: string]: Set<string> } = {
        'react': new Set(),
        '@mui/material': new Set(),
        '@mui/icons-material': new Set()
    };
    let reactDefaultImportExists = false;

    // Extract and temporarily remove existing import statements
    const importStatements: string[] = [];
    processedCode = processedCode.replace(/^\s*import\s+(.*?)from\s*['"](.*?)['"];?\s*$/gm, (match, p1, p2) => {
        importStatements.push(match);
        const source = p2.trim();
        const componentsMatch = p1.match(/\{([^}]+)\}/);
        if (componentsMatch) {
            componentsMatch[1].split(',').forEach((comp: string) => {
                const trimmedComp = comp.trim();
                if (trimmedComp) {
                    existingImports[source]?.add(trimmedComp);
                }
            });
        }
        if (p1.includes('React') && !componentsMatch) {
            reactDefaultImportExists = true;
        }
        return ''; // Remove import lines for now
    }).trim();

    // 2. Rename 'GeneratedComponent' to 'App' if present
    if (processedCode.includes('GeneratedComponent')) {
        processedCode = processedCode.replace(/GeneratedComponent/g, 'App');
    }

    // 3. Handle exports:
    // Remove any existing `export default` for the component
    processedCode = processedCode.replace(/^\s*export\s+default\s+(?:GeneratedComponent|App|[^;]+);?\s*$/gm, '').trim();
    // Remove other named exports that might conflict with a default export, if any.
    processedCode = processedCode.replace(/^\s*export\s+(?:const|let|var|function|class)\s+\w+.*?;?\s*$/gm, '').trim();

    // Now, ensure there's a valid 'App' functional component structure.
    let finalAppComponentContent = processedCode;
    const isAlreadyAppComponentDefinition = processedCode.includes('function App(') || processedCode.includes('const App = () =>');

    if (!isAlreadyAppComponentDefinition) {
        let contentToWrap = processedCode;
        const functionBodyReturnMatch = processedCode.match(/return\s*(\(?[\s\S]*?\)?;?)/);
        if (functionBodyReturnMatch && functionBodyReturnMatch[1]) {
            contentToWrap = functionBodyReturnMatch[1].trim();
            if (contentToWrap.endsWith(';')) {
                contentToWrap = contentToWrap.slice(0, -1);
            }
        } else {
             const functionBodyMatch = processedCode.match(/(?:function\s+\w+\s*\(.*?\)|const\s+\w+\s*=\s*\(.*?\)\s*=>)\s*\{([\s\S]*)\}/);
             if (functionBodyMatch && functionBodyMatch[1]) {
                 contentToWrap = functionBodyMatch[1].trim();
             }
        }

        const seemsLikeJSX = contentToWrap.startsWith('<') && contentToWrap.endsWith('>') &&
                             /<[a-zA-Z0-9]+[\s>]/g.test(contentToWrap);

        if (seemsLikeJSX) {
            const wrappedJsx = contentToWrap.includes('\n') && !contentToWrap.startsWith('(') ? `(\n${contentToWrap}\n)` : contentToWrap;
            finalAppComponentContent = `function App() { return ${wrappedJsx}; }`;
        } else {
            console.warn("prepareCodeForCodeSandbox: Code does not seem like JSX or a component. Using text fallback.");
            finalAppComponentContent = `function App() { return <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}><h2>Preview Error: Could not parse component</h2><p>The generated code did not result in a valid React component structure.</p><pre>${processedCode}</pre></div>; }`;
        }
    }

    // --- Reconstruct Imports ---
    const allImports: string[] = [];

    // React import
    let reactNamedImports = Array.from(existingImports['react']);
    if (!reactDefaultImportExists) { // Only add 'React' default if not already there
        // Check if React.useState, React.useEffect etc. are used, implying default React import needed
        if (processedCode.includes('React.')) {
            reactDefaultImportExists = true;
        }
    }

    // Add named hooks if used directly and not already imported
    const hooksUsedDirectly = new Set<string>();
    if (finalAppComponentContent.includes('useState') && !finalAppComponentContent.includes('React.useState') && !existingImports['react'].has('useState')) hooksUsedDirectly.add('useState');
    if (finalAppComponentContent.includes('useEffect') && !finalAppComponentContent.includes('React.useEffect') && !existingImports['react'].has('useEffect')) hooksUsedDirectly.add('useEffect');
    if (finalAppComponentContent.includes('useRef') && !finalAppComponentContent.includes('React.useRef') && !existingImports['react'].has('useRef')) hooksUsedDirectly.add('useRef');
    if (finalAppComponentContent.includes('useCallback') && !finalAppComponentContent.includes('React.useCallback') && !existingImports['react'].has('useCallback')) hooksUsedDirectly.add('useCallback');
    
    hooksUsedDirectly.forEach(hook => reactNamedImports.push(hook));
    reactNamedImports = Array.from(new Set(reactNamedImports)); // Deduplicate again

    if (reactDefaultImportExists || reactNamedImports.length > 0) {
        let reactImportLine = 'import ';
        if (reactDefaultImportExists) {
            reactImportLine += 'React';
            if (reactNamedImports.length > 0) {
                reactImportLine += `, { ${reactNamedImports.join(', ')} }`;
            }
        } else if (reactNamedImports.length > 0) {
            reactImportLine += `{ ${reactNamedImports.join(', ')} }`;
        }
        reactImportLine += " from 'react';";
        allImports.push(reactImportLine);
    }


    // MUI Material imports
    const muiMaterialComponents = Array.from(existingImports['@mui/material']);
    // Add components used in the raw code but not imported
    const commonlyUsedMuiComponents = ['Box', 'Typography', 'Button', 'Grid', 'IconButton', 'CircularProgress', 'Stack', 'Container', 'Paper', 'TextField', 'Checkbox', 'Radio', 'Select', 'MenuItem', 'AppBar', 'Toolbar', 'Menu', 'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell'];
    commonlyUsedMuiComponents.forEach(comp => {
        if (processedCode.includes(comp) && !muiMaterialComponents.includes(comp)) {
            muiMaterialComponents.push(comp);
        }
    });
    if (muiMaterialComponents.length > 0) {
        allImports.push(`import { ${Array.from(new Set(muiMaterialComponents)).sort().join(', ')} } from '@mui/material';`);
    }

    // MUI Icons imports
    const muiIcons = Array.from(existingImports['@mui/icons-material']);
    // Add icons used in the raw code but not imported
    const commonlyUsedMuiIcons = ['Brightness4', 'Brightness7', 'AcUnit', 'AccessAlarm', 'Accessibility', 'AccountCircle', 'Add', 'ArrowBack', 'ArrowForward', 'Check', 'Close', 'Delete', 'Edit', 'Favorite', 'Home', 'Info', 'Mail', 'Menu', 'Notifications', 'Person', 'Search', 'Settings', 'Star', 'Visibility', 'VisibilityOff'];
    commonlyUsedMuiIcons.forEach(icon => {
        if (processedCode.includes(icon) && !muiIcons.includes(icon)) {
            muiIcons.push(icon);
        }
    });
    if (muiIcons.length > 0) {
        allImports.push(`import { ${Array.from(new Set(muiIcons)).sort().join(', ')} } from '@mui/icons-material';`);
    }

    let finalCode = allImports.join('\n') + '\n\n' + finalAppComponentContent;

    // Finally, ensure the default export for App
    finalCode = `${finalCode}\n\nexport default App;`;

    return finalCode;
}, []);

  // Function to create a CodeSandbox URL for React/MUI code
  const createCodeSandboxUrl = useCallback(async (reactCode: string, isMui: boolean) => {
    // Basic package.json dependencies
    const dependencies: { [key: string]: string } = {
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
    };

    if (isMui) {
      dependencies['@mui/material'] = '^5.15.15';
      dependencies['@emotion/react'] = '^11.11.1';
      dependencies['@emotion/styled'] = '^11.11.0';
      dependencies['@mui/icons-material'] = '^5.15.14'; // Ensure icons are available
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
  <title>React CodeSandbox Preview</title>
  ${isMui ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />' : ''}
  ${isMui ? '<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />' : ''}
</head>
<body>
  <div id="root"></div>
  <script src="src/index.js"></script>
</body>
</html>`,
        isBinary: false
      },
      'src/App.js': {
        content: reactCode, // This is the LLM generated code, processed to be an 'App' component
        isBinary: false
      },
      'src/index.js': {
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
${isMui ? `
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // For consistent styling
const theme = createTheme(); // Simple default theme for demo purposes
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
      // Use CodeSandbox's define API to create a sandbox
      const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ files })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`CodeSandbox API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      // Construct the embed URL. `view=preview` shows only the preview pane.
      // `hidenavigation=1` hides the sidebar. `module=/src/App.js` focuses on the App component.
      return `https://codesandbox.io/embed/${data.sandbox_id}?fontsize=14&hidenavigation=1&module=/src/App.js&theme=light&view=preview`;
    } catch (error) {
      console.error('Error defining CodeSandbox:', error);
      throw error;
    }
  }, []);

  // Function to initialize React preview (now using CodeSandbox)
  const initializeReactPreview = useCallback(async () => {
    if (codeFormat !== 'react-mui') return;

    try {
      setIsLoading(true);
      setError(null);
      setPreviewUrl(''); // Clear previous URL immediately

      console.log('Initializing React preview with code (first 100 chars):', code?.substring(0, 100));

      const processedCode = prepareCodeForCodeSandbox(code);
      console.log('Processed code for CodeSandbox:', processedCode.substring(0, 100) + '...');

      const url = await createCodeSandboxUrl(processedCode, codeFormat === 'react-mui');
      setPreviewUrl(url);

    } catch (error: unknown) {
      console.error('Failed to initialize React preview with CodeSandbox:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred during preview initialization.');
      setIsLoading(false); // Ensure loading state is turned off on error
    }
  }, [code, codeFormat, prepareCodeForCodeSandbox, createCodeSandboxUrl]); // Added dependencies

  // useEffect hook to handle preview initialization based on code and format
  useEffect(() => {
    console.log('LivePreview useEffect triggered:', {
      codeLength: code?.length,
      codeFormat,
      hasCode: !!code?.trim()
    });

    if (!code || !code.trim()) {
      setError('No code provided for preview. Please enter some code.');
      setIsLoading(false);
      return;
    }

    let cleanup: (() => void) | undefined;
    let timer: NodeJS.Timeout | undefined;

    if (codeFormat === 'flutter') {
      setIsLoading(true);
      const url = createDartPadUrl(code);
      setPreviewUrl(url);
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 7000);
      cleanup = () => clearTimeout(timer!);
    } else if (codeFormat === 'react-native') {
      setIsLoading(true);
      const url = createSnackUrl(code);
      setPreviewUrl(url);
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 7000);
      cleanup = () => clearTimeout(timer!);
    } else if (codeFormat === 'react-mui') {
      // For React/MUI, initialize via CodeSandbox
      initializeReactPreview()
        .then(() => {
          // CodeSandbox will handle its own loading, but we can potentially
          // use the iframe's onLoad to definitively mark as not loading if needed.
        })
        .catch(() => {
          // Error already set by initializeReactPreview
        });
      // No specific cleanup for CodeSandbox URL as it's a remote resource
    }

    // Cleanup function when component unmounts or dependencies change
    return () => {
      if (cleanup) cleanup();
      // No URL.revokeObjectURL for CodeSandbox URLs as they are external
    };
  }, [code, codeFormat, createDartPadUrl, createSnackUrl, initializeReactPreview]);

  // Render method for React-based previews (react-mui)
  const renderReactPreview = () => {
    return (
      <div className="flex-grow relative overflow-hidden w-full h-full">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4 text-blue-600">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p>Loading preview...</p>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10 p-4">
            <div className="text-center text-red-600 max-w-lg">
              <AlertCircle className="mx-auto mb-2" size={48} />
              <h3 className="text-lg font-semibold">Preview Error</h3>
              <p className="text-sm mb-4">{error}</p>
              <details className="text-left text-xs bg-white p-3 rounded border border-gray-200 shadow-sm">
                <summary className="cursor-pointer font-medium">Debug Info</summary>
                <div className="mt-2">
                  <strong>Code Format:</strong> {codeFormat}
                  <br />
                  <strong>Code Length:</strong> {code?.length || 0} characters
                  <br />
                  <strong>Original Code (first 200 chars):</strong>
                  <pre className="bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-20 text-xs">
                    {code?.substring(0, 200)}...
                  </pre>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Iframe for preview */}
        {previewUrl && !error && (
          <div className="w-full h-full flex justify-center items-center p-4">
            <div
              className={`${
                previewDevice === 'mobile'
                  ? 'border-8 border-gray-800 rounded-[2.5rem] shadow-2xl transition-all duration-300'
                  : 'border border-gray-300 rounded-lg shadow-lg transition-all duration-300'
              } overflow-hidden bg-white`}
              style={{
                width: previewDevice === 'mobile' ? '375px' : '100%',
                height: previewDevice === 'mobile' ? '667px' : '100%',
                maxWidth: previewDevice === 'mobile' ? '375px' : '1200px',
                maxHeight: previewDevice === 'mobile' ? '667px' : '800px',
                boxSizing: 'content-box',
                padding: previewDevice === 'mobile' ? '20px 10px 40px 10px' : '0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {/* Fake phone notch/speaker for mobile view */}
              {previewDevice === 'mobile' && (
                <>
                  <div className="absolute top-0 w-2/5 h-6 bg-gray-800 rounded-b-xl z-20" />
                  <div className="absolute top-2 w-10 h-1 bg-gray-600 rounded-full z-20" />
                  <div className="absolute bottom-4 w-20 h-2 bg-gray-600 rounded-full z-20" />
                </>
              )}
              <iframe
                ref={iframeRef}
                src={previewUrl}
                title="React Preview"
                className="w-full h-full"
                style={{
                  border: 'none',
                  borderRadius: previewDevice === 'mobile' ? '1.8rem' : '0.5rem',
                  display: 'block'
                }}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // CodeSandbox needs popups/forms
                onLoad={() => {
                  console.log('Iframe loaded (React preview - CodeSandbox)');
                  // CodeSandbox handles its own loading, but we can set a small delay just in case
                  setTimeout(() => {
                    setIsLoading(false);
                  }, 500);
                }}
                onError={(e) => {
                  console.error('Iframe error event (CodeSandbox):', e);
                  setError('Failed to load CodeSandbox content. Check browser console for details.');
                  setIsLoading(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render method for external previews (Flutter, React Native)
  const renderExternalPreview = () => {
    const platformName = codeFormat === 'flutter' ? 'DartPad' : 'Expo Snack';
    const phoneFrameWidth = 375 + 20;
    const phoneFrameHeight = 667 + 20;

    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 text-blue-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p>Loading {platformName} preview...</p>
          </div>
        ) : previewUrl ? (
          <div
            className="relative flex items-center justify-center overflow-hidden border-[10px] border-gray-800 rounded-[40px] shadow-2xl bg-gray-900"
            style={{
              width: `${phoneFrameWidth}px`,
              height: `${phoneFrameHeight}px`,
            }}
          >
            {/* Phone notch and speaker */}
            <div className="absolute top-0 w-2/5 h-6 bg-gray-800 rounded-b-xl z-20" />
            <div className="absolute top-2 w-10 h-1 bg-gray-600 rounded-full z-20" />
            <div className="absolute bottom-4 w-20 h-2 bg-gray-600 rounded-full z-20" />

            <iframe
              ref={iframeRef}
              src={previewUrl}
              title={`${platformName} Preview`}
              style={{
                width: '375px',
                height: '667px',
                border: 'none',
                borderRadius: '30px',
                backgroundColor: 'white',
              }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              onLoad={() => {
                console.log('Iframe loaded (external preview)');
                setTimeout(() => setIsLoading(false), 500);
              }}
              onError={(e) => {
                console.error('Iframe error (external):', e);
                setError('Failed to load external preview.');
                setIsLoading(false);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-red-600">
            <AlertCircle size={48} />
            <h3 className="text-lg font-semibold">Unable to load preview</h3>
            <p className="text-sm text-gray-600 text-center">
              Please check your code for errors or try refreshing.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Handler for the refresh button
  const handleRefresh = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setPreviewUrl(''); // Clear current URL to ensure reload

    if (codeFormat === 'react-mui') {
      initializeReactPreview(); // Re-initialize CodeSandbox
    } else if (codeFormat === 'flutter') {
      setPreviewUrl(createDartPadUrl(code));
      setTimeout(() => setIsLoading(false), 3000);
    } else if (codeFormat === 'react-native') {
      setPreviewUrl(createSnackUrl(code));
      setTimeout(() => setIsLoading(false), 3000);
    }
  }, [code, codeFormat, createDartPadUrl, createSnackUrl, initializeReactPreview]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col">
        {/* Header section of the preview modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Live Preview - {codeFormat === 'react-mui' ? 'React' : codeFormat === 'react-native' ? 'React Native' : 'Flutter'}
            </h2>

            {/* Device Toggle buttons, only visible for React previews */}
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
                  <Smartphone size={16} /> Mobile
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Monitor size={16} /> Desktop
                </button>
              </div>
            )}
          </div>

          {/* Action buttons (Refresh, Close) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main preview content area */}
        <div className="flex-1 overflow-hidden">
          {codeFormat === 'react-mui' ? renderReactPreview() : renderExternalPreview()}
        </div>
      </div>
    </div>
  );
};

export default LivePreview;