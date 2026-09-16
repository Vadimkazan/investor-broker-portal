import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvestorFunnel from './InvestorFunnel';
import ReferralSystem from './ReferralSystem';
import BrokerObjectsManager from './broker/BrokerObjectsManager';
import AddNewObjectDialog from './broker/AddNewObjectDialog';
import ProfileSettings from './ProfileSettings';
import BrokerRegisteredInvestors from './broker/BrokerRegisteredInvestors';

interface NewBrokerDashboardProps {
  userName: string;
  brokerId: number;
}

const NewBrokerDashboard = ({ userName, brokerId }: NewBrokerDashboardProps) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Кабинет брокера</h2>
        <p className="text-muted-foreground">Добро пожаловать, {userName}!</p>
      </div>

      <Tabs defaultValue="properties" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-5">
            <TabsTrigger value="properties" className="flex-1 whitespace-nowrap">Объекты</TabsTrigger>
            <TabsTrigger value="investors" className="flex-1 whitespace-nowrap">Воронка</TabsTrigger>
            <TabsTrigger value="site-investors" className="flex-1 whitespace-nowrap">Мои инвесторы</TabsTrigger>
            <TabsTrigger value="referral" className="flex-1 whitespace-nowrap">Реферальная</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 whitespace-nowrap">Настройки</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="properties">
          <BrokerObjectsManager onAddClick={() => setAddDialogOpen(true)} />
          <AddNewObjectDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            onSuccess={() => {}}
            brokerId={brokerId}
          />
        </TabsContent>

        <TabsContent value="investors">
          <InvestorFunnel brokerId={String(brokerId)} />
        </TabsContent>

        <TabsContent value="site-investors">
          <BrokerRegisteredInvestors brokerId={brokerId} />
        </TabsContent>

        <TabsContent value="referral">
          <ReferralSystem brokerId={String(brokerId)} brokerName={userName} />
        </TabsContent>

        <TabsContent value="settings">
          <ProfileSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewBrokerDashboard;