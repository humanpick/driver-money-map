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
  BarChart3,
  Trash2,
  Copy,
  Car,
  Edit2,
  Filter,
  RotateCcw,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  Smartphone
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
  grossAmount: number;
  feeRate: number;
  tipAmount: number;
  netAmount: number;
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

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'records' | 'expense' | 'wallet' | 'analytics'>('records');

  // 날짜 필터 상태 (기본: 오늘 날짜)
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-09');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  // 계정 보안 모달
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 운행 기록 수정 모달 상태
  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);

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
      tipAmount: 5000,
      netAmount: 73000,
    },
    {
      id: '2',
      date: '2026-11-08',
      startTime: '13:00',
      endTime: '15:30',
      departure: '서울 강남',
      destination: '경기 평택',
      grossAmount: 65000,
      feeRate: 20,
      tipAmount: 0,
      netAmount: 52000,
    },
  ]);

  // 지출 내역 리스트
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: '1',
      date: '2026-11-09',
      category: '대중교통',
      amount: 4200,
      memo: '복귀 지하철 + 광역버스',
    },
  ]);

  // 사용자 로컬 기기(localStorage) 전용 계좌 리스트 상태
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('jundriver_local_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('로컬 계좌 로드 실패:', e);
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

  // 로컬 계좌 상태 변경 시 localStorage 자동 갱신
  useEffect(() => {
    try {
      localStorage.setItem('jundriver_local_accounts', JSON.stringify(accounts));
    } catch (e) {
      console.error('로컬 계좌 저장 실패:', e);
    }
  }, [accounts]);

  // 신규 등록 폼 상태
  const [newDate, setNewDate] = useState('2026-11-09');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newDeparture, setNewDeparture] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newGross, setNewGross] = useState('');
  const [newFeeRate, setNewFeeRate] = useState('20');
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
      setAuthError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      setAuthLoading(false);
      return;
    }

    if (!agreePrivacy) {
      setAuthError('개인정보 수집 및 이용에 동의하셔야 가입이 가능합니다.');
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
          privacy_policy_version: 'v1.1_local_wallet',
        },
      },
    });

    if (error) {
      setAuthError('가입 실패: ' + error.message);
    } else {
      if (data.session) {
        setAuthSuccess('회원가입이 완료되어 자동 로그인되었습니다.');
      } else {
        setAuthSuccess('회원가입 요청이 완료되었습니다. 로그인해 주세요.');
        setAuthMode('login');
      }
    }
    setAuthLoading(false);
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileModal(false);
  };

  // 비밀번호 변경 핸들러
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: '비밀번호는 최소 6자리 이상이어야 합니다.' });
      return;
    }

    setPwdLoading(true);
    setPwdMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPwdMessage({ type: 'error', text: '변경 실패: ' + error.message });
    } else {
      setPwdMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      setNewPassword('');
    }
    setPwdLoading(false);
  };

  // 운행 등록 핸들러
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = Number(newGross) || 0;
    const feeRate = Number(newFeeRate) || 0;
    const tip = Number(newTip) || 0;
    const feeAmount = gross * (feeRate / 100);
    const net = gross - feeAmount + tip;

    const newRecord: DrivingRecord = {
      id: Date.now().toString(),
      date: newDate,
      startTime: newStartTime || '-',
      endTime: newEndTime || '-',
      departure: newDeparture,
      destination: newDestination,
      grossAmount: gross,
      feeRate,
      tipAmount: tip,
      netAmount: Math.round(net),
    };

    setRecords([newRecord, ...records]);
    setNewDeparture('');
    setNewDestination('');
    setNewGross('');
    setNewTip('');
  };

  // 운행 기록 수정 저장 핸들러
  const handleUpdateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const gross = Number(editingRecord.grossAmount) || 0;
    const feeRate = Number(editingRecord.feeRate) || 0;
    const tip = Number(editingRecord.tipAmount) || 0;
    const feeAmount = gross * (feeRate / 100);
    const net = gross - feeAmount + tip;

    const updated: DrivingRecord = {
      ...editingRecord,
      netAmount: Math.round(net),
    };

    setRecords(records.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRecord(null);
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

  // 기기 로컬 계좌 추가 핸들러 (서버 저장 X, localStorage 보관)
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

  // 기기 로컬 계좌 삭제 핸들러
  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  // 월간 집계
  const currentMonthPrefix = selectedDate.substring(0, 7);
  const monthlyRecords = records.filter((r) => r.date.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  // 일자별/선택기간 집계
  const filteredRecords = filterAllDates
    ? records
    : records.filter((r) => r.date === selectedDate);
  const filteredExpenses = filterAllDates
    ? expenses
    : expenses.filter((e) => e.date === selectedDate);
  const dailyGross = filteredRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const dailyNet = filteredRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const dailyExpense = filteredExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const dailyProfit = dailyNet - dailyExpense;

  // 1. 미로그인: 로그인 및 개인정보 동의 화면
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-indigo-500 selection:text-white">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[420px] bg-[#0E1424]/90 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-center shadow-inner mb-3">
              <Wallet className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex items-center gap-1">
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
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-600/20 border border-indigo-400/20 transition-all duration-150 disabled:opacity-50 mt-2 cursor-pointer"
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
                  placeholder="name@driver.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호 (6자리 이상)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 설정"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재입력"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
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
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="privacyCheck" className="text-xs text-slate-200 font-medium cursor-pointer leading-tight">
                      [필수] 개인정보 수집 및 운행일지 클라우드 저장에 동의합니다.
                    </label>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pl-6">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> 계좌번호는 서버 저장 없이 기기에만 보관
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center font-semibold cursor-pointer underline"
                    >
                      전문보기 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-600/20 border border-indigo-400/20 transition-all duration-150 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {authLoading ? '계정 생성 중...' : '동의하고 회원가입 완료'}
              </button>
            </form>
          )}
        </div>

        {/* 개인정보 처리방침 모달 */}
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">개인정보 수집 및 보관 방침 전문</h3>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-3.5 max-h-[360px] overflow-y-auto leading-relaxed">
                <div>
                  <h4 className="font-bold text-white mb-1">1. 수집하는 정보 및 저장 위치 구분</h4>
                  <p className="text-slate-400">
                    - <strong className="text-indigo-300">클라우드 서버(Supabase) 저장 항목:</strong> 이메일 계정, 암호화된 비밀번호, 탁송/대리 운행 기록(일자, 출발지, 도착지, 매출, 수수료, 팁), 지출 내역<br />
                    - <strong className="text-emerald-300">사용자 기기(로컬) 전용 보관 항목:</strong> 송금 및 입금용 은행 계좌 정보는 중앙 데이터베이스에 일체 저장되지 않으며, 사용자 본인의 스마트폰/PC 웹 브라우저(localStorage)에만 안전하게 독립 보관됩니다.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-1">2. 개인정보 수집 및 이용 목적</h4>
                  <p className="text-slate-400">
                    - 기사 회원 식별 및 로그인 상태 유지<br />
                    - 운행 일지 및 수입·지출 데이터의 기기 간 백업 및 동기화
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-1">3. 보유 및 이용 기간</h4>
                  <p className="text-slate-400">
                    - 클라우드 계정 데이터는 회원 탈퇴 시까지 보관되며, 탈퇴 시 지체 없이 파기됩니다.<br />
                    - 로컬 계좌 정보는 브라우저 캐시 삭제 시 또는 본인이 삭제 버튼을 누를 때 즉시 삭제됩니다.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-1">4. 동의를 거부할 권리</h4>
                  <p className="text-slate-400">
                    귀하는 개인정보 수집 동의를 거부할 권리가 있으며, 거부 시 회원가입 및 클라우드 운행일지 동기화 기능 이용이 제한됩니다.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setAgreePrivacy(true);
                    setShowPrivacyModal(false);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  확인하고 동의하기
                </button>
              </div>
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">JunDriver</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
                PRO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setShowProfileModal(true);
                setPwdMessage(null);
                setNewPassword('');
              }}
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
        
        {/* 1. 최상단: 당월 누적 결산 바 */}
        <section className="bg-gradient-to-r from-[#0E1424] via-[#121B30] to-[#0E1424] border border-indigo-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                {currentMonthPrefix.replace('-', '년 ')}월 총 누적 결산 지표
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              월간 집계 ({monthlyRecords.length}회 운행)
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 총 매출액</div>
              <div className="text-xl lg:text-2xl font-extrabold text-white">
                {monthlyGross.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 운행 수입 (순수익)</div>
              <div className="text-xl lg:text-2xl font-extrabold text-indigo-300">
                {monthlyNet.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 총 지출</div>
              <div className="text-xl lg:text-2xl font-extrabold text-rose-400">
                -{monthlyExpense.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 mb-0.5">당월 최종 실수령액</div>
              <div className="text-xl lg:text-2xl font-extrabold text-emerald-400">
                {monthlyProfit.toLocaleString()}<span className="text-xs font-normal text-slate-400 ml-1">원</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 일자별 조회 필터 바 */}
        <div className="bg-[#0E1424]/90 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 text-white text-xs font-bold">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>조회 기준 일자:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setFilterAllDates(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-white text-slate-900 font-bold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterAllDates(!filterAllDates)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterAllDates
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {filterAllDates ? '전체 기간 조회 중' : '전체 내역 보기'}
            </button>
            <span className="text-xs text-slate-400">
              {filterAllDates ? '누적 전체' : `${selectedDate} 기준`}
            </span>
          </div>
        </div>

        {/* 3. 당일(선택 일자) 지표 바 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{filterAllDates ? '전체 총 매출' : '당일 매출액'}</span>
              <DollarSign className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-lg lg:text-xl font-bold text-white">
              {dailyGross.toLocaleString()}<span className="text-xs text-slate-400 font-normal ml-1">원</span>
            </div>
          </div>

          <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{filterAllDates ? '전체 순수익' : '당일 운행 수입'}</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg lg:text-xl font-bold text-indigo-300">
              {dailyNet.toLocaleString()}<span className="text-xs text-slate-400 font-normal ml-1">원</span>
            </div>
          </div>

          <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{filterAllDates ? '전체 지출' : '당일 지출'}</span>
              <Receipt className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-lg lg:text-xl font-bold text-rose-400">
              -{dailyExpense.toLocaleString()}<span className="text-xs text-slate-400 font-normal ml-1">원</span>
            </div>
          </div>

          <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-4 border-emerald-500/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{filterAllDates ? '전체 실수령액' : '당일 실수령액'}</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg lg:text-xl font-bold text-emerald-400">
              {dailyProfit.toLocaleString()}<span className="text-xs text-slate-400 font-normal ml-1">원</span>
            </div>
          </div>
        </div>

        {/* 4. 탭 네비게이션 */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'records'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            운행 일지 등록 & 목록
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'expense'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            지출 장부
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'wallet'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            기사 송금 계좌 (기기 로컬)
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            수익 통계 요약
          </button>
        </div>

        {/* TAB 1: 운행 일지 */}
        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                새 운행 배차 기록
              </h3>
              <form onSubmit={handleAddRecord} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">출발 시각</label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">도착 시각</label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
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
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
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
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">운행료(원)</label>
                    <input
                      type="number"
                      placeholder="85000"
                      value={newGross}
                      onChange={(e) => setNewGross(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label>
                    <input
                      type="number"
                      value={newFeeRate}
                      onChange={(e) => setNewFeeRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">팁/추가(원)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newTip}
                      onChange={(e) => setNewTip(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md mt-2 cursor-pointer"
                >
                  운행 일지 등록
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  운행 일지 목록 ({filteredRecords.length}건)
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {filterAllDates ? '전체 보기' : selectedDate}
                </span>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  해당 날짜에 등록된 운행 일지가 없습니다.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {filteredRecords.map((r) => (
                    <div
                      key={r.id}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            <span>{r.departure}</span>
                            <span className="text-slate-500">➔</span>
                            <span>{r.destination}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {r.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {r.startTime} ~ {r.endTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">
                            매출 {r.grossAmount.toLocaleString()}원 (수수료 {r.feeRate}%)
                          </div>
                          <div className="text-sm font-bold text-emerald-400">
                            순수입 +{r.netAmount.toLocaleString()}원
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingRecord(r)}
                            className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRecords(records.filter((item) => item.id !== r.id))}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: 지출 장부 */}
        {activeTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-rose-400" />
                지출 내역 등록
              </h3>
              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 일자</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 분류</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="대중교통">대중교통 (셔틀/지하철/버스)</option>
                    <option value="택시비">택시비 (야간 이동)</option>
                    <option value="주유비">주유/충전비</option>
                    <option value="식대">식비 및 간식</option>
                    <option value="통행료">하이패스/통행료</option>
                    <option value="기타">기타 부대비용</option>
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
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">메모</label>
                  <input
                    type="text"
                    placeholder="예: 송도 복귀 광역버스"
                    value={expMemo}
                    onChange={(e) => setExpMemo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all shadow-md mt-2 cursor-pointer"
                >
                  지출 등록
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-400" />
                지출 내역 목록 ({filteredExpenses.length}건)
              </h3>
              {filteredExpenses.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  해당 날짜에 등록된 지출 내역이 없습니다.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700">
                            {exp.category}
                          </span>
                          <span className="text-sm text-white font-medium">{exp.memo || '-'}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{exp.date}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-rose-400">
                          -{exp.amount.toLocaleString()}원
                        </span>
                        <button
                          onClick={() => setExpenses(expenses.filter((e) => e.id !== exp.id))}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 송금 계좌 (로컬 브라우저 독립 보관) */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  송금용 계좌 추가
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>계좌번호는 서버로 전송되지 않고 현재 기기 브라우저에만 저장됩니다.</span>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">은행명</label>
                  <input
                    type="text"
                    placeholder="예: 신한, 국민, 카카오뱅크"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">계좌번호</label>
                  <input
                    type="text"
                    placeholder="하이픈 포함 입력"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">예금주</label>
                  <input
                    type="text"
                    placeholder="예금주 성함"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md mt-2 cursor-pointer"
                >
                  현재 기기에 안전 저장
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  기기 로컬 저장 계좌 ({accounts.length}개)
                </h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  기기 로컬 보관 (DB 미전송)
                </span>
              </div>

              {accounts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  등록된 계좌가 없습니다. 좌측에서 계좌를 추가해 보세요.
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{acc.bankName}</span>
                          <span className="text-xs text-slate-400">({acc.holder})</span>
                        </div>
                        <div className="text-sm font-mono text-indigo-300 mt-1">{acc.accountNumber}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(acc.accountNumber);
                            alert('계좌번호가 클립보드에 복사되었습니다.');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          복사
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: 통계 요약 */}
        {activeTab === 'analytics' && (
          <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              수익 및 지출 결산 리포트 ({filterAllDates ? '전체 누적' : selectedDate})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">해당 기간 운행 횟수</span>
                <div className="text-xl font-bold text-white mt-1">{filteredRecords.length}회</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">평균 건당 매출</span>
                <div className="text-xl font-bold text-white mt-1">
                  {filteredRecords.length > 0 ? Math.round(dailyGross / filteredRecords.length).toLocaleString() : 0}원
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">지출 대비 순수익률</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {dailyGross > 0 ? ((dailyProfit / dailyGross) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 운행 일지 수정 모달 */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Edit2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">운행 일지 수정</h3>
            </div>

            <form onSubmit={handleUpdateRecord} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label>
                <input
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">출발 시각</label>
                  <input
                    type="time"
                    value={editingRecord.startTime}
                    onChange={(e) => setEditingRecord({ ...editingRecord, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">도착 시각</label>
                  <input
                    type="time"
                    value={editingRecord.endTime}
                    onChange={(e) => setEditingRecord({ ...editingRecord, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label>
                  <input
                    type="text"
                    value={editingRecord.destination}
                    onChange={(e) => setEditingRecord({ ...editingRecord, destination: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">운행료(원)</label>
                  <input
                    type="number"
                    value={editingRecord.grossAmount}
                    onChange={(e) => setEditingRecord({ ...editingRecord, grossAmount: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label>
                  <input
                    type="number"
                    value={editingRecord.feeRate}
                    onChange={(e) => setEditingRecord({ ...editingRecord, feeRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">팁(원)</label>
                  <input
                    type="number"
                    value={editingRecord.tipAmount}
                    onChange={(e) => setEditingRecord({ ...editingRecord, tipAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                >
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 팝업 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">비밀번호 변경</h3>
                <p className="text-xs text-slate-400">{session.user.email}</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  새 비밀번호 (6자리 이상)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                />
              </div>

              {pwdMessage && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                    pwdMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {pwdMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{pwdMessage.text}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {pwdLoading ? '변경 중...' : '변경 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
