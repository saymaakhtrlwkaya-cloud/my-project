import React, { useState, useEffect, useRef, useMemo, useCallback, Component } from 'react';
import { 
  Shield, Box, Tag, DollarSign, Award, 
  ChevronDown, 
  Search, Wifi, WifiOff, Plus, Minus, Trash2, UploadCloud, 
  Image as LucideImage, Loader2, AlertTriangle, Save, CheckCircle,
  Users, Settings, Bell, User, LogIn, PlayCircle, StopCircle, Lock, Unlock,
  Home, UserCircle, Zap, PenTool, Database as DatabaseIcon, RefreshCw, Power
} from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, update, remove, query, orderByChild, equalTo, limitToLast, off } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA5qD4YVS2P15yWR8A1TuscMfJwVyKjhAY",
  authDomain: "vipmall-admin.firebaseapp.com",
  databaseURL: "https://vipmall-admin-default-rtdb.firebaseio.com",
  projectId: "vipmall-admin",
  storageBucket: "vipmall-admin.firebasestorage.app",
  messagingSenderId: "527235469320",
  appId: "1:527235469320:web:7c2101ded3b4bc6f2881bd",
  measurementId: "G-9K5FK1E9GX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const BOXES = [
  { id: 'Amazon', title: 'AMAZON (1-8)', start: 1, end: 8, slots: 8, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-400' },
  { id: 'Alibaba', title: 'ALIBABA (9-16)', start: 9, end: 16, slots: 8, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400' },
  { id: 'AliExpress', title: 'ALIEXPRESS (17-25)', start: 17, end: 25, slots: 9, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-400' },
];

const DEFAULT_SINGLE = { title: '', price: '', qty: 1, comm: '', img: '' };

const getDefaultCombo = () => [
  { id: 0, title: '', price: '', qty: 1, comm: '', img: '' },
  { id: 1, title: '', price: '', qty: 1, comm: '', img: '' },
  { id: 2, title: '', price: '', qty: 1, comm: '', img: '' },
  { id: 3, title: '', price: '', qty: 1, comm: '', img: '' },
];

interface InputRowProps {
  label: string;
  val: string | number;
  onChange: (v: string) => void;
  type?: string;
  isQty?: boolean;
  onQtyAdj?: ((delta: number) => void) | null;
  readOnly?: boolean;
}

const InputRow: React.FC<InputRowProps> = ({ label, val, onChange, type='text', isQty=false, onQtyAdj=null, readOnly=false }) => (
  <div className="flex-1 min-w-[50px]">
    <div className="input-wrapper mb-0">
      <span className="input-label">{label}</span>
      <div className={`input-box ${readOnly ? 'readonly' : ''}`}>
        {isQty && !readOnly && onQtyAdj && <button type="button" onClick={()=>onQtyAdj(-1)} className="text-red-500 px-1 font-bold active:scale-90 transition-transform text-lg">-</button>}
        <input type={type} value={val} onChange={(e) => onChange(e.target.value)} readOnly={readOnly}/>
        {isQty && !readOnly && onQtyAdj && <button type="button" onClick={()=>onQtyAdj(1)} className="text-green-500 px-1 font-bold active:scale-90 transition-transform text-lg">+</button>}
      </div>
    </div>
  </div>
);

interface AccordionProps {
  id: string;
  title: string;
  icon?: any;
  color: string;
  bg: string;
  border: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, icon: Icon, color, bg, border, isOpen, onToggle, children, headerExtra }) => {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if(isOpen && elRef.current) {
      setTimeout(() => {
        elRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isOpen]);

  return (
    <div ref={elRef} className={`bg-white rounded-xl transition-all mb-4 ${isOpen ? `shadow-2xl border-2 border-black` : 'shadow-md border border-gray-200'}`}>
      <div className={`p-3 flex justify-between items-center cursor-pointer rounded-t-xl ${isOpen ? `${bg} ${border} border-b-2` : 'bg-white'}`} onClick={onToggle}>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={20} className={color} />}
            <span className="font-black text-sm uppercase">{title}</span>
          </div>
          {headerExtra && <div className="mt-1">{headerExtra}</div>}
        </div>
        <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <div className="p-3 bg-gray-50 rounded-b-xl border-t-0 animate-fade-in">{children}</div>}
    </div>
  );
};

