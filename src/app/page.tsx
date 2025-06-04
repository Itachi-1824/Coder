'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ProjectExplorer from '@/components/ProjectExplorerNew';
import MainSection from '@/components/MainSectionNew';
import FileEditor from '@/components/FileEditor';
import Settings from '@/components/Settings';
import { useProjectStore } from '@/store/projectStore';
import { useBranchStore } from '@/store/branchStore';
import { useSwipeGestures, usePullToRefresh } from '@/hooks/useSwipeGestures';

export default function Home() {
  const [activeView, setActiveView] = useState<'main' | 'files' | 'settings'>('main');
  const [messageCount, setMessageCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { selectedFile, setSelectedFile } = useProjectStore();
  const { getCurrentBranch, updateBranchFiles } = useBranchStore();

  // Get current branch and message count
  const currentBranch = getCurrentBranch();
  
  useEffect(() => {
    if (currentBranch?.chatHistory) {
      setMessageCount(Math.max(0, currentBranch.chatHistory.length - 1)); // Subtract 1 for welcome message
    }
  }, [currentBranch?.chatHistory]);

  // View navigation order for swipe gestures
  const viewOrder: ('main' | 'files' | 'settings')[] = ['main', 'files', 'settings'];
  
  const navigateToView = (direction: 'next' | 'prev') => {
    const currentIndex = viewOrder.indexOf(activeView);
    let newIndex: number;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % viewOrder.length;
    } else {
      newIndex = (currentIndex - 1 + viewOrder.length) % viewOrder.length;
    }
    
    setActiveView(viewOrder[newIndex]);
    
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate refresh action - in real app this would refresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsRefreshing(false);
  };

  // Set up swipe gestures for main content area
  const swipeRef = useSwipeGestures<HTMLDivElement>({
    onSwipeLeft: () => navigateToView('next'),
    onSwipeRight: () => navigateToView('prev'),
    threshold: 100
  });

  // Set up pull-to-refresh for main content
  const refreshRef = usePullToRefresh<HTMLDivElement>(handleRefresh, 80);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    setActiveView('files');
  };

  const handleFileClose = () => {
    setSelectedFile(null);
  };

  const handleFileSave = (filePath: string, content: string) => {
    const currentBranch = getCurrentBranch();
    if (!currentBranch) return;

    // Update file content in the current branch
    interface FileNode {
      name: string;
      path: string;
      type: 'file' | 'folder';
      content?: string;
      children?: FileNode[];
      expanded?: boolean;
      size?: number;
      lastModified?: Date;
      isNew?: boolean;
    }
    
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === filePath && node.type === 'file') {
          return { ...node, content, lastModified: new Date() };
        }
        if (node.children && node.type === 'folder') {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    
    const updatedFileTree = updateNode(currentBranch.fileTree || []);
    updateBranchFiles(currentBranch.id, updatedFileTree);
  };

  const renderMainContent = () => {
    const currentBranch = getCurrentBranch();
    
    // If a file is selected in files view, show appropriate layout based on screen size
    if (activeView === 'files' && selectedFile) {
      return (
        <>
          {/* Desktop: Side-by-side layout */}
          <div className="hidden sm:flex flex-1 overflow-hidden">
            <ProjectExplorer onFileSelect={handleFileSelect} currentBranch={currentBranch} />
            <FileEditor 
              filePath={selectedFile} 
              onClose={handleFileClose} 
              onSave={handleFileSave}
            />
          </div>
          
          {/* Mobile: Full-screen file editor only */}
          <div className="sm:hidden flex-1 overflow-hidden">
            <FileEditor 
              filePath={selectedFile} 
              onClose={handleFileClose} 
              onSave={handleFileSave}
            />
          </div>
        </>
      );
    }
    
    switch (activeView) {
      case 'main':
        return <MainSection />;
      case 'files':
        return <ProjectExplorer onFileSelect={handleFileSelect} currentBranch={currentBranch} />;
      case 'settings':
        return <Settings />;
      default:
        return <MainSection />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden sm:block">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Refresh Indicator */}
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-blue-600 text-white text-center py-3 animate-slide-down">
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-sm font-semibold">Refreshing...</span>
            </div>
          </div>
        )}
        
        {/* View Transition Indicator - Mobile Only */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 sm:hidden">
          <div className="flex gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-full border border-white/10">
            {viewOrder.map((view) => (
              <div
                key={view}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  view === activeView ? 'w-6 bg-blue-500' : 'w-1.5 bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Main Content Container */}
        <div className="flex-1 overflow-hidden pt-12 sm:pt-0">
          {renderMainContent()}
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="sm:hidden bg-black/30 backdrop-blur-md border-t border-white/10">
          <div className="flex justify-center p-4">
            <div className="flex bg-black/50 backdrop-blur-md rounded-full p-2 border border-white/10">
              {[
                { id: 'main' as const, label: 'Chat', icon: '💬', badge: messageCount > 0 ? messageCount : null },
                { id: 'files' as const, label: 'Files', icon: '📁', badge: selectedFile ? '•' : null },
                { id: 'settings' as const, label: 'Settings', icon: '⚙️', badge: null }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`
                    relative flex flex-col items-center justify-center 
                    min-w-[64px] min-h-[48px] px-3 py-2 mx-1 rounded-full
                    transition-all duration-300 
                    ${activeView === item.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <div className="text-lg leading-none mb-1">{item.icon}</div>
                  <div className="text-xs font-medium">{item.label}</div>
                  
                  {/* Badge/Indicator */}
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 text-xs font-bold bg-red-500 text-white">
                      {item.badge}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
