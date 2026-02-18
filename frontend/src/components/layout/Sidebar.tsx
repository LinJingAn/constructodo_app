import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUnreadChat } from '@/hooks/useUnreadChat';
import {
  Home,
  User,
  FileText,
  MessageSquare,
  Mail,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ShoppingBag,
  ChevronLeft,
  History,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  userType: 'client' | 'professional';
  onLogout: () => void;
}

export function Sidebar({ userType, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { total: unreadTotal } = useUnreadChat();

  const clientNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/profile', label: 'Mi Perfil', icon: User },
    { href: '/projects/new', label: 'Publicar proyecto', icon: FileText },
    { href: '/my-projects', label: 'Mis Proyectos', icon: Building2 },
    { href: '/transaction-history', label: 'Historial de transacciones', icon: History },
    { href: '/balance', label: 'Mi saldo', icon: Wallet },
    { href: '/chat', label: 'Mensajes', icon: Mail },
    { href: '/my-reviews', label: 'Mis Reseñas', icon: Star },
    { href: '/materials', label: 'Materiales', icon: ShoppingBag },
  ];

  const professionalNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/profile', label: 'Mi Perfil', icon: User },
    { href: '/available-projects', label: 'Proyectos disponibles', icon: FileText },
    { href: '/my-quotes', label: 'Mis ofertas', icon: MessageSquare },
    { href: '/transaction-history', label: 'Historial de transacciones', icon: History },
    { href: '/balance', label: 'Mi saldo', icon: Wallet },
    { href: '/chat', label: 'Mensajes', icon: Mail },
    { href: '/my-reviews', label: 'Mis Reseñas', icon: Star },
  ];

  const navItems = userType === 'client' ? clientNavItems : professionalNavItems;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-6",
        collapsed && "justify-center px-2"
      )}>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white">CONSTRUCTODO</h1>
            <p className="text-xs text-slate-300">
              {userType === 'client' ? 'Portal Cliente' : 'Portal Profesional'}
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-slate-600" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const showBadge =
              unreadTotal > 0 &&
              (item.href === '/chat' ||
                (userType === 'client' && item.href === '/my-projects') ||
                (userType === 'professional' && item.href === '/my-quotes'));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative",
                  "hover:bg-slate-700/50",
                  isActive && "bg-amber-500/20 text-amber-400 border-l-2 border-amber-400",
                  !isActive && "text-slate-300",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-amber-400")} />
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {showBadge && (
                      <span className="ml-auto min-w-[20px] rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                        {unreadTotal > 99 ? '99+' : unreadTotal}
                      </span>
                    )}
                  </>
                )}
                {collapsed && showBadge && (
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 h-4 min-w-[16px] rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center">
                    {unreadTotal > 9 ? '9+' : unreadTotal}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-600" />

      {/* Bottom Actions */}
      <div className="p-3 space-y-1">
        <Link
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "text-slate-300 hover:bg-slate-700/50",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Configuración</span>}
        </Link>
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "text-red-400 hover:bg-red-500/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 text-white hover:bg-slate-700"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-gradient-to-b from-slate-800 to-slate-900 z-40",
          "transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-20" : "lg:w-64",
          "w-64"
        )}
      >
        <NavContent />
        {/* Circular collapse/expand button on the edge of the navbar - desktop only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden lg:flex absolute top-20 -right-3 z-50 h-8 w-8 rounded-full border-2 border-slate-600 bg-slate-800 text-slate-200 shadow-lg",
            "hover:bg-amber-500 hover:text-white hover:border-amber-400 transition-colors"
          )}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </aside>

      {/* Spacer for main content */}
      <div className={cn(
        "hidden lg:block transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )} />
    </>
  );
}