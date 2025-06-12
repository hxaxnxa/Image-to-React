import React from 'react';
import { TextField, Typography, Card, CardContent } from '@mui/material';

const UIDescriptionEditor = ({ description, onChange }) => {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          UI Description
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          value={description}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Edit UI description here..."
          variant="outlined"
        />
      </CardContent>
    </Card>
  );
};

export default UIDescriptionEditor;