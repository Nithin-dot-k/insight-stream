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
  Trash2
} from 'lucide-react';

export default function EnterpriseChat() {
  // 1. SECURE ACCESS HOOKS
  const { isLoaded, userId, orgId, orgRole } = useAuth();
  const { organization } = useOrganization();

  // 2. STATE MANAGEMENT
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filesList, setFilesList] = useState([]);

  const scrollRef = useRef(null);

  // Auto-scroll effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // --- 🔒 SECURITY EFFECT: CLEAR CHAT ON SESSION CHANGE ---
  // This ensures that if User A signs out and User B signs in, 
  // User B can NEVER see the previous user's chat messages.
  useEffect(() => {
    setMessages([]);
    setInput('');
    console.log("🔒 SECURITY: Session changed. Chat history wiped from browser memory.");
  }, [orgId, userId]);

  // Fetch real file list from Supabase
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

  // 3. ACTION HANDLERS
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
        fetchFiles(); // Refresh sidebar list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (orgRole !== 'org:admin') return alert("Admin rights required.");
    if (!confirm(`Delete "${filename}" from database memory?`)) return;

    try {
      setUploading(true);
      const res = await fetch(`/api/delete-file?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'system', content: `SYSTEM: "${filename}" removed from memory.` }]);
        fetchFiles(); // Refresh sidebar list
      }
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
      setLoading(false); // Shuts off "Thinking..." state
    }
  };

  // 4. RENDER GUARDS
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

        {/* We removed the white box and styled the switcher for dark mode */}
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
    <div className="flex h-screen bg-[#0B0F1A] text-slate-200 font-sans">

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
              {/* --- FIXED: Styled sidebar switcher to force text white --- */}
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

          {/* DYNAMIC MEMORY BANK (Reads files from Supabase) */}
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
                        onClick={() => handleDeleteFile(filename)}
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
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; } `}</style>
    </div>
  );
}