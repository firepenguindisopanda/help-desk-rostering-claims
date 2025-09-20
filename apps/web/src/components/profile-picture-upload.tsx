"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface ProfilePictureUploadProps {
  readonly onFileSelect: (file: File | null) => void;
  readonly error?: string;
}

export function ProfilePictureUpload({ onFileSelect, error }: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };
  
  return (
    <div className="space-y-4">
      <Label>Profile Picture *</Label>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-700">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300 dark:hover:file:bg-blue-900/30"
          />
          <p className="text-xs text-gray-500 mt-1">Max 5MB, JPEG/PNG/WebP only</p>
          {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}