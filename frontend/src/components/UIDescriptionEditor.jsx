import React, { useState, useEffect } from 'react';
import {
  TextField,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Alert,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Edit,
  AutoAwesome,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Info
} from '@mui/icons-material';

const UIDescriptionEditor = ({ description, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Update word count when description changes
  useEffect(() => {
    if (description) {
      setWordCount(description.trim().split(/\s+/).filter(word => word.length > 0).length);
    } else {
      setWordCount(0);
    }
  }, [description]);

  const handleDescriptionChange = (event) => {
    const newValue = event.target.value;
    onChange(newValue);
  };

  const getDescriptionQuality = () => {
    if (wordCount === 0) return { quality: 'empty', chipColor: 'default', text: 'No description', progressColor: 'primary' };
    if (wordCount < 10) return { quality: 'poor', chipColor: 'default', text: 'Too brief', progressColor: 'primary' };
    if (wordCount < 30) return { quality: 'fair', chipColor: 'default', text: 'Could be more detailed', progressColor: 'primary' };
    if (wordCount < 100) return { quality: 'good', chipColor: 'primary', text: 'Good detail level', progressColor: 'primary' };
    return { quality: 'excellent', chipColor: 'primary', text: 'Excellent detail', progressColor: 'primary' };
  };

  const qualityInfo = getDescriptionQuality();
  const completionPercentage = Math.min((wordCount / 50) * 100, 100);

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit color="primary" />
            UI Description
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              icon={<AutoAwesome />}
              label={`${wordCount} words`}
              color={qualityInfo.chipColor}
              variant="outlined"
            />
            <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
              <IconButton
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Collapse in={isExpanded}>
          <Box>
            {/* Quality Indicator */}
            {description && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Description Quality: {qualityInfo.text}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(completionPercentage)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completionPercentage}
                  color={qualityInfo.progressColor}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            )}

            {/* Description Input */}
            <TextField
              fullWidth
              multiline
              rows={8}
              value={description}
              onChange={handleDescriptionChange}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(false)}
              placeholder="Describe the UI elements, layout, colors, and functionality you want to recreate from the uploaded images..."
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isEditing ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  transition: 'background-color 0.2s ease',
                },
              }}
            />

            {/* Helper Text */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Be specific about colors, layout, components, and interactions for better results
              </Typography>
            </Box>

            {/* Tips */}
            {(!description || wordCount < 20) && (
              <Alert 
                severity="info" 
                sx={{ borderRadius: 2, mb: 2 }}
                icon={<AutoAwesome />}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Tips for better results:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    • Describe the layout structure (header, sidebar, main content)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    • Mention specific colors, fonts, and styling
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    • Note interactive elements like buttons, forms, and navigation
                  </Typography>
                  <Typography variant="body2">
                    • Include responsive behavior if needed
                  </Typography>
                </Box>
              </Alert>
            )}

            {/* Success Indicator */}
            {qualityInfo.quality === 'excellent' && (
              <Alert 
                severity="success" 
                sx={{ borderRadius: 2 }}
                icon={<CheckCircle />}
              >
                Great! Your description is detailed enough to generate high-quality code.
              </Alert>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default UIDescriptionEditor;