import OpenAI from 'openai';
import Tesseract from 'tesseract.js';
import { createCanvas, loadImage } from 'canvas';
import * as tf from '@tensorflow/tfjs';

// Environment variables with VITE_ prefix for client-side access
const AZURE_OPENAI_KEY: string = import.meta.env.VITE_AZURE_OPENAI_KEY || 'your-key-here';
const AZURE_OPENAI_ENDPOINT: string = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://your-resource.openai.azure.com';
const AZURE_OPENAI_VERSION: string = import.meta.env.VITE_AZURE_OPENAI_VERSION || '2024-02-15-preview';
const AZURE_OPENAI_MODEL_NAME: string = import.meta.env.VITE_AZURE_OPENAI_MODEL_NAME || 'gpt-4o';

// Component mapping for each framework
const componentMappings = {
  'react-mui': {
    button: 'Button',
    text_input: 'TextField',
    dropdown: 'Select',
    checkbox: 'Checkbox',
    switch: 'Switch',
    card: 'Card',
    navigation: 'AppBar',
    sidebar: 'Drawer',
    list: 'List',
    list_item: 'ListItem',
    tab: 'Tab',
    tabs: 'Tabs'
  },
  'react-native': {
    button: 'TouchableOpacity',
    text_input: 'TextInput',
    dropdown: 'Picker',
    checkbox: 'Switch',
    switch: 'Switch',
    card: 'View',
    navigation: 'View',
    sidebar: 'View',
    list: 'FlatList',
    list_item: 'View',
    tab: 'TouchableOpacity',
    tabs: 'View'
  },
  'flutter': {
    button: 'ElevatedButton',
    text_input: 'TextField',
    dropdown: 'DropdownButton',
    checkbox: 'Checkbox',
    switch: 'Switch',
    card: 'Card',
    navigation: 'AppBar',
    sidebar: 'Drawer',
    list: 'ListView',
    list_item: 'ListTile',
    tab: 'Tab',
    tabs: 'TabBar'
  }
};

interface VisionAnalysis {
  elements: Array<{
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    color?: string;
    font?: { family: string; size: number; weight: string };
    styles?: { borderRadius?: number; shadow?: string };
    placeholder?: string; // Added for input fields
    imageSource?: string; // Added for images
    listItems?: string[]; // Added for lists
    inferredFunctionality?: string; // Added for inferred functionality
    confidence: number; // Added for advanced vision model
  }>;
  responsiveHints: string[];
}

