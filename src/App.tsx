import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Wallet, Calendar, Clock, MapPin, TrendingUp, DollarSign, FileText, User, LogOut,
  KeyRound, X, CheckCircle2, AlertCircle, PlusCircle, CreditCard, Receipt, Trash2,
  Copy, Car, Filter, RotateCcw, CalendarDays, ShieldCheck, ChevronRight, Smartphone,
  Fuel, AlertTriangle, MessageSquare, Check, Edit2, Coins, Sparkles, Phone,
  RefreshCw, UserX, BotOff, ShieldAlert, BarChart3, Megaphone, Users, Download,
  Award, Crown, BookmarkPlus, Radio, Send, Building2, Info
} from 'lucide-react';

// Supabase 클라이언트 초기화
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_DEFAULT_EMAIL = 'beat4989@naver.com';
const ADMIN_DEFAULT_NAME = '홍길동'; 
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
  if (num.length === 11) return num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  else if (num.length === 10) return num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
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
interface ExpenseRecord { id: string; date: string; category: string; amount: number; memo: string; }
interface BankAccount { id: string; bankName: string; accountNumber: string; holder: string; }
interface MemberProfile { id: string; email: string; name: string; phone: string; role: string; createdAt: string; recordCount?: number; }
interface NoticeItem { id: string; title: string; content: string; isActive: boolean; updatedAt?: string; }

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');

  // 인증 상태
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false); 
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(''); const [authSuccess, setAuthSuccess] = useState('');
  const [honeypot, setHoneypot] = useState(''); const [captchaVerified, setCaptchaVerified] = useState(false);

  // 탭 및 필터
  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'wallet' | 'analytics' | 'admin'>('records');
  const [adminSubTab, setAdminSubTab] = useState<'campaign' | 'members' | 'analytics'>('campaign');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-10');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  // 모달 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editGross, setEditGross] = useState(''); const [editFuel, setEditFuel] = useState('');
  const [editExtra, setEditExtra] = useState(''); const [editTip, setEditTip] = useState('');

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
    try { const saved = localStorage.getItem('jundriver_local_accounts_merged'); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); }
    return [{ id: '1', bankName: '신한은행', accountNumber: '110-123-456789', holder: '공민준' }];
  });

  // 공지사항 상태
  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [inputNoticeTitle, setInputNoticeTitle] = useState('');
  const [inputNoticeContent, setInputNoticeContent] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeLoading, setNoticeLoading] = useState(false);

  // 관리자 상태
  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // 폼 입력 상태
  const [newDate, setNewDate] = useState('2026-11-10'); const [newStartTime, setNewStartTime] = useState(''); const [newEndTime, setNewEndTime] = useState('');
  const [newDeparture, setNewDeparture] = useState(''); const [newDestination, setNewDestination] = useState('');
  const [newGross, setNewGross] = useState(''); const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFuel, setNewFuel] = useState(''); const [newExtraExpense, setNewExtraExpense] = useState(''); const [newTip, setNewTip] = useState('');
  
  const [expCategory, setExpCategory] = useState('대중교통'); const [expAmount, setExpAmount] = useState(''); const [expMemo, setExpMemo] = useState('');
  const [bankName, setBankName] = useState(''); const [accountNumber, setAccountNumber] = useState(''); const [holder, setHolder] = useState('');

  useEffect(() => { localStorage.setItem('jundriver_local_accounts_merged', JSON.stringify(accounts)); }, [accounts]);

  const fetchNotices = async () => {
    const { data, error } = await supabase.from('announcements').select('*').order('updated_at', { ascending: false });
    if (data && !error) {
      const formatted: NoticeItem[] = data.map((d: any) => ({
        id: d.id, title: d.title, content: d.content, isActive: Boolean(d.is_active),
        updatedAt: d.updated_at ? d.updated_at.substring(0, 16).replace('T', ' ') : '',
      }));
      setNoticeList(formatted);
      setActiveNotice(formatted.find((n) => n.isActive) || null);
    }
  };

  const fetchUserData = async (userId: string, userEmail: string) => {
    let role = 'user';
    if (userEmail.toLowerCase() === ADMIN_DEFAULT_EMAIL.toLowerCase()) {
      role = 'super_admin';
      await supabase.from('profiles').upsert({ id: userId, email: userEmail, name: ADMIN_DEFAULT_NAME, phone: ADMIN_DEFAULT_PHONE, role: 'super_admin' });
    } else {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      role = profile?.role || 'user';
    }
    setCurrentUserRole(role);

    const { data: recordsData } = await supabase.from('driving_records').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (recordsData) {
      setRecords(recordsData.map((r: any) => ({
        id: r.id, date: r.date, startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
        grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount), extraExpenseAmount: Number(r.extra_expense_amount),
        tipAmount: Number(r.tip_amount), isPaid: Boolean(r.is_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
      })));
    }

    const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (expensesData) setExpenses(expensesData.map((e: any) => ({ id: e.id, date: e.date, category: e.category, amount: Number(e.amount), memo: e.memo || '' })));
    
    if (role === 'super_admin' || role === 'manager') fetchAdminData();
  };

  const fetchAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: allRecs } = await supabase.from('driving_records').select('*');
    if (profiles && allRecs) {
      setAdminMemberList(profiles.map((p: any) => ({
        id: p.id, email: p.email, name: p.name, phone: p.phone, role: p.role || 'user',
        createdAt: p.created_at ? p.created_at.substring(0, 10) : '-', recordCount: allRecs.filter((r: any) => r.user_id === p.id).length,
      })));
      setAdminAllRecords(allRecs.map((r: any) => ({
        id: r.id, userId: r.user_id, date: r.date, startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
        grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount), extraExpenseAmount: Number(r.extra_expense_amount),
        tipAmount: Number(r.tip_amount), isPaid: Boolean(r.is_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
      })));
    }
  };

  useEffect(() => {
    fetchNotices();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '');
      else { setRecords([]); setExpenses([]); setCurrentUserRole('user'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError(''); setAuthSuccess('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password.trim() });
    if (error) setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.');
    setAuthLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError(''); setAuthSuccess('');
    if (honeypot.trim() !== '') { setAuthLoading(false); return; }
    if (!captchaVerified) { setAuthError('보안 확인(인간 인증 체크)을 완료해 주세요.'); setAuthLoading(false); return; }
    const trimmedName = name.trim(); const cleanPhone = phone.replace(/[^0-9]/g, ''); const cleanEmail = email.trim().toLowerCase();
    
    if (password.length < 6) { setAuthError('비밀번호는 최소 6자리 이상이어야 합니다.'); setAuthLoading(false); return; }
    if (password !== passwordConfirm) { setAuthError('비밀번호가 일치하지 않습니다.'); setAuthLoading(false); return; }
    if (!agreePrivacy) { setAuthError('개인정보 수집 및 이용에 동의해 주세요.'); setAuthLoading(false); return; }
    if (!trimmedName || cleanPhone.length < 10) { setAuthError('이름과 휴대폰 번호를 정확히 입력해 주세요.'); setAuthLoading(false); return; }

    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: password.trim(), options: { data: { name: trimmedName, phone: cleanPhone, privacy_policy_agreed: true } } });
    if (error) { setAuthError('가입 실패: ' + error.message); }
    else {
      if (data.user) await supabase.from('profiles').insert([{ id: data.user.id, email: cleanEmail, name: trimmedName, phone: cleanPhone, role: cleanEmail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : 'user' }]);
      setAuthSuccess('회원가입이 완료되었습니다. 로그인해 주세요.'); setAuthMode('login');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setShowProfileModal(false); setActiveTab('records'); };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdLoading(true); setPwdMessage(null);
    if (newPassword.length < 6) { setPwdMessage({ type: 'error', text: '비밀번호는 최소 6자리 이상이어야 합니다.' }); setPwdLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPwdMessage({ type: 'error', text: error.message });
    else { setPwdMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' }); setNewPassword(''); }
    setPwdLoading(false);
  };

  const handleSaveNoticeTemplate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!inputNoticeTitle.trim() || !inputNoticeContent.trim()) return;
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
    await supabase.from('announcements').delete().eq('id', id); fetchNotices();
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!session) return;
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

  const handleOpenEditModal = (r: DrivingRecord) => {
    setEditingRecord(r); setEditGross(formatNumberWithComma(r.grossAmount)); setEditFuel(formatNumberWithComma(r.fuelAmount));
    setEditExtra(formatNumberWithComma(r.extraExpenseAmount)); setEditTip(formatNumberWithComma(r.tipAmount));
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingRecord || !session) return;
    const gross = cleanNumber(editGross); const feeRate = cleanNumber(editingRecord.feeRate);
    const fuel = cleanNumber(editFuel); const extraExp = cleanNumber(editExtra); const tip = cleanNumber(editTip);
    const net = gross - (gross * (feeRate / 100)) + tip;
    const claimTotal = gross + fuel + extraExp;

    const { error } = await supabase.from('driving_records').update({
      gross_amount: gross, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal)
    }).eq('id', editingRecord.id);

    if (!error) {
      setRecords(records.map((r) => r.id === editingRecord.id ? { ...r, grossAmount: gross, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) } : r));
      setEditingRecord(null);
    } else { alert('수정 실패: ' + error.message); }
  };

  const handleDeleteRecord = async (id: string) => {
    const { error } = await supabase.from('driving_records').delete().eq('id', id);
    if (!error) setRecords(records.filter((r) => r.id !== id));
  };

  const togglePaidStatus = async (id: string) => {
    const target = records.find((r) => r.id === id); if (!target) return;
    const { error } = await supabase.from('driving_records').update({ is_paid: !target.isPaid }).eq('id', id);
    if (!error) setRecords(records.map((r) => (r.id === id ? { ...r, isPaid: !target.isPaid } : r)));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault(); const cleanAmt = cleanNumber(expAmount); if (!cleanAmt || !session) return;
    const expenseId = 'exp_' + Date.now().toString();
    const { error } = await supabase.from('expenses').insert([{ id: expenseId, user_id: session.user.id, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }]);
    if (!error) { setExpenses([{ id: expenseId, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }, ...expenses]); setExpAmount(''); setExpMemo(''); }
  };
  const handleDeleteExpense = async (id: string) => { await supabase.from('expenses').delete().eq('id', id); setExpenses(expenses.filter((e) => e.id !== id)); };
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault(); if (!bankName || !accountNumber) return;
    setAccounts([...accounts, { id: Date.now().toString(), bankName, accountNumber, holder: holder || '본인' }]);
    setBankName(''); setAccountNumber(''); setHolder('');
  };
  const handleDeleteAccount = (id: string) => { setAccounts(accounts.filter(a => a.id !== id)); };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (currentUserRole !== 'super_admin') { alert('최고 관리자만 변경 가능합니다.'); return; }
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    if (!error) { alert('권한이 변경되었습니다.'); fetchAdminData(); } else { alert('변경 실패: ' + error.message); }
  };

  const handleExportAdminCSV = () => {
    if (adminAllRecords.length === 0) { alert('데이터가 없습니다.'); return; }
    const headers = ['일자', '출발지', '도착지', '운임', '수수료율', '주유비', '추가경비', '팁', '순수익', '입금여부'];
    const rows = adminAllRecords.map((r) => [r.date, `"${r.departure}"`, `"${r.destination}"`, r.grossAmount, `${r.feeRate}%`, r.fuelAmount, r.extraExpenseAmount, r.tipAmount, r.netAmount, r.isPaid ? '입금완료' : '미입금']);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', `JunDriver_전체운행.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withExtra: boolean) => {
    const primaryAccount = accounts[0] || { bankName: '은행명', accountNumber: '계좌번호', holder: '예금주' };
    const driverPhone = formatPhoneNumber(session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE);
    const driverName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;
    let total = 0; let itemsText = '';
    if (withGross) { total += r.grossAmount; itemsText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`; }
    if (withFuel && r.fuelAmount > 0) { total += r.fuelAmount; itemsText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원\n`; }
    if (withExtra && r.extraExpenseAmount > 0) { total += r.extraExpenseAmount; itemsText += `* 대납 추가경비: ${r.extraExpenseAmount.toLocaleString()}원\n`; }
    return `[탁송 정산 요청]\n* 운행일자: ${r.date}\n* 운행구간: ${r.departure} ? ${r.destination}\n${itemsText}--------------------------------\n* 총 청구금액: ${total.toLocaleString()}원\n* 입금계좌: ${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.holder})${driverPhone ? `\n* 탁송기사: ${driverName} (${driverPhone})` : ''}\n\n확인 후 빠른 입금 부탁드립니다. 감사합니다.`;
  };

  const handleToggleInclude = (type: 'gross' | 'fuel' | 'extra') => {
    if (!selectedClaimRecord) return;
    const newGross = type === 'gross' ? !includeGross : includeGross;
    const newFuel = type === 'fuel' ? !includeFuel : includeFuel;
    const newExtra = type === 'extra' ? !includeExtra : includeExtra;
    setIncludeGross(newGross); setIncludeFuel(newFuel); setIncludeExtra(newExtra);
    setClaimMessageText(buildClaimText(selectedClaimRecord, newGross, newFuel, newExtra));
  };

  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r); setIncludeGross(true); setIncludeFuel(r.fuelAmount > 0); setIncludeExtra(r.extraExpenseAmount > 0);
    setClaimMessageText(buildClaimText(r, true, r.fuelAmount > 0, r.extraExpenseAmount > 0)); setClaimModalOpen(true);
  };

  const filteredRecords = filterAllDates ? records : records.filter((r) => r.date === selectedDate);
  const unpaidRecords = records.filter((r) => !r.isPaid);
  const totalUnpaidAmount = unpaidRecords.reduce((acc, cur) => acc + cur.totalClaimAmount, 0);
  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';

  // 통계용
  const currentMonthPrefix = selectedDate.substring(0, 7);
  const monthlyRecords = records.filter((r) => r.date.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  const getElapsedDays = (recordDate: string) => {
    const today = new Date(selectedDate);
    const target = new Date(recordDate);
    const diffTime = today.getTime() - target.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Humanpick Design System Inject
  const injectStyles = () => (
    <style dangerouslySetInnerHTML={{__html: `
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
      * { font-family: 'Pretendard', sans-serif !important; }
      body { background-color: #0B1120; color: white; }
      /* White Form Styling for all inputs */
      input, select, textarea {
        background-color: #FFFFFF !important;
        color: #000000 !important;
        font-weight: 600 !important;
        border: 1px solid transparent !important;
        transition: all 0.3s ease !important;
      }
      input:focus, select:focus, textarea:focus {
        box-shadow: 0 0 12px #8B5CF6 !important;
        border-color: #8B5CF6 !important;
        outline: none !important;
      }
      .hp-primary-btn {
        background: linear-gradient(135deg, #8B5CF6, #4F46E5) !important;
        color: white !important;
        transition: transform 0.3s ease, box-shadow 0.3s ease !important;
        border: none !important;
      }
      .hp-primary-btn:hover {
        transform: translateY(-3px) !important;
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5) !important;
      }
      .glass-card {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      /* 툴팁/안내문구 애니메이션 효과 */
      .fade-in-text {
        animation: fadeIn 0.5s ease-in-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
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
            <p className="text-xs text-slate-400 mt-1">탁송 주유비 & 미수금 완벽 관리 솔루션</p>
          </div>
          <div className="flex bg-[#0B1120] p-1 rounded-xl border border-white/10 mb-5">
            <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${authMode === 'login' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>로그인</button>
            <button onClick={() => { setAuthMode('signup'); setAuthError(''); setCaptchaVerified(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${authMode === 'signup' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>회원가입</button>
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 (name@driver.com)" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full px-3.5 py-2.5 rounded-lg" />
              {authError && <div className="p-3 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-lg text-[#EC4899] text-xs">{authError}</div>}
              {authSuccess && <div className="p-3 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-lg text-[#38BDF8] text-xs">{authSuccess}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg cursor-pointer mt-2">{authLoading ? '로딩 중...' : '클라우드 로그인'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <input type="text" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (홍길동)" required className="w-full px-3.5 py-2.5 rounded-lg" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="휴대폰번호" maxLength={11} required className="w-full px-3.5 py-2.5 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호(6자리 이상)" required className="w-full px-3.5 py-2.5 rounded-lg" />
                <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="비밀번호 재입력" required className="w-full px-3.5 py-2.5 rounded-lg" />
              </div>
              <div onClick={() => setCaptchaVerified(!captchaVerified)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${captchaVerified ? 'bg-[#38BDF8]/20 border-[#38BDF8]/50 text-[#38BDF8]' : 'bg-[#0B1120] border-white/10'}`}>
                <div className="flex items-center gap-2.5"><div className={`w-5 h-5 rounded-md border flex items-center justify-center ${captchaVerified ? 'bg-[#38BDF8] border-[#38BDF8] text-white' : 'border-slate-600 bg-slate-800'}`}>{captchaVerified && <Check className="w-3.5 h-3.5" />}</div><span className="text-xs font-semibold">로봇이 아닙니다 (터치)</span></div><BotOff className="w-4 h-4 text-slate-500" />
              </div>
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-[#0B1120] border border-white/10 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input type="checkbox" id="agreeChk" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6] cursor-pointer" />
                    <label htmlFor="agreeChk" className="text-xs text-slate-200 font-medium cursor-pointer">[필수] 개인정보 수집 및 운행일지 저장에 동의합니다.</label>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pl-6">
                    <span className="text-[#38BDF8]">계좌는 기기 로컬에만 보관됩니다.</span>
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[#8B5CF6] underline font-semibold cursor-pointer">전문보기</button>
                  </div>
                </div>
              </div>
              {authError && <div className="p-2.5 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-lg text-[#EC4899] text-xs">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg cursor-pointer mt-2">{authLoading ? '처리 중...' : '동의하고 회원가입'}</button>
            </form>
          )}
        </div>

        {/* 약관 모달 */}
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl relative z-20">
              <button onClick={() => setShowPrivacyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
              <h3 className="text-sm font-bold text-white mb-3">개인정보 수집 및 이용 방침</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">JunDriver는 탁송 운행 기록 및 주유비 청구 내역을 클라우드에 안전하게 보관합니다. 송금용 계좌 정보 등은 외부로 전송되지 않고 본인의 스마트폰/PC 로컬 브라우저에만 독립 보관됩니다.</p>
              <button type="button" onClick={() => { setAgreePrivacy(true); setShowPrivacyModal(false); }} className="w-full py-2.5 hp-primary-btn font-bold text-xs rounded-xl cursor-pointer">확인 및 동의</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const userName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 pb-20">
      {injectStyles()}
      <header className="sticky top-0 z-30 glass-card border-b-0 border-white/5 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-lg flex items-center justify-center shadow-[0_0_10px_#8B5CF6]"><Car className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-base text-white">JunDriver</span><span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#8B5CF6]/20 text-[#8B5CF6] rounded border border-[#8B5CF6]/30">PRO</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdminUser && (
              <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'admin' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20'}`}><Crown className="w-3.5 h-3.5" /><span>관제탑</span></button>
            )}
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs text-slate-200 cursor-pointer">
              <User className="w-3.5 h-3.5 text-[#8B5CF6]" /><div className="text-left hidden sm:block"><span className="block font-bold text-white leading-tight">{userName}님</span></div>
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded-lg glass-card text-slate-400 hover:text-[#EC4899] cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-6 space-y-6 h-full">
        {/* 공지 배너 */}
        {activeNotice && activeTab !== 'admin' && (
          <section className="bg-gradient-to-r from-[#0B1120] via-[#8B5CF6]/20 to-[#0B1120] border border-[#8B5CF6]/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3"><Megaphone className="w-5 h-5 text-[#8B5CF6] animate-pulse shrink-0" /><div><div className="text-xs font-extrabold text-[#8B5CF6]">{activeNotice.title}</div><div className="text-xs text-slate-200 mt-0.5">{activeNotice.content}</div></div></div>
          </section>
        )}

        {/* 미입금 경고 바 */}
        {totalUnpaidAmount > 0 && activeTab !== 'admin' && (
          <section className="bg-[#EC4899]/10 border border-[#EC4899]/40 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(236,72,153,0.1)] fade-in-text">
            <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-[#EC4899]" /><div><span className="text-xs font-bold text-[#EC4899]">미입금 내역 ({unpaidRecords.length}건) 회수 필요</span><div className="text-xl font-extrabold text-white">총 {totalUnpaidAmount.toLocaleString()}원</div></div></div>
            <button onClick={() => setActiveTab('claims')} className="px-4 py-2 hp-primary-btn rounded-xl text-xs font-bold cursor-pointer">청구 관리</button>
          </section>
        )}

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('records')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${activeTab === 'records' ? 'hp-primary-btn' : 'glass-card text-slate-400 hover:text-white'}`}>운행 일지</button>
          <button onClick={() => setActiveTab('claims')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer relative shrink-0 transition-all ${activeTab === 'claims' ? 'hp-primary-btn' : 'glass-card text-slate-400 hover:text-white'}`}>청구문자 {unpaidRecords.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#EC4899] text-white text-[10px] font-extrabold shadow-[0_0_5px_#EC4899]">{unpaidRecords.length}</span>}</button>
          <button onClick={() => setActiveTab('expense')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${activeTab === 'expense' ? 'hp-primary-btn' : 'glass-card text-slate-400 hover:text-white'}`}>경비 장부</button>
          <button onClick={() => setActiveTab('wallet')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${activeTab === 'wallet' ? 'hp-primary-btn' : 'glass-card text-slate-400 hover:text-white'}`}>계좌 관리</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-all ${activeTab === 'analytics' ? 'hp-primary-btn' : 'glass-card text-slate-400 hover:text-white'}`}>통계 요약</button>
        </div>

        {/* 1. 운행 일지 탭 */}
        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#8B5CF6]" />새 운행 배차 등록</h3>
              <p className="text-[11px] text-[#38BDF8] font-medium mb-4 ml-6">탁송 운임과 대납 비용을 기록하여 순수익을 계산합니다.</p>
              <form onSubmit={handleAddRecord} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" placeholder="경기 광주" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" placeholder="인천 송도" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label><input type="text" placeholder="85,000" value={newGross} onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg text-right" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label><input type="number" placeholder="20" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-right" /></div>
                </div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">기사 팁/추가운임 (선택)</label><input type="text" placeholder="5,000" value={newTip} onChange={(e) => setNewTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
                
                {/* 대납 주유비 & 대납 경비 */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-[#8B5CF6]/30 space-y-2.5">
                  <label className="text-xs font-bold text-[#8B5CF6] flex items-center gap-1.5"><Fuel className="w-4 h-4 text-[#8B5CF6]" />대납 주유/충전비 (100% 회수)</label>
                  <input type="text" placeholder="선결제한 주유 금액" value={newFuel} onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" />
                </div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">통행료 등 기타 대납경비 (선택)</label><input type="text" placeholder="0" value={newExtraExpense} onChange={(e) => setNewExtraExpense(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>

                <button type="submit" className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">운행 일지 등록 (미입금 상태로 저장)</button>
              </form>
            </div>
            
            <div className="lg:col-span-2 glass-card rounded-xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-[#8B5CF6]" />운행 일지 및 정산 현황 ({filteredRecords.length}건)</h3>
                  <p className="text-[11px] text-[#38BDF8] font-medium mt-1 ml-6">등록된 운행 건들의 상태를 확인하고 관리할 수 있습니다.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-[#0B1120] px-3 py-1.5 rounded-lg border border-white/10">
                    <input type="checkbox" id="allDates" checked={filterAllDates} onChange={(e) => setFilterAllDates(e.target.checked)} className="w-3.5 h-3.5 rounded text-[#8B5CF6] cursor-pointer" />
                    <label htmlFor="allDates" className="text-xs text-slate-300 font-semibold cursor-pointer">전체 누적 보기</label>
                  </div>
                  {!filterAllDates && <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white text-black font-bold text-xs px-2 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-[#8B5CF6]" />}
                </div>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">해당 조건에 등록된 운행이 없습니다.</div>
                ) : (
                  filteredRecords.map((r) => {
                    const elapsed = getElapsedDays(r.date);
                    return (
                      <div key={r.id} className={`glass-card p-4 rounded-xl transition-all ${!r.isPaid ? 'border-[#EC4899]/30 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'border-white/10'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] shrink-0"><MapPin className="w-4 h-4" /></div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2"><span>{r.departure}</span><span className="text-[#8B5CF6]">?</span><span>{r.destination}</span></div>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.date}</span></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => togglePaidStatus(r.id)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-all ${r.isPaid ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40' : 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/40 animate-pulse'}`}>{r.isPaid ? <><CheckCircle2 className="w-3.5 h-3.5" /> 입금완료</> : <><AlertCircle className="w-3.5 h-3.5" /> 미입금 ({elapsed === 0 ? 'D-Day' : `${elapsed}일 경과`})</>}</button>
                          </div>
                        </div>
                        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-3 text-slate-400">
                            <span>탁송료: <strong className="text-white">{r.grossAmount.toLocaleString()}원</strong></span>
                            {r.fuelAmount > 0 && <span className="text-[#8B5CF6] font-semibold flex items-center gap-1"><Fuel className="w-3 h-3" /> 주유비: {r.fuelAmount.toLocaleString()}원</span>}
                            {r.extraExpenseAmount > 0 && <span className="text-[#38BDF8] font-semibold">경비: {r.extraExpenseAmount.toLocaleString()}원</span>}
                            <span className="text-[#38BDF8] font-semibold">순수입: +{r.netAmount.toLocaleString()}원</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right pr-2">
                              <span className="text-[10px] text-slate-400 block">총 청구액</span>
                              <span className="text-sm font-extrabold text-white">{r.totalClaimAmount.toLocaleString()}원</span>
                            </div>
                            <button onClick={() => handleOpenEditModal(r)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteRecord(r.id)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-[#EC4899] transition-all cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. 청구문자 탭 */}
        {activeTab === 'claims' && (
          <div className="glass-card rounded-xl p-6 shadow-lg fade-in-text">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#8B5CF6]" />미입금 청구 대상 ({unpaidRecords.length}건)</h3>
                <p className="text-[11px] text-[#38BDF8] font-medium mt-1 ml-6">미입금된 운행 건에 대해 정산 요청 문자를 자동으로 생성합니다.</p>
              </div>
              <span className="text-xs font-bold text-[#EC4899] bg-[#EC4899]/10 px-3 py-1.5 rounded-lg border border-[#EC4899]/30">총 미수금 {totalUnpaidAmount.toLocaleString()}원</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpaidRecords.length === 0 ? (
                <div className="col-span-full text-center py-10 text-slate-500 text-xs">현재 미입금 내역이 없습니다.</div>
              ) : (
                unpaidRecords.map((r) => (
                  <div key={r.id} className="bg-[#0B1120] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-[#8B5CF6]/50 transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-2"><span className="px-2 py-0.5 bg-[#EC4899]/20 text-[#EC4899] text-[10px] font-bold rounded">청구 대기</span><span className="text-[10px] text-slate-400 font-mono">{r.date}</span></div>
                      <div className="font-bold text-white text-sm mb-1">{r.departure} ? {r.destination}</div>
                      <div className="text-xs text-slate-400 mt-3 space-y-1">
                        <div className="flex justify-between"><span>탁송운임</span><span className="text-white">{r.grossAmount.toLocaleString()}원</span></div>
                        {r.fuelAmount > 0 && <div className="flex justify-between"><span>대납 주유비</span><span className="text-white">{r.fuelAmount.toLocaleString()}원</span></div>}
                        {r.extraExpenseAmount > 0 && <div className="flex justify-between"><span>대납 추가경비</span><span className="text-white">{r.extraExpenseAmount.toLocaleString()}원</span></div>}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-sm font-bold text-[#8B5CF6]">합계 {r.totalClaimAmount.toLocaleString()}원</span>
                      <button onClick={() => openClaimMessageModal(r)} className="px-3 py-1.5 hp-primary-btn text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />문자 생성</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. 경비 장부 탭 */}
        {activeTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#EC4899]" />일반 경비 지출 등록</h3>
              <p className="text-[11px] text-[#38BDF8] font-medium mb-4 ml-6">교통비, 식대 등의 지출을 기록하여 실 수익을 정확히 파악하세요.</p>
              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 분류</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg">
                    <option value="대중교통">대중교통 (버스/지하철/택시)</option><option value="식대">식대/간식</option><option value="차량공유">차량공유 (쏘카/그린카)</option><option value="기타">기타 경비</option>
                  </select>
                </div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 금액(원)</label><input type="text" placeholder="금액 입력" value={expAmount} onChange={(e) => setExpAmount(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg text-right" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">상세 메모 (선택)</label><input type="text" placeholder="예: 경기K패스, 광역버스" value={expMemo} onChange={(e) => setExpMemo(e.target.value)} className="w-full px-3 py-2 rounded-lg" /></div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#EC4899] to-rose-600 hover:shadow-[0_6px_20px_rgba(236,72,153,0.5)] text-white font-bold rounded-lg text-xs cursor-pointer transition-all mt-2 border-0">경비 등록하기</button>
              </form>
            </div>
            <div className="lg:col-span-2 glass-card rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4">지출 내역 목록 ({expenses.length}건)</h3>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {expenses.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">등록된 경비 지출이 없습니다.</div>
                ) : (
                  expenses.map((e) => (
                    <div key={e.id} className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex items-center justify-between hover:border-white/20 transition-all">
                      <div><div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-white/10 text-slate-300 rounded text-[10px] font-semibold">{e.category}</span><span className="text-sm text-white font-medium">{e.memo || '-'}</span></div><div className="text-xs text-slate-500 mt-1.5">{e.date}</div></div>
                      <div className="flex items-center gap-3"><span className="text-[#EC4899] font-bold text-sm">-{e.amount.toLocaleString()}원</span><button onClick={() => handleDeleteExpense(e.id)} className="text-slate-600 hover:text-[#EC4899] p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. 계좌 관리 탭 */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#38BDF8]" />정산 입금용 계좌 추가</h3>
              <p className="text-[11px] text-[#38BDF8] font-medium mb-4 ml-6">정산받을 계좌를 등록해두면 청구 문자 생성 시 자동으로 첨부됩니다. (기기 로컬에만 보관)</p>
              <form onSubmit={handleAddAccount} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">은행명</label><input type="text" placeholder="예: 신한은행" value={bankName} onChange={(e) => setBankName(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">계좌번호 (- 제외)</label><input type="text" placeholder="계좌번호 입력" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required className="w-full px-3 py-2 rounded-lg font-mono" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">예금주</label><input type="text" placeholder="예금주 성함" value={holder} onChange={(e) => setHolder(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <button type="submit" className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">새 계좌 등록</button>
              </form>
            </div>
            <div className="space-y-3">
              {accounts.map((acc, idx) => (
                <div key={acc.id} className="relative bg-gradient-to-br from-[#0B1120] to-indigo-950/30 border border-[#8B5CF6]/30 rounded-xl p-6 overflow-hidden shadow-lg group hover:border-[#8B5CF6] transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Building2 className="w-24 h-24" /></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6"><span className="px-2 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-bold rounded uppercase">{idx === 0 ? '대표 계좌 (청구용)' : '보조 계좌'}</span><button onClick={() => handleDeleteAccount(acc.id)} className="text-slate-500 hover:text-[#EC4899] p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button></div>
                    <div className="text-2xl font-bold font-mono tracking-wider text-white mb-2">{acc.accountNumber}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-300"><span className="font-bold">{acc.bankName}</span> <span className="text-slate-500">|</span> <span>예금주: {acc.holder}</span></div>
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); alert('계좌번호가 복사되었습니다.'); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-white/20"><Copy className="w-3.5 h-3.5" /> 계좌번호 복사</button></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. 통계 요약 탭 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 fade-in-text">
            <section className="bg-gradient-to-r from-[#0B1120] via-indigo-950/40 to-[#0B1120] border border-[#8B5CF6]/30 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/10 gap-2">
                <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#8B5CF6]" /><h2 className="text-xs font-bold text-slate-200 tracking-wide uppercase">{currentMonthPrefix.replace('-', '년 ')}월 총 누적 결산</h2></div>
                <span className="text-[11px] font-semibold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2.5 py-0.5 rounded-full border border-[#8B5CF6]/20">월간 집계 ({monthlyRecords.length}회 운행)</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">월별 총 매출과 실제 손에 남는 순수입 및 지출을 한눈에 파악할 수 있는 통계표입니다.</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div><div className="text-[11px] text-slate-400 mb-1">당월 순수 탁송매출</div><div className="text-xl lg:text-2xl font-extrabold text-white">{monthlyGross.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span></div></div>
                <div><div className="text-[11px] text-slate-400 mb-1">당월 탁송 순수입</div><div className="text-xl lg:text-2xl font-extrabold text-[#38BDF8]">{monthlyNet.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span></div></div>
                <div><div className="text-[11px] text-slate-400 mb-1">당월 경비 지출</div><div className="text-xl lg:text-2xl font-extrabold text-[#EC4899]">-{monthlyExpense.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span></div></div>
                <div><div className="text-[11px] text-slate-400 mb-1">당월 실수령액 (예상)</div><div className="text-xl lg:text-2xl font-extrabold text-[#38BDF8]">{monthlyProfit.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span></div></div>
              </div>
            </section>
            
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">전체 기간 누적 리포트</h3>
              <p className="text-[11px] text-[#38BDF8] font-medium mb-4">가입일로부터 전체 기간 동안의 운행 횟수와 미수금 총액 현황입니다.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0B1120] border border-white/10"><span className="text-xs text-slate-400">총 운행 횟수</span><div className="text-xl font-bold text-white mt-1">{records.length}회</div></div>
                <div className="p-4 rounded-xl bg-[#0B1120] border border-white/10"><span className="text-xs text-slate-400">정산 완료율</span><div className="text-xl font-bold text-[#38BDF8] mt-1">{records.length > 0 ? ((records.filter(r => r.isPaid).length / records.length) * 100).toFixed(1) : 0}%</div></div>
                <div className="p-4 rounded-xl bg-[#0B1120] border border-[#EC4899]/30"><span className="text-xs text-slate-400">현재 미수금 총액</span><div className="text-xl font-bold text-[#EC4899] mt-1">{totalUnpaidAmount.toLocaleString()}원</div></div>
              </div>
            </div>
          </div>
        )}

        {/* 6. 관제탑 관리자 탭 */}
        {activeTab === 'admin' && isAdminUser && (
          <div className="space-y-6 fade-in-text">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-[#38BDF8] flex items-center gap-2"><Crown className="w-5 h-5" />플랫폼 관리자 (관제탑)</h3>
              <p className="text-[11px] text-slate-400 mt-1 ml-7">플랫폼 전체의 기사 현황, 데이터 추출 및 실시간 공지사항 송출을 관리하는 공간입니다.</p>
            </div>
            
            <div className="flex gap-2 border-b border-white/10 pb-2">
              <button onClick={() => setAdminSubTab('campaign')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'campaign' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>공지/이벤트 문구보관함</button>
              <button onClick={() => setAdminSubTab('members')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'members' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>회원 권한 관리 ({adminMemberList.length}명)</button>
              <button onClick={() => setAdminSubTab('analytics')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'analytics' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>플랫폼 마케팅 통계</button>
            </div>

            {adminSubTab === 'campaign' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-xl space-y-4 h-fit">
                  <div className="flex items-center justify-between"><h4 className="font-bold text-white text-sm flex items-center gap-1.5"><BookmarkPlus className="w-4 h-4 text-[#8B5CF6]" />{editingNoticeId ? '문구 수정하기' : '새 공지 문구 저장'}</h4>{editingNoticeId && <button onClick={() => { setEditingNoticeId(null); setInputNoticeTitle(''); setInputNoticeContent(''); }} className="text-[11px] text-[#38BDF8] hover:text-white cursor-pointer">신규 작성</button>}</div>
                  <form onSubmit={handleSaveNoticeTemplate} className="space-y-3">
                    <input type="text" value={inputNoticeTitle} onChange={(e) => setInputNoticeTitle(e.target.value)} placeholder="제목 (예: 11월 프로모션 안내)" required className="w-full px-3 py-2 rounded-lg text-xs" />
                    <textarea rows={4} value={inputNoticeContent} onChange={(e) => setInputNoticeContent(e.target.value)} placeholder="앱 최상단 배너에 노출될 내용" required className="w-full px-3 py-2 rounded-lg text-xs" />
                    <button type="submit" disabled={noticeLoading} className="w-full py-2.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">{noticeLoading ? '처리 중...' : editingNoticeId ? '수정 내용 저장' : '보관함에 저장하기'}</button>
                  </form>
                  {activeNotice && <div className="pt-3 border-t border-white/10"><button onClick={handleDeactivateAllNotices} disabled={noticeLoading} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#EC4899] text-xs font-semibold rounded-lg cursor-pointer">현재 메인 배너 송출 중단</button></div>}
                </div>
                <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="font-bold text-white text-sm">공지 문구 라이브러리</h4></div><span className="text-xs font-mono text-[#8B5CF6] font-bold">{noticeList.length}개 보관 중</span></div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {noticeList.map((n) => (
                      <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.isActive ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'bg-[#0B1120] border-white/10'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2"><div className="flex items-center gap-2">{n.isActive ? <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#38BDF8] text-[#0B1120] rounded flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" />송출 중</span> : <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-slate-400 rounded">보관 중</span>}<h5 className="font-bold text-white text-xs">{n.title}</h5></div><span className="text-[10px] text-slate-500 font-mono">{n.updatedAt}</span></div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-[#0B1120] p-3 rounded-lg border border-white/5">{n.content}</p>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setInputNoticeTitle(n.title); setInputNoticeContent(n.content); setEditingNoticeId(n.id); }} className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] rounded font-semibold cursor-pointer flex items-center gap-1"><Edit2 className="w-3 h-3" />불러오기</button>
                          <button onClick={() => handleDeleteNotice(n.id)} className="p-1 text-slate-500 hover:text-[#EC4899] cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                          {!n.isActive && <button onClick={() => handleActivateNotice(n)} disabled={noticeLoading} className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-bold rounded cursor-pointer flex items-center gap-1 shadow-md border-0"><Send className="w-3 h-3" />메인 송출</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === 'members' && (
              <div className="glass-card p-6 rounded-xl space-y-4">
                <input type="text" placeholder="회원 이름 / 전화번호 / 이메일 검색..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="px-3 py-2 rounded-lg text-xs w-full max-w-xs" />
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0B1120] text-slate-400 border-b border-white/10"><tr><th className="p-3">이름</th><th className="p-3">전화번호</th><th className="p-3">이메일</th><th className="p-3">가입일</th><th className="p-3">권한</th><th className="p-3 text-right">권한 변경</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {adminMemberList.filter(m => m.name.includes(adminSearchTerm) || m.phone.includes(adminSearchTerm) || m.email.includes(adminSearchTerm)).map((m) => (
                        <tr key={m.id} className="hover:bg-white/5">
                          <td className="p-3 text-white font-bold">{m.name}</td><td className="p-3 font-mono text-[#38BDF8]">{formatPhoneNumber(m.phone)}</td><td className="p-3 text-slate-300">{m.email}</td><td className="p-3 text-slate-500 font-mono">{m.createdAt}</td>
                          <td className="p-3">
                            {m.role === 'super_admin' ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#8B5CF6]/20 text-[#8B5CF6]">최고 관리자</span> :
                             m.role === 'manager' ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#38BDF8]/20 text-[#38BDF8]">운영 직원</span> :
                             m.role === 'vip_driver' ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#EC4899]/20 text-[#EC4899]">VIP 기사</span> :
                             m.role === 'pro_driver' ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">PRO 기사</span> :
                             <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/10 text-slate-300">일반 기사</span>}
                          </td>
                          <td className="p-3 text-right">
                            <select value={m.role} onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)} className="bg-[#0B1120] border border-white/20 text-white rounded px-2 py-1.5 text-[11px] cursor-pointer outline-none focus:border-[#8B5CF6]">
                              <option value="user">일반 기사</option>
                              <option value="pro_driver">PRO 기사</option>
                              <option value="vip_driver">VIP 기사</option>
                              <option value="manager">운영 직원</option>
                              <option value="super_admin">최고 관리자</option>
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
                <div className="flex justify-end mb-2">
                  <button onClick={handleExportAdminCSV} className="px-3 py-2 bg-[#0B1120] hover:bg-white/10 border border-white/20 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />전체 기사 운행내역 CSV 다운로드</button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">플랫폼 총 가입 기사</span><div className="text-2xl font-bold text-white mt-1">{adminMemberList.length}명</div></div>
                  <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">누적 등록 운행 건수</span><div className="text-2xl font-bold text-[#8B5CF6] mt-1">{adminAllRecords.length}건</div></div>
                  <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">플랫폼 총 거래액 규모</span><div className="text-2xl font-bold text-[#38BDF8] mt-1">{adminAllRecords.reduce((acc, cur) => acc + cur.grossAmount, 0).toLocaleString()}원</div></div>
                  <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">총 대납 주유비 발생액</span><div className="text-2xl font-bold text-[#EC4899] mt-1">{adminAllRecords.reduce((acc, cur) => acc + cur.fuelAmount, 0).toLocaleString()}원</div></div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 모달: 운행 일지 수정 */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-white">운행 내역 수정</h3><button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleUpdateRecord} className="space-y-3.5">
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운임(원)</label><input type="text" value={editGross} onChange={(e) => setEditGross(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" required /></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">대납 주유비</label><input type="text" value={editFuel} onChange={(e) => setEditFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">통행료 등 추가경비</label><input type="text" value={editExtra} onChange={(e) => setEditExtra(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">기사 팁</label><input type="text" value={editTip} onChange={(e) => setEditTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
              <button type="submit" className="w-full mt-2 py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">수정 완료</button>
            </form>
          </div>
        </div>
      )}

      {/* 모달: 청구 문자 직접 편집 생성 */}
      {claimModalOpen && selectedClaimRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setClaimModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#8B5CF6]" />정산 청구 문자 편집 및 복사</h3>
            <p className="text-xs text-slate-400 mb-4">운행 내역과 저장된 계좌 정보로 자동 생성된 문구입니다. 내용을 자유롭게 수정한 후 복사하여 송신하세요.</p>
            <div className="flex gap-4 mb-4 pb-4 border-b border-white/10">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeGross} onChange={() => handleToggleInclude('gross')} className="rounded text-[#8B5CF6]" /> 기본 운임</label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeFuel} onChange={() => handleToggleInclude('fuel')} className="rounded text-[#8B5CF6]" disabled={selectedClaimRecord.fuelAmount === 0} /> 주유비</label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeExtra} onChange={() => handleToggleInclude('extra')} className="rounded text-[#8B5CF6]" disabled={selectedClaimRecord.extraExpenseAmount === 0} /> 추가경비</label>
            </div>
            <textarea rows={10} value={claimMessageText} onChange={(e) => setClaimMessageText(e.target.value)} className="w-full p-4 rounded-xl text-xs font-mono mb-4 leading-relaxed bg-[#FFFFFF] text-[#000000] focus:shadow-[0_0_12px_#8B5CF6] focus:border-[#8B5CF6] transition-all outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setClaimModalOpen(false)} className="flex-1 py-3 bg-[#0B1120] border border-white/10 hover:bg-white/10 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors">닫기</button>
              <button onClick={() => { navigator.clipboard.writeText(claimMessageText); alert('수정된 정산 청구 문자가 복사되었습니다.'); setClaimModalOpen(false); }} className="flex-1 py-3 hp-primary-btn text-white font-bold rounded-lg text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"><Copy className="w-3.5 h-3.5" />복사하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 계정 설정 및 비밀번호 변경 */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-1">계정 관리</h3>
            <p className="text-xs text-slate-400 mb-6 border-b border-white/10 pb-3">{session?.user?.email}</p>
            <form onSubmit={handlePasswordChange} className="space-y-3.5 mb-6">
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">새 비밀번호 (6자리 이상)</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="새로운 비밀번호 입력" className="w-full px-3 py-2 rounded-lg" /></div>
              {pwdMessage && <div className={`p-2.5 rounded-lg text-xs font-semibold ${pwdMessage.type === 'success' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-[#EC4899]/20 text-[#EC4899]'}`}>{pwdMessage.text}</div>}
              <button type="submit" disabled={pwdLoading} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs cursor-pointer border border-white/10">{pwdLoading ? '변경 중...' : '비밀번호 변경'}</button>
            </form>
            <button onClick={() => setShowProfileModal(false)} className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
