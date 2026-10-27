/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  aspectRatio?: "banner" | "square" | "any";
  placeholderText?: string;
}

export function ImageUpload({
  label,
  description,
  value,
  onChange,
  disabled = false,
  aspectRatio = "any",
  placeholderText,
}: ImageUploadProps) {
  const [mode, setMode] = React.useState<"upload" | "url">("upload");
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync urlInput with value prop during render without useEffect cascading renders
  const [urlInput, setUrlInput] = React.useState(value || "");
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setUrlInput(value || "");
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Clean up object URLs when preview changes or unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file exceeds the 5MB limit. Please choose a smaller file.");
      return;
    }

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (.jpg, .png, .webp, .svg).");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image.");
      }

      onChange(data.url);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to upload image. Please try again.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveExistingImage = () => {
    onChange("");
    setUrlInput("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleApplyUrl = () => {
    setError(null);
    if (!urlInput.trim()) {
      onChange("");
      return;
    }

    try {
      if (!urlInput.startsWith("/") && !urlInput.startsWith("data:")) {
        new URL(urlInput.trim());
      }
      onChange(urlInput.trim());
    } catch {
      setError("Please enter a valid image URL (e.g. https://... or /uploads/...).");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <span>{label}</span>
        </label>

        {/* Mode Toggle Button */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setMode("upload");
              setError(null);
            }}
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === "upload"
                ? "bg-violet-600/30 text-violet-300 font-semibold border border-violet-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Upload File
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={() => {
              setMode("url");
              setError(null);
            }}
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === "url"
                ? "bg-violet-600/30 text-violet-300 font-semibold border border-violet-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 leading-normal">{description}</p>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2.5 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CASE 1: Existing Confirmed Image is Available */}
      {value && !previewUrl ? (
        <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/60 p-3 overflow-hidden group">
          <div className="flex items-center gap-3">
            <div
              className={`relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shrink-0 flex items-center justify-center ${
                aspectRatio === "banner"
                  ? "w-28 h-16 sm:w-36 sm:h-20"
                  : aspectRatio === "square"
                  ? "w-16 h-16 sm:w-20 sm:h-20"
                  : "w-20 h-16"
              }`}
            >
              {/* Image Preview */}
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%236366f1' viewBox='0 0 24 24'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23a5b4fc' font-size='12'>No Preview</text></svg>";
                }}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Active Image Selected</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-sm">
                {value}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="h-7 px-2.5 text-[11px] gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Replace</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={handleRemoveExistingImage}
                  className="h-7 px-2.5 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/30 gap-1"
                >
                  <X className="h-3 w-3" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* CASE 2: A File Has Been Picked but Not Yet Confirmed/Uploaded */}
      {selectedFile && previewUrl ? (
        <div className="rounded-2xl border border-violet-500/40 bg-violet-950/20 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`relative overflow-hidden rounded-xl border border-violet-500/30 bg-slate-950 shrink-0 flex items-center justify-center ${
                aspectRatio === "banner"
                  ? "w-28 h-16 sm:w-36 sm:h-20"
                  : aspectRatio === "square"
                  ? "w-16 h-16 sm:w-20 sm:h-20"
                  : "w-20 h-16"
              }`}
            >
              <img
                src={previewUrl}
                alt="Selected preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-xs font-semibold text-white truncate block">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatFileSize(selectedFile.size)} • Ready to upload
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="primaryGlow"
              size="sm"
              disabled={uploading || disabled}
              onClick={handleConfirmUpload}
              className="h-8 px-3 text-xs gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Confirm & Upload</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || disabled}
              onClick={handleCancelSelection}
              className="h-8 px-3 text-xs gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
          </div>
        </div>
      ) : null}

      {/* CASE 3: No Image is Set and No File is Currently in Preview */}
      {!value && !previewUrl ? (
        mode === "upload" ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (!disabled && fileInputRef.current) fileInputRef.current.click();
            }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              dragActive
                ? "border-violet-400 bg-violet-950/30 scale-[1.01]"
                : "border-slate-800 bg-[#0a0f21] hover:border-slate-700 hover:bg-[#0c1226]"
            } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              disabled={disabled}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-200">
                Click to browse or drag and drop an image
              </p>
              <p className="text-[11px] text-slate-500">
                Supports PNG, JPG, WEBP, or SVG up to 5MB
              </p>
            </div>
          </div>
        ) : (
          /* Manual URL Input Mode */
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={placeholderText || "https://example.com/image.jpg or /uploads/..."}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={disabled}
                className="pr-8"
              />
              <LinkIcon className="h-4 w-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyUrl}
              disabled={disabled || !urlInput.trim()}
              className="text-xs"
            >
              Apply URL
            </Button>
          </div>
        )
      ) : null}

      {/* Hidden input to ensure native form submission or integration if needed */}
      <input
        type="hidden"
        name={label.toLowerCase().includes("banner") ? "bannerUrl" : "logoUrl"}
        value={value}
      />
    </div>
  );
}
