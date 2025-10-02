"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, X, AlertTriangle } from "lucide-react";

interface TranscriptUploadProps {
  readonly onFileChange: (file: File | null) => void;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly onBlur?: () => void;
}

export function TranscriptUpload({ onFileChange, error, disabled, onBlur }: TranscriptUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    onFileChange(file);
  };
  
  const handleRemove = () => {
    setSelectedFile(null);
    onFileChange(null);
    // Clear the input
    const input = document.getElementById('transcript-input') as HTMLInputElement;
    if (input) input.value = '';
  };
  
  return (
    <div className="space-y-2">
      <Label>Transcript (PDF/DOC/DOCX) *</Label>
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-gray-500 mt-1" />
        <div className="flex-1 space-y-2">
          <div className="space-y-2">
            <Input
              id="transcript-input"
              name="transcript"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              onBlur={onBlur}
              disabled={disabled}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/20 dark:file:text-green-300 dark:hover:file:bg-green-900/30"
            />
            {selectedFile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedFile.name}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="h-6 px-2 text-xs"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Max 8MB, PDF/DOC/DOCX only
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                File will be uploaded securely when you submit the form.
              </p>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}