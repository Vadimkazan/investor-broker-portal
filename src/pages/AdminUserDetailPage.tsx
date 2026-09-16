import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api, User, UserRole } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/utils/roles';
import AvatarUpload from '@/components/profile/AvatarUpload';
import UserActivityHistory from '@/components/profile/UserActivityHistory';

const ALL_ROLES: UserRole[] = ['investor', 'broker', 'manager', 'admin'];

type EditableFields = Pick<
  User,
  'name' | 'phone' | 'city' | 'country' | 'bio' | 'surname' | 'first_name' |
  'club' | 'training_stream' | 'telegram_username' | 'telegram_channel' |
  'youtube_channel' | 'vk_group'
>;

const FIELD_LABELS: Record<keyof EditableFields, string> = {
  name: 'Полное имя',
  first_name: 'Имя',
  surname: 'Фамилия',
  phone: 'Телефон',
  city: 'Город',
  country: 'Страна',
  bio: 'О себе',
  club: 'Клуб',
  training_stream: 'Поток обучения',
  telegram_username: 'Telegram username',
  telegram_channel: 'Telegram канал',
  youtube_channel: 'YouTube канал',
  vk_group: 'Группа VK',
};

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<EditableFields>>({});
  const [roles, setRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    loadUser();
  }, [currentUser, id]);

  const loadUser = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getUserById(Number(id));
      setUser(data);
      setRoles(data.roles && data.roles.length > 0 ? data.roles : [data.role]);
      setForm({
        name: data.name || '',
        first_name: data.first_name || '',
        surname: data.surname || '',
        phone: data.phone || '',
        city: data.city || '',
        country: data.country || '',
        bio: data.bio || '',
        club: data.club || '',
        training_stream: data.training_stream || '',
        telegram_username: data.telegram_username || '',
        telegram_channel: data.telegram_channel || '',
        youtube_channel: data.youtube_channel || '',
        vk_group: data.vk_group || '',
      });
    } catch {
      toast({ title: 'Не удалось загрузить пользователя', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUploaded = async (url: string) => {
    if (!user) return;
    const updated = await api.updateUser(user.id, { photo_url: url });
    setUser(updated);
  };

  const toggleRole = (role: UserRole) => {
    setRoles((prev) => {
      if (prev.includes(role)) {
        const next = prev.filter((r) => r !== role);
        return next.length > 0 ? next : prev;
      }
      return [...prev, role];
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.updateUser(user.id, { ...form, roles });
      setUser(updated);
      toast({ title: 'Изменения сохранены' });
    } catch {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <AvatarUpload
              photoUrl={user.photo_url}
              name={user.name}
              onUploaded={handlePhotoUploaded}
            />
            <div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard')} className="mb-2 -ml-2">
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                К списку пользователей
              </Button>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
            ) : (
              <Icon name="Save" size={16} className="mr-2" />
            )}
            Сохранить
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Роли</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {ALL_ROLES.map((role) => {
                const active = roles.includes(role);
                return (
                  <Badge
                    key={role}
                    variant={active ? 'default' : 'outline'}
                    className="cursor-pointer select-none px-3 py-1.5 text-sm"
                    onClick={() => toggleRole(role)}
                  >
                    {active && <Icon name="Check" size={13} className="mr-1" />}
                    {ROLE_LABELS[role]}
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Нажмите на роль, чтобы добавить или убрать её у пользователя. Можно выбрать сразу несколько.
            </p>
          </CardContent>
        </Card>

        <UserActivityHistory userId={user.id} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.name}</Label>
              <Input
                value={form.name || ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.first_name}</Label>
              <Input
                value={form.first_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.surname}</Label>
              <Input
                value={form.surname || ''}
                onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.phone}</Label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+7 900 000-00-00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.city}</Label>
              <Input
                value={form.city || ''}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.country}</Label>
              <Input
                value={form.country || ''}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{FIELD_LABELS.bio}</Label>
              <Textarea
                value={form.bio || ''}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Обучение и соцсети</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.club}</Label>
              <Input
                value={form.club || ''}
                onChange={(e) => setForm((f) => ({ ...f, club: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.training_stream}</Label>
              <Input
                value={form.training_stream || ''}
                onChange={(e) => setForm((f) => ({ ...f, training_stream: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.telegram_username}</Label>
              <Input
                value={form.telegram_username || ''}
                onChange={(e) => setForm((f) => ({ ...f, telegram_username: e.target.value }))}
                placeholder="@username"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.telegram_channel}</Label>
              <Input
                value={form.telegram_channel || ''}
                onChange={(e) => setForm((f) => ({ ...f, telegram_channel: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.youtube_channel}</Label>
              <Input
                value={form.youtube_channel || ''}
                onChange={(e) => setForm((f) => ({ ...f, youtube_channel: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{FIELD_LABELS.vk_group}</Label>
              <Input
                value={form.vk_group || ''}
                onChange={(e) => setForm((f) => ({ ...f, vk_group: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Служебная информация</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">ID пользователя</p>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Дата регистрации</p>
              <p className="font-medium">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
            ) : (
              <Icon name="Save" size={16} className="mr-2" />
            )}
            Сохранить изменения
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;