const MonitorTaskItem: React.FC<{ gId: number; isCombo?: boolean }> = ({ gId, isCombo: propIsCombo }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const r = ref(db, `task_configs/${gId}`);
    const unsub = onValue(r, (snap) => {
      setData(snap.val());
    });
    return () => unsub();
  }, [gId]);

  const safeData = data || {};
  const isCombo = propIsCombo !== undefined ? propIsCombo : (safeData.isCombo || safeData.display_type === 'combo');

  let displayImg = safeData.img || safeData.image;
  let displayTitle = safeData.title || `Task Slot ${gId} (Available)`;
  let displayPrice = safeData.product_order || safeData.price || '0.00';
  let displayComm = safeData.commission || '0.00';
  let displayExpert = safeData.expert_income || safeData.total || '0.00';

  if(isCombo && safeData.comboItems && safeData.comboItems.length > 0) {
    const first = safeData.comboItems[0];
    displayImg = first.img || first.image || safeData.img;
    displayTitle = first.title || safeData.title;
    displayPrice = safeData.product_order || safeData.price; 
    displayComm = safeData.commission;
    displayExpert = safeData.expert_income || safeData.total;
  }
  
  return (
    <div className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex gap-3 relative overflow-hidden ${!data ? 'opacity-70 grayscale' : ''}`}>
      <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 relative">
        {isCombo && <div className="absolute top-0 right-0 bg-red-500 text-white text-[6px] px-1 font-bold">HOT</div>}
        {displayImg ? <img src={displayImg} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><LucideImage size={20}/></div>}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-2">{displayTitle}</div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-gray-500 font-medium">Product Order</span>
            <span className="font-mono text-gray-800 font-bold">${displayPrice}</span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-gray-500 font-medium">Commission</span>
            <span className="font-mono text-blue-600 font-bold">+${displayComm}</span>
          </div>
          <div className="flex justify-between items-center text-[9px] bg-yellow-50 p-1 rounded">
            <span className="text-gray-600 font-bold">Expert Income</span>
            <span className="font-mono text-orange-600 font-black">${displayExpert}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  
  const [scannedUsers, setScannedUsers] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const [watchedUserId, setWatchedUserId] = useState<string | null>(null); 
  const [balanceInput, setBalanceInput] = useState('');
  const [editableInviteCode, setEditableInviteCode] = useState('');
  const [activeSystems, setActiveSystems] = useState<Record<string, any>>({});
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Waiting...');
  
  const [animatingBtn, setAnimatingBtn] = useState({ save: false, delete: false, find: false });
  const [activeSection, setActiveSection] = useState<string | null>(null); 
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawCount, setWithdrawCount] = useState(0);

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [globalSlotId, setGlobalSlotId] = useState<number | null>(null);
  const [isLoadingSlot, setIsLoadingSlot] = useState(false);
  
  const [isMonitorOpen, setIsMonitorOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState('preview');
  const [monitorTab, setMonitorTab] = useState('products');
  
  const [simUserId, setSimUserId] = useState('');
  const [simPassword, setSimPassword] = useState('');
  const [simUser, setSimUser] = useState<any>(null);
  const [simTab, setSimTab] = useState('home'); 
  
  const [logs, setLogs] = useState<{time: string; msg: string; type: string}[]>([
    {time: new Date().toLocaleTimeString(), msg: 'System initialized. Waiting for input...', type: 'info'}
  ]);
  
  const [taskType, setTaskType] = useState('Single');
  const [singleItem, setSingleItem] = useState(DEFAULT_SINGLE);
  const [comboMainTitle, setComboMainTitle] = useState(''); 
  
  const [comboItems, setComboItems] = useState(getDefaultCombo());
  
  const [logoInputs, setLogoInputs] = useState<Record<string, string>>({ amazon: '', alibaba: '', aliexpress: '', deposit: '', withdraw: '', profile: '' });
  const [logoUpdateStatus, setLogoUpdateStatus] = useState('idle'); 
  
  const currentLogoUploadKey = useRef<string | null>(null);
  const currentComboUploadIndex = useRef<number | null>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const objectUrls = useRef<string[]>([]); 

  const [isPublicView, setIsPublicView] = useState(false);
  const [toast, setToast] = useState<{msg: string; type: string} | null>(null);

  const showToast = useCallback((msg: string, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('view') === 'products') {
      setIsPublicView(true);
      return;
    }

    const u = params.get('user');
    const p = params.get('pass');
    if(u && p) {
      setIsMonitorOpen(true);
      setMonitorTab('login');
      setSimUserId(u);
      setSimPassword(p);
      doSimLogin(u, p);
    }
  }, []);

  const doSimLogin = (uId: string, uPass: string) => {
    get(ref(db, `users/${uId}`)).then(snap => {
      if(snap.exists()) {
        const userData = snap.val();
        
        if(userData.blocked) {
          addLog(`Login Blocked: User ${uId} is restricted.`, 'error');
          showToast("ACCOUNT RESTRICTED: Contact Admin.", 'error');
          return;
        }

        if(userData.password && userData.password !== uPass) {
          addLog(`Auto-Login Failed: Password Incorrect for ${uId}`, 'error');
          return;
        }
        setSimUser({...userData, key: snap.key});
        setSimTab('home'); 
        addLog(`Auto-Login Success: ${uId}`, 'info');
      } else {
        addLog(`Auto-Login Failed: User ${uId} not found`, 'error');
      }
    });
  };

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 300;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        if (e.target?.result) img.src = e.target.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    return () => {
      objectUrls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const safeFloat = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const roundTwo = (num: number) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };
  
  const addLog = (msg: string, type='info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), {time, msg, type}]);
  };
  
  const triggerBtnAnim = (key: 'save' | 'delete' | 'find') => {
    setAnimatingBtn(p => ({...p, [key]: true}));
    setTimeout(() => setAnimatingBtn(p => ({...p, [key]: false})), 500);
  };
  
  const handleScanDatabase = () => {
    setIsSearching(true);
    setShowScanner(true);
    addLog('SCAN: Fetching last 50 users from DB...', 'warn');
    const q = query(ref(db, 'users'), limitToLast(50));
    get(q).then((snap) => {
      if(snap.exists()){
        const data = snap.val();
        const list = Object.entries(data).map(([k, v]: [string, any]) => ({...v, key: k})).reverse();
        setScannedUsers(list);
        addLog(`SUCCESS: ${list.length} users retrieved.`, 'info');
      } else {
        setScannedUsers([]);
        addLog("DATABASE EMPTY OR ACCESS DENIED", 'error');
      }
      setIsSearching(false);
    }).catch(e => {
      addLog("SCAN ERROR: " + e.message, 'error');
      setIsSearching(false);
    });
  };

  const handleSelectScannedUser = (user: any) => {
    setFoundUser(user);
    setWatchedUserId(user.key);
    setEditableInviteCode(getInviteCode(user));
    setShowScanner(false);
    addLog(`SELECTED: ${user.key}`, 'info');
  };

  const handleUserSearch = async (e: React.FormEvent) => {
    e.preventDefault(); 
    triggerBtnAnim('find');
    const term = searchQuery.trim();
    if(!term) return;

    setIsSearching(true);
    setFoundUser(null);
    setWatchedUserId(null);
    setShowScanner(false);
    addLog(`SCANNING DB: Searching for '${term}'...`, 'warn');
    try {
      const directRef = ref(db, `users/${term}`);
      const directSnap = await get(directRef);
      if (directSnap.exists()) {
        setWatchedUserId(term);
        addLog(`SUCCESS: Found by User ID '${term}'`, 'info');
        setIsSearching(false);
        return;
      }
      const fields = ['username', 'phone', 'email', 'invite_code', 'invitation_code'];
      for (const field of fields) {
        addLog(`...scanning ${field}`, 'info');
        const q = query(ref(db, 'users'), orderByChild(field), equalTo(term));
        const snap = await get(q);
        if (snap.exists()) {
          const key = Object.keys(snap.val())[0];
          setWatchedUserId(key);
          addLog(`SUCCESS: Found by ${field} '${term}' -> Key: ${key}`, 'info');
          setIsSearching(false);
          return;
        }
      }
      addLog(`FAILED: '${term}' not found in any record.`, 'error');
      showToast("USER NOT FOUND! Try scanning latest users.", 'error');
    } catch (err: any) {
      addLog(`SCAN ERROR: ${err.message}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const executeForceAccess = () => {
    let targetId = foundUser?.key || searchQuery.trim() || watchedUserId;
    if(!targetId) {
      addLog("FORCE ERROR: NO TARGET ID", 'error');
      return;
    }
    addLog(`⚡ FORCE INJECTING: ${targetId}`, 'warn');
    if(foundUser && foundUser.key === targetId) {
      setIsMonitorOpen(true);
      setSimUser(foundUser);
      setSimTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    get(ref(db, `users/${targetId}`)).then((snapshot) => {
      if(snapshot.exists()) {
        setIsMonitorOpen(true);
        setSimUser({ ...snapshot.val(), key: snapshot.key });
        setSimTab('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        addLog(`❌ TARGET ${targetId} NOT FOUND`, 'error');
      }
    });
  };
  
  useEffect(() => {
    if(!simUser || !simUser.key) return;
    const userRef = ref(db, `users/${simUser.key}`);
    const unsub = onValue(userRef, (snap) => {
      if(snap.exists()){
        const updated = snap.val();
        if(updated.blocked) {
          setSimUser(null);
          setMonitorTab('login');
          addLog(`Alert: User ${simUser.key} was BLOCKED. Session Terminated.`, 'error');
          showToast("YOUR ACCOUNT HAS BEEN BLOCKED.", 'error');
        } else {
          setSimUser((prev: any) => ({ ...prev, ...updated, key: snap.key }));
        }
      }
    });
    return () => unsub();
  }, [simUser?.key]);

  const handleSimLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(!simUserId) {
      addLog("Login Error: Missing User ID", 'error');
      return;
    }
    doSimLogin(simUserId, simPassword);
  };

  const handleSimLogout = () => {
    setSimUser(null);
    setSimTab('home');
    addLog("Simulator Logged Out.", 'info');
  };

  useEffect(() => {
    if(logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => {
      setIsConnected(!!snap.val());
      setLastSyncTime(new Date().toLocaleTimeString());
    });

    onValue(ref(db, 'admin/active_systems'), s => {
      const val = s.val() || {};
      setActiveSystems(prev => ({ ...prev, ...val }));
    });
    
    onValue(ref(db, 'task_configs'), snap => {
      if(snap.exists()) {
        const data = snap.val();
        const activeFromConfigs: Record<string, any> = {};
        Object.keys(data).forEach(id => {
          const task = data[id];
          if(task && (task.is_active || task.active || task.status === 0 || task.persistent)) {
            activeFromConfigs[`task_${id}`] = true;
            activeFromConfigs[`type_${id}`] = (task.isCombo || task.display_type === 'combo') ? 'combo' : 'single';
          }
        });
        setActiveSystems(prev => ({ ...activeFromConfigs, ...prev }));
      }
    });
    
    const withdrawRef = ref(db, 'withdraw_requests');
    onValue(withdrawRef, (snap) => {
      if(snap.exists()){
        const data = snap.val();
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({...val, key}));
        setWithdrawals(list);
        setWithdrawCount(list.length);
      } else {
        setWithdrawals([]);
        setWithdrawCount(0);
      }
    });
    
    onValue(ref(db, 'settings'), s => {
      const val = s.val() || {};
      setLogoInputs({
        amazon: val.logo_amazon || '',
        alibaba: val.logo_alibaba || '',
        aliexpress: val.logo_aliexpress || '',
        deposit: val.logo_deposit || '',
        withdraw: val.logo_withdraw || '',
        profile: val.logo_profile || val.logo_user || '' 
      });
    });
    return () => {
      off(ref(db, 'admin/active_systems'));
      off(withdrawRef);
      off(ref(db, 'settings'));
    };
  }, []);

  useEffect(() => {
    if (!watchedUserId) return;
    const userRef = ref(db, `users/${watchedUserId}`);
    const unsub = onValue(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setFoundUser({ ...data, key: snap.key });
        setEditableInviteCode(getInviteCode(data));
      } else {
        setFoundUser(null);
        setEditableInviteCode('');
        addLog(`Search: Key ${watchedUserId} missing updates.`, 'warn');
      }
    });
    return () => unsub();
  }, [watchedUserId]);

  const calculateFinancials = (uPrice: any, uQty: any, uRate: any) => {
    const unitPrice = safeFloat(uPrice);
    const qty = safeFloat(uQty);
    const rate = safeFloat(uRate);
    const productPrice = roundTwo(unitPrice * qty); 
    const commission = roundTwo(productPrice * (rate / 100)); 
    const expertIncome = roundTwo(productPrice + commission); 
    return { productPrice, commission, expertIncome };
  };

  const totals = useMemo(() => {
    let tPrice = 0;
    let tComm = 0;
    let tExpert = 0;
    if (taskType === 'Single') {
      const fin = calculateFinancials(singleItem.price, singleItem.qty, singleItem.comm);
      tPrice = fin.productPrice;
      tComm = fin.commission;
      tExpert = fin.expertIncome;
    } else {
      comboItems.forEach(item => {
        const fin = calculateFinancials(item.price, item.qty, item.comm);
        tPrice += fin.productPrice;
        tComm += fin.commission;
        tExpert += fin.expertIncome;
      });
    }
    return {
      price: tPrice.toFixed(2),
      comm: tComm.toFixed(2),
      expert: tExpert.toFixed(2)
    };
  }, [singleItem, comboItems, taskType]);
  
  const comboTotals = useMemo(() => {
    let grandPrice = 0;
    let grandComm = 0;
    let grandExpert = 0;
    
    comboItems.forEach(item => {
      const unit = parseFloat(item.price as string) || 0;
      const qty = parseFloat(item.qty as any) || 1;
      const rate = parseFloat(item.comm as string) || 0;
      
      const productPrice = unit * qty;
      const comm = productPrice * (rate / 100);
      const expert = productPrice + comm;
      
      grandPrice += productPrice;
      grandComm += comm;
      grandExpert += expert;
    });
    return {
      price: grandPrice.toFixed(2),
      comm: grandComm.toFixed(2),
      expert: grandExpert.toFixed(2) 
    };
  }, [comboItems]);

  const getInviteCode = (u: any) => {
    if(!u) return "N/A";
    return u.invite_code || u.invitation_code || u.code || u.ref_code || "N/A"; 
  };

  const getUserLevel = (u: any) => {
    if(!u) return "0";
    return u.vip_level || u.current_level || u.level || "1";
  };

  const updateUser = (updates: any, msg?: string) => {
    if(!foundUser) return;
    update(ref(db, `users/${foundUser.key}`), updates)
      .then(() => { if(msg) addLog(msg, 'info'); })
      .catch(e => { addLog("Update failed: " + e.message, 'error'); });
  };
  
  const saveInviteCode = () => {
    const updates = { 
      invite_code: editableInviteCode, 
      code: editableInviteCode, 
      invitation_code: editableInviteCode,
      referral_code: editableInviteCode,
      my_code: editableInviteCode,
      share_code: editableInviteCode
    };
    updateUser(updates, "Invite Code Saved!");
  };

  const handleGenerateInviteCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setEditableInviteCode(newCode);
  };

  const updateFinancials = (action: string) => {
    if (!foundUser || !foundUser.key || !balanceInput) {
      showToast("Enter amount first!", 'warn');
      return;
    }
    const amount = Math.abs(parseFloat(balanceInput));
    if (isNaN(amount)) { showToast("Invalid amount", 'warn'); return; }
    
    const currentBal = safeFloat(foundUser.balance);
    const currentDep = safeFloat(foundUser.deposit || foundUser.total_deposit);
    const currentWdr = safeFloat(foundUser.withdraw || foundUser.total_withdraw);
    
    let updates: Record<string, any> = {};
    
    if(action === 'add_balance') {
      const newBal = parseFloat((currentBal + amount).toFixed(2));
      const newDep = parseFloat((currentDep + amount).toFixed(2));
      updates = {
        balance: newBal,
        available_balance: newBal,
        deposit: newDep,
        total_deposit: newDep,
        total_recharge: newDep,
        recharge_amount: newDep
      };
      addLog(`CREDIT: $${amount} added to ${foundUser.key}`, 'info');
    } 
    else if (action === 'cut_balance') {
      const newBal = parseFloat(Math.max(0, currentBal - amount).toFixed(2));
      updates = {
        balance: newBal,
        available_balance: newBal
      };
      addLog(`DEBIT: $${amount} removed from ${foundUser.key}`, 'warn');
    }
    else if (action === 'set_deposit') {
      updates = {
        deposit: amount,
        total_deposit: amount,
        total_recharge: amount,
        recharge_amount: amount
      };
      addLog(`FIX: Deposit set to $${amount}`, 'info');
    }
    else if (action === 'set_withdraw') {
      updates = {
        withdraw: amount,
        total_withdraw: amount,
        withdraw_amount: amount
      };
      addLog(`FIX: Withdraw set to $${amount}`, 'info');
    }
    updates['updated_at'] = Date.now();
    
    update(ref(db, `users/${foundUser.key}`), updates)
      .then(() => {
        setBalanceInput('');
      })
      .catch(err => showToast("Error: " + err.message, 'error'));
  };

  const handleWithdrawalAction = (req: any, action: string) => {
    if(!req || !req.key) return;
    if(action === 'accept') {
      remove(ref(db, `withdraw_requests/${req.key}`));
    } else {
      const refundAmount = safeFloat(req.amount);
      const uid = req.userId || req.user_id;
      if(uid) {
        get(ref(db, `users/${uid}`)).then(snap => {
          if(snap.exists()){
            const u = snap.val();
            const currentBal = safeFloat(u.balance);
            update(ref(db, `users/${uid}`), {
              balance: currentBal + refundAmount
            });
          }
        });
      }
      remove(ref(db, `withdraw_requests/${req.key}`));
    }
  };

  const toggleSection = (id: string) => {
    setActiveSection(prev => prev === id ? null : id);
  };
  
  const handleSlotSelect = (boxId: string, localIndex: number, e?: React.MouseEvent) => {
    if(e && e.stopPropagation) e.stopPropagation(); 
    setSelectedBoxId(boxId);
    setSelectedSlot(localIndex);
    
    setComboItems(getDefaultCombo());
    setSingleItem(DEFAULT_SINGLE);
    setComboMainTitle('');
    currentComboUploadIndex.current = null;
    
    const box = BOXES.find(b => b.id === boxId)!;
    const gId = box.start + localIndex;
    setGlobalSlotId(gId);
    setIsLoadingSlot(true);
    
    setTaskType('Single');
    
    get(ref(db, `task_configs/${gId}`)).then(snap => {
      setIsLoadingSlot(false);
      const val = snap.val();
      if(val) {
        setTaskType(val.isCombo ? 'Combo' : 'Single');
        if(val.isCombo) {
          let loadedItems = val.comboItems || [];
          if (!Array.isArray(loadedItems)) {
            loadedItems = Object.values(loadedItems);
          }
          const mergedItems = getDefaultCombo().map((def, i) => {
            const loaded = loadedItems[i] || {};
            return { 
              ...def, 
              ...loaded,
              price: loaded.input_unit_price !== undefined && loaded.input_unit_price !== '' ? loaded.input_unit_price : (loaded.price || '')
            };
          });
          setComboItems(mergedItems);
          setComboMainTitle(val.title && val.title !== 'Combo Package' ? val.title : (loadedItems[0]?.title || 'Combo Package'));
        } else {
          setComboMainTitle('Combo Package');
        }
        if(!val.isCombo) {
          const rawPrice = val.input_unit_price !== undefined && val.input_unit_price !== '' ? val.input_unit_price :
                           val.unitPrice !== undefined && val.unitPrice !== '' ? val.unitPrice :
                           val.price !== undefined && val.price !== '' ? val.price :
                           val.product_order !== undefined && val.product_order !== '' ? val.product_order : '';

          const rawComm = val.input_rate !== undefined && val.input_rate !== '' ? val.input_rate :
                          val.commissionRate !== undefined && val.commissionRate !== '' ? val.commissionRate :
                          val.commission !== undefined && val.commission !== '' ? val.commission : '';

          setSingleItem({
            title: val.title || '',
            price: rawPrice,
            qty: val.multiplier || 1,
            comm: rawComm,
            img: val.img || val.image || ''
          });
        }
      } else {
        setTaskType('Single');
        setSingleItem({ title: `Task ${gId}`, price: '', qty: 1, comm: '', img: '' });
        setComboMainTitle('Combo Package');
      }
    });
  };

  const adjustSingleQty = useCallback((delta: number) => {
    setSingleItem(prev => ({...prev, qty: Math.max(1, safeFloat(prev.qty) + delta)}));
  }, []);
  
  const adjustComboQty = useCallback((idx: number, delta: number) => {
    setComboItems(prev => prev.map((item, i) => i === idx ? { ...item, qty: Math.max(1, safeFloat(item.qty) + delta) } : item));
  }, []);

  const updateComboItem = useCallback((idx: number, field: string, val: any) => {
    setComboItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }, []);

  const sanitizeData = (data: any): any => {
    if (data === undefined) return '';
    if (data === null) return null;
    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map(sanitizeData);
      }
      const clean: Record<string, any> = {};
      for (const k in data) {
        clean[k] = data[k] === undefined ? '' : sanitizeData(data[k]);
      }
      return clean;
    }
    return data;
  };

  const handleSave = (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if(!globalSlotId) return;
    triggerBtnAnim('save');
    const isCombo = taskType === 'Combo';
    const mainTitle = isCombo ? (comboMainTitle || 'Combo Package') : (singleItem.title || '');
    
    let finalPrice = 0; 
    let finalComm = 0;  
    let finalExpert = 0; 
    
    let displayPrice = 0; 
    let displayComm = 0;  
    let displayExpert = 0; 
    
    let finalUnit = 0;
    let finalRate = 0;
    let finalQty = 1;

    if (isCombo) {
      finalPrice = parseFloat(comboTotals.price) || 0;
      finalComm = parseFloat(comboTotals.comm) || 0;
      finalExpert = parseFloat(comboTotals.expert) || 0;
      
      displayPrice = finalPrice;
      displayComm = finalComm;
      displayExpert = finalExpert;

      finalUnit = finalPrice; 
      finalRate = 0; 
      finalQty = 1;
    } else {
      const fin = calculateFinancials(singleItem.price, singleItem.qty, singleItem.comm);
      finalPrice = fin.productPrice || 0;
      finalComm = fin.commission || 0;
      finalExpert = fin.expertIncome || 0;
      
      displayPrice = finalPrice;
      displayComm = finalComm;
      displayExpert = finalExpert;
      
      finalUnit = safeFloat(singleItem.price);
      finalRate = safeFloat(singleItem.comm);
      finalQty = safeFloat(singleItem.qty);
    }
    
    const cleanedComboItems = comboItems.map(item => {
      let rawUnitPrice = parseFloat(item.price as string) || 0;
      let calculatedTotal = rawUnitPrice;

      if(isCombo) {
        const q = parseFloat(item.qty as any) || 1;
        calculatedTotal = rawUnitPrice * q;
      }
      
      const imgVal = item.img || '';
      return {
        id: item.id || 0,
        title: item.title || '',
        qty: parseFloat(item.qty as any) || 1,
        comm: parseFloat(item.comm as string) || 0,
        img: imgVal,
        price: calculatedTotal.toFixed(2), 
        input_unit_price: rawUnitPrice,
        image: imgVal, 
        pic: imgVal,   
        icon: imgVal,  
        product_image: imgVal
      };
    });
    
    const singleImg = singleItem.img || '';
    const slotImg = isCombo ? (comboItems[0]?.img || '') : singleImg;

    const payload = {
      id: globalSlotId,
      isCombo: isCombo,
      title: mainTitle,
      img: slotImg, 
      image: slotImg, 
      
      price: displayPrice.toFixed(2), 
      amount: displayPrice.toFixed(2),
      product_price: displayPrice.toFixed(2), 
      
      product_order: finalPrice.toFixed(2), 
      commission: finalComm.toFixed(2),
      expert_income: finalExpert.toFixed(2),
      
      total: finalExpert.toFixed(2), 
      estimated_income: finalExpert.toFixed(2),
      
      execution_price: finalPrice.toFixed(2),
      execution_commission: finalComm.toFixed(2),
      execution_expert_income: finalExpert.toFixed(2),
      fullPrice: finalPrice.toFixed(2), 
      totalPrice: finalPrice.toFixed(2), 
      
      input_unit_price: finalUnit, 
      input_rate: finalRate,
      multiplier: finalQty,
      unitPrice: finalUnit,
      
      persistent: true,
      status: 0, 
      is_active: true,
      active: true,
      admin_locked: true,
      force_persistence: true,
      static: true,
      updated_at: Date.now(), 
      
      finished: false,
      order_status: 0,
      can_be_deleted: false,
      orders: 0,
      
      comboItems: isCombo ? cleanedComboItems : null,
      items: isCombo ? cleanedComboItems : null, 
      comboDetails: isCombo ? cleanedComboItems : null,
      
      display_type: isCombo ? 'combo' : 'single',
    };

    const cleanPayload = sanitizeData(payload);

    setActiveSystems(prev => ({
      ...prev,
      [`task_${globalSlotId}`]: true,
      [`type_${globalSlotId}`]: isCombo ? 'combo' : 'single'
    }));

    set(ref(db, `task_configs/${globalSlotId}`), cleanPayload)
      .then(() => {
        update(ref(db, 'admin/active_systems'), {
          [`task_${globalSlotId}`]: true,
          [`type_${globalSlotId}`]: isCombo ? 'combo' : 'single'
        });
        
        update(ref(db, 'settings'), { last_task_update: Date.now() });
        addLog(`TASK ACTIVATED: Slot ${globalSlotId} (${taskType})`, 'info');
        showToast(`✅ ${taskType} Task ACTIVATED & SAVED PERMANENTLY (Slot ${globalSlotId})`, 'success');
      })
      .catch(err => {
        console.error("Save failed:", err);
        showToast("Save failed: " + err.message, 'error');
      });
  };

  const handleDelete = (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if(!globalSlotId) return;
    triggerBtnAnim('delete');

    setActiveSystems(prev => {
      const next = { ...prev };
      delete next[`task_${globalSlotId}`];
      delete next[`type_${globalSlotId}`];
      return next;
    });

    const updates: Record<string, any> = {};
    updates[`task_configs/${globalSlotId}`] = null;
    updates[`admin/active_systems/task_${globalSlotId}`] = null;
    updates[`admin/active_systems/type_${globalSlotId}`] = null;
    
    update(ref(db), updates).then(() => {
      setComboItems(getDefaultCombo());
      setSingleItem(DEFAULT_SINGLE);
      showToast("Slot Cleared & Reset!", 'warn');
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e && e.preventDefault) e.preventDefault();
    const file = e.target.files && e.target.files[0];
    if(!file) return;

    try {
      const compressedBase64 = await processImage(file);
      if (compressedBase64) {
        if(currentComboUploadIndex.current === null) {
          setSingleItem(p => ({...p, img: compressedBase64}));
        } else {
          const idx = currentComboUploadIndex.current;
          setComboItems(prev => prev.map((item, i) => i === idx ? { ...item, img: compressedBase64 } : item));
        }
      }
    } catch(err) {
      console.error("Compression Failed", err);
    }
    if (e.target) e.target.value = '';
  };

  const triggerUpload = (idx: number | null = null) => {
    currentComboUploadIndex.current = idx;
    if (fileInputRef.current) fileInputRef.current.click();
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e && e.preventDefault) e.preventDefault();
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const key = currentLogoUploadKey.current; if(!key) return;

    try {
      const compressedBase64 = await processImage(file);
      if (compressedBase64) {
        setLogoInputs(p => ({...p, [key]: compressedBase64}));
      }
    } catch(err) {
      console.error("Logo Compression Failed", err);
    }
    if (e.target) e.target.value = '';
  };

  const triggerLogoUpload = (key: string) => {
    currentLogoUploadKey.current = key;
    if (logoFileRef.current) logoFileRef.current.click();
  };

  const updateLogos = () => {
    setLogoUpdateStatus('loading');
    const cleanInput = (val: string) => val || '';
    const payload = {
      logo_amazon: cleanInput(logoInputs.amazon),
      logo_alibaba: cleanInput(logoInputs.alibaba),
      logo_aliexpress: cleanInput(logoInputs.aliexpress),
      logo_deposit: cleanInput(logoInputs.deposit),
      logo_withdraw: cleanInput(logoInputs.withdraw),
      logo_profile: cleanInput(logoInputs.profile),
      logo_user: cleanInput(logoInputs.profile), 
      logo_my: cleanInput(logoInputs.profile),
      app_logo: cleanInput(logoInputs.profile),
      site_logo: cleanInput(logoInputs.profile),
      updated_at: Date.now(),
      config_version: "2.0",
      persistent: true,
      forced_persistence: true 
    };
    
    update(ref(db, 'settings'), payload)
      .then(() => {
        update(ref(db, 'admin_assets'), payload);
        setLogoUpdateStatus('success');
        setTimeout(() => setLogoUpdateStatus('idle'), 2000);
      })
      .catch((e) => {
        console.error(e);
        setLogoUpdateStatus('error');
        setTimeout(() => setLogoUpdateStatus('idle'), 2000);
      });
  };

  const renderInputRow = (label: string, val: any, onChange: (v: string)=>void, type='text', isQty=false, onQtyAdj: ((delta: number)=>void)|null = null, readOnly=false) => (
    <InputRow 
      label={label} 
      val={val} 
      onChange={onChange} 
      type={type} 
      isQty={isQty} 
      onQtyAdj={onQtyAdj} 
      readOnly={readOnly} 
    />
  );
  
  const MonitorContent = useMemo(() => {
    if (!simUser) {
      return (
        <div className="flex flex-col h-full bg-gray-50 relative">
          <div className="bg-white p-3 shadow-sm z-10 text-center border-b border-gray-200">
            <span className="font-black text-sm tracking-widest text-black">
              {monitorTab === 'products' ? '🛍️ LIVE MARKET' : '🔐 MEMBER LOGIN'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pb-20 bg-[#f4f4f5]">
            {monitorTab === 'products' ? (
              <div className="p-3 space-y-3">
                {Array.from({length: 25}).map((_, i) => {
                  const gId = i + 1;
                  return <MonitorTaskItem key={gId} gId={gId} />;
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
                <div className="w-full max-w-xs space-y-4">
                  <form onSubmit={handleSimLogin} className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={simUserId} 
                      onChange={e=>setSimUserId(e.target.value)} 
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-black placeholder-gray-400 text-sm font-bold outline-none focus:border-black transition-colors text-center"
                    />

                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={simPassword} 
                      onChange={e=>setSimPassword(e.target.value)} 
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-black placeholder-gray-400 text-sm font-bold outline-none focus:border-black transition-colors text-center"
                    />

                    <button type="submit" className="w-full py-3 bg-black rounded-lg text-white font-bold shadow-lg active:scale-95 transition-transform">
                      LOGIN
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border-t border-gray-200 flex h-16 absolute bottom-0 w-full z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={()=>setMonitorTab('products')} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${monitorTab==='products'?'text-yellow-500':'text-gray-400 hover:text-gray-600'}`}>
              <div className={`p-1 rounded-full ${monitorTab==='products'?'bg-yellow-50':''}`}><Box size={20} className={monitorTab==='products'?'fill-yellow-500':''} /></div>
              <span className="text-[9px] font-black">MARKET</span>
            </button>
            <div className="w-[1px] bg-gray-100 h-10 my-auto"></div>
            <button type="button" onClick={()=>setMonitorTab('login')} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${monitorTab==='login'?'text-black':'text-gray-400 hover:text-gray-600'}`}>
              <div className={`p-1 rounded-full ${monitorTab==='login'?'bg-gray-100':''}`}><LogIn size={20} /></div>
              <span className="text-[9px] font-black">LOGIN</span>
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <>
        <div className="phone-content-scroll">
          {simTab === 'grab' && (
            <div className="px-3 pb-8">
              <div className="flex items-center justify-between mb-4 mt-4"><div className="font-black text-lg">Grab Orders</div><div className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded">VIP {getUserLevel(simUser)}</div></div>
              <div className="space-y-3">
                {Array.from({length: 25}).map((_, i) => {
                  const gId = i + 1;
                  if(!activeSystems[`task_${gId}`]) return null;
                  const isCombo = activeSystems[`type_${gId}`] === 'combo';
                  return <MonitorTaskItem key={gId} gId={gId} isCombo={isCombo} />;
                })}
              </div>
            </div>
          )}
          {simTab === 'home' && (
            <div className="px-4 pt-8">
              <div className="flex justify-between items-center mb-4"><div className="font-black text-lg">Dashboard</div><div onClick={handleSimLogout} className="text-xs font-bold text-red-500 cursor-pointer">LOGOUT</div></div>
              <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-5 text-white shadow-xl mb-6">
                <div className="text-xs text-gray-400 font-bold mb-1">TOTAL ASSETS</div><div className="text-3xl font-black">${simUser.balance || '0.00'}</div>
                <div className="flex gap-4 mt-4"><div><div className="text-[10px] text-gray-400">TODAY</div><div className="font-bold">${simUser.today_commission||0}</div></div><div><div className="text-[10px] text-gray-400">YESTERDAY</div><div className="font-bold">${simUser.yesterday_commission||0}</div></div></div>
              </div>
            </div>
          )}
          {simTab === 'profile' && (
            <div className="px-4 pt-8">
              <div className="text-center mb-6"><div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center border-4 border-white shadow"><User size={32} className="text-gray-400"/></div><div className="font-black text-lg">{simUser.username || simUser.key}</div><div className="text-xs text-gray-500 font-bold">ID: {simUser.key}</div></div>
            </div>
          )}
        </div>
        <div className="sim-nav">
          <div onClick={()=>setSimTab('home')} className={`sim-nav-item ${simTab==='home'?'active':''}`}><Home size={18}/><span>Home</span></div>
          <div onClick={()=>setSimTab('grab')} className={`sim-nav-item ${simTab==='grab'?'active':''}`}><div className="w-10 h-10 -mt-5 bg-yellow-400 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg"><PlayCircle size={20}/></div><span className="mt-0.5">Grab</span></div>
          <div onClick={()=>setSimTab('profile')} className={`sim-nav-item ${simTab==='profile'?'active':''}`}><UserCircle size={18}/><span>Me</span></div>
        </div>
      </>
    );
  }, [simUser, simTab, activeSystems, simUserId, simPassword, monitorTab]);

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-gray-100 p-0 sm:p-4">
        <div className="max-w-md mx-auto bg-white sm:rounded-2xl shadow-xl overflow-hidden min-h-[100dvh] sm:min-h-[80vh] border-x border-gray-200">
          <div className="bg-black text-white p-4 text-center font-black text-xl tracking-wider sticky top-0 z-50 border-b border-gray-800">
            VIP MARKETPLACE
          </div>
          <div className="p-4 space-y-4 pb-20 overflow-y-auto bg-[#f8f8f8]">
            {Array.from({length: 25}).map((_, i) => (
              <MonitorTaskItem key={i+1} gId={i+1} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen relative">
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload}/>
      <input type="file" ref={logoFileRef} hidden accept="image/*" onChange={handleLogoUpload}/>

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl font-black text-xs flex items-center gap-2 border border-white/20 animate-bounce transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' :
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'warn' ? 'bg-amber-500 text-black' :
          'bg-blue-600 text-white'
        }`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-yellow-400 p-4 border-b-4 border-yellow-600 sticky top-0 z-40 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-2"><Shield className="text-black fill-white" size={24}/><span className="text-black font-black text-xl">VIP<span className="text-red-600">ADMIN</span></span></div>
        
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border ${isConnected?'bg-green-600 border-green-800 text-white':'bg-red-600 border-red-800 text-white animate-pulse'}`}>
          {isConnected?<Wifi size={12}/>:<WifiOff size={12}/>}
          <span>{isConnected?'ONLINE':'OFFLINE'}</span>
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="status-bar">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1"><div className="led green"></div><span className="text-[10px] text-gray-400 font-bold">SYS</span></div>
          <div className="flex items-center gap-1"><div className={`led ${withdrawCount > 0 ? 'red blink' : 'bg-gray-700'}`}></div><span className={`text-[10px] font-bold ${withdrawCount > 0 ? 'text-red-500 blink' : 'text-gray-500'}`}>ALERT</span></div>
        </div>
        <div className="text-[10px] font-mono">
          {withdrawCount > 0 && withdrawals.length > 0 ? (
            <span className="flex items-center gap-1 text-red-400 blink">
              LATEST: <span className="text-white font-black bg-red-900 px-1 rounded">{withdrawals[withdrawals.length-1].userId || withdrawals[withdrawals.length-1].user_id}</span>
            </span>
          ) : (<span className="text-gray-600">NO ALERTS</span>)}
        </div>
      </div>

      {/* CONTROL BUTTONS */}
      <div className="control-bar">
        <button type="button" onClick={()=>setIsMonitorOpen(true)} className={`control-btn btn-open ${isMonitorOpen?'active':''}`}><PlayCircle size={14}/> OPEN LIVE MONITOR</button>
        <button type="button" onClick={()=>setIsMonitorOpen(false)} className={`control-btn btn-close ${!isMonitorOpen?'active':''}`}><StopCircle size={14}/> CLOSE MONITOR</button>
      </div>

      {/* LIVE BLACK MONITOR DASHBOARD */}
      <div className="monitor-dashboard" style={{ maxHeight: isMonitorOpen ? '800px' : '0px' }}>
        <div className="monitor-header">
          <div className="text-[10px] text-gray-400 w-full text-center">SYSTEM TERMINAL ACTIVE</div>
          <div className="text-[10px] text-gray-500 absolute right-4">{lastSyncTime}</div>
        </div>
        <div className="monitor-body">
          <div className="phone-frame">
            <div className="phone-notch"></div>
            
            <div className="absolute top-6 left-0 right-0 z-30 flex justify-center gap-2 p-1 bg-gray-900/50 backdrop-blur-sm">
              <button type="button" onClick={()=>setMobileMode('real_app')} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${mobileMode==='real_app'?'bg-green-500 text-white':'bg-black text-white'}`}>REAL APP</button>
              <button type="button" onClick={()=>setMobileMode('preview')} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${mobileMode==='preview'?'bg-yellow-400 text-black':'bg-black text-white'}`}>PREVIEW</button>
            </div>

            <div className="phone-screen bg-white">
              {mobileMode === 'real_app' ? (
                <iframe 
                  src="https://tinyurl.com/zghtlfhz" 
                  className="real-app-frame"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  title="Live App"
                ></iframe>
              ) : (
                MonitorContent 
              )}
            </div>
          </div>
          <div className="terminal-window">
            {logs.map((log, i) => (<div key={i} className="log-entry"><span className="log-time">[{log.time}]</span><span className={`log-${log.type}`}>{log.msg}</span></div>))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* WITHDRAWAL ALERTS */}
        {withdrawCount > 0 && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl mb-4 overflow-hidden animate-pulse-slow">
            <div className="bg-red-600 text-white p-2 font-black flex justify-between items-center"><span className="flex items-center gap-2"><Bell className="blink"/> WITHDRAWAL ALERT ({withdrawCount})</span></div>
            <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
              {withdrawals.map((w, i) => (
                <div key={i} className="bg-white border border-red-200 p-2 rounded shadow-sm flex flex-col gap-1">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1"><span className="font-bold text-xs">ID: {w.userId || w.user_id}</span><span className="font-black text-red-600 text-sm">${w.amount}</span></div>
                  <div className="text-[10px] text-gray-500 break-all">{w.address || w.wallet || w.walletAddress}</div>
                  <div className="flex gap-2 mt-1"><button type="button" onClick={()=>handleWithdrawalAction(w, 'accept')} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold py-1.5 rounded">ACCEPT</button><button type="button" onClick={()=>handleWithdrawalAction(w, 'reject')} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-1.5 rounded">DISABLE</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USER FINDER ACCORDION */}
        <Accordion 
          id="SEARCH" 
          title="USER MANAGEMENT" 
          icon={Users}
          bg="bg-black" 
          color="text-black"
          border="border-black"
          isOpen={activeSection === 'SEARCH'}
          onToggle={() => toggleSection('SEARCH')}
        >
          <div className="vip-card p-4 bg-white border-0 shadow-none">
            <form onSubmit={handleUserSearch} className="flex gap-2 mb-3">
              <div className="flex-1 relative"><Search size={16} className="absolute left-2 top-3 text-gray-500"/><input className="w-full bg-gray-100 border-2 border-gray-300 pl-8 pr-2 py-2 rounded-lg font-bold outline-none text-black" placeholder="USER ID, NAME, PHONE, CODE..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/></div>
              <button type="submit" disabled={isSearching} className={`bg-black text-white px-4 rounded-lg font-bold shadow-lg flex items-center gap-1 ${isSearching ? 'opacity-50' : ''} ${animatingBtn.find ? 'btn-shake' : ''}`}>
                {isSearching ? <Loader2 size={16} className="animate-spin"/> : 'FIND'}
              </button>
            </form>

            <button type="button" onClick={handleScanDatabase} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 mb-3 active:scale-95 transition-transform border border-indigo-400">
              <DatabaseIcon size={18}/> 👁️ SCAN LATEST 50 USERS
            </button>
            
            {showScanner && scannedUsers.length > 0 && (
              <div className="bg-gray-100 border border-gray-300 rounded-xl p-2 mb-3 max-h-60 overflow-y-auto animate-fade-in">
                <div className="text-[10px] font-black text-gray-500 mb-2 sticky top-0 bg-gray-100 pb-1 border-b">DATABASE DUMP ({scannedUsers.length})</div>
                {scannedUsers.map((u) => (
                  <div key={u.key} onClick={()=>handleSelectScannedUser(u)} className="bg-white p-2 rounded mb-1 border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-black text-xs text-black">{u.key}</div>
                      <div className="text-[9px] text-gray-500 font-bold">Pass: {u.password}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-xs">${u.balance||0}</div>
                      <div className="text-[8px] bg-gray-200 px-1 rounded text-gray-600">CLICK TO SELECT</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {foundUser && (
              <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 animate-fade-in">
                <div className="flex justify-between items-start mb-4 border-b border-gray-300 pb-2">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500">USER IDENTITY</div>
                    <div className="font-black text-xl text-blue-900">{foundUser.key}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-300 flex items-center gap-1"><Tag size={10}/> INVITE: {getInviteCode(foundUser)}</span>
                      <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-300 flex items-center gap-1"><Award size={10}/> VIP {getUserLevel(foundUser)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button type="button" onClick={executeForceAccess} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg hover:bg-red-700 animate-pulse"><Zap size={12}/> FORCE ACCESS</button>
                    <button type="button" onClick={()=>{const newStatus = !foundUser.blocked; updateUser({blocked: newStatus}, newStatus ? "🚫 BLOCKED" : "✅ UNBLOCKED");}} className={`h-8 px-3 rounded-lg flex items-center gap-1 font-black text-[10px] shadow-md transition-all active:scale-95 ${foundUser.blocked?'bg-red-600 text-white ring-2 ring-red-300':'bg-green-600 text-white ring-2 ring-green-300'}`}>{foundUser.blocked?<Lock size={10}/>:<Unlock size={10}/>} {foundUser.blocked?'UNBLOCK':'BLOCK'}</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-center"><div className="text-[8px] font-bold text-gray-400 uppercase">PASS</div><div className="font-mono font-bold text-xs">{foundUser.password||'****'}</div></div>
                  <div className="p-2 bg-green-50 rounded border border-green-200 text-center"><div className="text-[8px] font-bold text-green-600 uppercase">BAL</div><div className="font-mono font-bold text-xs text-green-700">${foundUser.balance||0}</div></div>
                  <div className="p-2 bg-blue-50 rounded border border-blue-200 text-center"><div className="text-[8px] font-bold text-blue-600 uppercase">DEP</div><div className="font-mono font-bold text-xs text-blue-700">${foundUser.deposit||0}</div></div>
                  <div className="p-2 bg-red-50 rounded border border-red-200 text-center"><div className="text-[8px] font-bold text-red-600 uppercase">WDR</div><div className="font-mono font-bold text-xs text-red-700">${foundUser.withdraw||0}</div></div>
                </div>

                <div className="bg-white p-2 rounded border border-gray-200 mb-2 flex items-center gap-2">
                  <div className="flex-1 input-wrapper mb-0"><span className="input-label">INVITE CODE</span><div className="input-box bg-gray-50"><input value={editableInviteCode} onChange={e=>setEditableInviteCode(e.target.value)} className="w-full text-black font-bold text-sm"/></div></div>
                  <button type="button" onClick={saveInviteCode} className="bg-gray-800 text-white text-[10px] font-bold px-3 py-2 rounded h-8 flex items-center gap-1"><Save size={12}/> SAVE</button>
                  <button type="button" onClick={handleGenerateInviteCode} className="bg-gray-200 text-black text-[10px] font-bold px-3 py-2 rounded h-8 flex items-center gap-1"><RefreshCw size={12}/> NEW</button>
                </div>

                <div className="bg-white p-2 rounded-lg border-2 border-blue-500 shadow-lg">
                  <div className="text-[9px] font-black text-blue-600 mb-2 tracking-widest text-center bg-blue-50 rounded py-1">FINANCIAL CONTROL CENTER</div>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-[2] input-box h-10 border-blue-200 bg-blue-50"><DollarSign size={16} className="text-blue-500"/><input placeholder="Amount" type="number" value={balanceInput} onChange={e=>setBalanceInput(e.target.value)} className="text-lg text-blue-900"/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={()=>updateFinancials('add_balance')} className="bg-green-500 text-white p-2 rounded font-bold text-[10px] hover:bg-green-600 flex justify-center items-center gap-1"><Plus size={12}/> ADD BAL</button>
                    <button type="button" onClick={()=>updateFinancials('cut_balance')} className="bg-red-500 text-white p-2 rounded font-bold text-[10px] hover:bg-red-600 flex justify-center items-center gap-1"><Minus size={12}/> CUT BAL</button>
                    <button type="button" onClick={()=>updateFinancials('set_deposit')} className="bg-blue-500 text-white p-2 rounded font-bold text-[10px] hover:bg-blue-600 flex justify-center items-center gap-1"><PenTool size={12}/> FIX DEPOSIT</button>
                    <button type="button" onClick={()=>updateFinancials('set_withdraw')} className="bg-orange-500 text-white p-2 rounded font-bold text-[10px] hover:bg-orange-600 flex justify-center items-center gap-1"><PenTool size={12}/> FIX WDR</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Accordion>

        {/* BOXES ACCORDION WITH LED INDICATORS */}
        {BOXES.map(box => {
          return (
            <Accordion 
              key={box.id}
              id={box.id}
              title={box.title}
              icon={Box}
              color={box.color}
              bg={box.bg}
              border={box.border}
              isOpen={activeSection === box.id}
              onToggle={() => toggleSection(box.id)}
              headerExtra={
                <div className="flex gap-1.5 mt-1">
                  {Array.from({length: box.slots}).map((_, i) => {
                    const gId = box.start + i;
                    const isActive = activeSystems[`task_${gId}`];
                    const type = activeSystems[`type_${gId}`];
                    const isCombo = type === 'combo';
                    
                    let bgClass = "inactive"; 
                    if(isActive) {
                      bgClass = isCombo ? "active-red" : "active-green";
                    }
                    
                    return (
                      <div key={i} className={`status-light ${bgClass}`}></div>
                    )
                  })}
                </div>
              }
            >
              <div className="flex flex-wrap justify-center gap-2 mb-4 pb-4 border-b border-gray-200">
                {Array.from({length:box.slots}).map((_,i)=>{
                  const gId = box.start + i;
                  const isActive = activeSystems[`task_${gId}`];
                  const isCombo = activeSystems[`type_${gId}`] === 'combo';
                  const isSelected = selectedBoxId === box.id && selectedSlot === i;
                  return (<button key={i} type="button" onClick={(e)=>handleSlotSelect(box.id, i, e)} className={`slot-btn ${isSelected?'selected':''} ${isActive ? (isCombo?'is-combo':'is-active') : ''}`}>{gId}</button>)
                })}
              </div>
              {selectedBoxId === box.id && selectedSlot !== null && (
                <div className="animate-fade-in relative">
                  {isLoadingSlot && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
                      <Loader2 size={32} className="animate-spin text-blue-500 mb-2"/>
                      <span className="text-[10px] font-black text-blue-600 animate-pulse">LOADING SLOT DATA...</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-4 bg-gray-200 p-1 rounded-lg">
                    <button type="button" onClick={()=>setTaskType('Single')} className={`flex-1 py-1 rounded-md text-xs font-black ${taskType==='Single'?'bg-white shadow text-black':'text-gray-500'}`}>SINGLE</button>
                    <button type="button" onClick={()=>setTaskType('Combo')} className={`flex-1 py-1 rounded-md text-xs font-black ${taskType==='Combo'?'bg-purple-600 shadow text-white':'text-gray-500'}`}>COMBO</button>
                  </div>
                  {taskType === 'Single' ? (
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-3 mb-4">
                      <div className="flex gap-2">
                        <div onClick={()=>triggerUpload(null)} className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden">{singleItem.img ? <img src={singleItem.img} alt="" className="w-full h-full object-cover"/> : <UploadCloud size={20} className="text-gray-400"/>}</div>
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="bg-blue-50 border border-blue-200 rounded p-2"><div className="text-[8px] font-black text-blue-500 mb-1 text-center">FIXED INPUTS (CHANGE HERE)</div><div className="flex gap-1">{renderInputRow("UNIT ($)", singleItem.price, (v)=>setSingleItem(p=>({...p, price:v})), 'number')}{renderInputRow("RATE (%)", singleItem.comm, (v)=>setSingleItem(p=>({...p, comm:v})), 'number')}{renderInputRow("GUN (X)", singleItem.qty, (v)=>setSingleItem(p=>({...p, qty:v})), 'number', true, adjustSingleQty)}</div></div>
                          <div className="space-y-2">{renderInputRow("PRODUCT TITLE", singleItem.title, (v)=>setSingleItem(p=>({...p, title:v}))) }
                            
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="bg-gray-100 p-2 rounded border border-gray-300 flex flex-col items-center justify-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase mb-1">ORDER TOTAL</span>
                                <span className="text-sm font-black text-gray-900">${totals.price}</span>
                              </div>
                              <div className="bg-green-50 p-2 rounded border border-green-300 flex flex-col items-center justify-center">
                                <span className="text-[9px] font-black text-green-600 uppercase mb-1">COMMISSION</span>
                                <span className="text-sm font-black text-green-700">${totals.comm}</span>
                              </div>
                              <div className="bg-blue-50 p-2 rounded border border-blue-300 flex flex-col items-center justify-center">
                                <span className="text-[9px] font-black text-blue-600 uppercase mb-1">EXPERT INCOME</span>
                                <span className="text-sm font-black text-blue-700">${totals.expert}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4">
                      <div className="mb-2 input-wrapper"><span className="input-label bg-purple-100 text-purple-700">MAIN COMBO TITLE (FOR USER LIST)</span><div className="input-box border-purple-300"><input value={comboMainTitle} onChange={e=>setComboMainTitle(e.target.value)} placeholder="e.g. Premium Combo Pack 1" className="text-purple-900"/></div></div>
                      {comboItems.map((item, idx) => (
                        <div key={idx} className="bg-white border border-purple-200 rounded-xl p-2 flex gap-2 items-center"><div className="text-[10px] font-bold text-purple-400 w-4">{idx+1}</div><div onClick={()=>triggerUpload(idx)} className="w-12 h-12 bg-gray-100 border border-gray-200 rounded flex-shrink-0 overflow-hidden cursor-pointer">{item.img ? <img src={item.img} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><Plus size={10} className="text-gray-400"/></div>}</div><div className="flex-1 space-y-2"><div className="bg-purple-50 p-1 rounded border border-purple-100 flex gap-1">{renderInputRow("UNIT ($)", item.price, (v)=>updateComboItem(idx, 'price', v), 'number')}{renderInputRow("RATE (%)", item.comm, (v)=>updateComboItem(idx, 'comm', v), 'number')}{renderInputRow("GUN (X)", item.qty, (v)=>updateComboItem(idx, 'qty', v), 'number', true, (d)=>adjustComboQty(idx,d))}</div>{renderInputRow("TITLE", item.title, (v)=>updateComboItem(idx, 'title', v))}</div></div>
                      ))}
                      
                      <div className="bg-black text-white p-4 rounded-xl mt-4 shadow-xl border border-gray-800">
                        <div className="flex justify-between items-center text-center divide-x divide-gray-700">
                          <div className="flex-1 px-2">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">TOTAL PRODUCT PRICE</div>
                            <div className="text-lg font-black text-white">${comboTotals.price}</div>
                          </div>
                          <div className="flex-1 px-2">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">COMMISSION</div>
                            <div className="text-lg font-black text-yellow-400">${comboTotals.comm}</div>
                          </div>
                          <div className="flex-1 px-2">
                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">EXPERT INCOME</div>
                            <div className="text-lg font-black text-green-400">${comboTotals.expert}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2"><button type="button" onClick={handleSave} className={`flex-1 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 border-2 border-green-600 transition-all ${animatingBtn.save ? 'btn-shake' : 'bg-white text-green-700'}`}><Power size={18}/> ACTIVATE {taskType.toUpperCase()}</button><button type="button" onClick={handleDelete} className={`w-12 font-bold rounded-lg shadow-lg flex items-center justify-center border-2 border-red-600 transition-all ${animatingBtn.delete ? 'btn-shake' : 'bg-white text-red-600'}`}><Trash2 size={18}/></button></div>
                </div>
              )}
            </Accordion>
          );
        })}

        <Accordion id="LOGOS" title="APP CONFIGURATION" icon={Settings} bg="bg-blue-50" color="text-blue-600" border="border-blue-300" isOpen={activeSection === 'LOGOS'} onToggle={() => toggleSection('LOGOS')}>
          <div className="bg-white p-2 rounded-lg border border-gray-300 shadow-sm">
            <h3 className="text-sm font-bold mb-4 text-blue-700 border-b pb-2">🖼️ App Logo Management</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x-mandatory no-scrollbar">{['amazon','alibaba','aliexpress','deposit','withdraw','profile'].map(key => (<div key={key} className="min-w-[120px] bg-gray-50 border rounded-lg p-2 flex flex-col items-center gap-2 snap-center"><div className="text-[9px] font-black uppercase">{key}</div><div className="w-16 h-16 bg-white border rounded flex items-center justify-center overflow-hidden">{logoInputs[key] ? <img src={logoInputs[key]} alt="" className="w-full h-full object-contain"/> : <LucideImage size={16} className="text-gray-300"/>}</div><button type="button" onClick={()=>triggerLogoUpload(key)} className="w-full bg-black text-white text-[9px] py-1 rounded">UPLOAD</button><input value={logoInputs[key]} onChange={e=>setLogoInputs(p=>({...p, [key]:e.target.value}))} className="w-full text-[8px] border p-1 rounded" placeholder="URL..."/></div>))}</div>
            <button type="button" onClick={updateLogos} disabled={logoUpdateStatus === 'loading'} className={`w-full font-black py-3 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-xl transition-all duration-200 ${logoUpdateStatus === 'idle' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''} ${logoUpdateStatus === 'loading' ? 'bg-gray-400 text-gray-200 cursor-wait' : ''} ${logoUpdateStatus === 'success' ? 'bg-green-500 text-white scale-105' : ''} ${logoUpdateStatus === 'error' ? 'bg-red-500 text-white' : ''}`}>{logoUpdateStatus === 'idle' && <><Save size={18}/> UPDATE APP LOGOS</>}{logoUpdateStatus === 'loading' && <><Loader2 size={18} className="animate-spin"/> SAVING...</>}{logoUpdateStatus === 'success' && <><CheckCircle size={18}/> UPDATED!</>}{logoUpdateStatus === 'error' && <><AlertTriangle size={18}/> FAILED</>}</button>
          </div>
        </Accordion>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    const self = this as any;
    if (self.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif', background: '#fef2f2', color: '#991b1b', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ Session Error Recovered</h2>
          <p style={{ fontSize: '12px', background: '#fee2e2', padding: '10px', borderRadius: '8px', maxWidth: '90%', wordBreak: 'break-all' }}>
            {self.state.error?.toString() || "Unexpected error"}
          </p>
          <button 
            type="button"
            onClick={() => { self.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ marginTop: '15px', padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            RELOAD PAGE
          </button>
        </div>
      );
    }
    return self.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AdminPanel />
    </ErrorBoundary>
  );
}
