import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateUIDescription(imageFile: File): Promise<string> {
    try {
      const imageBuffer = await this.fileToBuffer(imageFile);
      const prompt = `Analyze this UI design image and provide a detailed description of the layout, components, colors, typography, and overall structure. Focus on:

1. Layout structure (header, main content, footer, sidebars)
2. UI components (buttons, forms, cards, navigation, modals)
3. Color scheme and visual hierarchy
4. Typography and text content
5. Spacing and alignment
6. Interactive elements and states
7. Responsive design considerations

Provide a comprehensive description that can be used to recreate this design.`;

      const imagePart = {
        inlineData: {
          data: imageBuffer,
          mimeType: imageFile.type
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating UI description:', error);
      throw new Error('Failed to generate UI description. Please check your API key and try again.');
    }
  }

  async generateReactCode(
    uiDescription: string,
    userPrompt: string = '',
    deviceType: string = 'desktop',
    codeFormat: string = 'react-mui'
  ): Promise<string> {
    try {
      let prompt = '';

      if (codeFormat === 'react-mui') {
        prompt = this.getReactMUIPrompt(uiDescription, userPrompt, deviceType);
      } else if (codeFormat === 'react-native') {
        prompt = this.getReactNativePrompt(uiDescription, userPrompt, deviceType);
      } else if (codeFormat === 'flutter') {
        prompt = this.getFlutterPrompt(uiDescription, userPrompt, deviceType);
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let code = response.text();

      if (codeFormat === 'react-mui') {
        code = this.preprocessCodeForReactLive(code);
      } else if (codeFormat === 'react-native') {
        code = this.preprocessReactNativeCode(code);
      } else if (codeFormat === 'flutter') {
        code = this.preprocessFlutterCode(code);
      }
      
      return code;
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate code. Please try again.');
    }
  }

  private getReactMUIPrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `Based on the following UI description and user requirements, generate a complete React component using Material-UI (@mui/material) components.

UI Description:
${uiDescription}

User Requirements:
${userPrompt || 'Create a beautiful, functional component based on the UI description.'}

Device Type: ${deviceType}

Requirements:
1. The component name must be "GeneratedComponent" and exported as default.
2. Use only Material-UI components (@mui/material and @mui/icons-material) like Box, Typography, Button, Card, CardContent, CardMedia, IconButton, Grid, TextField, CircularProgress.
3. Do not use styled-components or styled() functions. Use Material-UI's sx prop for styling.
4. Do not include import statements in the generated code.
5. Make the layout responsive (${deviceType === 'mobile' ? 'mobile-first with 375px viewport' : 'desktop with 1200px maxWidth'}).
6. Implement dark mode toggle using an IconButton (Brightness4 / Brightness7) with React.useState.
7. Use placeholder images from https://via.placeholder.com (e.g., https://via.placeholder.com/200x100).
8. Include error boundaries and loading states using simple conditional rendering.
9. Inline all subcomponents inside GeneratedComponent; no separate components.
10. Use React hooks (React.useState, React.useEffect) properly, referencing them with React prefix (e.g., React.useState).
11. Ensure accessibility with ARIA labels on interactive elements.
12. Do not wrap output in markdown (e.g., \`\`\`jsx) — return plain JavaScript code only.
13. Ensure compatibility with react-live by avoiding custom imports.
14. Include smooth hover effects and transitions using sx prop with &:hover syntax.
15. Use proper Material-UI styling with sx prop.

Generate clean, production-ready, error-free code that works in live preview environments.`;
  }

  private getReactNativePrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `Based on the following UI description and user requirements, generate a complete React Native component for Expo Snack.

UI Description:
${uiDescription}

User Requirements:
${userPrompt || 'Create a beautiful, functional React Native component based on the UI description.'}

Device Type: ${deviceType}

CRITICAL REQUIREMENTS - FOLLOW EXACTLY:
1. Use React Native components (View, Text, ScrollView, TouchableOpacity, Image, etc.)
2. Component name must be "App" and exported as default
3. Make it responsive for mobile devices
4. Use StyleSheet for styling with proper React Native patterns
5. Include proper navigation structure if needed using react-navigation patterns
6. Use placeholder images from https://via.placeholder.com (e.g., https://via.placeholder.com/400x300)
7. Include React hooks for state management
8. Add smooth animations using Animated API where appropriate
9. Ensure proper accessibility with accessibilityLabel and accessibilityHint
10. Include realistic sample data and interactive elements
11. Use proper React Native patterns and best practices
12. Include StatusBar configuration
13. Use Expo-compatible components only

OUTPUT REQUIREMENTS:
- Return ONLY the component code
- NO explanations, comments, or markdown
- Include proper import statements for React Native
- Clean, runnable code that works immediately in Expo Snack
- Ensure all React Native components are properly imported and used

Generate clean, production-ready React Native code.`;
  }

  private getFlutterPrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `Based on the following UI description and user requirements, generate a complete Flutter widget in Dart for DartPad.

UI Description:
${uiDescription}

User Requirements:
${userPrompt || 'Create a beautiful, functional Flutter widget based on the UI description.'}

Device Type: ${deviceType}

CRITICAL REQUIREMENTS - FOLLOW EXACTLY:
1. Use Flutter Material Design widgets (MaterialApp, Scaffold, AppBar, etc.)
2. Create a complete app with main() function and MyApp class
3. Make it responsive for mobile devices using MediaQuery
4. Use proper Flutter theming and styling with ThemeData
5. Include proper navigation structure if needed using Navigator
6. Use placeholder images from network (NetworkImage with https://via.placeholder.com URLs)
7. Include proper state management using StatefulWidget
8. Add smooth animations using Flutter's animation system (AnimationController, Tween)
9. Ensure proper accessibility with Semantics widgets
10. Include realistic sample data and interactive elements
11. Use proper Flutter patterns and best practices
12. Include proper error handling and loading states
13. Use Material Design principles

OUTPUT REQUIREMENTS:
- Return ONLY the complete Dart code
- NO explanations, comments, or markdown
- Include proper import statements for Flutter
- Clean, runnable code that works immediately in DartPad
- Must include main() function and complete app structure
- Ensure all Flutter widgets are properly imported and used

Generate clean, production-ready Flutter/Dart code.`;
  }

  private preprocessCodeForReactLive(code: string): string {
    // Remove markdown code blocks
    code = code.replace(/```jsx?\s*/g, '').replace(/```javascript\s*/g, '').replace(/```\s*/g, '');
    
    // Remove import/export statements
    code = code.replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, '');
    code = code.replace(/export\s+default\s+/g, '');
    code = code.replace(/export\s*\{[^}]*\};?\s*/g, '');
    
    // Remove unsupported MUI utilities
    code = code.replace(/ThemeProvider|CssBaseline|useTheme/g, '');
    
    // Replace useState with React.useState
    code = code.replace(/\buseState\b/g, 'React.useState');
    code = code.replace(/\buseEffect\b/g, 'React.useEffect');
    code = code.replace(/\buseCallback\b/g, 'React.useCallback');
    code = code.replace(/\buseMemo\b/g, 'React.useMemo');
    code = code.replace(/\buseRef\b/g, 'React.useRef');
    
    // Fix double React prefix
    code = code.replace(/React\.React\./g, 'React.');
    
    // Normalize icon names
    code = code.replace(/(\w+)Icon(?=\s*[,}\s])/g, '$1');
    
    // Remove styled components and convert to sx props
    code = code.replace(/const\s+StyledBox\s*=\s*styled\(Box\)\(({[\s\S]*?})\);?\s*/g, '');
    code = code.replace(/\bStyledBox\b/g, 'Box');
    
    // Ensure proper component structure
    if (!code.includes('const GeneratedComponent') && !code.includes('function GeneratedComponent')) {
      code = `const GeneratedComponent = () => {\n  return (\n    ${code}\n  );\n};`;
    }

    // Clean up extra whitespace
    code = code.replace(/\n\s*\n+/g, '\n').trim();

    // Remove trailing component name
    code = code.replace(/\bGeneratedComponent\s*;?\s*$/, '');

    // Fallback for invalid code
    if (!code.includes('return')) {
      code = `const GeneratedComponent = () => {
        return (
          <Box sx={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <Typography variant="h6">Generated Component</Typography>
            <Typography>There was an issue parsing the generated code.</Typography>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
              {${JSON.stringify(code.slice(0, 200))}}
            </pre>
          </Box>
        );
      };`;
    }

    return code;
  }

  private preprocessReactNativeCode(code: string): string {
    code = code.replace(/```jsx?\s*/g, '').replace(/```javascript\s*/g, '').replace(/```\s*/g, '');
    if (!code.includes('import React')) {
      code = `import React, { useState, useEffect } from 'react';\nimport { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';\n\n${code}`;
    }
    if (!code.includes('export default')) {
      code = code.replace(/^(function|const)\s+App/, 'export default $1 App');
    }
    return code.trim();
  }

  private preprocessFlutterCode(code: string): string {
    code = code.replace(/```dart\s*/g, '').replace(/```\s*/g, '');
    if (!code.includes('import \'package:flutter/material.dart\'')) {
      code = `import 'package:flutter/material.dart';\n\n${code}`;
    }
    if (!code.includes('void main()')) {
      code = `${code}\n\nvoid main() {\n  runApp(MyApp());\n}`;
    }
    return code.trim();
  }

  private async fileToBuffer(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
        resolve(btoa(binary));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

// Export as a named export
export const geminiService = new GeminiService();