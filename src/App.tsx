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
  CalendarDays
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'records' | 'expense' | 'wallet' | 'analytics'>('records');

  // 날짜 필터 상태 (기본: 오늘 날짜)
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-09');
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);

  // 계정 모달
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

  // 저장 계좌 리스트
  const [accounts, setAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: '신한은행',
      accountNumber: '110-123-456789',
      holder: '공민준',
    },
  ]);

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

  // 세션 감지
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError('이메일 또는 비밀번호를 다시 확인해 주세요.');
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

  // 현재 선택된 월(YYYY-MM) 문자열 도출
  const currentMonthPrefix = selectedDate.substring(0, 7); // 예: '2026-11'

  // 1. 월간(Monthly) 통계 계산
  const monthlyRecords = records.filter((r) => r.date.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));

  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  // 2. 일별/선택기간(Filtered) 통계 계산
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

  // 1. 미로그인 뷰
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-indigo-500 selection:text-white">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-[390px] bg-[#0E1424]/90 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-13 h-13 p-3 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-center shadow-inner mb-4">
              <Wallet className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex items-center gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">JunDriver</h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">프로 기사용 스마트 디지털 지갑 & 운행 일지</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">이메일 계정</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@driver.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
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
                className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
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
              {authLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. 로그인 완료 대시보드
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

      {/* 메인 본문 컨테이너 */}
      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-6 space-y-6">
        
        {/* 1. 최상단: 당월(Monthly) 전체 누적 합계 지표 바 */}
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
            기사 송금 계좌
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
            {/* 운행 등록 폼 */}
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

            {/* 운행 일지 목록 */}
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

        {/* TAB 3: 송금 계좌 */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                송금용 계좌 추가
              </h3>
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
                  계좌 저장
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-[#0E1424]/80 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                등록된 입금/송금 계좌 ({accounts.length}개)
              </h3>
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
                          alert('계좌번호가 복사되었습니다.');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        복사
                      </button>
                      <button
                        onClick={() => setAccounts(accounts.filter((a) => a.id !== acc.id))}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
