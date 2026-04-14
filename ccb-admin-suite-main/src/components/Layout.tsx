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
  { path: '/listas', label: 'Listas', icon: FileText },
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
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6 bg-sidebar-background/50 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-yellow-500 shadow-md">
              <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground font-sans">
                ADM Ituiutaba
              </h1>
              <p className="text-[10px] text-sidebar-foreground/60 font-sans">
                CCB Admin
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-2 p-3 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 font-sans ${
                    isActive
                      ? 'bg-gradient-to-r from-sidebar-primary to-yellow-500 text-sidebar-accent-foreground shadow-md'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
                  }`}
                >
                  <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-sidebar-primary-foreground' : ''}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border bg-sidebar-background/50 p-4">
            <p className="text-[10px] text-sidebar-foreground/40 text-center font-sans">
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
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6 bg-sidebar-background/50 backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-yellow-500 shadow-md">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground font-sans">
              ADM Ituiutaba
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60 font-sans">
              CCB Admin
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-lg p-1 hover:bg-sidebar-accent/20 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 font-sans ${
                  isActive
                    ? 'bg-gradient-to-r from-sidebar-primary to-yellow-500 text-sidebar-accent-foreground shadow-md'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-sidebar-primary-foreground' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border bg-sidebar-background/50 p-4">
          <p className="text-[10px] text-sidebar-foreground/40 text-center font-sans">
            CCB Admin Suite • v1.0
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col overflow-hidden flex-1 w-full">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-gradient-to-r from-card to-card/50 backdrop-blur-sm px-4 lg:px-8 shadow-sm relative z-10">
          {sidebarHidden && (
            <button
              onClick={() => setSidebarHidden(false)}
              className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted transition-all hidden lg:block hover:text-foreground"
              title="Mostrar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted transition-all lg:hidden hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          {!sidebarHidden && (
            <button
              onClick={() => setSidebarHidden(true)}
              className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted transition-all hidden lg:block hover:text-foreground"
              title="Ocultar menu"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground font-display">
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
