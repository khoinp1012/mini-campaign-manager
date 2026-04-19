import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore errors
    }
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Analytics', path: '/', icon: 'monitoring' },
    { name: 'Campaigns', path: '/campaigns', icon: 'campaign' },
    { name: 'Recipients', path: '/recipients', icon: 'groups' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-surface-dim text-on-surface">
      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col h-screen w-64 border-r border-outline-variant/15 bg-surface-container-low shadow-[0px_24px_48px_rgba(6,14,32,0.4)] p-6 space-y-8 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-[0_0_20px_rgba(62,73,187,0.3)]">
            <span className="material-symbols-outlined text-on-primary">monitoring</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-primary tracking-tighter leading-tight">Campaign Manager</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Luminous Depth</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 group rounded-md ${
                  isActive
                    ? 'text-on-surface bg-surface-container-high shadow-[0_0_15px_rgba(62,73,187,0.15)]'
                    : 'text-on-surface-variant/70 hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'group-hover:translate-x-1 duration-200'}`}>
                  {item.icon}
                </span>
                <span className={`text-sm tracking-tight ${isActive ? 'font-semibold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-outline-variant/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant/70 hover:bg-surface-container-highest transition-all duration-300"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 overflow-y-auto bg-surface relative">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-10 py-6 sticky top-0 z-40 bg-surface-dim/60 backdrop-blur-xl">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent tracking-tight">
              {menuItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
            </h2>
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none w-64 transition-all duration-300 text-on-surface"
                placeholder="Search..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full border-2 border-surface"></span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface">{user?.name}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">{user?.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-primary/20 bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="px-10 pb-16 pt-4 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
