import React, { useState } from 'react';
import { FabricStoreProvider, useFabricStore } from './context/FabricStoreContext';
import { TopBar, ActiveTab } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { POMaster } from './components/POMaster';
import { FabricReceive } from './components/FabricReceive';
import { FabricIssue } from './components/FabricIssue';
import { InventoryReport } from './components/InventoryReport';
import { RackManagement } from './components/RackManagement';
import { SlowMovingReport } from './components/SlowMovingReport';
import { UserManagement } from './components/UserManagement';
import { LoginPage } from './components/LoginPage';

function AppContent() {
  const { isAuthenticated, currentUser } = useFabricStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [targetPoForAction, setTargetPoForAction] = useState<string | undefined>(undefined);

  // When not authenticated, show the login portal
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigateToReceive = (poNumber?: string) => {
    setTargetPoForAction(poNumber);
    setActiveTab('receive');
  };

  const handleNavigateToIssue = (poNumber?: string) => {
    setTargetPoForAction(poNumber);
    setActiveTab('issue');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Universal 3-zone Top Navigation */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={tab => {
          setTargetPoForAction(undefined);
          setActiveTab(tab);
        }}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onNavigateToReceive={handleNavigateToReceive}
            onNavigateToIssue={handleNavigateToIssue}
          />
        )}

        {activeTab === 'pos' && (
          <POMaster
            onNavigateToReceive={handleNavigateToReceive}
            onNavigateToIssue={handleNavigateToIssue}
          />
        )}

        {activeTab === 'receive' && (
          <FabricReceive
            key={`rcv-${targetPoForAction || 'default'}`}
            initialPoNumber={targetPoForAction}
          />
        )}

        {activeTab === 'issue' && (
          <FabricIssue
            key={`iss-${targetPoForAction || 'default'}`}
            initialPoNumber={targetPoForAction}
          />
        )}

        {activeTab === 'inventory' && <InventoryReport />}

        {activeTab === 'racks' && <RackManagement />}

        {activeTab === 'slow-moving' && <SlowMovingReport />}

        {activeTab === 'users' && currentUser.role === 'master_admin' && <UserManagement />}
      </main>

      {/* Industrial Footer adhering to anti-slop rules */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">FELIX FABRIC STORE MANAGEMENT</span>
            <span>·</span>
            <span>Fabric Store &amp; Garment Warehouse Management System</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>PO Master</span>
            <span>·</span>
            <span>Continuous Auto-Serial Rolls</span>
            <span>·</span>
            <span>Partial Issue</span>
            <span>·</span>
            <span>Rack Control</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FabricStoreProvider>
      <AppContent />
    </FabricStoreProvider>
  );
}
