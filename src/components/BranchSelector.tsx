'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  GitBranch, 
  Plus, 
  ChevronDown, 
  Trash2, 
  GitMerge,
  Check,
  Clock,
  FolderOpen
} from 'lucide-react';
import { useBranchStore } from '@/store/branchStore';

interface BranchSelectorProps {
  onBranchChange?: (branchId: string) => void;
}

export default function BranchSelector({ onBranchChange }: BranchSelectorProps) {
  const {
    branches,
    currentBranch,
    createBranch,
    switchBranch,
    deleteBranch,
    mergeBranch,
    getCurrentBranch
  } = useBranchStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDescription, setNewBranchDescription] = useState('');
  const [copyFromCurrent, setCopyFromCurrent] = useState(true);
  const [selectedTargetBranch, setSelectedTargetBranch] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fix hydration by only accessing store after client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const currentBranchData = isHydrated ? getCurrentBranch() : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchBranch = (branchId: string) => {
    switchBranch(branchId);
    setIsOpen(false);
    onBranchChange?.(branchId);
  };

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    
    const branchId = createBranch(newBranchName, newBranchDescription, copyFromCurrent);
    setNewBranchName('');
    setNewBranchDescription('');
    setShowCreateModal(false);
    onBranchChange?.(branchId);
  };

  const handleMergeBranch = (sourceBranchId: string) => {
    if (!selectedTargetBranch) return;
    
    mergeBranch(sourceBranchId, selectedTargetBranch);
    setShowMergeModal(false);
    setSelectedTargetBranch('');
  };

  const handleDeleteBranch = (branchId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      deleteBranch(branchId);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  interface Branch {
    isMain?: boolean;
    name: string;
    description?: string;
  }

  const getBranchIcon = (branch: Branch | null) => {
    if (branch?.isMain) {
      return <GitBranch className="text-green-400" size={16} />;
    }
    return <GitBranch className="text-blue-400" size={16} />;
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Branch Selector Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 w-full sm:min-w-[200px] group"
        >
          {getBranchIcon(currentBranchData)}
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {currentBranchData?.name || 'main'}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {isHydrated ? (branches.find(b => b.id === currentBranch)?.description || 'Main branch') : 'Main branch'}
            </div>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && isHydrated && (
          <div className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Branches</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
                >
                  <Plus size={12} />
                  New
                </button>
              </div>
            </div>

            {/* Branch List */}
            <div className="py-2">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`mx-2 mb-1 px-3 py-2 rounded cursor-pointer transition-colors group ${
                    branch.id === currentBranch
                      ? 'bg-blue-600/20 border border-blue-600/30'
                      : 'hover:bg-gray-700'
                  }`}
                  onClick={() => handleSwitchBranch(branch.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {getBranchIcon(branch)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {branch.name}
                          </span>
                          {branch.id === currentBranch && (
                            <Check size={12} className="text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        {branch.description && (
                          <div className="text-xs text-gray-400 truncate">
                            {branch.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(branch.lastModified)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FolderOpen size={10} />
                            {branch.fileTree.length} files
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Branch Actions */}
                    {!branch.isMain && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTargetBranch('');
                            setShowMergeModal(true);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                          title="Merge branch"
                        >
                          <GitMerge size={12} className="text-green-400" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteBranch(branch.id, e)}
                          className="p-1 hover:bg-gray-600 rounded"
                          title="Delete branch"
                        >
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Branch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Branch</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="feature/new-component"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newBranchDescription}
                  onChange={(e) => setNewBranchDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="Add new component feature"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="copyFiles"
                  checked={copyFromCurrent}
                  onChange={(e) => setCopyFromCurrent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="copyFiles" className="text-sm text-gray-300">
                  Copy files from current branch
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Branch Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Merge Branch</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Merge into:
                </label>
                <select
                  value={selectedTargetBranch}
                  onChange={(e) => setSelectedTargetBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select target branch</option>
                  {branches
                    .filter(b => b.id !== currentBranch)
                    .map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="bg-yellow-600/20 border border-yellow-600/30 rounded p-3">
                <p className="text-sm text-yellow-300">
                  This will copy all files from the current branch ({currentBranchData?.name}) 
                  into the selected target branch.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMergeBranch(currentBranch)}
                disabled={!selectedTargetBranch}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
