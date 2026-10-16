import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import CalculatorPage from '@/components/CalculatorPage';
import PageBreadcrumbs from '@/components/objects/PageBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

const SITE = 'https://xn--80aagkc8a6anj.xn--p1ai';
const URL = `${SITE}/calculator`;
const TITLE = 'Калькулятор доходности недвижимости онлайн | AREALVEST';
const DESCRIPTION =
  'Рассчитайте доходность инвестиций в недвижимость: итоговую сумму, чистую прибыль, ROI и срок окупаемости. Укажите сумму, срок и ожидаемую доходность.';

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  const prev = tag.getAttribute('content');
  tag.setAttribute('content', content);
  return () => {
    if (prev !== null) tag?.setAttribute('content', prev);
  };
};

const CalculatorRoutePage = () => {
  const navigate = useNavigate();
  const { user, switchRole } = useAuth();
  const [investmentAmount, setInvestmentAmount] = useState(1000000);
  const [investmentPeriod, setInvestmentPeriod] = useState(12);
  const [expectedReturn, setExpectedReturn] = useState(15);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;
    const restores = [
      setMeta('name', 'description', DESCRIPTION),
      setMeta('property', 'og:type', 'website'),
      setMeta('property', 'og:title', TITLE),
      setMeta('property', 'og:description', DESCRIPTION),
      setMeta('property', 'og:url', URL),
      setMeta('name', 'twitter:title', TITLE),
      setMeta('name', 'twitter:description', DESCRIPTION),
    ];
    const canonical = document.head.querySelector('link[rel="canonical"]');
    const prevHref = canonical?.getAttribute('href') ?? null;
    canonical?.setAttribute('href', URL);
    return () => {
      document.title = prevTitle;
      restores.forEach((r) => r());
      if (canonical && prevHref !== null) canonical.setAttribute('href', prevHref);
    };
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'home') navigate('/');
    else if (tab === 'objects') navigate('/objects');
    else if (tab === 'dashboard') navigate('/?tab=dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('investpro-user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        activeTab="calculator"
        onTabChange={handleTabChange}
        user={user}
        onAuthClick={() => navigate('/')}
        onLogout={handleLogout}
        onRoleSwitch={switchRole}
      />
      <div className="container mx-auto px-4 sm:px-6 pt-20 pb-8">
        <PageBreadcrumbs items={[{ name: 'Главная', path: '/' }, { name: 'Калькулятор' }]} />
        <CalculatorPage
          investmentAmount={investmentAmount}
          investmentPeriod={investmentPeriod}
          expectedReturn={expectedReturn}
          onAmountChange={setInvestmentAmount}
          onPeriodChange={setInvestmentPeriod}
          onReturnChange={setExpectedReturn}
        />
      </div>
    </div>
  );
};

export default CalculatorRoutePage;
