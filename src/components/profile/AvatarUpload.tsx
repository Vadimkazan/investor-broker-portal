import { useRef, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface AvatarUploadProps {
  photoUrl?: string | null;
  name: string;
  size?: number;
  onUploaded: (url: string) => void | Promise<void>;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const AvatarUpload = ({ photoUrl, name, size = 96, onUploaded, disabled }: AvatarUploadProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: 'Неподдерживаемый формат файла', description: 'Выберите изображение JPG, PNG, WEBP или GIF', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'Файл слишком большой', description: 'Максимальный размер — 5 МБ', variant: 'destructive' });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      await onUploaded(url);
      toast({ title: 'Фото обновлено' });
    } catch {
      toast({ title: 'Не удалось загрузить фото', variant: 'destructive' });
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const displayUrl = preview || photoUrl || undefined;

  return (
    <div className="relative inline-block group" style={{ width: size, height: size }}>
      <Avatar style={{ width: size, height: size }}>
        <AvatarImage src={displayUrl} alt={name} className="object-cover" />
        <AvatarFallback style={{ fontSize: size / 2.8 }}>{getInitials(name)}</AvatarFallback>
      </Avatar>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />

      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md border"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <Icon name="Loader2" size={14} className="animate-spin" />
        ) : (
          <Icon name="Camera" size={14} />
        )}
      </Button>
    </div>
  );
};

export default AvatarUpload;
