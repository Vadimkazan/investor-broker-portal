import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, UserRole } from '@/services/api';
import { DeleteConfirm } from './adminConstants';
import { ROLE_LABELS } from '@/utils/roles';

interface AdminUsersTabProps {
  filteredUsers: User[];
  searchUsers: string;
  onSearchChange: (v: string) => void;
  currentUserId: number | undefined;
  actionLoading: boolean;
  onChangeRoles: (userId: number, roles: UserRole[]) => void;
  onDeleteClick: (confirm: DeleteConfirm) => void;
}

const ALL_ROLES: UserRole[] = ['investor', 'broker', 'manager', 'admin'];

const AdminUsersTab = ({
  filteredUsers,
  searchUsers,
  onSearchChange,
  currentUserId,
  actionLoading,
  onChangeRoles,
  onDeleteClick,
}: AdminUsersTabProps) => {
  const navigate = useNavigate();

  const toggleRole = (u: User, role: UserRole) => {
    const current = u.roles && u.roles.length > 0 ? u.roles : [u.role];
    const has = current.includes(role);
    let next: UserRole[];
    if (has) {
      next = current.filter((r) => r !== role);
      if (next.length === 0) return;
    } else {
      next = [...current, role];
    }
    onChangeRoles(u.id, next);
  };

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
              <TableHead>Телефон</TableHead>
              <TableHead>Роли</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(u => {
              const userRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role];
              return (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                >
                  <TableCell className="text-muted-foreground">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.phone || '—'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          disabled={actionLoading || u.id === currentUserId}
                        >
                          <div className="flex gap-1 flex-wrap">
                            {userRoles.map((r) => (
                              <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {ROLE_LABELS[r]}
                              </Badge>
                            ))}
                          </div>
                          <Icon name="ChevronDown" size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {ALL_ROLES.map((role) => (
                          <DropdownMenuCheckboxItem
                            key={role}
                            checked={userRoles.includes(role)}
                            onCheckedChange={() => toggleRole(u, role)}
                            onSelect={(e) => e.preventDefault()}
                          >
                            {ROLE_LABELS[role]}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="mr-1"
                    >
                      <Icon name="Eye" size={14} />
                    </Button>
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
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminUsersTab;
