import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  Wallet, Calendar, Clock, MapPin, TrendingUp, DollarSign, FileText, User, LogOut,
  KeyRound, X, CheckCircle2, AlertCircle, PlusCircle, CreditCard, Receipt, Trash2,
  Copy, Car, Filter, RotateCcw, CalendarDays, ShieldCheck, ChevronRight, Smartphone,
  Fuel, AlertTriangle, MessageSquare, Check, Edit2, Coins, Sparkles, Phone,
  RefreshCw, UserX, ShieldAlert, BarChart3, Megaphone, Users, Download,
  Award, Crown, BookmarkPlus, Radio, Send, Building2, Info, Map, Target, Navigation, Search
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_DEFAULT_EMAIL = 'beat4989@naver.com';
const ADMIN_DEFAULT_NAME = '김탁송'; 
const ADMIN_DEFAULT_PHONE = '01091417586';

const getTodayKST = () => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split('T')[0];
};

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
  if (num.length === 11) return num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  else if (num.length === 10) return num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return num;
};

interface DrivingRecord {
  id: string; userId?: string; date: string; startTime: string; endTime: string;
  departure: string; destination: string; grossAmount: number; feeRate: number;
  fuelAmount: number; extraExpenseAmount: number; tipAmount: number; 
  isGrossPaid: boolean; isExpensePaid: boolean; /* 분리 미수금 추가 */
  netAmount: number; totalClaimAmount: number;
}
interface ExpenseRecord { id: string; date: string; category: string; amount: number; memo: string; }
interface BankAccount { id: string; bankName: string; accountNumber: string; holder: string; }
interface MemberProfile { id: string; email: string; name: string; phone: string; role: string; createdAt: string; lastLoginAt?: string; loginCount?: number; recordCount?: number; }
interface NoticeItem { id: string; title: string; content: string; isActive: boolean; updatedAt?: string; }

// 전국 주요 자동차 매매단지 정밀 데이터
const TRADE_CENTERS = [
  { id: '1', name: '수원 도이치오토월드', tier: 'S', region: '수도권', addr: '경기 수원시 권선구 권선로 308-5', desc: '전국 최대 실내 복합단지. 전국 탁송 출고 최다 지역.' },
  { id: '2', name: '수원 SK V1 모터스', tier: 'S', region: '수도권', addr: '경기 수원시 권선구 평동로79번길 45', desc: '도이치오토월드 바로 옆 대형 실내 단지. 탁송 콜 집중 발생.' },
  { id: '3', name: '인천 엠파크 (허브/타워)', tier: 'S', region: '수도권', addr: '인천 서구 봉수대로 158', desc: '인천 권역 최대 메가 허브.' },
  { id: '4', name: '용인 오토허브', tier: 'S', region: '수도권', addr: '경기 용인시 기흥구 중부대로 242', desc: '경부고속도로 신갈IC 인근 초대형 복합단지.' },
  { id: '5', name: '부산 경동오토필드', tier: 'A', region: '영남권', addr: '부산 기장군 장안읍 반룡산단3로 95', desc: '영남 최대 3만6천평급 실내 복합단지. 상행 콜 다수.' },
  { id: '6', name: '대구 엠월드', tier: 'A', region: '영남권', addr: '대구 서구 문화로 37', desc: '대구 및 경북권 최대 규모 실내 단지.' },
  { id: '7', name: '대전 디오토몰', tier: 'A', region: '충청권', addr: '대전 유성구 복용동로 35', desc: '충청권 핵심 단지. 영호남 중간 복귀 환적 전초기지.' },
  { id: '8', name: '광주 풍암매매단지', tier: 'A', region: '호남권', addr: '광주 서구 매월1로 50', desc: '호남권 최대 중고차 거래 거점.' }
];

