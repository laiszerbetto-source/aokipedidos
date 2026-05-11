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

// --- CLIENTES DA AGÊNCIA ---
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

  // Sistema de Chat/Feedback
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
    if (currentClient) {
      document.title = `TaskHub | Gestão Aoki`;
    }
  }, [currentClient]);

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

  // Atualiza o modal de chat caso receba nova mensagem
  useEffect(() => {
    if (feedbackPost) {
      const updated = requests.find(p => p.id === feedbackPost.id);
      if (updated) setFeedbackPost(updated);
    }
  }, [requests]);

  const filteredRequests = requests.filter(r => {
    const clientMatch = activeClientId === 'geral' ? true : r.clientId === activeClientId;
    const statusMatch = activeTab === 'todos' || r.status === activeTab;
    return clientMatch && statusMatch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) return;
    try {
      const id = editingId || Date.now().toString();
      const requestRef = doc(db, 'agencias', 'aoki', 'pedidos', id);
      const existing = requests.find(r => r.id === editingId);
      
      const isNewRequest = !editingId; // Verifica se é um pedido novo para mandar o WhatsApp

      await setDoc(requestRef, {
        ...formState,
        clientId: activeClientId === 'geral' ? 'c1' : activeClientId,
        status: editingId ? (existing?.status || 'Pendente') : 'Pendente',
        createdAt: editingId ? (existing?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      }, { merge: true });
      
      // DISPARO PARA O WHATSAPP SE FOR UM PEDIDO NOVO
      if (isNewRequest) {
        const myPhone = "551838511423"; 
        const myApiKey = "4845462"; 
        
        const clientName = INITIAL_CLIENTS.find(c => c.id === (activeClientId === 'geral' ? 'c1' : activeClientId))?.name;
        
        const mensagem = `🚀 *Novo Pedido: Aoki TaskHub*%0A*Cliente:* ${clientName}%0A*Projeto:* ${formState.title}%0A*Urgência:* ${formState.priority}%0A*Prazo:* ${formState.deadline || 'A combinar'}`;
        
        fetch(`https://api.callmebot.com/whatsapp.php?phone=${myPhone}&text=${mensagem}&apikey=${myApiKey}`, { 
          method: 'GET',
          mode: 'no-cors' // <-- ISTO PREVINE O ERRO DO NAVEGADOR
        }).catch(err => console.log("Erro no aviso do Whats", err));
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormState({ title: '', description: '', format: 'Social Media', priority: 'Normal', deadline: '', referenceUrl: '', deliveryUrl: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await setDoc(doc(db, 'agencias', 'aoki', 'pedidos', id), { status: newStatus }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRequest = async (id) => {
    try {
      if (window.confirm("Deseja apagar este pedido permanentemente?")) {
        await deleteDoc(doc(db, 'agencias', 'aoki', 'pedidos', id));
      }
    } catch (err) {
      console.error(err);
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-bold">
        <Loader2 className="animate-spin mr-2" />
        Sincronizando Aoki TaskHub...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden print:hidden relative">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col gap-5 h-full shrink-0 z-20 shadow-sm overflow-y-auto scrollbar-hide">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg">A</div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">TaskHub</h1>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner mt-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Briefcase size={12} /> Filtro Cliente
            </p>
            <select 
              className="w-full bg-white border border-slate-200 text-sm font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-100 transition-all"
              value={activeClientId}
              onChange={(e) => setActiveClientId(e.target.value)}
            >
              {INITIAL_CLIENTS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <nav className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-3">Estado</p>
            {[
              { id: 'todos', label: 'Todos os Pedidos', icon: <LayoutGrid size={16} /> },
              { id: 'Pendente', label: 'Pendentes', icon: <Clock size={16} className="text-amber-500" /> },
              { id: 'Em Produção', label: 'Em Produção', icon: <Zap size={16} className="text-blue-500" /> },
              { id: 'Alteração', label: 'Em Alteração', icon: <MessageSquare size={16} className="text-purple-500" /> },
              { id: 'Concluído', label: 'Finalizados', icon: <CheckCircle2 size={16} className="text-emerald-500" /> }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all ${
                  activeTab === t.id ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-500 hover:bg-slate-50 font-medium'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${currentClient?.color} shadow-sm`} />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{currentClient?.name}</h2>
            </div>
            <p className="text-slate-400 text-xs md:text-sm font-medium italic uppercase tracking-widest text-[10px] ml-5">Portal de Gestão Aoki</p>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 shadow-sm">
            <Globe size={12} className="text-indigo-500" /> Ativos: {filteredRequests.length}
          </div>
        </header>

        {/* GRID DE CARTÕES "INQUEBRÁVEIS" COM AUTO-FILL */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8 w-full items-start pb-24">
          {filteredRequests.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center flex flex-col items-center col-span-full">
              <ClipboardList className="text-slate-200 w-16 h-16 mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum pedido registrado aqui</p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div key={request.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all relative flex flex-col group min-h-[400px]">
                
                {/* Faixa Lateral de Prioridade */}
                <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-md ${
                  request.priority === 'Urgente' ? 'bg-red-500' : request.priority === 'Normal' ? 'bg-indigo-500' : 'bg-slate-300'
                }`} />

                {/* CABEÇALHO DO CARD */}
                <div className="p-6 pb-5 border-b border-slate-50 shrink-0">
                  <div className="pl-4 flex flex-col gap-4">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                       <h3 className="text-lg font-black text-slate-800 tracking-tight flex-1 min-w-[120px] break-words leading-tight">{request.title}</h3>
                       <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm shrink-0 ${
                          request.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          request.status === 'Em Produção' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          request.status === 'Alteração' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            request.status === 'Concluído' ? 'bg-emerald-500' : 
                            request.status === 'Em Produção' ? 'bg-blue-500' : 
                            request.status === 'Alteração' ? 'bg-purple-500' : 'bg-amber-500'
                          }`} />
                          {request.status}
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md shrink-0"><LayoutGrid size={10} /> {request.format}</span>
                       <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md shrink-0"><Calendar size={10} /> Prazo: {request.deadline ? request.deadline.split('-').reverse().join('/') : 'A combinar'}</span>
                       {request.priority === 'Urgente' && <span className="text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100 flex items-center gap-1 shrink-0"><AlertCircle size={10} /> Urgente</span>}
                    </div>
                  </div>
                </div>

                {/* DESCRIÇÃO COM SCROLL */}
                <div className="p-6 pl-10 flex-1 overflow-y-auto scrollbar-hide flex flex-col">
                  {activeClientId === 'geral' && <span className="text-indigo-500 uppercase tracking-widest bg-indigo-50 w-fit px-2 py-0.5 rounded border border-indigo-100 mb-3 block text-[8px] font-black">{INITIAL_CLIENTS.find(c => c.id === request.clientId)?.name}</span>}
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">{request.description}</p>
                </div>

                {/* ÁREA DE ENTREGA (Se houver link da arte) */}
                {request.deliveryUrl && (
                  <div className="px-6 pl-10 pb-4 shrink-0">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                        <FileCheck size={14} /> Arte Entregue
                      </div>
                      <a href={request.deliveryUrl.startsWith('http') ? request.deliveryUrl : `https://${request.deliveryUrl}`} target="_blank" rel="noopener noreferrer" className="bg-white text-emerald-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-sm border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-colors">
                        Acessar Link
                      </a>
                    </div>
                  </div>
                )}

                {/* RODAPÉ DO CARD */}
                <div className="p-6 pl-10 pt-0 mt-auto shrink-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <div className="flex gap-1">
                      {request.referenceUrl ? (
                        <a href={request.referenceUrl.startsWith('http') ? request.referenceUrl : `https://${request.referenceUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all" title="Ver Link Base">
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        <div className="p-2 text-slate-300 rounded-xl" title="Sem Link de Apoio"><LinkIcon size={16} /></div>
                      )}
                      <button onClick={() => setFeedbackPost(request)} className="p-2 text-indigo-500 hover:bg-white hover:shadow-sm rounded-xl transition-all relative" title="Chat/Alterações">
                        <MessageSquare size={16} />
                        {request.feedbacks?.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></span>}
                      </button>
                    </div>
                    
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingId(request.id); setFormState({...request}); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-xl transition-all" title="Editar"><Edit3 size={16} /></button>
                      <button onClick={() => deleteRequest(request.id)} className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {request.status === 'Concluído' ? (
                      <>
                        <button onClick={() => updateStatus(request.id, 'Em Produção')} className="w-full bg-white text-slate-600 py-3 rounded-xl text-[9px] md:text-[10px] font-black border border-slate-200 hover:bg-slate-50 transition-colors uppercase tracking-widest">
                          Reabrir
                        </button>
                        <button disabled className="w-full bg-emerald-50 text-emerald-400 border border-emerald-100 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                          Entregue
                        </button>
                      </>
                    ) : request.deliveryUrl && request.status !== 'Alteração' ? (
                      <>
                        <button onClick={() => updateStatus(request.id, 'Alteração')} className="w-full bg-white text-purple-600 border border-purple-200 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-purple-50 transition-all">
                          Pedir Alteração
                        </button>
                        <button onClick={() => updateStatus(request.id, 'Concluído')} className="w-full bg-emerald-500 text-white py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all">
                          Aprovar
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => updateStatus(request.id, request.status === 'Pendente' ? 'Em Produção' : 'Pendente')} className="w-full bg-white text-slate-600 py-3 rounded-xl text-[9px] md:text-[10px] font-black border border-slate-200 hover:bg-slate-50 transition-colors uppercase tracking-widest">
                          {request.status === 'Pendente' ? 'Iniciar' : 'Pausar'}
                        </button>
                        <button onClick={() => { setEditingId(request.id); setFormState({...request}); setIsModalOpen(true); }} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:bg-indigo-700">
                          Entregar Arte
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* FAB: BOTÃO FLUTUANTE DE NOVO PEDIDO */}
      <button 
        onClick={() => { setEditingId(null); setFormState({ title: '', description: '', format: 'Social Media', priority: 'Normal', deadline: '', referenceUrl: '', deliveryUrl: '' }); setIsModalOpen(true); }}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-indigo-600 text-white h-14 w-14 md:h-auto md:w-auto md:px-8 md:py-4 rounded-full font-black shadow-[0_10px_40px_-10px_rgba(79,70,229,0.8)] hover:bg-indigo-700 hover:-translate-y-1 transition-all z-40 flex items-center justify-center gap-3 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" /> 
        <span className="hidden md:block uppercase tracking-widest text-[11px]">Novo Pedido</span>
      </button>

      {/* MURAL DE CHAT */}
      {feedbackPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><MessageSquare size={18} className="text-indigo-500" /> Mural do Pedido</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {feedbackPost.status}</p>
              </div>
              <button onClick={() => setFeedbackPost(null)} className="p-2 bg-white rounded-xl text-slate-400 shadow-sm hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {(!feedbackPost.feedbacks || feedbackPost.feedbacks.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-50">
                  <MessageSquare size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest">Sem recados ainda</p>
                </div>
              ) : (
                feedbackPost.feedbacks.map((msg, i) => (
                  <div key={i} className="flex flex-col items-start">
                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{new Date(msg.date).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}</span>
                    <div className="px-4 py-3 rounded-2xl max-w-[85%] text-sm font-medium leading-relaxed shadow-sm bg-slate-100 text-slate-800 rounded-bl-none">
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendFeedback} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
              <input type="text" value={newFeedbackMessage} onChange={(e) => setNewFeedbackMessage(e.target.value)} placeholder="Deixe um recado..." className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-500 transition-colors" />
              <button type="submit" disabled={!newFeedbackMessage.trim()} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex-shrink-0"><SendHorizonal size={20} /></button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO/EDITAR PEDIDO - BLINDADO CONTRA CORTES */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            
            {/* CABEÇALHO FIXO */}
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0 z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">{editingId ? 'Gerir Solicitação' : 'Novo Pedido de Arte'}</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">Para: <span className="text-indigo-600">{currentClient?.name}</span></p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 md:p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all hover:rotate-90"><X size={20} className="md:w-6 md:h-6" /></button>
            </div>
            
            {/* CORPO DO MODAL E BOTÕES */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              
              {/* ÁREA DE SCROLL (Apenas os campos rolam) */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 md:space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <div className="space-y-6 md:space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Nome do Pedido</label>
                      <input type="text" required placeholder="Ex: Banner Site Liquidação" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all shadow-inner" value={formState.title} onChange={(e) => setFormState({...formState, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Tipo</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Social Media', 'Impresso', 'Logo', 'Site/Web'].map(f => (
                          <button key={f} type="button" onClick={() => setFormState({...formState, format: f})} className={`py-3 md:py-3.5 rounded-xl border-2 text-[9px] md:text-[10px] font-black uppercase transition-all ${formState.format === f ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Urgência</label>
                      <div className="flex gap-2">
                        {['Baixa', 'Normal', 'Urgente'].map(p => (
                          <button key={p} type="button" onClick={() => setFormState({...formState, priority: p})} className={`flex-1 py-3 md:py-3.5 rounded-xl border-2 text-[9px] md:text-[10px] font-black uppercase transition-all ${formState.priority === p ? (p === 'Urgente' ? 'border-red-600 bg-red-50 text-red-600 shadow-md' : 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md') : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>{p}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6 md:space-y-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-2"><LinkIcon size={14} className="text-indigo-500" /> Link do Drive / Apoio <span className="text-[8px] font-bold text-slate-300">(Opcional)</span></label>
                      {/* NOTA: Removido o 'required' para tornar o campo opcional */}
                      <input type="url" placeholder="Ex: google.com/drive/..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-indigo-600" value={formState.referenceUrl} onChange={(e) => setFormState({...formState, referenceUrl: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Prazo Desejado</label>
                      <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-indigo-500 cursor-pointer shadow-inner text-slate-600" value={formState.deadline} onChange={(e) => setFormState({...formState, deadline: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Instruções Adicionais</label>
                      <textarea required rows={4} placeholder="Cores, textos, objetivo..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] md:rounded-[2rem] text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all resize-none leading-relaxed shadow-inner" value={formState.description} onChange={(e) => setFormState({...formState, description: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>

                {/* AREA DE ENTREGA DO LINK (Sempre visível ao editar) */}
                {editingId && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                     <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                      <label className="block text-[10px] font-black text-emerald-600 uppercase mb-3 tracking-widest flex items-center gap-2"><FileCheck size={14} /> Link da Arte Final (Entrega)</label>
                      <input type="url" placeholder="Ex: google.com/drive/arte-final..." className="w-full p-4 bg-white border border-emerald-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all text-emerald-700 shadow-sm" value={formState.deliveryUrl || ''} onChange={(e) => setFormState({...formState, deliveryUrl: e.target.value})} />
                      <p className="text-[10px] text-emerald-600 font-bold mt-3 ml-2">Coloque aqui o link do arquivo pronto para aparecer os botões de Aprovação.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RODAPÉ FIXO COM OS BOTÕES */}
              <div className="p-6 md:p-8 border-t border-slate-50 bg-white shrink-0 flex gap-3 md:gap-4 z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 md:py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-[1.5rem] transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Salvar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
