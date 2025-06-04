'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  X, 
  Copy, 
  Download, 
  Edit3, 
  Move, 
  Trash2,
  FileText,
  Code,
  Search,
  Replace,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBranchStore } from '@/store/branchStore';

interface FileEditorProps {
  filePath?: string;
  onClose: () => void;
  onSave: (path: string, content: string) => void;
}

interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
  isDirty: boolean;
  language: string;
}

export default function FileEditor({ filePath, onClose, onSave }: FileEditorProps) {
  const { getCurrentBranch, updateBranchFiles } = useBranchStore();
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentBranch = getCurrentBranch();

  // Language detection based on file extension
  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'bash',
      'php': 'php',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'rs': 'rust',
      'go': 'go'
    };
    return languageMap[extension || ''] || 'text';
  };

  // Find file content in current branch
  const findFileContent = (path: string): string => {
    if (!currentBranch) return '';
    
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
    
    const findInNodes = (nodes: FileNode[], targetPath: string): string => {
      for (const node of nodes) {
        if (node.path === targetPath && node.type === 'file') {
          return node.content || '';
        }
        if (node.children && node.type === 'folder') {
          const found = findInNodes(node.children, targetPath);
          if (found !== '') return found;
        }
      }
      return '';
    };
    
    return findInNodes(currentBranch.fileTree || [], path);
  };

  // Open file in new tab
  useEffect(() => {
    if (filePath) {
      const content = findFileContent(filePath);
      const fileName = filePath.split('/').pop() || 'untitled';
      const language = getLanguageFromPath(filePath);
      
      const newTab: EditorTab = {
        id: `tab-${Date.now()}`,
        filePath,
        fileName,
        content,
        isDirty: false,
        language
      };
      
      setTabs(prev => {
        const existingTab = prev.find(tab => tab.filePath === filePath);
        if (existingTab) {
          setActiveTab(existingTab.id);
          return prev;
        }
        return [...prev, newTab];
      });
      setActiveTab(newTab.id);
    }
  }, [filePath, findFileContent]);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const updateTabContent = (tabId: string, content: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, content, isDirty: true }
        : tab
    ));
  };

  const saveTab = async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !currentBranch) return;
    
    // Update file in current branch
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
        if (node.path === tab.filePath && node.type === 'file') {
          return { ...node, content: tab.content, lastModified: new Date() };
        }
        if (node.children && node.type === 'folder') {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    
    const updatedFileTree = updateNode(currentBranch.fileTree || []);
    updateBranchFiles(currentBranch.id, updatedFileTree);
    
    // Mark tab as saved
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, isDirty: false } : t
    ));
    
    onSave(tab.filePath, tab.content);
  };

  const closeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to close this file?')) {
        return;
      }
    }
    
    setTabs(prev => prev.filter(t => t.id !== tabId));
    
    if (activeTab === tabId) {
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTab(remainingTabs[0].id);
      } else {
        setActiveTab(null);
        onClose();
      }
    }
  };

  const handleSearch = () => {
    if (!activeTabData || !searchTerm) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const content = activeTabData.content;
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
    
    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index + searchTerm.length);
      textarea.scrollIntoView({ block: 'center' });
    }
  };

  const handleReplace = () => {
    if (!activeTabData || !searchTerm) return;
    
    const newContent = activeTabData.content.replace(
      new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      replaceTerm
    );
    
    updateTabContent(activeTabData.id, newContent);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (activeTab) {
        saveTab(activeTab);
      }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowSearch(true);
    }
    
    if (e.key === 'Escape') {
      setShowSearch(false);
      setShowContextMenu(false);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (tabs.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex items-center justify-center bg-gray-900"
      >
        <div className="text-center text-gray-400">
          <FileText size={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No file selected</h3>
          <p className="text-sm">Select a file from the project explorer to start editing</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col bg-gray-900 text-white ${
        isFullscreen ? 'fixed inset-0 z-50' : 'flex-1 h-full max-h-full'
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 flex items-center justify-between px-2 sm:px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Code className="text-blue-400 flex-shrink-0" size={20} />
          <span className="font-medium text-sm sm:text-base hidden sm:block">File Editor</span>
          <div className="text-xs text-gray-400 truncate">
            {currentBranch?.name}
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 sm:p-2 hover:bg-gray-700 rounded"
            title="Search"
          >
            <Search size={14} className="sm:w-4 sm:h-4" />
          </button>
          
          <button
            onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
            className="p-1 sm:p-2 hover:bg-gray-700 rounded hidden sm:block"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          
          <button
            onClick={() => setFontSize(prev => Math.max(prev - 2, 10))}
            className="p-1 sm:p-2 hover:bg-gray-700 rounded hidden sm:block"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 sm:p-2 hover:bg-gray-700 rounded"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} className="sm:w-4 sm:h-4" /> : <Maximize2 size={14} className="sm:w-4 sm:h-4" />}
          </button>
          
          <button
            onClick={onClose}
            className="p-1 sm:p-2 hover:bg-gray-700 rounded text-red-400"
            title="Close Editor"
          >
            <X size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-800 border-b border-gray-700 px-2 sm:px-4 py-3 flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Find
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <Replace size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Replace with..."
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleReplace}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Replace All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <div className="bg-gray-800 border-b border-gray-700 flex items-center overflow-x-auto flex-shrink-0">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            layout
            className={`flex items-center gap-2 px-2 sm:px-4 py-2 border-r border-gray-700 cursor-pointer min-w-0 group ${
              activeTab === tab.id 
                ? 'bg-gray-900 border-b-2 border-blue-500' 
                : 'hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab(tab.id)}
            onContextMenu={handleContextMenu}
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} className="text-blue-400 flex-shrink-0" />
              <span className="text-sm truncate">{tab.fileName}</span>
              {tab.isDirty && (
                <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" />
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Editor Content */}
      {activeTabData && (
        <div className="flex-1 flex flex-col">
          {/* Editor Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 px-2 sm:px-4 py-2 flex items-center justify-between text-sm flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span className="text-gray-400 hidden sm:inline">
                Language: <span className="text-white">{activeTabData.language}</span>
              </span>
              <span className="text-gray-400">
                <span className="hidden sm:inline">Lines: </span><span className="text-white">{activeTabData.content.split('\n').length}</span>
              </span>
              <span className="text-gray-400 hidden sm:inline">
                Characters: <span className="text-white">{activeTabData.content.length}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => saveTab(activeTabData.id)}
                disabled={!activeTabData.isDirty}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                  activeTabData.isDirty 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save size={14} />
                Save {activeTabData.isDirty && '(Ctrl+S)'}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 relative overflow-hidden">
            <textarea
              ref={textareaRef}
              value={activeTabData.content}
              onChange={(e) => updateTabContent(activeTabData.id, e.target.value)}
              className="w-full h-full bg-gray-900 text-white p-2 sm:p-4 pl-14 sm:pl-16 font-mono resize-none focus:outline-none"
              style={{ 
                fontSize: `${fontSize}px`,
                lineHeight: '1.5',
                tabSize: 2
              }}
              placeholder="Start typing your code..."
              spellCheck={false}
            />
            
            {/* Line Numbers Overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-14 bg-gray-800 border-r border-gray-700 p-2 sm:p-4 text-gray-400 text-right font-mono pointer-events-none text-xs sm:text-sm"
              style={{ fontSize: `${Math.max(fontSize - 2, 10)}px`, lineHeight: '1.5' }}
            >
              {activeTabData.content.split('\n').map((_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 py-2 min-w-[200px]"
            style={{ 
              left: contextMenuPos.x, 
              top: contextMenuPos.y,
              transform: 'translate(-50%, -10px)'
            }}
          >
            <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">
              <Copy size={16} />
              Copy Path
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">
              <Edit3 size={16} />
              Rename
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">
              <Move size={16} />
              Move
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">
              <Download size={16} />
              Download
            </button>
            <hr className="border-gray-600 my-2" />
            <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-red-400 flex items-center gap-3">
              <Trash2 size={16} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
