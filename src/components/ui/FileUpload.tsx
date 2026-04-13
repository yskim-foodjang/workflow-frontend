import { useState, useRef, type ChangeEvent } from 'react';
import imageCompression from 'browser-image-compression';
import clsx from 'clsx';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_IMAGE_SIZE_MB = 1;
const MAX_FILE_SIZE_MB = 5;
const MAX_IMAGE_WIDTH = 1920;
const IMAGE_QUALITY = 0.8;

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMessage?: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  onUpload?: (file: File) => Promise<void>;
  maxFiles?: number;
  className?: string;
}

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function processImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: MAX_IMAGE_WIDTH,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: IMAGE_QUALITY,
  });

  if (compressed.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`이미지 크기가 ${MAX_IMAGE_SIZE_MB}MB를 초과합니다. 더 작은 이미지를 사용하세요.`);
  }

  // Rename to .webp
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  return new File([compressed], `${nameWithoutExt}.webp`, { type: 'image/webp' });
}

export default function FileUpload({ files, onChange, onUpload, maxFiles = 10, className }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = async (selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (const rawFile of Array.from(selectedFiles)) {
      if (files.length + newFiles.length >= maxFiles) break;

      try {
        if (isImageFile(rawFile.name)) {
          const processed = await processImage(rawFile);
          newFiles.push({ file: processed, name: processed.name, size: processed.size, progress: 0, status: 'pending' });
        } else {
          if (rawFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            newFiles.push({ file: rawFile, name: rawFile.name, size: rawFile.size, progress: 0, status: 'error', errorMessage: `파일 크기가 ${MAX_FILE_SIZE_MB}MB를 초과합니다.` });
            continue;
          }
          newFiles.push({ file: rawFile, name: rawFile.name, size: rawFile.size, progress: 0, status: 'pending' });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '파일 처리에 실패했습니다.';
        newFiles.push({ file: rawFile, name: rawFile.name, size: rawFile.size, progress: 0, status: 'error', errorMessage: message });
      }
    }

    const updated = [...files, ...newFiles];
    onChange(updated);

    // Auto-upload pending files
    if (onUpload) {
      for (const f of newFiles) {
        if (f.status === 'pending') {
          try {
            const idx = updated.indexOf(f);
            updated[idx] = { ...f, status: 'uploading', progress: 50 };
            onChange([...updated]);
            await onUpload(f.file);
            updated[idx] = { ...f, status: 'done', progress: 100 };
            onChange([...updated]);
          } catch {
            const idx = updated.indexOf(f);
            updated[idx] = { ...f, status: 'error', errorMessage: '업로드에 실패했습니다.' };
            onChange([...updated]);
          }
        }
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
        )}
        onClick={() => inputRef.current?.click()}
      >
        <svg className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          파일을 드래그하거나 <span className="text-primary-600 dark:text-primary-400 font-medium">클릭하여 선택</span>
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          이미지: 자동 WebP 변환 (최대 {MAX_IMAGE_SIZE_MB}MB) / 기타: 최대 {MAX_FILE_SIZE_MB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 dark:text-white truncate">{f.name}</span>
                  <span className="text-xs text-slate-400">{formatSize(f.size)}</span>
                </div>
                {f.status === 'uploading' && (
                  <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
                {f.status === 'error' && (
                  <p className="text-xs text-rose-500 mt-0.5">{f.errorMessage}</p>
                )}
              </div>
              {f.status === 'done' && (
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-rose-500 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { UploadedFile };
