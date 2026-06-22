import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvestorFunnel from './InvestorFunnel';
import ReferralSystem from './ReferralSystem';
import BrokerObjectsManager from './broker/BrokerObjectsManager';
import AddNewObjectDialog from './broker/AddNewObjectDialog';

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="properties">Объекты</TabsTrigger>
          <TabsTrigger value="investors">Инвесторы</TabsTrigger>
          <TabsTrigger value="referral">Реферальная программа</TabsTrigger>
        </TabsList>

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

        <TabsContent value="referral">
          <ReferralSystem brokerId={String(brokerId)} brokerName={userName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewBrokerDashboard;
