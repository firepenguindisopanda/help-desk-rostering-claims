"use client";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = generateReactHelpers<OurFileRouter>();

// Helper function to upload a single file using UploadThing client helpers
async function uploadSingleFile(
  file: File,
  endpoint: keyof OurFileRouter,
  onProgress?: (p: number) => void,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const res = await uploadFiles(endpoint, {
      files: [file],
      onUploadProgress: (evt) => onProgress?.(typeof evt === "number" ? evt : evt.totalProgress ?? 0),
    });

    const url = res?.[0]?.ufsUrl || (res?.[0] as any)?.url;
    if (!url) return { success: false, error: "Upload failed: no URL returned" };
    return { success: true, url };
  } catch (error) {
    console.error("UploadThing error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
  }
}

// Secure file upload function that uploads only when form is submitted
export async function uploadFilesSecurely(
  profilePicture: File | null,
  transcript: File | null,
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean;
  profilePictureUrl?: string;
  transcriptUrl?: string;
  error?: string;
}> {
  try {
    const total = (profilePicture ? 1 : 0) + (transcript ? 1 : 0);
    if (total === 0) return { success: true };

    let completed = 0;
    const bump = () => {
      completed += 1;
      onProgress?.((completed / total) * 100);
    };

    const [profileRes, transcriptRes] = await Promise.all([
      profilePicture
        ? uploadSingleFile(profilePicture, "profilePictureUploader", (p) => onProgress?.(p / 2)).then((r) => {
            bump();
            return r;
          })
        : Promise.resolve(undefined),
      transcript
        ? uploadSingleFile(transcript, "transcriptUploader", (p) => onProgress?.(p / 2)).then((r) => {
            bump();
            return r;
          })
        : Promise.resolve(undefined),
    ]);

    const errors: string[] = [];
    const profilePictureUrl = profileRes?.success ? profileRes.url : undefined;
    const transcriptUrl = transcriptRes?.success ? transcriptRes.url : undefined;

    if (profilePicture && !profileRes?.success) errors.push(profileRes?.error || "Profile picture upload failed");
    if (transcript && !transcriptRes?.success) errors.push(transcriptRes?.error || "Transcript upload failed");

    if (errors.length) return { success: false, error: errors.join(", ") };

    return { success: true, profilePictureUrl, transcriptUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "File upload failed",
    };
  }
}