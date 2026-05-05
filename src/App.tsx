import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
// Aviso: Em produção, coloque essas chaves em um arquivo .env
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

// --- TIPAGENS ---
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
    title: '',
    description: '',
    format: 'Social Media',
    priority: 'Normal',
    deadline: '',
    referenceUrl: ''
  });

  const currentClient = INITIAL_CLIENTS.find(c => c.id === activeClientId) || INITIAL_CLIENTS[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setIsClientView(true);
      if (activeClientId === 'geral') setActiveClientId('c1');
    }
  }, []);

  useEffect(() => {
    if (currentClient) {
      document.title = isClientView
        ? `Portal: ${currentClient.name}`
        : `TaskHub | Gestão Aoki`;
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
    const requestsRef = collection(db, 'agencias', 'aoki', 'pedidos');
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      const docs: RequestItem[] = [];
      snapshot.forEach(d => {
        docs.push({ id: d.id, ...d.data() } as RequestItem);
      });
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
