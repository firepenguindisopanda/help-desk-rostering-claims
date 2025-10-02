"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, X, AlertTriangle } from "lucide-react";

interface ProfilePictureUploadProps {
  readonly onFileChange: (file: File | null) => void;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly onBlur?: () => void;
}

export function ProfilePictureUpload({ onFileChange, error, disabled, onBlur }: ProfilePictureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    onFileChange(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };
  
  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    onFileChange(null);
    // Clear the input
    const input = document.getElementById('profile-picture-input') as HTMLInputElement;
    if (input) input.value = '';
  };
  
  return (
    <div className="space-y-4">
      <Label>Profile Picture *</Label>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-700">
          {preview ? (
            <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="space-y-2">
            <Input
              id="profile-picture-input"
              name="profile_picture"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              onBlur={onBlur}
              disabled={disabled}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300 dark:hover:file:bg-blue-900/30"
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
                Max 5MB, JPEG/PNG/WebP only
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