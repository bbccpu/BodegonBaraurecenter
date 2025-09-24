import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '../../types';
import '../../types';
import { NotificationProvider } from '../../context/NotificationContext';
import NotificationBell from '../NotificationBell';

const mainLinks = [
  { name: 'Resumen', path: '/panel/resumen', icon: 'pie-chart-outline' },
  { name: 'Analytics', path: '/panel/analytic', icon: 'stats-chart-outline' },
];

const managementLinks = [
  { name: 'Caja', path: '/panel/caja', icon: 'cash-outline' },
  { name: 'Stock', path: '/panel/stock', icon: 'archive-outline' },
  { name: 'Clientes', path: '/panel/clientes', icon: 'people-outline' },
  { name: 'Suministros', path: '/panel/suministros', icon: 'cube-outline' },
];

const salesLinks = [
    { name: 'Pedidos', path: '/panel/pedidos', icon: 'cart-outline' },
    { name: 'Pagos', path: '/panel/pagos', icon: 'card-outline' },
];


const adminLinks = [
    { name: 'Usuarios', path: '/panel/usuarios', icon: 'people-circle-outline' },
    { name: 'Perfil', path: '/panel/profile', icon: 'person-circle-outline' },
];

const NavItem: React.FC<{ link: { name: string, path: string, icon: string } }> = ({ link }) => {
    const linkClasses = "flex items-center p-3 my-1 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors";
    const activeLinkClasses = "bg-primary-orange text-white";
    return (
        <li>
            <NavLink
                to={link.path}
                className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            >
                <ion-icon name={link.icon} className="mr-3 text-2xl"></ion-icon>
                <span className="font-medium">{link.name}</span>
            </NavLink>
        </li>
    );
};

const NavGroup: React.FC<{ title: string, children: React.ReactNode}> = ({ title, children }) => {
    if (React.Children.count(children) === 0) {
        return null;
    }
    return (
        <>
            <hr className="my-3 border-gray-600"/>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
            {children}
        </>
    );
};

const UserPanelLayout: React.FC<{ children: React.ReactNode, userRole: UserRole | null }> = ({ children, userRole }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <NotificationProvider userRole={userRole}>
      <div className="flex min-h-[calc(100vh-72px)]">
        {/* Mobile backdrop */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>

        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 p-4 transform transition-transform duration-300 ease-in-out md:sticky md:translate-x-0 md:top-0 md:h-full md:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h2 className="text-xl font-bold text-white">Panel</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-white">
              <ion-icon name="close-outline" style={{fontSize: '28px'}}></ion-icon>
            </button>
          </div>
          <nav className="overflow-y-auto h-[calc(100%-4rem)] md:h-full">
            <ul>
              {userRole === 'T3' && mainLinks.map(link => <NavItem key={link.name} link={link} />)}

              <NavGroup title="Gestión">
                  {managementLinks.filter(link => {
                      if (userRole === 'T3') return true;
                      if (userRole === 'T2') return link.name === 'Caja' || link.name === 'Stock';
                      return false;
                  }).map(link => <NavItem key={link.name} link={link} />)}
              </NavGroup>

              {(userRole === 'T2' || userRole === 'T3') && (
                  <NavGroup title="Ventas">
                      {salesLinks.filter(link => {
                          if (userRole === 'T3') return true;
                          if (userRole === 'T2') return link.name === 'Pedidos';
                          return false;
                      }).map(link => <NavItem key={link.name} link={link} />)}
                  </NavGroup>
              )}


              <NavGroup title="Administración">
                    {adminLinks.filter(link => {
                      if (userRole === 'T3') return true;
                      if (userRole === 'T2' || userRole === 'T1') return link.name === 'Perfil';
                      return false;
                  }).map(link => <NavItem key={link.name} link={link} />)}
              </NavGroup>
            </ul>
          </nav>
        </aside>
        <main className="flex-1 bg-gray-900 overflow-y-auto">
          {/* Header with notifications */}
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-700">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-white">
              <ion-icon name="menu-outline" style={{fontSize: '28px'}}></ion-icon>
            </button>
            <NotificationBell />
          </div>
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default UserPanelLayout;
