import { siTelegram, siWhatsapp } from 'simple-icons';
import Icon from '@/components/ui/icon';

export const MANAGER_CONTACTS = [
  {
    name: 'Telegram',
    label: 'Написать менеджеру',
    href: 'https://t.me/arealvest_assistant',
    path: siTelegram.path,
    color: `#${siTelegram.hex}`,
    external: true,
  },
  {
    name: 'MAX',
    label: 'Написать менеджеру',
    href: 'https://max.ru/u/f9LHodD0cOLmcwSp8VF8tJ5k2fPBnUPrrsMtEemSj5aLbTR1NP83ggAFsqk',
    path: null,
    color: '#5B4BF5',
    external: true,
  },
  {
    name: 'WhatsApp',
    label: 'Написать менеджеру',
    href: 'https://api.whatsapp.com/send?phone=79959007300',
    path: siWhatsapp.path,
    color: `#${siWhatsapp.hex}`,
    external: true,
  },
  {
    name: 'Позвонить',
    label: '+7 995 900 7300',
    href: 'tel:+79959007300',
    path: null,
    color: '#0EA5E9',
    icon: 'Phone',
    external: false,
  },
];

interface ManagerContactsProps {
  title?: string;
}

const ManagerContacts = ({
  title = 'Если хотите, могу передать вас менеджеру. Выберите удобный способ связи 👇',
}: ManagerContactsProps) => {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="text-sm text-foreground">{title}</p>
      <div className="mt-3 grid gap-2">
        {MANAGER_CONTACTS.map((c) => (
          <a
            key={c.name}
            href={c.href}
            {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.path ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d={c.path} />
                </svg>
              ) : c.icon ? (
                <Icon name={c.icon} size={16} />
              ) : (
                <span className="text-[10px] font-bold tracking-tight">MAX</span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-tight">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{c.label}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ManagerContacts;
