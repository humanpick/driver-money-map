import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard, Car, AlertTriangle, Fuel, Receipt, TrendingUp, Download, MapPin, User, LogOut,
  Plus, CheckCircle2, MessageSquare, Check, Edit2, Trash2, Copy, X, Camera, Image as ImageIcon,
  ShieldCheck, ChevronRight, Phone, RefreshCw, BookmarkPlus, Crown, Radio, Send, FileSpreadsheet,
  Calculator, Menu, Coins, Sparkles, Calendar, CalendarDays, CreditCard
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_DEFAULT_EMAIL = 'beat4989@naver.com';
const ADMIN_DEFAULT_NAME = '홍길동';
const ADMIN_DEFAULT_PHONE = '01091417586';
const STANDARD_EXPENSE_RATE = 0.794;

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

interface DrivingRecord {
  id: string; userId?: string; date: string; startTime: string; endTime: string;
  companyName: string; departure: string; destination: string; grossAmount: number; feeRate: number;
  fuelAmount: number; tollAmount: number; otherAmount: number; tipAmount: number;
  receiptImage?: string; isPaid: boolean; netAmount: number; totalClaimAmount: number;
}
interface ExpenseRecord { id: string; date: string; category: string; amount: number; memo: string; }
interface BankAccount { id: string; bankName: string; accountNumber: string; holder: string; }
interface MemberProfile { id: string; email: string; name: string; phone: string; role: string; createdAt: string; recordCount?: number; }
interface NoticeItem { id: string; title: string; content: string; isActive: boolean; updatedAt?: string; }

