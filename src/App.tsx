import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

const AccessDeniedView: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm">
      <ShieldAlert className="w-8 h-8" />
    </div>
    <h2 className="text-[20px] font-extrabold text-[#242424]">Access Denied</h2>
    <p className="text-[13px] text-[#737373] mt-1.5 max-w-sm">
      You do not have the required role permissions to access this management area.
    </p>
    <button
      onClick={onGoBack}
      className="mt-6 py-2.5 px-5 rounded-xl bg-[#242424] text-white font-bold text-[13px] flex items-center gap-2 hover:bg-black transition-all active:scale-95"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Return to Your Dashboard</span>
    </button>
  </div>
);

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const { tables } = useRestaurant();

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

  // Set default persona tab upon authentication or role switch
  useEffect(() => {
    setSelectedTable(null);
    setSelectedOrder(null);
    setIsCreatingOrder(false);
    setIsAddingItems(false);
    setIsViewingBill(false);
    setIsCollectingPayment(false);
    setIsViewingClosing(false);
    if (role === 'admin') setActiveTab('home');
    else if (role === 'dining') setActiveTab('tables');
    else if (role === 'kitchen') setActiveTab('kitchen');
    else if (role === 'takeaway') setActiveTab('takeaway');
  }, [role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C94B4B]" />
        <span className="text-[13px] font-bold text-[#737373]">Connecting to ServeFlow...</span>
      </div>
    );
  }

  // If not logged in, show unified LoginScreen
  if (!isAuthenticated) {
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

  const handleOrderCreated = () => {
    setIsCreatingOrder(false);
    setSelectedTable(null);
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
    setIsViewingBill(true);
  };

  const renderMainContent = () => {
    // 1. Kitchen KDS Board: Always render KitchenScreen immediately when activeTab is 'kitchen'!
    // Under no circumstances should dining table detail or other subviews hijack the kitchen screen.
    if (activeTab === 'kitchen') {
      return <KitchenScreen />;
    }

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
      if (role !== 'admin') {
        return <AccessDeniedView onGoBack={() => setIsViewingClosing(false)} />;
      }
      return <DailyClosingScreen onBack={() => setIsViewingClosing(false)} />;
    }

    // Only render TableDetailScreen if activeTab is 'tables' or 'home'
    if (selectedTable && (activeTab === 'tables' || activeTab === 'home')) {
      return (
        <TableDetailScreen
          table={selectedTable}
          onBack={() => setSelectedTable(null)}
          onAddItems={handleOpenAddItems}
          onViewBill={handleOpenBilling}
          onCollectPayment={handleOpenPayment}
          onReviewPayment={handleReviewPayment}
          onNavigateToKitchen={() => {
            setSelectedTable(null);
            setActiveTab('kitchen');
          }}
        />
      );
    }

    return renderTabContent();
  };

  // Role-Based Screen Router & Guard
  const renderTabContent = () => {
    // ADMIN PERSONA
    if (role === 'admin') {
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
        case 'kitchen':
          return <KitchenScreen />;
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

    // DINING PERSONA
    if (role === 'dining') {
      // Guard against admin routes
      if (['home', 'payments', 'reports', 'employees'].includes(activeTab)) {
        return <AccessDeniedView onGoBack={() => setActiveTab('tables')} />;
      }

      switch (activeTab) {
        case 'tables':
          return (
            <TablesScreen
              onSelectTable={handleSelectTable}
              onCreateOrderForTable={handleCreateOrderForTable}
            />
          );
        case 'kitchen':
          return <KitchenScreen />;
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

    // KITCHEN PERSONA
    if (role === 'kitchen') {
      if (['home', 'tables', 'takeaway', 'payments', 'reports', 'employees'].includes(activeTab)) {
        return <AccessDeniedView onGoBack={() => setActiveTab('kitchen')} />;
      }

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

    // TAKEAWAY PERSONA
    if (role === 'takeaway') {
      if (['home', 'tables', 'payments', 'reports', 'employees', 'kitchen'].includes(activeTab)) {
        return <AccessDeniedView onGoBack={() => setActiveTab('takeaway')} />;
      }

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
    activeTab !== 'kitchen' &&
    ((isAddingItems && selectedOrder !== null) ||
      (isCreatingOrder && selectedTable !== null) ||
      (isCollectingPayment && selectedOrder !== null) ||
      (isViewingBill && selectedOrder !== null) ||
      isViewingClosing ||
      (selectedTable !== null && (activeTab === 'tables' || activeTab === 'home')));

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

      {/* Global Thermal Receipt Modal */}
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
    <AuthProvider>
      <RestaurantProvider>
        <MainApp />
        <Toast />
      </RestaurantProvider>
    </AuthProvider>
  );
}

export default App;
