'use client';

import { useState } from 'react';
import Button from './Button';
import { useAICodeAssistance, type AIHint } from '@/lib/hooks/useSubmissions';

interface AIAssistanceProps {
  submissionId: number;
  pythonFiles: string[]; // List of available Python files
}

export default function AIAssistance({ submissionId, pythonFiles }: AIAssistanceProps) {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [hints, setHints] = useState<AIHint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const aiAssistanceMutation = useAICodeAssistance();

  const handleGetAssistance = async () => {
    if (!selectedFile) {
      setError('Please select a Python file');
      return;
    }

    setError(null);
    setHints([]);

    try {
      const result = await aiAssistanceMutation.mutateAsync({
        submissionId,
        pythonFile: selectedFile,
      });

      setHints(result.assistance.hints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI assistance');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-black mb-2">AI Code Assistance</h3>
        <p className="text-sm text-gray-600">
          Get AI-powered hints and suggestions for your Python code (max 10KB file size)
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="python-file-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Python file
          </label>
          <select
            id="python-file-select"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={aiAssistanceMutation.isPending}
          >
            <option value="">Choose a file...</option>
            {pythonFiles.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          onClick={handleGetAssistance}
          disabled={!selectedFile || aiAssistanceMutation.isPending}
        >
          {aiAssistanceMutation.isPending ? 'Analyzing...' : 'Get AI Hints'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {hints.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4 className="font-semibold text-black">AI Suggestions ({hints.length})</h4>
          <div className="space-y-2">
            {hints.map((hint, index) => (
              <div
                key={index}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm"
              >
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-semibold flex-shrink-0">
                    {hint.line}
                  </span>
                  <div className="flex-1">
                    <p className="text-blue-900">{hint.message}</p>
                    <p className="text-xs text-blue-700 mt-1">Line {hint.line}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hints.length === 0 && !error && aiAssistanceMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          No issues found! Your code looks good.
        </div>
      )}
    </div>
  );
}