export default function App() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();

  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [currentUserProfile, setCurrentUserProfile] = useState<MemberProfile | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false); 
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(''); const [authSuccess, setAuthSuccess] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // 탭 네비게이션
  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'analytics' | 'wallet' | 'trade_centers' | 'admin'>('records');
  const [adminSubTab, setAdminSubTab] = useState<'members' | 'campaign' | 'analytics'>('members');
  
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayKST());
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // 관제탑 기사 상세조회 (CS 모달)
  const [adminSelectedUser, setAdminSelectedUser] = useState<MemberProfile | null>(null);
  const [adminSelectedUserRecords, setAdminSelectedUserRecords] = useState<DrivingRecord[]>([]);

  // 운행 일지 수정 모달
  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDeparture, setEditDeparture] = useState(''); const [editDestination, setEditDestination] = useState('');
  const [editGross, setEditGross] = useState(''); const [editFuel, setEditFuel] = useState('');
  const [editExtra, setEditExtra] = useState(''); const [editTip, setEditTip] = useState('');

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true); const [includeFuel, setIncludeFuel] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true); const [claimMessageText, setClaimMessageText] = useState('');
  
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try { const saved = localStorage.getItem('jundriver_local_accounts_merged'); if (saved) return JSON.parse(saved); } catch (e) {}
    return [{ id: '1', bankName: '신한은행', accountNumber: '110-123-456789', holder: '김탁송' }];
  });

  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);
  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // 새 운행 등록
  const [newDate, setNewDate] = useState<string>(() => getTodayKST());
  const [newDeparture, setNewDeparture] = useState(''); const [newDestination, setNewDestination] = useState('');
  const [newGross, setNewGross] = useState(''); const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFuel, setNewFuel] = useState(''); const [newExtraExpense, setNewExtraExpense] = useState(''); const [newTip, setNewTip] = useState('');
  
  const [expCategory, setExpCategory] = useState('대중교통'); const [expAmount, setExpAmount] = useState(''); const [expMemo, setExpMemo] = useState('');

  useEffect(() => { localStorage.setItem('jundriver_local_accounts_merged', JSON.stringify(accounts)); }, [accounts]);

  const fetchNotices = async () => {
    const { data } = await supabase.from('announcements').select('*').order('updated_at', { ascending: false });
    if (data) {
      setActiveNotice(data.find((n: any) => n.is_active) || null);
    }
  };

  const fetchUserData = async (userId: string, userEmail: string, userMeta?: any) => {
    let role = 'user';
    const cleanMail = userEmail.toLowerCase();
    const metaName = userMeta?.name || (cleanMail === ADMIN_DEFAULT_EMAIL ? ADMIN_DEFAULT_NAME : '기사님');
    const metaPhone = userMeta?.phone || (cleanMail === ADMIN_DEFAULT_EMAIL ? ADMIN_DEFAULT_PHONE : '');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    role = cleanMail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : (profile?.role || 'user');
    setCurrentUserRole(role);

    // 로그인 시 접속 횟수 증가 및 최근 접속일 갱신
    const currentCount = profile?.login_count || 0;
    const nowIso = new Date().toISOString();
    const profilePayload = {
      id: userId, email: cleanMail, name: profile?.name || metaName, phone: profile?.phone || metaPhone,
      role: role, created_at: profile?.created_at || nowIso,
      last_login_at: nowIso, login_count: currentCount + 1
    };
    await supabase.from('profiles').upsert(profilePayload);

    setCurrentUserProfile({
      id: userId, email: cleanMail, name: profilePayload.name, phone: profilePayload.phone, role: profilePayload.role,
      createdAt: (profilePayload.created_at || '').substring(0, 10),
      lastLoginAt: profilePayload.last_login_at, loginCount: profilePayload.login_count
    });

    const { data: recordsData } = await supabase.from('driving_records').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (recordsData) {
      setRecords(recordsData.map((r: any) => ({
        id: r.id, date: r.date, startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
        grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount), extraExpenseAmount: Number(r.extra_expense_amount),
        tipAmount: Number(r.tip_amount), 
        isGrossPaid: Boolean(r.is_gross_paid), isExpensePaid: Boolean(r.is_expense_paid), /* 분리 미수금 매핑 */
        netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
      })));
    }

    const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (expensesData) setExpenses(expensesData.map((e: any) => ({ id: e.id, date: e.date, category: e.category, amount: Number(e.amount), memo: e.memo || '' })));
    
    if (role === 'super_admin' || role === 'manager') fetchAdminData();
  };

  const fetchAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('last_login_at', { ascending: false });
    const { data: allRecs } = await supabase.from('driving_records').select('*');
    if (profiles && allRecs) {
      setAdminMemberList(profiles.map((p: any) => ({ 
        id: p.id, email: p.email, name: p.name, phone: p.phone, role: p.role || 'user', 
        createdAt: p.created_at ? p.created_at.substring(0, 10) : '-', 
        lastLoginAt: p.last_login_at ? p.last_login_at.substring(0, 16).replace('T', ' ') : '기록없음',
        loginCount: p.login_count || 0,
        recordCount: allRecs.filter((r: any) => r.user_id === p.id).length 
      })));
      setAdminAllRecords(allRecs.map((r: any) => ({ id: r.id, userId: r.user_id, date: r.date, departure: r.departure, destination: r.destination, grossAmount: Number(r.gross_amount), fuelAmount: Number(r.fuel_amount), isGrossPaid: Boolean(r.is_gross_paid), isExpensePaid: Boolean(r.is_expense_paid) })));
    }
  };

  useEffect(() => {
    fetchNotices();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '', session.user.user_metadata);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '', session.user.user_metadata);
      else { setRecords([]); setExpenses([]); setCurrentUserRole('user'); setCurrentUserProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password.trim() });
    if (error) setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.');
    setAuthLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError('');
    if (!captchaVerified) { setAuthError('보안 확인을 완료해 주세요.'); setAuthLoading(false); return; }
    if (!agreePrivacy) { setAuthError('개인정보 수집 및 이용에 동의해 주세요.'); setAuthLoading(false); return; }
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password: password.trim(),
      options: { data: { name: name.trim(), phone: phone.replace(/[^0-9]/g, '') } }
    });

    if (error) { setAuthError('가입 실패: ' + error.message); }
    else { setAuthSuccess('회원가입 완료! 로그인해 주세요.'); setAuthMode('login'); }
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setShowProfileModal(false); setActiveTab('records'); };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!session) return;
    const gross = cleanNumber(newGross); const feeRate = cleanNumber(newFeeRate); const fuel = cleanNumber(newFuel);
    const extraExp = cleanNumber(newExtraExpense); const tip = cleanNumber(newTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + extraExp;
    const recordId = 'rec_' + Date.now().toString();

    // 새 운행 등록 시 운임/주유비 모두 미입금(False) 처리
    const payload = { 
      id: recordId, user_id: session.user.id, date: newDate, departure: newDeparture, destination: newDestination, 
      gross_amount: gross, fee_rate: feeRate, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, 
      is_gross_paid: false, is_expense_paid: false, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal) 
    };
    const { error } = await supabase.from('driving_records').insert([payload]);
    if (!error) {
      const updated = [{ ...payload, startTime: '-', endTime: '-', grossAmount: gross, feeRate, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, isGrossPaid: false, isExpensePaid: false, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) }, ...records];
      updated.sort((a, b) => b.date.localeCompare(a.date));
      setRecords(updated); setSelectedDate(newDate);
      setNewDeparture(''); setNewDestination(''); setNewGross(''); setNewFuel(''); setNewExtraExpense(''); setNewTip('');
    }
  };

  // 개별 미수금 토글 로직
  const toggleGrossPaid = async (id: string) => {
    const target = records.find((r) => r.id === id); if (!target) return;
    const { error } = await supabase.from('driving_records').update({ is_gross_paid: !target.isGrossPaid }).eq('id', id);
    if (!error) setRecords(records.map((r) => (r.id === id ? { ...r, isGrossPaid: !target.isGrossPaid } : r)));
  };
  const toggleExpensePaid = async (id: string) => {
    const target = records.find((r) => r.id === id); if (!target) return;
    const { error } = await supabase.from('driving_records').update({ is_expense_paid: !target.isExpensePaid }).eq('id', id);
    if (!error) setRecords(records.map((r) => (r.id === id ? { ...r, isExpensePaid: !target.isExpensePaid } : r)));
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingRecord) return;
    const gross = cleanNumber(editGross); const fuel = cleanNumber(editFuel); const extraExp = cleanNumber(editExtra); const tip = cleanNumber(editTip);
    const net = gross - (gross * (editingRecord.feeRate / 100)) + tip; const claimTotal = gross + fuel + extraExp;
    const { error } = await supabase.from('driving_records').update({ date: editDate, departure: editDeparture, destination: editDestination, gross_amount: gross, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal) }).eq('id', editingRecord.id);
    if (!error) {
      setRecords(records.map((r) => r.id === editingRecord.id ? { ...r, date: editDate, departure: editDeparture, destination: editDestination, grossAmount: gross, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) } : r));
      setEditingRecord(null);
    }
  };
  const handleDeleteRecord = async (id: string) => { await supabase.from('driving_records').delete().eq('id', id); setRecords(records.filter(r => r.id !== id)); };

  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withExtra: boolean) => {
    const primaryAccount = accounts[0] || { bankName: '은행명', accountNumber: '계좌번호', holder: '예금주' };
    const driverPhone = formatPhoneNumber(currentUserProfile?.phone || '');
    let total = 0; let itemsText = '';
    if (withGross) { total += r.grossAmount; itemsText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`; }
    if (withFuel && r.fuelAmount > 0) { total += r.fuelAmount; itemsText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원\n`; }
    if (withExtra && r.extraExpenseAmount > 0) { total += r.extraExpenseAmount; itemsText += `* 대납 추가경비: ${r.extraExpenseAmount.toLocaleString()}원\n`; }
    return `[정산 요청]\n* 일자: ${r.date}\n* 구간: ${r.departure} → ${r.destination}\n${itemsText}--------------------------------\n* 청구액: ${total.toLocaleString()}원\n* 계좌: ${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.holder})\n기사: ${currentUserProfile?.name} (${driverPhone})\n빠른 입금 부탁드립니다. 감사합니다.`;
  };

  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r); 
    // 이미 입금된 항목은 체크박스 자동 해제
    const initGross = !r.isGrossPaid; 
    const initFuel = !r.isExpensePaid && r.fuelAmount > 0;
    const initExtra = !r.isExpensePaid && r.extraExpenseAmount > 0;
    setIncludeGross(initGross); setIncludeFuel(initFuel); setIncludeExtra(initExtra);
    setClaimMessageText(buildClaimText(r, initGross, initFuel, initExtra)); setClaimModalOpen(true);
  };
  const handleToggleInclude = (type: 'gross' | 'fuel' | 'extra') => {
    if (!selectedClaimRecord) return;
    const newGross = type === 'gross' ? !includeGross : includeGross; const newFuel = type === 'fuel' ? !includeFuel : includeFuel; const newExtra = type === 'extra' ? !includeExtra : includeExtra;
    setIncludeGross(newGross); setIncludeFuel(newFuel); setIncludeExtra(newExtra);
    setClaimMessageText(buildClaimText(selectedClaimRecord, newGross, newFuel, newExtra));
  };

  // 관리자 - 기사 상세 조회
  const openAdminUserDetail = (user: MemberProfile) => {
    setAdminSelectedUser(user);
    const userRecs = adminAllRecords.filter(r => r.userId === user.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    setAdminSelectedUserRecords(userRecs);
  };

  const filteredRecords = filterAllDates ? records : records.filter((r) => r.date === selectedDate);
  // 하나라도 미입금인 건을 미수금 청구 대상에 포함
  const unpaidRecords = records.filter((r) => !r.isGrossPaid || (!r.isExpensePaid && (r.fuelAmount > 0 || r.extraExpenseAmount > 0)));
  const totalUnpaidAmount = unpaidRecords.reduce((acc, r) => {
    let amt = 0;
    if (!r.isGrossPaid) amt += r.grossAmount;
    if (!r.isExpensePaid) amt += (r.fuelAmount + r.extraExpenseAmount);
    return acc + amt;
  }, 0);
  
  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';

  const injectStyles = () => (
    <style dangerouslySetInnerHTML={{__html: `
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
      * { font-family: 'Pretendard', sans-serif !important; }
      body { background-color: #0B1120; color: white; }
      input, select, textarea { background-color: #FFFFFF !important; color: #000000 !important; font-weight: 600 !important; border: 1px solid transparent !important; transition: all 0.3s ease !important; }
      input:focus, select:focus, textarea:focus { box-shadow: 0 0 12px #8B5CF6 !important; border-color: #8B5CF6 !important; outline: none !important; }
      .hp-primary-btn { background: linear-gradient(135deg, #8B5CF6, #4F46E5) !important; color: white !important; transition: transform 0.3s ease, box-shadow 0.3s ease !important; border: none !important; }
      .hp-primary-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5) !important; }
      .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
      .fade-in-text { animation: fadeIn 0.5s ease-in-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
    `}} />
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {injectStyles()}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-[#8B5CF6]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-[420px] glass-card rounded-2xl p-7 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-[#0B1120] border border-[#8B5CF6]/30 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(139,92,246,0.2)]"><Car className="w-6 h-6 text-[#8B5CF6]" /></div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">JunDriver <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">PRO</span></h1>
          </div>
          <div className="flex bg-[#0B1120] p-1 rounded-xl border border-white/10 mb-5">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>로그인</button>
            <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'signup' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>회원가입</button>
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full px-3.5 py-2.5 rounded-lg" />
              {authError && <div className="p-3 bg-[#EC4899]/10 text-[#EC4899] text-xs rounded-lg">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg mt-2">로그인</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <div className="grid grid-cols-2 gap-2"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" required className="w-full px-3.5 py-2.5 rounded-lg" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="휴대폰번호" required className="w-full px-3.5 py-2.5 rounded-lg" /></div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호(6자리 이상)" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <div onClick={() => setCaptchaVerified(!captchaVerified)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${captchaVerified ? 'bg-[#38BDF8]/20 border-[#38BDF8]/50 text-[#38BDF8]' : 'bg-[#0B1120] border-white/10'}`}>
                <div className="flex items-center gap-2.5"><div className={`w-5 h-5 rounded-md border flex items-center justify-center ${captchaVerified ? 'bg-[#38BDF8] border-[#38BDF8] text-white' : 'border-slate-600 bg-slate-800'}`}>{captchaVerified && <Check className="w-3.5 h-3.5" />}</div><span className="text-xs font-semibold">로봇이 아닙니다</span></div>
              </div>
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-[#0B1120] border border-white/10">
                  <div className="flex items-start gap-2.5">
                    <input type="checkbox" id="agreeChk" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6]" />
                    <label htmlFor="agreeChk" className="text-xs text-slate-200 font-medium leading-relaxed cursor-pointer">[필수] 서비스 품질 향상 및 맞춤 혜택 제공을 위한 이용 기록 및 통계 데이터 수집·활용에 동의합니다.</label>
                  </div>
                </div>
              </div>
              {authError && <div className="p-2.5 bg-[#EC4899]/10 text-[#EC4899] text-xs rounded-lg">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg mt-2">동의하고 회원가입</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 pb-20 relative">
      {injectStyles()}
      <header className="sticky top-0 z-30 glass-card border-b-0 border-white/5 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-lg flex items-center justify-center shadow-[0_0_10px_#8B5CF6]"><Car className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-base text-white">JunDriver</span><span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#8B5CF6]/20 text-[#8B5CF6] rounded border border-[#8B5CF6]/30">PRO</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdminUser && <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30"><Crown className="w-3.5 h-3.5" /><span className="hidden sm:inline">관제탑</span></button>}
            <button onClick={handleLogout} className="p-1.5 rounded-lg glass-card text-slate-400 hover:text-[#EC4899]"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-5 space-y-5 h-full">
        <div className="bg-[#0B1120] p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="grid grid-cols-4 md:flex md:flex-wrap gap-1.5">
            <button onClick={() => setActiveTab('records')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'records' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>운행 일지</button>
            <button onClick={() => setActiveTab('claims')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold relative transition-all ${activeTab === 'claims' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>
              청구 관리 {unpaidRecords.length > 0 && <span className="ml-0.5 px-1 py-0.2 rounded-full bg-[#EC4899] text-white text-[9px] font-extrabold">{unpaidRecords.length}</span>}
            </button>
            <button onClick={() => setActiveTab('wallet')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'wallet' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>계좌 관리</button>
            {isAdminUser && <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'admin' ? 'bg-[#38BDF8] text-[#0B1120] font-extrabold shadow-[0_2px_10px_#38BDF8]' : 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30'}`}>관제탑</button>}
          </div>
        </div>

        {/* 운행 일지 탭 (분리 미수금 적용) */}
        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#8B5CF6]" />새 운행 배차 등록</h3>
              <form onSubmit={handleAddRecord} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label><input type="text" value={newGross} onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg text-right" /></div><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label><input type="number" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-right" /></div></div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-[#8B5CF6]/30 space-y-2.5">
                  <label className="text-xs font-bold text-[#8B5CF6] flex items-center gap-1.5"><Fuel className="w-4 h-4 text-[#8B5CF6]" />대납 주유/충전비 (100% 회수)</label>
                  <input type="text" value={newFuel} onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" />
                </div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">통행료 등 추가경비</label><input type="text" value={newExtraExpense} onChange={(e) => setNewExtraExpense(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
                <button type="submit" className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">일지 등록 (미입금 상태)</button>
              </form>
            </div>
            
            <div className="lg:col-span-2 glass-card rounded-xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-[#8B5CF6]" />운행 및 미수금 현황</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-[#0B1120] px-3 py-1.5 rounded-lg border border-white/10"><input type="checkbox" id="allDates" checked={filterAllDates} onChange={(e) => setFilterAllDates(e.target.checked)} className="w-3.5 h-3.5 rounded text-[#8B5CF6] cursor-pointer" /><label htmlFor="allDates" className="text-xs text-slate-300 font-semibold cursor-pointer">전체 누적 보기</label></div>
                  {!filterAllDates && <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white text-black font-bold text-xs px-2 py-1.5 rounded-lg border-0" />}
                </div>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {filteredRecords.length === 0 ? <div className="text-center py-12 text-slate-500 text-xs">내역이 없습니다.</div> : filteredRecords.map((r) => {
                  const hasExpense = r.fuelAmount > 0 || r.extraExpenseAmount > 0;
                  const expenseTotal = r.fuelAmount + r.extraExpenseAmount;
                  return (
                    <div key={r.id} className="glass-card p-4 rounded-xl border border-white/10 transition-all hover:bg-white/5">
                      <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]"><MapPin className="w-4 h-4" /></div><div><div className="text-sm font-bold text-white flex items-center gap-1.5"><span>{r.departure}</span><ChevronRight className="w-4 h-4 text-[#8B5CF6]" /><span>{r.destination}</span></div><div className="text-xs text-slate-400 mt-1">{r.date}</div></div></div>
                        
                        {/* 분리 미수금 뱃지 UI */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button onClick={() => toggleGrossPaid(r.id)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${r.isGrossPaid ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40' : 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/40'}`}>
                            {r.isGrossPaid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} 운임 {r.grossAmount.toLocaleString()}원
                          </button>
                          {hasExpense && (
                            <button onClick={() => toggleExpensePaid(r.id)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${r.isExpensePaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/40'}`}>
                              {r.isExpensePaid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} 주유/경비 {expenseTotal.toLocaleString()}원
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="pt-3 flex justify-between items-center text-xs">
                        <div className="flex gap-3 text-slate-400"><span>탁송료: <strong className="text-white">{r.grossAmount.toLocaleString()}원</strong></span>{hasExpense && <span className="text-[#8B5CF6]">대납: {expenseTotal.toLocaleString()}원</span>}</div>
                        <div className="flex gap-2"><button onClick={() => { setEditingRecord(r); setEditDate(r.date); setEditDeparture(r.departure); setEditDestination(r.destination); setEditGross(formatNumberWithComma(r.grossAmount)); setEditFuel(formatNumberWithComma(r.fuelAmount)); setEditExtra(formatNumberWithComma(r.extraExpenseAmount)); }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-all"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => handleDeleteRecord(r.id)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-[#EC4899] transition-all"><Trash2 className="w-3.5 h-3.5" /></button></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 관제탑 (업그레이드 버전) */}
        {activeTab === 'admin' && isAdminUser && (
          <div className="space-y-6 fade-in-text">
            <div className="mb-2"><h3 className="text-sm font-bold text-[#38BDF8] flex items-center gap-2"><Crown className="w-5 h-5" />플랫폼 관리자 관제탑 (Data Center)</h3><p className="text-[11px] text-slate-400 mt-1 ml-7">가입자의 접속 패턴과 운행 실적을 분석하여 PRO 전환 및 기사단 스카우트에 활용하세요.</p></div>
            
            <div className="flex gap-2 border-b border-white/10 pb-2">
              <button onClick={() => setAdminSubTab('members')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${adminSubTab === 'members' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>가입자 접속 현황 ({adminMemberList.length}명)</button>
              <button onClick={() => setAdminSubTab('analytics')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${adminSubTab === 'analytics' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>통계 보드</button>
            </div>

            {adminSubTab === 'members' && (
              <div className="glass-card p-6 rounded-xl space-y-4">
                <input type="text" placeholder="이름 / 전화번호 검색..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="px-3 py-2 rounded-lg text-xs w-full max-w-xs" />
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0B1120] text-slate-400 border-b border-white/10"><tr><th className="p-3">기사 이름</th><th className="p-3">가입일</th><th className="p-3">최근 앱 접속일</th><th className="p-3 text-center">누적 접속</th><th className="p-3 text-center">등록 실적</th><th className="p-3 text-center">권한</th><th className="p-3 text-right">CS 상세 열람</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {adminMemberList.filter(m => m.name.includes(adminSearchTerm) || m.phone.includes(adminSearchTerm)).map((m) => {
                        const isHighEngaged = (m.recordCount || 0) >= 10;
                        return (
                          <tr key={m.id} className="hover:bg-white/5">
                            <td className="p-3 text-white font-bold flex items-center gap-2">{m.name} {isHighEngaged && <span className="px-1.5 py-0.5 bg-[#EC4899]/20 text-[#EC4899] text-[9px] rounded font-bold">에이스</span>}</td>
                            <td className="p-3 text-slate-500 font-mono">{m.createdAt}</td>
                            <td className="p-3 text-[#38BDF8] font-mono">{m.lastLoginAt}</td>
                            <td className="p-3 text-center text-slate-300 font-bold">{m.loginCount}회</td>
                            <td className="p-3 text-center text-[#8B5CF6] font-bold">{m.recordCount}건</td>
                            <td className="p-3 text-center">{m.role === 'pro_driver' ? <span className="text-emerald-400 font-bold">PRO</span> : <span className="text-slate-400">일반</span>}</td>
                            <td className="p-3 text-right"><button onClick={() => openAdminUserDetail(m)} className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold flex items-center gap-1 ml-auto"><Search className="w-3 h-3" />상세 보기</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {adminSubTab === 'analytics' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">플랫폼 총 가입자</span><div className="text-2xl font-bold text-white mt-1">{adminMemberList.length}명</div></div>
                <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">플랫폼 누적 접속 횟수</span><div className="text-2xl font-bold text-[#8B5CF6] mt-1">{adminMemberList.reduce((acc, m) => acc + (m.loginCount || 0), 0)}회</div></div>
                <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">총 등록 운행 데이터</span><div className="text-2xl font-bold text-[#38BDF8] mt-1">{adminAllRecords.length}건</div></div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 모달: 관리자 기사 상세 조회 */}
      {adminSelectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl glass-card rounded-2xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button onClick={() => setAdminSelectedUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-[#38BDF8] mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> [ {adminSelectedUser.name} ] 기사님 상세 리포트</h3>
            <div className="flex gap-4 mb-4 text-xs text-slate-300 bg-[#0B1120] p-3 rounded-lg border border-white/10"><span>최근 접속: {adminSelectedUser.lastLoginAt}</span><span>누적 운행: {adminSelectedUser.recordCount}건</span></div>
            <div className="overflow-y-auto pr-2 space-y-3 flex-1">
              <h4 className="text-xs font-bold text-white border-b border-white/10 pb-2 mb-2">최근 운행 내역 (최대 10건)</h4>
              {adminSelectedUserRecords.length === 0 ? <div className="text-center text-xs text-slate-500 py-4">운행 기록이 없습니다.</div> : adminSelectedUserRecords.map((r) => {
                const totalClaim = r.grossAmount + r.fuelAmount;
                const unpaid = (!r.isGrossPaid ? r.grossAmount : 0) + (!r.isExpensePaid ? r.fuelAmount : 0);
                return (
                  <div key={r.id} className="bg-[#0B1120] border border-white/10 p-3 rounded-lg text-xs">
                    <div className="flex justify-between text-slate-400 mb-1"><span>{r.date}</span><span className={unpaid > 0 ? 'text-[#EC4899] font-bold' : 'text-emerald-400 font-bold'}>{unpaid > 0 ? `미수금 ${unpaid.toLocaleString()}원` : '전액 정산완료'}</span></div>
                    <div className="font-bold text-white">{r.departure} → {r.destination}</div>
                    <div className="text-slate-400 mt-1">청구총액: {totalClaim.toLocaleString()}원 (운임 {r.grossAmount.toLocaleString()} / 대납 {r.fuelAmount.toLocaleString()})</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setAdminSelectedUser(null)} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition-colors">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
