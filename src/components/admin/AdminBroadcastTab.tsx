import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const TELEGRAM_BOT_URL = 'https://functions.poehali.dev/0db3f807-568e-4315-90c1-bc467c92575b';

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
  const canSend = !!text.trim() && !tooLong && !sending && subscribers !== 0;

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
          <Label htmlFor="broadcast-photo">Ссылка на картинку (необязательно)</Label>
          <Input
            id="broadcast-photo"
            placeholder="https://..."
            value={photoUrl}
            onChange={(e) => {
              setPhotoUrl(e.target.value);
              setConfirming(false);
            }}
          />
        </div>

        {photoUrl.trim() && (
          <div className="rounded-lg border overflow-hidden bg-muted/30">
            <img
              src={photoUrl}
              alt="Предпросмотр"
              className="w-full max-h-64 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

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