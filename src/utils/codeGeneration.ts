export interface CodeBlock {
  language: string;
  filename: string;
  content: string;
  path: string;
}

export interface ProjectStructure {
  name: string;
  files: CodeBlock[];
  dependencies?: string[];
  type: 'react' | 'html' | 'python' | 'nodejs' | 'general';
}

export function parseAIResponse(content: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  
  // More flexible regex patterns to match different code block formats
  const patterns = [
    // Standard format: ```language\ncode```
    /```(\w+)?\s*\n([\s\S]*?)```/g,
    // With filename comment: ```language // filename\ncode```
    /```(\w+)?\s*(?:\/\/\s*(.+\.[\w]+))?\s*\n([\s\S]*?)```/g,
    // With filename in different comment styles
    /```(\w+)?\s*(?:#\s*(.+\.[\w]+))?\s*\n([\s\S]*?)```/g,
    // With filename after language
    /```(\w+)\s+(.+\.[\w]+)\s*\n([\s\S]*?)```/g
  ];
  
  let fileCounter = 1;
  const foundBlocks = new Set<string>(); // To avoid duplicates
  
  // Try each pattern
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const language = match[1] || 'text';
      let filename = match[2];
      let code = match[3] || match[2]; // Handle different capture groups
      
      // If we captured filename in wrong place, fix it
      if (code && !filename && match[4]) {
        filename = code;
        code = match[4];
      }
      
      if (!code) code = match[2] || '';
      code = code.trim();
      
      // Skip if we already found this exact code block
      const blockKey = `${language}-${code.substring(0, 100)}`;
      if (foundBlocks.has(blockKey)) continue;
      foundBlocks.add(blockKey);
      
      // Try to detect filename from content
      if (!filename) {
        const detectedName = detectFilenameFromContent(code, language);
        if (detectedName) {
          filename = detectedName;
        }
      }
      
      // Fallback filename
      if (!filename) {
        filename = `file${fileCounter}.${getExtensionFromLanguage(language)}`;
        fileCounter++;
      }
      
      // Only add if we have actual content
      if (code.length > 0) {
        codeBlocks.push({
          language,
          filename,
          content: code,
          path: filename
        });
      }
    }
  }
  
  return codeBlocks;
}

export function detectProjectStructure(codeBlocks: CodeBlock[]): ProjectStructure {
  const hasReact = codeBlocks.some(block => 
    block.content.includes('import React') || 
    block.filename.endsWith('.jsx') || 
    block.filename.endsWith('.tsx')
  );
  
  const hasHTML = codeBlocks.some(block => 
    block.filename.endsWith('.html') || 
    block.content.includes('<!DOCTYPE html>')
  );
  
  const hasPython = codeBlocks.some(block => 
    block.filename.endsWith('.py') || 
    block.language === 'python'
  );
  
  const hasPackageJson = codeBlocks.some(block => 
    block.filename === 'package.json'
  );
  
  let type: ProjectStructure['type'] = 'general';
  let name = 'generated-project';
  
  if (hasReact) {
    type = 'react';
    name = 'react-app';
  } else if (hasHTML) {
    type = 'html';
    name = 'html-project';
  } else if (hasPython) {
    type = 'python';
    name = 'python-project';
  } else if (hasPackageJson) {
    type = 'nodejs';
    name = 'nodejs-project';
  }
  
  // Extract dependencies from package.json if it exists
  const dependencies: string[] = [];
  const packageJsonBlock = codeBlocks.find(block => block.filename === 'package.json');
  if (packageJsonBlock) {
    try {
      const packageData = JSON.parse(packageJsonBlock.content);
      if (packageData.dependencies) {
        dependencies.push(...Object.keys(packageData.dependencies));
      }
      if (packageData.name) {
        name = packageData.name;
      }
    } catch (error) {
      console.warn('Failed to parse package.json:', error);
    }
  }
  
  return {
    name,
    files: codeBlocks,
    dependencies,
    type
  };
}

