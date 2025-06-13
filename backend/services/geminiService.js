const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateUIDescription(imageBuffer) {
    try {
      const prompt = `Analyze this uploaded UI design image and provide a detailed description of:
1. Layout structure (header, main content, sidebars, footer)
2. UI components (buttons, forms, cards, navigation, icons)
3. Color scheme and styling (include HEX codes where possible)
4. Typography (font styles, sizes, and hierarchy)
5. Spacing, padding, and alignment
6. Interactive elements and their intended behavior

Provide a comprehensive breakdown that can be used to recreate the design using React and Material-UI components. Be precise and developer-friendly.`;

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
      const prompt = `Based on the following UI description and user requirements, generate a complete React component using Material-UI (@mui/material) components.

UI Description:
${uiDescription}

User Requirements:
${userPrompt || 'Create a beautiful, functional component based on the UI description.'}

Device Type: ${deviceType}

Requirements:
1. The component name must be "GeneratedComponent" and exported as default.
2. Use only Material-UI components (@mui/material and @mui/icons-material).
3. Avoid import aliasing like \`Container as MuiContainer\`. Use unique styled component names instead (e.g., \`const StyledContainer = styled(Container)(...)\`).
4. Do not redeclare or shadow imported component names like \`Container\`, \`Box\`, etc.
5. Make the layout responsive (${deviceType === 'mobile' ? 'mobile-first with 375px viewport' : 'desktop with 1200px maxWidth'}).
6. Use Material-UI’s ThemeProvider for dark mode toggle using an IconButton (Brightness4 / Brightness7) with useState.
7. Add placeholder images from https://via.placeholder.com if images are referenced.
8. Include error boundaries and loading states using simple conditional rendering.
9. Inline all subcomponents inside \`GeneratedComponent\`; no separate components.
10. Use React hooks (\`useState\`, \`useEffect\`) properly.
11. Ensure accessibility with ARIA labels on interactive elements.
12. Do not wrap output in markdown (e.g., \`\`\`jsx) — return plain JavaScript code only.
13. Ensure compatibility with react-live or online editors by avoiding custom imports or document usage.
14. Include smooth hover effects and transitions.
15. Use proper Material-UI theming and styling with \`sx\` or \`styled\`.

Generate clean, production-ready, error-free code that works in live preview environments.`;



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