const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

// Promisify exec for async/await
const execPromise = util.promisify(exec);

// Path to save generated projects
const GENERATED_PROJECTS_DIR = 'D:\\Projects\\figma-to-react-generated';
const FRONTEND_DIR = path.join(GENERATED_PROJECTS_DIR, 'frontend');

// Function to clean and prepare code for React project
const cleanCodeForReact = (code) => {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code provided');
  }

  let cleanedCode = code.trim();
  
  if (cleanedCode === '') {
    throw new Error('Empty code provided');
  }

  // Remove existing imports
  cleanedCode = cleanedCode.replace(/import\s+[\s\S]*?from\s+['"][^'"]*['"];?\s*\n?/g, '');
  
  // Remove export default
  cleanedCode = cleanedCode.replace(/export\s+default\s+/, '');
  
  // Clean up extra whitespace
  cleanedCode = cleanedCode.replace(/\n\s*\n+/g, '\n').trim();
  
  // Add comprehensive imports
  const imports = `import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  IconButton,
  useMediaQuery,
  CssBaseline,
  Paper,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Chip,
  Badge,
  Switch,
  Slider,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  Snackbar,
  Alert,
  LinearProgress,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  Stack
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
  Search,
  Close,
  AccountCircle,
  Payment,
  Home,
  FitnessCenter,
  Message,
  DirectionsRun,
  CreditCard,
  ChatBubble,
  BarChart,
  ArrowBackIos,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Add,
  Remove,
  Edit,
  Delete,
  Settings,
  Notifications,
  Person,
  Star,
  Favorite,
  Share,
  MoreVert,
  ExpandMore,
  ChevronRight,
  ChevronLeft,
  ArrowForward,
  ArrowBack,
  Check,
  Clear,
  Info,
  Warning,
  Error,
  Success
} from '@mui/icons-material';

`;

  // Combine imports with cleaned code and export
  const finalCode = `${imports}
${cleanedCode}

export default GeneratedComponent;`;

  return finalCode;
};

// Helper function to get the next version number
const getNextVersion = async () => {
  try {
    const files = await fs.readdir(GENERATED_PROJECTS_DIR);
    const versionFolders = files
      .filter(f => f.startsWith('v') && f !== 'frontend')
      .map(f => parseInt(f.replace('v', '')))
      .filter(v => !isNaN(v));
    return versionFolders.length > 0 ? Math.max(...versionFolders) : 0;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }
};

