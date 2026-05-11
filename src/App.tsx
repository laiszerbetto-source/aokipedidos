// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Globe,
  Calendar,
  Briefcase,
  Loader2,
  LayoutGrid,
  ClipboardList,
  Zap,
  Link as LinkIcon,
  ExternalLink,
  X,
  AlertCircle,
  MessageSquare,
  SendHorizonal,
  FileCheck
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyARH2lOjbz9fQsOVJ25y-IQdzuMnfbfpRE",
  authDomain: "aoki-7a6ec.firebaseapp.com",
  projectId: "aoki-7a6ec",
  storageBucket: "aoki-7a6ec.firebasestorage.app",
  messagingSenderId: "762583424160",
  appId: "1:762583424160:web:72fa8b3bf5597a1db13dc5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const INITIAL_CLIENTS = [
  { id: 'geral', name: 'Visão Geral (Agência)', color: 'from-indigo-600 to-purple-700' },
  { id: 'c1', name: 'Grupo Aoki', color: 'from-slate-700 to-black' },
  { id: 'c2', name: 'Ford Aoki', color: 'from-blue-600 to-blue-900' },
  { id: 'c3', name: 'Mercedes Aoki', color: 'from-slate-300 to-slate-500' },
  { id: 'c4', name: 'Consórcios Aoki', color: 'from-emerald-500 to-teal-700' },
  { id: 'c5', name: 'NAKI Autopeças', color: 'from-red-600 to-red-800' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [activeClientId, setActiveClientId] = useState(INITIAL_CLIENTS[0].id);
  const [activeTab, setActiveTab] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [feedbackPost, setFeedbackPost] = useState(null);
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');

  const [formState, setFormState] = useState({
    title: '',
    description: '',
    format: 'Social Media',
    priority: 'Normal',
    deadline: '',
    referenceUrl: '',
    deliveryUrl: '' 
  });

  const currentClient = INITIAL_CLIENTS.find(c => c.id === activeClientId) || INITIAL_CLIENTS[0];

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error(err));
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const requestsRef = collection(db, 'agencias', 'aoki', 'pedidos');
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const docs = [];
      snapshot.forEach(d => {
        docs.push({ id: d.id, ...d.data() });
      });
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(docs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title.trim()) return;
    try {
      const id = editingId || Date.now().toString();
      const requestRef = doc(db, 'agencias', 'aoki', 'pedidos', id);
      const existing = requests.find(r => r.id === editingId);
      
      const isNewRequest = !editingId;

      await setDoc(requestRef, {
        ...formState,
        clientId: activeClientId === 'geral' ? 'c1' : activeClientId,
        status: editingId ? (existing?.status || 'Pendente') : 'Pendente',
        createdAt: editingId ? (existing?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      }, { merge: true });
      
      if (isNewRequest) {
        const myPhone = "551838511423"; 
        const myApiKey = "4845462"; 
        const clientName = INITIAL_CLIENTS.find(c => c.id === (activeClientId === 'geral' ? 'c1' : activeClientId))?.name;
        const msg = `🚀 *Novo Pedido: Aoki TaskHub*%0A*Cliente:* ${clientName}%0A*Projeto:* ${formState.title}%0A*Prazo:* ${formState.deadline || 'A combinar'}`;
        
        // Técnica robusta: Requisição silenciosa via fetch no-cors
        fetch(`https://api.callmebot.com/whatsapp.php?phone=${myPhone}&text=${msg}&apikey=${myApiKey}`, { 
          method: 'GET',
          mode: 'no-cors' 
        }).catch(() => {});
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormState({ title: '', description: '', format: 'Social Media', priority: 'Normal', deadline: '', referenceUrl: '', deliveryUrl: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    await setDoc(doc(db, 'agencias', 'aoki', 'pedidos', id), { status: newStatus }, { merge: true });
  };

  const deleteRequest = async (id) => {
    if (window.confirm("Apagar pedido permanentemente?")) {
      await deleteDoc(doc(db, 'agencias', 'aoki', 'pedidos', id));
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!newFeedbackMessage.trim() || !feedbackPost) return;
    const newMsg = { text: newFeedbackMessage.trim(), date: new Date().toISOString() };
    const updatedFeedbacks = [...(feedbackPost.feedbacks || []), newMsg];
    await setDoc(doc(db, 'agencias', 'aoki', 'pedidos', feedbackPost.id), { feedbacks: updatedFeedbacks }, { merge: true });
    setNewFeedbackMessage('');
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-slate-500"><Loader2 className="animate-spin mr-2" /> Sincronizando TaskHub...</div>;

  return (
    <div className="fixed inset-0 flex bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden relative">
      <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col gap-5 h-full shrink-0 z-20 shadow-sm overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg">A</div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">TaskHub</h1>
        </div>
        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner mt-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Briefcase size={12} /> Filtro Cliente</p>
            <select className="w-full bg-white border border-slate-200 text-sm font-bold rounded-xl px-3 py-2.5 outline-none" value={activeClientId} onChange={(e) => setActiveClientId(e.target.value)}>
              {INITIAL_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <nav className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-3">Estado</p>
            {[{ id: 'todos', label: 'Todos', icon: <LayoutGrid size={16} /> }, { id: 'Pendente', label: 'Pendentes', icon: <Clock size={16} className="text-amber-500" /> }, { id: 'Em Produção', label: 'Em Produção', icon: <Zap size={16} className="text-blue-500" /> }, { id: 'Alteração', label: 'Alteração', icon: <MessageSquare size={16} className="text-purple-500" /> }, { id: 'Concluído', label: 'Finalizados', icon: <CheckCircle2 size={16} className="text-emerald-500" /> }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>{t.icon} {t.label}</button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentClient?.name}</h2>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 shadow-sm">
            <Globe size={12} className="text-indigo-500" /> Ativos: {filteredRequests.length}
          </div>
        </header>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8 w-full items-start pb-24">
          {filteredRequests.map(request => (
            <div key={request.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all relative flex flex-col group min-h-[400px]">
              <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-md ${request.priority === 'Urgente' ? 'bg-red-500' : 'bg-indigo-500'}`} />
              <div className="p-6 pb-5 border-b border-slate-50 shrink-0">
                <div className="pl-4 flex flex-col gap-4">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <h3 className="text-lg font-black text-slate-800 flex-1 min-w-[120px] break-words leading-tight">{request.title}</h3>
                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${request.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{request.status}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">{request.format}</span>
                    <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">Prazo: {request.deadline || 'A combinar'}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 pl-10 flex-1 overflow-y-auto scrollbar-hide">
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">{request.description}</p>
              </div>
              <div className="p-6 pl-10 pt-0 mt-auto flex flex-col gap-3">
                <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <div className="flex gap-1">
                    {request.referenceUrl && <a href={request.referenceUrl} target="_blank" className="p-2 text-indigo-600 bg-white shadow-sm rounded-xl"><ExternalLink size={16} /></a>}
                    <button onClick={() => setFeedbackPost(request)} className="p-2 text-indigo-500 hover:bg-white rounded-xl relative"><MessageSquare size={16} />{request.feedbacks?.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>}</button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingId(request.id); setFormState({...request}); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:bg-white rounded-xl"><Edit3 size={16} /></button>
                    <button onClick={() => deleteRequest(request.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-xl"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button onClick={() => updateStatus(request.id, request.status === 'Pendente' ? 'Em Produção' : 'Pendente')} className="w-full bg-white text-slate-600 py-3 rounded-xl text-[9px] font-black border border-slate-200">Iniciar/Pausar</button>
                  <button onClick={() => { setEditingId(request.id); setFormState({...request}); setIsModalOpen(true); }} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[9px] font-black shadow-lg">Entregar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button onClick={() => { setEditingId(null); setFormState({ title: '', description: '', format: 'Social Media', priority: 'Normal', deadline: '', referenceUrl: '', deliveryUrl: '' }); setIsModalOpen(true); }} className="fixed bottom-10 right-10 bg-indigo-600 text-white h-14 w-14 md:h-auto md:px-8 md:py-4 rounded-full font-black shadow-xl z-40 flex items-center justify-center gap-3"><Plus size={24} /><span className="hidden md:block">Novo Pedido</span></button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full h-[95vh] md:h-auto md:max-h-[90vh] md:max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-xl font-black text-slate-900 uppercase">{editingId ? 'Gerir Solicitação' : 'Novo Pedido'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-2xl text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Nome</label>
                      <input type="text" required className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none" value={formState.title} onChange={(e) => setFormState({...formState, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Urgência</label>
                      <div className="flex gap-2">
                        {['Normal', 'Urgente'].map(p => (
                          <button key={p} type="button" onClick={() => setFormState({...formState, priority: p})} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black ${formState.priority === p ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>{p}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Link Drive (Opcional)</label>
                      <input type="url" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs outline-none" value={formState.referenceUrl} onChange={(e) => setFormState({...formState, referenceUrl: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Instruções</label>
                      <textarea required rows={4} className="w-full p-5 bg-slate-50 border rounded-3xl text-sm outline-none resize-none" value={formState.description} onChange={(e) => setFormState({...formState, description: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>
                {editingId && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                      <label className="block text-[10px] font-black text-emerald-600 uppercase mb-3"><FileCheck size={14} className="inline mr-2" /> Link da Entrega</label>
                      <input type="url" className="w-full p-4 bg-white border border-emerald-200 rounded-2xl text-xs" value={formState.deliveryUrl || ''} onChange={(e) => setFormState({...formState, deliveryUrl: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-50 bg-white flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase shadow-lg">Salvar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
