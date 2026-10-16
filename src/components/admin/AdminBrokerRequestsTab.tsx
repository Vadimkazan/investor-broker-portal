import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api, User } from '@/services/api';

interface Props {
  users: User[];
  onChanged: () => void;
}

const AdminBrokerRequestsTab = ({ users, onChanged }: Props) => {
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const requests = users.filter((u) => u.broker_status === 'pending' && u.cert_file_url);

  const review = async (id: number, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !comment.trim()) {
      toast({ title: 'Укажите причину отказа', variant: 'destructive' });
      return;
    }
    setBusyId(id);
    try {
      await api.updateUser(id, {
        broker_status: status,
        cert_review_comment: status === 'rejected' ? comment.trim() : null,
      });
      toast({ title: status === 'approved' ? 'Брокер подтверждён' : 'Заявка отклонена' });
      setRejectingId(null);
      setComment('');
      onChanged();
    } catch {
      toast({ title: 'Не удалось сохранить решение', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Новых заявок на проверку нет</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((u) => (
        <Card key={u.id}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">На проверке</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-muted-foreground">Курс</p><p className="font-medium">{u.cert_course}</p></div>
              <div><p className="text-muted-foreground">Дата выдачи</p><p className="font-medium">{u.cert_date ? new Date(u.cert_date).toLocaleDateString('ru-RU') : '—'}</p></div>
              <div><p className="text-muted-foreground">Номер</p><p className="font-medium">{u.cert_number}</p></div>
            </div>
            <a href={u.cert_file_url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline">
              <Icon name="FileText" size={16} />
              Открыть скан сертификата
            </a>
            {rejectingId === u.id ? (
              <div className="space-y-2">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Причина отказа" />
                <div className="flex gap-2">
                  <Button variant="destructive" disabled={busyId === u.id} onClick={() => review(u.id, 'rejected')}>Отклонить</Button>
                  <Button variant="outline" onClick={() => { setRejectingId(null); setComment(''); }}>Отмена</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button disabled={busyId === u.id} onClick={() => review(u.id, 'approved')}>
                  <Icon name="Check" size={16} className="mr-2" />Подтвердить
                </Button>
                <Button variant="outline" onClick={() => { setRejectingId(u.id); setComment(''); }}>
                  <Icon name="X" size={16} className="mr-2" />Отклонить с комментарием
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminBrokerRequestsTab;
