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
  Key
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 고정 관리자 기본 정보
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // 3중 봇 방지 상태
  const [honeypot, setHoneypot] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'wallet' | 'admin'>('records');
  const [adminSubTab, setAdminSubTab] = useState<'analytics' | 'members' | 'campaign'>('analytics');

  // 날짜 필터 상태
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-10');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  // 계정 보안 모달
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // 로딩 상태
  const [dataLoading, setDataLoading] = useState(false);

  // 데이터 상태
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // 공지 상태
  const [announcement, setAnnouncement] = useState<{ title: string; content: string; isActive: boolean }>({
    title: '오픈 베타 이벤트 안내',
    content: '운행 일지를 10건 이상 등록하신 기사님께 모바일 주유권을 증정합니다!',
    isActive: true,
  });

  // 관리자 전용 데이터 상태
  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [noticeTitleInput, setNoticeTitleInput] = useState('');
  const [noticeContentInput, setNoticeContentInput] = useState('');
  const [noticeActiveInput, setNoticeActiveInput] = useState(true);
  const [adminSavingNotice, setAdminSavingNotice] = useState(false);

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

  // 계좌 폼 상태
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState('');

  const fetchAnnouncement = async () => {
    try {
      const { data } = await supabase.from('announcements').select('*').eq('id', 'main_notice').maybeSingle();
      if (data) {
        setAnnouncement({
          title: data.title,
          content: data.content,
          isActive: Boolean(data.is_active),
        });
        setNoticeTitleInput(data.title);
        setNoticeContentInput(data.content);
        setNoticeActiveInput(Boolean(data.is_active));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserData = async (userId: string, userEmail: string) => {
    setDataLoading(true);
    try {
      // 관리자 이메일 자동 super_admin 부여
      let role = 'user';
      if (userEmail.toLowerCase() === ADMIN_DEFAULT_EMAIL.toLowerCase()) {
        role = 'super_admin';
        await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          name: ADMIN_DEFAULT_NAME,
          phone: ADMIN_DEFAULT_PHONE,
          role: 'super_admin'
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
    } finally {
      setDataLoading(false);
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
    fetchAnnouncement();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email || '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // 모바일 편의용 관리자 원클릭 접속 핸들러
  const handleQuickAdminBootstrap = async () => {
    const inputPwd = prompt('사용하실 관리자 비밀번호를 입력해 주세요 (6자리 이상):', 'admin1234!');
    if (!inputPwd || inputPwd.length < 6) {
      alert('비밀번호는 6자리 이상 입력해야 합니다.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    // 가입 시도
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_DEFAULT_EMAIL,
      password: inputPwd,
      options: {
        data: {
          name: ADMIN_DEFAULT_NAME,
          phone: ADMIN_DEFAULT_PHONE,
          role: 'super_admin'
        }
      }
    });

    // 이미 가입된 경우 즉시 로그인
    if (signUpError && signUpError.message.includes('already registered')) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_DEFAULT_EMAIL,
        password: inputPwd,
      });

      if (signInError) {
        alert('기존 비밀번호와 일치하지 않습니다. 다른 비밀번호로 로그인해 주세요.');
      } else {
        alert('관리자 계정으로 접속되었습니다.');
      }
    } else if (signUpData?.user) {
      // profiles 테이블에 직접 권한 등록
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        email: ADMIN_DEFAULT_EMAIL,
        name: ADMIN_DEFAULT_NAME,
        phone: ADMIN_DEFAULT_PHONE,
        role: 'super_admin'
      });
      alert('관리자 계정이 새로 생성되어 접속되었습니다.');
    } else if (signUpError) {
      alert('오류 발생: ' + signUpError.message);
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

  const handleOpenEditModal = (r: DrivingRecord) => {
    setEditingRecord(r);
    setEditGross(formatNumberWithComma(r.grossAmount));
    setEditFuel(formatNumberWithComma(r.fuelAmount));
    setEditExtra(formatNumberWithComma(r.extraExpenseAmount));
    setEditTip(formatNumberWithComma(r.tipAmount));
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !session) return;

    const gross = cleanNumber(editGross);
    const feeRate = cleanNumber(editingRecord.feeRate);
    const fuel = cleanNumber(editFuel);
    const extraExp = cleanNumber(editExtra);
    const tip = cleanNumber(editTip);

    const feeAmount = gross * (feeRate / 100);
    const net = gross - feeAmount + tip;
    const claimTotal = gross + fuel + extraExp;

    const { error } = await supabase
      .from('driving_records')
      .update({
        date: editingRecord.date,
        start_time: editingRecord.startTime,
        end_time: editingRecord.endTime,
        departure: editingRecord.departure,
        destination: editingRecord.destination,
        gross_amount: gross,
        fee_rate: feeRate,
        fuel_amount: fuel,
        extra_expense_amount: extraExp,
        tip_amount: tip,
        net_amount: Math.round(net),
        total_claim_amount: Math.round(claimTotal),
      })
      .eq('id', editingRecord.id);

    if (error) {
      alert('수정 실패: ' + error.message);
      return;
    }

    setRecords(
      records.map((r) =>
        r.id === editingRecord.id
          ? {
              ...editingRecord,
              grossAmount: gross,
              feeRate,
              fuelAmount: fuel,
              extraExpenseAmount: extraExp,
              tipAmount: tip,
              netAmount: Math.round(net),
              totalClaimAmount: Math.round(claimTotal),
            }
          : r
      )
    );
    setEditingRecord(null);
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

  const handleToggleInclude = (type: 'gross' | 'fuel' | 'extra') => {
    if (!selectedClaimRecord) return;
    const newGross = type === 'gross' ? !includeGross : includeGross;
    const newFuel = type === 'fuel' ? !includeFuel : includeFuel;
    const newExtra = type === 'extra' ? !includeExtra : includeExtra;

    setIncludeGross(newGross);
    setIncludeFuel(newFuel);
    setIncludeExtra(newExtra);
    setClaimMessageText(buildClaimText(selectedClaimRecord, newGross, newFuel, newExtra));
  };

  const handleCopyClaimMessage = () => {
    navigator.clipboard.writeText(claimMessageText);
    alert('청구 문자가 복사되었습니다.');
    setClaimModalOpen(false);
  };

  const getElapsedDays = (recordDate: string) => {
    const today = new Date('2026-11-10');
    const target = new Date(recordDate);
    const diffTime = today.getTime() - target.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmt = cleanNumber(expAmount);
    if (!cleanAmt || !session) return;
    const expenseId = 'exp_' + Date.now().toString();

    const insertPayload = {
      id: expenseId,
      user_id: session.user.id,
      date: newDate,
      category: expCategory,
      amount: cleanAmt,
      memo: expMemo,
    };

    const { error } = await supabase.from('expenses').insert([insertPayload]);
    if (error) {
      alert('경비 저장 실패: ' + error.message);
      return;
    }

    setExpenses([{ id: expenseId, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }, ...expenses]);
    setExpAmount('');
    setExpMemo('');
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber) return;
    setAccounts([...accounts, { id: Date.now().toString(), bankName, accountNumber, holder: holder || '본인' }]);
    setBankName('');
    setAccountNumber('');
    setHolder('');
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (currentUserRole !== 'super_admin') {
      alert('권한 변경은 최고 관리자만 가능합니다.');
      return;
    }
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    if (error) {
      alert('변경 실패: ' + error.message);
    } else {
      alert('권한이 변경되었습니다.');
      fetchAdminData();
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSavingNotice(true);
    const { error } = await supabase.from('announcements').upsert({
      id: 'main_notice',
      title: noticeTitleInput,
      content: noticeContentInput,
      is_active: noticeActiveInput,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert('공지 저장 실패: ' + error.message);
    } else {
      setAnnouncement({
        title: noticeTitleInput,
        content: noticeContentInput,
        isActive: noticeActiveInput,
      });
      alert('공지사항이 반영되었습니다.');
    }
    setAdminSavingNotice(false);
  };

  const handleExportAdminCSV = () => {
    if (adminAllRecords.length === 0) {
      alert('데이터가 없습니다.');
      return;
    }
    const headers = ['일자', '출발지', '도착지', '운임', '수수료율', '주유비', '경비', '순수익', '입금여부'];
    const rows = adminAllRecords.map((r) => [
      r.date,
      `"${r.departure}"`,
      `"${r.destination}"`,
      r.grossAmount,
      `${r.feeRate}%`,
      r.fuelAmount,
      r.extraExpenseAmount,
      r.netAmount,
      r.isPaid ? '입금완료' : '미입금',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `JunDriver_전체운행_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 통계 계산
  const unpaidRecords = records.filter((r) => !r.isPaid);
  const totalUnpaidAmount = unpaidRecords.reduce((acc, cur) => acc + cur.totalClaimAmount, 0);
  const totalUnpaidReimbursements = unpaidRecords.reduce((acc, cur) => acc + cur.fuelAmount + cur.extraExpenseAmount, 0);

  const currentMonthPrefix = selectedDate.substring(0, 7);
  const monthlyRecords = records.filter((r) => r.date.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  const filteredRecords = filterAllDates ? records : records.filter((r) => r.date === selectedDate);
  const filteredExpenses = filterAllDates ? expenses : expenses.filter((e) => e.date === selectedDate);

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

  // 미로그인 화면
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg cursor-pointer"
              >
                {authLoading ? '로그인 처리 중...' : '클라우드 로그인'}
              </button>

              {/* 관리자 비상 원클릭 버튼 */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleQuickAdminBootstrap}
                  className="w-full py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  관리자 계정 즉시 생성 및 바로 접속 (beat4989)
                </button>
              </div>
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
                <input type="checkbox" id="agreeChk" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
                <label htmlFor="agreeChk" className="text-xs text-slate-300">이용약관 및 개인정보 처리에 동의합니다.</label>
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

  // 메인 화면
  const userName = session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;
  const userPhone = formatPhoneNumber(session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans pb-20">
      <header className="sticky top-0 z-30 bg-[#0E1424]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">JunDriver</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">PRO</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdminUser && (
              <button
                onClick={() => { fetchAdminData(); setActiveTab('admin'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
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
        {announcement.isActive && activeTab !== 'admin' && (
          <section className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-indigo-400 animate-bounce" />
              <div>
                <div className="text-xs font-bold text-indigo-300">{announcement.title}</div>
                <div className="text-xs text-slate-300">{announcement.content}</div>
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
          <button onClick={() => setActiveTab('records')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${activeTab === 'records' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>운행 일지</button>
          <button onClick={() => setActiveTab('claims')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${activeTab === 'claims' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>청구문자</button>
          <button onClick={() => setActiveTab('expense')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${activeTab === 'expense' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>경비 장부</button>
          <button onClick={() => setActiveTab('wallet')} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${activeTab === 'wallet' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>계좌 관리</button>
          {isAdminUser && (
            <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg text-xs font-bold ml-auto cursor-pointer ${activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-amber-500/20 text-amber-300'}`}>관제탑</button>
          )}
        </div>

        {/* 운행 일지 */}
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
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded text-xs cursor-pointer">운행 등록</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">운행 내역 ({records.length}건)</h3>
              <div className="space-y-3">
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

        {/* 관제탑 */}
        {activeTab === 'admin' && isAdminUser && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button onClick={() => setAdminSubTab('analytics')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${adminSubTab === 'analytics' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'}`}>마케팅 통계</button>
              <button onClick={() => setAdminSubTab('members')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${adminSubTab === 'members' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'}`}>회원 관리 ({adminMemberList.length}명)</button>
              <button onClick={() => setAdminSubTab('campaign')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${adminSubTab === 'campaign' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'}`}>공지/이벤트</button>
            </div>

            {adminSubTab === 'analytics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0E1424] border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">총 회원</span>
                    <div className="text-2xl font-bold text-white mt-1">{adminMemberList.length}명</div>
                  </div>
                  <div className="bg-[#0E1424] border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">총 운행</span>
                    <div className="text-2xl font-bold text-indigo-400 mt-1">{adminAllRecords.length}건</div>
                  </div>
                  <div className="bg-[#0E1424] border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">총 운임규모</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">{adminAllRecords.reduce((acc, cur) => acc + cur.grossAmount, 0).toLocaleString()}원</div>
                  </div>
                  <div className="bg-[#0E1424] border border-slate-800 p-4 rounded-xl">
                    <span className="text-xs text-slate-400">대납 주유비</span>
                    <div className="text-2xl font-bold text-amber-400 mt-1">{adminAllRecords.reduce((acc, cur) => acc + cur.fuelAmount, 0).toLocaleString()}원</div>
                  </div>
                </div>

                <div className="bg-[#0E1424] border border-slate-800 p-5 rounded-xl">
                  <h4 className="font-bold text-white mb-3">인기 운행 노선 TOP 5</h4>
                  <div className="space-y-2">
                    {topRoutes.map(([route, count], idx) => (
                      <div key={route} className="flex justify-between p-3 bg-slate-900 rounded-lg text-xs">
                        <span className="font-bold text-white">{idx + 1}. {route}</span>
                        <span className="text-indigo-400 font-mono">{count}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === 'members' && (
              <div className="bg-[#0E1424] border border-slate-800 p-5 rounded-xl space-y-3">
                <input
                  type="text"
                  placeholder="회원 검색..."
                  value={adminSearchTerm}
                  onChange={(e) => setAdminSearchTerm(e.target.value)}
                  className="px-3 py-2 bg-white text-slate-900 rounded text-xs w-full max-w-xs"
                />
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-2.5">이름</th>
                      <th className="p-2.5">전화번호</th>
                      <th className="p-2.5">이메일</th>
                      <th className="p-2.5">권한</th>
                      <th className="p-2.5 text-right">권한 변경</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredAdminMembers.map((m) => (
                      <tr key={m.id}>
                        <td className="p-2.5 text-white font-bold">{m.name}</td>
                        <td className="p-2.5">{formatPhoneNumber(m.phone)}</td>
                        <td className="p-2.5">{m.email}</td>
                        <td className="p-2.5">{m.role}</td>
                        <td className="p-2.5 text-right">
                          <select
                            value={m.role}
                            onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1"
                          >
                            <option value="user">일반 기사</option>
                            <option value="vip_driver">우수 기사</option>
                            <option value="manager">운영 직원</option>
                            <option value="super_admin">최고 관리자</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminSubTab === 'campaign' && (
              <div className="bg-[#0E1424] border border-slate-800 p-5 rounded-xl">
                <form onSubmit={handleSaveAnnouncement} className="space-y-3 max-w-md">
                  <input
                    type="text"
                    value={noticeTitleInput}
                    onChange={(e) => setNoticeTitleInput(e.target.value)}
                    placeholder="공지 제목"
                    required
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded text-xs"
                  />
                  <textarea
                    rows={3}
                    value={noticeContentInput}
                    onChange={(e) => setNoticeContentInput(e.target.value)}
                    placeholder="공지 내용"
                    required
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="act"
                      checked={noticeActiveInput}
                      onChange={(e) => setNoticeActiveInput(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <label htmlFor="act" className="text-xs text-white">공지 활성화</label>
                  </div>
                  <button type="submit" disabled={adminSavingNotice} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded text-xs cursor-pointer">
                    {adminSavingNotice ? '저장 중...' : '공지 저장'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 청구 문자 모달 */}
      {claimModalOpen && selectedClaimRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0E1424] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2">정산 청구 문자 전송</h3>
            <textarea
              rows={8}
              value={claimMessageText}
              onChange={(e) => setClaimMessageText(e.target.value)}
              className="w-full p-3 bg-white text-slate-900 rounded text-xs font-mono mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setClaimModalOpen(false)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded text-xs cursor-pointer">닫기</button>
              <button onClick={handleCopyClaimMessage} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded text-xs cursor-pointer">복사하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0E1424] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">계정 정보</h3>
            <p className="text-xs text-slate-400 mb-4">{session.user.email}</p>
            <button onClick={() => setShowProfileModal(false)} className="w-full py-2 bg-slate-800 text-white rounded text-xs cursor-pointer">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
