import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { api, Favorite, Inquiry, ObjectView } from '@/services/api';
import { Link } from 'react-router-dom';

interface UserActivityHistoryProps {
  userId: number;
}

type ActivityEvent = {
  id: string;
  type: 'view' | 'favorite' | 'inquiry';
  objectId: number;
  objectTitle: string;
  objectCity?: string;
  createdAt: string;
  inquiryStatus?: Inquiry['status'];
};

const INQUIRY_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: 'Новая', variant: 'default' },
  contacted: { label: 'В работе', variant: 'secondary' },
  closed: { label: 'Закрыта', variant: 'outline' },
};

const EVENT_ICON: Record<ActivityEvent['type'], { name: string; color: string }> = {
  view: { name: 'Eye', color: 'text-muted-foreground' },
  favorite: { name: 'Heart', color: 'text-red-500' },
  inquiry: { name: 'Send', color: 'text-primary' },
};

const EVENT_LABEL: Record<ActivityEvent['type'], string> = {
  view: 'Просмотрел объект',
  favorite: 'Добавил в избранное',
  inquiry: 'Оставил заявку',
};

const UserActivityHistory = ({ userId }: UserActivityHistoryProps) => {
  const [views, setViews] = useState<ObjectView[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.getObjectViews(userId).catch(() => []),
      api.getFavorites(userId).catch(() => []),
      api.getInquiriesByUser(userId).catch(() => []),
    ]).then(([v, f, i]) => {
      if (cancelled) return;
      setViews(v);
      setFavorites(f);
      setInquiries(i);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Icon name="Loader2" size={28} className="mx-auto animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Загрузка истории...</p>
        </CardContent>
      </Card>
    );
  }

  const events: ActivityEvent[] = [
    ...views.map((v): ActivityEvent => ({
      id: `view-${v.id}`,
      type: 'view',
      objectId: v.objectId,
      objectTitle: v.objectTitle || `Объект #${v.objectId}`,
      objectCity: v.objectCity,
      createdAt: v.createdAt || '',
    })),
    ...favorites.map((f): ActivityEvent => ({
      id: `favorite-${f.id}`,
      type: 'favorite',
      objectId: f.object_id,
      objectTitle: f.object?.title || `Объект #${f.object_id}`,
      objectCity: f.object?.city,
      createdAt: f.created_at || '',
    })),
    ...inquiries.map((i): ActivityEvent => ({
      id: `inquiry-${i.id}`,
      type: 'inquiry',
      objectId: i.objectId,
      objectTitle: i.objectTitle || `Объект #${i.objectId}`,
      objectCity: i.objectCity,
      createdAt: i.createdAt || '',
      inquiryStatus: i.status,
    })),
  ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{views.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Просмотров</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{favorites.length}</p>
            <p className="text-xs text-muted-foreground mt-1">В избранном</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{inquiries.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Заявок</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">История действий</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Пока нет активности на платформе
            </p>
          ) : (
            <div className="space-y-1">
              {events.map((event) => {
                const icon = EVENT_ICON[event.type];
                return (
                  <div key={event.id} className="flex items-start gap-3 py-2.5 border-b last:border-0">
                    <div className={`mt-0.5 ${icon.color}`}>
                      <Icon name={icon.name} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm">
                          <span className="text-muted-foreground">{EVENT_LABEL[event.type]}:</span>{' '}
                          <Link to={`/objects/${event.objectId}`} className="font-medium hover:underline">
                            {event.objectTitle}
                          </Link>
                        </p>
                        {event.type === 'inquiry' && event.inquiryStatus && (
                          <Badge variant={INQUIRY_STATUS_LABELS[event.inquiryStatus]?.variant || 'outline'} className="text-[10px] px-1.5 py-0">
                            {INQUIRY_STATUS_LABELS[event.inquiryStatus]?.label || event.inquiryStatus}
                          </Badge>
                        )}
                      </div>
                      {event.objectCity && (
                        <p className="text-xs text-muted-foreground">{event.objectCity}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {event.createdAt ? new Date(event.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivityHistory;
