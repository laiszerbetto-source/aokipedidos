import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  CheckCircle2, XCircle, Clock, Send, Plus, Trash2, Eye, Copy, 
  Image as ImageIcon, Layers, Edit3, Globe, Calendar, AlertCircle, 
  Briefcase, Loader2, Share, LayoutGrid, ClipboardList, Zap, Link as LinkIcon, ExternalLink, X
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
  const [isClientView, setIsClientView] = useState(false);

  // Estado do Formulário de Pedido
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    format: 'Social Media',
    priority: 'Normal',
    deadline: '',
    referenceUrl: '' 
  });

  const currentClient = INITIAL_CLIENTS.find(c => c.id === activeClientId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') setIsClientView(true);
  }, []);

  useEffect(() => {
    if (currentClient) {
      document.title = isClientView 
        ? `Portal de Pedidos: ${currentClient.name}` 
        : `Aoki TaskHub | Gestão de Artes`;
    }
  }, [currentClient, isClientView]);

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Erro auth:", err));
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
      snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(docs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredRequests = requests.filter(r => {
    const clientMatch = activeClientId === 'geral' ? true : r.clientId === activeClientId;
    const statusMatch = activeTab === 'todos' || r.status === activeTab;
    return clientMatch && statusMatch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.description.trim()) return;

    try {
      const id = editingId || Date.now().toString();
      const requestRef = doc(db, 'agencias', 'aoki', 'pedidos', id);
      
      const dataToSave = {
        ...formState,
        clientId: activeClientId === 'geral' ? 'c1' : activeClientId,
        status: editingId ? (requests.find(r => r.id === editingId)?.status || 'Pendente') : 'Pendente',
        createdAt: editingId ? requests.find(r => r.id === editingId).createdAt : new Date().toISOString(),
      };

      await setDoc(requestRef, dataToSave, { merge: true });
      setIsModalOpen(false);
      setEditingId(null);
      setFormState({ title: '', description: '', format: 'Social Media', priority: 'Normal', deadline: '', referenceUrl: '' });
    } catch (err) {
      console.error("Erro ao salvar pedido:", err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const requestRef = doc(db, 'agencias', 'aoki', 'pedidos', id);
      await setDoc(requestRef, { status: newStatus }, { merge: true });
    } catch (err) {}
  };

  const deleteRequest = async (id) => {
    if (confirm("Apagar este pedido permanentemente?")) {
      await deleteDoc(doc(db, 'agencias', 'aoki', 'pedidos', id));
    }
  };

  const copyClientLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'client');
    const textArea = document.createElement("textarea");
    textArea.value = url.toString();
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert("Link do Portal do Cliente copiado!");
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse text-xl">Carregando TaskHub...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row font-sans text-slate-900 antialiased">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 h-screen sticky top-0 overflow-y-auto z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <ClipboardList size={24} />
          </div>
          <span className="font-black text-2xl tracking-tighter">TaskHub</span>
        </div>

        {isClientView && (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={12} /> Portal do Cliente
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1 leading-tight">Solicite novas artes e acompanhe o progresso aqui.</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={12} /> {isClientView ? 'Sua Empresa' : 'Marca Aoki'}
            </p>
            <select 
              className="w-full bg-white border border-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none cursor-pointer"
              value={activeClientId}
              onChange={(e) => setActiveClientId(e.target.value)}
              disabled={isClientView && activeClientId !== 'geral'} 
            >
              {INITIAL_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-4">Status das Artes</p>
            {[
              { id: 'todos', label: 'Todos os Pedidos', icon: <LayoutGrid size={18} /> },
              { id: 'Pendente', label: 'Pendentes', icon: <Clock size={18} className="text-amber-500" /> },
              { id: 'Em Produção', label: 'Em Produção', icon: <Zap size={18} className="text-blue-500" /> },
              { id: 'Concluído', label: 'Concluídos', icon: <CheckCircle2 size={18} className="text-emerald-500" /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm transition-all ${
                  activeTab === t.id ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto space-y-3">
          {!isClientView && (
            <button onClick={copyClientLink} className="w-full bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all text-xs">
              <Share size={16} /> Link p/ Cliente
            </button>
          )}
          <button
            onClick={() => { setEditingId(null); setFormState({ title: '', description: '', format: 'Social Media', priority: 'Normal', deadline: '', referenceUrl: '' }); setIsModalOpen(true); }}
            className="w-full bg-slate-900 text-white py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-xl"
          >
            <Plus size={20} /> Novo Pedido
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${currentClient?.color}`} />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentClient?.name}</h2>
            </div>
            <p className="text-slate-400 text-sm font-medium italic">Fluxo de solicitações e produção de design</p>
          </div>
          <div className="bg-white border border-slate-200 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 shadow-sm">
            <Globe size={12} className="text-indigo-500" /> Pedidos Ativos: {filteredRequests.length}
          </div>
        </header>

        {/* Lista de Pedidos */}
        <div className="grid grid-cols-1 gap-4 max-w-4xl">
          {filteredRequests.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><ClipboardList className="text-slate-200" /></div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum pedido registrado</p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div 
                key={request.id}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  request.priority === 'Urgente' ? 'bg-red-500' : request.priority === 'Normal' ? 'bg-blue-500' : 'bg-slate-300'
                }`} />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <h3 className="text-lg font-black text-slate-800 tracking-tight">{request.title}</h3>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                         request.priority === 'Urgente' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500'
                       }`}>
                         {request.priority}
                       </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1"><Layers size={12} /> {request.format}</span>
                       <span className="flex items-center gap-1"><Calendar size={12} /> Prazo: {request.deadline ? request.deadline.split('-').reverse().join('/') : 'A combinar'}</span>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                    request.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    request.status === 'Em Produção' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                       request.status === 'Concluído' ? 'bg-emerald-500' : request.status === 'Em Produção' ? 'bg-blue-500' : 'bg-amber-500'
                    }`} />
                    {request.status}
                  </div>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{request.description}</p>

                <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    {!isClientView ? (
                      <>
                        <button 
                          onClick={() => updateStatus(request.id, request.status === 'Pendente' ? 'Em Produção' : 'Concluído')}
                          className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                        >
                          {request.status === 'Pendente' ? 'Iniciar Arte' : request.status === 'Em Produção' ? 'Concluir Arte' : 'Reabrir'}
                        </button>
                        <button onClick={() => { setEditingId(request.id); setFormState({...request}); setIsModalOpen(true); }} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-indigo-50 border border-slate-100"><Edit3 size={16} /></button>
                        <button onClick={() => deleteRequest(request.id)} className="p-2.5 bg-slate-50 text-slate-300 rounded-xl hover:text-rose-600 border border-slate-100"><Trash2 size={16} /></button>
                      </>
                    ) : (
                      request.status === 'Pendente' && (
                        <button onClick={() => deleteRequest(request.id)} className="text-slate-400 text-[10px] font-bold uppercase hover:text-rose-500 transition-all underline underline-offset-4">Cancelar Pedido</button>
                      )
                    )}

                    {request.referenceUrl && (
                      <a 
                        href={request.referenceUrl.startsWith('http') ? request.referenceUrl : `https://${request.referenceUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all border border-indigo-100"
                      >
                        <ExternalLink size={12} /> Abrir Material
                      </a>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    {activeClientId === 'geral' && (
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                        {INITIAL_CLIENTS.find(c => c.id === request.clientId)?.name}
                      </span>
                    )}
                    <span className="text-[8px] text-slate-300 font-bold uppercase">ID: {request.id}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de Novo Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-xl z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Editar Pedido' : 'Solicitar Nova Arte'}</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Cliente: <span className="text-indigo-600">{currentClient?.name}</span></p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Título do Pedido</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ex: Banner Site Liquidação"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all"
                      value={formState.title} 
                      onChange={(e) => setFormState({...formState, title: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Formato</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Social Media', 'Impresso', 'Logo', 'Site/Web'].map(f => (
                        <button 
                          key={f} 
                          type="button" 
                          onClick={() => setFormState({...formState, format: f})}
                          className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${
                            formState.format === f ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Prioridade</label>
                    <div className="flex gap-2">
                      {['Baixa', 'Normal', 'Urgente'].map(p => (
                        <button 
                          key={p} 
                          type="button" 
                          onClick={() => setFormState({...formState, priority: p})}
                          className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${
                            formState.priority === p ? 
                            (p === 'Urgente' ? 'border-red-600 bg-red-50 text-red-600 shadow-md' : 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md') 
                            : 'border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                      <LinkIcon size={12} className="text-indigo-500" /> Material de Apoio (Drive/Outros)
                    </label>
                    <input 
                      type="url" 
                      placeholder="Cole aqui o link do Drive ou Referência..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-indigo-600"
                      value={formState.referenceUrl} 
                      onChange={(e) => setFormState({...formState, referenceUrl: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Prazo Desejado</label>
                    <input 
                      type="date" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-indigo-500 cursor-pointer"
                      value={formState.deadline} 
                      onChange={(e) => setFormState({...formState, deadline: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Descrição e Instruções</label>
                    <textarea 
                      required 
                      rows={4} 
                      placeholder="Detalhe o seu pedido: cores, textos, objetivo..."
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all resize-none leading-relaxed"
                      value={formState.description} 
                      onChange={(e) => setFormState({...formState, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                  {editingId ? 'Salvar Alterações' : 'Enviar Pedido à Aoki'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}