'use client';
import { useState, useEffect, useRef } from 'react';
import {
  UserButton,
  OrganizationSwitcher,
  useAuth,
  useOrganization,
  SignIn
} from '@clerk/nextjs';
import {
  Send,
  Upload,
  Bot,
  Loader,
  Plus,
  File,
  Terminal,
  Activity,
  Shield,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function EnterpriseChat() {
  const { isLoaded, userId, orgId, orgRole } = useAuth();
  const { organization } = useOrganization();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filesList, setFilesList] = useState([]);

  // --- NEW MODAL STATES (Replaces browser popups) ---
  const [fileToDelete, setFileToDelete] = useState(null); // Stores file name being deleted
  const [showPurgeModal, setShowPurgeModal] = useState(false); // Handles full database purge warning

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Session-Change Security Listener
  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [orgId, userId]);

  const fetchFiles = async () => {
    if (!orgId) return;
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.files) setFilesList(data.files);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [orgId, uploading]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: formData });
      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Neural Link: "${file.name}" indexed successfully.`
        }]);
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // --- NEW SOLID DELETE FUNCTION (No browser alert) ---
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    setUploading(true);
    const target = fileToDelete;
    setFileToDelete(null); // Close modal immediately for smooth UI

    try {
      const res = await fetch(`/api/delete-file?filename=${encodeURIComponent(target)}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'system', content: `SYSTEM: "${target}" removed from memory.` }]);
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // --- NEW SOLID PURGE FUNCTION (No browser alert) ---
  const handlePurgeMemory = async () => {
    setShowPurgeModal(false); // Close modal
    setUploading(true);
    try {
      await fetch('/api/purge', { method: 'DELETE' });
      setMessages([{ role: 'system', content: "SYSTEM: Memory bank purged by administrator." }]);
      fetchFiles();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + data.error }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural Link Offline." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="h-screen bg-[#0B0F1A] flex items-center justify-center text-blue-500 font-mono">LOADING_SESSION...</div>;

  if (!userId) {
    return (
      <div className="h-screen bg-[#0B0F1A] flex flex-col items-center justify-center text-white p-4">
        <Activity size={48} className="text-blue-500 mb-6 animate-pulse" />
        <h1 className="text-xl font-bold mb-8 tracking-widest uppercase text-center">InsightStream Portal</h1>
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  if (userId && !orgId) {
    return (
      <div className="h-screen bg-[#0B0F1A] flex flex-col items-center justify-center text-white p-4 text-center">
        <Shield size={48} className="text-green-500 mb-6 animate-pulse" />
        <h2 className="text-xl font-bold mb-2 uppercase tracking-tighter">Workspace Required</h2>
        <p className="text-slate-400 mb-8 text-sm max-w-xs leading-relaxed">
          Initialize a secure organization workspace to continue.
        </p>

        <div className="p-1 min-w-[250px]">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              variables: {
                colorText: '#ffffff',
                colorTextSecondary: '#94a3b8',
                colorBackground: '#161b29',
              },
              elements: {
                organizationSwitcherTrigger: "text-white w-full justify-between bg-white/5 border border-white/10 hover:bg-white/10 transition-all px-4 py-2.5 rounded-xl",
                organizationPreviewTriggerIcon: "text-white opacity-70"
              }
            }}
          />
        </div>
      </div>
    );
  }

  const isAdmin = orgRole === 'org:admin';

  return (
    <div className="flex h-screen bg-[#0B0F1A] text-slate-200 font-sans relative">

      {/* --- SIDEBAR --- */}
      <aside className="w-64 border-r border-white/5 bg-[#0d111c] hidden md:flex flex-col p-4 z-30">
        <div className="flex items-center gap-2 px-2 mb-8">
          <Activity size={18} className="text-blue-500" />
          <span className="font-bold text-xl tracking-tight text-white">INSIGHT</span>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase px-2 mb-2 tracking-widest">Workspace</p>
            <div className="bg-white/5 p-1 rounded-xl border border-white/10">
              <OrganizationSwitcher
                hidePersonal
                appearance={{
                  variables: {
                    colorText: '#ffffff',
                    colorTextSecondary: '#94a3b8',
                    colorBackground: '#161b29',
                  },
                  elements: {
                    organizationSwitcherTrigger: "text-white w-full justify-between bg-white/5 border border-white/10 hover:bg-white/10 transition-all px-3 py-2 rounded-xl",
                    organizationPreviewTextContainer: "text-white",
                    organizationPreviewMainIdentifier: "text-white font-medium text-sm",
                    organizationSwitcherTriggerIcon: "text-white opacity-70"
                  }
                }}
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase px-2 mb-2 tracking-widest">Memory Bank</p>
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar px-1">
              {filesList.length === 0 ? (
                <p className="text-[11px] text-slate-600 italic px-2">No documents stored.</p>
              ) : (
                filesList.map((filename, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg text-xs text-slate-300 bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all group">
                    <div className="flex items-center gap-2 truncate">
                      <File size={12} className="text-blue-500" />
                      <span className="truncate">{filename}</span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setFileToDelete(filename)} // Trigger Custom Modal
                        className="text-slate-500 hover:text-red-500 p-0.5 rounded transition-colors"
                        title="Delete file"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase px-2 mb-2 tracking-widest">Identity</p>
            <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
              <UserButton />
              <div className="flex flex-col text-[10px]">
                <span className="text-white">Verified User</span>
                <span className={isAdmin ? 'text-green-500 font-bold' : 'text-blue-400'}>
                  {isAdmin ? 'ADMIN' : 'MEMBER'}
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowPurgeModal(true)} // Trigger Custom Purge Modal
              className="w-full flex items-center gap-2 p-3 text-[10px] text-red-500 hover:bg-red-500/10 rounded-xl border border-red-500/10 transition-all"
            >
              <Trash2 size={12} /> PURGE ORG MEMORY
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-white/5 text-[10px] text-slate-600 flex justify-between items-center">
          <span>SECURE_NODE_01</span>
          <Terminal size={14} />
        </div>
      </aside>

      {/* --- MAIN CHAT --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0B0F1A]/80 backdrop-blur-md z-20">
          <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase truncate max-w-[200px]">ORG_ID: {orgId}</span>
          {isAdmin && (
            <label className="bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-4 rounded-full text-xs font-bold cursor-pointer flex items-center gap-2">
              {uploading ? <Loader className="animate-spin" size={14} /> : <Upload size={14} />}
              INDEX PDF
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
            </label>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 z-10 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <Bot size={40} className="mb-2" />
              <p className="text-xs">Awaiting neural input...</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl text-sm max-w-[80%] ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/10 text-slate-200'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-[10px] text-blue-500 font-mono animate-pulse">PROCESSING_QUERY...</div>}
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-gradient-to-t from-[#0B0F1A] to-transparent z-20">
          <div className="max-w-4xl mx-auto flex gap-2 bg-[#161b29] border border-white/10 rounded-2xl p-2">
            <input
              className="flex-1 bg-transparent p-3 outline-none text-sm text-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Query ${organization?.name} knowledge...`}
            />
            <button type="submit" className="bg-blue-600 p-3 rounded-xl"><Send size={18} /></button>
          </div>
        </form>
      </main>

      {/* --- 🛡️ CUSTOM BADASS WARNING MODALS (Renders over everything) --- */}

      {/* 1. Delete Individual File Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121624] border border-red-500/20 max-w-sm w-full rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center space-y-4 animate-in duration-200">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Decommission Memory?</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Are you sure you want to permanently delete <span className="text-red-400 font-mono">"{fileToDelete}"</span> from organizational memory?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-all"
              >
                Abort
              </button>
              <button
                onClick={handleDeleteFile}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Wipe All Memory Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121624] border-2 border-red-500 max-w-md w-full rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center space-y-4 animate-in duration-300">
            <div className="w-14 h-14 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-widest">CRITICAL WARNING</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              You are about to execute a <span className="text-red-500 font-bold">TOTAL MEMORY WIPE</span> for <span className="text-white font-mono font-bold">"{organization?.name}"</span>. This will destroy all indexed documents and vector files permanently. This action cannot be reversed.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowPurgeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
              >
                Cancel Override
              </button>
              <button
                onClick={handlePurgeMemory}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                Execute Purge
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; } `}</style>
    </div>
  );
}