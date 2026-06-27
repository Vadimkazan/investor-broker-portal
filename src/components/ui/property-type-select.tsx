import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROPERTY_TYPE_LABELS, PropertyType } from '@/types/investment-object';

interface PropertyTypeSelectProps {
  value: string;
  onValueChange: (value: PropertyType | 'all') => void;
  includeAll?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const PropertyTypeSelect = ({
  value,
  onValueChange,
  includeAll = false,
  placeholder = 'Тип недвижимости',
  className,
  disabled,
}: PropertyTypeSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange as (v: string) => void} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">Все типы</SelectItem>}
        {(Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]).map(([val, label]) => (
          <SelectItem key={val} value={val}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PropertyTypeSelect;
