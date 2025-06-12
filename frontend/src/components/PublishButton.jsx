import React from 'react';
import { Button } from '@mui/material';
import axios from 'axios';

const PublishButton = ({ code, deviceType, disabled }) => {
  const handlePublish = async () => {
    console.log('=== PUBLISH DEBUG INFO ===');
    console.log('Raw code received:', code);
    console.log('Code type:', typeof code);
    console.log('Code length:', code ? code.length : 0);
    console.log('Device type:', deviceType);
    console.log('Disabled:', disabled);
    
    // Check if we have valid code
    if (!code || typeof code !== 'string' || code.trim() === '') {
      console.error('No valid code to publish');
      alert('Error: No code to publish. Please generate code first.');
      return;
    }

    // Don't clean the code here - send it as is to the backend
    // The backend should handle the cleaning
    try {
      console.log('Sending request to backend...');
      const response = await axios.post('http://localhost:5006/api/publish', {
        code: code, // Send original code
        deviceType: deviceType || 'desktop',
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Backend response:', response.data);
      const { version, message } = response.data;
      const versionDisplay = version === 0 ? 'initial' : `v${version}`;
      alert(`${message || 'Project published successfully!'} Version: ${versionDisplay}. View at http://localhost:3001`);
      
    } catch (error) {
      console.error('=== PUBLISH ERROR ===');
      console.error('Error object:', error);
      console.error('Response:', error.response);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Failed to publish project: ${errorMessage}`);
    }
  };

  // More thorough check for disabled state
  const isDisabled = disabled || !code || code.trim() === '';

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handlePublish}
      disabled={isDisabled}
      sx={{ minWidth: 120 }}
    >
      Publish ({isDisabled ? 'No Code' : 'Ready'})
    </Button>
  );
};

export default PublishButton;