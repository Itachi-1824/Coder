'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Terminal, 
  Code, 
  Bug, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Play,
  Pause,
  Square,
  Download,
  Copy,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: {
    id: string;
    type: 'analyzing' | 'generating' | 'running' | 'fixing' | 'completed' | 'error';
    title: string;
    description?: string;
    progress?: number;
  };
}

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source?: 'terminal' | 'ai' | 'system';
}

interface CodeExecution {
  language: string;
  code: string;
  output: string;
  exitCode: number;
  duration: number;
}

export default function StatusDetailModal({ isOpen, onClose, status }: StatusDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'terminal' | 'code' | 'errors' | 'logs'>('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [codeExecutions, setCodeExecutions] = useState<CodeExecution[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  // Simulate real-time data based on status type
  useEffect(() => {
    if (!isOpen) return;

    // Clear previous data
    setLogs([]);
    setTerminalOutput([]);
    setCodeExecutions([]);
    setErrors([]);
    setIsRunning(status.type !== 'completed' && status.type !== 'error');

    // Generate mock data based on status type
    generateMockData(status.type);
  }, [isOpen, status.type]);

  const generateMockData = (statusType: string) => {
    const baseTimestamp = new Date();
    
    switch (statusType) {
      case 'analyzing':
        setLogs([
          { timestamp: new Date(baseTimestamp.getTime()), level: 'info', message: 'Starting code analysis...', source: 'ai' },
          { timestamp: new Date(baseTimestamp.getTime() + 1000), level: 'info', message: 'Scanning project structure...', source: 'system' },
          { timestamp: new Date(baseTimestamp.getTime() + 2000), level: 'info', message: 'Analyzing dependencies...', source: 'ai' },
          { timestamp: new Date(baseTimestamp.getTime() + 3000), level: 'info', message: 'Building context from files...', source: 'ai' }
        ]);
        setTerminalOutput([
          '> AI Analysis Started',
          '> Reading project files...',
          '> Found 15 JavaScript files, 8 CSS files, 3 JSON files',
          '> Building dependency graph...',
          '> Analysis in progress...'
        ]);
        break;

      case 'generating':
        setLogs([
          { timestamp: new Date(baseTimestamp.getTime()), level: 'info', message: 'Code generation initiated', source: 'ai' },
          { timestamp: new Date(baseTimestamp.getTime() + 1000), level: 'info', message: 'Creating new branch: ai-code-2024-06-02-14-30', source: 'system' },
          { timestamp: new Date(baseTimestamp.getTime() + 2000), level: 'info', message: 'Generating React components...', source: 'ai' },
          { timestamp: new Date(baseTimestamp.getTime() + 3000), level: 'info', message: 'Writing to files...', source: 'system' }
        ]);
        setTerminalOutput([
          '> git checkout -b ai-code-2024-06-02-14-30',
          'Switched to a new branch \'ai-code-2024-06-02-14-30\'',
          '> AI generating code...',
          '> Creating components/Calculator.jsx',
          '> Creating styles/calculator.css',
          '> Creating tests/calculator.test.js'
        ]);
        setCodeExecutions([
          {
            language: 'javascript',
            code: 'const Calculator = () => {\n  const [result, setResult] = useState(0);\n  return <div>Calculator</div>;\n};',
            output: 'Component created successfully',
            exitCode: 0,
            duration: 1200
          }
        ]);
        break;

      case 'running':
        setLogs([
          { timestamp: new Date(baseTimestamp.getTime()), level: 'info', message: 'Running tests...', source: 'system' },
          { timestamp: new Date(baseTimestamp.getTime() + 1000), level: 'info', message: 'npm test started', source: 'terminal' },
          { timestamp: new Date(baseTimestamp.getTime() + 2000), level: 'warning', message: 'Deprecated dependency warning', source: 'terminal' },
          { timestamp: new Date(baseTimestamp.getTime() + 3000), level: 'success', message: 'All tests passed', source: 'terminal' }
        ]);
        setTerminalOutput([
          '> npm test',
          '',
          '> react-scripts test',
          '',
          'PASS src/components/Calculator.test.js',
          '  ✓ renders calculator component (45 ms)',
          '  ✓ handles addition correctly (12 ms)',
          '  ✓ handles division by zero (8 ms)',
          '',
          'Test Suites: 1 passed, 1 total',
          'Tests:       3 passed, 3 total',
          'Time:        2.456 s'
        ]);
        break;

      case 'fixing':
        setLogs([
          { timestamp: new Date(baseTimestamp.getTime()), level: 'error', message: 'Build errors detected', source: 'system' },
          { timestamp: new Date(baseTimestamp.getTime() + 1000), level: 'info', message: 'AI analyzing errors...', source: 'ai' },
          { timestamp: new Date(baseTimestamp.getTime() + 2000), level: 'info', message: 'Applying fixes...', source: 'ai' },
          { timestamp: new Date(baseTimestamp.getTime() + 3000), level: 'success', message: 'Errors resolved', source: 'ai' }
        ]);
        setErrors([
          'TypeError: Cannot read property \'map\' of undefined at Calculator.jsx:15',
          'ESLint: \'useState\' is not defined (no-undef) at Calculator.jsx:3',
          'Warning: React Hook useEffect has missing dependencies'
        ]);
        setTerminalOutput([
          '> npm run build',
          '',
          'Failed to compile.',
          '',
          './src/components/Calculator.jsx',
          '  Line 15:  Cannot read property \'map\' of undefined',
          '  Line 3:   \'useState\' is not defined  no-undef',
          '',
          '> AI fixing errors...',
          '> Fixed: Added useState import',
          '> Fixed: Added null check for array mapping',
          '> Build successful!'
        ]);
        break;

      case 'completed':
        setLogs([
          { timestamp: new Date(baseTimestamp.getTime()), level: 'success', message: 'Task completed successfully', source: 'system' },
          { timestamp: new Date(baseTimestamp.getTime() + 1000), level: 'info', message: 'Files updated in branch', source: 'system' },
          { timestamp: new Date(baseTimestamp.getTime() + 2000), level: 'info', message: 'Ready for review', source: 'ai' }
        ]);
        setTerminalOutput([
          '✓ Code generation complete',
          '✓ Tests passed',
          '✓ No lint errors',
          '✓ Ready for deployment'
        ]);
        break;

      case 'error':
        setLogs([
          { timestamp: new Date(baseTimestamp.getTime()), level: 'error', message: 'Critical error occurred', source: 'system' },
          { timestamp: new Date(baseTimestamp.getTime() + 1000), level: 'error', message: 'API connection failed', source: 'ai' },
          { timestamp: new Date(baseTimestamp.getTime() + 2000), level: 'info', message: 'Retrying in 5 seconds...', source: 'system' }
        ]);
        setErrors([
          'Network Error: Failed to connect to AI service',
          'Timeout: Request exceeded 30 seconds',
          'Rate Limited: Too many requests, try again later'
        ]);
        setTerminalOutput([
          'ERROR: Connection to pollinations.ai failed',
          'ERROR: HTTP 429 - Rate limited',
          'ERROR: Retrying...',
          'ERROR: Max retries exceeded'
        ]);
        break;
    }
  };

  // Auto-scroll terminal and logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `status-logs-${status.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = () => {
    switch (status.type) {
      case 'analyzing': return <Loader className="animate-spin text-blue-400" size={20} />;
      case 'generating': return <Code className="text-purple-400" size={20} />;
      case 'running': return <Play className="text-green-400" size={20} />;
      case 'fixing': return <Bug className="text-yellow-400" size={20} />;
      case 'completed': return <CheckCircle className="text-green-400" size={20} />;
      case 'error': return <AlertCircle className="text-red-400" size={20} />;
      default: return <Loader className="animate-spin" size={20} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 100 }}
          className={`bg-gray-900 border border-gray-700 shadow-2xl flex flex-col ${
            isFullscreen 
              ? 'w-full h-full rounded-none' 
              : 'w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-4xl sm:rounded-xl rounded-t-2xl sm:mx-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl sm:rounded-t-xl">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-white truncate">{status.title}</h2>
                {status.description && (
                  <p className="text-xs sm:text-sm text-gray-300 truncate">{status.description}</p>
                )}
                {status.progress !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 max-w-24 sm:max-w-32 bg-gray-700 rounded-full h-1.5 sm:h-2">
                      <div 
                        className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${status.progress}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-300 whitespace-nowrap">{status.progress}%</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={downloadLogs}
                className="p-2 hover:bg-gray-700 rounded-lg touch-feedback hidden sm:block"
                title="Download Logs"
              >
                <Download size={16} className="text-gray-300" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-700 rounded-lg touch-feedback hidden sm:block"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg text-red-400 touch-feedback"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 px-2 sm:px-6 flex overflow-x-auto custom-scrollbar">
            {[
              { id: 'overview' as const, label: 'Overview', icon: CheckCircle },
              { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
              { id: 'code' as const, label: 'Code', icon: Code },
              { id: 'errors' as const, label: 'Errors', icon: Bug },
              { id: 'logs' as const, label: 'Logs', icon: RefreshCw }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-colors whitespace-nowrap touch-feedback ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                  {tab.id === 'errors' && errors.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                      {errors.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Status</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon()}
                      <span className="text-white capitalize">{status.type}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Logs</h3>
                    <span className="text-2xl font-bold text-white">{logs.length}</span>
                    <span className="text-sm text-gray-400 ml-2">entries</span>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Errors</h3>
                    <span className={`text-2xl font-bold ${errors.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {errors.length}
                    </span>
                    <span className="text-sm text-gray-400 ml-2">found</span>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                  <div className="space-y-2">
                    {logs.slice(-5).map((log, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-600 rounded">
                        <div className={`w-2 h-2 rounded-full ${
                          log.level === 'error' ? 'bg-red-400' :
                          log.level === 'warning' ? 'bg-yellow-400' :
                          log.level === 'success' ? 'bg-green-400' : 'bg-blue-400'
                        }`} />
                        <span className="text-sm text-gray-300">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-sm text-white flex-1">{log.message}</span>
                        <span className="text-xs text-gray-400">{log.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="h-full bg-black text-green-400 font-mono text-sm">
                <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-600">
                  <span className="text-gray-300">Terminal Output</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(terminalOutput.join('\n'))}
                      className="p-1 hover:bg-gray-700 rounded"
                      title="Copy Output"
                    >
                      <Copy size={14} />
                    </button>
                    {isRunning ? (
                      <button className="p-1 hover:bg-gray-700 rounded" title="Running">
                        <Pause size={14} />
                      </button>
                    ) : (
                      <button className="p-1 hover:bg-gray-700 rounded" title="Stopped">
                        <Square size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div ref={terminalRef} className="p-4 overflow-y-auto h-full">
                  {terminalOutput.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {line}
                    </div>
                  ))}
                  {isRunning && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-gray-400">Running...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="p-6 overflow-y-auto h-full">
                <h3 className="text-lg font-medium text-white mb-4">Code Executions</h3>
                {codeExecutions.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Code size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No code executions for this task</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {codeExecutions.map((execution, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-600 px-4 py-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {execution.language} - {execution.duration}ms
                          </span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            execution.exitCode === 0 ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            Exit {execution.exitCode}
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Code:</h4>
                            <pre className="bg-black p-3 rounded text-sm overflow-x-auto">
                              <code className="text-gray-100">{execution.code}</code>
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Output:</h4>
                            <pre className="bg-black p-3 rounded text-sm overflow-x-auto">
                              <code className="text-green-400">{execution.output}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'errors' && (
              <div className="p-6 overflow-y-auto h-full">
                <h3 className="text-lg font-medium text-white mb-4">Error Details</h3>
                {errors.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <CheckCircle size={48} className="mx-auto mb-4 opacity-50 text-green-400" />
                    <p>No errors found! Everything looks good.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errors.map((error, index) => (
                      <div key={index} className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <pre className="text-red-200 text-sm whitespace-pre-wrap font-mono">
                              {error}
                            </pre>
                          </div>
                          <button
                            onClick={() => copyToClipboard(error)}
                            className="p-1 hover:bg-red-600/30 rounded"
                            title="Copy Error"
                          >
                            <Copy size={14} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="h-full flex flex-col">
                <div className="bg-gray-700 px-6 py-3 border-b border-gray-600 flex items-center justify-between">
                  <span className="text-white font-medium">System Logs</span>
                  <button
                    onClick={() => copyToClipboard(logs.map(l => `[${l.timestamp.toISOString()}] ${l.level}: ${l.message}`).join('\n'))}
                    className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded"
                  >
                    Copy All
                  </button>
                </div>
                <div ref={logsRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-700/50 rounded">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        log.level === 'error' ? 'bg-red-400' :
                        log.level === 'warning' ? 'bg-yellow-400' :
                        log.level === 'success' ? 'bg-green-400' : 'bg-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`text-xs uppercase font-medium ${getLevelColor(log.level)}`}>
                            {log.level}
                          </span>
                          {log.source && (
                            <span className="text-xs text-gray-500 bg-gray-600 px-2 py-0.5 rounded">
                              {log.source}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-200">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
