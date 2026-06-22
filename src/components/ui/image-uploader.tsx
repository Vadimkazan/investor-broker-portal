import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/services/api';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageUploader = ({ images, onChange, maxImages = 10 }: ImageUploaderProps) => {
  const [uploading, setUploading] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = maxImages - images.length;
    const toUpload = files.slice(0, remaining);

    for (let i = 0; i < toUpload.length; i++) {
      setUploading(i);
      try {
        const result = await api.uploadFile(toUpload[i]);
        onChange([...images, result.url]);
      } catch {
        // silent
      }
    }
    setUploading(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-video rounded-md overflow-hidden border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Icon name="Trash2" size={18} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={uploading !== null}
            onClick={() => inputRef.current?.click()}
          >
            {uploading !== null ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Icon name="Upload" size={16} className="mr-2" />
                Загрузить фото
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default ImageUploader;
