import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  MessageSquare,
  Check,
  Edit2
} from 'lucide-react';

// Supabase 클라이언트 초기화
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DrivingRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  departure: string;
  destination: string;
  grossAmount: number; // 탁송료
  feeRate: number; // 수수료율
  fuelAmount: number; // 대납 주유비
  receiptImage?: string; // 영수증
  isPaid: boolean; // 입금 여부
  netAmount: number; // 순수입 (탁송료 - 수수료)
  totalClaimAmount: number; // 총 청구액 (탁송료 + 주유비)
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
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // 탭 상태: records(운행일지), claims(청구문자 관리), expense(경비장부), wallet(송금계좌)
  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'wallet'>('records');

  // 날짜 필터 상태 (기본: 오늘 날짜)
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-09');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  // 계정 보안 모달
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 운행 일지 수정 모달 상태
  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);

  // 영수증 사진 확대 모달 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 청구 문자 전용 모달 및 개별 항목 선택 상태
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true);
  const [includeFuel, setIncludeFuel] = useState(true);
  const [claimMessageText, setClaimMessageText] = useState('');

  // 파일 입력 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 운행 기록 리스트
  const [records, setRecords] = useState<DrivingRecord[]>([
    {
      id: '1',
      date: '2026-11-09',
      startTime: '08:30',
      endTime: '11:00',
      departure: '경기 광주',
      destination: '인천 송도',
      grossAmount: 85000,
      feeRate: 20,
      fuelAmount: 50000,
      isPaid: false,
      netAmount: 68000,
      totalClaimAmount: 135000,
    },
    {
      id: '2',
      date: '2026-11-06',
      startTime: '13:00',
      endTime: '15:30',
      departure: '서울 강남',
      destination: '경기 평택',
      grossAmount: 65000,
      feeRate: 20,
      fuelAmount: 30000,
      isPaid: false,
      netAmount: 52000,
      totalClaimAmount: 95000,
    },
  ]);

  // 경비 지출 리스트
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: '1',
      date: '2026-11-09',
      category: '대중교통',
      amount: 4200,
      memo: '복귀 지하철 + 광역버스',
    },
  ]);

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

  // 운행 등록 폼 상태
  const [newDate, setNewDate] = useState('2026-11-09');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newDeparture, setNewDeparture] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newGross, setNewGross] = useState('');
  const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFuel, setNewFuel] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');

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
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로그인 핸들러
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.');
    }
    setAuthLoading(false);
  };

  // 회원가입 핸들러
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

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
      setAuthError('개인정보 수집 및 이용에 동의해 주세요.');
      setAuthLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          privacy_policy_agreed: true,
          privacy_policy_agreed_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      setAuthError('가입 실패: ' + error.message);
    } else {
      if (data.session) {
        setAuthSuccess('회원가입이 완료되었습니다.');
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

  // 갤러리 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setReceiptImage(imageUrl);
    }
  };

  // 운행 등록 핸들러
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = Number(newGross) || 0;
    const feeRate = Number(newFeeRate) || 0;
    const fuel = Number(newFuel) || 0;
    const feeAmount = gross * (feeRate / 100);
    const net = gross - feeAmount;
    const claimTotal = gross + fuel;

    const newRecord: DrivingRecord = {
      id: Date.now().toString(),
      date: newDate,
      startTime: newStartTime || '-',
      endTime: newEndTime || '-',
      departure: newDeparture,
      destination: newDestination,
      grossAmount: gross,
      feeRate,
      fuelAmount: fuel,
      receiptImage: receiptImage || undefined,
      isPaid: false,
      netAmount: Math.round(net),
      totalClaimAmount: Math.round(claimTotal),
    };

    setRecords([newRecord, ...records]);
    setNewDeparture('');
    setNewDestination('');
    setNewGross('');
    setNewFuel('');
    setReceiptImage('');
  };

  // 운행 기록 수정 저장 핸들러
  const handleUpdateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const gross = Number(editingRecord.grossAmount) || 0;
    const feeRate = Number(editingRecord.feeRate) || 0;
    const fuel = Number(editingRecord.fuelAmount) || 0;
    const feeAmount = gross * (feeRate / 100);
    const net = gross - feeAmount;
    const claimTotal = gross + fuel;

    const updated: DrivingRecord = {
      ...editingRecord,
      grossAmount: gross,
      feeRate,
      fuelAmount: fuel,
      netAmount: Math.round(net),
      totalClaimAmount: Math.round(claimTotal),
    };

    setRecords(records.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRecord(null);
  };

  // 입금 상태 토글
  const togglePaidStatus = (id: string) => {
    setRecords(records.map(r => r.id === id ? { ...r, isPaid: !r.isPaid } : r));
  };

  // 청구 문자 템플릿 실시간 동적 생성 함수
  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean) => {
    const primaryAccount = accounts[0] || { bankName: '은행명', accountNumber: '계좌번호', holder: '예금주' };
    
    let total = 0;
    let itemsText = '';

    if (withGross) {
      total += r.grossAmount;
      itemsText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`;
    }
    if (withFuel && r.fuelAmount > 0) {
      total += r.fuelAmount;
      itemsText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원 (영수증 첨부)\n`;
    }

    const title = withGross && withFuel && r.fuelAmount > 0
      ? '[탁송료 및 주유비 정산 요청]'
      : withFuel && r.fuelAmount > 0 && !withGross
      ? '[대납 주유비 정산 요청]'
      : '[탁송료 정산 요청]';

    return `${title}
* 운행일자: ${r.date}
* 운행구간: ${r.departure} ➔ ${r.destination}
${itemsText}--------------------------------
* 총 청구금액: ${total.toLocaleString()}원
* 입금계좌: ${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.holder})

확인 후 빠른 입금 부탁드립니다. 감사합니다.`;
  };

  // 청구 문자 모달 열기
  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r);
    setIncludeGross(true);
    setIncludeFuel(r.fuelAmount > 0);
    setClaimMessageText(buildClaimText(r, true, r.fuelAmount > 0));
    setClaimModalOpen(true);
  };

  // 체크박스 클릭 토글
  const handleToggleInclude = (type: 'gross' | 'fuel') => {
    if (!selectedClaimRecord) return;
    const newGross = type === 'gross' ? !includeGross : includeGross;
    const newFuel = type === 'fuel' ? !includeFuel : includeFuel;

    setIncludeGross(newGross);
    setIncludeFuel(newFuel);
    setClaimMessageText(buildClaimText(selectedClaimRecord, newGross, newFuel));
  };

  // 수정한 문자 복사
  const handleCopyClaimMessage = () => {
    navigator.clipboard.writeText(claimMessageText);
    alert('청구 문자가 복사되었습니다.\n문자나 카카오톡에 붙여넣기 하세요!');
    setClaimModalOpen(false);
  };

  // 경과일 계산
  const getElapsedDays = (recordDate: string) => {
    const today = new Date('2026-11-09');
    const target = new Date(recordDate);
    const diffTime = today.getTime() - target.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // 지출 등록 핸들러
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount) return;
    const newExp: ExpenseRecord = {
      id: Date.now().toString(),
      date: newDate,
      category: expCategory,
      amount: Number(expAmount) || 0,
      memo: expMemo,
    };
    setExpenses([newExp, ...expenses]);
    setExpAmount('');
    setExpMemo('');
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

  // 미수금 통계
  const unpaidRecords = records.filter(r => !r.isPaid);
  const totalUnpaidAmount = unpaidRecords.reduce((acc, cur) => acc + cur.totalClaimAmount, 0);
  const totalUnpaidFuel = unpaidRecords.reduce((acc, cur) => acc + cur.fuelAmount, 0);

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
  const dailyGross = filteredRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const dailyNet = filteredRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const dailyExpense = filteredExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const dailyProfit = dailyNet - dailyExpense;

  // 1. 미로그인 뷰
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-indigo-500 selection:text-white">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-[420px] bg-[#0E1424]/90 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-center shadow-inner mb-3">
              <Car className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">탁송 일지 & 주유비 정산</h1>
            <p className="text-xs text-slate-400 mt-1">대납 주유비 및 미수금 완벽 관리</p>
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
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">이메일 계정 (ID)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호 (6자리 이상)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm"
                />
              </div>

              <div className="pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="privacyCheck"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600"
                    />
                    <label htmlFor="privacyCheck" className="text-xs text-slate-200 font-medium cursor-pointer">
                      [필수] 개인정보 수집 및 운행일지 저장에 동의합니다.
                    </label>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pl-6">
                    <span className="text-emerald-400">계좌는 기기 로컬에만 보관됩니다.</span>
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-indigo-400 underline font-semibold">
                      전문보기
                    </button>
                  </div>
                </div>
              </div>

              {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">{authError}</div>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg cursor-pointer"
              >
                {authLoading ? '계정 생성 중...' : '동의하고 회원가입'}
              </button>
            </form>
          )}
        </div>

        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button onClick={() => setShowPrivacyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold text-white mb-3">개인정보 수집 및 이용 방침</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                탁송 운행 기록 및 주유비 청구 내역을 클라우드에 안전하게 보관합니다. 송금용 계좌 정보 및 영수증 사진은 외부 서버로 전송되지 않고 본인의 스마트폰/PC 로컬 브라우저에만 독립 보관됩니다.
              </p>
              <button
                type="button"
                onClick={() => { setAgreePrivacy(true); setShowPrivacyModal(false); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                확인 및 동의
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. 메인 대시보드
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans pb-20 selection:bg-indigo-500 selection:text-white">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 bg-[#0E1424]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">탁송 매니저</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
              PRO
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setShowProfileModal(true); setPwdMessage(null); setNewPassword(''); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 hover:border-indigo-500 transition-all text-xs text-slate-200 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium max-w-[140px] truncate">{session.user.email}</span>
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
                    (사비 대납 주유비 {totalUnpaidFuel.toLocaleString()}원 포함)
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
            <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              월간 집계 ({monthlyRecords.length}회 운행)
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 순수 탁송매출</div>
              <div className="text-xl lg:text-2xl font-extrabold text-white">
                {monthlyGross.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 탁송 순수입</div>
              <div className="text-xl lg:text-2xl font-extrabold text-indigo-300">
                {monthlyNet.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 경비 지출</div>
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
                        type="number"
                        placeholder="85000"
                        value={newGross}
                        onChange={(e) => setNewGross(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
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

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2.5">
                    <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-indigo-400" />
                      대납 주유/충전비 (100% 회수금)
                    </label>
                    <input
                      type="number"
                      placeholder="사비 선결제 금액 (없으면 0)"
                      value={newFuel}
                      onChange={(e) => setNewFuel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-xs"
                    />

                    <div className="pt-1">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        {receiptImage ? '영수증 첨부 완료 (변경)' : '스마트폰 갤러리에서 영수증 선택'}
                      </button>
                    </div>

                    {receiptImage && (
                      <div className="relative mt-2 p-1 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={receiptImage} alt="영수증" className="w-10 h-10 object-cover rounded" />
                          <span className="text-[11px] text-emerald-400 font-semibold">영수증 등록됨</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReceiptImage('')}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
                  >
                    운행 등록 (미입금 상태로 저장)
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
                  <div className="py-12 text-center text-slate-500 text-xs">해당 일자에 등록된 운행이 없습니다.</div>
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

                          <div className="pt-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 text-slate-400">
                              <span>탁송료: <strong className="text-white">{r.grossAmount.toLocaleString()}원</strong></span>
                              {r.fuelAmount > 0 && <span className="text-indigo-300 font-semibold">주유비: {r.fuelAmount.toLocaleString()}원</span>}
                              <span className="text-emerald-400 font-semibold">순익: +{r.netAmount.toLocaleString()}원</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {r.receiptImage && (
                                <button
                                  onClick={() => setPreviewImage(r.receiptImage || null)}
                                  className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 cursor-pointer"
                                  title="영수증 보기"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* [수정 버튼] 복구 완료 */}
                              <button
                                onClick={() => setEditingRecord(r)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-all cursor-pointer"
                                title="운행 내역 수정"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setRecords(records.filter((item) => item.id !== r.id))}
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
                  탁송료와 주유비를 선택적으로 합산하여 맞춤 청구문자를 전송할 수 있습니다.
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
                            <span className="text-white font-bold">합산 청구액: {r.totalClaimAmount.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {r.receiptImage && (
                          <button
                            onClick={() => setPreviewImage(r.receiptImage || null)}
                            className="p-2 rounded-lg bg-slate-800 text-indigo-400 hover:bg-slate-700 transition-all cursor-pointer"
                            title="주유 영수증 사진 확인"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}

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
                    type="number"
                    placeholder="4500"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
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
                  경비 등록
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
                      <button onClick={() => setExpenses(expenses.filter((e) => e.id !== exp.id))} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label>
                  <input
                    type="number"
                    value={editingRecord.grossAmount}
                    onChange={(e) => setEditingRecord({ ...editingRecord, grossAmount: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
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
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">대납 주유비</label>
                  <input
                    type="number"
                    value={editingRecord.fuelAmount}
                    onChange={(e) => setEditingRecord({ ...editingRecord, fuelAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs"
                  />
                </div>
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
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 청구 문자 선택 합산 및 직접 편집 모달 */}
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
              청구할 항목을 클릭해 선택하면 문구와 합산 금액이 실시간으로 변경됩니다.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => handleToggleInclude('gross')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                  includeGross
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <span>탁송운임</span>
                <span>{selectedClaimRecord.grossAmount.toLocaleString()}원</span>
              </button>

              <button
                type="button"
                disabled={selectedClaimRecord.fuelAmount <= 0}
                onClick={() => handleToggleInclude('fuel')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                  selectedClaimRecord.fuelAmount <= 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border-slate-800'
                    : includeFuel
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <span>대납 주유비</span>
                <span>{selectedClaimRecord.fuelAmount.toLocaleString()}원</span>
              </button>
            </div>

            <textarea
              rows={9}
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

      {/* 영수증 원본 보기 모달 */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-400" /> 주유 영수증 사진 확인
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center">
              <img src={previewImage} alt="영수증 원본" className="max-w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white mb-4">비밀번호 변경</h3>
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력 (6자리 이상)"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm"
              />
              {pwdMessage && <div className="p-3 text-xs rounded-lg bg-slate-800">{pwdMessage.text}</div>}
              <button type="submit" disabled={pwdLoading} className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg">
                {pwdLoading ? '변경 중...' : '변경 완료'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
