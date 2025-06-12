import { useState, useEffect } from 'react';

const usePreview = (code, deviceType) => {
  const [previewCode, setPreviewCode] = useState(code);
  const [previewDevice, setPreviewDevice] = useState(deviceType);

  useEffect(() => {
    setPreviewCode(code);
    setPreviewDevice(deviceType);
  }, [code, deviceType]);

  return { previewCode, previewDevice };
};

export default usePreview;