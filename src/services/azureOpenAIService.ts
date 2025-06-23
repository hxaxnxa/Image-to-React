import OpenAI from 'openai';

// Environment variables with VITE_ prefix for client-side access
const AZURE_OPENAI_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY || 'your-key-here';
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://your-resource.openai.azure.com';
const AZURE_OPENAI_VERSION = import.meta.env.VITE_AZURE_OPENAI_VERSION || '2024-02-15-preview';
const AZURE_OPENAI_MODEL_NAME = import.meta.env.VITE_AZURE_OPENAI_MODEL_NAME || 'gpt-4o';

class EnhancedAzureOpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: AZURE_OPENAI_KEY,
      baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_MODEL_NAME}`,
      defaultQuery: { 'api-version': AZURE_OPENAI_VERSION },
      defaultHeaders: {
        'api-key': AZURE_OPENAI_KEY,
      },
      dangerouslyAllowBrowser: true,
    });
  }

  async generateUIDescription(imageFile: File): Promise<string> {
    try {
      const base64Image = await this.fileToBase64(imageFile);
      
      const prompt = `ANALYZE THIS UI IMAGE WITH EXTREME PRECISION FOR PIXEL-PERFECT RECREATION:

CRITICAL REQUIREMENTS - EXTRACT EVERY DETAIL:

1. EXACT COLOR ANALYSIS:
    - Identify ALL background colors (provide exact hex codes by analyzing RGB values)
    - All text colors (headers, body text, labels, placeholders)
    - Button colors (primary, secondary, disabled, hover states)
    - Border colors, divider colors, shadow colors
    - Icon colors and accent colors
    - Status indicator colors (success, warning, error)

2. PRECISE MEASUREMENTS & LAYOUT:
    - Overall container dimensions and aspect ratio
    - Header heights and component spacing
    - Card dimensions, padding, and margins (estimate in pixels)
    - Input field heights and widths
    - Button dimensions and border radius
    - Column widths in grids/tables
    - Vertical and horizontal spacing between all elements

3. TYPOGRAPHY SPECIFICATION:
    - Font families (identify or suggest similar web-safe fonts)
    - Exact font sizes for all text elements
    - Font weights (100, 200, 300, 400, 500, 600, 700, 800, 900)
    - Text alignment (left, center, right, justify)
    - Line heights and letter spacing
    - Text decoration (underline, bold, italic)

4. COMPONENT DETAILS:
    - Input field styles (border radius, padding, border width)
    - Button styles (elevation, shadows, ripple effects)
    - Card styles (shadows, elevation, border radius)
    - Dropdown/select styles and arrow indicators
    - Checkbox and form control appearances
    - Icon sizes and positioning
    - Badge and chip styles

5. VISUAL EFFECTS & SHADOWS:
    - Box shadows (x-offset, y-offset, blur, spread, color)
    - Border styles (width, color, style)
    - Elevation levels for Material Design
    - Gradient directions and color stops
    - Opacity values for overlays

6. LAYOUT STRUCTURE:
    - Grid systems and column layouts
    - Flex direction and alignment
    - Container max-widths and breakpoints
    - Positioning (relative, absolute, fixed)
    - Z-index layering

7. INTERACTIVE STATES:
    - Hover effects and color changes
    - Active/focus states for inputs
    - Disabled states appearance
    - Loading states and progress indicators
    - Selection states for items

8. CONTENT EXTRACTION:
    - Extract ALL visible text exactly as shown
    - Placeholder text in input fields
    - Button labels and descriptions
    - Headers, subheaders, and body text
    - Icon descriptions and alternative text
    - Data in tables or lists

9. RESPONSIVE CONSIDERATIONS:
    - How elements should adapt to smaller screens
    - Mobile-first vs desktop-first approach
    - Breakpoint behaviors for different devices
    - Touch-friendly sizing for mobile

10. ACCESSIBILITY FEATURES:
    - ARIA labels and descriptions
    - Color contrast ratios
    - Focus indicators
    - Screen reader considerations

