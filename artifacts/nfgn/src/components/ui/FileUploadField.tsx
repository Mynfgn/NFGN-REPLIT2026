import { useRef, useState } from "react";
import { Upload, X, Loader2, CheckCircle2, Image, FileText, Music } from "lucide-react";
import { useUpload } from "@workspace/object-storage-web";
import { Input } from "@/components/ui/input";

const GREEN = "#2D6A4F";
const GREEN_M = "#c8e6d4";
const GREEN_D = "#1A4032";

type FieldKind = "image" | "document" | "audio" | "any";

interface FileUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  kind?: FieldKind;
  helperText?: string;
  required?: boolean;
}

const KIND_CONFIG: Record<FieldKind, { icon: React.ElementType; accept: string; label: string }> = {
  image:    { icon: Image,    accept: "image/*",                        label: "image" },
  document: { icon: FileText, accept: ".pdf,.epub,.docx,.doc",          label: "PDF/document" },
  audio:    { icon: Music,    accept: "audio/*,.mp3,.m4a,.ogg,.wav",    label: "audio file" },
  any:      { icon: Upload,   accept: "*/*",                            label: "file" },
};

export function FileUploadField({
  label,
  value,
  onChange,
  placeholder = "https://…",
  accept,
  kind = "any",
  helperText,
  required,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (res) => {
      const servingUrl = `/api/storage${res.objectPath}`;
      onChange(servingUrl);
      setUploadDone(true);
      setUploadError(null);
      setTimeout(() => setUploadDone(false), 3000);
    },
    onError: (err) => {
      setUploadError(err.message || "Upload failed");
    },
  });

  const config = KIND_CONFIG[kind];
  const Icon = config.icon;
  const effectiveAccept = accept ?? config.accept;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadDone(false);
    uploadFile(file);
    e.target.value = "";
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setUploadDone(false);
  }

  const isImage = kind === "image";
  const hasValue = value.trim().length > 0;

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>
        {label}{required && " *"}
      </label>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Input
          value={value}
          onChange={handleUrlChange}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          title={`Upload ${config.label} from your computer`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: `1.5px solid ${GREEN}`,
            background: isUploading ? GREEN_M : "#fff",
            color: GREEN_D,
            fontWeight: 700,
            fontSize: 12,
            cursor: isUploading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          {isUploading ? (
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          ) : uploadDone ? (
            <CheckCircle2 size={14} color={GREEN} />
          ) : (
            <Upload size={14} />
          )}
          {isUploading ? `${progress}%` : uploadDone ? "Uploaded!" : "Upload"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={effectiveAccept}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {isUploading && (
        <div style={{ marginTop: 6 }}>
          <div style={{ height: 4, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: GREEN, borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>Uploading to secure storage…</div>
        </div>
      )}

      {uploadError && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11, color: "#8B3A3A" }}>
          <X size={12} />
          {uploadError}
        </div>
      )}

      {helperText && !uploadError && !isUploading && (
        <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{helperText}</div>
      )}

      {isImage && hasValue && !isUploading && (
        <div style={{ marginTop: 8, position: "relative", display: "inline-block" }}>
          <img
            src={value}
            alt="Cover preview"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{ height: 80, width: 60, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb", display: "block" }}
          />
          <div style={{ position: "absolute", bottom: 2, right: 2, background: "rgba(0,0,0,0.55)", borderRadius: 3, padding: "1px 5px", fontSize: 9, color: "#fff" }}>Preview</div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
