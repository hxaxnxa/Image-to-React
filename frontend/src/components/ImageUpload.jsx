import React, { useState } from 'react';
import {
  Box,
  Button,
  LinearProgress,
  Alert,
  Select,
  MenuItem,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Typography,
  Grid,
  Paper,
  Chip,
  Fade,
  Tooltip
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Image as ImageIcon,
  AutoAwesome,
  Visibility
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import geminiService from '../services/geminiService';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadZone = styled(Paper)(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const ImageCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ImageUpload = ({ setImages, onDescriptionGenerated }) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDescription, setSelectedDescription] = useState(0);
  const [descriptions, setDescriptions] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const newImages = fileArray.map((file, index) => ({
      id: Date.now() + index,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    const allImages = [...uploadedImages, ...newImages];
    
    if (allImages.length > 10) {
      setError('You can upload a maximum of 10 images.');
      return;
    }

    setUploadedImages(allImages);
    setImages(allImages.map(img => img.file));
    setError('');
  };

  const handleImageUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const deleteImage = (imageId) => {
    const updatedImages = uploadedImages.filter(img => img.id !== imageId);
    setUploadedImages(updatedImages);
    setImages(updatedImages.map(img => img.file));
    
    // Clear descriptions if no images left
    if (updatedImages.length === 0) {
      setDescriptions([]);
      setSelectedDescription(0);
    }
  };

  const generateDescription = async () => {
    if (uploadedImages.length === 0) {
      setError('Please upload at least one image first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const files = uploadedImages.map(img => img.file);
      const response = await geminiService.generateUIDescription(files);
      setDescriptions(response.descriptions);
      onDescriptionGenerated(response.descriptions[0].description);
      setSelectedDescription(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ImageIcon color="primary" />
        Image Upload
      </Typography>

      {/* Upload Zone */}
      <UploadZone
        isDragActive={isDragActive}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
        sx={{ mb: 3 }}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drop images here or click to upload
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Support for multiple images (max 10)
        </Typography>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUpload />}
          sx={{ borderRadius: 2 }}
        >
          Choose Files
          <VisuallyHiddenInput
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
        </Button>
      </UploadZone>

      {/* Image Grid */}
      {uploadedImages.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility color="primary" />
            Uploaded Images ({uploadedImages.length}/10)
          </Typography>
          <Grid container spacing={2}>
            {uploadedImages.map((image, index) => (
              <Grid item xs={12} sm={6} md={4} key={image.id}>
                <Fade in timeout={300 + index * 100}>
                  <ImageCard>
                    <CardMedia
                      component="img"
                      height="140"
                      image={image.url}
                      alt={image.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                      <Box>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                          {image.name}
                        </Typography>
                        <Chip
                          label={formatFileSize(image.size)}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Tooltip title="Delete image">
                        <IconButton
                          color="error"
                          onClick={() => deleteImage(image.id)}
                          sx={{ ml: 1 }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </ImageCard>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Generate Description Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={generateDescription}
          disabled={uploadedImages.length === 0 || loading}
          startIcon={<AutoAwesome />}
          sx={{ borderRadius: 2, py: 1.5, px: 3 }}
          fullWidth
        >
          {loading ? 'Generating Description...' : 'Generate Description'}
        </Button>
      </Box>

      {/* Loading Progress */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            Analyzing images with AI...
          </Typography>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Description Selector */}
      {descriptions.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Select Image Description
          </Typography>
          <Select
            value={selectedDescription}
            onChange={(e) => {
              setSelectedDescription(e.target.value);
              onDescriptionGenerated(descriptions[e.target.value].description);
            }}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            {descriptions.map((_, i) => (
              <MenuItem key={i} value={i}>
                Image {i + 1} Description
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}
      </Box>
    );
  };
  
  export default ImageUpload;