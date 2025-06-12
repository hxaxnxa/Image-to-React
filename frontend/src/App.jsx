import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Typography, Box, Paper, Button, Snackbar, Alert } from '@mui/material';
import ImageUpload from './components/ImageUpload';
import UIDescriptionEditor from './components/UIDescriptionEditor';
import PromptBox from './components/PromptBox';
import CodeEditor from './components/CodeEditor';
import PreviewModal from './components/PreviewModal';
import PublishButton from './components/PublishButton';
import { validateCode } from './utils/codeGenerator';

// Utility function to clean Markdown code blocks from generated code
const cleanCode = (code) => {
  if (!code) return '';
  // Remove Markdown code block wrappers (```javascript, ```language, or plain ```)
  return code
    .replace(/^```(?:javascript|jsx)?\n/, '') // Remove opening ```javascript or ```jsx
    .replace(/^```.*\n/, '') // Remove any other ```language
    .replace(/```$/, '') // Remove closing ```
    .trim(); // Remove leading/trailing whitespace
};

const theme = createTheme();

function App() {
  const [images, setImages] = useState([]);
  const [uiDescription, setUiDescription] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [deviceType, setDeviceType] = useState('desktop');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleError = (message, severity = 'error') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const debugState = () => {
    console.log('=== APP STATE DEBUG ===');
    console.log('generatedCode length:', generatedCode ? generatedCode.length : 0);
    console.log('generatedCode preview:', generatedCode ? generatedCode.substring(0, 200) + '...' : 'No code');
    console.log('deviceType:', deviceType);
    console.log('isGenerating:', isGenerating);
    console.log('uiDescription:', uiDescription ? uiDescription.substring(0, 200) + '...' : 'No description');
    console.log('images count:', images.length);
  };

  const handlePreviewClick = () => {
    debugState();
    console.log('Preview button clicked');
    console.log('Generated code for preview:', generatedCode);

    // Validate code before opening preview
    const validation = validateCode(generatedCode);
    if (!validation.valid) {
      handleError(validation.message);
      return;
    }

    // Ensure deviceType is valid
    if (!['desktop', 'mobile'].includes(deviceType)) {
      handleError('Invalid device type selected');
      return;
    }

    setIsPreviewOpen(true);
  };

  // Clean code before storing it
  const handleCodeGenerated = (code) => {
    const cleanedCode = cleanCode(code);
    setGeneratedCode(cleanedCode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Figma to React
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 4 }}>
          {/* Left Panel */}
          <Paper sx={{ p: 3 }}>
            <ImageUpload 
              setImages={setImages}
              onDescriptionGenerated={setUiDescription}
              onError={handleError}
            />
            
            <UIDescriptionEditor 
              description={uiDescription}
              onChange={setUiDescription}
            />
            
            <PromptBox 
              prompt={userPrompt}
              onChange={setUserPrompt}
              onGenerate={() => setIsGenerating(true)}
              deviceType={deviceType}
              onDeviceTypeChange={setDeviceType}
            />
          </Paper>

          {/* Right Panel */}
          <Paper sx={{ p: 3 }}>
            <CodeEditor 
              code={generatedCode}
              onChange={setGeneratedCode}
              isGenerating={isGenerating}
              uiDescription={uiDescription}
              userPrompt={userPrompt}
              deviceType={deviceType}
              uploadedImage={images}
              onCodeGenerated={handleCodeGenerated} // Use cleaned code
              onGenerationComplete={() => setIsGenerating(false)}
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <PublishButton 
                code={generatedCode}
                deviceType={deviceType}
                disabled={!generatedCode || isGenerating}
              />
              
              <Button 
                variant="outlined" 
                onClick={handlePreviewClick}
                disabled={!generatedCode || isGenerating}
              >
                Preview
              </Button>
              
              <Button 
                variant="text" 
                onClick={debugState}
                size="small"
                sx={{ ml: 'auto' }}
              >
                Debug State
              </Button>
            </Box>
          </Paper>
        </Box>

        <PreviewModal 
          open={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          code={generatedCode}
          deviceType={deviceType}
        />
        
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;