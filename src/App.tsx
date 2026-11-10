import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Wallet, Calendar, Clock, MapPin, TrendingUp, DollarSign, FileText, User, LogOut,
  KeyRound, X, CheckCircle2, AlertCircle, PlusCircle, CreditCard, Receipt, Trash2,
  Copy, Car, Filter, RotateCcw, CalendarDays, ShieldCheck, ChevronRight, Smartphone,
  Fuel, Camera, Image as ImageIcon, AlertTriangle, MessageSquare, Check, Edit2, Coins,
  Sparkles, Phone, RefreshCw, UserX, BotOff, ShieldAlert, BarChart3, Megaphone, Users,
  Download, Award, Crown, BookmarkPlus, Radio, Send, Building2, Calculator, FileSpreadsheet
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

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false); const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false); const [authError, setAuthError] = useState(''); const [authSuccess, setAuthSuccess] = useState('');

  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'wallet' | 'tax' | 'admin'>('records');
  const [adminSubTab, setAdminSubTab] = useState<'campaign' | 'members' | 'analytics'>('campaign');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-10');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editCompany, setEditCompany] = useState('');
  const [editGross, setEditGross] = useState(''); const [editFuel, setEditFuel] = useState('');
  const [editToll, setEditToll] = useState(''); const [editOther, setEditOther] = useState(''); const [editTip, setEditTip] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true);
  const [includeFuel, setIncludeFuel] = useState(true);
  const [includeToll, setIncludeToll] = useState(true);
  const [includeOther, setIncludeOther] = useState(true);
  const [claimMessageText, setClaimMessageText] = useState('');
  const [dataLoading, setDataLoading] = useState(false);

  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try { const saved = localStorage.getItem('jundriver_local_accounts_v2'); if (saved) return JSON.parse(saved); } catch (e) { console.error(e); }
    return [{ id: '1', bankName: '신한은행', accountNumber: '110-123-456789', holder: '홍길동' }];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [inputNoticeTitle, setInputNoticeTitle] = useState(''); const [inputNoticeContent, setInputNoticeContent] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null); const [noticeLoading, setNoticeLoading] = useState(false);
  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  const [newDate, setNewDate] = useState('2026-11-10'); const [newStartTime, setNewStartTime] = useState(''); const [newEndTime, setNewEndTime] = useState('');
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
      const formatted: NoticeItem[] = data.map((d: any) => ({ id: d.id, title: d.title, content: d.content, isActive: Boolean(d.is_active), updatedAt: d.updated_at ? d.updated_at.substring(0, 16).replace('T', ' ') : '' }));
      setNoticeList(formatted); setActiveNotice(formatted.find((n) => n.isActive) || null);
    }
  };

  const fetchUserData = async (userId: string, userEmail: string) => {
    setDataLoading(true);
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
        id: r.id, date: r.date, startTime: r.start_time || '-', endTime: r.end_time || '-', companyName: r.company_name || '일반',
        departure: r.departure, destination: r.destination, grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate),
        fuelAmount: Number(r.fuel_amount), tollAmount: Number(r.toll_amount) || 0, otherAmount: Number(r.other_amount) || Number(r.extra_expense_amount) || 0,
        tipAmount: Number(r.tip_amount), receiptImage: r.receipt_image || undefined, isPaid: Boolean(r.is_paid),
        netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
      })));
    }

    const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (expensesData) setExpenses(expensesData.map((e: any) => ({ id: e.id, date: e.date, category: e.category, amount: Number(e.amount), memo: e.memo || '' })));
    
    if (role === 'super_admin' || role === 'manager') fetchAdminData();
    setDataLoading(false);
  };

  const fetchAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: allRecs } = await supabase.from('driving_records').select('*');
    if (profiles && allRecs) {
      setAdminMemberList(profiles.map((p: any) => ({ id: p.id, email: p.email, name: p.name, phone: p.phone, role: p.role || 'user', createdAt: p.created_at ? p.created_at.substring(0, 10) : '-', recordCount: allRecs.filter((r: any) => r.user_id === p.id).length })));
      setAdminAllRecords(allRecs.map((r: any) => ({
        id: r.id, userId: r.user_id, date: r.date, startTime: r.start_time || '-', endTime: r.end_time || '-', companyName: r.company_name || '일반',
        departure: r.departure, destination: r.destination, grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount),
        tollAmount: Number(r.toll_amount) || 0, otherAmount: Number(r.other_amount) || Number(r.extra_expense_amount) || 0, tipAmount: Number(r.tip_amount),
        isPaid: Boolean(r.is_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
      })));
    }
  };

  useEffect(() => {
    fetchNotices();
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session?.user) fetchUserData(session.user.id, session.user.email || ''); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); if (session?.user) fetchUserData(session.user.id, session.user.email || ''); else { setRecords([]); setExpenses([]); setCurrentUserRole('user'); }
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
    if (!agreePrivacy) { setAuthError('개인정보 수집 및 베타 이용약관에 동의해 주세요.'); setAuthLoading(false); return; }
    const trimmedName = name.trim(); const cleanPhone = phone.replace(/[^0-9]/g, ''); const cleanEmail = email.trim().toLowerCase();
    if (!trimmedName || cleanPhone.length < 10 || password.length < 6 || password !== passwordConfirm) { setAuthError('입력 정보를 다시 확인해 주세요.'); setAuthLoading(false); return; }
    
    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: password.trim(), options: { data: { name: trimmedName, phone: cleanPhone, privacy_policy_agreed: true } } });
    if (error) { setAuthError('가입 실패: ' + error.message); } else {
      if (data.user) await supabase.from('profiles').insert([{ id: data.user.id, email: cleanEmail, name: trimmedName, phone: cleanPhone, role: cleanEmail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : 'user' }]);
      setAuthSuccess('가입 완료! 로그인해 주세요.'); setAuthMode('login');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setShowProfileModal(false); setActiveTab('records'); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdLoading(true); setPwdMessage(null);
    if (newPassword.length < 6) { setPwdMessage({ type: 'error', text: '비밀번호는 6자리 이상' }); setPwdLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPwdMessage({ type: 'error', text: error.message }); else { setPwdMessage({ type: 'success', text: '성공적으로 변경되었습니다.' }); setNewPassword(''); }
    setPwdLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptImage(URL.createObjectURL(file));
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!session) return;
    const gross = cleanNumber(newGross); const feeRate = cleanNumber(newFeeRate); const fuel = cleanNumber(newFuel);
    const toll = cleanNumber(newToll); const other = cleanNumber(newOther); const tip = cleanNumber(newTip);
    const net = gross - (gross * (feeRate / 100)) + tip;
    const claimTotal = gross + fuel + toll + other;
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
      setNewCompany(''); setNewDeparture(''); setNewDestination(''); setNewGross(''); setNewFuel(''); setNewToll(''); setNewOther(''); setNewTip(''); setReceiptImage('');
    }
  };

  const handleOpenEditModal = (r: DrivingRecord) => {
    setEditingRecord(r); setEditCompany(r.companyName); setEditGross(formatNumberWithComma(r.grossAmount)); 
    setEditFuel(formatNumberWithComma(r.fuelAmount)); setEditToll(formatNumberWithComma(r.tollAmount));
    setEditOther(formatNumberWithComma(r.otherAmount)); setEditTip(formatNumberWithComma(r.tipAmount));
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingRecord || !session) return;
    const gross = cleanNumber(editGross); const feeRate = cleanNumber(editingRecord.feeRate);
    const fuel = cleanNumber(editFuel); const toll = cleanNumber(editToll); const other = cleanNumber(editOther); const tip = cleanNumber(editTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + toll + other;

    const { error } = await supabase.from('driving_records').update({
      date: editingRecord.date, start_time: editingRecord.startTime, end_time: editingRecord.endTime, company_name: editCompany, departure: editingRecord.departure, destination: editingRecord.destination, gross_amount: gross, fee_rate: feeRate, fuel_amount: fuel, toll_amount: toll, other_amount: other, extra_expense_amount: toll + other, tip_amount: tip, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal)
    }).eq('id', editingRecord.id);

    if (!error) {
      setRecords(records.map((r) => r.id === editingRecord.id ? { ...r, date: editingRecord.date, startTime: editingRecord.startTime, endTime: editingRecord.endTime, companyName: editCompany, departure: editingRecord.departure, destination: editingRecord.destination, grossAmount: gross, fuelAmount: fuel, tollAmount: toll, otherAmount: other, tipAmount: tip, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) } : r));
      setEditingRecord(null);
    }
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

  const handleSaveNoticeTemplate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!inputNoticeTitle.trim() || !inputNoticeContent.trim()) return; setNoticeLoading(true);
    const { error } = await supabase.from('announcements').upsert({ id: editingNoticeId || `notice_${Date.now()}`, title: inputNoticeTitle.trim(), content: inputNoticeContent.trim(), is_active: editingNoticeId ? (noticeList.find(n => n.id === editingNoticeId)?.isActive || false) : false, updated_at: new Date().toISOString() });
    if (!error) { alert('저장되었습니다.'); setInputNoticeTitle(''); setInputNoticeContent(''); setEditingNoticeId(null); fetchNotices(); }
    setNoticeLoading(false);
  };
  const handleActivateNotice = async (n: NoticeItem) => { await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy'); await supabase.from('announcements').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', n.id); fetchNotices(); };
  const handleDeactivateAllNotices = async () => { await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy'); fetchNotices(); };
  const handleDeleteNotice = async (id: string) => { if (window.confirm('삭제하시겠습니까?')) { await supabase.from('announcements').delete().eq('id', id); fetchNotices(); } };
  const handleUpdateMemberRole = async (memberId: string, newRole: string) => { if (currentUserRole === 'super_admin') { await supabase.from('profiles').update({ role: newRole }).eq('id', memberId); fetchAdminData(); } };

  const downloadCSV = (dataList: DrivingRecord[], fileName: string, isTaxFormat = false) => {
    if (dataList.length === 0) { alert('데이터가 없습니다.'); return; }
    let csvContent = '\uFEFF';
    if (isTaxFormat) {
      const totRev = dataList.reduce((acc, r) => acc + r.grossAmount + r.tipAmount, 0);
      const totExp = dataList.reduce((acc, r) => acc + r.fuelAmount + r.tollAmount + r.otherAmount, 0);
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
    return `[탁송비 및 대납경비 정산 청구]\n안녕하세요, ${r.companyName} 담당자님.\n안전하게 탁송 완료하였습니다.\n\n■ 운행구간: ${r.departure} ➔ ${r.destination}\n■ 청구내역\n${itemsText}--------------------------------\n■ 총 청구금액: ${total.toLocaleString()}원\n■ 입금계좌: ${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.holder})\n${driverPhone ? `■ 기사연락처: ${session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME} (${driverPhone})` : ''}\n\n확인 후 빠른 입금 부탁드립니다. 감사합니다.`;
  };

  const handleToggleInclude = (type: 'gross' | 'fuel' | 'toll' | 'other') => {
    if (!selectedClaimRecord) return;
    const newGross = type === 'gross' ? !includeGross : includeGross;
    const newFuel = type === 'fuel' ? !includeFuel : includeFuel;
    const newToll = type === 'toll' ? !includeToll : includeToll;
    const newOther = type === 'other' ? !includeOther : includeOther;
    setIncludeGross(newGross); setIncludeFuel(newFuel); setIncludeToll(newToll); setIncludeOther(newOther);
    setClaimMessageText(buildClaimText(selectedClaimRecord, newGross, newFuel, newToll, newOther));
  };
  
  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r); setIncludeGross(true); setIncludeFuel(r.fuelAmount > 0); setIncludeToll(r.tollAmount > 0); setIncludeOther(r.otherAmount > 0);
    setClaimMessageText(buildClaimText(r, true, r.fuelAmount > 0, r.tollAmount > 0, r.otherAmount > 0)); setClaimModalOpen(true);
  };
  
  const getElapsedDays = (recordDate: string) => {
    const today = new Date(); const target = new Date(recordDate); return Math.max(0, Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const filteredRecords = filterAllDates ? records : records.filter((r) => r.date === selectedDate);
  const filteredExpenses = filterAllDates ? expenses : expenses.filter((e) => e.date === selectedDate);
  const unpaidRecords = records.filter((r) => !r.isPaid);
  const totalUnpaidAmount = unpaidRecords.reduce((acc, cur) => acc + cur.totalClaimAmount, 0);
  const totalUnpaidReimbursements = unpaidRecords.reduce((acc, cur) => acc + cur.fuelAmount + cur.tollAmount + cur.otherAmount, 0);
  
  const currentMonthPrefix = selectedDate.substring(0, 7);
  const monthlyRecords = records.filter((r) => r.date.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  const companySummary = unpaidRecords.reduce((acc, cur) => { acc[cur.companyName] = (acc[cur.companyName] || 0) + cur.totalClaimAmount; return acc; }, {} as Record<string, number>);
  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';

  if (!session) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-indigo-500 selection:text-white">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-[420px] bg-[#0E1424]/90 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-center shadow-inner mb-3"><Car className="w-6 h-6 text-indigo-400" /></div>
            <div className="flex items-center gap-1.5"><h1 className="text-2xl font-bold tracking-tight text-white">JunDriver</h1><span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span></div>
            <p className="text-xs text-slate-400 mt-1">프로 기사용 스마트 디지털 지갑 & 운행 일지</p>
          </div>
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-5">
            <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>로그인</button>
            <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>회원가입</button>
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1.5">이메일 계정</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@driver.com" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none" /></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1.5">비밀번호</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none" /></div>
              {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}
              {authSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">{authSuccess}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg cursor-pointer">{authLoading ? '로그인 중...' : '클라우드 로그인'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <input type="text" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">이메일 계정 (ID)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@driver.com" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">이름</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-400" />휴대폰 번호</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="01012345678" maxLength={11} required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자리 이상" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호 확인</label><input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="재입력" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" /></div>
              </div>
              <div className="pt-2">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <input type="checkbox" id="privacyCheck" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                    <label htmlFor="privacyCheck" className="text-xs text-slate-200 font-medium cursor-pointer leading-relaxed">[필수] 연락처·개인정보 수집 및 동의</label>
                  </div>
                  <div className="text-right pt-0.5"><button type="button" onClick={() => setShowPrivacyModal(true)} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer">약관 전문보기</button></div>
                </div>
              </div>
              {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg cursor-pointer">{authLoading ? '계정 생성 중...' : '동의하고 회원가입'}</button>
            </form>
          )}
        </div>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button onClick={() => setShowPrivacyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-5 h-5 text-indigo-400" /><h3 className="text-sm font-bold text-white">이용약관</h3></div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-3.5 max-h-[380px] overflow-y-auto leading-relaxed">
                <p>1. 전화번호는 청구문자 전송을 위해 보관됩니다.<br/>2. 계좌번호 및 영수증 사진은 서버로 전송되지 않고 로컬에만 저장됩니다.</p>
              </div>
              <button type="button" onClick={() => { setAgreePrivacy(true); setShowPrivacyModal(false); }} className="mt-4 w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer">동의합니다</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const userPhone = formatPhoneNumber(session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE);
  const userName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans pb-20 selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-30 bg-[#0E1424]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md"><Car className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-base text-white">JunDriver</span><span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">PRO</span>
          </div>
          <div className="flex items-center gap-2.5">
            {isAdminUser && <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'admin' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}><Crown className="w-3.5 h-3.5" /><span>관제탑</span></button>}
            <button onClick={() => { setShowProfileModal(true); setPwdMessage(null); setNewPassword(''); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 hover:border-indigo-500 transition-all text-xs text-slate-200 cursor-pointer">
              <User className="w-3.5 h-3.5 text-indigo-400" /><div className="text-left hidden sm:block max-w-[150px]"><span className="block font-medium truncate">{userName}님</span></div>
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:text-rose-400 text-slate-400 transition-all cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {activeNotice && activeTab !== 'admin' && (
          <section className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3"><Megaphone className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" /><div><div className="text-xs font-extrabold text-indigo-300">{activeNotice.title}</div><div className="text-xs text-slate-200 mt-0.5">{activeNotice.content}</div></div></div>
          </section>
        )}

        {totalUnpaidAmount > 0 && activeTab !== 'admin' && (
          <section className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/40 border border-rose-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-pulse"><AlertTriangle className="w-5 h-5" /></div>
              <div><div className="flex items-center gap-2"><span className="text-xs font-bold text-rose-300">정산 회수 필요</span><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">총 {unpaidRecords.length}건</span></div><div className="text-xl font-extrabold text-white mt-0.5">총 {totalUnpaidAmount.toLocaleString()}원 <span className="text-xs font-normal text-rose-300 ml-1">(사비 대납 경비 {totalUnpaidReimbursements.toLocaleString()}원 포함)</span></div></div>
            </div>
            <button onClick={() => setActiveTab('claims')} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all self-start md:self-auto"><MessageSquare className="w-3.5 h-3.5" /> 청구문자 관리 바로가기</button>
          </section>
        )}

        <section className="bg-gradient-to-r from-[#0E1424] via-[#121B30] to-[#0E1424] border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-indigo-400" /><h2 className="text-xs font-bold text-slate-200 tracking-wide uppercase">{currentMonthPrefix.replace('-', '년 ')}월 총 누적 결산</h2></div>
            <div className="flex items-center gap-2">{dataLoading && <span className="text-[10px] text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin text-indigo-400" /> 동기화 중</span>}<span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">월간 집계 ({monthlyRecords.length}회)</span></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div><div className="text-[11px] text-slate-400 mb-0.5">당월 순수 탁송매출</div><div className="text-xl lg:text-2xl font-extrabold text-white">{monthlyGross.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span></div></div>
            <div><div className="text-[11px] text-slate-400 mb-0.5">당월 탁송 순수입 (팁 포함)</div><div className="text-xl lg:text-2xl font-extrabold text-indigo-300">{monthlyNet.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span></div></div>
            <div><div className="text-[11px] text-slate-400 mb-0.5">당월 본인 경비 지출</div><div className="text-xl lg:text-2xl font-extrabold text-rose-400">-{monthlyExpense.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span></div></div>
            <div><div className="text-[11px] text-slate-400 mb-0.5">당월 실수령액</div><div className="text-xl lg:text-2xl font-extrabold text-emerald-400">{monthlyProfit.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span></div></div>
          </div>
        </section>

        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('records')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${activeTab === 'records' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'}`}><Car className="w-3.5 h-3.5" />운행 일지 등록</button>
          <button onClick={() => setActiveTab('claims')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 relative shrink-0 transition-colors ${activeTab === 'claims' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'}`}><MessageSquare className="w-3.5 h-3.5" />청구문자 관리{unpaidRecords.length > 0 && <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">{unpaidRecords.length}</span>}</button>
          <button onClick={() => setActiveTab('expense')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${activeTab === 'expense' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'}`}><Receipt className="w-3.5 h-3.5" />일반 경비 장부</button>
          <button onClick={() => setActiveTab('wallet')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${activeTab === 'wallet' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'}`}><CreditCard className="w-3.5 h-3.5" />정산용 계좌</button>
          <button onClick={() => setActiveTab('tax')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${activeTab === 'tax' ? 'bg-pink-600 text-white' : 'bg-slate-900/60 text-pink-400 hover:text-white border border-pink-500/30'}`}><Calculator className="w-3.5 h-3.5"/>세무/통계 (PRO)</button>
        </div>

        {activeTab === 'records' && (
          <div className="space-y-6">
            <div className="bg-[#0E1424]/90 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2 text-white text-xs font-bold"><Filter className="w-4 h-4 text-indigo-400" /><span>조회 기준 일자:</span><input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setFilterAllDates(false); }} className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
              <div className="flex items-center gap-2"><button onClick={() => setFilterAllDates(!filterAllDates)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${filterAllDates ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-700'}`}><RotateCcw className="w-3.5 h-3.5" />{filterAllDates ? '전체 기간 조회 중' : '전체 내역 보기'}</button><span className="text-xs text-slate-400">{filterAllDates ? '누적 전체' : `${selectedDate} 기준`}</span></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-indigo-400" />새 운행 배차 등록</h3>
                <form onSubmit={handleAddRecord} className="space-y-3.5">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송사 / 오더처</label><input type="text" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" placeholder="예: 경기 광주" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                    <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" placeholder="예: 인천 송도" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">순수운임(원)</label><input type="text" inputMode="numeric" placeholder="85,000" value={newGross} onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
                    <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label><input type="number" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                    <div><label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1"><Fuel className="w-3.5 h-3.5 text-indigo-400" />대납 주유비</label><input type="text" inputMode="numeric" placeholder="0" value={newFuel} onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5 mb-1"><Receipt className="w-3 h-3 text-sky-400" />통행료</label><input type="text" inputMode="numeric" placeholder="0" value={newToll} onChange={(e) => setNewToll(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
                      <div><label className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5 mb-1"><Receipt className="w-3 h-3 text-sky-400" />기타경비</label><input type="text" inputMode="numeric" placeholder="0" value={newOther} onChange={(e) => setNewOther(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
                    </div>
                    
                    <div className="pt-1">
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"><Camera className="w-3.5 h-3.5 text-indigo-400" />{receiptImage ? '영수증 첨부 완료 (변경)' : '영수증 사진 선택'}</button>
                    </div>
                    {receiptImage && (
                      <div className="relative p-1 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"><div className="flex items-center gap-2"><img src={receiptImage} alt="영수증" className="w-9 h-9 object-cover rounded" /><span className="text-[11px] text-emerald-400 font-semibold">영수증 등록됨</span></div><button type="button" onClick={() => setReceiptImage('')} className="text-slate-500 hover:text-rose-400 p-1"><X className="w-4 h-4" /></button></div>
                    )}
                  </div>

                  <div><label className="block text-[11px] font-semibold text-emerald-400 mb-1 flex items-center gap-1"><Coins className="w-3.5 h-3.5" />손님 수고비 / 팁 (순수 기사 수익)</label><input type="text" inputMode="numeric" placeholder="청구문자 미포함, 내 순익에만 합산" value={newTip} onChange={(e) => setNewTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer">운행 등록 (DB 영구 저장)</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400" />운행 일지 내역 ({filteredRecords.length}건)</h3></div>
                {filteredRecords.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">{dataLoading ? '데이터를 불러오는 중입니다...' : '등록된 운행 기록이 없습니다.'}</div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {filteredRecords.map((r) => {
                      const elapsed = getElapsedDays(r.date);
                      return (
                        <div key={r.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                            <div className="flex items-start sm:items-center gap-3">
                              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0"><MapPin className="w-4 h-4" /></div>
                              <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2"><span className="text-indigo-400 text-xs">[{r.companyName}]</span><span>{r.departure}</span><span className="text-indigo-400">➔</span><span>{r.destination}</span></div>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.date}</span></div>
                              </div>
                            </div>
                            <button onClick={() => togglePaidStatus(r.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${r.isPaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                              {r.isPaid ? <><CheckCircle2 className="w-3.5 h-3.5" /> 입금완료</> : <><AlertCircle className="w-3.5 h-3.5" /> 미입금 ({elapsed}일 경과)</>}
                            </button>
                          </div>
                          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-3 text-slate-400">
                              <span>탁송료: <strong className="text-white">{r.grossAmount.toLocaleString()}원</strong></span>
                              {r.fuelAmount > 0 && <span className="text-indigo-300 font-semibold">주유비: {r.fuelAmount.toLocaleString()}원</span>}
                              {(r.tollAmount > 0 || r.otherAmount > 0) && <span className="text-sky-300 font-semibold">대납경비: {(r.tollAmount + r.otherAmount).toLocaleString()}원</span>}
                              <span className="text-emerald-400 font-semibold">순익: +{r.netAmount.toLocaleString()}원</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {r.receiptImage && <button onClick={() => setPreviewImage(r.receiptImage || null)} className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 cursor-pointer" title="영수증 보기"><ImageIcon className="w-3.5 h-3.5" /></button>}
                              <button onClick={() => handleOpenEditModal(r)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-all cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteRecord(r.id)} className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="space-y-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-white">거래처별 미수금 현황 요약</h3><span className="text-xs font-bold text-rose-400">총 미수금 {totalUnpaidAmount.toLocaleString()}원</span></div>
              <div className="flex flex-wrap gap-3">
                {Object.keys(companySummary).length === 0 ? (
                  <div className="text-slate-500 text-xs w-full text-center py-4">모든 거래처 정산이 완료되었습니다! 👏</div>
                ) : (
                  Object.entries(companySummary).map(([comp, amt]) => (
                    <div key={comp} className="bg-slate-900 border-l-4 border-rose-500 rounded-r-lg px-4 py-3 flex-1 min-w-[200px]"><div className="text-xs font-bold text-slate-400 mb-1">{comp}</div><div className="text-base font-extrabold text-white">{amt.toLocaleString()} 원</div></div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-6 space-y-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4">개별 미입금 청구 대상 ({unpaidRecords.length}건)</h3>
              {unpaidRecords.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">현재 미입금된 건이 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {unpaidRecords.map((r) => {
                    const elapsed = getElapsedDays(r.date);
                    const isUrgent = elapsed >= 3;
                    return (
                      <div key={r.id} className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isUrgent ? 'bg-rose-950/20 border-rose-500/40 shadow-sm' : 'bg-slate-900/70 border-slate-800'}`}>
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className={`p-2 rounded-xl shrink-0 ${isUrgent ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-amber-500/20 text-amber-400'}`}><AlertTriangle className="w-5 h-5" /></div>
                          <div>
                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-indigo-400">[{r.companyName}]</span><span className="text-sm font-bold text-white">{r.departure} ➔ {r.destination}</span><span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${isUrgent ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>{elapsed === 0 ? '당일 미입금' : `${elapsed}일째 미입금`}</span></div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                              <span>운행일: {r.date}</span><span>탁송료: {r.grossAmount.toLocaleString()}원</span>
                              {r.fuelAmount > 0 && <span className="text-indigo-300 font-semibold">주유비: {r.fuelAmount.toLocaleString()}원</span>}
                              {(r.tollAmount > 0 || r.otherAmount > 0) && <span className="text-sky-300 font-semibold">추가경비: {(r.tollAmount + r.otherAmount).toLocaleString()}원</span>}
                              <span className="text-white font-bold">합산 청구액: {r.totalClaimAmount.toLocaleString()}원</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          {r.receiptImage && <button onClick={() => setPreviewImage(r.receiptImage || null)} className="p-2 rounded-lg bg-slate-800 text-indigo-400 hover:bg-slate-700 transition-all cursor-pointer"><ImageIcon className="w-4 h-4" /></button>}
                          <button onClick={() => openClaimMessageModal(r)} className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"><MessageSquare className="w-3.5 h-3.5" /> 청구문자 전송</button>
                          <button onClick={() => togglePaidStatus(r.id)} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"><Check className="w-3.5 h-3.5" /> 입금완료 처리</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-rose-400" />일반 경비 지출 등록</h3>
              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-rose-500" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 분류</label><select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"><option value="대중교통">대중교통 (지하철/버스/셔틀)</option><option value="식대">식대 및 간식</option><option value="차량공유">차량공유 (쏘카/그린카)</option><option value="기타">기타 잡비</option></select></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 금액(원)</label><input type="text" inputMode="numeric" placeholder="4,500" value={expAmount} onChange={(e) => setExpAmount(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">메모 (선택)</label><input type="text" placeholder="예: 송도 복귀 광역버스" value={expMemo} onChange={(e) => setExpMemo(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg cursor-pointer">경비 등록 (DB 저장)</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-4">경비 지출 내역 ({filteredExpenses.length}건)</h3>
              <div className="space-y-2.5">
                {filteredExpenses.map((exp) => (
                  <div key={exp.id} className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300">{exp.category}</span><span className="text-sm text-white font-medium">{exp.memo || '-'}</span></div><div className="text-xs text-slate-400 mt-1">{exp.date}</div></div><div className="flex items-center gap-3"><span className="text-sm font-bold text-rose-400">-{exp.amount.toLocaleString()}원</span><button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5 h-fit"><h3 className="text-sm font-bold text-white mb-2">정산 입금 계좌 추가</h3><p className="text-[11px] text-emerald-400 mb-4">계좌 정보는 기기에만 보관됩니다.</p>
              <form onSubmit={handleAddAccount} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">은행명</label><input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required placeholder="예: 신한은행" className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">계좌번호</label><input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required placeholder="하이픈 포함 입력" className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">예금주</label><input type="text" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="예금주 성함" className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg cursor-pointer">기기에 안전 저장</button>
              </form>
            </div>
            <div className="space-y-3">
              {accounts.map((acc, idx) => (
                <div key={acc.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between"><div><div className="text-sm font-bold text-white">{acc.bankName} ({acc.holder}) {idx === 0 && <span className="ml-2 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded">기본 계좌</span>}</div><div className="text-sm font-mono text-indigo-300 mt-1">{acc.accountNumber}</div></div><div className="flex items-center gap-2"><button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); alert('계좌번호가 복사되었습니다.'); }} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"><Copy className="w-3.5 h-3.5" /> 복사</button><button onClick={() => setAccounts(accounts.filter((a) => a.id !== acc.id))} className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button></div></div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-6">
            <div className="bg-[#0E1424]/80 backdrop-blur-md border border-pink-500/30 rounded-xl p-6 shadow-lg shadow-pink-900/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div><h3 className="text-base font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-pink-500"/>종합소득세 신고 증빙용 세무 대시보드 (PRO)</h3><p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">단순경비율 대상자(업종코드 940913 등) 또는 간편장부 작성자를 위한 세무 리포트입니다.<br/>순수 운임 매출과 대납 경비(주유/통행료)를 분리하여, 대납금이 매출로 과세되는 불이익을 방지합니다.</p></div>
                <button onClick={() => downloadCSV(records, `JunDriver_세무장부_${new Date().toISOString().split('T')[0]}.csv`, true)} className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-2 shadow-md shrink-0"><FileSpreadsheet className="w-4 h-4" />엑셀 장부 추출</button>
              </div>
              {(() => {
                const totRev = records.reduce((acc, r) => acc + r.grossAmount + r.tipAmount, 0); const totExp = records.reduce((acc, r) => acc + r.fuelAmount + r.tollAmount + r.otherAmount, 0); const estTaxable = totRev * (1 - STANDARD_EXPENSE_RATE);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl"><div className="text-[11px] text-slate-400 font-bold mb-1">총 매출 수입금액 (운임+팁)</div><div className="text-xl font-extrabold text-white">{totRev.toLocaleString()} 원</div></div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl"><div className="text-[11px] text-slate-400 font-bold mb-1">대납 경비 합계 (비과세성)</div><div className="text-xl font-extrabold text-amber-400">{totExp.toLocaleString()} 원</div></div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl"><div className="text-[11px] text-slate-400 font-bold mb-1">단순경비율 공제 ({STANDARD_EXPENSE_RATE * 100}%)</div><div className="text-xl font-extrabold text-slate-300">- {Math.round(totRev * STANDARD_EXPENSE_RATE).toLocaleString()} 원</div></div>
                    <div className="bg-indigo-950/50 border border-indigo-500/50 p-4 rounded-xl"><div className="text-[11px] text-indigo-300 font-bold mb-1">예상 소득금액 (과세표준)</div><div className="text-xl font-extrabold text-indigo-400">{Math.round(estTaxable).toLocaleString()} 원</div></div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdminUser && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button onClick={() => setAdminSubTab('campaign')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'campaign' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>공지 보관함</button>
              <button onClick={() => setAdminSubTab('members')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'members' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>회원 관리 ({adminMemberList.length}명)</button>
              <button onClick={() => setAdminSubTab('analytics')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>마케팅 통계</button>
            </div>
            {adminSubTab === 'campaign' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#0E1424] border border-slate-800 p-5 rounded-xl space-y-4"><div className="flex items-center justify-between"><h4 className="font-bold text-white text-sm flex items-center gap-1.5"><BookmarkPlus className="w-4 h-4 text-indigo-400" />{editingNoticeId ? '문구 수정하기' : '새 공지 문구 저장'}</h4>{editingNoticeId && <button onClick={() => { setEditingNoticeId(null); setInputNoticeTitle(''); setInputNoticeContent(''); }} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">신규 작성</button>}</div>
                  <form onSubmit={handleSaveNoticeTemplate} className="space-y-3"><input type="text" value={inputNoticeTitle} onChange={(e) => setInputNoticeTitle(e.target.value)} placeholder="제목" required className="w-full px-3 py-2 bg-white text-black font-semibold rounded text-xs" /><textarea rows={4} value={inputNoticeContent} onChange={(e) => setInputNoticeContent(e.target.value)} placeholder="내용" required className="w-full px-3 py-2 bg-white text-black rounded text-xs" /><button type="submit" disabled={noticeLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md">{noticeLoading ? '처리 중...' : editingNoticeId ? '수정 내용 저장' : '보관함에 저장하기'}</button></form>
                  {activeNotice && <div className="pt-3 border-t border-slate-800"><button onClick={handleDeactivateAllNotices} disabled={noticeLoading} className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 text-xs font-semibold rounded-lg cursor-pointer transition-colors">현재 메인 배너 송출 중단</button></div>}
                </div>
                <div className="lg:col-span-2 bg-[#0E1424] border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="font-bold text-white text-sm">공지 문구 라이브러리</h4></div><span className="text-xs font-mono text-indigo-400 font-bold">{noticeList.length}개 보관 중</span></div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                    {noticeList.map((n) => (
                      <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.isActive ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10' : 'bg-slate-900/60 border-slate-800'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2"><div className="flex items-center gap-2">{n.isActive ? <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500 text-slate-950 rounded flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" />송출 중</span> : <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-400 rounded">보관 중</span>}<h5 className="font-bold text-white text-xs">{n.title}</h5></div><span className="text-[10px] text-slate-500 font-mono">{n.updatedAt}</span></div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">{n.content}</p>
                        <div className="flex items-center justify-end gap-2"><button onClick={() => { setInputNoticeTitle(n.title); setInputNoticeContent(n.content); setEditingNoticeId(n.id); }} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-semibold cursor-pointer flex items-center gap-1"><Edit2 className="w-3 h-3" />불러오기</button><button onClick={() => handleDeleteNotice(n.id)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>{!n.isActive && <button onClick={() => handleActivateNotice(n)} disabled={noticeLoading} className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold rounded cursor-pointer flex items-center gap-1 shadow-md"><Send className="w-3 h-3" />메인 송출</button>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {adminSubTab === 'members' && (
              <div className="bg-[#0E1424] border border-slate-800 p-5 rounded-xl space-y-3">
                <input type="text" placeholder="이름/번호/이메일 검색..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="px-3 py-2 bg-white text-black font-semibold rounded text-xs w-full max-w-xs focus:ring-2 focus:ring-indigo-500" />
                <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-900 text-slate-400 border-b border-slate-800"><tr><th className="p-3">이름</th><th className="p-3">전화번호</th><th className="p-3">이메일</th><th className="p-3">권한</th><th className="p-3 text-right">권한 변경</th></tr></thead><tbody className="divide-y divide-slate-800">
                      {adminMemberList.filter(m => m.name.includes(adminSearchTerm) || m.phone.includes(adminSearchTerm) || m.email.includes(adminSearchTerm)).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-900/50">
                          <td className="p-3 text-white font-bold">{m.name}</td><td className="p-3 font-mono">{formatPhoneNumber(m.phone)}</td><td className="p-3 text-slate-300">{m.email}</td>
                          <td className="p-3">{m.role === 'super_admin' ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">최고 관리자</span> : m.role === 'manager' ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400">운영 직원</span> : m.role === 'vip_driver' ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-pink-500/20 text-pink-400">VIP 기사</span> : m.role === 'pro_driver' ? <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">PRO 기사</span> : <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 text-slate-300">일반 기사</span>}</td>
                          <td className="p-3 text-right"><select value={m.role} onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-[11px] cursor-pointer outline-none"><option value="user">일반 기사</option><option value="pro_driver">PRO 기사</option><option value="vip_driver">VIP 기사</option><option value="manager">운영 직원</option><option value="super_admin">최고 관리자</option></select></td>
                        </tr>
                      ))}
                </tbody></table></div>
              </div>
            )}
            {adminSubTab === 'analytics' && (
              <div className="space-y-4">
                <div className="flex justify-end mb-2"><button onClick={() => downloadCSV(adminAllRecords, 'JunDriver_전체운행.csv', false)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-1"><Download className="w-3.5 h-3.5" />전체 운행내역 CSV 엑셀 추출</button></div>
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

      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setEditingRecord(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-2.5 mb-4"><div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Edit2 className="w-4 h-4" /></div><h3 className="text-sm font-bold text-white">운행 일지 내역 수정</h3></div>
            <form onSubmit={handleUpdateRecord} className="space-y-3.5">
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label><input type="date" value={editingRecord.date} onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송사 / 오더처</label><input type="text" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발 시각</label><input type="time" value={editingRecord.startTime} onChange={(e) => setEditingRecord({ ...editingRecord, startTime: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착 시각</label><input type="time" value={editingRecord.endTime} onChange={(e) => setEditingRecord({ ...editingRecord, endTime: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" value={editingRecord.departure} onChange={(e) => setEditingRecord({ ...editingRecord, departure: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" value={editingRecord.destination} onChange={(e) => setEditingRecord({ ...editingRecord, destination: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label><input type="text" inputMode="numeric" value={editGross} onChange={(e) => setEditGross(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label><input type="number" value={editingRecord.feeRate} onChange={(e) => setEditingRecord({ ...editingRecord, feeRate: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
              </div>
              <div><label className="block text-[11px] font-semibold text-indigo-300 mb-1">대납 주유비</label><input type="text" inputMode="numeric" value={editFuel} onChange={(e) => setEditFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-sky-300 mb-1">통행료</label><input type="text" inputMode="numeric" value={editToll} onChange={(e) => setEditToll(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
                <div><label className="block text-[11px] font-semibold text-sky-300 mb-1">기타경비</label><input type="text" inputMode="numeric" value={editOther} onChange={(e) => setEditOther(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs" /></div>
              </div>
              <div><label className="block text-[11px] font-semibold text-emerald-400 mb-1">팁/수고비 (순익 가산용)</label><input type="text" inputMode="numeric" value={editTip} onChange={(e) => setEditTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs" /></div>
              <div className="pt-3 flex gap-2"><button type="button" onClick={() => setEditingRecord(null)} className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer">취소</button><button type="submit" className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md cursor-pointer">수정 완료 (DB 갱신)</button></div>
            </form>
          </div>
        </div>
      )}

      {claimModalOpen && selectedClaimRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setClaimModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-2.5 mb-2"><MessageSquare className="w-5 h-5 text-indigo-400" /><h3 className="text-sm font-bold text-white">정산 청구 항목 선택 및 문자 편집</h3></div>
            <p className="text-xs text-slate-400 mb-4">청구할 항목을 클릭해 켜고 끌 수 있습니다. (팁은 포함되지 않음)</p>
            <div className="grid grid-cols-4 gap-2 mb-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <button type="button" onClick={() => handleToggleInclude('gross')} className={`py-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${includeGross ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}><span className="text-[9px] text-slate-400">기본운임</span><span className="mt-0.5">{selectedClaimRecord.grossAmount.toLocaleString()}원</span></button>
              <button type="button" disabled={selectedClaimRecord.fuelAmount <= 0} onClick={() => handleToggleInclude('fuel')} className={`py-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${selectedClaimRecord.fuelAmount <= 0 ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border-slate-800' : includeFuel ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}><span className="text-[9px] text-slate-400">주유비</span><span className="mt-0.5">{selectedClaimRecord.fuelAmount.toLocaleString()}원</span></button>
              <button type="button" disabled={selectedClaimRecord.tollAmount <= 0} onClick={() => handleToggleInclude('toll')} className={`py-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${selectedClaimRecord.tollAmount <= 0 ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border-slate-800' : includeToll ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}><span className="text-[9px] text-slate-400">통행료</span><span className="mt-0.5">{selectedClaimRecord.tollAmount.toLocaleString()}원</span></button>
              <button type="button" disabled={selectedClaimRecord.otherAmount <= 0} onClick={() => handleToggleInclude('other')} className={`py-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${selectedClaimRecord.otherAmount <= 0 ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border-slate-800' : includeOther ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}><span className="text-[9px] text-slate-400">기타경비</span><span className="mt-0.5">{selectedClaimRecord.otherAmount.toLocaleString()}원</span></button>
            </div>
            <textarea rows={10} value={claimMessageText} onChange={(e) => setClaimMessageText(e.target.value)} className="w-full p-3.5 rounded-xl bg-white text-slate-950 font-medium text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-mono" />
            <div className="pt-4 flex gap-2"><button type="button" onClick={() => setClaimModalOpen(false)} className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer">닫기</button><button type="button" onClick={() => { navigator.clipboard.writeText(claimMessageText); alert('청구 문구가 복사되었습니다.'); setClaimModalOpen(false); }} className="flex-1 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"><Copy className="w-3.5 h-3.5" /> 청구 문구 복사하기</button></div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <button onClick={() => setPreviewImage(null)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 cursor-pointer"><X className="w-5 h-5" /></button>
            <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-indigo-400" /> 주유 영수증 사진 확인</div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center"><img src={previewImage} alt="영수증 원본" className="max-w-full h-auto rounded-lg" /></div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-4">비밀번호 변경</h3>
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호 입력 (6자리 이상)" required className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm" />
              {pwdMessage && <div className={`p-3 text-xs rounded-lg ${pwdMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{pwdMessage.text}</div>}
              <button type="submit" disabled={pwdLoading} className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg cursor-pointer">{pwdLoading ? '변경 중...' : '변경 완료'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
