import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './home/HeroSection';
import HowItWorksSection from './home/HowItWorksSection';
import GrowthSection from './home/GrowthSection';
import SecuritySection from './home/SecuritySection';
import TestimonialsSection from './home/TestimonialsSection';
import BrokersSection from './home/BrokersSection';
import FinalCTASection from './home/FinalCTASection';
import { api } from '@/services/api';

interface InvestmentObject {
  id: number;
  title: string;
  location: string;
  type: string;
  price?: number;
  minInvestment?: number;
  expectedReturn: number;
  term: number;
  risk: string;
  progress?: number;
  image: string;
}

interface HomePageProps {
  investmentObjects: InvestmentObject[];
  onRegisterClick?: () => void;
}

interface StatItem {
  label: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

const HomePage = ({ investmentObjects, onRegisterClick }: HomePageProps) => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<StatItem[]>([
    { label: 'Активных объектов', value: '0', change: '0%', icon: 'Building2', color: 'text-primary' },
    { label: 'Общий объем', value: '₽0', change: '0%', icon: 'TrendingUp', color: 'text-secondary' },
    { label: 'Средняя доходность', value: '0%', change: '0%', icon: 'Percent', color: 'text-primary' },
    { label: 'Инвесторов', value: '0', change: '0', icon: 'Users', color: 'text-secondary' }
  ]);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const [objects, users] = await Promise.all([
        api.getObjects(),
        api.getUsers()
      ]);

      const activeObjects = objects.filter(obj => obj.status === 'available').length;
      const totalVolume = objects.reduce((sum, obj) => sum + Number(obj.price), 0);
      const avgReturn = objects.length > 0
        ? objects.reduce((sum, obj) => sum + Number(obj.yield_percent), 0) / objects.length
        : 0;
      const investorsCount = users.filter(u => u.role === 'investor').length;
      
      setDashboardStats([
        { label: 'Активных объектов', value: activeObjects.toString(), change: `${objects.length} всего`, icon: 'Building2', color: 'text-primary' },
        { label: 'Общий объем', value: `₽${(totalVolume / 1_000_000_000).toFixed(1)} млрд`, change: '+8.3%', icon: 'TrendingUp', color: 'text-secondary' },
        { label: 'Средняя доходность', value: `${avgReturn.toFixed(1)}%`, change: 'годовых', icon: 'Percent', color: 'text-primary' },
        { label: 'Инвесторов', value: investorsCount.toString(), change: `${users.length} всего`, icon: 'Users', color: 'text-secondary' }
      ]);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setDashboardStats([
        { label: 'Активных объектов', value: '8', change: '12 всего', icon: 'Building2', color: 'text-primary' },
        { label: 'Общий объем', value: '₽2.4 млрд', change: '+8.3%', icon: 'TrendingUp', color: 'text-secondary' },
        { label: 'Средняя доходность', value: '12.5%', change: 'годовых', icon: 'Percent', color: 'text-primary' },
        { label: 'Инвесторов', value: '2', change: '4 всего', icon: 'Users', color: 'text-secondary' }
      ]);
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <HeroSection 
        dashboardStats={dashboardStats}
        onRegisterClick={onRegisterClick}
        scrollToSection={scrollToSection}
      />

      <HowItWorksSection onRegisterClick={onRegisterClick} />

      <GrowthSection isVisible={visibleSections.has('growth')} />

      <SecuritySection isVisible={visibleSections.has('security')} />

      <TestimonialsSection isVisible={visibleSections.has('testimonials')} />

      <BrokersSection 
        isVisible={visibleSections.has('for-brokers')}
        onRegisterClick={onRegisterClick}
      />

      <FinalCTASection onRegisterClick={onRegisterClick} />
    </div>
  );
};

export default HomePage;