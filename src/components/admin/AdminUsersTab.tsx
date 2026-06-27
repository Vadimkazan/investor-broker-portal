import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { User } from '@/services/api';
import { DeleteConfirm } from './adminConstants';

interface AdminUsersTabProps {
  filteredUsers: User[];
  searchUsers: string;
  onSearchChange: (v: string) => void;
  currentUserId: number | undefined;
  actionLoading: boolean;
  onChangeRole: (userId: number, role: User['role']) => void;
  onDeleteClick: (confirm: DeleteConfirm) => void;
}

const AdminUsersTab = ({
  filteredUsers,
  searchUsers,
  onSearchChange,
  currentUserId,
  actionLoading,
  onChangeRole,
  onDeleteClick,
}: AdminUsersTabProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Все пользователи</CardTitle>
        <div className="relative w-64">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            value={searchUsers}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9"
          />
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
                    onValueChange={(role) => onChangeRole(u.id, role as User['role'])}
                    disabled={actionLoading || u.id === currentUserId}
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
                    disabled={u.id === currentUserId}
                    onClick={() => onDeleteClick({ type: 'user', id: u.id, name: u.name })}
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
  );
};

export default AdminUsersTab;