// 사이드바 버튼 컴포넌트 (렌더링 최적화를 위해 분리)
const NavItem = ({ activeTab, onClick, icon: Icon, label, badge }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
      activeTab 
        ? 'bg-gradient-to-r from-[#8B5CF6]/20 to-transparent border border-[#8B5CF6]/30 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
        : 'text-slate-400 hover:bg-[#111827] hover:text-slate-200 border border-transparent'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${activeTab ? 'text-[#8B5CF6]' : ''}`} />
      <span className="text-xs font-bold tracking-wide">{label}</span>
    </div>
    {badge ? <span className="bg-[#EC4899] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{badge}</span> : null}
  </button>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 인증
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false); const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false); const [authError, setAuthError] = useState(''); const [authSuccess, setAuthSuccess] = useState('');

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'claims' | 'expense' | 'analytics' | 'wallet' | 'admin' | 'settings'>('dashboard');
  const [adminSubTab, setAdminSubTab] = useState<'campaign' | 'members' | 'analytics'>('campaign');
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterAllDates, setFilterAllDates] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState(false);

  // 모달 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editCompany, setEditCompany] = useState('');
  const [editGross, setEditGross] = useState(''); const [editFuel, setEditFuel] = useState('');
  const [editToll, setEditToll] = useState(''); const [editOther, setEditOther] = useState(''); const [editTip, setEditTip] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true); const [includeFuel, setIncludeFuel] = useState(true);
  const [includeToll, setIncludeToll] = useState(true); const [includeOther, setIncludeOther] = useState(true);
  const [claimMessageText, setClaimMessageText] = useState('');

  // 데이터
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try { const saved = localStorage.getItem('jundriver_local_accounts_v2'); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); }
    return [{ id: '1', bankName: '신한은행', accountNumber: '110-123-456789', holder: '홍길동' }];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 관리자/공지
  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [inputNoticeTitle, setInputNoticeTitle] = useState(''); const [inputNoticeContent, setInputNoticeContent] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null); const [noticeLoading, setNoticeLoading] = useState(false);
  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // 폼 상태
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]); 
  const [newStartTime, setNewStartTime] = useState(''); const [newEndTime, setNewEndTime] = useState('');
  const [newCompany, setNewCompany] = useState(''); const [newDeparture, setNewDeparture] = useState(''); const [newDestination, setNewDestination] = useState('');
  const [newGross, setNewGross] = useState(''); const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFuel, setNewFuel] = useState(''); const [newToll, setNewToll] = useState(''); const [newOther, setNewOther] = useState('');
  const [newTip, setNewTip] = useState(''); const [receiptImage, setReceiptImage] = useState<string>('');
  
  const [expCategory, setExpCategory] = useState('대중교통'); const [expAmount, setExpAmount] = useState(''); const [expMemo, setExpMemo] = useState('');
  const [bankName, setBankName] = useState(''); const [accountNumber, setAccountNumber] = useState(''); const [holder, setHolder] = useState('');

  useEffect(() => { localStorage.setItem('jundriver_local_accounts_v2', JSON.stringify(accounts)); }, [accounts]);

  const fetchNotices = async () => {
    const { data } = await supabase.from('announcements').select('*').order('updated_at', { ascending: false });
    if (data) {
      const formatted = data.map((d: any) => ({ id: d.id, title: d.title, content: d.content, isActive: Boolean(d.is_active), updatedAt: d.updated_at ? d.updated_at.substring(0, 16).replace('T', ' ') : '' }));
      setNoticeList(formatted); setActiveNotice(formatted.find((n:any) => n.isActive) || null);
    }
  };

  const fetchUserData = async (userId: string, userEmail: string) => {
    setDataLoading(true);
    let role = 'user';
    if (userEmail.toLowerCase() === ADMIN_DEFAULT_EMAIL.toLowerCase()) {
      role = 'super_admin'; await supabase.from('profiles').upsert({ id: userId, email: userEmail, name: ADMIN_DEFAULT_NAME, phone: ADMIN_DEFAULT_PHONE, role: 'super_admin' });
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      role = profile?.role || 'user';
    }
    setCurrentUserRole(role);

    const { data: recordsData } = await supabase.from('driving_records').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (recordsData) {
      setRecords(recordsData.map((r: any) => ({
        id: r.id, date: r.date || '', startTime: r.start_time || '-', endTime: r.end_time || '-', companyName: r.company_name || '일반',
        departure: r.departure, destination: r.destination, grossAmount: Number(r.gross_amount) || 0, feeRate: Number(r.fee_rate) || 0,
        fuelAmount: Number(r.fuel_amount) || 0, tollAmount: Number(r.toll_amount) || 0, otherAmount: Number(r.other_amount) || Number(r.extra_expense_amount) || 0,
        tipAmount: Number(r.tip_amount) || 0, receiptImage: r.receipt_image || undefined, isPaid: Boolean(r.is_paid), netAmount: Number(r.net_amount) || 0, totalClaimAmount: Number(r.total_claim_amount) || 0,
      })));
    }
    const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (expensesData) setExpenses(expensesData.map((e: any) => ({ id: e.id, date: e.date || '', category: e.category, amount: Number(e.amount) || 0, memo: e.memo || '' })));
    
    if (role === 'super_admin' || role === 'manager') fetchAdminData();
    setDataLoading(false);
  };

  const fetchAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: allRecs } = await supabase.from('driving_records').select('*');
    if (profiles && allRecs) {
      setAdminMemberList(profiles.map((p: any) => ({ id: p.id, email: p.email, name: p.name, phone: p.phone, role: p.role || 'user', createdAt: p.created_at ? p.created_at.substring(0, 10) : '-', recordCount: allRecs.filter((r: any) => r.user_id === p.id).length })));
      setAdminAllRecords(allRecs.map((r: any) => ({
        id: r.id, userId: r.user_id, date: r.date || '', startTime: r.start_time || '-', endTime: r.end_time || '-', companyName: r.company_name || '일반', departure: r.departure, destination: r.destination, 
        grossAmount: Number(r.gross_amount) || 0, feeRate: Number(r.fee_rate) || 0, fuelAmount: Number(r.fuel_amount) || 0, tollAmount: Number(r.toll_amount) || 0, otherAmount: Number(r.other_amount) || Number(r.extra_expense_amount) || 0, 
        tipAmount: Number(r.tip_amount) || 0, isPaid: Boolean(r.is_paid), netAmount: Number(r.net_amount) || 0, totalClaimAmount: Number(r.total_claim_amount) || 0,
      })));
    }
  };

  useEffect(() => {
    fetchNotices();
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session?.user) fetchUserData(session.user.id, session.user.email || ''); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); if (session?.user) fetchUserData(session.user.id, session.user.email || ''); else { setRecords([]); setExpenses([]); setCurrentUserRole('user'); setActiveTab('dashboard'); }
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
    if (!agreePrivacy) { setAuthError('이용약관에 동의해 주세요.'); setAuthLoading(false); return; }
    const trimmedName = name.trim(); const cleanPhone = phone.replace(/[^0-9]/g, ''); const cleanEmail = email.trim().toLowerCase();
    if (!trimmedName || cleanPhone.length < 10 || password.length < 6 || password !== passwordConfirm) { setAuthError('입력 정보를 다시 확인해 주세요.'); setAuthLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: password.trim(), options: { data: { name: trimmedName, phone: cleanPhone } } });
    if (error) setAuthError('가입 실패: ' + error.message); else {
      if (data.user) await supabase.from('profiles').insert([{ id: data.user.id, email: cleanEmail, name: trimmedName, phone: cleanPhone, role: cleanEmail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : 'user' }]);
      setAuthSuccess('가입 완료! 로그인해 주세요.'); setAuthMode('login');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setShowProfileModal(false); setActiveTab('dashboard'); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setPwdMessage({ type: 'error', text: '비밀번호는 6자리 이상' }); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPwdMessage({ type: 'error', text: error.message }); else { setPwdMessage({ type: 'success', text: '변경 완료' }); setNewPassword(''); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) setReceiptImage(URL.createObjectURL(file));
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!session) return;
    const gross = cleanNumber(newGross); const feeRate = cleanNumber(newFeeRate); const fuel = cleanNumber(newFuel);
    const toll = cleanNumber(newToll); const other = cleanNumber(newOther); const tip = cleanNumber(newTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + toll + other;
    const recordId = 'rec_' + Date.now().toString();

    const payload = {
      id: recordId, user_id: session.user.id, date: newDate, start_time: newStartTime || '-', end_time: newEndTime || '-',
      company_name: newCompany || '일반', departure: newDeparture, destination: newDestination, gross_amount: gross, fee_rate: feeRate, 
      fuel_amount: fuel, toll_amount: toll, other_amount: other, extra_expense_amount: toll + other, tip_amount: tip, receipt_image: receiptImage || null,
      is_paid: false, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal)
    };
    const { error } = await supabase.from('driving_records').insert([payload]);
    if (!error) {
      setRecords([{ id: recordId, date: newDate, startTime: payload.start_time, endTime: payload.end_time, companyName: newCompany || '일반', departure: newDeparture, destination: newDestination, grossAmount: gross, feeRate, fuelAmount: fuel, tollAmount: toll, otherAmount: other, tipAmount: tip, receiptImage: receiptImage || undefined, isPaid: false, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) }, ...records]);
      setIsAddModalOpen(false); setNewCompany(''); setNewDeparture(''); setNewDestination(''); setNewGross(''); setNewFuel(''); setNewToll(''); setNewOther(''); setNewTip(''); setReceiptImage('');
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingRecord || !session) return;
    const gross = cleanNumber(editGross); const feeRate = cleanNumber(editingRecord.feeRate);
    const fuel = cleanNumber(editFuel); const toll = cleanNumber(editToll); const other = cleanNumber(editOther); const tip = cleanNumber(editTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + toll + other;

    const { error } = await supabase.from('driving_records').update({
      date: editingRecord.date, start_time: editingRecord.startTime, end_time: editingRecord.endTime, company_name: editCompany, 
      departure: editingRecord.departure, destination: editingRecord.destination, gross_amount: gross, fee_rate: feeRate, fuel_amount: fuel, toll_amount: toll, other_amount: other, extra_expense_amount: toll + other, tip_amount: tip, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal)
    }).eq('id', editingRecord.id);

    if (!error) {
      setRecords(records.map((r) => r.id === editingRecord.id ? { ...r, date: editingRecord.date, startTime: editingRecord.startTime, endTime: editingRecord.endTime, companyName: editCompany, departure: editingRecord.departure, destination: editingRecord.destination, grossAmount: gross, fuelAmount: fuel, tollAmount: toll, otherAmount: other, tipAmount: tip, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) } : r));
      setEditingRecord(null);
    }
  };

  const handleDeleteRecord = async (id: string) => { await supabase.from('driving_records').delete().eq('id', id); setRecords(records.filter((r) => r.id !== id)); };
  const togglePaidStatus = async (id: string) => {
    const target = records.find((r) => r.id === id); if (!target) return;
    await supabase.from('driving_records').update({ is_paid: !target.isPaid }).eq('id', id);
    setRecords(records.map((r) => (r.id === id ? { ...r, isPaid: !target.isPaid } : r)));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault(); const cleanAmt = cleanNumber(expAmount); if (!cleanAmt || !session) return;
    const expenseId = 'exp_' + Date.now().toString();
    await supabase.from('expenses').insert([{ id: expenseId, user_id: session.user.id, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }]);
    setExpenses([{ id: expenseId, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }, ...expenses]); setExpAmount(''); setExpMemo('');
  };
  const handleDeleteExpense = async (id: string) => { await supabase.from('expenses').delete().eq('id', id); setExpenses(expenses.filter((e) => e.id !== id)); };
  
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault(); if (!bankName || !accountNumber) return;
    setAccounts([...accounts, { id: Date.now().toString(), bankName, accountNumber, holder: holder || '본인' }]); setBankName(''); setAccountNumber(''); setHolder('');
  };
  
  const downloadCSV = (dataList: DrivingRecord[], fileName: string, isTaxFormat = false) => {
    if (dataList.length === 0) { alert('데이터가 없습니다.'); return; }
    let csvContent = '\uFEFF';
    if (isTaxFormat) {
      const totRev = dataList.reduce((acc, r) => acc + r.grossAmount + r.tipAmount, 0); const totExp = dataList.reduce((acc, r) => acc + r.fuelAmount + r.tollAmount + r.otherAmount, 0);
      csvContent += `--- [종합소득세 신고 요약 (PRO)] ---\n총 매출 수입금액 (운임+팁),${totRev} 원\n경비성 대납금 합계 (비과세),${totExp} 원\n단순경비율 추정 적용치 (79.4%),${Math.round(totRev * STANDARD_EXPENSE_RATE)} 원\n예상 소득금액 (과세표준 대상),${Math.round(totRev * (1 - STANDARD_EXPENSE_RATE))} 원\n\n--- [상세 탁송운행장부] ---\n`;
    }
    csvContent += ['운행일자', '탁송사/오더처', '출발지', '도착지', '순수운임', '대납주유비', '대납통행료', '기타경비', '팁/대기료', '순수익', '입금여부'].join(',') + '\n';
    csvContent += dataList.map((r) => [r.date, `"${r.companyName}"`, `"${r.departure}"`, `"${r.destination}"`, r.grossAmount, r.fuelAmount, r.tollAmount, r.otherAmount, r.tipAmount, r.netAmount, r.isPaid ? '입금완료' : '미입금'].join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })); link.setAttribute('download', fileName);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withToll: boolean, withOther: boolean) => {
    const primaryAccount = accounts[0] || { bankName: '은행명', accountNumber: '계좌번호', holder: '예금주' };
    const driverPhone = formatPhoneNumber(session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE);
    let total = 0; let itemsText = '';
    if (withGross) { total += r.grossAmount; itemsText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`; }
    if (withFuel && r.fuelAmount > 0) { total += r.fuelAmount; itemsText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원\n`; }
    if (withToll && r.tollAmount > 0) { total += r.tollAmount; itemsText += `* 대납 통행료: ${r.tollAmount.toLocaleString()}원\n`; }
    if (withOther && r.otherAmount > 0) { total += r.otherAmount; itemsText += `* 기타 경비: ${r.otherAmount.toLocaleString()}원\n`; }
    return `[정산 청구]\n안녕하세요, ${r.companyName} 담당자님.\n안전하게 탁송 완료하였습니다.\n\n■ 운행구간: ${r.departure} ➔ ${r.destination}\n■ 청구내역\n${itemsText}--------------------------------\n■ 총 청구금액: ${total.toLocaleString()}원\n■ 입금계좌: ${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.holder})\n${driverPhone ? `■ 기사: ${session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME} (${driverPhone})` : ''}\n\n감사합니다.`;
  };
  const handleToggleInclude = (type: 'gross' | 'fuel' | 'toll' | 'other') => {
    const record = selectedClaimRecord; if (!record) return;
    const newGross = type === 'gross' ? !includeGross : includeGross; const newFuel = type === 'fuel' ? !includeFuel : includeFuel; const newToll = type === 'toll' ? !includeToll : includeToll; const newOther = type === 'other' ? !includeOther : includeOther;
    setIncludeGross(newGross); setIncludeFuel(newFuel); setIncludeToll(newToll); setIncludeOther(newOther); setClaimMessageText(buildClaimText(record, newGross, newFuel, newToll, newOther));
  };
  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r); setIncludeGross(true); setIncludeFuel(r.fuelAmount > 0); setIncludeToll(r.tollAmount > 0); setIncludeOther(r.otherAmount > 0);
    setClaimMessageText(buildClaimText(r, true, r.fuelAmount > 0, r.tollAmount > 0, r.otherAmount > 0)); setClaimModalOpen(true);
  };
  
  const getElapsedDays = (recordDate: string) => {
    if (!recordDate) return 0; const today = new Date(); const target = new Date(recordDate); 
    if (isNaN(target.getTime())) return 0; return Math.max(0, Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // 통계 계산 (방어 코드 포함)
  const filteredRecords = filterAllDates ? records : records.filter((r) => r.date === selectedDate);
  const filteredExpenses = filterAllDates ? expenses : expenses.filter((e) => e.date === selectedDate);
  const unpaidRecords = records.filter((r) => !r.isPaid);
  
  const todayDate = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === todayDate);
  const todayGross = todayRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  
  const totalUnpaidAmount = unpaidRecords.reduce((acc, cur) => acc + cur.totalClaimAmount, 0);
  const totalPendingFuel = unpaidRecords.reduce((acc, cur) => acc + cur.fuelAmount, 0);
  
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  // 에러 방어: r.date?.startsWith 로 안전하게 필터링
  const monthlyRecords = records.filter((r) => r.date?.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => e.date?.startsWith(currentMonthPrefix));
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-[#8B5CF6] selection:text-white">
        <div className="w-full max-w-[420px] bg-[#0E1424]/90 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-[#111827] border border-slate-700/60 rounded-xl flex items-center justify-center mb-3"><Car className="w-6 h-6 text-[#8B5CF6]" /></div>
            <div className="flex items-center gap-1.5"><h1 className="text-2xl font-bold tracking-tight text-white">JunDriver</h1><span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">PRO</span></div>
            <p className="text-xs text-slate-400 mt-1">프리미엄 탁송 기사용 대시보드</p>
          </div>
          <div className="flex bg-[#111827] p-1 rounded-xl border border-slate-800 mb-5">
            <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === 'login' ? 'bg-[#8B5CF6] text-white' : 'text-slate-400'}`}>로그인</button>
            <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === 'signup' ? 'bg-[#8B5CF6] text-white' : 'text-slate-400'}`}>회원가입</button>
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1.5">이메일 계정</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-[#8B5CF6]" /></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1.5">비밀번호</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-[#8B5CF6]" /></div>
              {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}
              {authSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">{authSuccess}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 px-4 bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-semibold text-sm rounded-lg shadow-lg cursor-pointer">{authLoading ? '로그인 중...' : '클라우드 로그인'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">이메일 계정</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">이름</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">휴대폰 번호</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} maxLength={11} required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호 확인</label><input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
              </div>
              <div className="pt-2">
                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <input type="checkbox" id="privacyCheck" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6] cursor-pointer" />
                    <label htmlFor="privacyCheck" className="text-xs text-slate-200 font-medium cursor-pointer">[필수] 연락처·개인정보 수집 및 동의</label>
                  </div>
                </div>
              </div>
              {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 px-4 bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-semibold text-sm rounded-lg cursor-pointer">{authLoading ? '계정 생성 중...' : '동의하고 회원가입'}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const userPhone = formatPhoneNumber(session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE);
  const userName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B1120] text-slate-100 font-sans selection:bg-[#8B5CF6] selection:text-white">
      
      {/* 🔹 사이드바 */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0E1424] border-r border-slate-800/80 flex flex-col transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20"><Car className="w-4 h-4 text-white" /></div>
            <span className="font-extrabold text-lg text-white tracking-tight">JunDriver</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5"/></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          <NavItem id="dashboard" icon={LayoutDashboard} label="대시보드" activeTab={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
          <NavItem id="records" icon={Car} label="운행 내역" activeTab={activeTab === 'records'} onClick={() => { setActiveTab('records'); setIsSidebarOpen(false); }} />
          <NavItem id="claims" icon={AlertTriangle} label="미수금 & SMS" badge={unpaidRecords.length > 0 ? unpaidRecords.length : undefined} activeTab={activeTab === 'claims'} onClick={() => { setActiveTab('claims'); setIsSidebarOpen(false); }} />
          <NavItem id="expense" icon={Receipt} label="지출 관리" activeTab={activeTab === 'expense'} onClick={() => { setActiveTab('expense'); setIsSidebarOpen(false); }} />
          <NavItem id="wallet" icon={CreditCard} label="정산용 계좌" activeTab={activeTab === 'wallet'} onClick={() => { setActiveTab('wallet'); setIsSidebarOpen(false); }} />
          <NavItem id="analytics" icon={TrendingUp} label="수익 분석 (세무)" activeTab={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} />
          {isAdminUser && <NavItem id="admin" icon={Crown} label="👑 관제탑 (관리자)" activeTab={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }} />}
          <NavItem id="settings" icon={User} label="내 정보" activeTab={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
        </nav>
        <div className="p-4 border-t border-slate-800/80">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer">
            <LogOut className="w-4 h-4" /><span className="text-xs font-bold">로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 🔹 모바일 오버레이 */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* 🔹 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="flex items-center justify-between px-6 py-4 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800/50 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-300 hover:text-white p-1" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {activeTab === 'dashboard' ? '대시보드' : activeTab === 'records' ? '운행 내역' : activeTab === 'claims' ? '미수금 관리' : activeTab === 'expense' ? '지출 관리' : activeTab === 'wallet' ? '계좌 관리' : activeTab === 'analytics' ? '수익 분석' : activeTab === 'settings' ? '내 정보' : '관제탑'}
              <span className="ml-3 px-2 py-0.5 rounded-full bg-[#111827] text-slate-400 text-[10px] border border-slate-800 font-mono tracking-wider">{todayDate}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#8B5CF6]/20 transition-all flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">빠른 등록</span>
            </button>
            <button onClick={() => setActiveTab('claims')} className="hidden sm:flex px-4 py-2 bg-[#111827] border border-slate-700 hover:border-emerald-500/50 text-emerald-400 text-xs font-bold rounded-xl transition-all items-center gap-1.5 cursor-pointer">
              <CheckCircle2 className="w-4 h-4" /> 입금 처리
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar relative">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {activeNotice && activeTab !== 'admin' && (
              <section className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3"><Megaphone className="w-5 h-5 text-[#8B5CF6] animate-pulse shrink-0" /><div><div className="text-xs font-extrabold text-indigo-300">{activeNotice.title}</div><div className="text-xs text-slate-200 mt-0.5">{activeNotice.content}</div></div></div>
              </section>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-[#0E1424] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Car className="w-20 h-20" /></div>
                    <div className="text-[11px] font-bold text-slate-400 mb-3">오늘 운행/정산액</div>
                    <div className="flex items-end justify-between relative z-10">
                      <div className="text-2xl font-extrabold text-white">{todayRecords.length}<span className="text-sm font-medium text-slate-500 ml-1">건</span></div>
                      <div className="text-lg font-bold text-[#8B5CF6]">{todayGross.toLocaleString()}<span className="text-xs font-medium ml-1">원</span></div>
                    </div>
                  </div>
                  <div className="bg-[#0E1424] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => setActiveTab('claims')}>
                    <div className="text-[11px] font-bold text-slate-400 mb-3">미수금 총액</div>
                    <div className="text-3xl font-extrabold text-[#EC4899]">{totalUnpaidAmount.toLocaleString()}<span className="text-sm font-medium ml-1">원</span></div>
                  </div>
                  <div className="bg-[#0E1424] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="text-[11px] font-bold text-slate-400 mb-3">주유 환급대기 (미수금 내)</div>
                    <div className="text-3xl font-extrabold text-[#38BDF8]">{totalPendingFuel.toLocaleString()}<span className="text-sm font-medium ml-1">원</span></div>
                  </div>
                  <div className="bg-[#0E1424] border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="text-[11px] font-bold text-slate-400 mb-3">이번 달 순수익</div>
                    <div className="text-3xl font-extrabold text-emerald-400">{monthlyProfit.toLocaleString()}<span className="text-sm font-medium ml-1">원</span></div>
                  </div>
                </div>

                <div className="bg-[#0E1424] border border-slate-800/80 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/50">
                    <h3 className="text-sm font-bold text-white">최근 운행 내역 (최대 5건)</h3>
                    <button onClick={() => setActiveTab('records')} className="text-xs font-semibold text-[#8B5CF6] hover:text-white cursor-pointer">전체보기</button>
                  </div>
                  <div className="space-y-3">
                    {records.slice(0, 5).map(r => (
                      <div key={r.id} className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded-md bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-extrabold border border-[#8B5CF6]/30 shrink-0">{r.companyName}</span>
                          <span className="text-sm font-bold text-slate-200">{r.departure} <span className="text-slate-500 mx-1">➔</span> {r.destination}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-extrabold text-[#38BDF8]">{r.grossAmount.toLocaleString()}<span className="text-xs ml-0.5">원</span></div>
                          <div className={`text-[10px] font-bold mt-1 ${r.isPaid ? 'text-emerald-400' : 'text-[#EC4899]'}`}>{r.isPaid ? '정산 완료' : '정산 대기'}</div>
                        </div>
                      </div>
                    ))}
                    {records.length === 0 && <div className="text-center py-8 text-xs text-slate-500">운행 내역이 없습니다.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'records' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0E1424] border border-slate-800/80 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setFilterAllDates(false); }} className="px-3 py-2 rounded-lg bg-[#111827] border border-slate-700 text-white font-bold text-xs" />
                    <button onClick={() => setFilterAllDates(!filterAllDates)} className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${filterAllDates ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30' : 'bg-[#111827] text-slate-400 border-slate-700'}`}>전체 내역</button>
                  </div>
                </div>
                <div className="bg-[#0E1424] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">등록된 운행 기록이 없습니다.</div>
                  ) : (
                    filteredRecords.map(r => (
                      <div key={r.id} className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#8B5CF6]/10 rounded-lg text-[#8B5CF6] shrink-0"><MapPin className="w-4 h-4"/></div>
                          <div>
                            <div className="flex items-center gap-2 mb-1"><span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">{r.companyName}</span><span className="text-sm font-bold text-white">{r.departure} ➔ {r.destination}</span></div>
                            <div className="text-[11px] text-slate-500 font-mono">{r.date} | 탁송료: <strong className="text-white">{r.grossAmount.toLocaleString()}</strong>원 | 순익: <strong className="text-emerald-400">+{r.netAmount.toLocaleString()}</strong>원</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => togglePaidStatus(r.id)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border ${r.isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/20'}`}>{r.isPaid ? '입금완료' : '미입금'}</button>
                          {r.receiptImage && <button onClick={() => setPreviewImage(r.receiptImage || null)} className="p-1.5 bg-slate-800 rounded-lg text-[#38BDF8] cursor-pointer"><ImageIcon className="w-4 h-4"/></button>}
                          <button onClick={() => { handleOpenEditModal(r); setIsAddModalOpen(true); }} className="p-1.5 bg-slate-800 rounded-lg hover:text-white cursor-pointer"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => handleDeleteRecord(r.id)} className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="bg-[#0E1424] border border-slate-800/80 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#8B5CF6]"/> 청구 대상 목록 ({unpaidRecords.length}건)</h3>
                  <div className="text-right text-xs text-slate-400">총 미수금 <span className="text-lg font-extrabold text-[#EC4899] ml-1">{totalUnpaidAmount.toLocaleString()}원</span></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {unpaidRecords.map(r => {
                    const elapsed = getElapsedDays(r.date);
                    return (
                      <div key={r.id} className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-[#8B5CF6]/50 transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded">{r.companyName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${elapsed >= 3 ? 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/30 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{elapsed === 0 ? '당일 미입금' : `${elapsed}일 경과`}</span>
                          </div>
                          <div className="font-bold text-white text-sm mb-1">{r.departure} ➔ {r.destination}</div>
                          <div className="text-xs text-slate-400 space-y-0.5 mt-2">
                            <div className="flex justify-between"><span>기본 운임</span><span className="text-white">{r.grossAmount.toLocaleString()}원</span></div>
                            {r.fuelAmount > 0 && <div className="flex justify-between"><span>주유비</span><span className="text-[#38BDF8]">{r.fuelAmount.toLocaleString()}원</span></div>}
                            {(r.tollAmount > 0 || r.otherAmount > 0) && <div className="flex justify-between"><span>기타경비</span><span className="text-[#38BDF8]">{(r.tollAmount + r.otherAmount).toLocaleString()}원</span></div>}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                          <span className="font-bold text-white text-sm">합 {r.totalClaimAmount.toLocaleString()}원</span>
                          <div className="flex gap-2">
                            <button onClick={() => togglePaidStatus(r.id)} className="px-2 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg cursor-pointer"><Check className="w-4 h-4"/></button>
                            <button onClick={() => openClaimMessageModal(r)} className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"><Send className="w-3 h-3"/> 청구</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {unpaidRecords.length === 0 && <div className="col-span-full text-center py-10 text-xs text-slate-500">모든 정산이 완료되었습니다.</div>}
                </div>
              </div>
            )}

            {activeTab === 'expense' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#0E1424] border border-slate-800/80 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">새 지출 등록</h3>
                  <form onSubmit={handleAddExpense} className="space-y-3.5">
                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg bg-[#111827] border border-slate-800 text-white font-semibold text-xs focus:border-[#8B5CF6] focus:outline-none" />
                    <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[#111827] border border-slate-800 text-white font-semibold text-xs focus:border-[#8B5CF6] focus:outline-none"><option value="대중교통">대중교통 (지하철/버스/택시)</option><option value="식대">식대/간식</option><option value="차량공유">차량공유 (쏘카 등)</option><option value="기타">기타</option></select>
                    <input type="text" inputMode="numeric" placeholder="금액 (예: 4,500)" value={expAmount} onChange={(e) => setExpAmount(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2.5 rounded-lg bg-[#111827] border border-slate-800 text-white font-bold text-xs focus:border-[#8B5CF6] focus:outline-none" />
                    <input type="text" placeholder="메모 (예: 복귀 광역버스)" value={expMemo} onChange={(e) => setExpMemo(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[#111827] border border-slate-800 text-white font-semibold text-xs focus:border-[#8B5CF6] focus:outline-none" />
                    <button type="submit" className="w-full py-3 bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-xs rounded-xl cursor-pointer">장부에 기록</button>
                  </form>
                </div>
                <div className="lg:col-span-2 bg-[#0E1424] border border-slate-800/80 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4">최근 지출 내역 ({filteredExpenses.length}건)</h3>
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {filteredExpenses.map((exp) => (
                      <div key={exp.id} className="bg-[#111827] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div><div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">{exp.category}</span><span className="text-sm font-bold text-white">{exp.memo || '-'}</span></div><div className="text-[11px] text-slate-500 font-mono mt-1">{exp.date}</div></div>
                        <div className="flex items-center gap-3"><span className="text-sm font-bold text-[#EC4899]">-{exp.amount.toLocaleString()}원</span><button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-600 hover:text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button></div>
                      </div>
                    ))}
                    {filteredExpenses.length === 0 && <div className="text-center py-8 text-xs text-slate-500">지출 내역이 없습니다.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wallet' || activeTab === 'settings' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0E1424] border border-slate-800/80 rounded-xl p-5 h-fit">
                  <h3 className="text-sm font-bold text-white mb-2">정산용 계좌 등록</h3>
                  <p className="text-[11px] text-slate-400 mb-4">입력한 계좌는 기기 내부에만 안전하게 저장됩니다.</p>
                  <form onSubmit={handleAddAccount} className="space-y-3.5">
                    <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required placeholder="은행명 (예: 신한은행)" className="w-full px-3 py-2.5 rounded-lg bg-[#111827] border border-slate-800 text-white font-semibold text-xs focus:border-[#8B5CF6] focus:outline-none" />
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required placeholder="계좌번호 (- 제외)" className="w-full px-3 py-2.5 rounded-lg bg-[#111827] border border-slate-800 text-white font-semibold text-xs font-mono focus:border-[#8B5CF6] focus:outline-none" />
                    <input type="text" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="예금주 성함" className="w-full px-3 py-2.5 rounded-lg bg-[#111827] border border-slate-800 text-white font-semibold text-xs focus:border-[#8B5CF6] focus:outline-none" />
                    <button type="submit" className="w-full py-3 bg-[#8B5CF6] hover:opacity-90 text-white font-bold text-xs rounded-xl cursor-pointer">안전하게 저장</button>
                  </form>
                </div>
                <div className="space-y-4">
                  <div className="bg-[#0E1424] border border-slate-800/80 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-white mb-4">등록된 계좌 목록</h3>
                    <div className="space-y-3">
                      {accounts.map((acc, idx) => (
                        <div key={acc.id} className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                          <div><div className="text-sm font-bold text-white flex items-center gap-2">{acc.bankName} ({acc.holder}) {idx === 0 && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] rounded">기본(청구용)</span>}</div><div className="text-sm font-mono text-[#38BDF8] mt-1 tracking-wider">{acc.accountNumber}</div></div>
                          <div className="flex items-center gap-2"><button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); alert('복사되었습니다.'); }} className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white cursor-pointer"><Copy className="w-4 h-4"/></button><button onClick={() => setAccounts(accounts.filter((a) => a.id !== acc.id))} className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4"/></button></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#0E1424] border border-slate-800/80 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-white mb-4">보안 / 계정 관리</h3>
                    <button onClick={() => setShowProfileModal(true)} className="w-full py-3 bg-[#111827] border border-slate-700 hover:border-[#8B5CF6]/50 text-white font-bold text-xs rounded-xl cursor-pointer">비밀번호 변경하기</button>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#0E1424] to-[#111827] border border-[#8B5CF6]/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(139,92,246,0.1)] relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 opacity-5"><Calculator className="w-64 h-64" /></div>
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#8B5CF6]"/>PRO 세무 대시보드 (종합소득세)</h3>
                      <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">매출에서 비과세(대납금)를 분리하고 단순경비율(79.4%)을 적용한 추정 과세표준입니다.</p>
                    </div>
                    <button onClick={() => downloadCSV(records, `JunDriver_세무장부_${todayDate}.csv`, true)} className="px-4 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2 shadow-lg shrink-0"><FileSpreadsheet className="w-4 h-4" />엑셀(CSV) 추출</button>
                  </div>
                  {(() => {
                    const totRev = records.reduce((acc, r) => acc + r.grossAmount + r.tipAmount, 0); const totExp = records.reduce((acc, r) => acc + r.fuelAmount + r.tollAmount + r.otherAmount, 0); const estTaxable = totRev * (1 - STANDARD_EXPENSE_RATE);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 p-5 rounded-xl"><div className="text-[11px] text-slate-400 font-bold mb-2">총 매출 수입금액 (운임+팁)</div><div className="text-2xl font-extrabold text-white">{totRev.toLocaleString()}<span className="text-sm font-normal text-slate-500 ml-1">원</span></div></div>
                        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 p-5 rounded-xl"><div className="text-[11px] text-slate-400 font-bold mb-2">대납 경비 합계 (비과세성)</div><div className="text-2xl font-extrabold text-[#EC4899]">{totExp.toLocaleString()}<span className="text-sm font-normal text-slate-500 ml-1">원</span></div></div>
                        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-700/50 p-5 rounded-xl"><div className="text-[11px] text-slate-400 font-bold mb-2">단순경비율 공제 추정액</div><div className="text-2xl font-extrabold text-slate-300">- {Math.round(totRev * STANDARD_EXPENSE_RATE).toLocaleString()}<span className="text-sm font-normal text-slate-500 ml-1">원</span></div></div>
                        <div className="bg-gradient-to-r from-[#8B5CF6]/20 to-transparent border border-[#8B5CF6]/50 p-5 rounded-xl"><div className="text-[11px] text-indigo-300 font-bold mb-2">예상 소득금액 (과세표준)</div><div className="text-2xl font-extrabold text-[#38BDF8]">{Math.round(estTaxable).toLocaleString()}<span className="text-sm font-normal text-indigo-300/50 ml-1">원</span></div></div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'admin' && isAdminUser && (
              <div className="space-y-6">
                <div className="flex gap-2 border-b border-slate-800 pb-2">
                  <button onClick={() => setAdminSubTab('campaign')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'campaign' ? 'bg-[#8B5CF6] text-white' : 'bg-[#111827] text-slate-400'}`}>공지 보관함</button>
                  <button onClick={() => setAdminSubTab('members')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'members' ? 'bg-[#8B5CF6] text-white' : 'bg-[#111827] text-slate-400'}`}>회원 관리 ({adminMemberList.length}명)</button>
                  <button onClick={() => setAdminSubTab('analytics')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'analytics' ? 'bg-[#8B5CF6] text-white' : 'bg-[#111827] text-slate-400'}`}>전체 통계</button>
                </div>
                
                {adminSubTab === 'campaign' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-[#0E1424] border border-slate-800/80 p-5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between"><h4 className="font-bold text-white text-sm flex items-center gap-2"><BookmarkPlus className="w-4 h-4 text-[#8B5CF6]" />{editingNoticeId ? '문구 수정' : '새 문구 저장'}</h4>{editingNoticeId && <button onClick={() => { setEditingNoticeId(null); setInputNoticeTitle(''); setInputNoticeContent(''); }} className="text-[10px] text-slate-400 cursor-pointer">신규</button>}</div>
                      <form onSubmit={handleSaveNoticeTemplate} className="space-y-3"><input type="text" value={inputNoticeTitle} onChange={(e) => setInputNoticeTitle(e.target.value)} placeholder="제목" required className="w-full px-3 py-2.5 bg-[#111827] border border-slate-800 text-white font-semibold rounded-lg text-xs focus:border-[#8B5CF6] focus:outline-none" /><textarea rows={4} value={inputNoticeContent} onChange={(e) => setInputNoticeContent(e.target.value)} placeholder="내용" required className="w-full px-3 py-2.5 bg-[#111827] border border-slate-800 text-white rounded-lg text-xs focus:border-[#8B5CF6] focus:outline-none" /><button type="submit" disabled={noticeLoading} className="w-full py-3 bg-[#8B5CF6] text-white font-bold rounded-xl text-xs cursor-pointer">{noticeLoading ? '처리 중...' : '저장하기'}</button></form>
                      {activeNotice && <div className="pt-3 border-t border-slate-800"><button onClick={handleDeactivateAllNotices} className="w-full py-2 bg-slate-900 border border-slate-700 text-[#EC4899] text-xs font-semibold rounded-lg cursor-pointer">현재 배너 송출 중단</button></div>}
                    </div>
                    <div className="lg:col-span-2 bg-[#0E1424] border border-slate-800/80 p-5 rounded-xl">
                      <div className="flex items-center justify-between mb-4"><h4 className="font-bold text-white text-sm">라이브러리</h4><span className="text-[11px] text-[#8B5CF6] font-bold">{noticeList.length}개 보관 중</span></div>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {noticeList.map((n) => (
                          <div key={n.id} className={`p-4 rounded-xl border ${n.isActive ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/50' : 'bg-[#111827] border-slate-800'}`}>
                            <div className="flex justify-between gap-3 mb-2"><div className="flex items-center gap-2">{n.isActive ? <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 flex items-center gap-1"><Radio className="w-2.5 h-2.5 animate-pulse" />송출 중</span> : <span className="px-2 py-0.5 text-[9px] bg-slate-800 text-slate-400 rounded">보관 중</span>}<h5 className="font-bold text-white text-xs">{n.title}</h5></div><span className="text-[9px] text-slate-500">{n.updatedAt}</span></div>
                            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{n.content}</p>
                            <div className="flex justify-end gap-2"><button onClick={() => { setInputNoticeTitle(n.title); setInputNoticeContent(n.content); setEditingNoticeId(n.id); }} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] rounded cursor-pointer flex items-center gap-1"><Edit2 className="w-3 h-3" />불러오기</button><button onClick={() => handleDeleteNotice(n.id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>{!n.isActive && <button onClick={() => handleActivateNotice(n)} className="px-3 py-1 bg-[#8B5CF6] text-white text-[10px] font-bold rounded cursor-pointer flex items-center gap-1"><Send className="w-3 h-3" />송출</button>}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {adminSubTab === 'members' && (
                  <div className="bg-[#0E1424] border border-slate-800/80 p-5 rounded-xl space-y-3">
                    <input type="text" placeholder="이름/번호/이메일 검색..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="px-3 py-2.5 bg-[#111827] border border-slate-800 text-white font-semibold rounded-lg text-xs w-full max-w-xs focus:border-[#8B5CF6] focus:outline-none" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#111827] text-slate-400 border-b border-slate-800"><tr><th className="p-3 font-semibold">이름</th><th className="p-3 font-semibold">전화번호</th><th className="p-3 font-semibold">이메일</th><th className="p-3 font-semibold">권한</th><th className="p-3 font-semibold text-right">권한 변경</th></tr></thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {adminMemberList.filter(m => (m.name||'').includes(adminSearchTerm) || (m.phone||'').includes(adminSearchTerm) || (m.email||'').includes(adminSearchTerm)).map((m) => (
                            <tr key={m.id} className="hover:bg-[#111827]/50">
                              <td className="p-3 text-white font-bold">{m.name}</td>
                              <td className="p-3 font-mono text-slate-300">{formatPhoneNumber(m.phone)}</td>
                              <td className="p-3 text-slate-400">{m.email}</td>
                              <td className="p-3">{m.role === 'super_admin' ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">최고 관리자</span> : m.role === 'manager' ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">운영 직원</span> : m.role === 'vip_driver' ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/30">VIP 기사</span> : m.role === 'pro_driver' ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PRO 기사</span> : <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">일반 기사</span>}</td>
                              <td className="p-3 text-right">
                                <select value={m.role} onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)} className="bg-[#111827] border border-slate-700 text-white rounded px-2 py-1 text-[11px] cursor-pointer outline-none focus:border-[#8B5CF6]">
                                  <option value="user">일반 기사</option><option value="pro_driver">PRO 기사</option><option value="vip_driver">VIP 기사</option><option value="manager">운영 직원</option><option value="super_admin">최고 관리자</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {adminSubTab === 'analytics' && (
                  <div className="space-y-4">
                    <div className="flex justify-end"><button onClick={() => downloadCSV(adminAllRecords, 'JunDriver_전체운행.csv', false)} className="px-4 py-2 bg-[#111827] border border-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"><Download className="w-4 h-4" /> 전체 DB 엑셀 추출</button></div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-[#0E1424] border border-slate-800/80 p-5 rounded-xl"><div className="text-[11px] font-bold text-slate-400 mb-1">총 가입 기사</div><div className="text-2xl font-extrabold text-white">{adminMemberList.length}<span className="text-sm font-medium text-slate-500 ml-1">명</span></div></div>
                      <div className="bg-[#0E1424] border border-slate-800/80 p-5 rounded-xl"><div className="text-[11px] font-bold text-slate-400 mb-1">플랫폼 누적 운행</div><div className="text-2xl font-extrabold text-[#8B5CF6]">{adminAllRecords.length}<span className="text-sm font-medium text-slate-500 ml-1">건</span></div></div>
                      <div className="bg-[#0E1424] border border-slate-800/80 p-5 rounded-xl"><div className="text-[11px] font-bold text-slate-400 mb-1">플랫폼 누적 거래액</div><div className="text-2xl font-extrabold text-emerald-400">{adminAllRecords.reduce((acc, cur) => acc + cur.grossAmount, 0).toLocaleString()}<span className="text-sm font-medium text-slate-500 ml-1">원</span></div></div>
                      <div className="bg-[#0E1424] border border-slate-800/80 p-5 rounded-xl"><div className="text-[11px] font-bold text-slate-400 mb-1">누적 대납 주유비</div><div className="text-2xl font-extrabold text-[#38BDF8]">{adminAllRecords.reduce((acc, cur) => acc + cur.fuelAmount, 0).toLocaleString()}<span className="text-sm font-medium text-slate-500 ml-1">원</span></div></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 🔹 팝업: 공통 운행 일지 추가/수정 모달 (빠른 등록) */}
      {(isAddModalOpen || editingRecord) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => { setIsAddModalOpen(false); setEditingRecord(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer bg-[#111827] rounded-full"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-2.5 mb-5"><div className="p-2 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6]"><Car className="w-5 h-5" /></div><h3 className="text-base font-bold text-white">{editingRecord ? '운행 내역 수정' : '새 운행 빠른 등록'}</h3></div>
            <form onSubmit={editingRecord ? handleUpdateRecord : handleAddRecord} className="space-y-4">
              <div><label className="block text-[11px] font-semibold text-slate-400 mb-1.5">운행 일자</label><input type="date" value={editingRecord ? editingRecord.date : newDate} onChange={(e) => editingRecord ? setEditingRecord({...editingRecord, date: e.target.value}) : setNewDate(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-slate-700 text-white font-semibold text-sm focus:border-[#8B5CF6] focus:outline-none" /></div>
              <div><label className="block text-[11px] font-semibold text-slate-400 mb-1.5">탁송사 / 오더처 (예: 삼화탁송)</label><input type="text" value={editingRecord ? editCompany : newCompany} onChange={(e) => editingRecord ? setEditCompany(e.target.value) : setNewCompany(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-slate-700 text-white font-semibold text-sm focus:border-[#8B5CF6] focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1.5">출발 시각</label><input type="time" value={editingRecord ? editingRecord.startTime : newStartTime} onChange={(e) => editingRecord ? setEditingRecord({...editingRecord, startTime: e.target.value}) : setNewStartTime(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-slate-700 text-white font-semibold text-sm focus:border-[#8B5CF6] focus:outline-none" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1.5">도착 시각</label><input type="time" value={editingRecord ? editingRecord.endTime : newEndTime} onChange={(e) => editingRecord ? setEditingRecord({...editingRecord, endTime: e.target.value}) : setNewEndTime(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-slate-700 text-white font-semibold text-sm focus:border-[#8B5CF6] focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1.5">출발지</label><input type="text" value={editingRecord ? editingRecord.departure : newDeparture} onChange={(e) => editingRecord ? setEditingRecord({...editingRecord, departure: e.target.value}) : setNewDeparture(e.target.value)} required placeholder="예: 광주" className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-slate-700 text-white font-semibold text-sm focus:border-[#8B5CF6] focus:outline-none" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1.5">도착지</label><input type="text" value={editingRecord ? editingRecord.destination : newDestination} onChange={(e) => editingRecord ? setEditingRecord({...editingRecord, destination: e.target.value}) : setNewDestination(e.target.value)} required placeholder="예: 부산" className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-slate-700 text-white font-semibold text-sm focus:border-[#8B5CF6] focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1.5">탁송료(원)</label><input type="text" inputMode="numeric" value={editingRecord ? editGross : newGross} onChange={(e) => editingRecord ? setEditGross(formatNumberWithComma(e.target.value)) : setNewGross(formatNumberWithComma(e.target.value))} required placeholder="85,000" className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-extrabold text-sm focus:ring-2 focus:ring-[#8B5CF6] focus:outline-none" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1.5">수수료(%)</label><input type="number" value={editingRecord ? editingRecord.feeRate : newFeeRate} onChange={(e) => editingRecord ? setEditingRecord({...editingRecord, feeRate: Number(e.target.value)}) : setNewFeeRate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-slate-700 text-white font-semibold text-sm focus:border-[#8B5CF6] focus:outline-none" /></div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#111827] to-[#0E1424] border border-[#38BDF8]/20 space-y-3.5">
                <div><label className="text-[11px] font-bold text-[#38BDF8] flex items-center gap-1.5 mb-1.5"><Fuel className="w-3.5 h-3.5" />대납 주유비 (회수용)</label><input type="text" inputMode="numeric" value={editingRecord ? editFuel : newFuel} onChange={(e) => editingRecord ? setEditFuel(formatNumberWithComma(e.target.value)) : setNewFuel(formatNumberWithComma(e.target.value))} placeholder="0" className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-extrabold text-sm focus:ring-2 focus:ring-[#38BDF8] focus:outline-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5"><Receipt className="w-3.5 h-3.5" />통행료</label><input type="text" inputMode="numeric" value={editingRecord ? editToll : newToll} onChange={(e) => editingRecord ? setEditToll(formatNumberWithComma(e.target.value)) : setNewToll(formatNumberWithComma(e.target.value))} placeholder="0" className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none" /></div>
                  <div><label className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5"><Receipt className="w-3.5 h-3.5" />기타경비</label><input type="text" inputMode="numeric" value={editingRecord ? editOther : newOther} onChange={(e) => editingRecord ? setEditOther(formatNumberWithComma(e.target.value)) : setNewOther(formatNumberWithComma(e.target.value))} placeholder="0" className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none" /></div>
                </div>
                <div className="pt-2">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"><Camera className="w-4 h-4 text-[#38BDF8]" />{receiptImage ? '영수증 첨부 완료' : '영수증 사진 선택'}</button>
                </div>
                {receiptImage && (
                  <div className="p-1 bg-slate-950 rounded-lg flex items-center justify-between"><div className="flex items-center gap-2"><img src={receiptImage} alt="영수증" className="w-10 h-10 object-cover rounded" /><span className="text-[11px] text-emerald-400 font-bold">첨부됨</span></div><button type="button" onClick={() => setReceiptImage('')} className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-800 rounded-md"><X className="w-3.5 h-3.5" /></button></div>
                )}
              </div>
              <div><label className="block text-[11px] font-semibold text-emerald-400 mb-1.5 flex items-center gap-1"><Coins className="w-3.5 h-3.5" />손님 팁 / 대기료 (순익 가산용)</label><input type="text" inputMode="numeric" value={editingRecord ? editTip : newTip} onChange={(e) => editingRecord ? setEditTip(formatNumberWithComma(e.target.value)) : setNewTip(formatNumberWithComma(e.target.value))} placeholder="청구문자 제외, 내 순익 합산" className="w-full px-3.5 py-2.5 rounded-lg bg-[#111827] border border-emerald-500/30 text-emerald-300 font-bold text-sm focus:border-emerald-500 focus:outline-none" /></div>
              <div className="pt-4 flex gap-2">
                {editingRecord && <button type="button" onClick={() => setEditingRecord(null)} className="flex-1 py-3 rounded-xl bg-[#111827] border border-slate-700 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer">취소</button>}
                <button type="submit" className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-bold text-sm shadow-lg shadow-[#8B5CF6]/30 cursor-pointer">{editingRecord ? '수정 완료' : '운행 저장하기'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔹 팝업: 청구문자 편집 모달 */}
      {claimModalOpen && selectedClaimRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setClaimModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer bg-[#111827] rounded-full"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-2.5 mb-2"><MessageSquare className="w-5 h-5 text-[#8B5CF6]" /><h3 className="text-sm font-bold text-white">정산 청구 편집</h3></div>
            <p className="text-[11px] text-slate-400 mb-4">항목을 터치하여 청구서 포함 여부를 끄고 켤 수 있습니다.</p>
            
            <div className="grid grid-cols-4 gap-2 mb-5 p-2 rounded-xl bg-[#111827]">
              <button type="button" onClick={() => handleToggleInclude('gross')} className={`py-2.5 rounded-lg flex flex-col items-center justify-center border transition-all cursor-pointer ${includeGross ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40' : 'bg-transparent text-slate-500 border-transparent'}`}>
                <span className="text-[9px] font-bold mb-1">기본운임</span><span className="text-xs font-extrabold">{selectedClaimRecord.grossAmount.toLocaleString()}</span>
              </button>
              <button type="button" disabled={selectedClaimRecord.fuelAmount <= 0} onClick={() => handleToggleInclude('fuel')} className={`py-2.5 rounded-lg flex flex-col items-center justify-center border transition-all cursor-pointer ${selectedClaimRecord.fuelAmount <= 0 ? 'opacity-30' : includeFuel ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40' : 'bg-transparent text-slate-500 border-transparent'}`}>
                <span className="text-[9px] font-bold mb-1">주유비</span><span className="text-xs font-extrabold">{selectedClaimRecord.fuelAmount.toLocaleString()}</span>
              </button>
              <button type="button" disabled={selectedClaimRecord.tollAmount <= 0} onClick={() => handleToggleInclude('toll')} className={`py-2.5 rounded-lg flex flex-col items-center justify-center border transition-all cursor-pointer ${selectedClaimRecord.tollAmount <= 0 ? 'opacity-30' : includeToll ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40' : 'bg-transparent text-slate-500 border-transparent'}`}>
                <span className="text-[9px] font-bold mb-1">통행료</span><span className="text-xs font-extrabold">{selectedClaimRecord.tollAmount.toLocaleString()}</span>
              </button>
              <button type="button" disabled={selectedClaimRecord.otherAmount <= 0} onClick={() => handleToggleInclude('other')} className={`py-2.5 rounded-lg flex flex-col items-center justify-center border transition-all cursor-pointer ${selectedClaimRecord.otherAmount <= 0 ? 'opacity-30' : includeOther ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40' : 'bg-transparent text-slate-500 border-transparent'}`}>
                <span className="text-[9px] font-bold mb-1">기타경비</span><span className="text-xs font-extrabold">{selectedClaimRecord.otherAmount.toLocaleString()}</span>
              </button>
            </div>
            <textarea rows={9} value={claimMessageText} onChange={(e) => setClaimMessageText(e.target.value)} className="w-full p-4 rounded-xl bg-white text-slate-900 font-medium text-xs border border-slate-200 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 leading-relaxed font-mono" />
            <div className="pt-5 flex gap-3">
              <button type="button" onClick={() => setClaimModalOpen(false)} className="flex-1 py-3 rounded-xl bg-[#111827] border border-slate-700 text-white font-bold text-xs cursor-pointer hover:bg-slate-800">닫기</button>
              <button type="button" onClick={() => { navigator.clipboard.writeText(claimMessageText); alert('청구 문구가 복사되었습니다.'); setClaimModalOpen(false); }} className="flex-[2] py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-[#8B5CF6]/30 cursor-pointer"><Copy className="w-4 h-4" /> 문구 복사</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 팝업: 영수증 원본 */}
      {previewImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="relative max-w-xl w-full bg-[#0E1424] border border-slate-800 rounded-2xl p-4">
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 rounded-full bg-[#111827] text-white hover:bg-rose-500 cursor-pointer transition-colors"><X className="w-5 h-5" /></button>
            <div className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-[#8B5CF6]" /> 영수증 원본 확인</div>
            <div className="flex items-center justify-center max-h-[75vh] overflow-hidden rounded-xl border border-slate-800 bg-[#0B1120]"><img src={previewImage} alt="영수증 원본" className="max-w-full max-h-full object-contain" /></div>
          </div>
        </div>
      )}

      {/* 🔹 팝업: 비밀번호 변경 */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer bg-[#111827] rounded-full"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-bold text-white mb-4">비밀번호 변경</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호 입력 (6자리 이상)" required className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm" />
              {pwdMessage && <div className={`p-3 text-xs font-bold rounded-xl ${pwdMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>{pwdMessage.text}</div>}
              <button type="submit" disabled={pwdLoading} className="w-full py-3 bg-[#8B5CF6] text-white font-bold text-sm rounded-xl cursor-pointer shadow-lg">{pwdLoading ? '변경 중...' : '변경 완료'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
