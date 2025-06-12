const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateUIDescription(imageBuffer) {
    try {
      const prompt = `Analyze this UI/design image and provide a detailed description of:
      1. Layout structure (header, main content, sidebar, footer)
      2. Components present (buttons, forms, cards, navigation)
      3. Color scheme and styling (provide HEX codes where possible)
      4. Typography and text elements (font styles, sizes)
      5. Interactive elements and their purposes
      
      Be specific and detailed for React component generation.`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      return result.response.text();
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  async generateReactCode(uiDescription, userPrompt, deviceType = 'desktop') {
    try {
      const prompt = `Generate a complete React component named 'GeneratedComponent' using Material-UI (@mui/material) based on:

      UI Description: ${uiDescription}
      User Prompt: ${userPrompt}
      Device Type: ${deviceType}

      Requirements:
      1. Name the main component 'GeneratedComponent' and export it as default.
      2. Use Material-UI components exclusively (@mui/material, @mui/icons-material).
      3. Make it responsive using useEffect to detect mobile view (window.innerWidth <= 768) and adjust padding, spacing, and sizes accordingly.
      4. Include proper styling with sx prop or styled components.
      5. Implement interactivity (e.g., buttons, navigation) using React hooks (useState, useEffect).
      6. For dark mode, use Material-UI's ThemeProvider with a theme object toggled by useState. Always use an IconButton with Brightness4/Brightness7 icons, positioned fixed at bottom-right or in the header.
      7. Use placeholder images (e.g., https://via.placeholder.com) for any images, do not use local paths.
      8. Ensure the component is self-contained and renders correctly in a live preview environment like react-live, which provides dependencies via a scope object.
      9. Include proper import statements for publishing to a React project.
      10. Avoid manipulating document.body directly; use Material-UI theme for styling.
      11. Strip any markdown formatting (e.g., \`\`\`jsx) from the output, returning only the JavaScript code.
      12. Do not define additional components outside 'GeneratedComponent'; inline all sub-components within it.
      13. Use 'import { useState, useEffect } from "react"' for hooks.
      14. When using Material-UI icons, do not append 'Icon' to the import name (e.g., use 'KeyboardArrowLeft' instead of 'KeyboardArrowLeftIcon').

      Return only the React component code, no explanations or markdown.`;

      const result = await this.model.generateContent(prompt);
      let code = result.response.text();
      // Strip markdown
      code = code.replace(/^```jsx?\n/, '').replace(/\n```$/, '').trim();
      return code;
    } catch (error) {
      throw new Error(`Code generation error: ${error.message}`);
    }
  }
}

module.exports = GeminiService;