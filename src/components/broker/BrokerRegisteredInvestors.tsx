import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { api, User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import UserActivityHistory from '@/components/profile/UserActivityHistory';

interface BrokerRegisteredInvestorsProps {
  brokerId: number;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const BrokerRegisteredInvestors = ({ brokerId }: BrokerRegisteredInvestorsProps) => {
  const { toast } = useToast();
  const [investors, setInvestors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getBrokerRegisteredInvestors(brokerId)
      .then(setInvestors)
      .catch(() => toast({ title: 'Не удалось загрузить инвесторов', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [brokerId]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Мои инвесторы на сайте</h2>
        <p className="text-muted-foreground">Зарегистрированные инвесторы, привязанные к вам, и их активность</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Icon name="Loader2" size={32} className="mx-auto text-primary animate-spin mb-2" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      ) : investors.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Пока нет зарегистрированных инвесторов, привязанных к вам
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {investors.map((inv) => (
            <Card
              key={inv.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(inv)}
            >
              <CardContent className="py-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={inv.photo_url} alt={inv.name} className="object-cover" />
                  <AvatarFallback>{getInitials(inv.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{inv.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selected && (
                <>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selected.photo_url} alt={selected.name} className="object-cover" />
                    <AvatarFallback>{getInitials(selected.name)}</AvatarFallback>
                  </Avatar>
                  {selected.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>{selected?.email}{selected?.phone ? ` · ${selected.phone}` : ''}</DialogDescription>
          </DialogHeader>
          {selected && <UserActivityHistory userId={selected.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerRegisteredInvestors;