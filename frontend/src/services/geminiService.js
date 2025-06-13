import axios from 'axios';

class GeminiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5006/api';
    if (!this.baseURL) {
      console.error('API base URL is not defined. Set REACT_APP_API_URL in .env');
    }
  }

  async generateUIDescription(imageFiles) {
    try {
      const formData = imageFiles instanceof FormData ? imageFiles : new FormData();
      if (!(imageFiles instanceof FormData)) {
        imageFiles.forEach(file => formData.append('images', file));
      }

      const response = await axios.post(`${this.baseURL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return response.data;
    } catch (error) {
      console.error('generateUIDescription error:', error);
      throw new Error('Failed to generate UI description: ${error.message}');
    }
  }

  async generateReactCode(uiDescription, userPrompt, deviceType) {
    try {
      const response = await axios.post(`${this.baseURL}/gemini/generate-code`, {
        uiDescription,
        userPrompt,
        deviceType
      });

      return response.data.code;
    } catch (error) {
      console.error('generateReactCode error:', error);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }
}

const geminiService = new GeminiService();
export default geminiService; // Use default export