import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api, User, InvestmentObjectDB } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { TYPE_LABELS, DeleteConfirm } from '@/components/admin/adminConstants';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminObjectsTab from '@/components/admin/AdminObjectsTab';
import AdminAnalyticsTab from '@/components/admin/AdminAnalyticsTab';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [objects, setObjects] = useState<InvestmentObjectDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchObjects, setSearchObjects] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
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

        <AdminStatsCards stats={stats} />

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

          <TabsContent value="users" className="space-y-4 mt-4">
            <AdminUsersTab
              filteredUsers={filteredUsers}
              searchUsers={searchUsers}
              onSearchChange={setSearchUsers}
              currentUserId={currentUser?.id}
              actionLoading={actionLoading}
              onChangeRole={handleChangeRole}
              onDeleteClick={setDeleteConfirm}
            />
          </TabsContent>

          <TabsContent value="objects" className="space-y-4 mt-4">
            <AdminObjectsTab
              filteredObjects={filteredObjects}
              searchObjects={searchObjects}
              onSearchChange={setSearchObjects}
              actionLoading={actionLoading}
              onChangeStatus={handleChangeObjectStatus}
              onDeleteClick={setDeleteConfirm}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <AdminAnalyticsTab
              cityData={cityData}
              typeData={typeData}
              statusData={statusData}
              stats={stats}
            />
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
