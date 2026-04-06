"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mic, Upload, Cloud, FileAudio, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import useRecordingStore from "@/store/useRecordingStore";

interface SessionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  domain: "healthcare" | "finance";
}

export function SessionActionModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  domain,
}: SessionActionModalProps) {
  const router = useRouter();
  const setSelectedPatientId = useRecordingStore((state) => state.setSelectedPatientId);
  const setSelectedPatientName = useRecordingStore((state) => state.setSelectedPatientName);

  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = useCallback(() => {
    setShowUpload(false);
    setSelectedFile(null);
    setUploading(false);
    setUploadSuccess(false);
    setUploadError(false);
    onClose();
  }, [onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      setSelectedFile(file);
      setUploadError(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError(false);
  };

  const handleRecordNow = () => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    handleClose();
    router.push("/voice");
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(false);

    const formData = new FormData();
    formData.append("audio", selectedFile);
    formData.append("patientId", String(patientId));
    formData.append("domain", domain);

    try {
      // TODO: Replace with actual backend URL
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-recording`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadSuccess(true);
        setTimeout(() => {
          router.push(`/sessions/${data.sessionId}`);
        }, 1500);
      } else {
        setUploadError(true);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0f0e10] border border-[rgba(51,65,85,0.6)] rounded-2xl p-8 max-w-[480px] w-[90%] relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#9d9d9d] hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-white font-bold font-oxanium text-2xl">{patientName}</h2>
          <p className="text-[#6b6b6b] text-xs font-mono mt-1">
            {domain === "healthcare"
              ? "Routine Checkup · Dr. [User]"
              : "Loan Recovery · Account #XXX"}
          </p>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4">
          {!showUpload ? (
            <>
              <p className="text-[#6b6b6b] text-xs font-mono uppercase tracking-wider mb-2">
                Start a New Session
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Record Now Card */}
                <div
                  onClick={handleRecordNow}
                  className="bg-[rgba(59,130,246,0.06)] border border-[rgba(59,130,246,0.2)] rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-[rgba(59,130,246,0.6)] hover:bg-[rgba(59,130,246,0.1)]"
                >
                  <Mic size={32} className="text-blue-500 mb-3" />
                  <h3 className="text-white font-bold font-oxanium text-lg mb-1">Record Now</h3>
                  <p className="text-[#6b6b6b] text-xs font-lexend leading-relaxed">
                    Start a live recording session with real-time transcription and AI extraction
                  </p>
                </div>

                {/* Upload Recording Card */}
                <div
                  onClick={() => setShowUpload(true)}
                  className="bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.2)] rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-[rgba(139,92,246,0.6)] hover:bg-[rgba(139,92,246,0.1)]"
                >
                  <Upload size={32} className="text-purple-500 mb-3" />
                  <h3 className="text-white font-bold font-oxanium text-lg mb-1">Upload Recording</h3>
                  <p className="text-[#6b6b6b] text-xs font-lexend leading-relaxed">
                    Upload an existing audio file for transcription and report generation
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Back button */}
              <button
                onClick={() => setShowUpload(false)}
                className="text-[#6b6b6b] text-xs font-mono hover:text-white transition-colors w-fit"
              >
                ← Back to options
              </button>

              {/* Upload states */}
              {uploadSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <CheckCircle size={48} className="text-green-500" />
                  <h3 className="text-white font-bold font-oxanium text-lg">Processing Complete!</h3>
                  <p className="text-[#6b6b6b] text-sm font-lexend text-center">
                    Redirecting to report...
                  </p>
                </div>
              ) : uploadError ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <AlertCircle size={48} className="text-red-500" />
                  <h3 className="text-white font-bold font-oxanium text-lg">Upload Failed</h3>
                  <p className="text-[#6b6b6b] text-sm font-lexend text-center">
                    Please try again or contact support
                  </p>
                  <button
                    onClick={() => {
                      setUploadError(false);
                      setSelectedFile(null);
                    }}
                    className="mt-2 px-6 py-2 bg-[#2b7fff] text-white rounded-xl font-outfit font-semibold hover:scale-105 transition-transform"
                  >
                    Try Again
                  </button>
                </div>
              ) : uploading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 size={48} className="text-blue-500 animate-spin" />
                  <h3 className="text-white font-bold font-oxanium text-lg">Uploading...</h3>
                  <p className="text-[#6b6b6b] text-sm font-lexend text-center">
                    Processing your recording
                  </p>
                </div>
              ) : selectedFile ? (
                <div className="flex flex-col gap-3">
                  {/* Selected file display */}
                  <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3">
                    <FileAudio size={20} className="text-purple-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-lexend truncate">{selectedFile.name}</p>
                      <p className="text-[#6b6b6b] text-xs font-mono">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-[#6b6b6b] hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={handleFileUpload}
                    className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-outfit font-semibold transition-all duration-200 hover:scale-[1.02]"
                  >
                    Upload & Process
                  </button>
                </div>
              ) : (
                <>
                  {/* Dropzone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.04)] rounded-xl p-8 text-center cursor-pointer"
                  >
                    <input
                      type="file"
                      accept=".mp3,.wav,.m4a,.webm,.ogg"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Cloud size={48} className="text-[#6b6b6b] mx-auto mb-3" />
                      <p className="text-white font-lexend text-sm mb-1">Drop your audio file here</p>
                      <p className="text-[#6b6b6b] text-xs font-mono mb-3">
                        .mp3, .wav, .m4a, .webm up to 100MB
                      </p>
                      <span className="text-[#8B5CF6] text-sm font-lexend hover:underline">
                        Browse files
                      </span>
                    </label>
                  </div>

                  {/* Upload button */}
                  {selectedFile && (
                    <button
                      onClick={handleFileUpload}
                      className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-outfit font-semibold transition-all duration-200 hover:scale-[1.02]"
                    >
                      Upload & Process
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showUpload && (
          <p className="text-[#6b6b6b] text-[11px] font-lexend mt-4 text-center">
            Session will be linked to this {domain === "healthcare" ? "patient's" : "customer's"}{" "}
            {domain === "healthcare" ? "medical" : "account"} history
          </p>
        )}
      </div>
    </div>
  );
}
