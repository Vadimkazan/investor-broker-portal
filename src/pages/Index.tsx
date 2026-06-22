import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import HomePage from '@/components/HomePage';
import CalculatorPage from '@/components/CalculatorPage';
import AuthModal from '@/components/AuthModal';
import NewBrokerDashboard from '@/components/NewBrokerDashboard';
import InvestorDashboard from '@/components/InvestorDashboard';
import { loadSpreadsheetData } from '@/utils/importSpreadsheetData';
import type { PropertyObject } from '@/types/investment';

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    
    const titles: Record<string, string> = {
      home: 'Инвестиционный портал недвижимости',
      objects: 'Объекты - Инвестиционный портал',
      calculator: 'Калькулятор доходности - Инвестиционный портал',
      dashboard: 'Личный кабинет - Инвестиционный портал'
    };
    document.title = titles[activeTab] || 'Инвестиционный портал недвижимости';
    
    return () => clearTimeout(timer);
  }, [activeTab]);
  const [investmentAmount, setInvestmentAmount] = useState(1000000);
  const [investmentPeriod, setInvestmentPeriod] = useState(12);
  const [expectedReturn, setExpectedReturn] = useState(15);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: 'investor' | 'broker' } | null>(() => {
    const savedUser = localStorage.getItem('investpro-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('investpro-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('investpro-user');
    }
  }, [user]);

  const [allProperties, setAllProperties] = useState<PropertyObject[]>([]);

  useEffect(() => {
    loadSpreadsheetData();
    
    const loadAllProperties = () => {
      try {
        const saved = localStorage.getItem('investpro-properties');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAllProperties(parsed.filter((p: PropertyObject) => p.status === 'active'));
        }
      } catch (error) {
        console.error('Error loading properties:', error);
      }
    };

    loadAllProperties();
    const interval = setInterval(loadAllProperties, 1000);
    return () => clearInterval(interval);
  }, []);

  const investmentObjects = [
    ...allProperties.map((p) => ({
      id: Number(p.id.replace(/\D/g, '')) || Math.random(),
      title: p.title,
      location: `${p.location.city}${p.location.district ? ', ' + p.location.district : ''}`,
      type: p.propertyType === 'apartment' ? 'Жилая недвижимость' : 
            p.propertyType === 'house' ? 'Жилая недвижимость' :
            p.propertyType === 'commercial' ? 'Коммерческая недвижимость' : 'Земля',
      minInvestment: p.pricing.minInvestment,
      expectedReturn: p.investment.expectedReturn,
      term: p.investment.term,
      risk: p.investment.riskLevel === 'low' ? 'Низкий' : 
            p.investment.riskLevel === 'medium' ? 'Средний' : 'Высокий',
      progress: Math.round((p.investment.currentInvestment / p.investment.targetInvestment) * 100),
      image: p.propertyType === 'apartment' ? '🏢' : 
             p.propertyType === 'house' ? '🏠' :
             p.propertyType === 'commercial' ? '🏬' : '🏞️',
    })),
    {
      id: 1,
      title: 'ЖК «Северный квартал»',
      location: 'Москва, САО',
      type: 'Жилая недвижимость',
      minInvestment: 500000,
      expectedReturn: 22,
      term: 24,
      risk: 'Средний',
      progress: 67,
      image: '🏢'
    },
    {
      id: 2,
      title: 'ТЦ «Метрополис»',
      location: 'Санкт-Петербург',
      type: 'Коммерческая недвижимость',
      minInvestment: 1000000,
      expectedReturn: 18,
      term: 36,
      risk: 'Низкий',
      progress: 84,
      image: '🏬'
    },
    {
      id: 3,
      title: 'Апарт-отель «Прибрежный»',
      location: 'Сочи',
      type: 'Жилая недвижимость',
      minInvestment: 750000,
      expectedReturn: 25,
      term: 18,
      risk: 'Высокий',
      progress: 42,
      image: '🏨'
    },
    {
      id: 4,
      title: 'Бизнес-центр «Альфа»',
      location: 'Екатеринбург',
      type: 'Коммерческая недвижимость',
      minInvestment: 2000000,
      expectedReturn: 16,
      term: 48,
      risk: 'Низкий',
      progress: 91,
      image: '🏛️'
    }
  ];

  const handleAuth = (userData: { name: string; email: string; role: 'investor' | 'broker' }) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('home');
  };

  const handleRoleSwitch = () => {
    if (user) {
      setUser({
        ...user,
        role: user.role === 'broker' ? 'investor' : 'broker',
      });
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'objects') {
      navigate('/objects');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
      />

      <div className="container mx-auto px-6 py-8 relative">
        {isTransitioning && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            </div>
          </div>
        )}
        
        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {activeTab === 'home' && (
            <HomePage 
              investmentObjects={investmentObjects}
              onRegisterClick={() => setShowAuthModal(true)}
            />
          )}

          {activeTab === 'calculator' && (
            <CalculatorPage
              investmentAmount={investmentAmount}
              investmentPeriod={investmentPeriod}
              expectedReturn={expectedReturn}
              onAmountChange={setInvestmentAmount}
              onPeriodChange={setInvestmentPeriod}
              onReturnChange={setExpectedReturn}
            />
          )}

          {activeTab === 'dashboard' && user && (
            <>
              {user.role === 'broker' ? (
                <NewBrokerDashboard userName={user.name} brokerId={user.id} />
              ) : (
                <InvestorDashboard userName={user.name} />
              )}
            </>
          )}
        </div>
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
      />
    </div>
  );
};

export default Index;