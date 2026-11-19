import { useRef, useState } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { fileUploadService } from '@/services/residentManagementService';

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
}

export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/api\/v1\/?$/, '');
  const previewUrl = value ? (value.startsWith('http') ? value : `${origin}${value}`) : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await fileUploadService.uploadPhoto(file);
      onChange(result.data.url);
    } catch {
      setError('Upload failed. Please try a JPEG/PNG/WEBP under 10MB.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ocean-200 dark:border-ocean-700 bg-ocean-50 dark:bg-ocean-800/40 text-ocean-400 dark:text-ocean-500">
        {uploading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : previewUrl ? (
          <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <User size={24} />
        )}
      </div>
      <div>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Camera size={14} /> {previewUrl ? 'Change Photo' : 'Upload Photo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
