import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  Calendar,
  ShieldCheck,
  FileText,
  LayoutDashboard,
  Menu,
  ChevronLeft,
  Music,
  BarChart3,
  Trophy,
  Droplet,
  Heart,
  PieChart,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Painel', icon: LayoutDashboard },
  { path: '/congregacoes', label: 'Congregações', icon: Building2 },
  { path: '/ministerio', label: 'Ministério', icon: Users },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/santa-ceia', label: 'Santa Ceia', icon: Droplet },
  { path: '/ensaios', label: 'Ensaios', icon: Music },
  { path: '/reforcos', label: 'Reforços', icon: ShieldCheck },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { path: '/resultados', label: 'Resultados', icon: Trophy },
  { path: '/estatisticas', label: 'Estatísticas', icon: PieChart },
  { path: '/listas', label: 'Listas', icon: FileText },
  { path: '/evangelizacao', label: 'Evangelização', icon: Heart },
  { path: '/administracao', label: 'Administração', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container - With smooth collapse animation */}
      <div 
        className={`transition-all duration-300 ${sidebarHidden ? 'w-0' : 'w-64'} hidden lg:flex overflow-hidden`}
      >
        {/* Sidebar */}
        <aside className="sidebar-gradient flex w-64 flex-col h-full">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border/50 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-amber-400 shadow-lg shadow-indigo-900/40">
              <Building2 className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-sidebar-foreground tracking-tight leading-none">
                ADM Ituiutaba
              </h1>
              <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 tracking-wide uppercase">
                CCB Admin
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm border border-white/10'
                      : 'text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground/90'
                  }`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-indigo-300' : 'text-sidebar-foreground/40'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border/30 p-4">
            <p className="text-[10px] text-sidebar-foreground/30 text-center tracking-widest uppercase">
              CCB Admin Suite • v1.0
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile Sidebar */}
      <aside
        className={`sidebar-gradient fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-all duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border/50 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-amber-400 shadow-lg shadow-indigo-900/40">
            <Building2 className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-sidebar-foreground tracking-tight leading-none">
              ADM Ituiutaba
            </h1>
            <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 tracking-wide uppercase">
              CCB Admin
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground rounded-lg p-1.5 hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm border border-white/10'
                    : 'text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground/90'
                }`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-indigo-300' : 'text-sidebar-foreground/40'}`} />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border/30 p-4">
          <p className="text-[10px] text-sidebar-foreground/30 text-center tracking-widest uppercase">
            CCB Admin Suite • v1.0
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col overflow-hidden flex-1 w-full">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:px-6 shadow-sm relative z-10">
          {sidebarHidden && (
            <button
              onClick={() => setSidebarHidden(false)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-all hidden lg:block hover:text-foreground"
              title="Mostrar menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-all lg:hidden hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
          {!sidebarHidden && (
            <button
              onClick={() => setSidebarHidden(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-all hidden lg:block hover:text-foreground"
              title="Ocultar menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground font-display tracking-tight">
              {navItems.find((i) => i.path === location.pathname)?.label || 'Painel'}
            </h2>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in-up">{children}</main>
      </div>
    </div>
  );
}
