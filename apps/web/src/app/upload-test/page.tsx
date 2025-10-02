"use client";

import { UploadButton } from "@/lib/uploadthing-components";

export default function UploadTestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">UploadThing Test Page</h1>
        <p className="text-gray-600 mb-8">Test your UploadThing integration</p>
      </div>
      
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Profile Picture Upload</h2>
          <UploadButton
            endpoint="profilePictureUploader"
            onClientUploadComplete={(res) => {
              console.log("Files: ", res);
              alert("Profile picture uploaded successfully!");
            }}
            onUploadError={(error: Error) => {
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Transcript Upload</h2>
          <UploadButton
            endpoint="transcriptUploader"
            onClientUploadComplete={(res) => {
              console.log("Files: ", res);
              alert("Transcript uploaded successfully!");
            }}
            onUploadError={(error: Error) => {
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-500 max-w-md">
        <p>This is a test page to verify UploadThing integration. Navigate to <code>/upload-test</code> to access this page.</p>
      </div>
    </main>
  );
}