import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'На проверке', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Подтверждён', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Отклонён', className: 'bg-red-100 text-red-800' },
};

const BrokerCertificateCard = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState(user?.cert_course || '');
  const [date, setDate] = useState(user?.cert_date || '');
  const [number, setNumber] = useState(user?.cert_number || '');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const status = user.broker_status || 'pending';
  const info = STATUS[status] || STATUS.pending;
  const approved = status === 'approved';

  const handleSubmit = async () => {
    if (!course.trim() || !date || !number.trim() || !file) {
      toast({ title: 'Заполните все поля и приложите скан', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const uploaded = await api.uploadFile(file);
      await api.updateUser(user.id, {
        cert_course: course.trim(),
        cert_date: date,
        cert_number: number.trim(),
        cert_file_url: uploaded.url,
      });
      await refreshUser();
      setFile(null);
      toast({ title: 'Сертификат отправлен на проверку' });
    } catch {
      toast({ title: 'Не удалось отправить сертификат', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Icon name="BadgeCheck" size={20} />
            Подтверждение брокера
          </span>
          <Badge className={info.className}>{info.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {approved ? (
          <p className="text-sm text-muted-foreground">Сертификат подтверждён, вы можете публиковать объекты.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Публиковать объекты можно после подтверждения сертификата об окончании курса брокера по доходной недвижимости.
            </p>
            {status === 'rejected' && user.cert_review_comment && (
              <p className="text-sm text-red-600">Причина отказа: {user.cert_review_comment}</p>
            )}
            {status === 'pending' && user.cert_file_url && (
              <p className="text-sm text-muted-foreground">Сертификат отправлен, ожидает проверки.</p>
            )}
            <div className="space-y-2">
              <Label>Курс</Label>
              <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Например, Академия Виктора Лапина" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата выдачи</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Номер сертификата</Label>
                <Input value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Скан сертификата</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Отправка...' : user.cert_file_url ? 'Отправить заново' : 'Отправить на проверку'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BrokerCertificateCard;
