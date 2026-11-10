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
  Send
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

  // 3중 봇 방지 상태
  const [honeypot, setHoneypot] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'wallet' | 'admin'>('records');
  const [adminSubTab, setAdminSubTab] = useState<'analytics' | 'members' | 'campaign'>('campaign');

  // 날짜 필터 상태
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-10');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  // 계정 보안 모달
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 운행 일지 수정 모달
  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editGross, setEditGross] = useState('');
  const [editFuel, setEditFuel] = useState('');
  const [editExtra, setEditExtra] = useState('');
  const [editTip, setEditTip] = useState('');

  // 청구 문자 모달
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true);
  const [includeFuel, setIncludeFuel] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true);
  const [claimMessageText, setClaimMessageText] = useState('');

  // 데이터 상태
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // 공지사항 라이브러리 및 활성 공지 상태
  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [inputNoticeTitle, setInputNoticeTitle] = useState('');
  const [inputNoticeContent, setInputNoticeContent] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeLoading, setNoticeLoading] = useState(false);

  // 관리자 전용 데이터 상태
  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // 기사 계좌
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('jundriver_local_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: '1',
        bankName: '신한은행',
        accountNumber: '110-123-456789',
        holder: '공민준',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('jundriver_local_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // 등록 폼 상태
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

  // 경비 폼 상태
  const [expCategory, setExpCategory] = useState('대중교통');
  const [expAmount, setExpAmount] = useState('');
  const [expMemo, setExpMemo] = useState('');

  // 공지사항 라이브러리 목록 로드
  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('updated_at', { ascending: false });

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
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserData = async (userId: string, userEmail: string) => {
    try {
      let role = 'user';
      if (userEmail.toLowerCase() === ADMIN_DEFAULT_EMAIL.toLowerCase()) {
        role = 'super_admin';
        await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          name: ADMIN_DEFAULT_NAME,
          phone: ADMIN_DEFAULT_PHONE,
          role: 'super_admin',
        });
      } else {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        role = profile?.role || 'user';
      }
      setCurrentUserRole(role as any);

      // 운행 기록 로드
      const { data: recordsData } = await supabase
        .from('driving_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (recordsData) {
        setRecords(
          recordsData.map((r: any) => ({
            id: r.id,
            date: r.date,
            startTime: r.start_time || '-',
            endTime: r.end_time || '-',
            departure: r.departure,
            destination: r.destination,
            grossAmount: Number(r.gross_amount),
            feeRate: Number(r.fee_rate),
            fuelAmount: Number(r.fuel_amount),
            extraExpenseAmount: Number(r.extra_expense_amount),
            tipAmount: Number(r.tip_amount),
            isPaid: Boolean(r.is_paid),
            netAmount: Number(r.net_amount),
            totalClaimAmount: Number(r.total_claim_amount),
          }))
        );
      }

      // 경비 로드
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (expensesData) {
        setExpenses(
          expensesData.map((e: any) => ({
            id: e.id,
            date: e.date,
            category: e.category,
            amount: Number(e.amount),
            memo: e.memo || '',
          }))
        );
      }

      if (role === 'super_admin' || role === 'manager') {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: allRecs } = await supabase.from('driving_records').select('*');

      if (profiles && allRecs) {
        const mappedMembers: MemberProfile[] = profiles.map((p: any) => ({
          id: p.id,
          email: p.email,
          name: p.name,
          phone: p.phone,
          role: p.role || 'user',
          createdAt: p.created_at ? p.created_at.substring(0, 10) : '-',
          recordCount: allRecs.filter((r: any) => r.user_id === p.id).length,
        }));
        setAdminMemberList(mappedMembers);

        setAdminAllRecords(
          allRecs.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            date: r.date,
            startTime: r.start_time || '-',
            endTime: r.end_time || '-',
            departure: r.departure,
            destination: r.destination,
            grossAmount: Number(r.gross_amount),
            feeRate: Number(r.fee_rate),
            fuelAmount: Number(r.fuel_amount),
            extraExpenseAmount: Number(r.extra_expense_amount),
            tipAmount: Number(r.tip_amount),
            isPaid: Boolean(r.is_paid),
            netAmount: Number(r.net_amount),
            totalClaimAmount: Number(r.total_claim_amount),
          }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotices();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
      } else {
        setRecords([]);
        setExpenses([]);
        setCurrentUserRole('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password.trim(),
    });

    if (error) {
      setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
    setAuthLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    if (honeypot.trim() !== '') {
      setAuthLoading(false);
      return;
    }

    if (!captchaVerified) {
      setAuthError('보안 확인(인간 인증 체크)을 완료해 주세요.');
      setAuthLoading(false);
      return;
    }

    const trimmedName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setAuthError('이름을 입력해 주세요.');
      setAuthLoading(false);
      return;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setAuthError('휴대폰 번호는 숫자 10~11자리로 입력해 주세요.');
      setAuthLoading(false);
      return;
    }

    if (password.length < 6) {
      setAuthError('비밀번호는 최소 6자리 이상이어야 합니다.');
      setAuthLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setAuthError('비밀번호가 일치하지 않습니다.');
      setAuthLoading(false);
      return;
    }

    if (!agreePrivacy) {
      setAuthError('개인정보 및 이용약관에 동의해 주세요.');
      setAuthLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password.trim(),
      options: {
        data: {
          name: trimmedName,
          phone: cleanPhone,
        },
      },
    });

    if (error) {
      setAuthError('가입 실패: ' + error.message);
    } else {
      if (data.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: cleanEmail,
            name: trimmedName,
            phone: cleanPhone,
            role: cleanEmail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : 'user',
          },
        ]);
      }
      setAuthSuccess('회원가입이 완료되었습니다. 로그인해 주세요.');
      setAuthMode('login');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileModal(false);
    setActiveTab('records');
  };

  // 공지 저장 (신규 등록 또는 수정)
  const handleSaveNoticeTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNoticeTitle.trim() || !inputNoticeContent.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setNoticeLoading(true);
    const targetId = editingNoticeId || `notice_${Date.now()}`;

    const { error } = await supabase.from('announcements').upsert({
      id: targetId,
      title: inputNoticeTitle.trim(),
      content: inputNoticeContent.trim(),
      is_active: editingNoticeId ? (noticeList.find(n => n.id === editingNoticeId)?.isActive || false) : false,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      alert(editingNoticeId ? '문구가 수정되었습니다.' : '새 공지 문구가 보관함에 저장되었습니다.');
      setInputNoticeTitle('');
      setInputNoticeContent('');
      setEditingNoticeId(null);
      fetchNotices();
    }
    setNoticeLoading(false);
  };

  // 공지 문구를 메인 배너로 즉시 활성화/송출
  const handleActivateNotice = async (targetNotice: NoticeItem) => {
    setNoticeLoading(true);
    try {
      // 1. 기존 모든 공지의 is_active를 false로 리셋
      await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy');

      // 2. 선택된 공지만 is_active를 true로 활성화
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', targetNotice.id);

      if (error) {
        alert('활성화 실패: ' + error.message);
      } else {
        alert(`[${targetNotice.title}] 문구가 메인 배너로 활성화되었습니다.`);
        fetchNotices();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNoticeLoading(false);
    }
  };

  // 메인 배너 끄기
  const handleDeactivateAllNotices = async () => {
    setNoticeLoading(true);
    const { error } = await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy');
    if (error) {
      alert('해제 실패: ' + error.message);
    } else {
      alert('메인 배너 송출이 중단되었습니다.');
      fetchNotices();
    }
    setNoticeLoading(false);
  };

  // 공지 문구 삭제
  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('이 공지 문구를 보관함에서 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      fetchNotices();
    }
  };

  // 공지 문구 불러오기
  const handleLoadNoticeToForm = (n: NoticeItem) => {
    setInputNoticeTitle(n.title);
    setInputNoticeContent(n.content);
    setEditingNoticeId(n.id);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const gross = cleanNumber(newGross);
    const feeRate = cleanNumber(newFeeRate);
    const fuel = cleanNumber(newFuel);
    const extraExp = cleanNumber(newExtraExpense);
    const tip = cleanNumber(newTip);

    const feeAmount = gross * (feeRate / 100);
    const net = gross - feeAmount + tip;
    const claimTotal = gross + fuel + extraExp;
    const recordId = 'rec_' + Date.now().toString();

    const insertPayload = {
      id: recordId,
      user_id: session.user.id,
      date: newDate,
      start_time: newStartTime || '-',
      end_time: newEndTime || '-',
      departure: newDeparture,
      destination: newDestination,
      gross_amount: gross,
      fee_rate: feeRate,
      fuel_amount: fuel,
      extra_expense_amount: extraExp,
      tip_amount: tip,
      is_paid: false,
      net_amount: Math.round(net),
      total_claim_amount: Math.round(claimTotal),
    };

    const { error } = await supabase.from('driving_records').insert([insertPayload]);
    if (error) {
      alert('저장 실패: ' + error.message);
      return;
    }

    setRecords([
      {
        id: recordId,
        date: newDate,
        startTime: newStartTime || '-',
        endTime: newEndTime || '-',
        departure: newDeparture,
        destination: newDestination,
        grossAmount: gross,
        feeRate,
        fuelAmount: fuel,
        extraExpenseAmount: extraExp,
        tipAmount: tip,
        isPaid: false,
        netAmount: Math.round(net),
        totalClaimAmount: Math.round(claimTotal),
      },
      ...records,
    ]);

    setNewDeparture('');
    setNewDestination('');
    setNewGross('');
    setNewFuel('');
    setNewExtraExpense('');
    setNewTip('');
  };

  const handleDeleteRecord = async (id: string) => {
    const { error } = await supabase.from('driving_records').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
    setRecords(records.filter((r) => r.id !== id));
  };

  const togglePaidStatus = async (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;
    const newStatus = !target.isPaid;

    const { error } = await supabase.from('driving_records').update({ is_paid: newStatus }).eq('id', id);
    if (error) {
      alert('상태 변경 실패: ' + error.message);
      return;
    }
    setRecords(records.map((r) => (r.id === id ? { ...r, isPaid: newStatus } : r)));
  };

  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withExtra: boolean) => {
    const primaryAccount = accounts[0] || { bankName: '은행명', accountNumber: '계좌번호', holder: '예금주' };
    const rawPhone = session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE;
    const driverPhone = formatPhoneNumber(rawPhone);
    const driverName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;

    let total = 0;
    let itemsText = '';

    if (withGross) {
      total += r.grossAmount;
      itemsText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`;
    }
    if (withFuel && r.fuelAmount > 0) {
      total += r.fuelAmount;
      itemsText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원\n`;
    }
    if (withExtra && r.extraExpenseAmount > 0) {
      total += r.extraExpenseAmount;
      itemsText += `* 대납 추가경비: ${r.extraExpenseAmount.toLocaleString()}원 (통행료/세차비 등)\n`;
    }

    return `[탁송 정산 요청]
* 운행일자: ${r.date}
* 운행구간: ${r.departure} ➔ ${r.destination}
${itemsText}--------------------------------
* 총 청구금액: ${total.toLocaleString()}원
* 입금계좌: ${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.holder})${driverPhone ? `\n* 탁송기사: ${driverName} (${driverPhone})` : ''}

확인 후 빠른 입금 부탁드립니다. 감사합니다.`;
  };

  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r);
    setIncludeGross(true);
    setIncludeFuel(r.fuelAmount > 0);
    setIncludeExtra(r.extraExpenseAmount > 0);
    setClaimMessageText(buildClaimText(r, true, r.fuelAmount > 0, r.extraExpenseAmount > 0));
    setClaimModalOpen(true);
  };

  const unpaidRecords = records.filter((r) => !r.isPaid);
  const totalUnpaidAmount = unpaidRecords.reduce((acc, cur) => acc + cur.totalClaimAmount, 0);

  const filteredAdminMembers = adminMemberList.filter(
    (m) =>
      m.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      m.phone.includes(adminSearchTerm) ||
      m.email.toLowerCase().includes(adminSearchTerm.toLowerCase())
  );

  const routeCounts: { [key: string]: number } = {};
  adminAllRecords.forEach((r) => {
    const route = `${r.departure.trim()} ➔ ${r.destination.trim()}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';

  if (!session) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 font-sans relative">
        <div className="w-full max-w-[420px] bg-[#0E1424]/90 border border-slate-800 rounded-2xl p-7 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-center mb-3">
              <Car className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              JunDriver <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">탁송기사용 스마트 디지털 일지</p>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer ${authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setAuthError(''); setCaptchaVerified(false); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer ${authMode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              회원가입
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@driver.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200"
                />
              </div>

              {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}
              {authSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">{authSuccess}</div>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg cursor-pointer shadow-lg"
              >
                {authLoading ? '로그인 처리 중...' : '클라우드 로그인'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <input type="text" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@driver.com"
                  required
                  className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300 mb-1">휴대폰번호</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01012345678"
                    maxLength={11}
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자리 이상"
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="재입력"
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                  />
                </div>
              </div>

              <div
                onClick={() => setCaptchaVerified(!captchaVerified)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                  captchaVerified ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${captchaVerified ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600 bg-slate-800'}`}>
                    {captchaVerified && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-semibold">로봇이 아닙니다 (터치)</span>
                </div>
                <BotOff className="w-4 h-4 text-slate-500" />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="agreeChk" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                <label htmlFor="agreeChk" className="text-xs text-slate-300 cursor-pointer">이용약관 및 개인정보 처리에 동의합니다.</label>
              </div>

              {authError && <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg cursor-pointer"
              >
                {authLoading ? '계정 생성 중...' : '회원가입'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const userName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;
  const userPhone = formatPhoneNumber(session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans pb-20">
      <header className="sticky top-0 z-30 bg-[#0E1424]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">JunDriver</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">PRO</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdminUser && (
              <button
                onClick={() => { fetchAdminData(); setActiveTab('admin'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>관제탑 (관리자)</span>
              </button>
            )}

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-xs text-slate-200 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-left">
                <span className="block font-bold text-white">{userName}님</span>
                <span className="block text-[10px] text-slate-400 font-mono">{userPhone}</span>
              </div>
            </button>

            <button onClick={handleLogout} className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* 활성 공지사항 배너 */}
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

        {totalUnpaidAmount > 0 && activeTab !== 'admin' && (
          <section className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <div>
                <span className="text-xs font-bold text-rose-300">미입금 정산 내역 ({unpaidRecords.length}건)</span>
                <div className="text-xl font-extrabold text-white">총 {totalUnpaidAmount.toLocaleString()}원</div>
              </div>
            </div>
            <button onClick={() => setActiveTab('claims')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">
              청구문자 관리
            </button>
          </section>
        )}

        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('records')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 ${activeTab === 'records' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>운행 일지</button>
          <button onClick={() => setActiveTab('claims')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer relative shrink-0 ${activeTab === 'claims' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
            청구문자
            {unpaidRecords.length > 0 && <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">{unpaidRecords.length}</span>}
          </button>
          <button onClick={() => setActiveTab('expense')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 ${activeTab === 'expense' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>경비 장부</button>
          <button onClick={() => setActiveTab('wallet')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0 ${activeTab === 'wallet' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>계좌 관리</button>
          {isAdminUser && (
            <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className={`px-4 py-2 rounded-lg text-xs font-bold ml-auto cursor-pointer shrink-0 ${activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-amber-500/20 text-amber-300'}`}>관제탑</button>
          )}
        </div>

        {/* 운행 일지 탭 */}
        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">새 운행 배차 등록</h3>
              <form onSubmit={handleAddRecord} className="space-y-3">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 bg-white text-slate-900 rounded text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="출발지" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} required className="px-3 py-2 bg-white text-slate-900 rounded text-xs" />
                  <input type="text" placeholder="도착지" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} required className="px-3 py-2 bg-white text-slate-900 rounded text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="운임(원)" value={newGross} onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))} required className="px-3 py-2 bg-white text-slate-900 rounded text-xs font-bold" />
                  <input type="number" placeholder="수수료(%)" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} className="px-3 py-2 bg-white text-slate-900 rounded text-xs" />
                </div>
                <input type="text" placeholder="대납 주유비" value={newFuel} onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 bg-white text-slate-900 rounded text-xs" />
                <input type="text" placeholder="대납 통행료/경비" value={newExtraExpense} onChange={(e) => setNewExtraExpense(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 bg-white text-slate-900 rounded text-xs" />
                <input type="text" placeholder="기사 팁" value={newTip} onChange={(e) => setNewTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 bg-white text-slate-900 rounded text-xs" />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded text-xs cursor-pointer shadow-md">운행 등록</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">운행 내역 ({records.length}건)</h3>
              <div className="space-y-3 max-h-[560px] overflow-y-auto">
                {records.map((r) => (
                  <div key={r.id} className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{r.departure} ➔ {r.destination}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.date} | 운임: {r.grossAmount.toLocaleString()}원 | 순익: +{r.netAmount.toLocaleString()}원</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePaidStatus(r.id)} className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${r.isPaid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {r.isPaid ? '입금완료' : '미입금'}
                      </button>
                      <button onClick={() => handleDeleteRecord(r.id)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 관제탑 관리자 화면 */}
        {activeTab === 'admin' && isAdminUser && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button onClick={() => setAdminSubTab('campaign')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${adminSubTab === 'campaign' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'}`}>공지/이벤트 문구보관함</button>
              <button onClick={() => setAdminSubTab('members')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${adminSubTab === 'members' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'}`}>회원 관리 ({adminMemberList.length}명)</button>
              <button onClick={() => setAdminSubTab('analytics')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${adminSubTab === 'analytics' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'}`}>마케팅 통계</button>
            </div>

            {/* 개편된 공지/이벤트 문구 보관함 */}
            {adminSubTab === 'campaign' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 문구 작성 및 수정 폼 */}
                <div className="bg-[#0E1424] border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <BookmarkPlus className="w-4 h-4 text-indigo-400" />
                      {editingNoticeId ? '문구 수정하기' : '새 공지/이벤트 문구 저장'}
                    </h4>
                    {editingNoticeId && (
                      <button
                        onClick={() => { setEditingNoticeId(null); setInputNoticeTitle(''); setInputNoticeContent(''); }}
                        className="text-[11px] text-slate-400 hover:text-white"
                      >
                        신규 작성으로 전환
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveNoticeTemplate} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">공지 제목 (이벤트명)</label>
                      <input
                        type="text"
                        value={inputNoticeTitle}
                        onChange={(e) => setInputNoticeTitle(e.target.value)}
                        placeholder="예: 🎁 신규 회원 주유권 증정 이벤트"
                        required
                        className="w-full px-3 py-2 bg-white text-slate-900 font-semibold rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">공지 본문 내용</label>
                      <textarea
                        rows={4}
                        value={inputNoticeContent}
                        onChange={(e) => setInputNoticeContent(e.target.value)}
                        placeholder="기사님들에게 안내할 상세 혜택이나 주의사항을 입력하세요."
                        required
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={noticeLoading}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor
