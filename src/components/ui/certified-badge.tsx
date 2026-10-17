import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface CertifiedBadgeProps {
  className?: string;
}

const CertifiedBadge = ({ className = '' }: CertifiedBadgeProps) => (
  <Badge className={`bg-green-100 text-green-800 gap-1 ${className}`}>
    <Icon name="BadgeCheck" size={14} />
    Сертифицированный брокер
  </Badge>
);

export default CertifiedBadge;
