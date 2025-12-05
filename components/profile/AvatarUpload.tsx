"use client";

import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconCamera, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "File must be a JPEG, PNG, GIF, or WebP image";
  }
  if (file.size > MAX_SIZE) {
    return "File must be less than 5MB";
  }
  return null;
}

interface AvatarUploadProps {
  currentUrl: string | null | undefined;
  name: string | undefined;
  onUpload: (file: File) => Promise<void>;
}

export function AvatarUpload({
  currentUrl,
  name,
  onUpload,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Cleanup object URL on unmount or when preview changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const initials = getInitials(name);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      await onUpload(file);
      toast.success("Avatar updated successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload avatar");
      setPreview(null);
    } finally {
      setUploading(false);
      // Clear the input so the same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Change profile photo"
      className="relative h-24 w-24 cursor-pointer rounded-full"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <Avatar className="h-24 w-24">
        <AvatarImage src={preview || currentUrl || undefined} alt={name} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100">
        {uploading ? (
          <IconLoader2 className="h-6 w-6 animate-spin text-white" />
        ) : (
          <IconCamera className="h-6 w-6 text-white" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
