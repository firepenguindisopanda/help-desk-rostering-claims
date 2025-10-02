import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Profile picture uploader
  profilePictureUploader: f({
    image: {
      maxFileSize: "4MB", // Within your 2GB limit, reasonable for profile pictures
      maxFileCount: 1,
    },
  })
    .middleware(async ({ files }) => {
      // Basic validation - in production you might want to add authentication
      const file = files[0];
      
      if (!file) {
        throw new UploadThingError("No file provided");
      }
      
      // Additional size check (uploadthing has its own limits but being explicit)
      if (file.size > 4 * 1024 * 1024) {
        throw new UploadThingError("File too large. Please keep profile pictures under 4MB.");
      }
      
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile picture upload complete for:", metadata.uploadedBy);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.uploadedBy };
    }),

  // Transcript uploader
  transcriptUploader: f({
    "application/pdf": {
      maxFileSize: "8MB", // PDFs can be larger
      maxFileCount: 1,
    },
    "application/msword": {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB", // DOCX files
      maxFileCount: 1,
    },
  })
    .middleware(async ({ files }) => {
      const file = files[0];
      
      if (!file) {
        throw new UploadThingError("No transcript file provided");
      }
      
      // Check file size
      if (file.size > 8 * 1024 * 1024) {
        throw new UploadThingError("Transcript file too large. Please keep transcripts under 8MB.");
      }
      
      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new UploadThingError("Invalid file type. Please upload PDF, DOC, or DOCX files only.");
      }
      
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Transcript upload complete for:", metadata.uploadedBy);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.uploadedBy };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;