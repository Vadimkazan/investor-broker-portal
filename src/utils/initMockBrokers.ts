import { Broker } from '@/types/investment-object';

export const initMockBrokers = () => {
  const existingBrokers = localStorage.getItem('investment-brokers');
  
  if (existingBrokers) {
    return;
  }

  const mockBrokers: Broker[] = [
    {
      id: 1,
      name: 'Алексей Соколов',
      company: 'РеалЭстейт Про',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      rating: 4.8,
      phone: '+7 (495) 123-45-67',
      email: 'sokolov@realestate-pro.ru',
      dealsCompleted: 127
    },
    {
      id: 2,
      name: 'Мария Волкова',
      company: 'Инвест Капитал',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
      rating: 4.9,
      phone: '+7 (495) 234-56-78',
      email: 'volkova@invest-capital.ru',
      dealsCompleted: 89
    },
    {
      id: 3,
      name: 'Дмитрий Петров',
      company: 'Премиум Недвижимость',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry',
      rating: 4.7,
      phone: '+7 (495) 345-67-89',
      email: 'petrov@premium-estate.ru',
      dealsCompleted: 64
    }
  ];

  localStorage.setItem('investment-brokers', JSON.stringify(mockBrokers));
};
