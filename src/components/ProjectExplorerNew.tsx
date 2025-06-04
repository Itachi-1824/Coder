'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectStore, initializeSampleProjects } from '@/store/projectStore';
import { useBranchStore, Branch } from '@/store/branchStore';
import { 
  Folder, 
  File, 
  Plus, 
  FolderPlus, 
  Upload,
  Download,
  Trash2,
  ChevronRight,
  ChevronDown,
  Archive,
  FileText,
  Code,
  Image,
  Music,
  Video,
  X,
  Check,
  Edit3,
  Copy,
  MoreHorizontal,
  Eye,
  FilePlus
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  expanded?: boolean;
  content?: string;
  size?: number;
  lastModified?: Date;
  isNew?: boolean;
}


interface ProjectExplorerProps {
  onFileSelect: (filePath: string) => void;
  currentBranch: Branch | null;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'extracting' | 'completed' | 'error';
}

export default function ProjectExplorer({ onFileSelect, currentBranch }: ProjectExplorerProps) {
  const { 
    toggleFolder
  } = useProjectStore();
  
  const { updateBranchFiles } = useBranchStore();
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    node: FileNode | null;
  }>({ show: false, x: 0, y: 0, node: null });
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Initialize with sample projects if none exist
  useEffect(() => {
    // Add proper null/undefined checks
    if (currentBranch && 
        currentBranch.fileTree && 
        Array.isArray(currentBranch.fileTree) && 
        currentBranch.fileTree.length === 0 && 
        currentBranch.isMain) {
      initializeSampleProjects();
    }
  }, [currentBranch]);

  const handleFileSelect = (filePath: string) => {
    onFileSelect(filePath);
  };

  // File upload and management functions
  const handleFileUpload = async (files: FileList) => {
    const newProgress: UploadProgress[] = [];

    for (const file of Array.from(files)) {
      const progress: UploadProgress = {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      };
      newProgress.push(progress);
      setUploadProgress(prev => [...prev, progress]);

      try {
        if (file.name.endsWith('.zip')) {
          await handleZipExtraction(file, progress);
        } else {
          await handleSingleFileUpload(file, progress);
        }
      } catch (error) {
        progress.status = 'error';
        console.error('Upload error:', error);
      }
    }

    setTimeout(() => {
      setUploadProgress([]);
    }, 2000);
  };

  const handleZipExtraction = async (zipFile: File, progress: UploadProgress) => {
    progress.status = 'extracting';
    progress.progress = 50;
    setUploadProgress(prev => [...prev]);

    // Simulate zip extraction (in a real app, you'd use a library like JSZip)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const projectName = zipFile.name.replace('.zip', '');
    const newProject: FileNode = {
      name: projectName,
      type: 'folder',
      path: projectName,
      expanded: true,
      isNew: true,
      children: [
        {
          name: 'index.html',
          type: 'file',
          path: `${projectName}/index.html`,
          content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Uploaded Project</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>',
          isNew: true
        },
        {
          name: 'style.css',
          type: 'file',
          path: `${projectName}/style.css`,
          content: 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}',
          isNew: true
        }
      ]
    };

    if (currentBranch && currentBranch.fileTree && Array.isArray(currentBranch.fileTree)) {
      updateBranchFiles(currentBranch.id, [...currentBranch.fileTree, newProject]);
    }
    progress.status = 'completed';
    progress.progress = 100;
  };

  const handleSingleFileUpload = async (file: File, progress: UploadProgress) => {
    const content = await readFileAsText(file);
    
    const newFile: FileNode = {
      name: file.name,
      type: 'file',
      path: `uploads/${file.name}`,
      content,
      size: file.size,
      lastModified: new Date(file.lastModified),
      isNew: true
    };

    // Add to uploads folder or create it
    if (currentBranch && currentBranch.fileTree && Array.isArray(currentBranch.fileTree)) {
      const uploadsFolder = currentBranch.fileTree.find(node => node.name === 'uploads');
      if (uploadsFolder && uploadsFolder.children && Array.isArray(uploadsFolder.children)) {
        uploadsFolder.children.push(newFile);
        updateBranchFiles(currentBranch.id, [...currentBranch.fileTree]);
      } else {
        const newUploadsFolder: FileNode = {
          name: 'uploads',
          type: 'folder',
          path: 'uploads',
          expanded: true,
          children: [newFile],
          isNew: true
        };
        updateBranchFiles(currentBranch.id, [...currentBranch.fileTree, newUploadsFolder]);
      }
    }

    progress.status = 'completed';
    progress.progress = 100;
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const createNewProject = () => {
    const projectName = prompt('Enter project name:');
    if (!projectName) return;

    const newProject: FileNode = {
      name: projectName,
      type: 'folder',
      path: projectName,
      expanded: true,
      isNew: true,
      children: []
    };

    if (currentBranch && currentBranch.fileTree && Array.isArray(currentBranch.fileTree)) {
      updateBranchFiles(currentBranch.id, [...currentBranch.fileTree, newProject]);
    }
  };

  const handleRightClick = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, node);
  };

  const showContextMenu = (x: number, y: number, node: FileNode) => {
    setContextMenu({
      show: true,
      x,
      y,
      node
    });
  };

  const handleTouchStart = (e: React.TouchEvent, node: FileNode) => {
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      showContextMenu(touch.clientX, touch.clientY, node);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
    setTouchTimer(timer);
  };

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedNodes(new Set());
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, node: null });
  };

  const handleRename = (node: FileNode) => {
    setEditingNode(node.path);
    setNewName(node.name);
    closeContextMenu();
  };

  const confirmRename = () => {
    if (!editingNode || !newName.trim()) return;
    
    if (currentBranch && currentBranch.fileTree) {
      const updatedTree = renameNodeInTree(currentBranch.fileTree, editingNode, newName.trim());
      updateBranchFiles(currentBranch.id, updatedTree);
    }
    
    setEditingNode(null);
    setNewName('');
  };

  const cancelRename = () => {
    setEditingNode(null);
    setNewName('');
  };

  const handleDelete = (node: FileNode) => {
    if (window.confirm(`Are you sure you want to delete "${node.name}"?`)) {
      if (currentBranch && currentBranch.fileTree) {
        const updatedTree = deleteNodeFromTree(currentBranch.fileTree, node.path);
        updateBranchFiles(currentBranch.id, updatedTree);
      }
    }
    closeContextMenu();
  };

  const handleDownload = (node: FileNode) => {
    if (node.type === 'file' && node.content) {
      const blob = new Blob([node.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = node.name;
      a.click();
      URL.revokeObjectURL(url);
    }
    closeContextMenu();
  };

  const handleCopy = (node: FileNode) => {
    navigator.clipboard.writeText(node.path);
    closeContextMenu();
  };

  const handleArchive = () => {
    const selectedFiles = Array.from(selectedNodes);
    if (selectedFiles.length === 0) return;

    const archiveName = prompt('Enter archive name (without extension):');
    if (!archiveName) return;

    // Create a mock zip file with selected files
    const archiveContent = createMockArchive(selectedFiles);
    const archiveFile: FileNode = {
      name: `${archiveName}.zip`,
      type: 'file',
      path: `${archiveName}.zip`,
      content: archiveContent,
      isNew: true,
      lastModified: new Date(),
      size: archiveContent.length
    };

    if (currentBranch && currentBranch.fileTree) {
      updateBranchFiles(currentBranch.id, [...currentBranch.fileTree, archiveFile]);
    }

    setSelectedNodes(new Set());
    closeContextMenu();
  };

  const handleUnarchive = (node: FileNode) => {
    if (!node.content) return;

    const extractedFiles = extractMockArchive(node.content, node.name);
    if (currentBranch && currentBranch.fileTree) {
      updateBranchFiles(currentBranch.id, [...currentBranch.fileTree, ...extractedFiles]);
    }

    closeContextMenu();
  };

  const createMockArchive = (filePaths: string[]): string => {
    const fileTree = getFileTree();
    const archivedFiles: FileNode[] = [];

    const findFileInTree = (nodes: FileNode[], targetPath: string): FileNode | null => {
      for (const node of nodes) {
        if (node.path === targetPath) return node;
        if (node.children) {
          const found = findFileInTree(node.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    filePaths.forEach(filePath => {
      const file = findFileInTree(fileTree, filePath);
      if (file) {
        archivedFiles.push({
          name: file.name,
          path: file.path,
          content: file.content || '',
          type: file.type
        });
      }
    });

    return JSON.stringify({
      type: 'archive',
      created: new Date().toISOString(),
      files: archivedFiles
    });
  };

  const extractMockArchive = (archiveContent: string, archiveName: string): FileNode[] => {
    try {
      const archive = JSON.parse(archiveContent);
      const extractedFiles: FileNode[] = [];
      const folderName = archiveName.replace(/\.(zip|rar|tar|gz)$/, '');

      archive.files.forEach((file: FileNode) => {
        const extractedFile: FileNode = {
          name: file.name,
          type: file.type,
          path: `${folderName}/${file.name}`,
          content: file.content,
          isNew: true,
          lastModified: new Date()
        };
        extractedFiles.push(extractedFile);
      });

      // Create folder structure if multiple files
      if (extractedFiles.length > 1) {
        const folder: FileNode = {
          name: folderName,
          type: 'folder',
          path: folderName,
          expanded: true,
          isNew: true,
          children: extractedFiles
        };
        return [folder];
      }

      return extractedFiles;
    } catch (error) {
      console.error('Failed to extract archive:', error);
      return [];
    }
  };

  const toggleNodeSelection = (nodePath: string) => {
    const newSelection = new Set(selectedNodes);
    if (newSelection.has(nodePath)) {
      newSelection.delete(nodePath);
    } else {
      newSelection.add(nodePath);
    }
    setSelectedNodes(newSelection);
  };

  const isArchiveFile = (filename: string): boolean => {
    return /\.(zip|rar|tar|gz|7z)$/i.test(filename);
  };

  const createNewFile = () => {
    if (!newFileName.trim()) return;
    
    const newFile: FileNode = {
      name: newFileName,
      type: 'file',
      path: newFileName,
      content: '',
      isNew: true,
      lastModified: new Date()
    };

    if (currentBranch && currentBranch.fileTree) {
      updateBranchFiles(currentBranch.id, [...currentBranch.fileTree, newFile]);
    }
    
    setShowNewFileModal(false);
    setNewFileName('');
  };

  const createNewFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: FileNode = {
      name: newFolderName,
      type: 'folder',
      path: newFolderName,
      expanded: true,
      isNew: true,
      children: []
    };

    if (currentBranch && currentBranch.fileTree) {
      updateBranchFiles(currentBranch.id, [...currentBranch.fileTree, newFolder]);
    }
    
    setShowNewFolderModal(false);
    setNewFolderName('');
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'rs':
      case 'go':
        return <Code size={16} className="text-blue-400" />;
      case 'html':
      case 'css':
      case 'scss':
      case 'less':
        return <Code size={16} className="text-green-400" />;
      case 'md':
      case 'txt':
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
        return <FileText size={16} className="text-yellow-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return <Image size={16} className="text-purple-400" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <Music size={16} className="text-pink-400" />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <Video size={16} className="text-red-400" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <Archive size={16} className="text-orange-400" />;
      default:
        return <File size={16} className="text-gray-400" />;
    }
  };

  // Helper functions for tree operations
  const renameNodeInTree = (nodes: FileNode[], targetPath: string, newName: string): FileNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        const pathParts = node.path.split('/');
        pathParts[pathParts.length - 1] = newName;
        return { ...node, name: newName, path: pathParts.join('/') };
      }
      if (node.children) {
        return { ...node, children: renameNodeInTree(node.children, targetPath, newName) };
      }
      return node;
    });
  };

  const deleteNodeFromTree = (nodes: FileNode[], targetPath: string): FileNode[] => {
    return nodes.filter(node => {
      if (node.path === targetPath) {
        return false;
      }
      if (node.children) {
        node.children = deleteNodeFromTree(node.children, targetPath);
      }
      return true;
    });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const indent = depth * 16;
    const isEditing = editingNode === node.path;
    
    return (
      <div key={node.path}>
        <div 
          className={`
            flex items-center px-2 py-1 hover:bg-gray-700 cursor-pointer select-none group
            ${node.type === 'file' ? 'hover:bg-blue-600/20' : ''}
            ${selectedNodes.has(node.path) ? 'bg-blue-600/30' : ''}
          `}
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={(e) => {
            if (!isEditing) {
              if (isSelectionMode) {
                // In selection mode, just toggle selection
                toggleNodeSelection(node.path);
              } else if (e.ctrlKey || e.metaKey) {
                // Multi-select with Ctrl/Cmd (desktop)
                toggleNodeSelection(node.path);
              } else if (node.type === 'folder') {
                toggleFolder(node.path);
              } else {
                handleFileSelect(node.path);
              }
            }
          }}
          onContextMenu={(e) => handleRightClick(e, node)}
          onTouchStart={(e) => handleTouchStart(e, node)}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {node.type === 'folder' && (
            <span className="mr-1">
              {node.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          
          {node.type === 'folder' ? (
            <Folder size={16} className="mr-2 text-blue-400" />
          ) : (
            <span className="mr-2">{getFileIcon(node.name)}</span>
          )}
          
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                autoFocus
              />
              <button onClick={confirmRename} className="text-green-400 hover:text-green-300">
                <Check size={14} />
              </button>
              <button onClick={cancelRename} className="text-red-400 hover:text-red-300">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <span className={`text-sm truncate mr-2 flex-1 ${node.isNew ? 'text-green-400' : ''}`}>
                {node.name}
              </span>
              
              {node.isNew && (
                <span className="text-xs bg-green-600 text-white px-1 rounded mr-2">NEW</span>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRightClick(e, node);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded"
              >
                <MoreHorizontal size={14} />
              </button>
            </>
          )}
        </div>
        
        {node.type === 'folder' && node.expanded && node.children && Array.isArray(node.children) && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to get file tree safely
  const getFileTree = () => {
    if (!currentBranch || !currentBranch.fileTree || !Array.isArray(currentBranch.fileTree)) {
      return [];
    }
    return currentBranch.fileTree;
  };

  const fileTree = getFileTree();

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-3">Projects</h2>
        
        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button 
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            onClick={createNewProject}
          >
            <Plus size={14} />
            New Project
          </button>
          
          <button 
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            Upload
          </button>

          {/* Mobile Selection Mode Toggle */}
          <button 
            className={`sm:hidden flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
              isSelectionMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
            }`}
            onClick={toggleSelectionMode}
            title={isSelectionMode ? 'Exit Selection Mode' : 'Enter Selection Mode'}
          >
            <Check size={14} />
            {isSelectionMode ? 'Exit Select' : 'Select'}
          </button>
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="bg-gray-700 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm truncate">{progress.fileName}</span>
                  <span className="text-xs text-gray-400">
                    {progress.status === 'completed' ? (
                      <Check size={12} className="text-green-400" />
                    ) : progress.status === 'error' ? (
                      <X size={12} className="text-red-400" />
                    ) : (
                      `${progress.progress}%`
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      progress.status === 'completed' ? 'bg-green-400' :
                      progress.status === 'error' ? 'bg-red-400' : 'bg-blue-400'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1 capitalize">
                  {progress.status}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".zip,.js,.jsx,.ts,.tsx,.py,.html,.css,.scss,.json,.md,.txt,.java,.cpp,.c,.rs,.go"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File Tree */}
      <div 
        className={`flex-1 overflow-y-auto transition-colors ${
          dragOver ? 'bg-blue-600/20 border-2 border-blue-600 border-dashed' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {fileTree.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FolderPlus size={48} className="mx-auto mb-2 opacity-50" />
            <p>No projects yet</p>
            <p className="text-sm">Create or upload a project to get started</p>
          </div>
        ) : (
          <div className="py-2">
            {fileTree.map(node => renderFileNode(node))}
          </div>
        )}
      </div>

      {/* Selection Info */}
      {(selectedNodes.size > 0 || isSelectionMode) && (
        <div className="px-4 py-2 bg-blue-600/20 border-t border-blue-600/50 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-400">
              {isSelectionMode && selectedNodes.size === 0 && (
                <span className="sm:hidden">📱 Tap files to select • </span>
              )}
              {selectedNodes.size > 0 ? `${selectedNodes.size} file(s) selected` : 
               isSelectionMode ? 'Selection mode active' : ''}
            </span>
            <div className="flex gap-2">
              {selectedNodes.size > 0 && (
                <button
                  onClick={() => setSelectedNodes(new Set())}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Clear
                </button>
              )}
              {isSelectionMode && (
                <button
                  onClick={toggleSelectionMode}
                  className="text-blue-400 hover:text-blue-300 sm:hidden"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-2 border-t border-gray-700 flex gap-2">
        <button 
          onClick={() => setShowNewFileModal(true)}
          className="flex items-center gap-2 px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="New File"
        >
          <FilePlus size={14} />
        </button>
        
        <button 
          onClick={() => setShowNewFolderModal(true)}
          className="flex items-center gap-2 px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="New Folder"
        >
          <FolderPlus size={14} />
        </button>
        
        {selectedNodes.size > 0 && (
          <button 
            onClick={handleArchive}
            className="flex items-center gap-2 px-2 py-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded"
            title="Archive Selected Files"
          >
            <Archive size={14} />
          </button>
        )}
        
        <button 
          className="flex items-center gap-2 px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="Download Project"
        >
          <Download size={14} />
        </button>
        
        <button 
          onClick={() => setSelectedNodes(new Set())}
          className="flex items-center gap-2 px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="Clear Selection"
        >
          <Eye size={14} />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu.show && contextMenu.node && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 py-2 min-w-[200px]"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            top: Math.min(contextMenu.y, window.innerHeight - 300),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleFileSelect(contextMenu.node!.path)}
            className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
          >
            <Eye size={16} />
            {contextMenu.node.type === 'file' ? 'Open' : 'View'}
          </button>
          
          <button
            onClick={() => handleRename(contextMenu.node!)}
            className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
          >
            <Edit3 size={16} />
            Rename
          </button>
          
          <button
            onClick={() => handleCopy(contextMenu.node!)}
            className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
          >
            <Copy size={16} />
            Copy Path
          </button>
          
          {contextMenu.node.type === 'file' && (
            <button
              onClick={() => handleDownload(contextMenu.node!)}
              className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
            >
              <Download size={16} />
              Download
            </button>
          )}
          
          {contextMenu.node.type === 'file' && isArchiveFile(contextMenu.node.name) && (
            <button
              onClick={() => handleUnarchive(contextMenu.node!)}
              className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
            >
              <Archive size={16} />
              Extract Archive
            </button>
          )}
          
          <hr className="border-gray-600 my-2" />
          
          {selectedNodes.size > 0 && (
            <button
              onClick={handleArchive}
              className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-sm"
            >
              <Archive size={16} />
              Archive Selected ({selectedNodes.size})
            </button>
          )}
          
          <button
            onClick={() => handleDelete(contextMenu.node!)}
            className="w-full text-left px-4 py-2 hover:bg-gray-700 text-red-400 flex items-center gap-3 text-sm"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createNewFile();
                if (e.key === 'Escape') setShowNewFileModal(false);
              }}
              placeholder="Enter file name (e.g., script.js, style.css)"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewFileModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={createNewFile}
                disabled={!newFileName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createNewFolder();
                if (e.key === 'Escape') setShowNewFolderModal(false);
              }}
              placeholder="Enter folder name"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={createNewFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
