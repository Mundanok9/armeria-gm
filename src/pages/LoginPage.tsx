import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, User as UserIcon, Lock, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!matricula || !password) {
      setError('Por favor, digite sua Matrícula (ou E-mail) e a Senha.');
      return;
    }

    setLoading(true);
    try {
      await login(matricula, password);
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique os dados fornecidos.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (mat: string, pass: string) => {
    setMatricula(mat);
    setPassword(pass);
    setError('');
  };

  const handleDirectTestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login('TESTE', 'teste123');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login de teste.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Container Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background glow accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-sky-600/30 mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            ARMERIA GM
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Sistema de Controle de Armamentos & Cautelas da Guarda Municipal
          </p>
        </div>

        {/* Direct 1-Click Test Access Banner */}
        <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
          <p className="text-xs font-bold text-emerald-300 mb-2">
            🚀 Testando no Vercel ou Ambiente de Demonstração?
          </p>
          <button
            type="button"
            onClick={handleDirectTestLogin}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4 text-emerald-200" />
            <span>Entrar com Login de Teste (1-Clique)</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Matrícula ou E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <UserIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: TESTE, GM-001 ou armeiro@armeria.gm.gov.br"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50 mt-6"
          >
            <span>{loading ? 'Autenticando...' : 'Acessar Armeria'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials Panel for testing convenience */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center space-x-1">
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            <span>Preenchimento Rápido</span>
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => fillQuickLogin('TESTE', 'teste123')}
              className="bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 p-2 rounded-xl text-center transition cursor-pointer"
            >
              <p className="text-[10px] font-bold text-emerald-400">TESTE</p>
              <p className="text-[11px] font-semibold text-white">TESTE</p>
            </button>

            <button
              onClick={() => fillQuickLogin('GM-001', 'admin123')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 p-2 rounded-xl text-center transition cursor-pointer"
            >
              <p className="text-[10px] font-bold text-rose-400">ADMIN</p>
              <p className="text-[11px] font-semibold text-white">GM-001</p>
            </button>

            <button
              onClick={() => fillQuickLogin('GM-002', 'armeiro123')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 p-2 rounded-xl text-center transition cursor-pointer"
            >
              <p className="text-[10px] font-bold text-amber-400">ARMEIRO</p>
              <p className="text-[11px] font-semibold text-white">GM-002</p>
            </button>

            <button
              onClick={() => fillQuickLogin('GM-104', 'guarda123')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 p-2 rounded-xl text-center transition cursor-pointer"
            >
              <p className="text-[10px] font-bold text-sky-400">GUARDA</p>
              <p className="text-[11px] font-semibold text-white">GM-104</p>
            </button>
          </div>
        </div>

      </div>

      <footer className="mt-6 text-center text-xs text-slate-500 font-medium">
        ARMERIA GM v1.0 • Desenvolvido com Clean Architecture & Material 3
      </footer>
    </div>
  );
};