// Helper function to create or update the React project in frontend
const createReactProject = async (projectDir, code) => {
  console.log('Creating React project at:', projectDir);
  
  // Ensure the project directory exists
  await fs.mkdir(projectDir, { recursive: true });
  await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(projectDir, 'public'), { recursive: true });

  const indexJsContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);`;

  const packageJsonContent = JSON.stringify({
    "name": "frontend",
    "version": "0.1.0",
    "private": true,
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "@mui/material": "^5.15.0",
      "@mui/icons-material": "^5.15.0",
      "@emotion/react": "^11.11.0",
      "@emotion/styled": "^11.11.0",
      "react-scripts": "5.0.1"
    },
    "scripts": {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "test": "react-scripts test",
      "eject": "react-scripts eject"
    },
    "eslintConfig": {
      "extends": [
        "react-app",
        "react-app/jest"
      ]
    },
    "browserslist": {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    }
  }, null, 2);

  const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Generated React App" />
    <title>Generated React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;

  // Write all the files
  await fs.writeFile(path.join(projectDir, 'src/index.js'), indexJsContent);
  await fs.writeFile(path.join(projectDir, 'src/App.js'), code);
  await fs.writeFile(path.join(projectDir, 'package.json'), packageJsonContent);
  await fs.writeFile(path.join(projectDir, 'public/index.html'), indexHtmlContent);
  
  console.log('React project files created successfully');
};

// Helper function to backup current App.js to a versioned folder
const backupCurrentVersion = async () => {
  const currentAppPath = path.join(FRONTEND_DIR, 'src', 'App.js');
  
  // Check if current App.js exists
  try {
    await fs.access(currentAppPath);
  } catch (error) {
    // No current App.js to backup
    console.log('No existing App.js to backup');
    return 0;
  }
  
  const version = await getNextVersion() + 1;
  const versionDir = path.join(GENERATED_PROJECTS_DIR, `v${version}`);
  
  // Create version directory
  await fs.mkdir(versionDir, { recursive: true });
  
  // Copy current App.js to versioned folder as App.jsx
  const versionAppPath = path.join(versionDir, 'App.jsx');
  await fs.copyFile(currentAppPath, versionAppPath);
  
  console.log(`Backed up current version to v${version}`);
  return version;
};

// Helper function to kill process on port
const killPort = async (port) => {
  try {
    console.log(`Attempting to kill process on port ${port}`);
    // For Windows
    const result = await execPromise(`netstat -aon | findstr :${port}`, { shell: true });
    const lines = result.stdout.split('\n');
    for (const line of lines) {
      const match = line.match(/LISTENING\s+(\d+)/);
      if (match) {
        const pid = match[1];
        await execPromise(`taskkill /PID ${pid} /F`, { shell: true });
        console.log(`Killed process ${pid} on port ${port}`);
      }
    }
  } catch (error) {
    console.log(`No process found on port ${port} or error killing process`);
  }
};

router.post('/publish', async (req, res) => {
  try {
    console.log('=== PUBLISH REQUEST RECEIVED ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body code length:', req.body.code ? req.body.code.length : 0);
    console.log('Request body deviceType:', req.body.deviceType);

    const { code, deviceType } = req.body;

    // Validate inputs
    if (!code) {
      console.error('No code field in request body');
      return res.status(400).json({ error: 'No code field provided in request body' });
    }

    if (typeof code !== 'string') {
      console.error('Code is not a string:', typeof code);
      return res.status(400).json({ error: 'Code must be a string' });
    }

    if (code.trim() === '') {
      console.error('Code is empty string');
      return res.status(400).json({ error: 'Code cannot be empty' });
    }
    
    if (!deviceType || typeof deviceType !== 'string') {
      console.error('Invalid deviceType:', deviceType);
      return res.status(400).json({ error: 'Invalid or missing deviceType' });
    }

    console.log('Validation passed, processing code...');

    // Clean and prepare the code
    let cleanedCode;
    try {
      cleanedCode = cleanCodeForReact(code);
      console.log('Code cleaned successfully, length:', cleanedCode.length);
    } catch (error) {
      console.error('Error cleaning code:', error.message);
      return res.status(400).json({ error: `Code cleaning failed: ${error.message}` });
    }

    // Backup current version if it exists
    const backedUpVersion = await backupCurrentVersion();
    
    // Create/update the frontend project with new code
    await createReactProject(FRONTEND_DIR, cleanedCode);

    // Check if we need to install dependencies
    const nodeModulesPath = path.join(FRONTEND_DIR, 'node_modules');
    const packageJsonPath = path.join(FRONTEND_DIR, 'package.json');
    
    try {
      await fs.access(nodeModulesPath);
      await fs.access(packageJsonPath);
      console.log('Dependencies already installed');
    } catch (error) {
      console.log('Installing dependencies...');
      try {
        await execPromise('npm install', { 
          cwd: FRONTEND_DIR,
          timeout: 120000 // 2 minutes timeout
        });
        console.log('Dependencies installed successfully');
      } catch (installError) {
        console.error('npm install failed:', installError);
        return res.status(500).json({ error: 'Failed to install dependencies' });
      }
    }

    // Kill any existing process on port 3001
    await killPort(3001);
    
    // Start the React development server
    console.log('Starting React development server...');
    const serverProcess = exec('set PORT=3001 && npm start', { 
      cwd: FRONTEND_DIR,
      detached: false,
      stdio: 'pipe'
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.log('React server output:', data.toString());
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.log('React server stderr:', data.toString());
    });

    serverProcess.on('error', (error) => {
      console.error('React server process error:', error);
    });

    res.json({ 
      success: true, 
      version: backedUpVersion,
      message: 'Project published successfully',
      url: 'http://localhost:3001'
    });
    
  } catch (error) {
    console.error('=== PUBLISH ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;