import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getUserRoles, isAdminOrManager } from '@/utils/roles';
import { api, UserRole } from '@/services/api';
import AvatarUpload from '@/components/profile/AvatarUpload';

const AUTH_URL = 'https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973?resource=auth';

const ROLE_LABELS: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Администратор', color: 'destructive' },
  manager: { label: 'Менеджер', color: 'default' },
  broker: { label: 'Брокер', color: 'default' },
  investor: { label: 'Инвестор', color: 'secondary' },
};

const ProfileSettings = () => {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [tgUsername, setTgUsername] = useState(user?.telegram_username || '');
  const [tgLoading, setTgLoading] = useState(false);

  if (!user) return null;

  const normalizedTg = tgUsername.trim().replace(/^@+/, '').replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '');
  const tgChanged = normalizedTg !== (user.telegram_username || '');
  const tgInvalid = !!normalizedTg && !/^[a-zA-Z0-9_]{5,32}$/.test(normalizedTg);

  const handleSaveTelegram = async () => {
    setTgLoading(true);
    try {
      await api.updateUser(user.id, { telegram_username: normalizedTg });
      await refreshUser();
      setTgUsername(normalizedTg);
      toast({ title: normalizedTg ? 'Ник Telegram сохранён' : 'Ник Telegram удалён' });
    } catch (err: unknown) {
      toast({ title: 'Не удалось сохранить ник', variant: 'destructive' });
    } finally {
      setTgLoading(false);
    }
  };

  const userRoles = getUserRoles(user);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Пароль должен быть не менее 6 символов', variant: 'destructive' });
      return;
    }
    setPwdLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', user_id: user.id, old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Пароль успешно изменён' });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handlePhotoUploaded = async (url: string) => {
    await api.updateUser(user.id, { photo_url: url });
    await refreshUser();
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_email', user_id: user.id, new_email: newEmail.trim().toLowerCase(), password: emailPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Email изменён. Войдите заново.' });
      logout();
      navigate('/');
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка', variant: 'destructive' });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Профиль */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="User" size={20} />
            Профиль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <AvatarUpload
                photoUrl={user.photo_url}
                name={user.name}
                onUploaded={handlePhotoUploaded}
              />
              <div>
                <p className="font-semibold text-lg">{user.name}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {userRoles.map((r) => (
                <Badge key={r} variant={(ROLE_LABELS[r]?.color as 'default' | 'secondary' | 'destructive') || 'secondary'} className="text-sm px-3 py-1">
                  {ROLE_LABELS[r]?.label || r}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="tg-username">Ник в Telegram</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="tg-username"
                  placeholder="username"
                  value={tgUsername}
                  onChange={e => setTgUsername(e.target.value)}
                  className={`pl-7 ${tgInvalid ? 'border-destructive' : ''}`}
                />
              </div>
              <Button
                onClick={handleSaveTelegram}
                disabled={!tgChanged || tgInvalid || tgLoading}
                variant="outline"
              >
                {tgLoading && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
                Сохранить
              </Button>
            </div>
            <p className={`text-xs ${tgInvalid ? 'text-destructive' : 'text-muted-foreground'}`}>
              {tgInvalid
                ? 'Ник может содержать латинские буквы, цифры и «_», от 5 до 32 символов'
                : 'Нужен, чтобы с вами могли связаться в Telegram'}
            </p>
          </div>

          {isAdminOrManager(user) && (
            <div className="flex gap-2 pt-2">
              <Button variant="default" onClick={() => navigate('/admin/dashboard')}>
                <Icon name="LayoutDashboard" size={16} className="mr-2" />
                Открыть панель администратора
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Смена пароля */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Lock" size={20} />
            Сменить пароль
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Текущий пароль</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Повторите новый пароль</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={pwdLoading}>
              {pwdLoading && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
              Сохранить пароль
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Смена email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Mail" size={20} />
            Сменить Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="space-y-2">
              <Label>Текущий email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Новый email</Label>
              <Input
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Подтвердите паролем</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">После смены email потребуется войти заново</p>
            <Button type="submit" variant="outline" disabled={emailLoading}>
              {emailLoading && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
              Сменить Email
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;