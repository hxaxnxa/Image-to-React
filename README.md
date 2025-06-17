# Figma to React - AI-Powered Design Converter

Transform your UI designs into production-ready code using Google's Gemini 1.5 Flash AI model with advanced preview capabilities.

## 🚀 Features

### Core Functionality
- **Multi-Image Upload**: Upload multiple UI design images simultaneously
- **AI-Generated Descriptions**: Automatic detailed UI descriptions for each image using Gemini 1.5 Flash
- **Editable Descriptions**: Modify AI-generated descriptions to refine output
- **Custom Requirements**: Add specific styling preferences and functionality requests
- **Multiple Target Platforms**:
  - Desktop (React + Material-UI)
  - Mobile Web (React + Material-UI)
  - React Native
  - Flutter

### Advanced Preview Features
- **Individual Code Generation**: Generate code for specific images
- **Batch Processing**: Generate code for all images with progress tracking
- **Multi-Platform Live Preview**:
  - **React + Material-UI**: Real-time preview with react-live
  - **React Native**: Expo Snack embedded preview
  - **Flutter**: DartPad embedded preview
- **Code Editor**: Monaco editor with syntax highlighting and language detection
- **Export Options**: Copy to clipboard or download as files
- **Responsive Design**: Optimized for all device sizes

### Preview Integration Table

| Code Format | Preview Method | Output Expectation |
|-------------|---------------|-------------------|
| React + Material-UI | react-live | Clean JSX without imports, ready for live preview |
| React Native | Expo Snack | Complete React Native app with proper imports |
| Flutter | DartPad | Complete Dart app with main() function |

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd figma-to-react
   npm install
   ```

2. **Configure API Key**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env` file

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📱 How to Use

### Step 1: Upload Images
- Drag and drop UI design images or click to browse
- Supports JPG, PNG, GIF, WebP formats
- Multiple images can be uploaded simultaneously

### Step 2: Review Descriptions
- AI automatically generates detailed descriptions for each image
- Select any image to view/edit its description
- Descriptions are fully editable to refine the output

### Step 3: Add Custom Requirements
- Specify colors, animations, interactions, or specific components
- Choose target platform (Desktop, Mobile Web, React Native, Flutter)
- Select code format preference

### Step 4: Generate Code
- Generate code for individual images or all at once
- View progress with real-time progress bars
- Edit generated code in the built-in Monaco editor with language detection

### Step 5: Preview and Export
- **React + Material-UI**: Live preview with react-live
- **React Native**: Embedded Expo Snack preview
- **Flutter**: Embedded DartPad preview
- Copy code to clipboard or download as files
- Switch between different device views (desktop/mobile)

## 🎯 Supported Platforms & Preview Methods

### React + Material-UI
- **Preview**: react-live embedded preview
- **Features**: Responsive web components, dark mode support, Material Design principles
- **Output**: Clean JSX without imports, optimized for live preview

### React Native
- **Preview**: Expo Snack embedded iframe
- **Features**: Mobile-optimized components, native styling patterns, cross-platform compatibility
- **Output**: Complete React Native app with proper imports and expo compatibility

### Flutter
- **Preview**: DartPad embedded iframe
- **Features**: Material Design widgets, Dart language syntax, mobile-first approach
- **Output**: Complete Flutter app with main() function and proper widget structure

## 🔧 Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing with language detection
- **React Live** for React component preview
- **Lucide React** for icons

### AI Integration
- **Google Gemini 1.5 Flash** for image analysis and code generation
- **Multi-modal AI** for understanding UI designs
- **Context-aware** code generation based on descriptions and requirements
- **Platform-specific** output optimization

### Preview Integration
- **DartPad Integration**: `https://dartpad.dev/embed-flutter.html` for Flutter previews
- **Expo Snack Integration**: `https://snack.expo.dev/embed` for React Native previews
- **React Live**: Real-time React component rendering

### Key Components
- `ImageUpload`: Multi-image upload with drag-and-drop
- `UIDescriptionEditor`: Editable AI-generated descriptions
- `PromptBox`: Custom requirements and platform selection
- `CodeEditor`: Monaco-based code editor with language detection and real-time sync
- `LivePreview`: Dynamic preview component supporting multiple platforms
- `ProgressBar`: Visual progress tracking

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Ensure your production environment has:
```
VITE_GEMINI_API_KEY=your_production_api_key
```

## 🔍 LLM Output Guidelines

The application provides clear instructions to Gemini 1.5 Flash for optimal code generation:

### React + Material-UI
- Return clean JSX without import statements
- Use proper Material-UI component patterns
- Include dark mode support and responsive design
- Optimize for react-live compatibility

### React Native
- Return complete React Native app with proper imports
- Use Expo-compatible components only
- Include proper navigation and state management
- Optimize for Expo Snack compatibility

### Flutter
- Return complete Dart application with main() function
- Use Material Design widgets
- Include proper state management and animations
- Optimize for DartPad compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the GitHub Issues page
2. Review the documentation
3. Contact the development team

---

**Built with ❤️ using Google Gemini AI, DartPad, Expo Snack, and modern web technologies**