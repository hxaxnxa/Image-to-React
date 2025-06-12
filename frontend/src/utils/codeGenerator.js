const formatCode = (code) => {
  return code.trim();
};

const validateCode = (code) => {
  if (!code.includes('export default')) {
    return { valid: false, message: 'Code must include an export default statement' };
  }
  return { valid: true };
};

const stripImports = (code) => {
  // Remove all import statements more thoroughly
  let cleanedCode = code
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]*['"];?\s*\n?/g, '') // Remove all import statements
    .replace(/export\s+default\s+/, '') // Remove export default
    .replace(/\n\s*\n+/g, '\n') // Remove extra newlines
    .trim();

  console.log('Stripped code:', cleanedCode); // Debug
  return cleanedCode;
};

export { formatCode, validateCode, stripImports };