import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import OfflineBanner from './OfflineBanner';
import { NAVIGATION_ITEMS } from '../../constants/navigation';

// Wraps all protected views inside the responsive Sidebar/Navbar layout
export default function PageLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Find page title matching current URL path
  const currentItem = NAVIGATION_ITEMS.find((item) => item.path === location.pathname);
  const pageTitle = currentItem ? currentItem.label : 'PT. Sugity Creatives';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <OfflineBanner />

      {/* Dynamic sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Dynamic header navbar */}
        <Navbar 
          title={pageTitle} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        {/* Content canvas */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
