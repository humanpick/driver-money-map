import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Wallet,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  DollarSign,
  FileText,
  User,
  LogOut,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  CreditCard,
  Receipt,
  Trash2,
  Copy,
  Car,
  Filter,
  RotateCcw,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  Smartphone,
  Fuel,
  AlertTriangle,
  MessageSquare,
  Check,
  Edit2,
  Coins,
  Sparkles,
  Phone,
  RefreshCw,
  UserX,
  BotOff,
  ShieldAlert,
  BarChart3,
  Megaphone,
  Users,
  Download,
  Award,
  Crown,
  BookmarkPlus,
  Radio,
  Send,
  Building2,
  Briefcase
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_DEFAULT_EMAIL = 'beat4989@naver.com';
const ADMIN_DEFAULT_NAME = '공민준';
const ADMIN_DEFAULT_PHONE = '01091417586';

const formatNumberWithComma = (val: string | number) => {
  if (val === '' || val === null || val === undefined) return '';
  const numStr = String(val).replace(/[^0-9]/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('ko-KR');
};

const cleanNumber = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return Number(String(val).replace(/,/g, '')) || 0;
};

const formatPhoneNumber = (val: string) => {
  if (!val) return '';
  const num = val.replace(/[^0-9]/g, '');
  if (num.length === 11) {
    return num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (num.length === 10) {
    return num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return num;
};

interface DrivingRecord {
  id: string;
  userId?: string;
  date: string;
  startTime: string;
  endTime: string;
  departure: string;
  destination: string;
  grossAmount: number;
  feeRate: number;
  fuelAmount: number;
  extraExpenseAmount: number;
  tipAmount: number;
  isPaid: boolean;
  netAmount: number;
  totalClaimAmount: number;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  memo: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holder: string;
}

interface MemberProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'super_admin' | 'manager' | 'vip_driver' | 'user';
  createdAt: string;
  recordCount?: number;
}

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  updatedAt?: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'super_admin' | 'manager' | 'vip_driver' | 'user'>('user');

  // 인증 관련 상태
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'wallet' | 'admin'>('records');
  const [adminSubTab, setAdminSubTab] = useState<'campaign' | 'members' | 'analytics'>('campaign');

  const [selectedDate, setSelectedDate] = useState<string>('2026-11-10');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 모달 상태
  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editGross, setEditGross] = useState('');
  const [editFuel, setEditFuel] = useState('');
  const [editExtra, setEditExtra] = useState('');
  const [editTip, setEditTip] = useState('');

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true);
  const [includeFuel, setIncludeFuel] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true);
  const [claimMessageText, setClaimMessageText] = useState('');

  // 데이터 상태
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('jundriver_local_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [{ id: '1', bankName: '신한은행', accountNumber: '110-123-456789', holder: '공민준' }];
  });

  // 공지사항 관리
  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [inputNoticeTitle, setInputNoticeTitle] = useState('');
  const [inputNoticeContent, setInputNoticeContent] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeLoading, setNoticeLoading] = useState(false);

  // 관리자 통계 및 회원
  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // 폼 입력 상태
  const [newDate, setNewDate] = useState('2026-11-10');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newDeparture, setNewDeparture] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newGross, setNewGross] = useState('');
  const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFuel, setNewFuel] = useState('');
  const [newExtraExpense, setNewExtraExpense] = useState('');
  const [newTip, setNewTip] = useState('');

  const [expCategory, setExpCategory] = useState('대중교통');
  const [expAmount, setExpAmount] = useState('');
  const [expMemo, setExpMemo] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState('');

  useEffect(() => {
    localStorage.setItem('jundriver_local_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase.from('announcements').select('*').order('updated_at', { ascending: false });
      if (data && !error) {
        const formatted: NoticeItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          content: d.content,
          isActive: Boolean(d.is_active),
          updatedAt: d.updated_at ? d.updated_at.substring(0, 16).replace('T', ' ') : '',
        }));
        setNoticeList(formatted);
        const currentActive = formatted.find((n) => n.isActive);
        setActiveNotice(currentActive || null);
      }
    } catch (e) { console.error(e); }
  };

  const fetchUserData = async (userId: string, userEmail: string) => {
    try {
      let role = 'user';
      if (userEmail.toLowerCase() === ADMIN_DEFAULT_EMAIL.toLowerCase()) {
        role = 'super_admin';
        await supabase.from('profiles').upsert({ id: userId, email: userEmail, name: ADMIN_DEFAULT_NAME, phone: ADMIN_DEFAULT_PHONE, role: 'super_admin' });
      } else {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        role = profile?.role || 'user';
      }
      setCurrentUserRole(role as any);

      const { data: recordsData } = await supabase.from('driving_records').select('*').eq('user_id', userId).order('date', { ascending: false });
      if (recordsData) {
        setRecords(recordsData.map((r: any) => ({
          id: r.id, date: r.date, startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
          grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount), extraExpenseAmount: Number(r.extra_expense_amount),
          tipAmount: Number(r.tip_amount), isPaid: Boolean(r.is_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
        })));
      }

      const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false });
      if (expensesData) {
        setExpenses(expensesData.map((e: any) => ({ id: e.id, date: e.date, category: e.category, amount: Number(e.amount), memo: e.memo || '' })));
      }

      if (role === 'super_admin' || role === 'manager') fetchAdminData();
    } catch (err) { console.error(err); }
  };

  const fetchAdminData = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: allRecs } = await supabase.from('driving_records').select('*');
      if (profiles && allRecs) {
        const mappedMembers: MemberProfile[] = profiles.map((p: any) => ({
          id: p.id, email: p.email, name: p.name, phone: p.phone, role: p.role || 'user',
          createdAt: p.created_at ? p.created_at.substring(0, 10) : '-', recordCount: allRecs.filter((r: any) => r.user_id === p.id).length,
        }));
        setAdminMemberList(mappedMembers);
        setAdminAllRecords(allRecs.map((r: any) => ({
          id: r.id, userId: r.user_id, date: r.date, startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
          grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount), extraExpenseAmount: Number(r.extra_expense_amount),
          tipAmount: Number(r.tip_amount), isPaid: Boolean(r.is_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
        })));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchNotices();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
      } else {
        setRecords([]); setExpenses([]); setCurrentUserRole('user');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password.trim() });
    if (error) setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.');
    setAuthLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    if (honeypot.trim() !== '') { setAuthLoading(false); return; }
    if (!captchaVerified) { setAuthError('보안 확인(인간 인증 체크)을 완료해 주세요.'); setAuthLoading(false); return; }

    const trimmedName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!trimmedName || cleanPhone.length < 10 || cleanPhone.length > 11 || password.length < 6 || password !== passwordConfirm || !agreePrivacy) {
      setAuthError('입력 정보를 다시 확인해 주세요. (약관 동의 필수)');
      setAuthLoading(false); return;
    }

    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: password.trim(), options: { data: { name: trimmedName, phone: cleanPhone } } });
    if (error) { setAuthError('가입 실패: ' + error.message); }
    else {
      if (data.user) {
        await supabase.from('profiles').insert([{ id: data.user.id, email: cleanEmail, name: trimmedName, phone: cleanPhone, role: cleanEmail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : 'user' }]);
      }
      setAuthSuccess('회원가입이 완료되었습니다. 로그인해 주세요.'); setAuthMode('login');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileModal(false); setActiveTab('records');
  };

  // 공지 관련 핸들러
  const handleSaveNoticeTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNoticeTitle.trim() || !inputNoticeContent.trim()) return;
    setNoticeLoading(true);
    const targetId = editingNoticeId || `notice_${Date.now()}`;
    const { error } = await supabase.from('announcements').upsert({
      id: targetId, title: inputNoticeTitle.trim(), content: inputNoticeContent.trim(),
      is_active: editingNoticeId ? (noticeList.find(n => n.id === editingNoticeId)?.isActive || false) : false,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      alert(editingNoticeId ? '수정되었습니다.' : '저장되었습니다.');
      setInputNoticeTitle(''); setInputNoticeContent(''); setEditingNoticeId(null); fetchNotices();
    }
    setNoticeLoading(false);
  };

  const handleActivateNotice = async (targetNotice: NoticeItem) => {
    setNoticeLoading(true);
    await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy');
    const { error } = await supabase.from('announcements').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', targetNotice.id);
    if (!error) { alert('메인 배너로 활성화되었습니다.'); fetchNotices(); }
    setNoticeLoading(false);
  };

  const handleDeactivateAllNotices = async () => {
    setNoticeLoading(true);
    const { error } = await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy');
    if (!error) { alert('메인 배너 송출이 중단되었습니다.'); fetchNotices(); }
    setNoticeLoading(false);
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchNotices();
  };

  // 운행 일지 핸들러
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const gross = cleanNumber(newGross); const feeRate = cleanNumber(newFeeRate); const fuel = cleanNumber(newFuel);
    const extraExp = cleanNumber(newExtraExpense); const tip = cleanNumber(newTip);
    const net = gross - (gross * (feeRate / 100)) + tip;
    const claimTotal = gross + fuel + extraExp;
    const recordId = 'rec_' + Date.now().toString();

    const payload = {
      id: recordId, user_id: session.user.id, date: newDate, start_time: newStartTime || '-', end_time: newEndTime || '-',
      departure: newDeparture, destination: newDestination, gross_amount: gross, fee_rate: feeRate, fuel_amount: fuel,
      extra_expense_amount: extraExp, tip_amount: tip, is_paid: false, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal)
    };

    const { error } = await supabase.from('driving_records').insert([payload]);
    if (!error) {
      setRecords([{ id: recordId, date: newDate, startTime: payload.start_time, endTime: payload.end_time, departure: newDeparture, destination: newDestination, grossAmount: gross, feeRate, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, isPaid: false, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) }, ...records]);
      setNewDeparture(''); setNewDestination(''); setNewGross(''); setNewFuel(''); setNewExtraExpense(''); setNewTip('');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const { error } = await supabase.from('driving_records').delete().eq('id', id);
    if (!error) setRecords(records.filter((r) => r.id !== id));
  };

  const togglePaidStatus = async (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;
    const { error } = await supabase.from('driving_records').update({ is_paid: !target.isPaid }).eq('id', id);
    if (!error) setRecords(records.map((r) => (r.id === id ? { ...r, isPaid: !target.isPaid } : r)));
  };

  // 경비 장부 핸들러
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = cleanNumber(expAmount);
    if (!cleanAmt || !session) return;
    const expenseId = 'exp_' + Date.now().toString();
    const payload = { id: expenseId, user_id: session.user.id, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo };
    const { error } = await supabase.from('expenses').insert([payload]);
    if (!error) {
      setExpenses([{ id: expenseId, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }, ...expenses]);
      setExpAmount(''); setExpMemo('');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // 계좌 관리 핸들러
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber) return;
    setAccounts([...accounts, { id: Date.now().toString(), bankName, accountNumber, holder: holder || '본인' }]);
    setBankName(''); setAccountNumber(''); setHolder('');
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  // 문자 생성
  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withExtra: boolean) => {
    const primaryAccount = accounts[0] || { bankName: '은행명', accountNumber: '계좌번호', holder: '예금주' };
    const driverPhone = formatPhoneNumber(session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE);
    const driverName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;
    let total = 0; let itemsText = '';
    if (withGross) { total += r.grossAmount; itemsText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`; }
    if (withFuel && r.fuelAmount > 0) { total += r.fuelAmount; itemsText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원\n`; }
    if (withExtra && r.extraExpenseAmount > 0) { total += r.extraExpenseAmount; itemsText += `* 대납 추가경비: ${r.extraExpenseAmount.toLocaleString()}원\n`; }
    return `[탁송 정산 요청]\n* 운행일자: ${r.date}\n* 운행구간: ${r.departure} ➔ ${r.destination}\n${itemsText}--------------------------------\n* 총 청구금액: ${total.toLocaleString()}원\n* 입금계좌: ${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.holder})${driverPhone ? `\n* 탁송기사: ${driverName} (${driverPhone})` : ''}\n\n확인 후 빠른 입금 부탁드립니다. 감사합니다.`;
  };

  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r);
    setIncludeGross(true); setIncludeFuel(r.fuelAmount > 0); setIncludeExtra(r.extraExpenseAmount > 0);
    setClaimMessageText(buildClaimText(r, true, r.fuelAmount > 0, r.extraExpenseAmount > 0));
    setClaimModalOpen(true);
  };

  const unpaidRecords = records.filter((r) => !r.isPaid);
  const totalUnpaidAmount = unpaidRecords.reduce((acc, cur) => acc + cur.totalClaimAmount, 0);
  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 font-sans relative">
        <div className="w-full max-w-[420px] bg-[#0E1424]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-7 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-indigo-950 border border-indigo-500/30 rounded-xl flex items-center justify-center mb-3">
              <Car className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              JunDriver <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">탁송기사용 스마트 디지털 일지</p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-5">
            <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${authMode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}>로그인</button>
            <button onClick={() => { setAuthMode('signup'); setAuthError(''); setCaptchaVerified(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${authMode === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}>회원가입</button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">이메일</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@driver.com" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-black font-semibold text-sm border-0 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">비밀번호</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-black font-semibold text-sm border-0 focus:ring-2 focus:ring-indigo-500" />
              </div>
              {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}
              {authSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">{authSuccess}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg cursor-pointer shadow-lg shadow-indigo-600/20 mt-2">{authLoading ? '로딩 중...' : '클라우드 로그인'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <input type="text" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">이메일</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@driver.com" required className="w-full px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">이름</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required className="w-full px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-sm" /></div>
                <div><label className="block text-[11px] font-semibold text-indigo-300 mb-1">휴대폰번호</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="01012345678" maxLength={11} required className="w-full px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자리 이상" required className="w-full px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-sm" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호 확인</label><input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="재입력" required className="w-full px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-sm" /></div>
              </div>
              <div onClick={() => setCaptchaVerified(!captchaVerified)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${captchaVerified ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${captchaVerified ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600 bg-slate-800'}`}>{captchaVerified && <Check className="w-3.5 h-3.5" />}</div>
                  <span className="text-xs font-semibold">로봇이 아닙니다 (터치)</span>
                </div>
                <BotOff className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="agreeChk" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                <label htmlFor="agreeChk" className="text-xs text-slate-300 cursor-pointer">이용약관 및 개인정보 처리에 동의합니다.</label>
              </div>
              {authError && <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg cursor-pointer mt-2">{authLoading ? '처리 중...' : '회원가입'}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const userName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;
  const userPhone = formatPhoneNumber(session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans pb-20">
      <header className="sticky top-0 z-30 bg-[#0E1424]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">JunDriver</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">PRO</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdminUser && (
              <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}>
                <Crown className="w-3.5 h-3.5" /><span>관제탑</span>
              </button>
            )}
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-xs text-slate-200 cursor-pointer">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-left hidden sm:block"><span className="block font-bold text-white leading-tight">{userName}님</span></div>
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* 활성 배너 */}
        {activeNotice && activeTab !== 'admin' && (
          <section className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
              <div>
                <div className="text-xs font-extrabold text-indigo-300">{activeNotice.title}</div>
                <div className="text-xs text-slate-200 mt-0.5">{activeNotice.content}</div>
              </div>
            </div>
          </section>
        )}

        {/* 미입금 경고 바 */}
        {totalUnpaidAmount > 0 && activeTab !== 'admin' && (
          <section className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <span className="text-xs font-bold text-rose-300">미입금 내역 ({unpaidRecords.length}건)</span>
                <div className="text-xl font-extrabold text-white">총 {totalUnpaidAmount.toLocaleString()}원</div>
              </div>
            </div>
            <button onClick={() => setActiveTab('claims')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">청구 관리</button>
          </section>
        )}

        {/* 탭 메뉴 */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('records')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors ${activeTab === 'records' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>운행 일지</button>
          <button onClick={() => setActiveTab('claims')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer relative shrink-0 transition-colors ${activeTab === 'claims' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>
            청구문자 {unpaidRecords.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">{unpaidRecords.length}</span>}
          </button>
          <button onClick={() => setActiveTab('expense')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors ${activeTab === 'expense' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>경비 장부</button>
          <button onClick={() => setActiveTab('wallet')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors ${activeTab === 'wallet' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>계좌 관리</button>
        </div>

        {/* 1. 운행 일지 탭 */}
        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 폼 */}
            <div className="bg-[#0E1424]/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4">새 운행 배차 등록</h3>
              <form onSubmit={handleAddRecord} className="space-y-3">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2 focus:ring-indigo-500" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="출발지" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} required className="px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2" />
                  <input type="text" placeholder="도착지" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} required className="px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="운임(원)" value={newGross} onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))} required className="px-3 py-2 bg-white text-black font-bold rounded text-xs focus:ring-2 text-right" />
                  <input type="number" placeholder="수수료(%)" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} className="px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2 text-right" />
                </div>
                <input type="text" placeholder="대납 주유비 (선택)" value={newFuel} onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2 text-right" />
                <input type="text" placeholder="통행료 등 대납 경비 (선택)" value={newExtraExpense} onChange={(e) => setNewExtraExpense(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2 text-right" />
                <input type="text" placeholder="기사 팁 (선택)" value={newTip} onChange={(e) => setNewTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2 text-right" />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs cursor-pointer shadow-md transition-colors">운행 등록</button>
              </form>
            </div>
            {/* 목록 */}
            <div className="lg:col-span-2 bg-[#0E1424]/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4">운행 내역 ({records.length}건)</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {records.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">등록된 운행 기록이 없습니다.</div>
                ) : (
                  records.map((r) => (
                    <div key={r.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                      <div>
                        <div className="font-bold text-white text-sm">{r.departure} ➔ {r.destination}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{r.date} | 운임: <span className="text-slate-200">{r.grossAmount.toLocaleString()}원</span> | 순수익: <span className="text-emerald-400">+{r.netAmount.toLocaleString()}원</span></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => togglePaidStatus(r.id)} className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${r.isPaid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-400'}`}>
                          {r.isPaid ? '입금완료' : '미입금'}
                        </button>
                        <button onClick={() => handleDeleteRecord(r.id)} className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md cursor-pointer transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. 청구문자 탭 (복구됨) */}
        {activeTab === 'claims' && (
          <div className="bg-[#0E1424]/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">미입금 청구 대상 ({unpaidRecords.length}건)</h3>
              <span className="text-xs font-bold text-rose-400">총 미수금 {totalUnpaidAmount.toLocaleString()}원</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpaidRecords.length === 0 ? (
                <div className="col-span-full text-center py-10 text-slate-500 text-xs">미입금 내역이 없습니다.</div>
              ) : (
                unpaidRecords.map((r) => (
                  <div key={r.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded">청구 대기</span>
                        <span className="text-[10px] text-slate-400 font-mono">{r.date}</span>
                      </div>
                      <div className="font-bold text-white text-sm mb-1">{r.departure} ➔ {r.destination}</div>
                      <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                        <div className="flex justify-between"><span>탁송운임</span><span className="text-white">{r.grossAmount.toLocaleString()}원</span></div>
                        {r.fuelAmount > 0 && <div className="flex justify-between"><span>대납 주유비</span><span className="text-white">{r.fuelAmount.toLocaleString()}원</span></div>}
                        {r.extraExpenseAmount > 0 && <div className="flex justify-between"><span>대납 추가경비</span><span className="text-white">{r.extraExpenseAmount.toLocaleString()}원</span></div>}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-sm font-bold text-indigo-400">합계 {r.totalClaimAmount.toLocaleString()}원</span>
                      <button onClick={() => openClaimMessageModal(r)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />문자 생성
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. 경비 장부 탭 (복구됨) */}
        {activeTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4">경비 지출 등록</h3>
              <form onSubmit={handleAddExpense} className="space-y-3">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2 focus:ring-indigo-500" />
                <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2">
                  <option value="대중교통">대중교통 (버스/지하철/택시)</option>
                  <option value="식대">식대/간식</option>
                  <option value="차량공유">차량공유 (쏘카/그린카)</option>
                  <option value="기타">기타 경비</option>
                </select>
                <input type="text" placeholder="지출 금액 (원)" value={expAmount} onChange={(e) => setExpAmount(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 bg-white text-black font-bold rounded text-xs text-right focus:ring-2" />
                <input type="text" placeholder="상세 메모 (선택)" value={expMemo} onChange={(e) => setExpMemo(e.target.value)} className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs focus:ring-2" />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs cursor-pointer shadow-md transition-colors">경비 등록</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-[#0E1424]/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4">지출 내역 ({expenses.length}건)</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {expenses.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">등록된 경비 지출이 없습니다.</div>
                ) : (
                  expenses.map((e) => (
                    <div key={e.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">{e.category}</span>
                          {e.memo || '-'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">{e.date}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-rose-400 font-bold text-sm">-{e.amount.toLocaleString()}원</span>
                        <button onClick={() => handleDeleteExpense(e.id)} className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. 계좌 관리 탭 (복구됨) */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0E1424]/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-4">정산 입금용 계좌 추가</h3>
              <form onSubmit={handleAddAccount} className="space-y-3">
                <input type="text" placeholder="은행명 (예: 신한은행)" value={bankName} onChange={(e) => setBankName(e.target.value)} required className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs" />
                <input type="text" placeholder="계좌번호 (- 제외)" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs font-mono" />
                <input type="text" placeholder="예금주 성함" value={holder} onChange={(e) => setHolder(e.target.value)} required className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs" />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs cursor-pointer shadow-md transition-colors">새 계좌 등록</button>
              </form>
            </div>
            <div className="space-y-3">
              {accounts.map((acc, idx) => (
                <div key={acc.id} className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Building2 className="w-20 h-20" /></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded uppercase">{idx === 0 ? '대표 계좌 (청구용)' : '보조 계좌'}</span>
                      <button onClick={() => handleDeleteAccount(acc.id)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="text-2xl font-bold font-mono tracking-wider text-white mb-2">{acc.accountNumber}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="font-bold">{acc.bankName}</span> <span className="text-slate-500">|</span> <span>예금주: {acc.holder}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. 관제탑 관리자 화면 */}
        {activeTab === 'admin' && isAdminUser && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button onClick={() => setAdminSubTab('campaign')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'campaign' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>공지/이벤트 문구보관함</button>
              <button onClick={() => setAdminSubTab('members')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'members' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>회원 관리 ({adminMemberList.length}명)</button>
              <button onClick={() => setAdminSubTab('analytics')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>마케팅 통계</button>
            </div>

            {/* 공지 보관함 */}
            {adminSubTab === 'campaign' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#0E1424] border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <BookmarkPlus className="w-4 h-4 text-indigo-400" />
                      {editingNoticeId ? '문구 수정하기' : '새 공지/이벤트 문구 저장'}
                    </h4>
                    {editingNoticeId && <button onClick={() => { setEditingNoticeId(null); setInputNoticeTitle(''); setInputNoticeContent(''); }} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">신규 작성으로 전환</button>}
                  </div>
                  <form onSubmit={handleSaveNoticeTemplate} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">공지 제목 (이벤트명)</label>
                      <input type="text" value={inputNoticeTitle} onChange={(e) => setInputNoticeTitle(e.target.value)} placeholder="🎁 신규 이벤트" required className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">공지 본문 내용</label>
                      <textarea rows={4} value={inputNoticeContent} onChange={(e) => setInputNoticeContent(e.target.value)} placeholder="안내할 혜택이나 내용을 입력하세요." required className="w-full px-3 py-2 bg-white text-black rounded text-xs" />
                    </div>
                    <button type="submit" disabled={noticeLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md">{noticeLoading ? '처리 중...' : editingNoticeId ? '수정 내용 저장' : '보관함에 저장하기'}</button>
                  </form>
                  {activeNotice && (
                    <div className="pt-3 border-t border-slate-800">
                      <button onClick={handleDeactivateAllNotices} disabled={noticeLoading} className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 text-xs font-semibold rounded-lg cursor-pointer transition-colors">현재 메인 배너 송출 중단하기</button>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 bg-[#0E1424] border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">저장된 공지 문구 라이브러리</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">상황에 맞는 문구를 선택하여 메인 배너에 즉시 띄울 수 있습니다.</p>
                    </div>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{noticeList.length}개 보관 중</span>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                    {noticeList.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">저장된 문구가 없습니다. 좌측에서 작성해 보세요.</div>
                    ) : (
                      noticeList.map((n) => (
                        <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.isActive ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {n.isActive ? <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500 text-slate-950 rounded flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" />메인 송출 중</span> : <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-400 rounded">보관 중</span>}
                              <h5 className="font-bold text-white text-xs">{n.title}</h5>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{n.updatedAt}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">{n.content}</p>
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleLoadNoticeToForm(n)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-semibold cursor-pointer flex items-center gap-1 transition-colors"><Edit2 className="w-3 h-3" />불러오기</button>
                            <button onClick={() => handleDeleteNotice(n.id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            {!n.isActive && <button onClick={() => handleActivateNotice(n)} disabled={noticeLoading} className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold rounded cursor-pointer flex items-center gap-1 shadow-md transition-colors"><Send className="w-3 h-3" />메인 송출</button>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 회원 관리 */}
            {adminSubTab === 'members' && (
              <div className="bg-[#0E1424] border border-slate-800 p-5 rounded-xl space-y-3">
                <input type="text" placeholder="이름/번호/이메일 검색..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="px-3 py-2 bg-white text-black font-semibold rounded text-xs w-full max-w-xs focus:ring-2 focus:ring-indigo-500" />
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr><th className="p-3">이름</th><th className="p-3">전화번호</th><th className="p-3">이메일</th><th className="p-3">가입일</th><th className="p-3">권한</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {adminMemberList.filter(m => m.name.includes(adminSearchTerm) || m.phone.includes(adminSearchTerm) || m.email.includes(adminSearchTerm)).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-900/50">
                          <td className="p-3 text-white font-bold">{m.name}</td><td className="p-3 font-mono">{formatPhoneNumber(m.phone)}</td><td className="p-3 text-slate-300">{m.email}</td><td className="p-3 text-slate-400">{m.createdAt}</td>
                          <td className="p-3"><span className={`px-2 py-1 rounded text-[10px] font-bold ${m.role === 'super_admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>{m.role}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 통계 */}
            {adminSubTab === 'analytics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0E1424] border border-slate-800 p-4 rounded-xl"><span className="text-xs text-slate-400">총 가입 기사</span><div className="text-2xl font-bold text-white mt-1">{adminMemberList.length}명</div></div>
                  <div className="bg-[#0E1424] border border-slate-800 p-4 rounded-xl"><span className="text-xs text-slate-400">누적 운행 건수</span><div className="text-2xl font-bold text-indigo-400 mt-1">{adminAllRecords.length}건</div></div>
                  <div className="bg-[#0E1424] border border-slate-800 p-4 rounded-xl"><span className="text-xs text-slate-400">플랫폼 총 거래액</span><div className="text-2xl font-bold text-emerald-400 mt-1">{adminAllRecords.reduce((acc, cur) => acc + cur.grossAmount, 0).toLocaleString()}원</div></div>
                  <div className="bg-[#0E1424] border border-slate-800 p-4 rounded-xl"><span className="text-xs text-slate-400">누적 대납 주유비</span><div className="text-2xl font-bold text-amber-400 mt-1">{adminAllRecords.reduce((acc, cur) => acc + cur.fuelAmount, 0).toLocaleString()}원</div></div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 모달: 청구 문자 */}
      {claimModalOpen && selectedClaimRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-[#0E1424] border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-400" />정산 청구 문자 전송</h3>
            <textarea rows={10} value={claimMessageText} onChange={(e) => setClaimMessageText(e.target.value)} className="w-full p-3 bg-white text-black font-semibold rounded-lg text-xs font-mono mb-4 focus:ring-2 focus:ring-indigo-500" />
            <div className="flex gap-2">
              <button onClick={() => setClaimModalOpen(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors">닫기</button>
              <button onClick={() => { navigator.clipboard.writeText(claimMessageText); alert('문구가 복사되었습니다. 카카오톡이나 문자로 붙여넣기 하세요.'); setClaimModalOpen(false); }} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition-colors">복사하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
