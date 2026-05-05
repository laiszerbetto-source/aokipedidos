

import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
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
Share,
LayoutGrid,
ClipboardList,
Zap,
Link as LinkIcon,
ExternalLink,
X,
XCircle,
AlertCircle
} from 'lucide-react';

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

interface RequestItem {
id: string;
clientId: string;
title: string;
description: string;
format: string;
priority: string;
deadline: string;
referenceUrl: string;
status: string;
createdAt: string;
}

interface Client {
id: string;
name: string;
color: string;
}

const INITIAL_CLIENTS: Client[] = [
{ id: 'geral', name: 'Visão Geral (Agência)', color: 'from-indigo-600 to-purple-700' },
{ id: 'c1', name: 'Grupo Aoki', color: 'from-slate-700 to-black' },
{ id: 'c2', name: 'Ford Aoki', color: 'from-blue-600 to-blue-900' },
{ id: 'c3', name: 'Mercedes Aoki', color: 'from-slate-300 to-slate-500' },
{ id: 'c4', name: 'Consórcios Aoki', color: 'from-emerald-500 to-teal-700' },
{ id: 'c5', name: 'NAKI Autopeças', color: 'from-red-600 to-red-800' }
];

export default function App() {
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [requests, setRequests] = useState<RequestItem[]>([]);
const [activeClientId, setActiveClientId] = useState(INITIAL_CLIENTS[0].id);
const [activeTab, setActiveTab] = useState('todos');
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [isClientView, setIsClientView] = useState(false);
const [showCopyMessage, setShowCopyMessage] = useState(false);

const [formState, setFormState] = useState({
title: '', description: '', format: 'Social Media', priority: 'Normal', deadline: '', referenceUrl: ''
});

const currentClient = INITIAL_CLIENTS.find(c => c.id === activeClientId);

useEffect(() => {
const params = new URLSearchParams(window.location.search);
if (params.get('view') === 'client') {
setIsClientView(true);
if (activeClientId === 'geral') setActiveClientId('c1');
}
}, []);

useEffect(() => {
if (currentClient) {
document.title = isClientView ? Portal: ${currentClient.name} : TaskHub | Gestão Aoki;
}
}, [currentClient, isClientView]);

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
const unsubscribe = onSnapshot(collection(db, 'agencias', 'aoki', 'pedidos'), (snapshot) => {
const docs: RequestItem[] = [];
snapshot.forEach(d => { docs.push({ id: d.id, ...d.data() } as RequestItem); });
docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
setRequests(docs);
setIsLoading(false);
});
return () => unsubscribe();
}, [user]);

const filteredRequests = requests.filter(r => {
const clientMatch = activeClientId === 'geral' ? true : r.clientId === activeClientId;
return clientMatch && (activeTab === 'todos' || r.status === activeTab);
});

const handleSubmit = async (e: any) => {
e.preventDefault();
if (!formState.title.trim()) return;
try {
const id = editingId || Date.now().toString();
const existing = requests.find(r => r.id === editingId);
await setDoc(doc(db, 'agencias', 'aoki', 'pedidos', id), {
...formState,
clientId: activeClientId === 'geral' ? 'c1' : activeClientId,
status: editingId ? (existing?.status || 'Pendente') : 'Pendente',
createdAt: editingId ? (existing?.createdAt || new Date().toISOString()) : new Date().toISOString(),
}, { merge: true });
setIsModalOpen(false); setEditingId(null);
} catch (err) {}
};

const updateStatus = async (id: string, newStatus: string) => {
await setDoc(doc(db, 'agencias', 'aoki', 'pedidos', id), { status: newStatus }, { merge: true });
};

const deleteRequest = async (id: string) => {
if (window.confirm("Apagar pedido?")) await deleteDoc(doc(db, 'agencias', 'aoki', 'pedidos', id));
};

const copyClientLink = () => {
const url = new URL(window.location.href);
url.searchParams.set('view', 'client');
const el = document.createElement("textarea"); el.value = url.toString(); document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
setShowCopyMessage(true); setTimeout(() => setShowCopyMessage(false), 3000);
};

if (isLoading) return Carregando Hub...;

return (


TaskHub

Filtro Cliente
<select className="w-full bg-white border border-slate-200 text-sm font-bold rounded-xl px-4 py-3 outline-none" value={activeClientId} onChange={(e) => setActiveClientId(e.target.value)} disabled={isClientView}>
{INITIAL_CLIENTS.filter(c => !isClientView || c.id !== 'geral').map(c => {c.name})}


{[{ id: 'todos', label: 'Todos', icon:  }, { id: 'Pendente', label: 'Pendentes', icon:  }, { id: 'Em Produção', label: 'Em Produção', icon:  }, { id: 'Concluído', label: 'Concluídos', icon:  }].map(t => (
<button key={t.id} onClick={() => setActiveTab(t.id)} className={w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-50'}}>{t.icon} {t.label}
))}



{!isClientView &&  Link Cliente}
<button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="w-full bg-slate-900 text-white py-4 rounded-[2rem] font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-300 transition-all active:scale-95"> Novo Pedido




{currentClient?.name}Gestão de solicitações Aoki
 Ativos: {filteredRequests.length}

{showCopyMessage && Link copiado com sucesso!}

{filteredRequests.map(request => (

<div className={absolute left-0 top-0 bottom-0 w-1.5 ${request.priority === 'Urgente' ? 'bg-red-500' : 'bg-indigo-500'}} />

{request.title} {request.format} {request.deadline || 'A combinar'}
<div className={px-4 py-2 rounded-2xl text-[10px] font-black uppercase border shadow-sm ${request.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}}>{request.status}

{request.description}


{!isClientView && <button onClick={() => updateStatus(request.id, request.status === 'Pendente' ? 'Em Produção' : 'Concluído')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all active:scale-95 shadow-md">{request.status === 'Pendente' ? 'Iniciar' : 'Concluir'}}
{request.referenceUrl &&  Drive}

ID: {request.id.slice(-6)}


))}


{isModalOpen && (


{editingId ? 'Editar Pedido' : 'Solicitar Nova Arte'}



Nome do Pedido<input type="text" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={formState.title} onChange={(e) => setFormState({...formState, title: e.target.value})} />
Drive / Referência<input type="url" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={formState.referenceUrl} onChange={(e) => setFormState({...formState, referenceUrl: e.target.value})} />


Prazo<input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" value={formState.deadline} onChange={(e) => setFormState({...formState, deadline: e.target.value})} />
Instruções<textarea required rows={4} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium outline-none resize-none" value={formState.description} onChange={(e) => setFormState({...formState, description: e.target.value})}>



<button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase">Sair
Enviar Pedido




)}

);
}