ANALYZE THE IMAGE SYSTEMATICALLY:
- Start from top-left, go row by row
- Measure relative sizes and proportions
- Note any animations or transitions
- Identify component hierarchy and nesting
- Document any patterns or repeated elements

PROVIDE MEASUREMENTS:
- Use relative units (rem, em, %, vw, vh) where appropriate
- Provide pixel estimates for fixed dimensions
- Include aspect ratios for images and containers
- Document spacing using consistent units

RETURN FORMAT:
Provide a structured, detailed description that includes:
1. Overall layout structure
2. Color palette with hex codes
3. Typography specifications
4. Component dimensions and styling
5. Interactive behaviors
6. All text content
7. Responsive considerations

Be extremely thorough - missing any detail will result in inaccurate recreation.`;

      const response = await this.client.chat.completions.create({
        model: AZURE_OPENAI_MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageFile.type};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.0, // Reduced for more consistent results
      });

      return response.choices[0]?.message?.content || 'Failed to generate description';
    } catch (error) {
      console.error('Error generating UI description:', error);
      throw new Error('Failed to generate UI description. Please check your Azure OpenAI configuration and try again.');
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
        prompt = this.getEnhancedReactMUIPrompt(uiDescription, userPrompt, deviceType);
      } else if (codeFormat === 'react-native') {
        prompt = this.getEnhancedReactNativePrompt(uiDescription, userPrompt, deviceType);
      } else if (codeFormat === 'flutter') {
        prompt = this.getEnhancedFlutterPrompt(uiDescription, userPrompt, deviceType);
      }

      const response = await this.client.chat.completions.create({
        model: AZURE_OPENAI_MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: `You are an expert UI developer who creates PIXEL-PERFECT recreations. Your code must:
            1. Match every color exactly using provided hex codes
            2. Implement exact spacing and dimensions
            3. Include all text content verbatim
            4. Match typography specifications precisely
            5. Implement all interactive states and behaviors
            6. Be production-ready with proper error handling
            7. Include accessibility features
            8. Return ONLY clean, executable code without markdown or explanations`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8000, // Increased for more detailed code
        temperature: 0.0, // Reduced for consistency
      });

      let code = response.choices[0]?.message?.content || '';

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
      throw new Error('Failed to generate code. Please check your Azure OpenAI configuration and try again.');
    }
  }

  private getEnhancedReactMUIPrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `CREATE PIXEL-PERFECT REACT + MATERIAL-UI CODE THAT EXACTLY MATCHES THIS UI:

UI DESCRIPTION:
${uiDescription}

USER REQUIREMENTS:
${userPrompt || 'Create an exact replica with perfect visual matching'}

DEVICE TARGET: ${deviceType}

MANDATORY IMPLEMENTATION RULES:

1. COMPONENT STRUCTURE:
    - Component name: "GeneratedComponent"
    - Single default export at end
    - Complete functional component with hooks

2. EXACT VISUAL MATCHING:
    - Use EXACT hex colors from description
    - Implement precise spacing with sx props
    - Match typography exactly (fontSize, fontWeight, fontFamily)
    - Recreate shadows, borders, and effects precisely

