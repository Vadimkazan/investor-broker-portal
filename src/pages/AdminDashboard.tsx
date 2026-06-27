import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api, User, InvestmentObjectDB } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ROLE_LABELS: Record<string, string> = {
  investor: 'Инвестор',
  broker: 'Брокер',
  admin: 'Админ',
  manager: 'Менеджер'
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Свободен',
  reserved: 'Бронь',
  sold: 'Продано'
};

const TYPE_LABELS: Record<string, string> = {
  flats: 'Квартиры',
  apartments: 'Апартаменты',
  commercial: 'Коммерция',
  country: 'Загородная'
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [objects, setObjects] = useState<InvestmentObjectDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchObjects, setSearchObjects] = useState('');

  // Диалог подтверждения удаления
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'object'; id: number; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      toast({ title: 'Доступ запрещён', variant: 'destructive' });
      navigate('/');
      return;
    }
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, objectsData] = await Promise.all([api.getUsers(), api.getObjects()]);
      setUsers(usersData);
      setObjects(objectsData);
    } catch {
      toast({ title: 'Ошибка загрузки данных', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: number, role: User['role']) => {
    setActionLoading(true);
    try {
      const updated = await api.updateUser(userId, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
      toast({ title: 'Роль изменена' });
    } catch {
      toast({ title: 'Ошибка изменения роли', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    setActionLoading(true);
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast({ title: 'Пользователь удалён' });
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteObject = async (id: number) => {
    setActionLoading(true);
    try {
      await api.deleteObject(id);
      setObjects(prev => prev.filter(o => o.id !== id));
      toast({ title: 'Объект удалён' });
    } catch {
      toast({ title: 'Ошибка удаления', variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleChangeObjectStatus = async (id: number, status: InvestmentObjectDB['status']) => {
    setActionLoading(true);
    try {
      await api.updateObject(id, { status });
      setObjects(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast({ title: 'Статус изменён' });
    } catch {
      toast({ title: 'Ошибка изменения статуса', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    investors: users.filter(u => u.role === 'investor').length,
    brokers: users.filter(u => u.role === 'broker').length,
    totalObjects: objects.length,
    available: objects.filter(o => o.status === 'available').length,
    reserved: objects.filter(o => o.status === 'reserved').length,
    sold: objects.filter(o => o.status === 'sold').length,
    totalValue: objects.reduce((s, o) => s + Number(o.price), 0),
    avgYield: objects.length > 0 ? objects.reduce((s, o) => s + Number(o.yield_percent), 0) / objects.length : 0,
  };

  const cityData = Object.entries(
    objects.reduce((acc, o) => { acc[o.city] = (acc[o.city] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const typeData = Object.entries(
    objects.reduce((acc, o) => {
      const label = TYPE_LABELS[o.property_type] || o.property_type;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const statusData = [
    { name: 'Свободен', value: stats.available },
    { name: 'Бронь', value: stats.reserved },
    { name: 'Продано', value: stats.sold },
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredObjects = objects.filter(o =>
    o.title.toLowerCase().includes(searchObjects.toLowerCase()) ||
    o.city.toLowerCase().includes(searchObjects.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">

        {/* Шапка */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Панель администратора</h1>
            <p className="text-muted-foreground">Управление платформой</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              На главную
            </Button>
            <Button onClick={loadData}>
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Обновить
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Пользователи</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.investors} инв. · {stats.brokers} бр.</p>
                </div>
                <Icon name="Users" size={32} className="text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Объекты</p>
                  <p className="text-3xl font-bold">{stats.totalObjects}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.available} свободно</p>
                </div>
                <Icon name="Building" size={32} className="text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Общая стоимость</p>
                  <p className="text-3xl font-bold">{(stats.totalValue / 1_000_000_000).toFixed(1)} млрд</p>
                  <p className="text-xs text-muted-foreground mt-1">₽ портфель платформы</p>
                </div>
                <Icon name="Wallet" size={32} className="text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ср. доходность</p>
                  <p className="text-3xl font-bold">{stats.avgYield.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">по всем объектам</p>
                </div>
                <Icon name="TrendingUp" size={32} className="text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Icon name="Users" size={15} className="mr-2" />Пользователи ({users.length})
            </TabsTrigger>
            <TabsTrigger value="objects">
              <Icon name="Building" size={15} className="mr-2" />Объекты ({objects.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Icon name="BarChart2" size={15} className="mr-2" />Аналитика
            </TabsTrigger>
          </TabsList>

          {/* === ПОЛЬЗОВАТЕЛИ === */}
          <TabsContent value="users" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle>Все пользователи</CardTitle>
                <div className="relative w-64">
                  <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Поиск по имени или email..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)} className="pl-9" />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">ID</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="text-muted-foreground">{u.id}</TableCell>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(role) => handleChangeRole(u.id, role as User['role'])}
                            disabled={actionLoading || u.id === currentUser?.id}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="investor">Инвестор</SelectItem>
                              <SelectItem value="broker">Брокер</SelectItem>
                              <SelectItem value="manager">Менеджер</SelectItem>
                              <SelectItem value="admin">Админ</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={u.id === currentUser?.id}
                            onClick={() => setDeleteConfirm({ type: 'user', id: u.id, name: u.name })}
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ОБЪЕКТЫ === */}
          <TabsContent value="objects" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle>Все объекты</CardTitle>
                <div className="flex gap-2 items-center">
                  <div className="relative w-64">
                    <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Поиск..." value={searchObjects} onChange={e => setSearchObjects(e.target.value)} className="pl-9" />
                  </div>
                  <Button size="sm" onClick={() => navigate('/objects/add')}>
                    <Icon name="Plus" size={15} className="mr-1" />Добавить
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Город</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Доходность</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredObjects.map(obj => (
                      <TableRow key={obj.id}>
                        <TableCell className="text-muted-foreground">{obj.id}</TableCell>
                        <TableCell className="font-medium max-w-40 truncate">{obj.title}</TableCell>
                        <TableCell>{obj.city}</TableCell>
                        <TableCell className="text-muted-foreground">{TYPE_LABELS[obj.property_type] || obj.property_type}</TableCell>
                        <TableCell>{(Number(obj.price) / 1_000_000).toFixed(1)} млн ₽</TableCell>
                        <TableCell className="text-primary font-medium">{obj.yield_percent}%</TableCell>
                        <TableCell>
                          <Select
                            value={obj.status}
                            onValueChange={(s) => handleChangeObjectStatus(obj.id, s as InvestmentObjectDB['status'])}
                            disabled={actionLoading}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Свободен</SelectItem>
                              <SelectItem value="reserved">Бронь</SelectItem>
                              <SelectItem value="sold">Продано</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/objects/${obj.id}`)}>
                              <Icon name="Eye" size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/objects/${obj.id}/edit`)}>
                              <Icon name="Pencil" size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm({ type: 'object', id: obj.id, name: obj.title })}
                            >
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === АНАЛИТИКА === */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Объекты по городам</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={cityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" name="Объектов" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Типы недвижимости</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Статус объектов</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Ключевые метрики</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {[
                    { label: 'Конверсия в продажи', value: stats.totalObjects > 0 ? `${((stats.sold / stats.totalObjects) * 100).toFixed(1)}%` : '0%' },
                    { label: 'Средняя цена объекта', value: stats.totalObjects > 0 ? `${(stats.totalValue / stats.totalObjects / 1_000_000).toFixed(1)} млн ₽` : '—' },
                    { label: 'Объектов на брокера', value: stats.brokers > 0 ? (stats.totalObjects / stats.brokers).toFixed(1) : '—' },
                    { label: 'Забронировано', value: `${stats.reserved} из ${stats.totalObjects}` },
                  ].map(m => (
                    <div key={m.label} className="flex justify-between items-center border-b pb-3 last:border-0">
                      <p className="text-sm text-muted-foreground">{m.label}</p>
                      <p className="font-semibold">{m.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Диалог подтверждения удаления */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите удаление</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить <strong>«{deleteConfirm?.name}»</strong>? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === 'user') handleDeleteUser(deleteConfirm.id);
                else handleDeleteObject(deleteConfirm.id);
              }}
            >
              {actionLoading ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
