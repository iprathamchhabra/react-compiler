import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Split from 'react-split';
import { ChevronRight, File, Play, Settings, Share, Plus, X } from 'lucide-react';

interface FileData {
  name: string;
  content: string;
  language: string;
}

interface PackageData {
  name: string;
  version: string;
}

const defaultFiles: FileData[] = [
  {
    name: 'App.js',
    content: `// App.js
import "./styles.css";

export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}


export default App;`,
    language: 'javascript'
  },
  {
    name: 'index.js',
    content: `// index.js
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
    language: 'javascript'
  },
  {
    name: 'style.css',
    content: `.App {
  font-family: sans-serif;
  text-align: center;
}
`,
    language: 'css'
  }
];

const defaultPackages: PackageData[] = [
  { name: 'react', version: '^18.2.0' },
  { name: 'react-dom', version: '^18.2.0' }
];

export default function CodeEditor() {
  const [files, setFiles] = useState<FileData[]>(defaultFiles);
  const [activeFile, setActiveFile] = useState<FileData>(files[0]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [packages, setPackages] = useState<PackageData[]>(defaultPackages);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [key, setKey] = useState(0);

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      const updatedFiles = files.map(f => 
        f.name === activeFile.name ? { ...f, content: value } : f
      );
      setFiles(updatedFiles);
      setActiveFile({ ...activeFile, content: value });
    }
  };

  const executeCode = () => {
    setConsoleOutput([]);
    setIsRunning(true);
    setKey(prev => prev + 1);
    const code = activeFile.content;
    try {
        eval(code); 
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(errorMessage);
        setConsoleOutput(prev => [...prev, errorMessage]);
    } finally {
        setIsRunning(false);
    }
};

  const handleFileClick = (file: FileData) => {
    setActiveFile(file);
  };

  const createNewFile = () => {
    if (!newFileName) return;
    
    const extension = newFileName.split('.').pop()?.toLowerCase() || '';
    const language = extension === 'css' ? 'css' : 'javascript';
    
    const newFile: FileData = {
      name: newFileName,
      content: '',
      language
    };
    
    setFiles([...files, newFile]);
    setActiveFile(newFile);
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const addNewPackage = async () => {
    if (!newPackageName) return;

    try {
      const response = await fetch(`https://registry.npmjs.org/${newPackageName}/latest`);
      const data = await response.json();
      const version = data.version ? `^${data.version}` : 'latest';

      const newPackage: PackageData = {
        name: newPackageName,
        version
      };

      setPackages([...packages, newPackage]);
      setIsAddingPackage(false);
      setNewPackageName('');
      setConsoleOutput(prev => [...prev, `Added package ${newPackageName}@${version}`]);
    } catch (error) {
      setConsoleOutput(prev => [...prev, `Error adding package: ${error}`]);
    }
  };

  const generatePackageImports = () => {
    return packages
      .filter(pkg => pkg.name !== 'react' && pkg.name !== 'react-dom')
      .map(pkg => `<script src="https://unpkg.com/${pkg.name}@${pkg.version}"></script>`)
      .join('\n');
  };

  const handleConsoleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'console') {
      setConsoleOutput(prev => [...prev, event.data.message]);
    }
  };

  useEffect(() => {
    window.addEventListener('message', handleConsoleMessage);
    return () => window.removeEventListener('message', handleConsoleMessage);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-gray-300">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#1e1e1e] border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <span className="text-green-400">⋄</span>
          <button className="hover:bg-gray-800 p-2 rounded">
            <ChevronRight size={16} />
          </button>
          <button 
            className={`hover:bg-gray-800 p-2 rounded ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={executeCode}
            disabled={isRunning}
          >
            <Play size={16} className={isRunning ? 'animate-pulse' : ''} />
          </button>
          <span className="text-sm">React Playground</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="hover:bg-gray-800 p-2 rounded">
            <Share size={16} />
          </button>
          <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
            Sign Up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1e1e1e] border-r border-gray-800">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">FILES</span>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setIsCreatingFile(true)}
              >
                <Plus size={16} />
              </button>
            </div>
            {isCreatingFile && (
              <div className="mb-2 flex items-center">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="filename.jsx"
                  className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1 mr-2"
                  onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
                />
                <button 
                  onClick={() => setIsCreatingFile(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.name}
                  className={`flex items-center text-sm ${
                    activeFile.name === file.name
                      ? 'text-white bg-gray-800'
                      : 'text-gray-400 hover:text-white'
                  } cursor-pointer rounded px-2 py-1`}
                  onClick={() => handleFileClick(file)}
                >
                  <File size={14} className="mr-2" />
                  {file.name}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">PACKAGES</span>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setIsAddingPackage(true)}
                >
                  <Plus size={16} />
                </button>
              </div>
              {isAddingPackage && (
                <div className="mb-2 flex items-center">
                  <input
                    type="text"
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                    placeholder="package-name"
                    className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1 mr-2"
                    onKeyPress={(e) => e.key === 'Enter' && addNewPackage()}
                  />
                  <button 
                    onClick={() => setIsAddingPackage(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <div key={pkg.name} className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">•</span>
                    {pkg.name}@{pkg.version}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Editor and Preview */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex bg-[#1e1e1e] border-b border-gray-800">
            {files.map((file) => (
              <div
                key={file.name}
                className={`px-4 py-2 text-sm border-r border-gray-800 cursor-pointer ${
                  activeFile.name === file.name ? 'bg-[#2d2d2d] text-white' : 'text-gray-500'
                }`}
                onClick={() => handleFileClick(file)}
              >
                {file.name}
              </div>
            ))}
          </div>

          {/* Split View */}
          <Split
            className="flex-1 flex"
            sizes={[60, 40]}
            minSize={100}
            gutterSize={8}
            gutterStyle={() => ({
              backgroundColor: '#2d2d2d',
              cursor: 'col-resize',
            })}
          >
            {/* Editor Panel */}
            <div className="h-full">
              <Editor
                height="100%"
                defaultLanguage={activeFile.language}
                value={activeFile.content}
                theme="vs-dark"
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 10 },
                }}
              />
            </div>

            <div className="h-full flex flex-col">
              {/* Preview */}
              <div className="flex-1 bg-white">
                <iframe
                  key={key}
                  title="preview"
                  className="w-full h-full border-none"
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="UTF-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
                        <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
                        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                        ${generatePackageImports()}
                        <style>
                          body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
                          ${files.find(f => f.name === 'style.css')?.content || ''}
                        </style>
                      </head>
                      <body>
                        <div id="root"></div>
                        <script>
                          window.console = {
                            ...console,
                            log: (...args) => {
                              console.log(...args);
                              window.parent.postMessage({
                                type: 'console',
                                message: args.map(arg => 
                                  typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                                ).join(' ')
                              }, '*');
                            }
                          };
                        </script>
                        <script type="text/babel">
                          ${files.find(f => f.name === 'App.jsx')?.content || ''}
                          ${files.find(f => f.name === 'index.jsx')?.content || ''}
                        </script>
                      </body>
                    </html>
                  `}
                />
              </div>

              <div className="h-48 bg-[#1e1e1e] border-t border-gray-800 overflow-auto">
                <div className="flex items-center justify-between p-2 border-b border-gray-800">
                  <span className="text-sm">Console</span>
                  <button className="text-gray-400 hover:text-white">
                    <Settings size={14} />
                  </button>
                </div>
                <div className="p-4 text-sm font-mono">
                  {consoleOutput.map((log, index) => (
                    <div key={index} className="text-green-400">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Split>
        </div>
      </div>
    </div>
  );
}