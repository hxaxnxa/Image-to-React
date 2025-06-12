import React, { useState } from 'react';
import { Box, Button, LinearProgress, Alert, Select, MenuItem } from '@mui/material';
import geminiService from '../services/geminiService';

const ImageUpload = ({ setImages, onDescriptionGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDescription, setSelectedDescription] = useState(0);
  const [descriptions, setDescriptions] = useState([]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 10) {
      setError('You can upload a maximum of 10 images.');
      return;
    }
    setImages(files);
    setLoading(true);
    setError('');

    try {
      const response = await geminiService.generateUIDescription(files);
      setDescriptions(response.descriptions);
      onDescriptionGenerated(response.descriptions[selectedDescription].description);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        style={{ display: 'block', margin: '0 auto' }}
      />
      {loading && <LinearProgress sx={{ mt: 2 }} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {descriptions.length > 0 && (
        <Select
          value={selectedDescription}
          onChange={(e) => {
            setSelectedDescription(e.target.value);
            onDescriptionGenerated(descriptions[e.target.value].description);
          }}
          sx={{ mt: 2 }}
        >
          {descriptions.map((_, i) => (
            <MenuItem key={i} value={i}>Image {i + 1}</MenuItem>
          ))}
        </Select>
      )}
    </Box>
  );
};

export default ImageUpload;