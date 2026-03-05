import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  FileText, 
  FileCode, 
  FileImage, 
  File as FileIcon, 
  RefreshCw, 
  Download, 
  AlertCircle,
  Menu,
  X,
  Search
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface Document {
  id: string;
  name: string;
  url: string;
  type: 'md' | 'txt' | 'pdf' | 'image' | 'docx' | 'xlsx' | string;
  subtheme?: string;
}

interface Subtheme {
  name: string;
  documents: Document[];
}

interface Theme {
  id: string;
  name: string;
  subthemes: Subtheme[];
}

interface Catalog {
  themes: Theme[];
}

// --- Components ---

const FileViewer: React.FC<{ doc: Document }> = ({ doc }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doc.type === 'md' || doc.type === 'txt') {
      setLoading(true);
      setError(null);
      fetch(doc.url)
        .then(res => {
          if (!res.ok) throw new Error('Не удалось загрузить файл');
          return res.text();
        })
        .then(text => setContent(text))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setContent(null);
      setError(null);
    }
  }, [doc]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-2" />
        <p>Загрузка содержимого...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Ошибка загрузки</h3>
        <p className="max-w-md">{error}</p>
      </div>
    );
  }

  switch (doc.type) {
    case 'md':
      return (
        <div className="markdown-body p-8 max-w-4xl mx-auto">
          <Markdown>{content || ''}</Markdown>
        </div>
      );
    case 'txt':
      return (
        <div className="p-8 max-w-4xl mx-auto whitespace-pre-wrap font-mono text-slate-700 leading-relaxed">
          {content}
        </div>
      );
    case 'pdf':
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-blue" />
              <span className="font-medium text-slate-700">{doc.name}</span>
            </div>
            <a 
              href={doc.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-blue hover:underline font-medium"
            >
              <Download className="w-4 h-4" />
              Открыть в новом окне
            </a>
          </div>
          <div className="flex-1 bg-slate-200 relative">
            <iframe 
              src={`${doc.url}#toolbar=0&navpanes=0&scrollbar=1`} 
              className="w-full h-full border-none" 
              title={doc.name}
            />
            {/* Overlay message in case iframe fails or is empty */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 text-slate-400">
              <p>Загрузка PDF...</p>
            </div>
          </div>
        </div>
      );
    case 'image':
      return (
        <div className="flex items-center justify-center h-full p-8 bg-slate-100">
          <img 
            src={doc.url} 
            alt={doc.name} 
            className="max-w-full max-h-full object-contain shadow-lg rounded"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-400">
            <FileIcon className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-brand-blue mb-2">{doc.name}</h3>
          <p className="text-slate-500 mb-8 max-w-sm">
            Этот формат файла ({doc.type}) не поддерживает прямой предпросмотр. 
            Вы можете скачать его для просмотра на своем устройстве.
          </p>
          <a 
            href={doc.url} 
            download 
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-medium shadow-md"
          >
            <Download className="w-5 h-5" />
            Скачать файл
          </a>
        </div>
      );
  }
};

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchCatalog = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const response = await fetch('/catalog.json?t=' + Date.now());
      if (!response.ok) throw new Error('Failed to fetch catalog');
      const data: Catalog = await response.json();
      
      setCatalog(prev => {
        // If we have a previous selection, check if it still exists
        if (prev) {
          const themeExists = data.themes.find(t => t.id === selectedThemeId);
          if (!themeExists && data.themes.length > 0) {
            setSelectedThemeId(data.themes[0].id);
            const firstDoc = data.themes[0].subthemes[0]?.documents[0];
            setSelectedDocId(firstDoc?.id || null);
          } else if (themeExists) {
            const allDocs = themeExists.subthemes.flatMap(s => s.documents);
            const docExists = allDocs.find(d => d.id === selectedDocId);
            if (!docExists && allDocs.length > 0) {
              setSelectedDocId(allDocs[0].id);
            }
          }
        } else if (data.themes.length > 0) {
          // Initial load
          setSelectedThemeId(data.themes[0].id);
          const firstDoc = data.themes[0].subthemes[0]?.documents[0];
          setSelectedDocId(firstDoc?.id || null);
        }
        return data;
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      if (manual) setIsRefreshing(false);
    }
  }, [selectedThemeId, selectedDocId]);

  // Polling every 5 minutes
  useEffect(() => {
    fetchCatalog();
    const interval = setInterval(() => fetchCatalog(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCatalog]);

  const currentTheme = useMemo(() => 
    catalog?.themes.find(t => t.id === selectedThemeId), 
    [catalog, selectedThemeId]
  );

  const currentDoc = useMemo(() => {
    if (!currentTheme) return null;
    for (const sub of currentTheme.subthemes) {
      const doc = sub.documents.find(d => d.id === selectedDocId);
      if (doc) return doc;
    }
    return null;
  }, [currentTheme, selectedDocId]);

  const filteredSubthemes = useMemo(() => {
    if (!currentTheme) return [];
    if (!searchQuery) return currentTheme.subthemes;
    
    return currentTheme.subthemes.map(sub => ({
      ...sub,
      documents: sub.documents.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(sub => sub.documents.length > 0);
  }, [currentTheme, searchQuery]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'md': return <FileCode className="w-4 h-4" />;
      case 'txt': return <FileText className="w-4 h-4" />;
      case 'pdf': return <BookOpen className="w-4 h-4" />;
      case 'image': return <FileImage className="w-4 h-4" />;
      default: return <FileIcon className="w-4 h-4" />;
    }
  };

  if (!catalog) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-bg">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-10 h-10 text-brand-blue animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-16 bg-brand-blue text-white flex items-center justify-between px-6 shadow-md z-20">
        <div className="flex items-center gap-4">
          <div className="bg-brand-gold p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-brand-blue" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">ИТ-Школа</h1>
          
          <div className="h-8 w-px bg-white/20 mx-2 hidden sm:block" />
          
          <div className="relative">
            <select 
              value={selectedThemeId || ''} 
              onChange={(e) => {
                const themeId = e.target.value;
                setSelectedThemeId(themeId);
                const theme = catalog.themes.find(t => t.id === themeId);
                const firstDoc = theme?.subthemes[0]?.documents[0];
                setSelectedDocId(firstDoc?.id || null);
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-none rounded-lg px-4 py-2 pr-10 appearance-none cursor-pointer focus:ring-2 focus:ring-brand-gold outline-none transition-all font-medium max-w-[200px] sm:max-w-xs md:max-w-md truncate"
            >
              {catalog.themes.map(theme => (
                <option key={theme.id} value={theme.id} className="text-slate-900">
                  {theme.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60 hidden md:block">
            Обновлено: {lastUpdated.toLocaleTimeString()}
          </span>
          <button 
            onClick={() => fetchCatalog(true)}
            disabled={isRefreshing}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
            title="Обновить каталог"
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors lg:hidden"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (Documents List) */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside 
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full sm:w-72 lg:w-80 bg-white border-r border-slate-200 flex flex-col z-10 absolute lg:relative h-full shadow-xl lg:shadow-none"
            >
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Поиск документа..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {filteredSubthemes.length > 0 ? (
                  filteredSubthemes.map((sub, subIdx) => (
                    <div key={subIdx} className="space-y-1">
                      <h3 className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-lg">
                        {sub.name}
                      </h3>
                      <div className="space-y-1">
                        {sub.documents.map(doc => (
                          <button
                            key={doc.id}
                            onClick={() => {
                              setSelectedDocId(doc.id);
                              if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group relative overflow-hidden",
                              selectedDocId === doc.id 
                                ? "bg-brand-blue text-white shadow-md" 
                                : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg transition-colors",
                              selectedDocId === doc.id ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
                            )}>
                              {getFileIcon(doc.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate leading-tight">{doc.name}</p>
                              <p className={cn(
                                "text-[10px] uppercase tracking-wider font-bold mt-0.5",
                                selectedDocId === doc.id ? "text-white/60" : "text-slate-400"
                              )}>
                                {doc.type}
                              </p>
                            </div>
                            {selectedDocId === doc.id && (
                              <motion.div 
                                layoutId="active-indicator"
                                className="absolute right-0 top-0 bottom-0 w-1 bg-brand-gold"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Ничего не найдено</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                <span>{filteredSubthemes.reduce((acc, sub) => acc + sub.documents.length, 0)} документов</span>
                <span>ИТ-Школа Кострома</span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Reader Area */}
        <section className="flex-1 overflow-y-auto bg-white relative">
          {currentDoc ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDoc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <FileViewer doc={currentDoc} />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 p-8 text-center">
              <BookOpen className="w-20 h-20 mb-6 opacity-10" />
              <h2 className="text-2xl font-bold text-slate-400">Выберите документ</h2>
              <p className="max-w-xs mt-2">Используйте список слева, чтобы начать чтение учебных материалов.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