interface ValidationResult {
  valid: boolean;
  message: string;
}

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

  private async preprocessImage(file: File): Promise<VisionAnalysis> {
    try {
      const buffer = await file.arrayBuffer();
      const image = await loadImage(Buffer.from(buffer));
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      // Perform OCR with Tesseract.js for text extraction
      const { data: { text } } = await Tesseract.recognize(canvas.toDataURL(), 'eng');

      // Use TensorFlow.js with a pre-trained model (mock implementation for UI elements)
      // Note: In a real implementation, load a model like COCO-SSD or a custom UI-trained model
      const tensor = tf.browser.fromPixels(canvas as unknown as HTMLCanvasElement);
      // Mock object detection (simulating a UI-trained model)
      const elements = await this.mockAdvancedObjectDetection(tensor, text);

      // Responsive heuristics
      const responsiveHints = [];
      if (canvas.width > 768 && elements.some(e => e.type === 'sidebar' && e.width > 200)) {
        responsiveHints.push('Sidebar should collapse to a hamburger menu on mobile (width < 768px).');
      }
      if (elements.some(e => e.type === 'navigation' && e.height < 80)) {
        responsiveHints.push('Navigation bar should stack vertically on mobile.');
      }
      if (elements.some(e => e.type === 'button' && e.width < 44)) {
        responsiveHints.push('Buttons should have a minimum touch target size of 44px for mobile.');
      }

      tensor.dispose(); // Clean up TensorFlow.js resources
      return { elements, responsiveHints };
    } catch (error) {
      console.error('Image preprocessing error:', error);
      return { elements: [], responsiveHints: [] };
    }
  }

  private async mockAdvancedObjectDetection(tensor: tf.Tensor, text: string): Promise<VisionAnalysis['elements']> {
    // Simulated advanced object detection for UI elements
    // In production, replace with a real TensorFlow.js model (e.g., COCO-SSD or custom UI model)
    const elements = [];
    const lines = text.split('\n').filter(t => t.trim());

    // Mock detection logic for buttons, inputs, navigation bars, etc.
    const detectedRegions = [
      { type: 'button', x: 100, y: 50, width: 120, height: 40, confidence: 0.95, text: 'Submit', inferredFunctionality: 'Likely submits a form' }, // Added inferredFunctionality
      { type: 'text_input', x: 100, y: 120, width: 200, height: 40, confidence: 0.90, placeholder: 'Enter your name' }, // Added placeholder
      { type: 'image', x: 50, y: 50, width: 200, height: 150, confidence: 0.85, imageSource: 'logo.png' }, // Added imageSource
      { type: 'list', x: 300, y: 100, width: 150, height: 100, confidence: 0.88, listItems: ['Item 1', 'Item 2', 'Item 3'] }, // Added listItems
      { type: 'navigation', x: 0, y: 0, width: typeof tensor.shape[1] === 'number' ? tensor.shape[1] : 0, height: 60, confidence: 0.98, inferredFunctionality: 'Allows navigation between different sections' }, // Added inferredFunctionality
      { type: 'sidebar', x: 0, y: 60, width: 200, height: typeof tensor.shape[0] === 'number' ? tensor.shape[0] - 60 : 0, confidence: 0.92 },
    ];

    for (const region of detectedRegions) {
      const color = '#000000'; // Simplified color detection (replace with actual pixel analysis)
      const matchedText = lines.find(t => t.trim()) || '';
      elements.push({
        ...region,
        text: region.text || matchedText || region.type.charAt(0).toUpperCase() + region.type.slice(1),
        color,
        font: { family: 'Roboto', size: 16, weight: 'normal' },
        styles: { borderRadius: region.type === 'button' ? 8 : 0 },
      });
    }

    return elements;
  }

  async generateUIDescription(imageFile: File): Promise<string> {
    try {
      const base64Image = await this.fileToBase64(imageFile);
      const visionAnalysis = await this.preprocessImage(imageFile);

      const prompt = `ANALYZE THIS UI IMAGE WITH EXTREME PRECISION FOR PIXEL-PERFECT RECREATION. IDENTIFY ALL DISCERNIABLE UI COMPONENTS, THEIR PROPERTIES, AND INFER THEIR FUNCTIONALITY. DESCRIBE THE OVERALL LAYOUT AND RESPONSIVENESS.

VISION ANALYSIS DATA:
${JSON.stringify(visionAnalysis.elements, null, 2)}
Responsive Hints: ${visionAnalysis.responsiveHints.join('\n')}

CRITICAL ANALYSIS REQUIREMENTS:

1. COMPONENT IDENTIFICATION & PROPERTIES:
   - For each discernible UI component (buttons, text fields, images, lists, navigation bars, cards, tabs, etc.), identify its type.
   - For each component, specify all relevant properties:
     - **Buttons:** Text label, icon (if any), background color, text color, border-radius, width, height, **inferred functionality (e.g., "Submits a form", "Navigates to detail page")**.
     - **Text Fields/Inputs:** Placeholder text, label, current value (if evident), width, height, border style, background, **inferred functionality (e.g., "Accepts user's email", "Searches for products")**.
     - **Images:** Image source (URL/asset name if detectable), width, height, alt text (if inferable), **purpose/context (e.g., "Company logo", "Product image")**.
     - **Lists:** Type (ordered/unordered), individual list items (text, icons), dividers, **inferred functionality (e.g., "Displays user notifications", "Shows navigation links")**.
     - **Navigation Bars/App Bars:** Title, logo, navigation items (text, icons), background color, height, **inferred functionality (e.g., "Allows switching between main sections", "Provides quick access to settings")**.
     - **Cards:** Title, content, image (if any), shadow, border-radius, padding, **inferred purpose (e.g., "Displays product information", "Summarizes user's activity")**.
     - **Dropdowns/Selects:** Current selected value, options, **inferred functionality (e.g., "Allows selecting a category")**.
     - **Checkboxes/Switches:** Label, current state (checked/unchecked), **inferred functionality (e.g., "Toggles a setting")**.
     - **Other interactive elements:** Identify their type, properties, and **inferred functionality**.

2. OVERALL LAYOUT AND RESPONSIVENESS:
   - Describe the overall page structure, including headers, footers, sidebars, and main content areas.
   - Note any apparent responsiveness features or adaptive layouts (e.g., how elements might rearrange, resize, or become hidden/shown on smaller vs. larger screens). Specify approximate breakpoints if inferable.
   - Identify the primary layout method (e.g., Flexbox, Grid, Column/Row based).

3. HEADER/NAVIGATION ANALYSIS:
   - Header background color (exact hex)
   - Logo position, size, and styling
   - Title text (font, size, weight, color)
   - Navigation icons (hamburger menu, search, notifications, profile)
   - Header height and padding
   - Search bar styling (if present)
   - Notification badges and styling

4. SIDEBAR/NAVIGATION ANALYSIS:
   - Sidebar background color and width
   - Collapsed/expanded states
   - Menu items hierarchy and styling
   - Active/selected states
   - Icon colors and sizes
   - Text styling for menu items
   - Hover effects and transitions
   - Submenu styling and indentation

5. MAIN CONTENT AREA:
   - Background color and padding
   - Content positioning relative to header/sidebar
   - Section headers and their styling
   - Breadcrumb navigation (if present)
   - Tab navigation styling
   - Button colors, sizes, and positioning

6. TABLE/DATA GRID ANALYSIS:
   - Table headers: background, text color, font weight, alignment
   - Table rows: background colors (alternating if applicable)
   - Cell padding and alignment
   - Border styles and colors
   - Column widths and proportions
   - Action buttons within cells
   - Status badges/chips styling
   - Hover effects on rows

7. FORM ELEMENTS & CONTROLS:
   - Input field styling (borders, padding, background)
   - Dropdown menus (Select components)
   - Search boxes with icons
   - Button variations (primary, secondary, icon buttons)
   - Toggle switches and checkboxes
   - Date pickers and filters

8. PAGINATION & NAVIGATION:
   - Pagination component styling
   - Page numbers and navigation arrows
   - Items per page selector
   - Total count display

9. STATUS INDICATORS & BADGES:
   - Success/error/warning colors
   - Badge shapes and sizes
   - Icon usage within badges
   - Color coding system

10. SPACING & LAYOUT:
    - Precise margins and padding measurements
    - Grid system alignment
    - Responsive breakpoints
    - Content max-widths
    - Vertical spacing between sections

11. TYPOGRAPHY SYSTEM:
    - Font families used throughout
    - Heading hierarchy (H1, H2, H3, etc.)
    - Body text sizes and weights
    - Link styling and hover states
    - Text colors for different contexts

12. INTERACTIVE ELEMENTS:
    - Button hover and active states
    - Dropdown animations
    - Modal/dialog styling
    - Tooltip appearances
    - Loading states

13. COLOR PALETTE EXTRACTION:
    - Primary brand colors
    - Secondary colors
    - Neutral grays
    - Success/warning/error colors
    - Background variations
    - Text color hierarchy

14. SPECIFIC UI PATTERNS:
    - Card layouts and shadows
    - List item styling
    - Data visualization elements
    - Filter and sort controls
    - Bulk action interfaces

LAYOUT STRUCTURE ANALYSIS:
- Identify if it's a dashboard, data table, form, or mixed layout
- Note the grid system (12-column, flexbox, CSS Grid)
- Measure proportional relationships between elements
- Document responsive behavior patterns based on vision analysis hints

CONTENT EXTRACTION:
- Extract ALL visible text exactly as shown
- Note placeholder text in input fields
- Document all button labels
- List all table headers and sample data
- Identify icon types and their meanings

ACCESSIBILITY FEATURES:
- Color contrast ratios
- Focus indicators
- Screen reader considerations
- Keyboard navigation patterns

ANIMATION & TRANSITIONS:
- Sidebar collapse/expand animations
- Hover effects and transitions
- Loading animations
- Micro-interactions

COMPONENT MAPPING:
- For each identified UI element (e.g., button, input, dropdown), tag with the corresponding component name from the target framework.
- Use the following component mappings:
  - React-MUI: ${JSON.stringify(componentMappings['react-mui'], null, 2)}
  - React Native: ${JSON.stringify(componentMappings['react-native'], null, 2)}
  - Flutter: ${JSON.stringify(componentMappings['flutter'], null, 2)}
- Example: "Primary button [component: Button] at [x=100, y=50] with text 'Submit' [functionality: Likely submits a form]."

Return a comprehensive description covering all these aspects with exact measurements, colors, styling details, component tags, inferred functionality, and responsive behavior for perfect recreation.`;

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
        temperature: 0.0,
      });

      return response.choices[0]?.message?.content || 'Failed to generate description';
    } catch (error) {
      console.error('Error generating UI description:', error);
      throw new Error('Failed to generate UI description. Please check your Azure OpenAI configuration and try again.');
    }
  }

  private refinePrompt(
    originalPrompt: string,
    code: string,
    codeFormat: string,
    validationResult: ValidationResult,
    responsiveIssues: string[]
  ): string {
    let refinedPrompt = originalPrompt;

    // Append feedback based on validation results
    if (!validationResult.valid) {
      refinedPrompt += `\n\nPREVIOUS VALIDATION FAILED: ${validationResult.message}\n`;
      if (codeFormat === 'react-mui') {
        if (!code.includes('aria-label') || !code.includes('role')) {
          refinedPrompt += `MANDATORY: Add aria-label attributes to ALL interactive elements (e.g., Button, TextField) and role attributes (e.g., role="main", role="form").\n`;
        }
        if (!code.includes('useMediaQuery') && !code.includes('breakpoints')) {
          refinedPrompt += `MANDATORY: Implement responsive design using useMediaQuery and breakpoints (xs, sm, md, lg, xl) for mobile and desktop layouts.\n`;
        }
        if (!code.includes('GeneratedComponent')) {
          refinedPrompt += `MANDATORY: Name the main component 'GeneratedComponent' and export it as default.\n`;
        }
      } else if (codeFormat === 'react-native') {
        if (!code.includes('accessible={true}') || !code.includes('accessibilityLabel')) {
          refinedPrompt += `MANDATORY: Add accessible={true} and accessibilityLabel to ALL interactive elements (e.g., TouchableOpacity, TextInput).\n`;
        }
        if (!code.includes('Dimensions')) {
          refinedPrompt += `MANDATORY: Use Dimensions.get('window') for responsive design adjustments.\n`;
        }
        if (!code.includes('App')) {
          refinedPrompt += `MANDATORY: Name the main component 'App' and export it as default.\n`;
        }
      } else if (codeFormat === 'flutter') {
        if (!code.includes('Semantics')) {
          refinedPrompt += `MANDATORY: Add Semantics widgets to ALL interactive elements for accessibility.\n`;
        }
        if (!code.includes('MediaQuery')) {
          refinedPrompt += `MANDATORY: Use MediaQuery for responsive design adjustments.\n`;
        }
        if (!code.includes('App')) {
          refinedPrompt += `MANDATORY: Name the main app class 'MyApp' and include a main() function.\n`;
        }
      }
    }

    // Append responsive design feedback
    if (responsiveIssues.length > 0) {
      refinedPrompt += `\nRESPONSIVE DESIGN ISSUES DETECTED:\n${responsiveIssues.join('\n')}\n`;
      refinedPrompt += `MANDATORY: Address all responsive design issues by implementing proper breakpoints and dynamic sizing as specified in the issues.\n`;
    }

    return refinedPrompt;
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

      let code = '';
      let attempts = 0;
      const maxAttempts = 2;

      // Validation functions (assuming these are available globally or imported)
      const validateCode = (code: string, format: string): ValidationResult => {
        if (!code) {
          return { valid: false, message: 'No code provided' };
        }
        if (!code.includes('return')) {
          return { valid: false, message: 'Code must contain a return statement' };
        }
        if (format === 'react-mui') {
          if (!code.includes('aria-label') && !code.includes('role')) {
            return { valid: false, message: 'React-MUI code must include accessibility attributes (e.g., aria-label, role)' };
          }
          if (!code.includes('GeneratedComponent')) {
            return { valid: false, message: 'React-MUI code must define GeneratedComponent' };
          }
          if (!/<[A-Za-z][^>]*>/.test(code)) {
            return { valid: false, message: 'React-MUI code must contain valid JSX' };
          }
          if (!code.includes('useMediaQuery') && !code.includes('breakpoints')) {
            return { valid: false, message: 'React-MUI code must include responsive breakpoints' };
          }
        } else if (format === 'react-native') {
          if (!code.includes('accessible={true}') && !code.includes('accessibilityLabel')) {
            return { valid: false, message: 'React Native code must include accessibility props (e.g., accessible, accessibilityLabel)' };
          }
          if (!code.includes('App')) {
            return { valid: false, message: 'React Native code must define an App component' };
          }
          if (!code.includes('Dimensions')) {
            return { valid: false, message: 'React Native code must use Dimensions for responsive design' };
          }
        } else if (format === 'flutter') {
          if (!code.includes('Semantics')) {
            return { valid: false, message: 'Flutter code must include Semantics widgets for accessibility' };
          }
          if (!code.includes('App')) {
            return { valid: false, message: 'Flutter code must define an App component' };
          }
          if (!code.includes('MediaQuery')) {
            return { valid: false, message: 'Flutter code must use MediaQuery for responsive design' };
          }
        }
        return { valid: true, message: '' };
      };

      const validateResponsiveDesign = (code: string, format: string): string[] => {
        const issues = [];
        const viewportWidths = [320, 768, 1280];
        for (const width of viewportWidths) {
          if (format === 'react-mui' && !code.includes(`breakpoints\.down\('sm'\)`) && width <= 768) {
            issues.push(`Layout may not adapt correctly for mobile (width=${width}px). Add sm breakpoint handling.`);
          }
          if (format === 'react-native' && !code.includes(`Dimensions\.get\('window'\)\.width < ${width}`)) {
            issues.push(`Layout may not scale for width=${width}px. Use Dimensions for dynamic sizing.`);
          }
          if (format === 'flutter' && !code.includes(`screenWidth < ${width}`)) {
            issues.push(`Layout may not adjust for width=${width}px. Use MediaQuery for responsive design.`);
          }
        }
        return issues;
      };

      while (attempts < maxAttempts) {
        const response = await this.client.chat.completions.create({
          model: AZURE_OPENAI_MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: `You are an expert UI developer who creates PIXEL-PERFECT recreations of complex enterprise applications. Your code must:

              1. EXACTLY match every visual element from the UI description
              2. Implement fully functional interfaces with proper state management
              3. Create collapsible sidebars with smooth animations
              4. Build responsive layouts with tabs and forms as specified
              5. Match all colors, fonts, spacing, and layout precisely
              6. Include all interactive elements (dropdowns, buttons, toggles)
              7. Implement proper accessibility features (aria-labels, keyboard navigation)
              8. Use modern framework patterns and hooks
              9. Return ONLY clean, executable code without markdown or explanations
              10. Ensure no tables are added unless explicitly present in the UI description
              11. Follow user-provided custom prompts for additional details
              12. Make the interface fully responsive and production-ready
              13. Use mapped components as specified in the UI description (e.g., [component: Button])`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 8000,
          temperature: 0.0,
        });

        code = response.choices[0]?.message?.content || '';

        // Preprocess code
        if (codeFormat === 'react-mui') {
          code = this.preprocessCodeForReactLive(code);
        } else if (codeFormat === 'react-native') {
          code = this.preprocessReactNativeCode(code);
        } else if (codeFormat === 'flutter') {
          code = this.preprocessFlutterCode(code);
        }

        // Validate the generated code
        const validationResult = validateCode(code, codeFormat);
        const responsiveIssues = validateResponsiveDesign(code, codeFormat);

        if (validationResult.valid && responsiveIssues.length === 0) {
          return code;
        }

        // Refine prompt based on validation results
        prompt = this.refinePrompt(prompt, code, codeFormat, validationResult, responsiveIssues);
        attempts++;
      }

      console.error('Max attempts reached with validation errors');
      throw new Error('Failed to generate valid code after maximum attempts. Please check the UI description and try again.');
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate code. Please check your Azure OpenAI configuration and try again.');
    }
  }

  private getEnhancedReactMUIPrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `CREATE PIXEL-PERFECT REACT + MATERIAL-UI CODE FOR COMPLEX ENTERPRISE UI:

UI DESCRIPTION:
${uiDescription}

USER REQUIREMENTS:
${userPrompt || 'Create an exact replica with perfect visual matching and full functionality'}

DEVICE TARGET: ${deviceType}

MANDATORY IMPLEMENTATION REQUIREMENTS:

1. COMPONENT STRUCTURE:
   - Component name: "GeneratedComponent"
   - Use React hooks for state management
   - Implement TypeScript interfaces for props and state
   - Single default export
   - **Prioritize semantic HTML/component usage.**

2. REQUIRED IMPORTS (INCLUDE ALL NECESSARY):
   \`\`\`javascript
   import React, { useState, useEffect, useCallback, useMemo } from 'react';
   import {
     Box, Typography, ${componentMappings['react-mui'].button}, ${componentMappings['react-mui'].card}, ${componentMappings['react-mui'].text_input},
     Grid, IconButton, CircularProgress, ${componentMappings['react-mui'].checkbox}, FormControlLabel,
     ${componentMappings['react-mui'].dropdown}, MenuItem, FormControl, InputLabel, Paper,
     ${componentMappings['react-mui'].navigation}, Toolbar, Avatar, Badge, Chip, Divider, ${componentMappings['react-mui'].sidebar},
     ${componentMappings['react-mui'].list}, ${componentMappings['react-mui'].list_item}, ListItemText, ListItemIcon, ${componentMappings['react-mui'].switch},
     Dialog, DialogTitle, DialogContent, DialogActions,
     Snackbar, Alert, ${componentMappings['react-mui'].tabs}, ${componentMappings['react-mui'].tab}, Accordion, AccordionSummary,
     AccordionDetails, Stepper, Step, StepLabel, Breadcrumbs,
     Link, Tooltip, Popover, Menu, Fade, Grow, Slide,
     TablePagination, TableSortLabel, InputAdornment, CssBaseline,
     ThemeProvider, createTheme, useTheme, useMediaQuery,
     Collapse, ListItemButton, Stack, Container
   } from '@mui/material';
   import {
     Search, Notifications, Dashboard, Campaign, Person,
     Analytics, Description, Brightness4, Brightness7,
     Menu as MenuIcon, Close, Add, Edit, Delete, Save,
     Cancel, Check, Warning, Error, Info, Upload,
     Download, Print, Share, Refresh, Settings, Help,
     ExpandMore, ChevronRight, ChevronLeft, ArrowBack,
     ArrowForward, Home, Work, Email, Phone, LocationOn,
     ExpandLess, MoreVert, FilterList, Visibility,
     Business, Group, Assignment, NotificationsActive
   } from '@mui/icons-material';
   \`\`\`

3. LAYOUT IMPLEMENTATION:
   - Create a proper app layout with header, sidebar, and main content (if specified in UI description)
   - Header should be fixed at top with exact styling
   - Sidebar should be collapsible with hamburger menu on mobile (xs breakpoint)
   - Main content area should adjust when sidebar collapses
   - Implement responsive behavior using MUI Grid and useMediaQuery with breakpoints (xs, sm, md, lg, xl)
   - **Implement basic responsive design principles (e.g., flexbox/grid).**

4. HEADER REQUIREMENTS (IF PRESENT):
   - Fixed ${componentMappings['react-mui'].navigation} with exact background color
   - Company logo/brand on the left
   - Center title with exact typography (follow MUI typography scale: h1-h6, body1, body2)
   - Right side icons (search, notifications, profile) with aria-labels
   - Search functionality with proper styling and accessibility
   - Notification badge with count and aria-describedby
   - Stack vertically on mobile (xs)

5. SIDEBAR REQUIREMENTS (IF PRESENT):
   - Collapsible ${componentMappings['react-mui'].sidebar} with smooth animations (0.3s ease)
   - Menu items with icons and text using ${componentMappings['react-mui'].list} and ${componentMappings['react-mui'].list_item}
   - Active/selected states with highlighting
   - Nested menu items with proper indentation
   - Hover effects and transitions
   - User profile section at bottom with aria-label
   - Collapse to hamburger menu on mobile (xs)

6. MAIN CONTENT REQUIREMENTS:
   - Implement tabs using ${componentMappings['react-mui'].tabs} and ${componentMappings['react-mui'].tab} as specified
   - Include form elements (${componentMappings['react-mui'].switch}, ${componentMappings['react-mui'].button}) with exact styling
   - No tables unless explicitly present in the UI description
   - Match section headers and layouts exactly using Typography
   - Main content Box must have role="main" and aria-label describing its purpose
   - Adjust padding and font sizes for mobile (xs, sm)

7. FORM CONTROLS:
   - Styled ${componentMappings['react-mui'].switch} with exact styling and aria-checked
   - ${componentMappings['react-mui'].button} with proper states (hover, active, disabled) and mandatory aria-label
   - ${componentMappings['react-mui'].dropdown} with aria-expanded and MenuItem
   - Search inputs with InputAdornment and aria-label
   - ${componentMappings['react-mui'].text_input} with unique id, aria-label, and proper InputLabelProps
   - Form Box must have role="form" and aria-label describing its purpose
   - Stack vertically with increased touch targets on mobile
   - **Ensure all interactive elements are clickable/tappable.**

8. STYLING APPROACH:
   - Create custom theme with exact color palette using createTheme
   - Use sx prop for precise styling with MUI spacing units (8px base)
   - Implement shadows and elevations as specified
   - Responsive design with breakpoints (xs, sm, md, lg, xl)

9. STATE MANAGEMENT:
   - Sidebar open/close state (if present)
   - Tab selection state
   - Switch states for form controls
   - Menu collapse/expand states

10. ACCESSIBILITY REQUIREMENTS (MANDATORY):
    - EVERY ${componentMappings['react-mui'].button} MUST have aria-label describing its action (e.g., aria-label="Submit contact form")
    - EVERY ${componentMappings['react-mui'].text_input} MUST have a unique id (e.g., id="full-name") and aria-label (e.g., aria-label="Full Name input")
    - EVERY form Box MUST have role="form" and aria-label (e.g., aria-label="Contact form")
    - Main content Box MUST have role="main" and aria-label (e.g., aria-label="Contact page content")
    - Ensure keyboard navigation with proper tabIndex and onKeyDown handlers
    - Use role attributes where needed (e.g., role="navigation" for ${componentMappings['react-mui'].sidebar})
    - Provide high contrast ratios (WCAG 2.1 AA compliant)
    - Include focus indicators for all interactive elements
    - **Use appropriate accessibility attributes (e.g., aria-label).**

11. EXAMPLE COMPONENT STRUCTURE:
    \`\`\`javascript
    import React, { useState } from 'react';
    import {
      Box, Typography, ${componentMappings['react-mui'].button}, ${componentMappings['react-mui'].text_input},
      Grid, CssBaseline, ThemeProvider, createTheme, useMediaQuery
    } from '@mui/material';

    const theme = createTheme({
      palette: {
        primary: { main: '#000000' },
        background: { default: '#F5F1EB' },
      },
      typography: {
        fontFamily: ['Georgia', 'Arial', 'sans-serif'].join(','),
        h1: { fontSize: '36px', fontWeight: 700, color: '#000000' },
        body1: { fontSize: '16px', color: '#000000' },
      },
    });

    const GeneratedComponent = () => {
      const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box
            sx={{
              backgroundColor: theme.palette.background.default,
              padding: isSmallScreen ? '20px' : '40px',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: isSmallScreen ? 'column' : 'row',
              gap: isSmallScreen ? '20px' : '40px',
            }}
            role="main"
            aria-label="Contact page content"
          >
            <Box sx={{ flex: isSmallScreen ? '1' : '0 0 40%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box
                component="img"
                src="https://via.placeholder.com/400"
                alt="Contact page illustration"
                sx={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
              />
            </Box>
            <Box sx={{ flex: isSmallScreen ? '1' : '0 0 60%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Typography variant="h1" sx={{ fontSize: isSmallScreen ? '24px' : '36px' }}>Contact Us</Typography>
              <Typography variant="body1" sx={{ fontSize: isSmallScreen ? '14px' : '16px' }}>
                Email: hi@green.com
                <br />
                Location: Los Angeles, California
              </Typography>
              <Box
                component="form"
                sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                noValidate
                autoComplete="off"
                role="form"
                aria-label="Contact form"
              >
                <${componentMappings['react-mui'].text_input}
                  id="full-name"
                  label="Full Name"
                  variant="outlined"
                  fullWidth
                  InputProps={{ sx: { fontSize: isSmallScreen ? '14px' : '16px', fontFamily: 'Arial, sans-serif', padding: '10px' } }}
                  InputLabelProps={{ sx: { fontSize: isSmallScreen ? '14px' : '16px', fontFamily: 'Arial, sans-serif' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderColor: '#000000',
                      '& fieldset': { borderColor: '#000000' },
                      '&:hover fieldset': { borderColor: '#000000' },
                      '&.Mui-focused fieldset': { borderColor: '#000000' },
                    },
                  }}
                  aria-label="Full Name input"
                />
                <${componentMappings['react-mui'].text_input}
                  id="email"
                  label="E-mail"
                  variant="outlined"
                  fullWidth
                  InputProps={{ sx: { fontSize: isSmallScreen ? '14px' : '16px', fontFamily: 'Arial, sans-serif', padding: '10px' } }}
                  InputLabelProps={{ sx: { fontSize: isSmallScreen ? '14px' : '16px', fontFamily: 'Arial, sans-serif' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderColor: '#000000',
                      '& fieldset': { borderColor: '#000000' },
                      '&:hover fieldset': { borderColor: '#000000' },
                      '&.Mui-focused fieldset': { borderColor: '#000000' },
                    },
                  }}
                  aria-label="Email input"
                />
                <${componentMappings['react-mui'].text_input}
                  id="message"
                  label="Message"
                  variant="outlined"
                  multiline
                  rows={4}
                  fullWidth
                  InputProps={{ sx: { fontSize: isSmallScreen ? '14px' : '16px', fontFamily: 'Arial, sans-serif', padding: '10px' } }}
                  InputLabelProps={{ sx: { fontSize: isSmallScreen ? '14px' : '16px', fontFamily: 'Arial, sans-serif' } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderColor: '#000000',
                      '& fieldset': { borderColor: '#000000' },
                      '&:hover fieldset': { borderColor: '#000000' },
                      '&.Mui-focused fieldset': { borderColor: '#000000' },
                    },
                  }}
                  aria-label="Message input"
                />
                <${componentMappings['react-mui'].button}
                  variant="contained"
                  sx={{
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    fontSize: isSmallScreen ? '14px' : '16px',
                    fontWeight: 700,
                    fontFamily: 'Arial, sans-serif',
                    borderRadius: '20px',
                    padding: '10px 20px',
                    width: isSmallScreen ? '100%' : '150px',
                    height: '40px',
                    '&:hover': { backgroundColor: '#333333' },
                  }}
                  aria-label="Submit contact form"
                >
                  Contact Us
                </${componentMappings['react-mui'].button}>
              </Box>
            </Box>
          </Box>
        </ThemeProvider>
      );
    };

    export default GeneratedComponent;
    \`\`\`

CRITICAL REQUIREMENTS:
- Match UI description exactly, using specified components (e.g., [component: ${componentMappings['react-mui'].button}])
- Implement all specified tabs and form controls
- Ensure no tables are added unless present
- Sidebar must collapse/expand smoothly (if present) with hamburger menu on mobile (xs)
- All colors must match exactly
- EVERY interactive element (${componentMappings['react-mui'].button}, ${componentMappings['react-mui'].text_input}, etc.) MUST include aria-label
- EVERY ${componentMappings['react-mui'].text_input} MUST have a unique id
- EVERY form MUST have role="form" and aria-label
- Main content MUST have role="main" and aria-label
- Make it fully responsive with MUI breakpoints (xs, sm, md, lg, xl)
- Adjust font sizes, padding, and touch targets for mobile
- Add proper loading states
- Implement error handling
- Follow MUI typography and spacing guidelines
- **Prioritize semantic HTML/component usage.**
- **Ensure all interactive elements are clickable/tappable.**
- **Use appropriate accessibility attributes (e.g., aria-label).**
- **Implement basic responsive design principles (e.g., flexbox/grid).**

Return ONLY the complete, runnable JavaScript code that creates a pixel-perfect recreation of the UI with all required accessibility attributes and responsive design.`;
  }

  private getEnhancedReactNativePrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `CREATE PIXEL-PERFECT REACT NATIVE CODE FOR COMPLEX MOBILE UI:

UI DESCRIPTION:
${uiDescription}

USER REQUIREMENTS:
${userPrompt || 'Create exact mobile replica with full functionality'}

DEVICE TARGET: ${deviceType}

MANDATORY IMPLEMENTATION RULES:

1. COMPONENT STRUCTURE:
   - Component name: "App"
   - Complete functional component with proper navigation
   - Use hooks for state management
   - **Prioritize semantic component usage.**

2. REQUIRED IMPORTS:
   \`\`\`javascript
   import React, { useState, useEffect, useCallback, useMemo } from 'react';
   import {
     View, Text, ScrollView, ${componentMappings['react-native'].button}, ${componentMappings['react-native'].text_input},
     Image, StyleSheet, StatusBar, SafeAreaView, ${componentMappings['react-native'].list},
     Modal, Alert, Dimensions, KeyboardAvoidingView,
     Platform, Animated, PanResponder, RefreshControl,
     ${componentMappings['react-native'].switch}, Slider, ${componentMappings['react-native'].dropdown}, ActivityIndicator, SectionList,
     VirtualizedList, Pressable, TouchableHighlight
   } from 'react-native';
   import { LinearGradient } from 'expo-linear-gradient';
   import {
     Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons,
     AntDesign, Feather, Entypo
   } from '@expo/vector-icons';
   \`\`\`

3. LAYOUT IMPLEMENTATION:
   - Create proper app structure with header, sidebar drawer, content
   - Implement slide-out navigation drawer using ${componentMappings['react-native'].sidebar}
   - Fixed header with proper styling using ${componentMappings['react-native'].navigation}
   - Scrollable content areas with ${componentMappings['react-native'].list}
   - Tab navigation if needed using ${componentMappings['react-native'].tabs}
   - Use bottom navigation bar for mobile layouts
   - **Implement basic responsive design principles (e.g., flex).**

4. MOBILE-SPECIFIC FEATURES:
   - Touch-friendly sizes (minimum 44px for ${componentMappings['react-native'].button}, ${componentMappings['react-native'].list_item})
   - Proper scroll behavior with bounce effects
   - Swipe gestures for navigation
   - Pull-to-refresh with RefreshControl
   - Keyboard avoidance for ${componentMappings['react-native'].text_input}
   - Adjust font sizes and padding based on Dimensions.get('window').width
   - **Ensure all interactive elements are clickable/tappable.**

5. DATA HANDLING:
   - Use ${componentMappings['react-native'].list} for large datasets
   - Implement pagination with 10 items per page
   - Include search and filter functionality
   - Optimize rendering with useMemo and useCallback

6. STYLING REQUIREMENTS:
   - Use StyleSheet.create for all styles
   - Implement exact colors and spacing (8px base unit)
   - Platform-specific styles with Platform.select (e.g., iOS shadows vs. Android elevation)
   - Responsive design using Dimensions.get('window')

7. NAVIGATION & INTERACTION:
   - Drawer navigation with smooth animations
   - Modal dialogs for actions
   - Toast notifications with Alert
   - Loading states with ActivityIndicator

8. ACCESSIBILITY REQUIREMENTS:
   - Add accessible={true} and accessibilityLabel to all interactive elements
   - Ensure touchable elements have accessibilityRole (e.g., "button" for ${componentMappings['react-native'].button})
   - Support VoiceOver with accessibilityHint
   - Maintain high contrast ratios (WCAG 2.1 AA)
   - Enable keyboard navigation where applicable
   - **Use appropriate accessibility attributes (e.g., accessibilityLabel).**

9. EXAMPLE STRUCTURE:
   \`\`\`javascript
   import React, { useState } from 'react';
   import { SafeAreaView, View, Text, StyleSheet, ${componentMappings['react-native'].button}, ${componentMappings['react-native'].list} } from 'react-native';
   import { Ionicons } from '@expo/vector-icons';
   import { Dimensions } from 'react-native';

   const { width } = Dimensions.get('window');

   const App = () => {
     const [isDrawerOpen, setDrawerOpen] = useState(false);

     const toggleDrawer = () => {
       setDrawerOpen(!isDrawerOpen);
     };

     return (
       <SafeAreaView style={styles.container}>
         <View style={styles.header}>
           <${componentMappings['react-native'].button} onPress={toggleDrawer} accessible={true} accessibilityRole="button" accessibilityLabel="Open menu">
             <Ionicons name="menu" size={width < 400 ? 20 : 24} color="#ffffff" />
           </${componentMappings['react-native'].button}>
           <Text style={[styles.headerTitle, { fontSize: width < 400 ? 16 : 18 }]}>App Title</Text>
         </View>
         {isDrawerOpen && (
           <View style={styles.drawer}>
             <${componentMappings['react-native'].list}>
               <Text style={{ fontSize: width < 400 ? 14 : 16 }}>Menu Item</Text>
             </${componentMappings['react-native'].list}>
           </View>
         )}
         <${componentMappings['react-native'].list} style={styles.mainContent}>
           <Text style={{ fontSize: width < 400 ? 14 : 16 }}>Content Item</Text>
         </${componentMappings['react-native'].list}>
       </SafeAreaView>
     );
   };

   const styles = StyleSheet.create({
     container: { flex: 1 },
     header: {
       height: 60,
       backgroundColor: '#exact-color',
       flexDirection: 'row',
       alignItems: 'center',
       paddingHorizontal: width < 400 ? 8 : 10
     },
     headerTitle: {
       flex: 1,
       color: '#ffffff',
       fontWeight: 'bold',
       fontSize: width < 400 ? 16 : 18
     },
     drawer: {
       position: 'absolute',
       top: 60,
       left: 0,
       width: width < 400 ? 180 : 200,
       height: '100%',
       backgroundColor: '#ffffff'
     },
     mainContent: { padding: width < 400 ? 12 : 16 },
   });

   export default App;
   \`\`\`

CRITICAL: Return ONLY the complete React Native code that works in Expo Snack, using specified components (e.g., [component: ${componentMappings['react-native'].button}]). Ensure responsive design with dynamic sizing based on screen width.
- **Prioritize semantic component usage.**
- **Ensure all interactive elements are clickable/tappable.**
- **Use appropriate accessibility attributes (e.g., accessibilityLabel).**
- **Implement basic responsive design principles (e.g., flex).**`;
  }

  private getEnhancedFlutterPrompt(uiDescription: string, userPrompt: string, deviceType: string): string {
    return `CREATE PIXEL-PERFECT FLUTTER/DART CODE FOR COMPLEX UI:

UI DESCRIPTION:
${uiDescription}

USER REQUIREMENTS:
${userPrompt || 'Create exact Flutter replica with full functionality'}

DEVICE TARGET: ${deviceType}

MANDATORY IMPLEMENTATION RULES:

1. APPLICATION STRUCTURE:
   - Complete Flutter app with proper navigation
   - Use Scaffold with ${componentMappings['flutter'].navigation}, ${componentMappings['flutter'].sidebar}, and body
   - State management with StatefulWidget
   - Proper routing if multiple screens
   - **Prioritize semantic component usage.**

2. REQUIRED IMPORTS:
   \`\`\`dart
   import 'package:flutter/material.dart';
   import 'package:flutter/services.dart';
   import 'package:flutter/cupertino.dart';
   import 'package:flutter/foundation.dart';
   \`\`\`

3. LAYOUT IMPLEMENTATION:
   - ${componentMappings['flutter'].navigation} with exact styling and functionality
   - ${componentMappings['flutter'].sidebar} with collapsible menu items
   - Body with proper content layout using ${componentMappings['flutter'].list}
   - Use BottomNavigationBar for mobile layouts
   - Adjust padding and font sizes using MediaQuery
   - **Implement basic responsive design principles (e.g., Expanded/Flexible).**

4. DATA TABLE FEATURES:
   - DataTable with sorting and pagination
   - Custom table cells with proper styling
   - Row selection and actions
   - Pagination with 10 rows per page
   - Search and filter functionality

5. THEME CUSTOMIZATION:
   - Custom ThemeData with exact colors
   - Typography theme matching the UI (e.g., headline6, bodyText1)
   - Material Design components
   - Proper elevation and shadows

6. INTERACTIVE ELEMENTS:
   - Drawer toggle functionality
   - Form inputs with validation using ${componentMappings['flutter'].text_input}
   - ${componentMappings['flutter'].button} with proper states
   - ${componentMappings['flutter'].dropdown} and selectors
   - ${componentMappings['flutter'].switch} and ${componentMappings['flutter'].checkbox} controls
   - **Ensure all interactive elements are clickable/tappable.**

7. RESPONSIVE DESIGN:
   - Use MediaQuery for screen dimensions
   - Flexible and Expanded widgets for layout
   - Proper breakpoints for tablets (e.g., width > 600)
   - Orientation support
   - Adjust font sizes and padding for mobile (width < 600)

8. ACCESSIBILITY REQUIREMENTS:
   - Use Semantics widgets for all interactive elements
   - Provide semanticLabel for ${componentMappings['flutter'].button}, ${componentMappings['flutter'].text_input}, etc.
   - Ensure focus management with FocusNode
   - Maintain high contrast ratios (WCAG 2.1 AA)
   - Support screen readers with proper descriptions
   - **Use appropriate accessibility attributes (e.g., Semantics).**

9. EXAMPLE STRUCTURE:
   \`\`\`dart
   import 'package:flutter/material.dart';

   void main() {
     runApp(MyApp());
   }

   class MyApp extends StatelessWidget {
     @override
     Widget build(BuildContext context) {
       return MaterialApp(
         title: 'Generated App',
         theme: ThemeData(
           primaryColor: Color(0xFF...), // Exact color
           textTheme: TextTheme(
             headline6: TextStyle(fontSize: 20.0, fontWeight: FontWeight.w500),
           ),
         ),
         home: HomeScreen(),
       );
     }
   }

   class HomeScreen extends StatefulWidget {
     @override
     _HomeScreenState createState() => _HomeScreenState();
   }

   class _HomeScreenState extends State<HomeScreen> {
     int currentPage = 0;
     List<Map<String, dynamic>> data = [];

     @override
     Widget build(BuildContext context) {
       final screenWidth = MediaQuery.of(context).size.width;
       final isMobile = screenWidth < 600;

       return Scaffold(
         appBar: ${componentMappings['flutter'].navigation}(
           title: Text('App Title', style: TextStyle(fontSize: isMobile ? 18 : 20)),
         ),
         drawer: ${componentMappings['flutter'].sidebar}(
           child: ${componentMappings['flutter'].list}(
             children: [
               ${componentMappings['flutter'].list_item}(
                 title: Text('Menu Item', style: TextStyle(fontSize: isMobile ? 14 : 16)),
                 onTap: () {},
               ),
             ],
           ),
         ),
         bottomNavigationBar: isMobile ? BottomNavigationBar(
           items: [
             BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
             BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
           ],
           currentIndex: 0,
           onTap: (index) {},
         ) : null,
         body: Column(
           children: [
             ${componentMappings['flutter'].list}(
               children: [
                 ${componentMappings['flutter'].list_item}(
                   title: Text('Content Item', style: TextStyle(fontSize: isMobile ? 14 : 16)),
                 ),
               ],
             ),
           ],
         ),
       );
     }
   }
   \`\`\`

CRITICAL: Return ONLY the complete Dart code that works in DartPad with full functionality, using specified components (e.g., [component: ${componentMappings['flutter'].button}]). Ensure responsive design with MediaQuery adjustments.
- **Prioritize semantic component usage.**
- **Ensure all interactive elements are clickable/tappable.**
- **Use appropriate accessibility attributes (e.g., Semantics).**
- **Implement basic responsive design principles (e.g., Expanded/Flexible).**`;
  }

  private preprocessCodeForReactLive(code: string): string {
    let cleanedCode = code;

    // Remove markdown code blocks
    cleanedCode = cleanedCode.replace(/```(?:jsx?|javascript|tsx?|typescript)?\s*/gmi, '').replace(/```\s*/gmi, '');

    // Remove any explanatory text before imports
    cleanedCode = cleanedCode.replace(/^[^i]*?(?=import)/i, '');

    // Clean up export statements
    cleanedCode = cleanedCode.replace(/(?:export\s+default\s+\w+;?\s*)[\s\S]*$/gmi, 'export default GeneratedComponent;');

    // Ensure React imports
    if (!cleanedCode.includes('import React')) {
      cleanedCode = `import React from 'react';\n${cleanedCode}`;
    }

    // Add hooks if used but not imported
    const hooksUsed = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useContext'];
    const missingHooks = hooksUsed.filter(hook =>
      cleanedCode.includes(hook) && !cleanedCode.includes(`{ ${hook}`) && !cleanedCode.includes(`, ${hook}`)
    );

    if (missingHooks.length > 0) {
      cleanedCode = cleanedCode.replace(
        'import React',
        `import React, { ${missingHooks.join(', ')} }`
      );
    }

    // Ensure proper component export
    if (!cleanedCode.includes('export default GeneratedComponent')) {
      if (cleanedCode.includes('const GeneratedComponent')) {
        cleanedCode = cleanedCode.replace(/export\s+default\s+\w+;?\s*$/gmi, '');
        cleanedCode = cleanedCode.trim() + '\n\nexport default GeneratedComponent;';
      } else {
        cleanedCode = this.createEnhancedFallbackReactComponent();
      }
    }

    return cleanedCode.trim();
  }

  private preprocessReactNativeCode(code: string): string {
    let cleanedCode = code;

    // Remove markdown and clean up
    cleanedCode = cleanedCode.replace(/```(?:jsx?|javascript|react-native)?\s*/gmi, '').replace(/```\s*/gmi, '');

    // Ensure proper imports...
    return cleanedCode;
  }

  private preprocessFlutterCode(code: string): string {
    let cleanedCode = code;

    // Remove markdown and clean up
    cleanedCode = cleanedCode.replace(/```(?:dart)?\s*/gmi, '').replace(/```\s*/gmi, '');

    // Ensure proper imports...
    return cleanedCode;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  private createEnhancedFallbackReactComponent(): string {
    return `
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const GeneratedComponent = () => {
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6">
        Error: Could not generate component.
      </Typography>
      <Button variant="contained" aria-label="Retry generation">Retry</Button>
    </Box>
  );
};

export default GeneratedComponent;
`;
  }
}

export const enhancedAzureOpenAIService = new EnhancedAzureOpenAIService();