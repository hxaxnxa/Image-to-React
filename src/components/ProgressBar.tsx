import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface Step {
  label: string;
  completed: boolean;
  icon: typeof LucideIcon;
}

interface ProgressBarProps {
  steps: Step[];
  globalProgress: number;
  isGeneratingAll: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  steps,
  globalProgress,
  isGeneratingAll
}) => {
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Progress: {Math.round(progressPercentage)}%</span>
          <span>{completedSteps}/{steps.length} steps completed</span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Global Generation Progress */}
        {isGeneratingAll && globalProgress > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-blue-600 mb-1">
              <span>Generating all codes...</span>
              <span>{Math.round(globalProgress)}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                step.completed
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  step.completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-xs opacity-75">
                  {step.completed ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;