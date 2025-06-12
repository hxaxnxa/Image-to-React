import React from 'react';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const PromptBox = ({ prompt, onChange, onGenerate, deviceType, onDeviceTypeChange }) => {
  return (
    <Box sx={{ mt: 3 }}>
      <TextField
        label="Custom Prompt"
        multiline
        rows={4}
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        variant="outlined"
        placeholder="E.g., Add a dark mode toggle, use blue buttons"
      />
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Device</InputLabel>
          <Select
            value={deviceType}
            onChange={(e) => onDeviceTypeChange(e.target.value)}
            label="Device"
          >
            <MenuItem value="desktop">Desktop</MenuItem>
            <MenuItem value="mobile">Mobile</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={onGenerate}
          disabled={!prompt}
        >
          Generate Code
        </Button>
      </Box>
    </Box>
  );
};

export default PromptBox;