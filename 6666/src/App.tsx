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
  Search,
  Lock,
  LogOut,
  Plus,
  Trash2,
  Save,
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';

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
  type: 'md' | 'txt' | 'pdf' | 'image' | 'docx' | 'doc' | 'xlsx' | 'pptx' | string;
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
    case 'docx':
    case 'doc':
    case 'xlsx':
    case 'pptx':
      const isOffice = ['docx', 'doc', 'xlsx', 'pptx'].includes(doc.type);
      const viewerUrl = isOffice 
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(doc.url)}&embedded=true`
        : `${doc.url}#toolbar=0&navpanes=0&scrollbar=1`;

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              {getFileIcon(doc.type)}
              <span className="font-medium text-slate-700">{doc.name}</span>
            </div>
            <a 
              href={doc.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-blue hover:underline font-medium"
            >
              <Download className="w-4 h-4" />
              Открыть оригинал
            </a>
          </div>
          <div className="flex-1 bg-slate-200 relative">
            <iframe 
              src={viewerUrl} 
              className="w-full h-full border-none" 
              title={doc.name}
            />
            <div className="absolute inset-0 flex items-center justify-center -z-10 text-slate-400">
              <p>Загрузка документа...</p>
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

// --- Admin Components ---

const getFileIcon = (type: string) => {
  switch (type) {
    case 'md': return <FileCode className="w-4 h-4 text-indigo-500" />;
    case 'txt': return <FileText className="w-4 h-4 text-slate-500" />;
    case 'pdf': return <BookOpen className="w-4 h-4 text-red-500" />;
    case 'docx':
    case 'doc': return <FileText className="w-4 h-4 text-blue-600" />;
    case 'xlsx':
    case 'xls': return <FileText className="w-4 h-4 text-emerald-600" />;
    case 'pptx':
    case 'ppt': return <FileText className="w-4 h-4 text-orange-600" />;
    case 'image': return <FileImage className="w-4 h-4 text-purple-500" />;
    default: return <FileIcon className="w-4 h-4 text-slate-400" />;
  }
};

const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin();
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-blue p-4 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Вход в админ-панель</h2>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Введите учетные данные для управления каталогом документов
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Логин</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none transition-all"
              required
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-brand-blue text-white rounded-lg font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Войти'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AdminDashboard: React.FC<{ 
  catalog: Catalog, 
  setCatalog: (c: Catalog) => void, 
  onSave: (c: Catalog) => void,
  onLogout: () => void,
  onBack: () => void,
  isSaving: boolean,
  saveStatus: string
}> = ({ catalog, setCatalog, onSave, onLogout, onBack, isSaving, saveStatus }) => {
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const convertToPdf = async (file: File): Promise<File> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'doc') return file;

    // Mammoth only supports docx. For doc, we'll just upload as is for now 
    // or show a warning. But user asked for both. 
    // Since client-side .doc conversion is extremely complex, we'll focus on .docx
    // and provide a fallback for .doc.
    if (ext === 'doc') {
      console.warn('Auto-conversion to PDF is only supported for .docx files. .doc will be uploaded as is.');
      return file;
    }

    setIsConverting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Create a temporary container for conversion
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.padding = '40px';
      container.style.width = '800px';
      container.style.backgroundColor = 'white';
      container.style.color = 'black';
      container.style.fontFamily = 'serif';
      
      const opt = {
        margin: 1,
        filename: file.name.replace(/\.docx$/i, '.pdf'),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // @ts-ignore - html2pdf types might be missing
      const pdfBlob = await html2pdf().from(container).set(opt).output('blob');
      
      return new File([pdfBlob], opt.filename, { type: 'application/pdf' });
    } catch (err) {
      console.error('Conversion error:', err);
      return file;
    } finally {
      setIsConverting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, themeIdx: number, subIdx: number, docIdx: number) => {
    let file = e.target.files?.[0];
    if (!file) return;

    const docId = catalog.themes[themeIdx].subthemes[subIdx].documents[docIdx].id;
    setUploadingDocId(docId);

    // Auto-convert if it's docx
    if (file.name.toLowerCase().endsWith('.docx')) {
      file = await convertToPdf(file);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const newThemes = [...catalog.themes];
        const doc = newThemes[themeIdx].subthemes[subIdx].documents[docIdx];
        doc.url = data.url;
        
        // Extract name without extension
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
        doc.name = nameWithoutExt;

        // Auto-detect type from extension
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (['pdf', 'md', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)) {
          if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
            doc.type = 'image';
          } else {
            doc.type = ext;
          }
        } else {
          doc.type = ext;
        }
        
        setCatalog({ ...catalog, themes: newThemes });
      } else {
        alert(data.error || 'Ошибка загрузки');
      }
    } catch (err) {
      alert('Ошибка при загрузке файла');
    } finally {
      setUploadingDocId(null);
      e.target.value = '';
    }
  };

  const moveDocument = (themeIdx: number, subIdx: number, docIdx: number, direction: 'up' | 'down') => {
    const newThemes = [...catalog.themes];
    const docs = [...newThemes[themeIdx].subthemes[subIdx].documents];
    
    if (direction === 'up' && docIdx > 0) {
      [docs[docIdx], docs[docIdx - 1]] = [docs[docIdx - 1], docs[docIdx]];
    } else if (direction === 'down' && docIdx < docs.length - 1) {
      [docs[docIdx], docs[docIdx + 1]] = [docs[docIdx + 1], docs[docIdx]];
    } else {
      return;
    }

    newThemes[themeIdx].subthemes[subIdx].documents = docs;
    setCatalog({ ...catalog, themes: newThemes });
  };

  const handleAddDocument = async (e: React.ChangeEvent<HTMLInputElement>, themeIdx: number, subIdx: number) => {
    let file = e.target.files?.[0];
    if (!file) return;

    const tempId = `uploading-${Date.now()}`;
    setUploadingDocId(tempId);

    // Auto-convert if it's docx
    if (file.name.toLowerCase().endsWith('.docx')) {
      file = await convertToPdf(file);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const newThemes = [...catalog.themes];
        
        // Extract name without extension
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
        
        // Auto-detect type from extension
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        let docType = ext;
        if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) docType = 'image';
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'md', 'txt'].includes(ext)) {
          docType = ['png', 'jpg', 'jpeg', 'gif'].includes(ext) ? 'image' : ext;
        }

        newThemes[themeIdx].subthemes[subIdx].documents.push({
          id: `doc-${Date.now()}`,
          name: nameWithoutExt,
          url: data.url,
          type: docType
        });
        
        setCatalog({ ...catalog, themes: newThemes });
      } else {
        alert(data.error || 'Ошибка загрузки');
      }
    } catch (err) {
      alert('Ошибка при загрузке файла');
    } finally {
      setUploadingDocId(null);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-md z-20">
        <div className="flex items-center gap-4">
          <Settings className="w-6 h-6 text-brand-gold" />
          <h1 className="text-xl font-bold tracking-tight">Панель управления</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all"
          >
            Вернуться к чтению
          </button>
          <button 
            onClick={onLogout}
            className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-all"
            title="Выйти"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Редактирование каталога</h2>
            <p className="text-slate-500">Управляйте темами, подтемами и документами</p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && <span className="text-green-500 text-sm font-medium">Сохранено!</span>}
            {saveStatus === 'error' && <span className="text-red-500 text-sm font-medium">Ошибка сохранения</span>}
            <button 
              onClick={() => onSave(catalog)}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Сохранить изменения
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {catalog.themes.map((theme, themeIdx) => (
            <div key={theme.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="bg-slate-200 text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs">
                    {themeIdx + 1}
                  </span>
                  <input 
                    type="text" 
                    value={theme.name}
                    onChange={(e) => {
                      const newThemes = [...catalog.themes];
                      newThemes[themeIdx].name = e.target.value;
                      setCatalog({ ...catalog, themes: newThemes });
                    }}
                    className="bg-transparent border-none font-bold text-slate-800 focus:ring-0 p-0 text-lg w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const newThemes = catalog.themes.filter((_, i) => i !== themeIdx);
                      setCatalog({ ...catalog, themes: newThemes });
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {theme.subthemes.map((sub, subIdx) => (
                  <div key={subIdx} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <input 
                        type="text" 
                        value={sub.name}
                        onChange={(e) => {
                          const newThemes = [...catalog.themes];
                          newThemes[themeIdx].subthemes[subIdx].name = e.target.value;
                          setCatalog({ ...catalog, themes: newThemes });
                        }}
                        className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-transparent border-none focus:ring-0 p-0 w-full"
                      />
                      <button 
                        onClick={() => {
                          const newThemes = [...catalog.themes];
                          newThemes[themeIdx].subthemes = theme.subthemes.filter((_, i) => i !== subIdx);
                          setCatalog({ ...catalog, themes: newThemes });
                        }}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {sub.documents.map((doc, docIdx) => (
                        <div key={doc.id} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-slate-400">
                              {getFileIcon(doc.type)}
                            </div>
                            <div className="flex-1">
                              <input 
                                type="text" 
                                value={doc.name}
                                placeholder="Название документа"
                                onChange={(e) => {
                                  const newThemes = [...catalog.themes];
                                  newThemes[themeIdx].subthemes[subIdx].documents[docIdx].name = e.target.value;
                                  setCatalog({ ...catalog, themes: newThemes });
                                }}
                                className="w-full bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 p-0"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => moveDocument(themeIdx, subIdx, docIdx, 'up')}
                                disabled={docIdx === 0}
                                className="p-1.5 text-slate-400 hover:text-brand-blue disabled:opacity-20 transition-all"
                                title="Переместить выше"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => moveDocument(themeIdx, subIdx, docIdx, 'down')}
                                disabled={docIdx === sub.documents.length - 1}
                                className="p-1.5 text-slate-400 hover:text-brand-blue disabled:opacity-20 transition-all"
                                title="Переместить ниже"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <label className="cursor-pointer p-2 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all" title="Заменить файл">
                                {uploadingDocId === doc.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, themeIdx, subIdx, docIdx)}
                                  disabled={uploadingDocId === doc.id}
                                />
                              </label>
                              <button 
                                onClick={() => {
                                  const newThemes = [...catalog.themes];
                                  newThemes[themeIdx].subthemes[subIdx].documents = sub.documents.filter((_, i) => i !== docIdx);
                                  setCatalog({ ...catalog, themes: newThemes });
                                }}
                                className="p-2 text-slate-300 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 pl-11">
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                              {doc.url}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
                              <span className="opacity-50">Тип:</span>
                              <span>{doc.type}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-brand-blue hover:text-brand-blue transition-all text-sm font-medium cursor-pointer">
                        {uploadingDocId?.startsWith('uploading-') ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>Загрузить документ</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleAddDocument(e, themeIdx, subIdx)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newThemes = [...catalog.themes];
                    newThemes[themeIdx].subthemes.push({
                      name: 'НОВАЯ ПОДТЕМА',
                      documents: []
                    });
                    setCatalog({ ...catalog, themes: newThemes });
                  }}
                  className="flex items-center gap-2 text-brand-blue font-bold text-sm hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Добавить подтему
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={() => {
              const newTheme: Theme = {
                id: `theme-${Date.now()}`,
                name: 'Новый институт',
                subthemes: [
                  { name: 'ОБЩЕУНИВЕРСИТЕТСКИЕ ДИСЦИПЛИНЫ ПО ВЫБОРУ', documents: [] }
                ]
              };
              setCatalog({ ...catalog, themes: [...catalog.themes, newTheme] });
            }}
            className="w-full py-6 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-brand-blue hover:text-brand-blue transition-all group"
          >
            <div className="p-3 bg-slate-100 rounded-full mb-3 group-hover:bg-brand-blue/10 transition-all">
              <Plus className="w-8 h-8" />
            </div>
            <span className="font-bold">Добавить новый институт</span>
          </button>
        </div>
      </main>
      {isConverting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full"
          >
            <div className="bg-brand-blue/10 p-4 rounded-full">
              <RefreshCw className="w-10 h-10 text-brand-blue animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800">Конвертация в PDF</h3>
              <p className="text-slate-500 text-sm mt-2">
                Мы автоматически преобразуем ваш Word-файл в PDF для лучшей совместимости. Это может занять несколько секунд.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const fetchCatalog = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const response = await fetch('/api/catalog?t=' + Date.now());
      if (!response.ok) throw new Error('Failed to fetch catalog');
      const data: Catalog = await response.json();
      
      setCatalog(prev => {
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

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setIsAdmin(data.authenticated);
    } catch (err) {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
    checkAuth();
    const interval = setInterval(() => fetchCatalog(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCatalog, checkAuth]);

  const handleSaveCatalog = async (updatedCatalog: Catalog) => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCatalog),
      });
      if (res.ok) {
        setCatalog(updatedCatalog);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setIsAdmin(false);
    setShowAdminLogin(false);
  };

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

  if (showAdminLogin && !isAdmin) {
    return <AdminLogin onLogin={() => { setIsAdmin(true); setShowAdminLogin(false); }} />;
  }

  // --- Admin Dashboard View ---
  if (isAdmin && showAdminLogin) {
    return (
      <AdminDashboard 
        catalog={catalog}
        setCatalog={setCatalog}
        onSave={handleSaveCatalog}
        onLogout={handleLogout}
        onBack={() => setShowAdminLogin(false)}
        isSaving={isSaving}
        saveStatus={saveStatus}
      />
    );
  }

  // --- Main Reader View ---
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
          
          <div className="h-6 w-px bg-white/20 mx-1" />
          
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title={isAdmin ? "Админ-панель" : "Войти как админ"}
          >
            {isAdmin ? <Settings className="w-5 h-5 text-brand-gold" /> : <Lock className="w-5 h-5" />}
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
