'use client';

import { useState, useEffect } from 'react';
import { 
  Monitor, 
  Palette, 
  Type, 
  Globe, 
  Shield, 
  Download,
  Upload,
  RotateCcw,
  Save,
} from 'lucide-react';

interface SettingsData {
  theme: 'dark' | 'light' | 'auto';
  fontSize: number;
  fontFamily: string;
  editorTheme: string;
  language: string;
  autoSave: boolean;
  showMinimap: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  tabSize: number;
  aiModel: string;
  terminalFontSize: number;
  soundEnabled: boolean;
}

const defaultSettings: SettingsData = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  editorTheme: 'vs-dark',
  language: 'en',
  autoSave: true,
  showMinimap: true,
  wordWrap: true,
  lineNumbers: true,
  tabSize: 2,
  aiModel: 'openai',
  terminalFontSize: 14,
  soundEnabled: true
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get available models from environment variables
  const getAvailableModels = () => {
    const modelsString = process.env.NEXT_PUBLIC_AI_MODELS || 'openai,openai-fast,openai-large,qwen-coder,llama,mistral,deepseek-reasoning,grok,searchgpt';
    return modelsString.split(',').map(model => model.trim());
  };

  const availableModels = getAvailableModels();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('coder-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('coder-settings', JSON.stringify(settings));
    setHasUnsavedChanges(false);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `coder-settings-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings({ ...defaultSettings, ...imported });
          setHasUnsavedChanges(true);
        } catch {
          alert('Error importing settings file');
        }
      };
      reader.readAsText(file);
    }
  };

  const SettingSection = ({ 
    title, 
    icon: Icon, 
    children 
  }: { 
    title: string; 
    icon: React.ComponentType<{ size?: number }>; 
    children: React.ReactNode 
  }) => (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <Icon size={18} />
        <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ 
    label, 
    description, 
    children 
  }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode 
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className="sm:ml-4 flex-shrink-0">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20 sm:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Customize your coding environment</p>
          </div>
          
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-yellow-400 text-xs sm:text-sm">Unsaved changes</span>
            )}
            
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm sm:text-base"
            >
              <Save size={14} className="sm:w-4 sm:h-4" />
              Save
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* Appearance */}
          <SettingSection title="Appearance" icon={Palette}>
            <SettingRow 
              label="Theme" 
              description="Choose your preferred color scheme"
            >
              <select 
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as 'dark' | 'light' | 'auto')}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm min-w-[120px]"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="Editor Theme" 
              description="Code editor color theme"
            >
              <select 
                value={settings.editorTheme}
                onChange={(e) => updateSetting('editorTheme', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm min-w-[120px]"
              >
                <option value="vs-dark">VS Code Dark</option>
                <option value="vs-light">VS Code Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </SettingRow>
          </SettingSection>

          {/* Editor */}
          <SettingSection title="Editor" icon={Type}>
            <SettingRow 
              label="Font Family" 
              description="Font used in the code editor"
            >
              <select 
                value={settings.fontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm min-w-[150px]"
              >
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Monaco">Monaco</option>
                <option value="Consolas">Consolas</option>
                <option value="Courier New">Courier New</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="Font Size" 
              description="Editor font size in pixels"
            >
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm w-8 text-center">{settings.fontSize}px</span>
              </div>
            </SettingRow>

            <SettingRow 
              label="Tab Size" 
              description="Number of spaces per tab"
            >
              <select 
                value={settings.tabSize}
                onChange={(e) => updateSetting('tabSize', parseInt(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm min-w-[80px]"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="Show Minimap" 
              description="Display code minimap"
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showMinimap}
                  onChange={(e) => updateSetting('showMinimap', e.target.checked)}
                  className="sr-only"
                />
                <div className={`
                  w-11 h-6 rounded-full transition-colors duration-200
                  ${settings.showMinimap ? 'bg-blue-600' : 'bg-gray-600'}
                `}>
                  <div className={`
                    w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                    ${settings.showMinimap ? 'translate-x-5' : 'translate-x-0'}
                  `} style={{ marginTop: '2px', marginLeft: '2px' }} />
                </div>
              </label>
            </SettingRow>

            <SettingRow 
              label="Word Wrap" 
              description="Wrap long lines"
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wordWrap}
                  onChange={(e) => updateSetting('wordWrap', e.target.checked)}
                  className="sr-only"
                />
                <div className={`
                  w-11 h-6 rounded-full transition-colors duration-200
                  ${settings.wordWrap ? 'bg-blue-600' : 'bg-gray-600'}
                `}>
                  <div className={`
                    w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                    ${settings.wordWrap ? 'translate-x-5' : 'translate-x-0'}
                  `} style={{ marginTop: '2px', marginLeft: '2px' }} />
                </div>
              </label>
            </SettingRow>

            <SettingRow 
              label="Line Numbers" 
              description="Show line numbers"
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.lineNumbers}
                  onChange={(e) => updateSetting('lineNumbers', e.target.checked)}
                  className="sr-only"
                />
                <div className={`
                  w-11 h-6 rounded-full transition-colors duration-200
                  ${settings.lineNumbers ? 'bg-blue-600' : 'bg-gray-600'}
                `}>
                  <div className={`
                    w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                    ${settings.lineNumbers ? 'translate-x-5' : 'translate-x-0'}
                  `} style={{ marginTop: '2px', marginLeft: '2px' }} />
                </div>
              </label>
            </SettingRow>

            <SettingRow 
              label="Auto Save" 
              description="Automatically save files"
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSetting('autoSave', e.target.checked)}
                  className="sr-only"
                />
                <div className={`
                  w-11 h-6 rounded-full transition-colors duration-200
                  ${settings.autoSave ? 'bg-blue-600' : 'bg-gray-600'}
                `}>
                  <div className={`
                    w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                    ${settings.autoSave ? 'translate-x-5' : 'translate-x-0'}
                  `} style={{ marginTop: '2px', marginLeft: '2px' }} />
                </div>
              </label>
            </SettingRow>
          </SettingSection>

          {/* Terminal */}
          <SettingSection title="Terminal" icon={Monitor}>
            <SettingRow 
              label="Terminal Font Size" 
              description="Font size for terminal text"
            >
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={settings.terminalFontSize}
                  onChange={(e) => updateSetting('terminalFontSize', parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm w-8 text-center">{settings.terminalFontSize}px</span>
              </div>
            </SettingRow>
          </SettingSection>

          {/* AI Assistant */}
          <SettingSection title="AI Assistant" icon={Shield}>
            <SettingRow 
              label="Default Model" 
              description="Preferred AI model for assistance"
            >
              <select 
                value={settings.aiModel}
                onChange={(e) => updateSetting('aiModel', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm min-w-[150px]"
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>
                    {model.charAt(0).toUpperCase() + model.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </SettingRow>
          </SettingSection>

          {/* System */}
          <SettingSection title="System" icon={Globe}>
            <SettingRow 
              label="Language" 
              description="Interface language"
            >
              <select 
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm min-w-[120px]"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="Sound Effects" 
              description="Enable UI sound effects"
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                  className="sr-only"
                />
                <div className={`
                  w-11 h-6 rounded-full transition-colors duration-200
                  ${settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-600'}
                `}>
                  <div className={`
                    w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                    ${settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'}
                  `} style={{ marginTop: '2px', marginLeft: '2px' }} />
                </div>
              </label>
            </SettingRow>
          </SettingSection>

          {/* Import/Export */}
          <SettingSection title="Backup & Restore" icon={Download}>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportSettings}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                <Download size={16} />
                Export Settings
              </button>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer">
                <Upload size={16} />
                Import Settings
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={resetSettings}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              >
                <RotateCcw size={16} />
                Reset to Defaults
              </button>
            </div>
          </SettingSection>
        </div>
      </div>
    </div>
  );
}
