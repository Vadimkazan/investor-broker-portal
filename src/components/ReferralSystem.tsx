import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { api, User } from '@/services/api';

interface ReferralSystemProps {
  brokerId: string;
  brokerName: string;
}

const ReferralSystem = ({ brokerId }: ReferralSystemProps) => {
  const [copied, setCopied] = useState(false);
  const [investors, setInvestors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const link = `${window.location.origin}/?ref=${brokerId}`;

  useEffect(() => {
    api.getBrokerRegisteredInvestors(Number(brokerId))
      .then(setInvestors)
      .catch(() => setInvestors([]))
      .finally(() => setLoading(false));
  }, [brokerId]);

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Приглашайте инвесторов</h2>
        <p className="text-muted-foreground">Отправьте свою ссылку: все, кто зарегистрируется по ней, автоматически закрепятся за вами</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ваша ссылка</CardTitle>
          <CardDescription>Одна ссылка для всех каналов: мессенджеры, соцсети, почта</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input value={link} readOnly className="font-mono text-sm" />
            <Button variant="outline" className="gap-2" onClick={copy}>
              <Icon name={copied ? 'Check' : 'Copy'} size={18} />
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Приглашённые инвесторы</span>
            <span className="text-2xl">{loading ? '…' : investors.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
          ) : investors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока никто не зарегистрировался по вашей ссылке</p>
          ) : (
            <div className="divide-y">
              {investors.map((u) => (
                <div key={u.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-muted-foreground">{u.email}</p>
                  </div>
                  {u.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;
