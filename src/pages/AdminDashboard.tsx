import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api, User, InvestmentObjectDB } from '@/services/api';
import GoogleSheetsSync from '@/components/admin/GoogleSheetsSync';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [objects, setObjects] = useState<InvestmentObjectDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast({
        title: 'Доступ запрещен',
        description: 'У вас нет прав для доступа к админ-панели',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, objectsData] = await Promise.all([
        api.getUsers(),
        api.getObjects()
      ]);
      setUsers(usersData);
      setObjects(objectsData);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    investors: users.filter(u => u.role === 'investor').length,
    brokers: users.filter(u => u.role === 'broker').length,
    totalObjects: objects.length,
    availableObjects: objects.filter(o => o.status === 'available').length,
    reservedObjects: objects.filter(o => o.status === 'reserved').length,
    soldObjects: objects.filter(o => o.status === 'sold').length,
    totalValue: objects.reduce((sum, obj) => sum + Number(obj.price), 0),
    averageYield: objects.length > 0 
      ? objects.reduce((sum, obj) => sum + Number(obj.yield_percent), 0) / objects.length 
      : 0
  };

  const cityDistribution = objects.reduce((acc, obj) => {
    acc[obj.city] = (acc[obj.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cityChartData = Object.entries(cityDistribution).map(([city, count]) => ({
    name: city,
    value: count
  }));

  const typeDistribution = objects.reduce((acc, obj) => {
    const typeLabels: Record<string, string> = {
      'flats': 'Квартиры',
      'apartments': 'Апартаменты',
      'commercial': 'Коммерция',
      'country': 'Загородная'
    };
    const label = typeLabels[obj.property_type] || obj.property_type;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(typeDistribution).map(([name, value]) => ({
    name,
    value
  }));

  const statusChartData = [
    { name: 'Свободен', value: stats.availableObjects },
    { name: 'Бронь', value: stats.reservedObjects },
    { name: 'Продано', value: stats.soldObjects }
  ];

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10);

  const filteredObjects = objects.filter(obj =>
    obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Панель администратора</h1>
            <p className="text-muted-foreground">Управление платформой и аналитика</p>
          </div>
          <Button variant="outline" onClick={loadData}>
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Обновить
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Icon name="LayoutDashboard" size={16} className="mr-2" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="users">
              <Icon name="Users" size={16} className="mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="objects">
              <Icon name="Building" size={16} className="mr-2" />
              Объекты
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Icon name="TrendingUp" size={16} className="mr-2" />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                  <Icon name="Users" className="text-muted-foreground" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.investors} инвесторов, {stats.brokers} брокеров
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего объектов</CardTitle>
                  <Icon name="Building" className="text-muted-foreground" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalObjects}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.availableObjects} свободно
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общая стоимость</CardTitle>
                  <Icon name="DollarSign" className="text-muted-foreground" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats.totalValue / 1_000_000_000).toFixed(1)} млрд ₽
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Портфель платформы
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средняя доходность</CardTitle>
                  <Icon name="TrendingUp" className="text-muted-foreground" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageYield.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    По всем объектам
                  </p>
                </CardContent>
              </Card>
              </div>

              <GoogleSheetsSync />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" style={{display: 'none'}}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                  <Icon name="Users" className="text-muted-foreground" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.investors} инвесторов, {stats.brokers} брокеров
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего объектов</CardTitle>
                  <Icon name="Building" className="text-muted-foreground" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalObjects}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.availableObjects} свободно
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Общая стоимость</CardTitle>
                  <Icon name="DollarSign" className="text-muted-foreground" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats.totalValue / 1_000_000_000).toFixed(1)} млрд ₽
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Портфель платформы
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средняя доходность</CardTitle>
                  <Icon name="TrendingUp" className="text-muted-foreground" size={16} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageYield.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    По всем объектам
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Последние регистрации</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant={user.role === 'broker' ? 'default' : 'secondary'}>
                          {user.role === 'broker' ? 'Брокер' : 'Инвестор'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Статус объектов</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Все пользователи ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Дата регистрации</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'broker' ? 'default' : 'secondary'}>
                            {user.role === 'broker' ? 'Брокер' : 'Инвестор'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at || '').toLocaleDateString('ru-RU')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objects" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Все объекты ({objects.length})</CardTitle>
                  <div className="relative w-64">
                    <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Поиск..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Город</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Доходность</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredObjects.map(obj => (
                      <TableRow key={obj.id}>
                        <TableCell>{obj.id}</TableCell>
                        <TableCell className="font-medium">{obj.title}</TableCell>
                        <TableCell>{obj.city}</TableCell>
                        <TableCell className="text-muted-foreground">{obj.property_type}</TableCell>
                        <TableCell>{(Number(obj.price) / 1_000_000).toFixed(1)} млн ₽</TableCell>
                        <TableCell className="text-primary font-medium">{obj.yield_percent}%</TableCell>
                        <TableCell>
                          <Badge variant={obj.status === 'available' ? 'default' : obj.status === 'reserved' ? 'secondary' : 'destructive'}>
                            {obj.status === 'available' ? 'Свободен' : obj.status === 'reserved' ? 'Бронь' : 'Продано'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по городам</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#0088FE" name="Объектов" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Типы недвижимости</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ключевые метрики</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Конверсия в продажи</p>
                    <p className="text-2xl font-bold">
                      {stats.totalObjects > 0 ? ((stats.soldObjects / stats.totalObjects) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Средняя цена объекта</p>
                    <p className="text-2xl font-bold">
                      {stats.totalObjects > 0 ? (stats.totalValue / stats.totalObjects / 1_000_000).toFixed(1) : 0} млн ₽
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Объектов на брокера</p>
                    <p className="text-2xl font-bold">
                      {stats.brokers > 0 ? (stats.totalObjects / stats.brokers).toFixed(1) : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;