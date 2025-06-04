'use client';

import { 
  FolderOpen, 
  MessageSquare, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface SidebarProps {
  activeView: 'main' | 'files' | 'settings';
  onViewChange: (view: 'main' | 'files' | 'settings') => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'main' as const, icon: MessageSquare, label: 'Main', tooltip: 'AI Assistant & Chat' },
    { id: 'files' as const, icon: FolderOpen, label: 'Files', tooltip: 'File Manager & Branches' },
    { id: 'settings' as const, icon: SettingsIcon, label: 'Settings', tooltip: 'Settings' },
  ];

  return (
    <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <div className="text-blue-400 font-bold text-xl">C</div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full h-12 flex items-center justify-center mb-1 transition-colors
                hover:bg-gray-700 group relative
                ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}
              `}
              title={item.tooltip}
            >
              <Icon size={20} />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.tooltip}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
