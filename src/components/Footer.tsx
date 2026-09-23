import { siTelegram, siWhatsapp, siVk } from 'simple-icons';
import Icon from '@/components/ui/icon';

const SOCIALS = [
  {
    name: 'MAX',
    href: 'https://max.ru/id163501528408_biz',
    path: null,
    color: '#5B4BF5',
  },
  {
    name: 'Telegram',
    href: 'https://t.me/Arealvest',
    path: siTelegram.path,
    color: `#${siTelegram.hex}`,
  },
  {
    name: 'WhatsApp',
    href: 'https://api.whatsapp.com/send?phone=79959007300',
    path: siWhatsapp.path,
    color: `#${siWhatsapp.hex}`,
  },
  {
    name: 'VK',
    href: 'https://vk.ru/arealvest',
    path: siVk.path,
    color: `#${siVk.hex}`,
  },
];

const EMAILS = ['arealvest@ya.ru', 'arealvest@mail.ru'];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Контакты и социальные сети
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Свяжитесь с нами удобным способом — ответим в рабочее время
          </p>

          <div className="mt-8 grid gap-8 sm:gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Социальные сети
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                {SOCIALS.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <span
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: s.color }}
                      >
                        {s.path ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-[18px] w-[18px]"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d={s.path} />
                          </svg>
                        ) : (
                          <span className="text-[11px] font-bold tracking-tight">MAX</span>
                        )}
                      </span>
                      <span className="text-sm font-medium">{s.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Телефон и почта
              </p>
              <ul className="mt-4 space-y-2 sm:space-y-3">
                <li>
                  <a
                    href="tel:+79959007300"
                    className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon name="Phone" size={18} />
                    </span>
                    <span className="text-sm font-medium">+7 995 900 7300</span>
                  </a>
                </li>
                {EMAILS.map((email) => (
                  <li key={email}>
                    <a
                      href={`mailto:${email}`}
                      className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon name="Mail" size={18} />
                      </span>
                      <span className="break-all text-sm font-medium">{email}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              © {year} AREALVEST. Платформа инвестиций в недвижимость. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
