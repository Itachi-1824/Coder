import { create } from 'zustand';
import { parseAIResponse, detectProjectStructure, createProjectFromStructure, ProjectStructure } from '@/utils/codeGeneration';

export interface FileNode {
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

export interface ProjectState {
  fileTree: FileNode[];
  selectedFile: string | null;
  isGenerating: boolean;
  currentProject: string | null;
  
  // Actions
  setFileTree: (tree: FileNode[]) => void;
  addProject: (project: FileNode) => void;
  setSelectedFile: (filePath: string | null) => void;
  updateFileContent: (filePath: string, content: string) => void;
  generateProjectFromAI: (aiResponse: string) => Promise<ProjectStructure | null>;
  toggleFolder: (path: string) => void;
  deleteProject: (projectPath: string) => void;
  createNewFile: (parentPath: string, fileName: string, content?: string) => void;
  createNewFolder: (parentPath: string, folderName: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  fileTree: [],
  selectedFile: null,
  isGenerating: false,
  currentProject: null,

  setFileTree: (tree) => set({ fileTree: tree }),

  addProject: (project) => set((state) => ({
    fileTree: [...state.fileTree, project]
  })),

  setSelectedFile: (filePath) => set({ selectedFile: filePath }),

  updateFileContent: (filePath, content) => set((state) => ({
    fileTree: updateNodeContent(state.fileTree, filePath, content)
  })),

  generateProjectFromAI: async (aiResponse: string) => {
    set({ isGenerating: true });
    
    try {
      // Parse the AI response to extract code blocks
      const codeBlocks = parseAIResponse(aiResponse);
      
      if (codeBlocks.length === 0) {
        console.warn('No code blocks found in AI response');
        return null;
      }

      // Detect the project structure
      const projectStructure = detectProjectStructure(codeBlocks);
      
      // Create the project node structure
      const projectNode = createProjectFromStructure(projectStructure);
      
      // Add to file tree
      set((state) => ({
        fileTree: [...state.fileTree, projectNode],
        currentProject: projectNode.path
      }));

      return projectStructure;
    } catch (error) {
      console.error('Error generating project from AI:', error);
      return null;
    } finally {
      set({ isGenerating: false });
    }
  },

  toggleFolder: (path) => set((state) => ({
    fileTree: state.fileTree.map(node => updateNodeExpansion(node, path))
  })),

  deleteProject: (projectPath) => set((state) => ({
    fileTree: state.fileTree.filter(node => node.path !== projectPath),
    currentProject: state.currentProject === projectPath ? null : state.currentProject,
    selectedFile: state.selectedFile?.startsWith(projectPath) ? null : state.selectedFile
  })),

  createNewFile: (parentPath, fileName, content = '') => set((state) => {
    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      path: `${parentPath}/${fileName}`,
      content,
      isNew: true,
      lastModified: new Date()
    };

    return {
      fileTree: addNodeToParent(state.fileTree, parentPath, newFile)
    };
  }),

  createNewFolder: (parentPath, folderName) => set((state) => {
    const newFolder: FileNode = {
      name: folderName,
      type: 'folder',
      path: `${parentPath}/${folderName}`,
      children: [],
      expanded: true,
      isNew: true
    };

    return {
      fileTree: addNodeToParent(state.fileTree, parentPath, newFolder)
    };
  })
}));

// Helper functions
function updateNodeExpansion(node: FileNode, targetPath: string): FileNode {
  if (node.path === targetPath && node.type === 'folder') {
    return { ...node, expanded: !node.expanded };
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map(child => updateNodeExpansion(child, targetPath))
    };
  }
  return node;
}

function updateNodeContent(nodes: FileNode[], targetPath: string, content: string): FileNode[] {
  return nodes.map(node => {
    if (node.path === targetPath && node.type === 'file') {
      return { ...node, content, lastModified: new Date() };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeContent(node.children, targetPath, content)
      };
    }
    return node;
  });
}

function addNodeToParent(nodes: FileNode[], parentPath: string, newNode: FileNode): FileNode[] {
  return nodes.map(node => {
    if (node.path === parentPath && node.type === 'folder') {
      return {
        ...node,
        children: [...(node.children || []), newNode],
        expanded: true
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addNodeToParent(node.children, parentPath, newNode)
      };
    }
    return node;
  });
}

