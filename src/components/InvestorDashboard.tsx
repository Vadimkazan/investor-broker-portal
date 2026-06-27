import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InvestorStats from '@/components/investor/InvestorStats';
import PortfolioCharts from '@/components/investor/PortfolioCharts';
import InvestmentsList from '@/components/investor/InvestmentsList';
import EditInvestmentDialog from '@/components/investor/EditInvestmentDialog';
import PersonalFinancesTab from '@/components/investor/PersonalFinancesTab';
import EducationTab from '@/components/investor/EducationTab';
import NotificationSettings from '@/components/investor/NotificationSettings';
import BrokerProfileSettings from '@/components/broker/BrokerProfileSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useObjects } from '@/hooks/useObjects';
import { useAuth } from '@/contexts/AuthContext';
import type { PropertyObject, UserInvestment } from '@/types/investment';

interface InvestorDashboardProps {
  userName: string;
}

const getUserId = () => {
  const savedUser = localStorage.getItem('investpro-user');
  return savedUser ? JSON.parse(savedUser).email : 'user@example.com';
};

const InvestorDashboard = ({ userName }: InvestorDashboardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myApiObjects = [] } = useObjects();
  const myObjects = myApiObjects.filter(o => o.brokerId === user?.id);

  const PROPERTIES_KEY = 'investpro-properties';
  const INVESTMENTS_KEY = 'investpro-user-investments';
  const USER_KEY = 'investpro-user';

  const [properties, setProperties] = useState<PropertyObject[]>([]);
  const [myInvestments, setMyInvestments] = useState<UserInvestment[]>([]);
  const [editingInvestment, setEditingInvestment] = useState<UserInvestment | null>(null);

  useEffect(() => {
    loadData();
    const loadInterval = setInterval(loadData, 2000);
    const growthInterval = setInterval(simulateGrowth, 60000);
    
    return () => {
      clearInterval(loadInterval);
      clearInterval(growthInterval);
    };
  }, []);

  const loadData = () => {
    try {
      const savedProperties = localStorage.getItem(PROPERTIES_KEY);
      if (savedProperties) {
        const parsed = JSON.parse(savedProperties);
        setProperties(parsed.map((p: PropertyObject) => ({
          ...p,
          metadata: {
            ...p.metadata,
            createdAt: new Date(p.metadata.createdAt),
            updatedAt: new Date(p.metadata.updatedAt),
          },
        })));
      }

      const savedUser = localStorage.getItem(USER_KEY);
      const userId = savedUser ? JSON.parse(savedUser).email : 'user@example.com';

      const savedInvestments = localStorage.getItem(INVESTMENTS_KEY);
      if (savedInvestments) {
        const parsed = JSON.parse(savedInvestments);
        const userInvestments = parsed
          .filter((inv: UserInvestment) => inv.userId === userId)
          .map((inv: UserInvestment) => ({
            ...inv,
            date: new Date(inv.date),
          }));
        setMyInvestments(userInvestments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveInvestments = (investments: UserInvestment[]) => {
    try {
      const allInvestments = localStorage.getItem(INVESTMENTS_KEY);
      const parsed = allInvestments ? JSON.parse(allInvestments) : [];
      
      const savedUser = localStorage.getItem(USER_KEY);
      const userId = savedUser ? JSON.parse(savedUser).email : 'user@example.com';
      
      const otherInvestments = parsed.filter((inv: UserInvestment) => inv.userId !== userId);
      const updated = [...otherInvestments, ...investments];
      
      localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(updated));
      setMyInvestments(investments);
    } catch (error) {
      console.error('Error saving investments:', error);
    }
  };

  const simulateGrowth = () => {
    try {
      const savedInvestments = localStorage.getItem(INVESTMENTS_KEY);
      if (!savedInvestments) return;

      const savedProperties = localStorage.getItem(PROPERTIES_KEY);
      if (!savedProperties) return;

      const investments: UserInvestment[] = JSON.parse(savedInvestments);
      const properties: PropertyObject[] = JSON.parse(savedProperties);

      const updatedInvestments = investments.map((inv) => {
        const property = properties.find(p => p.id === inv.propertyId);
        if (!property) return inv;

        const investmentDate = new Date(inv.date);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysPassed < 1) return inv;

        const annualReturn = property.investment.expectedReturn / 100;
        const dailyReturn = annualReturn / 365;
        
        const growthFactor = Math.pow(1 + dailyReturn, daysPassed);
        const newCurrentValue = inv.amount * growthFactor;
        const newProfit = newCurrentValue - inv.amount;
        const newRoi = (newProfit / inv.amount) * 100;

        return {
          ...inv,
          currentValue: Math.round(newCurrentValue * 100) / 100,
          profit: Math.round(newProfit * 100) / 100,
          roi: Math.round(newRoi * 100) / 100,
        };
      });

      localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(updatedInvestments));
    } catch (error) {
      console.error('Error simulating growth:', error);
    }
  };

  const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = myInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const avgROI = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : '0.0';

  const getInvestedProperties = (): PropertyObject[] => {
    const investedPropertyIds = new Set(myInvestments.map(inv => inv.propertyId));
    return properties.filter(p => investedPropertyIds.has(p.id));
  };

  const calculatePortfolioData = () => {
    const investedProperties = getInvestedProperties();
    
    const typeGroups: Record<string, number> = {};
    investedProperties.forEach(p => {
      const investment = myInvestments.find(inv => inv.propertyId === p.id);
      if (investment) {
        const typeName = 
          p.propertyType === 'apartment' || p.propertyType === 'house' ? 'Жилая недвижимость' :
          p.propertyType === 'commercial' ? 'Коммерческая недвижимость' :
          p.propertyType === 'parking' ? 'Паркинг' : 'Другое';
        
        typeGroups[typeName] = (typeGroups[typeName] || 0) + investment.amount;
      }
    });

    const colors = ['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
    return Object.entries(typeGroups).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  const calculateProfitHistory = () => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
    return months.map((month, index) => ({
      month,
      profit: myInvestments.reduce((sum, inv) => {
        const monthlyProfit = (inv.profit / 6) * (index + 1);
        return sum + monthlyProfit;
      }, 0),
    }));
  };

  const portfolioData = calculatePortfolioData();
  const profitHistory = calculateProfitHistory();

  const stats = [
    { label: 'Всего инвестировано', value: totalInvested > 0 ? `₽${(totalInvested / 1000000).toFixed(1)}M` : '₽0', change: myInvestments.length > 0 ? `${myInvestments.length} объект(ов)` : 'Нет инвестиций', icon: 'Wallet', color: 'text-primary' },
    { label: 'Активных объектов', value: myInvestments.length, change: myInvestments.length > 0 ? 'В портфеле' : 'Начните инвестировать', icon: 'Building2', color: 'text-secondary' },
    { label: 'Текущая прибыль', value: totalProfit > 0 ? `₽${(totalProfit / 1000).toFixed(0)}K` : '₽0', change: totalProfit > 0 ? `+${((totalProfit / totalInvested) * 100).toFixed(1)}%` : 'Без прибыли', icon: 'TrendingUp', color: totalProfit >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: 'Средний ROI', value: `${avgROI}%`, change: totalProfit >= 0 ? 'Доходность' : 'Убыток', icon: 'Percent', color: 'text-primary' },
    { label: 'Текущая стоимость', value: totalCurrentValue > 0 ? `₽${(totalCurrentValue / 1000000).toFixed(1)}M` : '₽0', change: totalCurrentValue > totalInvested ? `+₽${((totalCurrentValue - totalInvested) / 1000).toFixed(0)}K` : 'Без роста', icon: 'DollarSign', color: 'text-green-600' }
  ];

  const calculateProfit = (invested: number, currentValue: number) => {
    const profit = currentValue - invested;
    const percentage = invested > 0 ? ((profit / invested) * 100).toFixed(1) : '0.0';
    return { profit, percentage };
  };

  const handleAddFunds = (investmentId: string, amount: number) => {
    const updated = myInvestments.map(inv => {
      if (inv.id === investmentId) {
        const newAmount = inv.amount + amount;
        const newCurrentValue = inv.currentValue + amount;
        const newProfit = newCurrentValue - newAmount;
        const newRoi = (newProfit / newAmount) * 100;
        
        return {
          ...inv,
          amount: newAmount,
          currentValue: newCurrentValue,
          profit: newProfit,
          roi: newRoi,
        };
      }
      return inv;
    });
    saveInvestments(updated);
  };

  const handleWithdrawFunds = (investmentId: string, amount: number) => {
    const updated = myInvestments
      .map(inv => {
        if (inv.id === investmentId) {
          const newAmount = Math.max(0, inv.amount - amount);
          if (newAmount === 0) return null;
          
          const withdrawRatio = amount / inv.amount;
          const newCurrentValue = inv.currentValue * (1 - withdrawRatio);
          const newProfit = newCurrentValue - newAmount;
          const newRoi = newAmount > 0 ? (newProfit / newAmount) * 100 : 0;
          
          return {
            ...inv,
            amount: newAmount,
            currentValue: newCurrentValue,
            profit: newProfit,
            roi: newRoi,
          };
        }
        return inv;
      })
      .filter((inv): inv is UserInvestment => inv !== null);
    
    saveInvestments(updated);
  };

  const userId = getUserId();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Привет, {userName}! 👋</h2>
        <p className="text-muted-foreground">Обзор ваших инвестиций в недвижимость</p>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="portfolio">Портфель</TabsTrigger>
          <TabsTrigger value="finances">Финансы</TabsTrigger>
          <TabsTrigger value="objects">Мои объекты</TabsTrigger>
          <TabsTrigger value="education">Обучение</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6 mt-6">
          <InvestorStats stats={stats} />
          <PortfolioCharts portfolioData={portfolioData} profitHistory={profitHistory} />
          <InvestmentsList
            myInvestments={myInvestments}
            properties={properties}
            onEditInvestment={setEditingInvestment}
            calculateProfit={calculateProfit}
          />
        </TabsContent>

        <TabsContent value="finances" className="mt-6">
          <PersonalFinancesTab userId={userId} />
        </TabsContent>

        <TabsContent value="objects" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Мои объекты</h3>
                <p className="text-muted-foreground text-sm">Объекты, которые вы добавили на платформу</p>
              </div>
              <Button onClick={() => navigate('/objects/add')}>
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить объект
              </Button>
            </div>

            {myObjects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Building" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Нет добавленных объектов</h3>
                  <p className="text-muted-foreground mb-4">Добавьте свою недвижимость для привлечения инвесторов</p>
                  <Button onClick={() => navigate('/objects/add')}>
                    <Icon name="Plus" size={16} className="mr-2" />
                    Добавить объект
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {myObjects.map(obj => (
                  <Card key={obj.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          {obj.images && obj.images.length > 0 ? (
                            <img src={obj.images[0]} alt={obj.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="ImageOff" size={20} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold">{obj.title}</h4>
                            <Badge variant={obj.status === 'available' ? 'default' : obj.status === 'reserved' ? 'secondary' : 'destructive'}>
                              {obj.status === 'available' ? 'Свободен' : obj.status === 'reserved' ? 'Бронь' : 'Продано'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{obj.address}, {obj.city}</p>
                          <div className="flex gap-4 text-sm">
                            <span><span className="text-muted-foreground">Цена: </span>{(obj.price / 1000000).toFixed(1)} млн ₽</span>
                            <span><span className="text-muted-foreground">Доходность: </span><span className="text-primary font-medium">{obj.yield}%</span></span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/objects/${obj.id}`)}>
                              <Icon name="Eye" size={14} className="mr-1" />Просмотр
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/objects/${obj.id}/edit`)}>
                              <Icon name="Pencil" size={14} className="mr-1" />Редактировать
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <EducationTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <BrokerProfileSettings userId={1} />
          <NotificationSettings userId={1} />
        </TabsContent>
      </Tabs>

      <EditInvestmentDialog
        investment={editingInvestment}
        isOpen={!!editingInvestment}
        onClose={() => setEditingInvestment(null)}
        onAddFunds={handleAddFunds}
        onWithdrawFunds={handleWithdrawFunds}
      />
    </div>
  );
};

export default InvestorDashboard;