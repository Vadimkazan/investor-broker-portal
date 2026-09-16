import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const TELEGRAM_BOT_URL = 'https://functions.poehali.dev/0db3f807-568e-4315-90c1-bc467c92575b';

export interface BroadcastRecord {
  id: number;
  text: string;
  photo_url: string | null;
  audience: 'all' | 'investor' | 'broker' | string;
  sent_total: number;
  sent_investors: number;
  sent_brokers: number;
  failed_count: number;
  created_at: string | null;
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Всем',
  investor: 'Инвесторам',
  broker: 'Брокерам',
};

const formatDate = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface BroadcastHistoryProps {
  refreshKey?: number;
}

const BroadcastHistory = ({ refreshKey = 0 }: BroadcastHistoryProps) => {
  const [items, setItems] = useState<BroadcastRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, [refreshKey]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${TELEGRAM_BOT_URL}?action=broadcast-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icon name="History" size={20} />
            История рассылок
          </CardTitle>
          <CardDescription>Все отправленные сообщения в Telegram</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadHistory} disabled={loading}>
          <Icon
            name="RefreshCw"
            size={14}
            className={loading ? 'animate-spin' : ''}
          />
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Рассылок пока не было</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isOpen = expanded === item.id;
              return (
                <div key={item.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {AUDIENCE_LABELS[item.audience] || item.audience}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                        <Icon name="Users" size={12} />
                        Всего: {item.sent_total}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                        <Icon name="TrendingUp" size={12} />
                        Инвесторы: {item.sent_investors}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                        <Icon name="Briefcase" size={12} />
                        Брокеры: {item.sent_brokers}
                      </span>
                      {item.failed_count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 text-destructive px-2 py-1">
                          <Icon name="TriangleAlert" size={12} />
                          Не дошло: {item.failed_count}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {item.photo_url && (
                      <img
                        src={item.photo_url}
                        alt=""
                        className="w-20 h-20 rounded-md object-cover border shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <p
                      className={`text-sm whitespace-pre-wrap break-words ${
                        isOpen ? '' : 'line-clamp-3'
                      }`}
                    >
                      {item.text}
                    </p>
                  </div>

                  {item.text.length > 160 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : item.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {isOpen ? 'Свернуть' : 'Показать полностью'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BroadcastHistory;
