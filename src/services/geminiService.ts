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

CRITICAL REQUIREMENTS:
1. The main component name MUST be "GeneratedComponent" and it MUST be exported as default ONLY ONCE at the very end (e.g., "export default GeneratedComponent;").
2. Include ALL necessary React and Material-UI imports at the very top of the file, matching this format:
   \`\`\`javascript
   import React, { useState, useEffect, useRef } from 'react';
   import { Box, Typography, TextField, Grid, Card, CardContent, IconButton, CircularProgress, Button, BottomNavigation, BottomNavigationAction } from '@mui/material';
   import { Brightness4, Brightness7, Home as HomeIcon, Receipt as ReceiptIcon, AccountBalanceWallet as AccountBalanceWalletIcon, Mail as MailIcon } from '@mui/icons-material';
   \`\`\`
3. Use only Material-UI components (@mui/material and @mui/icons-material) like Box, Typography, Button, Card, CardContent, IconButton, Grid, TextField, CircularProgress, BottomNavigation, BottomNavigationAction.
4. Do NOT use styled-components or styled() functions. Use Material-UI's \`sx\` prop for all styling.
5. Make the layout fully responsive using Material-UI's responsive props (e.g., \`{ xs: 'column', sm: 'row' }\`) and \`sx\` prop, for both mobile (e.g., 375px width breakpoint) and desktop views.
6. Implement dark mode toggle functionality using an IconButton (Brightness4 / Brightness7) with \`React.useState\`.
7. Use placeholder images from \`https://placehold.co\` (e.g., \`https://placehold.co/300x200/4CAF50/FFFFFF?text=Image\`).
8. Include basic loading and error states using conditional rendering with \`React.useState\` and \`CircularProgress\`.
9. Inline all subcomponents directly within the main "GeneratedComponent" component; do not declare separate components.
10. Use React hooks (\`React.useState\`, \`React.useEffect\`) properly, always referencing them with the \`React.\` prefix (e.g., \`React.useState\`).
11. Ensure accessibility with \`aria-label\` on interactive elements.
12. Include smooth hover effects and transitions using the \`sx\` prop with \`&:hover\` syntax.
13. Return the complete, runnable JavaScript/JSX code for the React component, ready for live preview.
14. The component structure should be professional and production-ready.
15. IMPORTANT: Include ONLY ONE "export default GeneratedComponent;" statement at the very end of the file.

IMPORTANT: The component must be named "GeneratedComponent" exactly, not "App" or any other name.

Generate clean, production-ready, error-free code that works perfectly in live preview environments like CodeSandbox Sandpack.`;
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
    // Remove markdown code blocks if present
    code = code.replace(/```(?:jsx?|javascript|tsx?|typescript)?\s*/g, '').replace(/```\s*/g, '');
    
    // Fix double React prefix (e.g., React.React.useState -> React.useState)
    code = code.replace(/React\.React\./g, 'React.');
    
    // Ensure the component is named 'GeneratedComponent' if the LLM deviated
    code = code.replace(/(function|const)\s+(App)\s*=/g, 'const GeneratedComponent =');
    code = code.replace(/function\s+App/g, 'function GeneratedComponent');
    code = code.replace(/export default App/g, 'export default GeneratedComponent');

    // Ensure 'export default GeneratedComponent;' is at the end if not present
    if (!code.includes('export default GeneratedComponent')) {
      // For function declarations
      if (code.includes('function GeneratedComponent')) {
        if (!code.endsWith('export default GeneratedComponent;')) {
          code = code + '\n\nexport default GeneratedComponent;';
        }
      }
      // For const declarations
      else if (code.includes('const GeneratedComponent =')) {
        if (!code.endsWith('export default GeneratedComponent;')) {
          code = code + '\n\nexport default GeneratedComponent;';
        }
      }
      // Fallback - create a basic component if none exists
      else {
        code = `import React from 'react';
import { Box, Typography } from '@mui/material';

const GeneratedComponent = () => {
  return (
    <Box sx={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Typography variant="h6">Generated Content</Typography>
      <Typography>The component code was generated successfully.</Typography>
    </Box>
  );
};

export default GeneratedComponent;`;
      }
    }

    // Clean up any extra whitespace
    code = code.replace(/\n\s*\n+/g, '\n\n').trim();

    return code;
  }

  private preprocessReactNativeCode(code: string): string {
    // Remove markdown code blocks
    code = code.replace(/```(?:jsx?|javascript|tsx?|typescript)?\s*/g, '').replace(/```\s*/g, '');
    
    // Add basic imports if missing
    if (!code.includes('import React')) {
      code = `import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';

${code}`;
    }
    
    // Ensure export default
    if (!code.includes('export default')) {
      if (code.includes('function App')) {
        code = code.replace(/function App/, 'export default function App');
      } else if (code.includes('const App =')) {
        code = code + '\n\nexport default App;';
      }
    }
    
    return code.trim();
  }

  private preprocessFlutterCode(code: string): string {
    // Remove markdown code blocks
    code = code.replace(/```(?:dart)?\s*/g, '').replace(/```\s*/g, '');
    
    // Add basic Flutter imports if missing
    if (!code.includes('import \'package:flutter/material.dart\'')) {
      code = `import 'package:flutter/material.dart';

${code}`;
    }
    
    // Add main function if missing
    if (!code.includes('void main()')) {
      code = `${code}

void main() {
  runApp(MyApp());
}`;
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