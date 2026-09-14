import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { api, User } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const MyBrokerCard = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [brokers, setBrokers] = useState<User[]>([]);
  const [myBroker, setMyBroker] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    api.getBrokers().then(setBrokers).catch(() => {});
  }, []);

  useEffect(() => {
    const loadBroker = async () => {
      setLoading(true);
      if (user?.broker_id) {
        try {
          const b = await api.getUserById(user.broker_id);
          setMyBroker(b);
        } catch {
          setMyBroker(null);
        }
      } else {
        setMyBroker(null);
      }
      setLoading(false);
    };
    loadBroker();
  }, [user?.broker_id]);

  const handleAssign = async () => {
    if (!user || !selectedId) return;
    setSaving(true);
    try {
      await api.updateUser(user.id, { broker_id: Number(selectedId) });
      await refreshUser();
      setSelecting(false);
      toast({ title: 'Брокер назначен' });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.updateUser(user.id, { broker_id: null });
      await refreshUser();
      toast({ title: 'Брокер отвязан' });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="UserCheck" size={20} />
          Мой брокер
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : myBroker ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {myBroker.photo_url ? (
                  <img src={myBroker.photo_url} alt={myBroker.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="User" size={28} className="text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{myBroker.name}</p>
                {myBroker.city && <p className="text-sm text-muted-foreground truncate">{myBroker.city}</p>}
              </div>
            </div>

            {myBroker.bio && <p className="text-sm text-muted-foreground">{myBroker.bio}</p>}

            <div className="space-y-2">
              {myBroker.phone && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`tel:${myBroker.phone}`}>
                    <Icon name="Phone" size={16} className="mr-2" />
                    {myBroker.phone}
                  </a>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`mailto:${myBroker.email}`}>
                  <Icon name="Mail" size={16} className="mr-2" />
                  {myBroker.email}
                </a>
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={handleUnassign} disabled={saving} className="text-muted-foreground">
              {saving ? <Icon name="Loader2" size={14} className="animate-spin mr-2" /> : <Icon name="X" size={14} className="mr-2" />}
              Отвязать брокера
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">У вас пока нет закреплённого брокера</p>
            {selecting ? (
              <div className="space-y-3">
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите брокера" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleAssign} disabled={!selectedId || saving} size="sm">
                    {saving && <Icon name="Loader2" size={14} className="animate-spin mr-2" />}
                    Сохранить
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelecting(false)}>Отмена</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSelecting(true)}>
                <Icon name="UserPlus" size={14} className="mr-2" />
                Выбрать брокера
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyBrokerCard;
