"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface TranscriptUploadProps {
  readonly onFileSelect: (file: File | null) => void;
  readonly error?: string;
}

export function TranscriptUpload({ onFileSelect, error }: TranscriptUploadProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
    setSelectedFile(file?.name || null);
  };
  
  return (
    <div className="space-y-2">
      <Label>Transcript (PDF/DOC/DOCX) *</Label>
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-gray-500" />
        <div className="flex-1">
          <Input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/20 dark:file:text-green-300 dark:hover:file:bg-green-900/30"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">Max 5MB, PDF/DOC/DOCX only</p>
      {selectedFile && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selected: {selectedFile}
        </p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}