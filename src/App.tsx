import React, { useState } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { ReceiptModal } from './components/ReceiptModal';
import { DesktopSidebar } from './components/DesktopSidebar';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { AdminDashboard } from './screens/AdminDashboard';
import { TablesScreen } from './screens/TablesScreen';
import { TableDetailScreen } from './screens/TableDetailScreen';
import { CreateOrderScreen } from './screens/CreateOrderScreen';
import { AddItemsScreen } from './screens/AddItemsScreen';
import { BillingScreen } from './screens/BillingScreen';
import { PaymentCollectionScreen } from './screens/PaymentCollectionScreen';
import { KitchenScreen } from './screens/KitchenScreen';
import { TakeawayScreen } from './screens/TakeawayScreen';
import { PaymentControlScreen } from './screens/PaymentControlScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { DailyClosingScreen } from './screens/DailyClosingScreen';
import { MenuManagementScreen } from './screens/MenuManagementScreen';
import { EmployeeManagementScreen } from './screens/EmployeeManagementScreen';
import { OrdersListScreen } from './screens/OrdersListScreen';
import { NotificationsModal } from './screens/NotificationsModal';
import { ProfileScreen } from './screens/ProfileScreen';

import { Table, Order } from './types';

const MainApp: React.FC = () => {
  const { isLoggedIn, currentUser, getOrderById, tables, orders } = useRestaurant();

  // Screen navigation state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [isAddingItems, setIsAddingItems] = useState<boolean>(false);
  const [isViewingBill, setIsViewingBill] = useState<boolean>(false);
  const [isCollectingPayment, setIsCollectingPayment] = useState<boolean>(false);
  const [isViewingClosing, setIsViewingClosing] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // If not logged in, show Login
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Navigation handlers
  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
  };

  const handleCreateOrderForTable = (table: Table) => {
    setSelectedTable(table);
    setIsCreatingOrder(true);
  };

  const handleOrderCreated = (orderId: string) => {
    setIsCreatingOrder(false);
    // Find updated table
    const tableNum = selectedTable?.number;
    const updatedTable = tables.find((t) => t.number === tableNum) || selectedTable;
    setSelectedTable(updatedTable || null);
  };

  const handleOpenAddItems = (order: Order) => {
    setSelectedOrder(order);
    setIsAddingItems(true);
  };

  const handleAdditionSent = () => {
    setIsAddingItems(false);
  };

  const handleOpenBilling = (order: Order) => {
    setSelectedOrder(order);
    setIsViewingBill(true);
  };

  const handleOpenPayment = (order: Order) => {
    setSelectedOrder(order);
    setIsCollectingPayment(true);
  };

  const handlePaymentSubmitted = () => {
    setIsCollectingPayment(false);
    setIsViewingBill(false);
    setSelectedTable(null);
    setSelectedOrder(null);
  };

  const handleReviewPayment = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab('payments');
  };

  const handleSelectOrderFromList = (order: Order) => {
    setSelectedOrder(order);
    if (order.tableNumber) {
      const table = tables.find((t) => t.number === order.tableNumber);
      if (table) {
        setSelectedTable(table);
        return;
      }
    }
    // Else open bill directly
    setIsViewingBill(true);
  };

  const renderMainContent = () => {
    if (isAddingItems && selectedOrder) {
      return (
        <AddItemsScreen
          order={selectedOrder}
          onBack={() => setIsAddingItems(false)}
          onAdditionSent={handleAdditionSent}
        />
      );
    }

    if (isCreatingOrder && selectedTable) {
      return (
        <CreateOrderScreen
          table={selectedTable}
          onBack={() => setIsCreatingOrder(false)}
          onOrderCreated={handleOrderCreated}
        />
      );
    }

    if (isCollectingPayment && selectedOrder) {
      return (
        <PaymentCollectionScreen
          order={selectedOrder}
          onBack={() => setIsCollectingPayment(false)}
          onPaymentSubmitted={handlePaymentSubmitted}
        />
      );
    }

    if (isViewingBill && selectedOrder) {
      return (
        <BillingScreen
          order={selectedOrder}
          onBack={() => setIsViewingBill(false)}
          onProceedToPayment={(ord) => {
            setIsViewingBill(false);
            handleOpenPayment(ord);
          }}
        />
      );
    }

    if (isViewingClosing) {
      return <DailyClosingScreen onBack={() => setIsViewingClosing(false)} />;
    }

    if (selectedTable) {
      return (
        <TableDetailScreen
          table={selectedTable}
          onBack={() => setSelectedTable(null)}
          onAddItems={handleOpenAddItems}
          onViewBill={handleOpenBilling}
          onCollectPayment={handleOpenPayment}
          onReviewPayment={handleReviewPayment}
        />
      );
    }

    return renderTabContent();
  };

  // Active Primary Tab Screen Rendering
  const renderTabContent = () => {
    // Admin role routing
    if (currentUser.role === 'admin') {
      switch (activeTab) {
        case 'home':
          return (
            <AdminDashboard
              onNavigateToPayments={() => setActiveTab('payments')}
              onNavigateToTables={() => setActiveTab('tables')}
              onNavigateToOrders={() => setActiveTab('orders')}
              onNavigateToReports={() => setActiveTab('reports')}
              onNavigateToMenu={() => setActiveTab('menu')}
              onNavigateToEmployees={() => setActiveTab('employees')}
              onReviewPayment={handleReviewPayment}
            />
          );
        case 'tables':
          return (
            <TablesScreen
              onSelectTable={handleSelectTable}
              onCreateOrderForTable={handleCreateOrderForTable}
            />
          );
        case 'takeaway':
          return (
            <TakeawayScreen
              onViewBill={handleOpenBilling}
              onCollectPayment={handleOpenPayment}
            />
          );
        case 'payments':
          return (
            <PaymentControlScreen
              onViewBill={handleOpenBilling}
              selectedOrderForReview={selectedOrder}
              onClearSelectedOrder={() => setSelectedOrder(null)}
            />
          );
        case 'reports':
          return (
            <ReportsScreen
              onNavigateToDailyClosing={() => setIsViewingClosing(true)}
            />
          );
        case 'menu':
          return <MenuManagementScreen />;
        case 'employees':
          return <EmployeeManagementScreen />;
        case 'orders':
          return (
            <OrdersListScreen
              onSelectOrder={handleSelectOrderFromList}
              onViewBill={handleOpenBilling}
            />
          );
        case 'profile':
          return (
            <ProfileScreen
              onNavigateToClosing={() => setIsViewingClosing(true)}
              onNavigateToMenu={() => setActiveTab('menu')}
              onNavigateToStaff={() => setActiveTab('employees')}
            />
          );
        default:
          return (
            <AdminDashboard
              onNavigateToPayments={() => setActiveTab('payments')}
              onNavigateToTables={() => setActiveTab('tables')}
              onNavigateToOrders={() => setActiveTab('orders')}
              onNavigateToReports={() => setActiveTab('reports')}
              onNavigateToMenu={() => setActiveTab('menu')}
              onNavigateToEmployees={() => setActiveTab('employees')}
              onReviewPayment={handleReviewPayment}
            />
          );
      }
    }

    // Dining Staff role routing
    if (currentUser.role === 'dining') {
      switch (activeTab) {
        case 'tables':
          return (
            <TablesScreen
              onSelectTable={handleSelectTable}
              onCreateOrderForTable={handleCreateOrderForTable}
            />
          );
        case 'takeaway':
          return (
            <TakeawayScreen
              onViewBill={handleOpenBilling}
              onCollectPayment={handleOpenPayment}
            />
          );
        case 'orders':
          return (
            <OrdersListScreen
              onSelectOrder={handleSelectOrderFromList}
              onViewBill={handleOpenBilling}
            />
          );
        case 'profile':
          return <ProfileScreen />;
        default:
          return (
            <TablesScreen
              onSelectTable={handleSelectTable}
              onCreateOrderForTable={handleCreateOrderForTable}
            />
          );
      }
    }

    // Kitchen Staff role routing
    if (currentUser.role === 'kitchen') {
      switch (activeTab) {
        case 'kitchen':
          return <KitchenScreen />;
        case 'menu':
          return <MenuManagementScreen />;
        case 'profile':
          return <ProfileScreen />;
        default:
          return <KitchenScreen />;
      }
    }

    // Takeaway Staff role routing
    if (currentUser.role === 'takeaway') {
      switch (activeTab) {
        case 'takeaway':
          return (
            <TakeawayScreen
              onViewBill={handleOpenBilling}
              onCollectPayment={handleOpenPayment}
            />
          );
        case 'orders':
          return (
            <OrdersListScreen
              onSelectOrder={handleSelectOrderFromList}
              onViewBill={handleOpenBilling}
            />
          );
        case 'profile':
          return <ProfileScreen />;
        default:
          return (
            <TakeawayScreen
              onViewBill={handleOpenBilling}
              onCollectPayment={handleOpenPayment}
            />
          );
      }
    }

    return null;
  };

  const isSubflowActive =
    (isAddingItems && selectedOrder !== null) ||
    (isCreatingOrder && selectedTable !== null) ||
    (isCollectingPayment && selectedOrder !== null) ||
    (isViewingBill && selectedOrder !== null) ||
    isViewingClosing ||
    selectedTable !== null;

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#242424] flex lg:flex-row flex-col font-sans selection:bg-[#C94B4B]/20 selection:text-[#C94B4B]">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setSelectedTable(null);
          setSelectedOrder(null);
          setIsCreatingOrder(false);
          setIsAddingItems(false);
          setIsViewingBill(false);
          setIsCollectingPayment(false);
          setIsViewingClosing(false);
          setActiveTab(tabId);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenClosing={() => setIsViewingClosing(true)}
      />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        {!isSubflowActive && (
          <Header
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-md mx-auto lg:max-w-none lg:p-6 pb-24 lg:pb-6 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>

      {/* Role-Aware Bottom Navigation */}
      {!isSubflowActive && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            setSelectedTable(null);
            setSelectedOrder(null);
            setIsCreatingOrder(false);
            setIsAddingItems(false);
            setIsViewingBill(false);
            setIsCollectingPayment(false);
            setIsViewingClosing(false);
            setActiveTab(tabId);
          }}
          onTabChange={setActiveTab}
        />
      )}

      {/* Global Thermal Receipt Modal Simulator */}
      <ReceiptModal />

      {/* Global Notifications Drawer/Modal */}
      {isNotificationsOpen && (
        <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />
      )}
    </div>
  );
};

export function App() {
  return (
    <RestaurantProvider>
      <MainApp />
      <Toast />
    </RestaurantProvider>
  );
}

export default App;