// Initialize with sample data
export const initializeSampleProjects = () => {
  const sampleProjects: FileNode[] = [
    {
      name: 'my-react-app',
      type: 'folder',
      path: 'my-react-app',
      expanded: true,
      children: [
        {
          name: 'src',
          type: 'folder',
          path: 'my-react-app/src',
          expanded: true,
          children: [
            { 
              name: 'App.js', 
              type: 'file', 
              path: 'my-react-app/src/App.js',
              content: `import React from 'react';\nimport './App.css';\n\nfunction App() {\n  const [count, setCount] = React.useState(0);\n\n  return (\n    <div className="App">\n      <header className="App-header">\n        <h1>Welcome to React</h1>\n        <button onClick={() => setCount(count + 1)}>\n          Count: {count}\n        </button>\n        <p>\n          Edit <code>src/App.js</code> and save to reload.\n        </p>\n      </header>\n    </div>\n  );\n}\n\nexport default App;`
            },
            { 
              name: 'index.js', 
              type: 'file', 
              path: 'my-react-app/src/index.js',
              content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport './index.css';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`
            },
            { 
              name: 'App.css', 
              type: 'file', 
              path: 'my-react-app/src/App.css',
              content: `.App {\n  text-align: center;\n}\n\n.App-header {\n  background-color: #282c34;\n  padding: 20px;\n  color: white;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n}\n\nbutton {\n  background: #61dafb;\n  border: none;\n  padding: 10px 20px;\n  border-radius: 5px;\n  cursor: pointer;\n  margin: 10px;\n}`
            },
          ]
        },
        { 
          name: 'package.json', 
          type: 'file', 
          path: 'my-react-app/package.json',
          content: `{\n  "name": "my-react-app",\n  "version": "0.1.0",\n  "private": true,\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "react-scripts": "5.0.1"\n  },\n  "scripts": {\n    "start": "react-scripts start",\n    "build": "react-scripts build",\n    "test": "react-scripts test",\n    "eject": "react-scripts eject"\n  },\n  "browserslist": {\n    "production": [\n      ">0.2%",\n      "not dead",\n      "not op_mini all"\n    ],\n    "development": [\n      "last 1 chrome version",\n      "last 1 firefox version",\n      "last 1 safari version"\n    ]\n  }\n}`
        },
        { 
          name: 'README.md', 
          type: 'file', 
          path: 'my-react-app/README.md',
          content: `# My React App\n\nThis is a sample React application.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\`\n\nOpen [http://localhost:3000](http://localhost:3000) to view it in the browser.`
        },
      ]
    },
    {
      name: 'python-scripts',
      type: 'folder',
      path: 'python-scripts',
      children: [
        { 
          name: 'main.py', 
          type: 'file', 
          path: 'python-scripts/main.py',
          content: `#!/usr/bin/env python3\n"""\nMain script for Python project\n"""\n\nimport sys\nfrom utils import helper_function\n\ndef main():\n    """Main function"""\n    print("Hello, World!")\n    \n    # Example usage\n    result = helper_function("test")\n    print(f"Result: {result}")\n    \n    return 0\n\nif __name__ == "__main__":\n    sys.exit(main())`
        },
        { 
          name: 'utils.py', 
          type: 'file', 
          path: 'python-scripts/utils.py',
          content: `"""\nUtility functions for the project\n"""\n\ndef helper_function(input_str: str) -> str:\n    """\n    Helper function that processes input string\n    \n    Args:\n        input_str: Input string to process\n        \n    Returns:\n        Processed string\n    """\n    return f"Processed: {input_str.upper()}"\n\ndef another_helper(data):\n    """Another utility function"""\n    return len(data) if data else 0`
        },
        { 
          name: 'requirements.txt', 
          type: 'file', 
          path: 'python-scripts/requirements.txt',
          content: `# Python dependencies\nrequests>=2.28.0\nnumpy>=1.21.0\npandas>=1.3.0`
        },
      ]
    }
  ];

  useProjectStore.getState().setFileTree(sampleProjects);
};
