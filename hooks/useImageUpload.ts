"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface UseImageUploadOptions {
  onSuccess?: (storageId: Id<"_storage">, url: string) => void;
  onError?: (error: Error) => void;
}

interface UseImageUploadReturn {
  upload: (
    file: File
  ) => Promise<{ storageId: Id<"_storage">; url: string } | null>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.media.mutations.generateUploadUrl);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setProgress(0);

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        const err = new Error(
          `Invalid file type. Allowed types: ${ALLOWED_TYPES.map((t) =>
            t.replace("image/", "")
          ).join(", ")}`
        );
        setError(err.message);
        options.onError?.(err);
        return null;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const err = new Error(
          `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        );
        setError(err.message);
        options.onError?.(err);
        return null;
      }

      setIsUploading(true);

      try {
        // Get upload URL from Convex
        setProgress(10);
        const uploadUrl = await generateUploadUrl();

        // Upload file to Convex storage
        setProgress(30);
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error("Failed to upload file");
        }

        setProgress(80);
        const { storageId } = await result.json();
        const uploadedStorageId = storageId as Id<"_storage">;

        // Get the actual serving URL from Convex
        // We need to make another request to get the URL
        // Note: The URL is constructed from the upload response
        // Format: https://[deployment].convex.cloud/api/storage/[storageId]
        setProgress(100);

        // For now, we return the storageId and a temporary URL
        // The component should use getMediaUrl query to get the actual URL
        // or we can construct it from the upload URL
        const baseUrl = uploadUrl.split("/api/storage/generate")[0];
        const url = `${baseUrl}/api/storage/${uploadedStorageId}`;

        options.onSuccess?.(uploadedStorageId, url);
        return { storageId: uploadedStorageId, url };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error.message);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl, options]
  );

  return {
    upload,
    isUploading,
    progress,
    error,
  };
}

/**
 * Hook to get the URL for a storage ID.
 * Use this when you need to display an uploaded image.
 */
export function useStorageUrl(storageId: Id<"_storage"> | null) {
  return useQuery(
    api.media.queries.getMediaUrl,
    storageId ? { storageId } : "skip"
  );
}

/**
 * Validate an image file before upload.
 *
 * @param file - The file to validate
 * @returns An error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed types: ${ALLOWED_TYPES.map((t) =>
      t.replace("image/", "")
    ).join(", ")}`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  return null;
}
