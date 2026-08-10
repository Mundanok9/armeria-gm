import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FirearmsPage } from './pages/FirearmsPage';
import { FirearmDetailPage } from './pages/FirearmDetailPage';
import { PecasPage } from './pages/PecasPage';
import { AgendamentosPage } from './pages/AgendamentosPage';
import { EmManutencaoPage } from './pages/EmManutencaoPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

import { FirearmFormModal } from './components/FirearmFormModal';
import { ManutencaoModal } from './components/ManutencaoModal';
import { AgendamentoModal } from './components/AgendamentoModal';
import { UserModal } from './components/UserModal';

import { Firearm, User, AgendamentoManutencao } from './types/index';
import { ApiService } from './services/api';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedFirearmId, setSelectedFirearmId] = useState<string | null>(null);

  // Modals state
  const [isFirearmModalOpen, setIsFirearmModalOpen] = useState(false);
  const [firearmToEdit, setFirearmToEdit] = useState<Firearm | null>(null);

  const [isManutencaoModalOpen, setIsManutencaoModalOpen] = useState(false);
  const [manutencaoFirearm, setManutencaoFirearm] = useState<Firearm | null>(null);

  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [agendamentoToEdit, setAgendamentoToEdit] = useState<AgendamentoManutencao | null>(null);
  const [preselectedAgendamentoFirearm, setPreselectedAgendamentoFirearm] = useState<Firearm | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [firearmFilters, setFirearmFilters] = useState<any>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider text-slate-300">ARMERIA GM — Inicializando ambiente seguro...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (tab: TabType, params?: any) => {
    setActiveTab(tab);
    if (params?.selectedId) {
      setSelectedFirearmId(params.selectedId);
    } else {
      setSelectedFirearmId(null);
    }
    if (params) {
      setFirearmFilters(params);
    }
  };

  const handleNavigateToOverdue = () => {
    setActiveTab('firearms');
    setSelectedFirearmId(null);
    setFirearmFilters({ atrasadas: true });
  };

  // Handlers for Modals
  const handleOpenNewFirearm = () => {
    setFirearmToEdit(null);
    setIsFirearmModalOpen(true);
  };

  const handleOpenEditFirearm = (firearm: Firearm) => {
    setFirearmToEdit(firearm);
    setIsFirearmModalOpen(true);
  };

  const handleSaveFirearm = async (firearmData: Partial<Firearm>) => {
    if (firearmToEdit) {
      await ApiService.updateFirearm(firearmToEdit.id, firearmData);
    } else {
      await ApiService.createFirearm(firearmData);
    }
    if (selectedFirearmId) {
      setSelectedFirearmId(selectedFirearmId);
    }
  };

  const handleDeleteFirearm = async (id: string) => {
    await ApiService.deleteFirearm(id);
    if (selectedFirearmId === id) {
      setSelectedFirearmId(null);
    }
  };

  const handleOpenManutencao = (firearm: Firearm) => {
    setManutencaoFirearm(firearm);
    setIsManutencaoModalOpen(true);
  };

  const handleOpenNewAgendamento = (firearm?: Firearm) => {
    setAgendamentoToEdit(null);
    setPreselectedAgendamentoFirearm(firearm || null);
    setIsAgendamentoModalOpen(true);
  };

  const handleOpenEditAgendamento = (agendamento: AgendamentoManutencao) => {
    setAgendamentoToEdit(agendamento);
    setPreselectedAgendamentoFirearm(null);
    setIsAgendamentoModalOpen(true);
  };

  const handleOpenNewUser = () => {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setUserToEdit(u);
    setIsUserModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <Header onNavigateToOverdue={handleNavigateToOverdue} />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedFirearmId(null);
          if (tab === 'agendamentos') {
            setFirearmFilters({ status: 'AGENDADO' });
          } else {
            setFirearmFilters({});
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedFirearmId ? (
          <FirearmDetailPage
            firearmId={selectedFirearmId}
            onBack={() => setSelectedFirearmId(null)}
            onOpenManutencao={handleOpenManutencao}
            onEdit={handleOpenEditFirearm}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardPage
                onNavigate={handleNavigate}
                onOpenNewFirearm={handleOpenNewFirearm}
              />
            )}

            {activeTab === 'firearms' && (
              <FirearmsPage
                onViewDetails={(f) => setSelectedFirearmId(f.id)}
                onOpenManutencao={handleOpenManutencao}
                onOpenAgendamento={(f) => handleOpenNewAgendamento(f)}
                onOpenNewModal={handleOpenNewFirearm}
                onEditFirearm={handleOpenEditFirearm}
                initialFilters={firearmFilters}
              />
            )}

            {(activeTab === 'em_manutencao' || activeTab === 'pecas') && (
              <EmManutencaoPage
                onViewFirearmDetails={(firearmId) => setSelectedFirearmId(firearmId)}
                onOpenManutencaoModal={handleOpenManutencao}
                onOpenAgendamentoModal={(firearm) => handleOpenNewAgendamento(firearm)}
                initialSubTab={activeTab === 'pecas' ? 'pecas' : 'bancada'}
              />
            )}

            {activeTab === 'agendamentos' && (
              <AgendamentosPage
                onViewFirearmDetails={(firearmId) => setSelectedFirearmId(firearmId)}
                onOpenManutencaoModal={handleOpenManutencao}
                onOpenNewAgendamentoModal={() => handleOpenNewAgendamento()}
                onOpenEditAgendamentoModal={handleOpenEditAgendamento}
                onNavigateToPecas={(search) => handleNavigate('em_manutencao', { search })}
                initialFilters={firearmFilters}
              />
            )}

            {activeTab === 'users' && user?.role === 'ADMIN' && (
              <UsersPage
                onOpenNewUser={handleOpenNewUser}
                onEditUser={handleOpenEditUser}
              />
            )}

            {activeTab === 'logs' && (user?.role === 'ADMIN' || user?.role === 'ARMEIRO') && (
              <AuditLogsPage />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <FirearmFormModal
        isOpen={isFirearmModalOpen}
        onClose={() => setIsFirearmModalOpen(false)}
        onSave={handleSaveFirearm}
        onDelete={handleDeleteFirearm}
        initialData={firearmToEdit}
      />

      <ManutencaoModal
        isOpen={isManutencaoModalOpen}
        onClose={() => setIsManutencaoModalOpen(false)}
        firearm={manutencaoFirearm}
        onSuccess={() => {
          if (selectedFirearmId) setSelectedFirearmId(selectedFirearmId);
        }}
      />

      <AgendamentoModal
        isOpen={isAgendamentoModalOpen}
        onClose={() => setIsAgendamentoModalOpen(false)}
        agendamentoToEdit={agendamentoToEdit}
        preselectedFirearm={preselectedAgendamentoFirearm}
        onSuccess={() => {
          // Reset or refresh handled inside page
        }}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={userToEdit}
        onSuccess={() => {}}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-medium">
        ARMERIA GM • Sistema Profissional de Gerenciamento de Armamento Municipal • Guarda Municipal
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
