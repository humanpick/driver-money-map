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
  Gift,
  Share2,
  UserX
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 천 단위 콤마 포맷터 & 언포맷 유틸리티
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
  id: string;
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

export default function App() {
  const [session, setSession] = useState<any>(null);
  
  // 인증 관련 상태
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState(''); // 이름(실명) 필수
  const [phone, setPhone] = useState(''); // 휴대폰번호 필수
  const [referrerId, setReferrerId] = useState(''); // 추천인 ID (선택)
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'wallet'>('records');

  // 날짜 필터 상태
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-10');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  // 계정 보안 및 탈퇴 모달
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // 운행 일지 수정 모달 상태
  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editGross, setEditGross] = useState('');
  const [editFuel, setEditFuel] = useState('');
  const [editExtra, setEditExtra] = useState('');
  const [editTip, setEditTip] = useState('');

  // 청구 문자 전용 모달 및 3대 항목 선택 상태
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true);
  const [includeFuel, setIncludeFuel] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true);
  const [claimMessageText, setClaimMessageText] = useState('');

  // 로딩 상태
  const [dataLoading, setDataLoading] = useState(false);

  // DB 연동 데이터 상태
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // 로컬 기기 저장 계좌
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

  // URL에서 추천인 파라미터(?ref=...) 자동 추출
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      setReferrerId(refParam.trim());
      setAuthMode('signup');
    }
  }, []);

  // 운행 등록 폼 상태
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

  // 지출 입력 폼 상태
  const [expCategory, setExpCategory] = useState('대중교통');
  const [expAmount, setExpAmount] = useState('');
  const [expMemo, setExpMemo] = useState('');

  // 계좌 추가 폼 상태
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState('');

  // Supabase 세션 감지
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // 탈퇴 유예 계정 차단 체크
      if (session?.user?.user_metadata?.is_deleted) {
        alert('탈퇴 신청된 계정입니다. (30일 유예 기간 후 완전 파기됩니다.)');
        supabase.auth.signOut();
        setSession(null);
        return;
      }
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata?.is_deleted) {
        supabase.auth.signOut();
        setSession(null);
        return;
      }
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setRecords([]);
        setExpenses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Supabase DB에서 데이터 불러오기
  const fetchUserData = async (userId: string) => {
    setDataLoading(true);
    try {
      const { data: recordsData, error: recordsError } = await supabase
        .from('driving_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (recordsError) {
        console.error('운행 일지 로드 오류:', recordsError);
      } else if (recordsData) {
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

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (expensesError) {
        console.error('경비 로드 오류:', expensesError);
      } else if (expensesData) {
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
    } catch (err) {
      console.error('데이터 통신 실패:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // 로그인 핸들러
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.');
    } else if (data.user?.user_metadata?.is_deleted) {
      setAuthError('탈퇴 신청된 계정입니다. 30일 경과 후 데이터가 영구 파기됩니다.');
      await supabase.auth.signOut();
    }
    setAuthLoading(false);
  };

  // 회원가입 핸들러 (이름, 휴대폰, 추천인ID 포함)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const trimmedName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!trimmedName) {
      setAuthError('이름(실명)을 입력해 주세요.');
      setAuthLoading(false);
      return;
    }

    if (cleanPhone.length < 10) {
      setAuthError('올바른 휴대폰 번호를 입력해 주세요.');
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
      setAuthError('개인정보 수집 및 베타 이용약관에 동의해 주세요.');
      setAuthLoading(false);
      return;
    }

    // 본인 번호를 추천인으로 기재하는 것 방지
    if (referrerId.trim() && referrerId.replace(/[^0-9]/g, '') === cleanPhone) {
      setAuthError('본인 휴대폰 번호는 추천인으로 등록할 수 없습니다.');
      setAuthLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: trimmedName,
          phone: phone.trim(),
          referral_code: cleanPhone, // 본인 휴대폰 번호가 고유 추천인 코드
          referrer_id: referrerId.trim() || null,
          privacy_policy_agreed: true,
          privacy_policy_agreed_at: new Date().toISOString(),
          beta_terms_agreed: true,
          terms_version: 'v1.4_referral_system',
        },
      },
    });

    if (error) {
      setAuthError('가입 실패: ' + error.message);
    } else {
      if (data.session) {
        setAuthSuccess('회원가입이 완료되었습니다! (추천인 1개월 무료 혜택 예약됨)');
      } else {
        setAuthSuccess('가입 완료! 로그인해 주세요.');
        setAuthMode('login');
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileModal(false);
    setShowWithdrawConfirm(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: '비밀번호는 최소 6자리 이상이어야 합니다.' });
      return;
    }
    setPwdLoading(true);
    setPwdMessage(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwdMessage({ type: 'error', text: '변경 실패: ' + error.message });
    } else {
      setPwdMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      setNewPassword('');
    }
    setPwdLoading(false);
  };

  // 회원 탈퇴 핸들러 (30일 유예 소프트 삭제)
  const handleWithdrawAccount = async () => {
    setWithdrawLoading(true);
    const now = new Date();
    const purgeDate = new Date();
    purgeDate.setDate(now.getDate() + 30); // 30일 뒤

    const { error } = await supabase.auth.updateUser({
      data: {
        is_deleted: true,
        deleted_at: now.toISOString(),
        scheduled_purge_at: purgeDate.toISOString(),
      },
    });

    if (error) {
      alert('탈퇴 처리 실패: ' + error.message);
      setWithdrawLoading(false);
      return;
    }

    alert('회원 탈퇴가 접수되었습니다.\n개인정보보호 및 분쟁 방지 정책에 따라 30일의 유예 기간 후 모든 운행 기록과 계정이 영구 삭제됩니다.\n그동안 이용해 주셔서 감사합니다.');
    await supabase.auth.signOut();
    setSession(null);
    setShowProfileModal(false);
    setShowWithdrawConfirm(false);
    setWithdrawLoading(false);
  };

  // 운행 등록 핸들러
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

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
      alert('DB 저장 오류 발생: ' + error.message);
      return;
    }

    const newRecord: DrivingRecord = {
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
    };

    setRecords([newRecord, ...records]);
    setNewDeparture('');
    setNewDestination('');
    setNewGross('');
    setNewFuel('');
    setNewExtraExpense('');
    setNewTip('');
  };

  // 수정 모달 열기 핸들러
  const handleOpenEditModal = (r: DrivingRecord) => {
    setEditingRecord(r);
    setEditGross(formatNumberWithComma(r.grossAmount));
    setEditFuel(formatNumberWithComma(r.fuelAmount));
    setEditExtra(formatNumberWithComma(r.extraExpenseAmount));
    setEditTip(formatNumberWithComma(r.tipAmount));
  };

  // 운행 기록 수정 저장 핸들러
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

    const updated: DrivingRecord = {
      ...editingRecord,
      grossAmount: gross,
      feeRate,
      fuelAmount: fuel,
      extraExpenseAmount: extraExp,
      tipAmount: tip,
      netAmount: Math.round(net),
      totalClaimAmount: Math.round(claimTotal),
    };

    setRecords(records.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRecord(null);
  };

  // 운행 기록 삭제 핸들러
  const handleDeleteRecord = async (id: string) => {
    const { error } = await supabase.from('driving_records').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
    setRecords(records.filter((r) => r.id !== id));
  };

  // 입금 상태 토글
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

  // 청구 문자 템플릿 생성
  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withExtra: boolean) => {
    const primaryAccount = accounts[0] || { bankName: '은행명', accountNumber: '계좌번호', holder: '예금주' };
    const driverPhone = session?.user?.user_metadata?.phone || '';
    const driverName = session?.user?.user_metadata?.name || '';
    
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
    alert('청구 문자가 복사되었습니다.\n문자나 카카오톡에 붙여넣기 하세요!');
    setClaimModalOpen(false);
  };

  const getElapsedDays = (recordDate: string) => {
    const today = new Date('2026-11-10');
    const target = new Date(recordDate);
    const diffTime = today.getTime() - target.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  // 경비 등록 핸들러
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

    const newExp: ExpenseRecord = {
      id: expenseId,
      date: newDate,
      category: expCategory,
      amount: cleanAmt,
      memo: expMemo,
    };

    setExpenses([newExp, ...expenses]);
    setExpAmount('');
    setExpMemo('');
  };

  // 경비 삭제 핸들러
  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // 계좌 추가 핸들러
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber) return;
    const newAcc: BankAccount = {
      id: Date.now().toString(),
      bankName,
      accountNumber,
      holder: holder || '본인',
    };
    setAccounts([...accounts, newAcc]);
    setBankName('');
    setAccountNumber('');
    setHolder('');
  };

  // 내 초대 링크 복사 함수
  const handleCopyInviteLink = () => {
    const myPhone = session?.user?.user_metadata?.phone?.replace(/[^0-9]/g, '');
    if (!myPhone) return;
    const inviteUrl = `${window.location.origin}?ref=${myPhone}`;
    navigator.clipboard.writeText(inviteUrl);
    alert(`동료 기사 초대 링크가 복사되었습니다!\n\n${inviteUrl}\n\n이 링크로 동료 기사가 가입하면 두 분 모두 유료화 시 'Pro 1개월 무료 이용권'이 적립됩니다.`);
  };

  // 미수금 통계
  const unpaidRecords = records.filter((r) => !r.isPaid);
  const totalUnpaidAmount = unpaidRecords.reduce((acc, cur) => acc + cur.totalClaimAmount, 0);
  const totalUnpaidReimbursements = unpaidRecords.reduce((acc, cur) => acc + cur.fuelAmount + cur.extraExpenseAmount, 0);

  // 월간 집계
  const currentMonthPrefix = selectedDate.substring(0, 7);
  const monthlyRecords = records.filter((r) => r.date.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  // 일자별 필터
  const filteredRecords = filterAllDates ? records : records.filter((r) => r.date === selectedDate);
  const filteredExpenses = filterAllDates ? expenses : expenses.filter((e) => e.date === selectedDate);

  // 1. 미로그인 뷰 (이름, 휴대폰, 추천인ID 포함)
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-indigo-500 selection:text-white">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-[440px] bg-[#0E1424]/90 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-center shadow-inner mb-3">
              <Car className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">JunDriver</h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">프로 기사용 스마트 디지털 지갑 & 운행 일지</p>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authMode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              회원가입
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">이메일 계정</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@driver.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}
              {authSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">{authSuccess}</div>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg cursor-pointer"
              >
                {authLoading ? '로그인 중...' : '클라우드 로그인'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">이메일 계정 (로그인 ID)</label>
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
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">이름 (실명)</label>
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
                  <label className="block text-[11px] font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-400" /> 휴대폰 번호
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                  />
                </div>
              </div>

              {/* 추천인 ID 입력칸 (선택) */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5 text-amber-400" /> 추천인 ID / 휴대폰번호 (선택)</span>
                  <span className="text-[10px] text-amber-400/80 font-normal">입력 시 1개월 무료권 제공</span>
                </label>
                <input
                  type="text"
                  value={referrerId}
                  onChange={(e) => setReferrerId(e.target.value)}
                  placeholder="추천인 휴대폰 번호 입력 (없으면 공란)"
                  className="w-full px-3.5 py-2 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-amber-500/40 focus:border-amber-500 focus:outline-none"
                />
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

              <div className="pt-1">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="privacyCheck"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="privacyCheck" className="text-xs text-slate-200 font-medium cursor-pointer leading-tight">
                      [필수] 개인정보 수집 및 <span className="text-amber-400 font-bold">오픈베타·추천인 혜택·유료전환 고지</span> 동의
                    </label>
                  </div>
                  
                  <div className="text-[10px] text-slate-400 pl-6 leading-tight space-y-0.5">
                    <div className="text-indigo-300 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" /> 내 휴대폰번호는 본인 식별 및 자동 추천인 코드로 활용
                    </div>
                    <div className="text-amber-300/80 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> 탈퇴 시 30일 유예 후 자동 영구 파기 (자동결제 없음)
                    </div>
                  </div>

                  <div className="text-right pt-0.5">
                    <button 
                      type="button" 
                      onClick={() => setShowPrivacyModal(true)} 
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
                    >
                      약관 및 탈퇴·유료화 고지 전문보기 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {authError && <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg cursor-pointer"
              >
                {authLoading ? '계정 생성 중...' : '동의하고 무료 회원가입'}
              </button>
            </form>
          )}
        </div>

        {/* 약관 및 고지 모달 */}
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">서비스 이용약관 및 개인정보 처리방침</h3>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-3.5 max-h-[380px] overflow-y-auto leading-relaxed">
                <div>
                  <h4 className="font-bold text-white mb-1">1. 수집하는 개인정보 항목 및 목적</h4>
                  <p className="text-slate-400">
                    - <strong>수집 항목:</strong> 로그인 이메일, 성명(이름), 휴대폰 번호, 추천인 ID, 암호화된 비밀번호, 운행 기록<br />
                    - <strong>이용 목적:</strong> 본인 식별, 청구문자 기사 정보 자동 기재, 추천인 보상 혜택 부여 및 유료 멤버십 무료 이용권 지급
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <h4 className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5 text-rose-400" />
                    2. 회원 탈퇴 및 데이터 자동 파기 정책 (30일 유예)
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    1) 회원은 앱 내 [계정 설정 ➔ 회원 탈퇴] 메뉴를 통해 언제든 탈퇴를 요청할 수 있습니다.<br />
                    2) 부정 이용 방지(추천인 보상 어뷰징, 미수금 정산 분쟁 방지)를 위해 탈퇴 신청 즉시 계정은 비활성화되며, <strong>탈퇴 신청일로부터 30일간 보관 후 시스템에서 자동으로 영구 삭제(파기)</strong>됩니다.<br />
                    3) 30일 유예 기간이 경과하면 복구가 불가능합니다.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    3. 추천인 제도 및 유료 멤버십 전환 혜택
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    1) 본 서비스(JunDriver)는 오픈 베타 기간 동안 전면 무료로 제공됩니다.<br />
                    2) 추천인을 기재하고 가입한 회원 및 동료를 추천한 회원에게는 향후 유료 전환 시 <strong>'Pro 1개월 무료 이용권'</strong> 등 차등 혜택이 누적 지급됩니다.<br />
                    3) 유료 전환 시 사용자의 명시적 신청 없는 자동 결제는 절대 발생하지 않습니다.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => { setAgreePrivacy(true); setShowPrivacyModal(false); }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all"
                >
                  위 내용을 모두 확인하였으며 동의합니다
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. 메인 대시보드
  const userName = session?.user?.user_metadata?.name || '기사';
  const userPhone = session?.user?.user_metadata?.phone;
  const myReferralCode = session?.user?.user_metadata?.referral_code || userPhone?.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans pb-20 selection:bg-indigo-500 selection:text-white">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 bg-[#0E1424]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">JunDriver</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
              PRO
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 동료 기사 초대 버튼 */}
            <button
              onClick={handleCopyInviteLink}
              title="추천 링크 복사하고 1달 무료권 받기"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition-all cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>동료 초대 (1달 무료)</span>
            </button>

            <button
              onClick={() => { setShowProfileModal(true); setPwdMessage(null); setNewPassword(''); setShowWithdrawConfirm(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 hover:border-indigo-500 transition-all text-xs text-slate-200 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-left max-w-[150px] truncate">
                <span className="block truncate font-bold text-white">{userName}님</span>
                {userPhone && <span className="block text-[10px] text-slate-400 font-mono">{userPhone}</span>}
              </div>
            </button>

            <button
              onClick={handleLogout}
              title="로그아웃"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 본문 컨테이너 */}
      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-6 space-y-6">
        
        {/* 미수금 알림 배너 */}
        {totalUnpaidAmount > 0 && (
          <section className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/40 border border-rose-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-300">정산 회수 필요 (미입금 내역)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    총 {unpaidRecords.length}건
                  </span>
                </div>
                <div className="text-xl font-extrabold text-white mt-0.5">
                  총 {totalUnpaidAmount.toLocaleString()}원{' '}
                  <span className="text-xs font-normal text-rose-300 ml-1">
                    (사비 대납 경비 {totalUnpaidReimbursements.toLocaleString()}원 포함)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('claims')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all self-start md:self-auto"
            >
              <MessageSquare className="w-3.5 h-3.5" /> 청구문자 관리 바로가기
            </button>
          </section>
        )}

        {/* 최상단 월 누적 결산 바 */}
        <section className="bg-gradient-to-r from-[#0E1424] via-[#121B30] to-[#0E1424] border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                {currentMonthPrefix.replace('-', '년 ')}월 총 누적 결산
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {dataLoading && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" /> 동기화 중...
                </span>
              )}
              <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                월간 집계 ({monthlyRecords.length}회 운행)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 순수 탁송매출</div>
              <div className="text-xl lg:text-2xl font-extrabold text-white">
                {monthlyGross.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 탁송 순수입 (팁 포함)</div>
              <div className="text-xl lg:text-2xl font-extrabold text-indigo-300">
                {monthlyNet.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 본인 경비 지출</div>
              <div className="text-xl lg:text-2xl font-extrabold text-rose-400">
                -{monthlyExpense.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 실수령액</div>
              <div className="text-xl lg:text-2xl font-extrabold text-emerald-400">
                {monthlyProfit.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>
          </div>
        </section>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'records' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            운행 일지 등록 & 목록
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'claims' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            청구문자 (미수금 관리)
            {unpaidRecords.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                {unpaidRecords.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'expense' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            일반 경비 장부
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'wallet' ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            기사 송금 계좌
          </button>
        </div>

        {/* TAB 1: 운행 일지 */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            <div className="bg-[#0E1424]/90 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span>조회 기준 일자:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setFilterAllDates(false); }}
                  className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterAllDates(!filterAllDates)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    filterAllDates ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {filterAllDates ? '전체 기간 조회 중' : '전체 내역 보기'}
                </button>
                <span className="text-xs text-slate-400">{filterAllDates ? '누적 전체' : `${selectedDate} 기준`}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 등록 폼 */}
              <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-indigo-400" />
                  새 운행 배차 등록
                </h3>
                <form onSubmit={handleAddRecord} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">출발 시각</label>
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">도착 시각</label>
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label>
                      <input
                        type="text"
                        placeholder="예: 경기 광주"
                        value={newDeparture}
                        onChange={(e) => setNewDeparture(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label>
                      <input
                        type="text"
                        placeholder="예: 인천 송도"
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="85,000"
                        value={newGross}
                        onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label>
                      <input
                        type="number"
                        value={newFeeRate}
                        onChange={(e) => setNewFeeRate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                      />
                    </div>
                  </div>

                  {/* 대납 주유비 & 대납 추가경비 */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                        <Fuel className="w-3.5 h-3.5 text-indigo-400" />
                        대납 주유/충전비 (회수금)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="선결제 금액 (예: 50,000)"
                        value={newFuel}
                        onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5 mb-1">
                        <Receipt className="w-3.5 h-3.5 text-sky-400" />
                        대납 추가경비 (통행료/세차비/주차비)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="선결제 추가 경비 (없으면 0)"
                        value={newExtraExpense}
                        onChange={(e) => setNewExtraExpense(formatNumberWithComma(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs"
                      />
                    </div>
                  </div>

                  {/* 순수 수입용 팁 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      손님 수고비 / 팁 (순수 기사 수익)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="청구문자 미포함, 내 순익에만 합산"
                      value={newTip}
                      onChange={(e) => setNewTip(formatNumberWithComma(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
                  >
                    운행 등록 (DB 영구 저장)
                  </button>
                </form>
              </div>

              {/* 목록 */}
              <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    운행 일지 내역 ({filteredRecords.length}건)
                  </h3>
                  <span className="text-xs text-slate-400">{filterAllDates ? '전체 보기' : selectedDate}</span>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    {dataLoading ? '데이터를 불러오는 중입니다...' : '등록된 운행 기록이 없습니다.'}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {filteredRecords.map((r) => {
                      const elapsed = getElapsedDays(r.date);
                      return (
                        <div key={r.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                            <div className="flex items-start sm:items-center gap-3">
                              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                  <span>{r.departure}</span>
                                  <span className="text-indigo-400">➔</span>
                                  <span>{r.destination}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.date}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.startTime} ~ {r.endTime}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => togglePaidStatus(r.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                r.isPaid
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {r.isPaid ? <><CheckCircle2 className="w-3.5 h-3.5" /> 입금완료</> : <><AlertCircle className="w-3.5 h-3.5" /> 미입금 ({elapsed}일 경과)</>}
                            </button>
                          </div>

                          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-3 text-slate-400">
                              <span>탁송료: <strong className="text-white">{r.grossAmount.toLocaleString()}원</strong></span>
                              {r.fuelAmount > 0 && <span className="text-indigo-300 font-semibold">주유비: {r.fuelAmount.toLocaleString()}원</span>}
                              {r.extraExpenseAmount > 0 && <span className="text-sky-300 font-semibold">대납경비: {r.extraExpenseAmount.toLocaleString()}원</span>}
                              <span className="text-emerald-400 font-semibold">순익: +{r.netAmount.toLocaleString()}원</span>
                              {r.tipAmount > 0 && <span className="text-emerald-300 text-[11px]">(팁 {r.tipAmount.toLocaleString()}원 포함)</span>}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditModal(r)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-all cursor-pointer"
                                title="운행 내역 수정"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteRecord(r.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

        {/* TAB 2: 청구문자 */}
        {activeTab === 'claims' && (
          <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  미수금 정산 및 청구문자 전송 관리
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  탁송운임, 대납 주유비, 대납 추가경비를 선택적으로 합산하여 맞춤 청구문자를 전송할 수 있습니다.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">미수금 총액</span>
                <span className="text-xl font-extrabold text-rose-400">{totalUnpaidAmount.toLocaleString()}원</span>
              </div>
            </div>

            {unpaidRecords.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                현재 미입금된 건이 없습니다. 모든 정산이 완료되었습니다!
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidRecords.map((r) => {
                  const elapsed = getElapsedDays(r.date);
                  const isUrgent = elapsed >= 3;
                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isUrgent
                          ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`p-2 rounded-xl shrink-0 ${isUrgent ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-amber-500/20 text-amber-400'}`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{r.departure} ➔ {r.destination}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                              isUrgent ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {elapsed === 0 ? '당일 미입금' : `${elapsed}일째 미입금`}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>운행일: {r.date}</span>
                            <span>탁송료: {r.grossAmount.toLocaleString()}원</span>
                            {r.fuelAmount > 0 && <span className="text-indigo-300 font-semibold">대납 주유비: {r.fuelAmount.toLocaleString()}원</span>}
                            {r.extraExpenseAmount > 0 && <span className="text-sky-300 font-semibold">대납 경비: {r.extraExpenseAmount.toLocaleString()}원</span>}
                            <span className="text-white font-bold">합산 청구액: {r.totalClaimAmount.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => openClaimMessageModal(r)}
                          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> 청구문자 선택·복사
                        </button>

                        <button
                          onClick={() => togglePaidStatus(r.id)}
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                          title="입금 확인 시 클릭"
                        >
                          <Check className="w-3.5 h-3.5" /> 입금완료 처리
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 일반 경비 장부 */}
        {activeTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-rose-400" />
                일반 경비 지출 등록
              </h3>
              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 일자</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 분류</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  >
                    <option value="대중교통">대중교통 (지하철/버스/셔틀)</option>
                    <option value="택시비">택시비 (야간 이동)</option>
                    <option value="식대">식비 및 간식</option>
                    <option value="통행료">통행료 (본인 부담)</option>
                    <option value="기타">기타 잡비</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 금액(원)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="4,500"
                    value={expAmount}
                    onChange={(e) => setExpAmount(formatNumberWithComma(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">메모</label>
                  <input
                    type="text"
                    placeholder="예: 송도 복귀 광역버스"
                    value={expMemo}
                    onChange={(e) => setExpMemo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg cursor-pointer">
                  경비 등록 (DB 저장)
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">경비 지출 내역 ({filteredExpenses.length}건)</h3>
              <div className="space-y-2.5">
                {filteredExpenses.map((exp) => (
                  <div key={exp.id} className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300">{exp.category}</span>
                        <span className="text-sm text-white font-medium">{exp.memo || '-'}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{exp.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-rose-400">-{exp.amount.toLocaleString()}원</span>
                      <button onClick={() => handleDeleteExpense(exp.id)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 기사 송금 계좌 */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2">정산 입금 계좌 추가</h3>
              <p className="text-[11px] text-emerald-400 mb-4">계좌 정보는 외부 서버에 저장되지 않고 기기에만 안전하게 보관됩니다.</p>
              <form onSubmit={handleAddAccount} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">은행명</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    placeholder="예: 신한은행"
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">계좌번호</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    placeholder="하이픈 포함 입력"
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">예금주</label>
                  <input
                    type="text"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="예금주 성함"
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg cursor-pointer">
                  현재 기기에 안전 저장
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">등록된 정산 계좌 ({accounts.length}개)</h3>
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{acc.bankName} ({acc.holder})</div>
                      <div className="text-sm font-mono text-indigo-300 mt-1">{acc.accountNumber}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { navigator.clipboard.writeText(acc.accountNumber); alert('계좌번호가 복사되었습니다.'); }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> 복사
                      </button>
                      <button onClick={() => setAccounts(accounts.filter((a) => a.id !== acc.id))} className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 운행 일지 수정 팝업 모달 */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Edit2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">운행 일지 내역 수정</h3>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">출발 시각</label>
                  <input
                    type="time"
                    value={editingRecord.startTime}
                    onChange={(e) => setEditingRecord({ ...editingRecord, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">도착 시각</label>
                  <input
                    type="time"
                    value={editingRecord.endTime}
                    onChange={(e) => setEditingRecord({ ...editingRecord, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label>
                  <input
                    type="text"
                    value={editingRecord.departure}
                    onChange={(e) => setEditingRecord({ ...editingRecord, departure: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label>
                  <input
                    type="text"
                    value={editingRecord.destination}
                    onChange={(e) => setEditingRecord({ ...editingRecord, destination: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editGross}
                    onChange={(e) => setEditGross(formatNumberWithComma(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label>
                  <input
                    type="number"
                    value={editingRecord.feeRate}
                    onChange={(e) => setEditingRecord({ ...editingRecord, feeRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-300 mb-1">대납 주유비</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editFuel}
                    onChange={(e) => setEditFuel(formatNumberWithComma(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-sky-300 mb-1">대납 추가경비</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editExtra}
                    onChange={(e) => setEditExtra(formatNumberWithComma(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">팁/수고비 (순익 가산용)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editTip}
                  onChange={(e) => setEditTip(formatNumberWithComma(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md cursor-pointer"
                >
                  수정 완료 (DB 갱신)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 청구 문자 3대 항목 선택 합산 및 편집 모달 */}
      {claimModalOpen && selectedClaimRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setClaimModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">정산 청구 항목 선택 및 문자 편집</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              청구할 항목을 클릭해 선택하면 문구와 합산 금액이 실시간으로 변경됩니다. (팁은 포함되지 않음)
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => handleToggleInclude('gross')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${
                  includeGross
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <span className="text-[10px] text-slate-400">탁송운임</span>
                <span className="mt-0.5">{selectedClaimRecord.grossAmount.toLocaleString()}원</span>
              </button>

              <button
                type="button"
                disabled={selectedClaimRecord.fuelAmount <= 0}
                onClick={() => handleToggleInclude('fuel')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${
                  selectedClaimRecord.fuelAmount <= 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border-slate-800'
                    : includeFuel
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <span className="text-[10px] text-slate-400">대납 주유비</span>
                <span className="mt-0.5">{selectedClaimRecord.fuelAmount.toLocaleString()}원</span>
              </button>

              <button
                type="button"
                disabled={selectedClaimRecord.extraExpenseAmount <= 0}
                onClick={() => handleToggleInclude('extra')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${
                  selectedClaimRecord.extraExpenseAmount <= 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border-slate-800'
                    : includeExtra
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <span className="text-[10px] text-slate-400">대납 추가경비</span>
                <span className="mt-0.5">{selectedClaimRecord.extraExpenseAmount.toLocaleString()}원</span>
              </button>
            </div>

            <textarea
              rows={10}
              value={claimMessageText}
              onChange={(e) => setClaimMessageText(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-white text-slate-950 font-medium text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-mono"
            />

            <div className="pt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleCopyClaimMessage}
                className="flex-1 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> 청구 문구 복사하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계정 관리, 비밀번호 변경 및 회원 탈퇴 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> 계정 및 보안 설정
            </h3>
            <p className="text-xs text-slate-400 mb-4">{session.user.email}</p>

            {/* 내 추천인 코드 및 초대 링크 카드 */}
            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-amber-500/30 mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-400" /> 내 추천인 ID
                </span>
                <span className="font-mono text-xs font-bold text-white">{myReferralCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Share2 className="w-3 h-3" /> 내 초대 링크 복사하기
              </button>
            </div>

            {/* 비밀번호 변경 폼 */}
            <form onSubmit={handleChangePassword} className="space-y-3 pb-5 border-b border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-300">비밀번호 변경</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (6자리 이상)"
                required
                className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
              />
              {pwdMessage && <div className="p-2.5 text-xs rounded-lg bg-slate-800">{pwdMessage.text}</div>}
              <button type="submit" disabled={pwdLoading} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg cursor-pointer">
                {pwdLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>

            {/* 회원 탈퇴 영역 */}
            <div className="pt-4">
              {!showWithdrawConfirm ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">더 이상 서비스를 이용하지 않으시나요?</span>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawConfirm(true)}
                    className="text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer text-xs"
                  >
                    회원 탈퇴
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2.5 animate-fadeIn">
                  <div className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    정말 회원 탈퇴를 진행하시겠습니까?
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    탈퇴 시 즉시 로그아웃되며, 개인정보보호 및 분쟁 방지 정책에 따라 <strong>30일 유예 후 운행 기록과 계정이 자동 영구 삭제</strong>됩니다.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowWithdrawConfirm(false)}
                      className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      disabled={withdrawLoading}
                      onClick={handleWithdrawAccount}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md"
                    >
                      {withdrawLoading ? '탈퇴 처리 중...' : '30일 후 자동삭제 탈퇴'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
