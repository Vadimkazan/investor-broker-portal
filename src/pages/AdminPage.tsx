import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", role: "investor" });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://functions.poehali.dev/8fa7915b-2477-4216-a766-2d8d39c34a78");
      if (!response.ok) throw new Error("Ошибка загрузки");
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("https://functions.poehali.dev/8fa7915b-2477-4216-a766-2d8d39c34a78", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error("Ошибка создания");

      toast({
        title: "Успешно",
        description: "Пользователь добавлен",
      });

      setIsAddDialogOpen(false);
      setNewUser({ email: "", name: "", role: "investor" });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить пользователя",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      const response = await fetch("https://functions.poehali.dev/8fa7915b-2477-4216-a766-2d8d39c34a78", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!response.ok) throw new Error("Ошибка обновления");

      toast({
        title: "Успешно",
        description: "Изменения сохранены",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Удалить пользователя?")) return;

    try {
      const response = await fetch(`https://functions.poehali.dev/8fa7915b-2477-4216-a766-2d8d39c34a78?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Ошибка удаления");

      toast({
        title: "Успешно",
        description: "Пользователь удален",
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    return role === "broker" ? "Брокер" : "Инвестор";
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter === "all") return true;
    return user.role === roleFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">Управление пользователями</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="UserPlus" size={16} className="mr-2" />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый пользователь</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Роль</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Инвестор</SelectItem>
                        <SelectItem value="broker">Брокер</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddUser} className="w-full">
                    Создать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Фильтр:</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  <SelectItem value="investor">Только инвесторы</SelectItem>
                  <SelectItem value="broker">Только брокеры</SelectItem>
                </SelectContent>
              </Select>
              {roleFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRoleFilter("all")}
                >
                  <Icon name="X" size={16} className="mr-1" />
                  Сбросить
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    {editingUser?.id === user.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={editingUser.role} 
                            onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="investor">Инвестор</SelectItem>
                              <SelectItem value="broker">Брокер</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateUser(editingUser)}
                          >
                            <Icon name="Check" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(null)}
                          >
                            <Icon name="X" size={16} />
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'broker' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <Icon name="Pencil" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;