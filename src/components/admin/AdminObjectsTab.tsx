import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { InvestmentObjectDB } from '@/services/api';
import { TYPE_LABELS, DeleteConfirm } from './adminConstants';

interface AdminObjectsTabProps {
  filteredObjects: InvestmentObjectDB[];
  searchObjects: string;
  onSearchChange: (v: string) => void;
  actionLoading: boolean;
  onChangeStatus: (id: number, status: InvestmentObjectDB['status']) => void;
  onDeleteClick: (confirm: DeleteConfirm) => void;
}

const AdminObjectsTab = ({
  filteredObjects,
  searchObjects,
  onSearchChange,
  actionLoading,
  onChangeStatus,
  onDeleteClick,
}: AdminObjectsTabProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Все объекты</CardTitle>
        <div className="flex gap-2 items-center">
          <div className="relative w-64">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchObjects}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9"
            />
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
                    onValueChange={(s) => onChangeStatus(obj.id, s as InvestmentObjectDB['status'])}
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
                      onClick={() => onDeleteClick({ type: 'object', id: obj.id, name: obj.title })}
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
  );
};

export default AdminObjectsTab;