3. REQUIRED IMPORTS (ALWAYS INCLUDE):
    \`\`\`javascript
    import React, { useState, useEffect, useCallback } from 'react';
    import { 
      Box, Typography, Button, Card, CardContent, TextField, 
      Grid, IconButton, CircularProgress, Checkbox, FormControlLabel,
      Select, MenuItem, FormControl, InputLabel, Table, TableBody,
      TableCell, TableContainer, TableHead, TableRow, Paper,
      AppBar, Toolbar, Avatar, Badge, Chip, Divider, Drawer,
      List, ListItem, ListItemText, ListItemIcon, Switch,
      Dialog, DialogTitle, DialogContent, DialogActions,
      Snackbar, Alert, Tabs, Tab, Accordion, AccordionSummary,
      AccordionDetails, Stepper, Step, StepLabel, Breadcrumbs,
      Link, Tooltip, Popover, Menu, Fade, Grow, Slide
    } from '@mui/material';
    import { 
      Search, Notifications, Dashboard, Campaign, Person,
      Analytics, Description, Brightness4, Brightness7,
      Menu as MenuIcon, Close, Add, Edit, Delete, Save,
      Cancel, Check, Warning, Error, Info, Upload,
      Download, Print, Share, Refresh, Settings, Help,
      ExpandMore, ChevronRight, ChevronLeft, ArrowBack,
      ArrowForward, Home, Work, Email, Phone, LocationOn
    } from '@mui/icons-material';
    \`\`\`

4. STYLING APPROACH:
    - Use sx prop for ALL styling (no styled-components)
    - Implement responsive design with breakpoints
    - Create theme customization if needed
    - Use proper Material-UI color system

5. FUNCTIONAL IMPLEMENTATION:
    - Add state management for interactive elements
    - Implement form validation if forms are present
    - Add loading states and error handling
    - Include proper event handlers

6. ACCESSIBILITY & BEST PRACTICES:
    - Include aria-labels and roles
    - Proper keyboard navigation
    - Screen reader support
    - Error boundaries where appropriate

7. SPECIFIC IMPLEMENTATION REQUIREMENTS:
    - If tables are present, make them responsive
    - If forms exist, add validation and submission
    - If navigation is shown, make it functional
    - If data is displayed, use proper data structures

8. COLOR SYSTEM:
    - Create custom theme with exact colors
    - Use theme.palette for consistency
    - Implement proper hover and active states
    - Support both light and dark modes if indicated

9. LAYOUT PRECISION:
    - Use CSS Grid and Flexbox appropriately
    - Implement exact padding, margins, and spacing
    - Match container max-widths and heights
    - Ensure proper alignment and positioning

10. TEXT CONTENT:
    - Include ALL text exactly as shown in image
    - Use proper Typography variants
    - Implement text truncation where needed
    - Support internationalization structure

EXAMPLE COMPONENT STRUCTURE:
\`\`\`javascript
const GeneratedComponent = () => {
  const [state, setState] = useState({});
  
  const handleAction = useCallback(() => {
    // Implementation
  }, []);

  return (
    <Box sx={{ /* exact styles */ }}>
      {/* Component content matching the UI exactly */}
    </Box>
  );
};
\`\`\`

CRITICAL: Return ONLY the complete, runnable JavaScript code. No explanations, no markdown blocks, no additional text. The code must work immediately when executed.`;
  }

  private getEnhancedReactNativePrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `CREATE PIXEL-PERFECT REACT NATIVE CODE FOR EXPO THAT EXACTLY MATCHES THIS UI:

UI DESCRIPTION:
${uiDescription}

USER REQUIREMENTS:
${userPrompt || 'Create exact mobile replica'}

DEVICE TARGET: ${deviceType}

MANDATORY IMPLEMENTATION RULES:

1. COMPONENT STRUCTURE:
    - Component name: "App"
    - Export as default
    - Complete functional component

2. REQUIRED IMPORTS:
    \`\`\`javascript
    import React, { useState, useEffect, useCallback } from 'react';
    import {
      View, Text, ScrollView, TouchableOpacity, TextInput,
      Image, StyleSheet, StatusBar, SafeAreaView, FlatList,
      Modal, Alert, Dimensions, KeyboardAvoidingView,
      Platform, Animated, PanResponder, RefreshControl,
      Switch, Slider, Picker, DatePicker, ActivityIndicator
    } from 'react-native';
    import { LinearGradient } from 'expo-linear-gradient';
    import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
    \`\`\`

3. EXACT VISUAL MATCHING:
    - Use exact hex colors from description
    - Implement precise dimensions and spacing
    - Match typography with proper fontFamily, fontSize, fontWeight
    - Recreate shadows, borders using StyleSheet

4. MOBILE-OPTIMIZED FEATURES:
    - Proper TouchableOpacity for all interactive elements
    - ScrollView for content that might overflow
    - KeyboardAvoidingView for forms
    - SafeAreaView for proper screen boundaries
    - Platform-specific styling where needed

5. LAYOUT IMPLEMENTATION:
    - Use Flexbox for all layouts
    - Implement exact padding and margin values
    - Create responsive design for different screen sizes
    - Use Dimensions.get('window') for dynamic sizing

6. STYLING SYSTEM:
    - Use StyleSheet.create for all styles
    - Organize styles logically
    - Implement proper elevation/shadows
    - Support both iOS and Android styling differences

7. FUNCTIONAL FEATURES:
    - State management for interactive elements
    - Form validation and submission
    - Loading states with ActivityIndicator
    - Modal dialogs for confirmations

8. PERFORMANCE OPTIMIZATIONS:
    - Use FlatList for large datasets
    - Implement proper key props
    - Optimize re-renders with useCallback
    - Lazy loading where appropriate

9. EXAMPLE STRUCTURE:
    \`\`\`javascript
    const App = () => {
      const [state, setState] = useState({});
      
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#yourColor" />
          {/* Your UI components */}
        </SafeAreaView>
      );
    };

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#exactHexColor',
      },
      // More styles
    });
    \`\`\`

CRITICAL: Return ONLY the complete, runnable React Native code that works in Expo Snack. No explanations, no markdown blocks.`;
  }

  private getEnhancedFlutterPrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `CREATE PIXEL-PERFECT FLUTTER/DART CODE THAT EXACTLY MATCHES THIS UI:

UI DESCRIPTION:
${uiDescription}

USER REQUIREMENTS:
${userPrompt || 'Create exact Flutter replica'}

DEVICE TARGET: ${deviceType}

MANDATORY IMPLEMENTATION RULES:

1. APPLICATION STRUCTURE:
    - Complete Flutter app with main() function
    - MaterialApp with custom theme
    - Proper StatefulWidget/StatelessWidget usage

2. REQUIRED IMPORTS:
    \`\`\`dart
    import 'package:flutter/material.dart';
    import 'package:flutter/services.dart';
    import 'package:flutter/cupertino.dart';
    \`\`\`

3. EXACT VISUAL MATCHING:
    - Use Color(0xFF...) for exact hex colors
    - Implement precise EdgeInsets for padding/margins
    - Match typography with TextStyle specifications
    - Recreate Material Design components exactly

4. THEME IMPLEMENTATION:
    - Create custom ThemeData with exact colors
    - Define ColorScheme matching the UI
    - Implement custom TextTheme
    - Support both light and dark themes if needed

5. LAYOUT PRECISION:
    - Use appropriate layout widgets (Column, Row, Stack, etc.)
    - Implement Container with exact dimensions
    - Use MediaQuery for responsive design
    - Proper alignment and positioning

6. COMPONENT IMPLEMENTATION:
    - Use Material widgets (Card, Button, TextField, etc.)
    - Implement custom widgets for complex components
    - Add proper state management
    - Include form validation and submission

7. INTERACTIVE FEATURES:
    - GestureDetector for custom interactions
    - Navigator for multi-screen apps
    - SnackBar for notifications
    - Dialog for confirmations

8. RESPONSIVE DESIGN:
    - Use MediaQuery.of(context).size
    - Implement proper breakpoints
    - Flexible and Expanded widgets
    - OrientationBuilder for landscape/portrait

9. EXAMPLE STRUCTURE:
    \`\`\`dart
    void main() {
      runApp(MyApp());
    }

    class MyApp extends StatelessWidget {
      @override
      Widget build(BuildContext context) {
        return MaterialApp(
          theme: ThemeData(
            primaryColor: Color(0xFF...), // Exact color
            // Custom theme
          ),
          home: HomeScreen(),
        );
      }
    }

    class HomeScreen extends StatefulWidget {
      @override
      _HomeScreenState createState() => _HomeScreenState();
    }
    \`\`\`

CRITICAL: Return ONLY the complete, runnable Dart code with main() function that works in DartPad. No explanations, no markdown blocks.`;
  }

  // Enhanced preprocessing methods with better error handling
  private preprocessCodeForReactLive(code: string): string {
    let cleanedCode = code;

    // Remove markdown code blocks
    cleanedCode = cleanedCode.replace(/```(?:jsx?|javascript|tsx?|typescript)?\s*/g, '').replace(/```\s*/g, '');

    // Remove any explanatory text or comments at the beginning/end
    cleanedCode = cleanedCode.replace(/^[^i]*?(?=import)/s, '');
    cleanedCode = cleanedCode.replace(/(?:export\s+default\s+\w+;?\s*)[\s\S]*$/gm, 'export default GeneratedComponent;');

    // Fix React imports and hooks
    if (!cleanedCode.includes('import React')) {
      cleanedCode = `import React from 'react';\n${cleanedCode}`;
    }

    // Ensure useState and other hooks are imported if used
    if (cleanedCode.includes('useState') && !cleanedCode.includes('{ useState')) {
      cleanedCode = cleanedCode.replace(
        'import React',
        'import React, { useState, useEffect, useCallback }'
      );
    }

    // Fix component export
    if (!cleanedCode.includes('export default GeneratedComponent')) {
      if (cleanedCode.includes('const GeneratedComponent')) {
        cleanedCode = cleanedCode.replace(/export\s+default\s+\w+;?\s*$/gm, '');
        cleanedCode = cleanedCode.trim() + '\n\nexport default GeneratedComponent;';
      }
    }

    // Add error boundary and fallback
    if (!cleanedCode.includes('const GeneratedComponent')) {
      cleanedCode = this.createFallbackReactComponent();
    }

    return cleanedCode.trim();
  }

  private preprocessReactNativeCode(code: string): string {
    let cleanedCode = code;

    // Remove markdown and clean up
    cleanedCode = cleanedCode.replace(/```(?:jsx?|javascript|react-native)?\s*/g, '').replace(/```\s*/g, '');
    
    // Ensure proper imports
    if (!cleanedCode.includes('import React')) {
      cleanedCode = `import React, { useState, useEffect } from 'react';\nimport { View, Text, StyleSheet, SafeAreaView } from 'react-native';\n\n${cleanedCode}`;
    }

    // Fix export
    if (!cleanedCode.includes('export default')) {
      if (cleanedCode.includes('const App') || cleanedCode.includes('function App')) {
        cleanedCode = cleanedCode.trim() + '\n\nexport default App;';
      } else {
        cleanedCode = this.createFallbackReactNativeComponent();
      }
    }

    return cleanedCode.trim();
  }

  private preprocessFlutterCode(code: string): string {
    let cleanedCode = code;

    // Remove markdown
    cleanedCode = cleanedCode.replace(/```(?:dart|flutter)?\s*/g, '').replace(/```\s*/g, '');

    // Ensure proper imports
    if (!cleanedCode.includes('import \'package:flutter/material.dart\'')) {
      cleanedCode = `import 'package:flutter/material.dart';\n\n${cleanedCode}`;
    }

    // Ensure main function exists
    if (!cleanedCode.includes('void main()')) {
      cleanedCode = this.createFallbackFlutterApp();
    }

    return cleanedCode.trim();
  }

  // Fallback components for error cases
  private createFallbackReactComponent(): string {
    return `import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

const GeneratedComponent = () => {
  return (
    <Box sx={{ padding: 3, maxWidth: 600, margin: '0 auto' }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        UI Generation Failed
      </Alert>
      <Typography variant="h6" gutterBottom>
        Generated Component
      </Typography>
      <Typography variant="body1">
        The UI analysis completed, but code generation encountered an issue. 
        Please try regenerating or check the console for details.
      </Typography>
    </Box>
  );
};

export default GeneratedComponent;`;
  }

  private createFallbackReactNativeComponent(): string {
    return `import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Generated App</Text>
        <Text style={styles.message}>
          UI analysis completed, but code generation encountered an issue.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
  },
});

export default App;`;
  }

  private createFallbackFlutterApp(): string {
    return `import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Generated Flutter App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Generated App'),
      ),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.warning,
                color: Colors.orange,
                size: 48,
              ),
              SizedBox(height: 16),
              Text(
                'Generated Flutter App',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 16),
              Text(
                'UI analysis completed, but code generation encountered an issue.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}`;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Export the enhanced service
export const enhancedAzureOpenAIService = new EnhancedAzureOpenAIService();