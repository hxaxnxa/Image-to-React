import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  CssBaseline,
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Fade,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Code,
  Visibility,
  BugReport,
  Publish,
  AutoAwesome,
  GitHub,
  Lightbulb
} from '@mui/icons-material';
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
  return code
    .replace(/^```(?:javascript|jsx)?\n/, '')
    .replace(/^```.*\n/, '')
    .replace(/```$/, '')
    .trim();
};

// Professional theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

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

  const handleSuccess = (message) => {
    setNotification({ open: true, message, severity: 'success' });
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
    handleSuccess('Debug info logged to console');
  };

  const handlePreviewClick = () => {
    console.log('Preview button clicked');
    
    const validation = validateCode(generatedCode);
    if (!validation.valid) {
      handleError(validation.message);
      return;
    }

    if (!['desktop', 'mobile'].includes(deviceType)) {
      handleError('Invalid device type selected');
      return;
    }

    setIsPreviewOpen(true);
  };

  const handleCodeGenerated = (code) => {
    const cleanedCode = cleanCode(code);
    setGeneratedCode(cleanedCode);
    if (cleanedCode) {
      handleSuccess('Code generated successfully!');
    }
  };

  const getStepStatus = () => {
    return {
      images: images.length > 0,
      description: uiDescription.trim().length > 0,
      prompt: userPrompt.trim().length > 0,
      code: generatedCode.trim().length > 0,
    };
  };

  const stepStatus = getStepStatus();
  const progress = Object.values(stepStatus).filter(Boolean).length * 25;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <AutoAwesome sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
              Image to React
            </Typography>
            <Chip label="AI Powered" size="small" color="primary" variant="outlined" />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View on GitHub">
              <IconButton color="inherit" sx={{ color: 'text.secondary' }}>
                <GitHub />
              </IconButton>
            </Tooltip>
            <Tooltip title="Debug State">
              <IconButton onClick={debugState} sx={{ color: 'text.secondary' }}>
                <BugReport />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Progress Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 2 }}>
            Transform Images into React Code
          </Typography>
          <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Upload images, describe your UI, and generate professional React components
          </Typography>
          
          {/* Progress Bar */}
          <Box sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress: {progress}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Object.values(stepStatus).filter(Boolean).length}/4 steps completed
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Step Indicators */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            {[
              { key: 'images', label: 'Upload Images', icon: '📷' },
              { key: 'description', label: 'Edit Description', icon: '📝' },
              { key: 'prompt', label: 'Add Prompt', icon: '💭' },
              { key: 'code', label: 'Generate Code', icon: '⚡' },
            ].map((step) => (
              <Chip
                key={step.key}
                label={`${step.icon} ${step.label}`}
                color={stepStatus[step.key] ? 'primary' : 'default'}
                variant={stepStatus[step.key] ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4 }}>
          {/* Left Panel */}
          <Fade in timeout={600}>
            <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3 }}>
              <Box sx={{ p: 3, backgroundColor: 'primary.main', color: 'white' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Lightbulb />
                  Input Configuration
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  Upload images and configure your requirements
                </Typography>
              </Box>
              
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
          </Fade>

          {/* Right Panel */}
          <Fade in timeout={800}>
            <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3 }}>
              <Box sx={{ p: 3, backgroundColor: 'secondary.main', color: 'white' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Code />
                  Generated Output
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  AI-generated React code ready to use
                </Typography>
              </Box>
              
              <CodeEditor 
                code={generatedCode}
                onChange={setGeneratedCode}
                isGenerating={isGenerating}
                uiDescription={uiDescription}
                userPrompt={userPrompt}
                deviceType={deviceType}
                uploadedImage={images}
                onCodeGenerated={handleCodeGenerated}
                onGenerationComplete={() => setIsGenerating(false)}
              />
              
              <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <PublishButton 
                    code={generatedCode}
                    deviceType={deviceType}
                    disabled={!generatedCode || isGenerating}
                    variant="contained"
                    color="success"
                    startIcon={<Publish />}
                  />
                  
                  <Button 
                    variant="contained"
                    color="info"
                    onClick={handlePreviewClick}
                    disabled={!generatedCode || isGenerating}
                    startIcon={<Visibility />}
                    sx={{ borderRadius: 2 }}
                  >
                    Preview
                  </Button>
                  
                  <Button 
                    variant="outlined"
                    onClick={debugState}
                    size="small"
                    startIcon={<BugReport />}
                    sx={{ ml: 'auto', borderRadius: 2 }}
                  >
                    Debug
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Fade>
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
            sx={{ width: '100%', borderRadius: 2 }}
            elevation={6}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;