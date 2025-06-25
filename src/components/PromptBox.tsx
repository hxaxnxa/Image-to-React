import React from 'react';
import { MessageSquare, Smartphone, Monitor, Code2 } from 'lucide-react';

export interface PromptBoxProps {
  prompt: string;
  onChange: (value: string) => void;
  deviceType: 'desktop' | 'mobile';
  onDeviceTypeChange: (type: 'desktop' | 'mobile' | 'react-native' | 'flutter') => void;
  codeFormat: 'react-mui' | 'react-native' | 'flutter';
  onCodeFormatChange: (format: 'react-mui' | 'react-native' | 'flutter') => void;
  viewportWidth: number;
  onViewportWidthChange: (width: number) => void;
}

const PromptBox: React.FC<PromptBoxProps> = ({
  prompt,
  onChange,
  deviceType,
  onDeviceTypeChange,
  codeFormat,
  onCodeFormatChange
}) => {
  const deviceOptions = [
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'mobile', label: 'Mobile Web', icon: Smartphone }
  ] as const;

  const formatOptions = deviceType === 'desktop' 
    ? [{ value: 'react-mui', label: 'React + Material-UI' }]
    : [
        { value: 'react-mui', label: 'React + Material-UI' },
        { value: 'react-native', label: 'React Native' },
        { value: 'flutter', label: 'Flutter/Dart' }
      ] as const;

  return (
    <div className="space-y-4">
      {/* Custom Prompt */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900 flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Custom Requirements
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add specific requirements, styling preferences, or functionality requests..."
          className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
        />
        <p className="text-xs text-slate-500">
          Optional: Specify colors, animations, interactions, or specific components
        </p>
      </div>

      {/* Device Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900">
          Target Platform
        </label>
        <div className="grid grid-cols-2 gap-2">
          {deviceOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                onDeviceTypeChange(value);
                if (value === 'desktop' && codeFormat !== 'react-mui') {
                  onCodeFormatChange('react-mui');
                }
              }}
              className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center justify-center ${
                deviceType === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Format Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900 flex items-center">
          <Code2 className="h-4 w-4 mr-2" />
          Code Format
        </label>
        <select
          value={codeFormat}
          onChange={(e) => onCodeFormatChange(e.target.value as any)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {formatOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PromptBox;