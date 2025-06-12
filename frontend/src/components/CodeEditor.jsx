import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import Editor from '@monaco-editor/react';
import geminiService from '../services/geminiService';
import { formatCode, validateCode } from '../utils/codeGenerator';

const CodeEditor = ({
  code,
  onChange,
  isGenerating,
  uiDescription,
  userPrompt,
  deviceType,
  onCodeGenerated,
  onGenerationComplete
}) => {
  const [error, setError] = useState('');

  const generateCode = useCallback(async () => {
    setError('');
    try {
      const generatedCode = await geminiService.generateReactCode(uiDescription, userPrompt, deviceType);
      const formattedCode = formatCode(generatedCode);
      const validation = validateCode(formattedCode);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      onCodeGenerated(formattedCode);
    } catch (err) {
      setError('Failed to generate code: ' + err.message);
    } finally {
      onGenerationComplete();
    }
  }, [uiDescription, userPrompt, deviceType, onCodeGenerated, onGenerationComplete]);

  useEffect(() => {
    if (isGenerating && uiDescription && userPrompt) {
      generateCode();
    }
  }, [isGenerating, uiDescription, userPrompt, deviceType, generateCode]);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Generated Code
      </Typography>
      {isGenerating && <CircularProgress sx={{ mb: 2 }} />}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
        <Editor
          height="400px"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => onChange(formatCode(value || ''))}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14
          }}
        />
      </Box>
    </Box>
  );
};

export default CodeEditor;