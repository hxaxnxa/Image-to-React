import axios from 'axios';

class ProjectService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5006/api';
  }

  async publishProject(reactCode, deviceType, metadata) {
    const response = await axios.post(`${this.baseURL}/publish`, {
      reactCode,
      deviceType,
      metadata
    });
    return response.data;
  }
}

export const projectService = new ProjectService();