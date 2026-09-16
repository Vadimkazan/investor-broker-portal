import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

const TELEGRAM_BOT_URL = 'https://functions.poehali.dev/0db3f807-568e-4315-90c1-bc467c92575b';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

type Audience = 'all' | 'investor' | 'broker';

const AUDIENCES: { value: Audience; label: string; icon: string }[] = [
  { value: 'all', label: 'Всем', icon: 'Users' },
  { value: 'investor', label: 'Инвесторам', icon: 'TrendingUp' },
  { value: 'broker', label: 'Брокерам', icon: 'Briefcase' },
];

const AdminBroadcastTab = () => {
  const [text, setText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [counts, setCounts] = useState<Record<Audience, number> | null>(null);
  const { toast } = useToast();

  const subscribers = counts ? counts[audience] : null;

  const maxLength = photoUrl.trim() ? 1024 : 4096;

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const res = await fetch(`${TELEGRAM_BOT_URL}?action=subscribers-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setCounts({
        all: data.all ?? 0,
        investor: data.investor ?? 0,
        broker: data.broker ?? 0,
      });
    } catch {
      setCounts(null);
    }
  };

  const handleFile = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: 'Неподдерживаемый формат',
        description: 'Выберите картинку JPG, PNG, WEBP или GIF',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: 'Файл слишком большой',
        description: 'Максимальный размер картинки — 5 МБ',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setConfirming(false);
    try {
      const { url } = await api.uploadFile(file);
      setPhotoUrl(url);
      toast({ title: 'Картинка загружена' });
    } catch {
      toast({ title: 'Не удалось загрузить картинку', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`${TELEGRAM_BOT_URL}?action=broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), photo_url: photoUrl.trim(), audience }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Не удалось отправить');
      }

      toast({
        title: 'Рассылка отправлена',
        description: data.failed
          ? `Доставлено: ${data.sent}, не доставлено: ${data.failed}`
          : `Сообщение получили ${data.sent} чел.`,
      });

      setText('');
      setPhotoUrl('');
      setConfirming(false);
    } catch (error) {
      toast({
        title: 'Ошибка рассылки',
        description: error instanceof Error ? error.message : 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const tooLong = text.length > maxLength;
  const audienceLabel = AUDIENCES.find((a) => a.value === audience)?.label || 'Всем';
  const canSend = !!text.trim() && !tooLong && !sending && !uploading && subscribers !== 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Megaphone" size={20} />
          Рассылка в Telegram
        </CardTitle>
        <CardDescription>
          {subscribers === null
            ? 'Сообщение получат подписчики с подключённым Telegram'
            : `Получат ${subscribers} чел. — ${audienceLabel.toLowerCase()} с подключённым Telegram`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Кому отправить</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {AUDIENCES.map((a) => {
              const active = audience === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => {
                    setAudience(a.value);
                    setConfirming(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Icon
                    name={a.icon}
                    size={18}
                    className={active ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>
                      {a.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {counts ? `${counts[a.value]} чел.` : '—'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="broadcast-text">Текст сообщения</Label>
          <Textarea
            id="broadcast-text"
            placeholder="Например: Открыт новый объект в Казани — доходность 22% годовых."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setConfirming(false);
            }}
            rows={7}
            className={tooLong ? 'border-destructive' : ''}
          />
          <p className={`text-xs ${tooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
            {text.length} из {maxLength} символов
          </p>
        </div>

        <div className="space-y-2">
          <Label>Картинка (необязательно)</Label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleFile(file);
            }}
          />

          {photoUrl.trim() ? (
            <div className="rounded-lg border overflow-hidden bg-muted/30">
              <img
                src={photoUrl}
                alt="Предпросмотр"
                className="w-full max-h-64 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex gap-2 p-2 border-t bg-background">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Icon name="RefreshCw" size={14} className="mr-2" />
                  Заменить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPhotoUrl('');
                    setConfirming(false);
                  }}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Icon name="Trash2" size={14} className="mr-2" />
                  Удалить
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
              } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
            >
              <Icon
                name={uploading ? 'Loader2' : 'ImagePlus'}
                size={28}
                className={`text-muted-foreground ${uploading ? 'animate-spin' : ''}`}
              />
              <p className="text-sm font-medium">
                {uploading ? 'Загружаем картинку...' : 'Перетащите картинку сюда'}
              </p>
              {!uploading && (
                <p className="text-xs text-muted-foreground">
                  или нажмите, чтобы выбрать файл — JPG, PNG, WEBP, GIF до 5 МБ
                </p>
              )}
            </div>
          )}
        </div>

        {confirming ? (
          <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <Icon name="TriangleAlert" size={20} className="text-amber-500 mt-0.5" />
              <p className="text-sm">
                Отправить сообщение{' '}
                <span className="font-medium">
                  {audienceLabel.toLowerCase()}
                  {subscribers !== null ? ` — ${subscribers} чел.` : ''}
                </span>
                ? Отменить рассылку после отправки нельзя.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSend} disabled={sending} className="flex-1">
                <Icon
                  name={sending ? 'Loader2' : 'Check'}
                  size={16}
                  className={`mr-2 ${sending ? 'animate-spin' : ''}`}
                />
                {sending ? 'Отправляем...' : 'Да, отправить'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={sending}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {subscribers === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                В этой группе пока никто не подключил Telegram
              </p>
            )}
            <Button onClick={() => setConfirming(true)} disabled={!canSend} className="w-full">
              <Icon name="Send" size={16} className="mr-2" />
              Отправить рассылку
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBroadcastTab;