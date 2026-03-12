import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function TopNavigation() {
  const { user, logout, isMonitor, canUpload } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'My Letters',
      show: true
    },
    {
      to: '/upload',
      label: 'New Letter',
      show: canUpload,
      highlight: true
    },
    {
      to: '/monitoring',
      label: 'All Letters',
      show: isMonitor
    },
  ].filter(item => item.show);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo-dark.png" 
              alt="Deyaar" 
              className="h-7 w-auto"
            />
            <div className="h-6 w-px bg-gray-200" />
            <span className="text-sm font-semibold text-gray-500">Letter Management</span>
          </div>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={() => {
                  const active = isActive(item.to);
                  return `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active 
                      ? 'bg-deyaar-orange text-white' 
                      : item.highlight
                        ? 'text-deyaar-orange hover:bg-deyaar-orange/10'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`;
                }}
              >
                <span className="flex items-center gap-2">
                  {item.highlight && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-deyaar-dark">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
              <div className="relative group">
                <button className="w-9 h-9 bg-gradient-to-br from-deyaar-orange to-deyaar-brown rounded-full flex items-center justify-center text-white font-bold text-sm hover:shadow-lg transition-shadow">
                  {user?.username.charAt(0).toUpperCase()}
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-deyaar-beige-light rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