function detectFilenameFromContent(content: string, language: string): string | null {
  // Look for common patterns that indicate filename
  const filenamePatterns = [
    /\/\/\s*(@filename|filename|file):\s*(.+)/i,
    /\/\*\s*(@filename|filename|file):\s*(.+)\s*\*\//i,
    /#\s*(@filename|filename|file):\s*(.+)/i,
  ];
  
  for (const pattern of filenamePatterns) {
    const match = content.match(pattern);
    if (match && match[2]) {
      return match[2].trim();
    }
  }
  
  // Try to detect from import statements or common patterns
  if (language === 'javascript' || language === 'jsx') {
    if (content.includes('import React')) {
      return content.includes('export default') ? 'App.jsx' : 'index.jsx';
    }
    if (content.includes('<!DOCTYPE html>')) {
      return 'index.html';
    }
  }
  
  if (language === 'html') {
    return 'index.html';
  }
  
  if (language === 'css') {
    return 'styles.css';
  }
  
  if (language === 'python') {
    if (content.includes('if __name__ == "__main__"')) {
      return 'main.py';
    }
    return 'script.py';
  }
  
  return null;
}

function getExtensionFromLanguage(language: string): string {
  const extensionMap: { [key: string]: string } = {
    'javascript': 'js',
    'js': 'js',
    'jsx': 'jsx',
    'typescript': 'ts',
    'ts': 'ts',
    'tsx': 'tsx',
    'python': 'py',
    'py': 'py',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'markdown': 'md',
    'md': 'md',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'rust': 'rs',
    'go': 'go',
    'php': 'php',
    'ruby': 'rb',
    'shell': 'sh',
    'bash': 'sh',
    'sql': 'sql',
    'yaml': 'yml',
    'xml': 'xml'
  };
  
  return extensionMap[language.toLowerCase()] || 'txt';
}
interface ProjectNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  expanded?: boolean;
  isNew?: boolean;
  children?: ProjectNode[];
}


export function createProjectFromStructure(structure: ProjectStructure): ProjectNode {
  const projectNode: ProjectNode = {
    name: structure.name,
    type: 'folder' as const,
    path: structure.name,
    expanded: true,
    isNew: true,
    children: [] as ProjectNode[]
  };
  
  // Group files by directory
  const directories: { [path: string]: ProjectNode[] } = {};
  
  structure.files.forEach(file => {
    const pathParts = file.path.split('/');
    const filename = pathParts.pop() || file.filename;
    const dirPath = pathParts.join('/');
    
    const fileNode = {
      name: filename,
      type: 'file' as const,
      path: `${structure.name}/${file.path}`,
      content: file.content,
      isNew: true
    };
    
    if (dirPath) {
      if (!directories[dirPath]) {
        directories[dirPath] = [];
      }
      directories[dirPath].push(fileNode);
    } else {
      if (projectNode.children) {
        projectNode.children.push(fileNode);
      }
    }
  });
  
  // Create directory nodes
  Object.entries(directories).forEach(([dirPath, files]) => {
    const dirParts = dirPath.split('/');
    let currentLevel = projectNode.children;
    let currentPath = structure.name;
    
    dirParts.forEach((dirName, index) => {
      currentPath += '/' + dirName;
      let existingDir = currentLevel?.find(node => node.name === dirName && node.type === 'folder');
      
      if (!existingDir) {
        existingDir = {
          name: dirName,
          type: 'folder' as const,
          path: currentPath,
          expanded: true,
          isNew: true,
          children: []
        };
        if (currentLevel) {
          currentLevel.push(existingDir);
        }
      }
      
      currentLevel = existingDir.children;
      
      // Add files to the deepest directory
      if (index === dirParts.length - 1 && currentLevel) {
        currentLevel.push(...files);
      }
    });
  });
  
  return projectNode;
}

export function generateRunScript(projectType: ProjectStructure['type'], projectName: string): string {
  switch (projectType) {
    case 'react':
      return `cd ${projectName} && npm install && npm start`;
    case 'nodejs':
      return `cd ${projectName} && npm install && npm start`;
    case 'python':
      return `cd ${projectName} && python main.py`;
    case 'html':
      return `cd ${projectName} && python -m http.server 3000`;
    default:
      return `cd ${projectName} && echo "Project created successfully!"`;
  }
}

export function detectErrors(output: string): string[] {
  const errors: string[] = [];
  const errorPatterns = [
    /Error: (.+)/g,
    /SyntaxError: (.+)/g,
    /TypeError: (.+)/g,
    /ReferenceError: (.+)/g,
    /Module not found: (.+)/g,
    /Cannot find module (.+)/g,
    /Traceback \(most recent call last\):([\s\S]*?)(?=\n\n|\n$)/g,
    /fatal error: (.+)/g,
    /error: (.+)/g
  ];
  
  errorPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      errors.push(match[1] || match[0]);
    }
  });
  
  return errors;
}
