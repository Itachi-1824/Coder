import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'status';
  content: string;
  timestamp: Date;
}

export interface Branch {
  id: string;
  name: string;
  isMain: boolean;
  createdAt: Date;
  lastModified: Date;
  description?: string;
  parentBranch?: string;
  fileTree: FileNode[];
  chatHistory: Message[];
  shortTermMemory: string[];
  longTermMemory: string[];
}

export interface BranchState {
  branches: Branch[];
  currentBranch: string;
  
  // Actions
  createBranch: (name: string, description?: string, copyFromCurrent?: boolean) => string;
  switchBranch: (branchId: string) => void;
  deleteBranch: (branchId: string) => void;
  mergeBranch: (sourceBranchId: string, targetBranchId: string) => void;
  updateBranchFiles: (branchId: string, fileTree: FileNode[]) => void;
  updateBranchChat: (branchId: string, messages: Message[]) => void;
  addToSTM: (branchId: string, memory: string) => void;
  addToLTM: (branchId: string, memory: string) => void;
  getCurrentBranch: () => Branch | null;
  getBranch: (branchId: string) => Branch | null;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [
        {
          id: 'main',
          name: 'main',
          isMain: true,
          createdAt: new Date(),
          lastModified: new Date(),
          description: 'Main branch with original code',
          fileTree: [],
          chatHistory: [],
          shortTermMemory: [],
          longTermMemory: []
        }
      ],
      currentBranch: 'main',

      createBranch: (name: string, description?: string, copyFromCurrent = true) => {
        const currentBranch = get().getCurrentBranch();
        const branchId = `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newBranch: Branch = {
          id: branchId,
          name,
          isMain: false,
          createdAt: new Date(),
          lastModified: new Date(),
          description,
          parentBranch: currentBranch?.id,
          fileTree: copyFromCurrent ? (currentBranch?.fileTree || []) : [],
          chatHistory: [], // Always start fresh chat for new branch
          shortTermMemory: copyFromCurrent ? [...(currentBranch?.shortTermMemory || [])] : [],
          longTermMemory: copyFromCurrent ? [...(currentBranch?.longTermMemory || [])] : []
        };

        set(state => ({
          branches: [...state.branches, newBranch],
          currentBranch: branchId
        }));

        return branchId;
      },

      switchBranch: (branchId: string) => {
        const branch = get().getBranch(branchId);
        if (branch) {
          set({ currentBranch: branchId });
        }
      },

      deleteBranch: (branchId: string) => {
        const branch = get().getBranch(branchId);
        if (branch && !branch.isMain && branchId !== get().currentBranch) {
          set(state => ({
            branches: state.branches.filter(b => b.id !== branchId)
          }));
        }
      },

      mergeBranch: (sourceBranchId: string, targetBranchId: string) => {
        const sourceBranch = get().getBranch(sourceBranchId);
        const targetBranch = get().getBranch(targetBranchId);
        
        if (sourceBranch && targetBranch) {
          set(state => ({
            branches: state.branches.map(b => {
              if (b.id === targetBranchId) {
                return {
                  ...b,
                  fileTree: sourceBranch.fileTree,
                  lastModified: new Date(),
                  longTermMemory: [...b.longTermMemory, ...sourceBranch.longTermMemory]
                };
              }
              return b;
            })
          }));
        }
      },

      updateBranchFiles: (branchId: string, fileTree: FileNode[]) => {
        set(state => ({
          branches: state.branches.map(b => 
            b.id === branchId 
              ? { ...b, fileTree, lastModified: new Date() }
              : b
          )
        }));
      },

      updateBranchChat: (branchId: string, messages: Message[]) => {
        set(state => ({
          branches: state.branches.map(b => 
            b.id === branchId 
              ? { ...b, chatHistory: messages, lastModified: new Date() }
              : b
          )
        }));
      },

      addToSTM: (branchId: string, memory: string) => {
        set(state => ({
          branches: state.branches.map(b => {
            if (b.id === branchId) {
              const newSTM = [...b.shortTermMemory, memory];
              // Keep only last 10 items in STM
              return {
                ...b,
                shortTermMemory: newSTM.slice(-10),
                lastModified: new Date()
              };
            }
            return b;
          })
        }));
      },

      addToLTM: (branchId: string, memory: string) => {
        set(state => ({
          branches: state.branches.map(b => 
            b.id === branchId 
              ? { 
                  ...b, 
                  longTermMemory: [...b.longTermMemory, memory],
                  lastModified: new Date()
                }
              : b
          )
        }));
      },

      getCurrentBranch: () => {
        const state = get();
        return state.branches.find(b => b.id === state.currentBranch) || null;
      },

      getBranch: (branchId: string) => {
        return get().branches.find(b => b.id === branchId) || null;
      }
    }),
    {
      name: 'branch-storage',
      version: 1
    }
  )
);
