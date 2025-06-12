const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ProjectManager {
  constructor() {
    this.generatedProjectsPath = path.join(__dirname, '../../figma-to-react-generated');
    this.activeProjectPath = path.join(this.generatedProjectsPath, 'active-project');
    this.templatePath = path.join(__dirname, '../templates/react-template');
  }

  async publishProject(reactCode, deviceType, metadata = {}) {
    try {
      // Ensure active project exists, create if it doesn't
      if (!(await fs.pathExists(this.activeProjectPath))) {
        await this.createProjectStructure(this.activeProjectPath);
        await this.installDependencies(this.activeProjectPath);
      }

      // Save new component and maintain version history
      await this.saveGeneratedComponent(this.activeProjectPath, reactCode, deviceType, metadata);

      return {
        projectName: 'active-project',
        projectPath: this.activeProjectPath,
        previewUrl: `http://localhost:3001`,
        success: true
      };
    } catch (error) {
      throw new Error(`Project publish failed: ${error.message}`);
    }
  }

  async createProjectStructure(projectPath) {
    const structure = {
      'package.json': this.getPackageJson(),
      'public/index.html': this.getIndexHtml(),
      'src/index.js': this.getIndexJs(),
      'src/App.jsx': this.getAppTemplate(),
      'src/components/GeneratedComponent.jsx': '',
      'versions/': ''
    };

    for (const [filePath, content] of Object.entries(structure)) {
      const fullPath = path.join(projectPath, filePath);
      
      if (filePath.endsWith('/')) {
        await fs.ensureDir(fullPath);
      } else {
        await fs.ensureDir(path.dirname(fullPath));
        if (content) {
          await fs.writeFile(fullPath, content);
        }
      }
    }
  }

  async installDependencies(projectPath) {
    try {
      console.log('Installing dependencies...');
      await execAsync('npm install', { cwd: projectPath });
      console.log('Dependencies installed successfully');
    } catch (error) {
      console.error('Dependency installation failed:', error);
      throw error;
    }
  }

  async saveGeneratedComponent(projectPath, reactCode, deviceType, metadata) {
    const componentPath = path.join(projectPath, 'src/components/GeneratedComponent.jsx');
    const versionsPath = path.join(projectPath, 'versions');

    // Ensure versions directory exists
    await fs.ensureDir(versionsPath);

    // Save current version to versions/ folder
    const versionNumber = await this.getNextVersionNumber(versionsPath);
    const versionPath = path.join(versionsPath, `v${versionNumber}.jsx`);

    const componentWithMetadata = `
      // Generated at: ${new Date().toISOString()}
      // Device Type: ${deviceType}
      // Metadata: ${JSON.stringify(metadata, null, 2)}
      
      ${reactCode}
    `;

    // Save to versions/ folder
    await fs.writeFile(versionPath, componentWithMetadata);

    // Overwrite main GeneratedComponent.jsx
    await fs.writeFile(componentPath, componentWithMetadata);
  }

  async getNextVersionNumber(versionsPath) {
    try {
      const files = await fs.readdir(versionsPath);
      const versionFiles = files.filter(f => f.startsWith('v') && f.endsWith('.jsx'));
      return versionFiles.length + 1;
    } catch {
      return 1;
    }
  }

  getPackageJson() {
    return JSON.stringify({
      "name": "active-react-project",
      "version": "1.0.0",
      "private": true,
      "dependencies": {
        "@emotion/react": "^11.11.1",
        "@emotion/styled": "^11.11.0",
        "@mui/icons-material": "^5.14.19",
        "@mui/material": "^5.14.20",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "5.0.1"
      },
      "scripts": {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
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
  }

  getIndexHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <title>Generated React App</title>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>`;
  }

  getIndexJs() {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
  }

  getAppTemplate() {
    return `import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GeneratedComponent from './components/GeneratedComponent';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GeneratedComponent />
    </ThemeProvider>
  );
}

export default App;`;
  }
}

module.exports = ProjectManager;