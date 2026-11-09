import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, Plus, Building2, Trash2, Edit3, X, Save, CheckCircle2, AlertCircle, Clock, Wallet, LayoutDashboard, MapPin, Navigation, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Percent, Receipt, Coins, CreditCard, TrendingUp } from 'lucide-react';

// --- Types ---
interface DrivingRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
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
  category: '교통비' | '식비' | '숙박비' | '기타';
  memo: string;
  amount: number;
}

interface Settlement {
  id: string;
  company: string;
  amount: number;
  expectedDate: string;
  status: 'pending' | 'completed' | 'overdue';
}

interface RemittanceAccount {
  id: string;
  agencyName: string; 
  bankName: string;   
  accountNumber: string; 
  holder: string;     
}

export default function App() {
  // --- 활성 탭 관리 ---
  const [activeTab, setActiveTab] = useState<'driving' | 'settlement' | 'accounts'>('driving');

  // --- 날짜 관리 ---
  const getToday = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
  };
  const [selectedDate, setSelectedDate] = useState(getToday());

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const getFormattedDate = (dateString: string) => {
    const d = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`;
  };

  const currentMonthPrefix = selectedDate.substring(0, 7);
  const currentMonthDisplay = `${new Date(selectedDate).getMonth() + 1}월`;

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // --- State: 자주 쓰는 지역 (빠른 입력 칩) ---
  const [recentLocations, setRecentLocations] = useState<string[]>(['강남', '수원', '평택', '천안', '인천']);

  // --- State: 운행 기록 ---
  const [records, setRecords] = useState<DrivingRecord[]>([
    { id: '1', date: getToday(), startTime: '09:30', endTime: '10:45', duration: '1시간 15분', departure: '강남', destination: '수원', grossAmount: 50000, feeRate: 20, tipAmount: 5000, netAmount: 45000 },
  ]);
  
  const [startTime, setStartTime] = useState(getCurrentTime());
  const [endTime, setEndTime] = useState('');
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [feeRate, setFeeRate] = useState(20);
  const [tipAmount, setTipAmount] = useState('');

  // --- State: 지출 기록 ---
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    { id: '1', date: getToday(), category: '교통비', memo: '강남역 킥보드', amount: 3500 },
  ]);

  const [expCategory, setExpCategory] = useState<'교통비' | '식비' | '숙박비' | '기타'>('교통비');
  const [expMemo, setExpMemo] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // --- 계산 로직 ---
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h > 0 ? h + '시간 ' : ''}${m}분`;
  };

  const currentDuration = calculateDuration(startTime, endTime);
  const currentFee = grossAmount ? Number(grossAmount) * (feeRate / 100) : 0;
  const currentNetAmount = grossAmount ? (Number(grossAmount) - currentFee) + Number(tipAmount || 0) : 0;

  const filteredRecords = records.filter(r => r.date === selectedDate);
  const filteredExpenses = expenses.filter(e => e.date === selectedDate);
  const dailyDrivingNet = filteredRecords.reduce((sum, r) => sum + (r.grossAmount * (1 - r.feeRate / 100)), 0);
  const dailyTips = filteredRecords.reduce((sum, r) => sum + (r.tipAmount || 0), 0);
  const dailyExpenseTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyRealNetProfit = dailyDrivingNet + dailyTips - dailyExpenseTotal;

  const monthlyRecords = records.filter(r => r.date.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthPrefix));
  const monthlyDrivingNet = monthlyRecords.reduce((sum, r) => sum + (r.grossAmount * (1 - r.feeRate / 100)), 0);
  const monthlyTips = monthlyRecords.reduce((sum, r) => sum + (r.tipAmount || 0), 0);
  const monthlyExpenseTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyRealNetProfit = monthlyDrivingNet + monthlyTips - monthlyExpenseTotal;

  // --- Handlers: 운행 기록 추가 ---
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departure || !destination || !grossAmount) return;
    
    const newLocs = Array.from(new Set([departure, destination, ...recentLocations])).slice(0, 6);
    setRecentLocations(newLocs);

    const newRecord: DrivingRecord = {
      id: Date.now().toString(),
      date: selectedDate,
      startTime: startTime || getCurrentTime(),
      endTime: endTime || getCurrentTime(),
      duration: currentDuration || '0분',
      departure,
      destination,
      grossAmount: Number(grossAmount),
      feeRate,
      tipAmount: Number(tipAmount || 0),
      netAmount: currentNetAmount,
    };
    setRecords([newRecord, ...records]);
    setDeparture(''); setDestination(''); setGrossAmount(''); setTipAmount(''); setStartTime(getCurrentTime()); setEndTime('');
  };
  const handleDeleteRecord = (id: string) => setRecords(records.filter(r => r.id !== id));

  // --- Handlers: 지출 기록 추가 ---
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount) return;
    const newExp: ExpenseRecord = {
      id: Date.now().toString(),
      date: selectedDate,
      category: expCategory,
      memo: expMemo,
      amount: Number(expAmount)
    };
    setExpenses([newExp, ...expenses]);
    setExpMemo(''); setExpAmount('');
  };
  const handleDeleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  // --- State & Handlers: 정산 및 송금 계좌 ---
  const [settlements] = useState<Settlement[]>([
    { id: '1', company: '로지 플랫폼', amount: 145000, expectedDate: '2026-11-10', status: 'pending' },
  ]);
  const [accounts, setAccounts] = useState<RemittanceAccount[]>([
    { id: '1', agencyName: '로지 충전계좌', bankName: '국민은행', accountNumber: '123456-04-789012', holder: '(주)로지소프트' },
  ]);
  
  const totalPending = settlements.filter(s => s.status !== 'completed').reduce((sum, s) => sum + s.amount, 0);
  const totalOverdue = settlements.filter(s => s.status === 'overdue').reduce((sum, s) => sum + s.amount, 0);

  const [newAgency, setNewAgency] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newHolder, setNewHolder] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgency || !newAccount) return;
    setAccounts([{ id: Date.now().toString(), agencyName: newAgency, bankName: newBank || '미입력', accountNumber: newAccount, holder: newHolder || '미입력' }, ...accounts]);
    setNewAgency(''); setNewBank(''); setNewAccount(''); setNewHolder('');
  };
  const handleDeleteAccount = (id: string) => window.confirm('정말 삭제하시겠습니까?') && setAccounts(accounts.filter(acc => acc.id !== id));

  const renderMenuButton = (id: 'driving' | 'settlement' | 'accounts', Icon: any, label: string) => {
    const isActive = activeTab === id;
    return (
      <label className="cursor-pointer relative group">
        <input type="radio" name="sidebar-menu" className="hidden" checked={isActive} onChange={() => setActiveTab(id)} />
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
        }`}>
          <Icon className="w-5 h-5" />
          {label}
        </div>
      </label>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-['Pretendard'] flex overflow-hidden">
      
      {/* --- 왼쪽 사이드바 (기존 오리지널 디자인 복구) --- */}
      <aside className="w-64 min-h-screen bg-gradient-to-b from-[#0B1120] to-[#0f172a] border-r border-slate-800 flex flex-col p-4 shrink-0 hidden md:flex">
        <div className="flex items-center gap-3 mb-10 px-2 py-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-[#38BDF8] bg-clip-text text-transparent">JunDriver</h1>
            <p className="text-[10px] text-[#38BDF8]">드라이버 지갑</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {renderMenuButton('driving', CreditCard, '내 지갑 (가계부)')}
          {renderMenuButton('settlement', LayoutDashboard, '플랫폼 정산')}
          {renderMenuButton('accounts', Send, '송금 계좌 관리')}
        </nav>
      </aside>

      {/* --- 모바일 하단 탭 (기존 오리지널 디자인 복구) --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0B1120]/90 backdrop-blur-md border-t border-slate-800 flex justify-around p-2 z-50">
        <button onClick={() => setActiveTab('driving')} className={`flex flex-col items-center p-2 ${activeTab === 'driving' ? 'text-[#38BDF8]' : 'text-slate-500'}`}><CreditCard className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">지갑</span></button>
        <button onClick={() => setActiveTab('settlement')} className={`flex flex-col items-center p-2 ${activeTab === 'settlement' ? 'text-[#EC4899]' : 'text-slate-500'}`}><LayoutDashboard className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">정산</span></button>
        <button onClick={() => setActiveTab('accounts')} className={`flex flex-col items-center p-2 ${activeTab === 'accounts' ? 'text-[#8B5CF6]' : 'text-slate-500'}`}><Send className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">계좌</span></button>
      </div>

      {/* --- 메인 콘텐츠 영역 --- */}
      <main className="flex-1 flex justify-center p-4 sm:p-6 md:p-8 h-screen overflow-y-auto pb-24 md:pb-8 scroll-smooth">
        <div className="w-full max-w-[1200px] flex flex-col gap-6">
          
          {/* 모바일 상단 로고 (기존 오리지널 디자인 복구) */}
          <div className="md:hidden flex items-center gap-3 mb-2">
             <Wallet className="w-8 h-8 text-[#8B5CF6]" />
             <h1 className="text-xl font-bold bg-gradient-to-r from-white to-[#38BDF8] bg-clip-text text-transparent">JunDriver</h1>
          </div>

          {activeTab === 'driving' && (
            <section className="animate-fade-in space-y-6 md:space-y-8">
              
              {/* 월 총 수익 패널 */}
              <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-[#8B5CF6]/20 via-[#0B1120] to-[#EC4899]/20 border border-[#8B5CF6]/30 shadow-[0_10px_30px_rgba(139,92,246,0.15)] flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4">
                <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-[#8B5CF6] font-bold tracking-wider mb-1">{currentMonthDisplay} 누적 총수익</p>
                    <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                      {monthlyRealNetProfit.toLocaleString()} <span className="text-xl font-bold text-slate-400">원</span>
                    </p>
                  </div>
                </div>
                <div className="z-10 flex gap-4 text-xs font-medium w-full sm:w-auto justify-between sm:justify-end bg-[#0B1120]/50 p-3 rounded-xl border border-white/5">
                  <div className="flex flex-col"><span className="text-slate-400">총 팁 보너스</span><span className="text-[#38BDF8] font-bold">+{monthlyTips.toLocaleString()}</span></div>
                  <div className="w-px bg-slate-700"></div>
                  <div className="flex flex-col"><span className="text-slate-400">총 지출 누적</span><span className="text-[#EC4899] font-bold">-{monthlyExpenseTotal.toLocaleString()}</span></div>
                </div>
              </div>

              {/* 캘린더 네비게이션 (고급화 유지) */}
              <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mt-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">일일 지갑 현황</h2>
                  <p className="text-sm text-slate-400">선택하신 날짜의 상세 운행 및 지출 내역입니다.</p>
                </div>
                <div className="flex items-center gap-2 bg-[#0F172A]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-lg">
                  <button onClick={handlePrevDay} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft className="w-5 h-5 text-slate-300" /></button>
                  <div className="relative flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                    <CalendarIcon className="w-4 h-4 text-[#38BDF8]" />
                    <span className="text-base font-bold text-white tracking-wide">{getFormattedDate(selectedDate)}</span>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                  <button onClick={handleNextDay} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ChevronRight className="w-5 h-5 text-slate-300" /></button>
                </div>
              </div>

              {/* 일일 메인 월렛 (고급화 유지) */}
              <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0B1120] to-[#020617] border border-emerald-500/20 shadow-[0_10px_30px_rgba(16,185,129,0.1)] group">
                <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></div>
                      <p className="text-sm text-slate-300 font-medium tracking-wide">선택일 총 순수익</p>
                    </div>
                    <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 drop-shadow-lg">
                      {dailyRealNetProfit.toLocaleString()} <span className="text-2xl text-emerald-400/80 font-bold">원</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5 text-sm bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full md:w-auto shadow-inner">
                    <div className="flex justify-between gap-12 items-center"><span className="text-slate-400 font-medium">운행 정산금</span> <span className="font-bold text-white text-base">{dailyDrivingNet.toLocaleString()}원</span></div>
                    <div className="flex justify-between gap-12 items-center"><span className="text-slate-400 font-medium">팁 (보너스)</span> <span className="font-bold text-[#38BDF8] text-base">+{dailyTips.toLocaleString()}원</span></div>
                    <div className="w-full h-px bg-slate-700/50 my-1"></div>
                    <div className="flex justify-between gap-12 items-center"><span className="text-slate-400 font-medium">총 지출</span> <span className="font-bold text-[#EC4899] text-base">- {dailyExpenseTotal.toLocaleString()}원</span></div>
                  </div>
                </div>
              </div>

              {/* 운행 기록 폼 */}
              <div className="bg-slate-900/50 backdrop-blur-[16px] p-6 rounded-3xl border border-white/10 shadow-2xl">
                <h3 className="text-lg font-extrabold mb-5 text-[#8B5CF6] flex items-center gap-2"><Navigation className="w-5 h-5"/> 수입 등록</h3>
                <form onSubmit={handleAddRecord} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-4 py-2.5 rounded-xl font-bold text-sm shadow-inner focus-within:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0" /><span className="text-xs text-slate-500 shrink-0">출발</span>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-transparent focus:outline-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-4 py-2.5 rounded-xl font-bold text-sm shadow-inner focus-within:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <Clock className="w-4 h-4 text-pink-600 shrink-0" /><span className="text-xs text-slate-500 shrink-0">도착</span>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-transparent focus:outline-none" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-4 py-2.5 rounded-xl font-bold text-sm shadow-inner focus-within:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <MapPin className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                        <input type="text" placeholder="출발지" autoComplete="off" value={departure} onChange={e => setDeparture(e.target.value)} className="w-full bg-transparent focus:outline-none" />
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {recentLocations.map(loc => (
                          <button type="button" key={`dep-${loc}`} onClick={() => setDeparture(loc)} className="shrink-0 px-3 py-1 text-[11px] font-bold bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30 rounded-lg hover:bg-[#8B5CF6] hover:text-white transition-colors">{loc}</button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-4 py-2.5 rounded-xl font-bold text-sm shadow-inner focus-within:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        <input type="text" placeholder="도착지" autoComplete="off" value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-transparent focus:outline-none" />
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {recentLocations.map(loc => (
                          <button type="button" key={`dest-${loc}`} onClick={() => setDestination(loc)} className="shrink-0 px-3 py-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors">{loc}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center border-t border-white/5 pt-4 mt-1">
                    <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-4 py-2.5 rounded-xl font-bold text-sm shadow-inner focus-within:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      <span className="text-xs text-slate-500 shrink-0">총단가</span>
                      <input type="number" placeholder="예: 50000" value={grossAmount} onChange={e => setGrossAmount(e.target.value)} className="w-full bg-transparent focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-4 py-2.5 rounded-xl font-bold text-sm shadow-inner focus-within:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      <Percent className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-500 shrink-0">수수료</span>
                      <input type="number" value={feeRate} onChange={e => setFeeRate(Number(e.target.value))} className="w-[50px] bg-transparent focus:outline-none" /><span className="text-xs">%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-4 py-2.5 rounded-xl font-bold text-sm shadow-inner focus-within:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      <Coins className="w-4 h-4 text-amber-500" /><span className="text-xs text-slate-500 shrink-0">팁(선택)</span>
                      <input type="number" placeholder="0" value={tipAmount} onChange={e => setTipAmount(e.target.value)} className="w-full bg-transparent focus:outline-none" />
                    </div>
                    <div className="flex flex-col justify-center px-3 border-l border-white/10">
                      <span className="text-xs text-slate-400 font-medium">공제액: <span className="text-[#EC4899]">{currentFee.toLocaleString()}원</span></span>
                      <span className="text-sm font-extrabold text-emerald-400">실수령: {currentNetAmount.toLocaleString()}원</span>
                    </div>
                    <button type="submit" className="bg-gradient-to-r from-[#8B5CF6] to-[#4F46E5] hover:-translate-y-1 px-5 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-transform text-white shadow-[0_5px_20px_rgba(139,92,246,0.4)] h-full">
                      <Plus className="w-5 h-5" /> 지갑에 넣기
                    </button>
                  </div>
                </form>

                <div className="overflow-x-auto mt-6 border border-white/5 rounded-2xl">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-white/5">
                      <tr className="text-slate-400 text-xs">
                        <th className="py-3 px-4 rounded-tl-2xl">시간 (소요)</th>
                        <th className="py-3 px-4">동선 (출발➔도착)</th>
                        <th className="py-3 px-4">단가 (수수료)</th>
                        <th className="py-3 px-4 text-[#38BDF8]">팁</th>
                        <th className="py-3 px-4">실수령액</th>
                        <th className="py-3 px-4 text-right rounded-tr-2xl">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm bg-slate-900/20">
                      {filteredRecords.length === 0 && (<tr><td colSpan={6} className="py-8 text-center text-slate-500">운행 기록이 비어있습니다.</td></tr>)}
                      {filteredRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4"><div className="font-mono text-[#38BDF8] font-semibold">{r.startTime} ~ {r.endTime}</div><div className="text-xs text-slate-400">{r.duration}</div></td>
                          <td className="py-3 px-4 font-bold flex items-center gap-2 mt-2"><span className="text-white">{r.departure}</span><span className="text-[#8B5CF6] text-xs">➔</span><span className="text-white">{r.destination}</span></td>
                          <td className="py-3 px-4"><div className="text-slate-300">{r.grossAmount.toLocaleString()}원</div><div className="text-xs text-[#EC4899]">(-{r.feeRate}%)</div></td>
                          <td className="py-3 px-4 font-bold text-[#38BDF8]">{r.tipAmount > 0 ? `+${r.tipAmount.toLocaleString()}` : '-'}</td>
                          <td className="py-3 px-4 font-extrabold text-emerald-400">{r.netAmount.toLocaleString()}원</td>
                          <td className="py-3 px-4 text-right"><button onClick={() => handleDeleteRecord(r.id)} className="text-slate-500 hover:text-[#EC4899] p-1.5 rounded-lg hover:bg-white/10 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 지출 기록 폼 */}
              <div className="bg-slate-900/50 backdrop-blur-[16px] p-6 rounded-3xl border border-white/10 shadow-2xl">
                <h3 className="text-lg font-extrabold mb-5 text-[#EC4899] flex items-center gap-2"><Receipt className="w-5 h-5"/> 일일 지출 내역</h3>
                <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                  <select value={expCategory} onChange={e => setExpCategory(e.target.value as any)} className="bg-[#FFFFFF] text-[#000000] font-bold px-4 py-3 rounded-xl text-sm focus:outline-none shadow-inner">
                    <option>교통비</option><option>식비</option><option>숙박비</option><option>기타</option>
                  </select>
                  <input type="text" placeholder="사용처 (예: 킥보드, 우동)" value={expMemo} onChange={e => setExpMemo(e.target.value)} className="bg-[#FFFFFF] text-[#000000] font-bold px-4 py-3 rounded-xl text-sm focus:outline-none shadow-inner" />
                  <input type="number" placeholder="금액 (원)" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="bg-[#FFFFFF] text-[#000000] font-bold px-4 py-3 rounded-xl text-sm focus:outline-none shadow-inner focus-within:shadow-[0_0_15px_rgba(236,72,153,0.3)]" />
                  <button type="submit" className="bg-gradient-to-r from-[#EC4899] to-[#E11D48] hover:-translate-y-1 px-5 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-transform text-white shadow-[0_5px_20px_rgba(236,72,153,0.4)]">
                    <Plus className="w-5 h-5" /> 지출 추가
                  </button>
                </form>

                <div className="overflow-x-auto border border-white/5 rounded-2xl">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-white/5">
                      <tr className="text-slate-400 text-xs">
                        <th className="py-3 px-4 rounded-tl-2xl">분류</th>
                        <th className="py-3 px-4">사용처 내용</th>
                        <th className="py-3 px-4">지출 금액</th>
                        <th className="py-3 px-4 text-right rounded-tr-2xl">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm bg-slate-900/20">
                      {filteredExpenses.length === 0 && (<tr><td colSpan={4} className="py-8 text-center text-slate-500">지출 내역이 비어있습니다.</td></tr>)}
                      {filteredExpenses.map((e) => (
                        <tr key={e.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-300">{e.category}</td>
                          <td className="py-3 px-4 text-slate-400">{e.memo || '-'}</td>
                          <td className="py-3 px-4 font-extrabold text-[#EC4899]">- {e.amount.toLocaleString()}원</td>
                          <td className="py-3 px-4 text-right"><button onClick={() => handleDeleteExpense(e.id)} className="text-slate-500 hover:text-[#EC4899] p-1.5 rounded-lg hover:bg-white/10 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'settlement' && (
            <section className="bg-slate-900/50 backdrop-blur-[16px] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <LayoutDashboard className="w-6 h-6 text-[#38BDF8]" />
                <h2 className="text-xl sm:text-2xl font-extrabold">플랫폼 정산 및 미수금 현황</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/5 p-6 rounded-2xl border border-[#38BDF8]/30 shadow-inner"><span className="text-sm text-slate-400 font-medium">입금 대기 총액</span><p className="text-3xl font-extrabold text-[#38BDF8] mt-2">{totalPending.toLocaleString()}원</p></div>
                <div className="bg-white/5 p-6 rounded-2xl border border-[#EC4899]/30 shadow-inner"><span className="text-sm text-[#EC4899] font-medium flex items-center gap-2"><AlertCircle className="w-5 h-5" /> 주의 요망 미수금</span><p className="text-3xl font-extrabold text-[#EC4899] mt-2">{totalOverdue.toLocaleString()}원</p></div>
              </div>
            </section>
          )}

          {activeTab === 'accounts' && (
            <section className="bg-slate-900/50 backdrop-blur-[16px] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <Send className="w-6 h-6 text-[#8B5CF6]" />
                <h2 className="text-xl sm:text-2xl font-extrabold">플랫폼 송금 계좌 관리</h2>
              </div>
              <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <input type="text" placeholder="플랫폼명" value={newAgency} onChange={e => setNewAgency(e.target.value)} className="bg-[#FFFFFF] text-[#000000] font-bold px-4 py-3 rounded-xl text-sm focus:outline-none shadow-inner" />
                <input type="text" placeholder="은행명" value={newBank} onChange={e => setNewBank(e.target.value)} className="bg-[#FFFFFF] text-[#000000] font-bold px-4 py-3 rounded-xl text-sm focus:outline-none shadow-inner" />
                <input type="text" placeholder="계좌번호" value={newAccount} onChange={e => setNewAccount(e.target.value)} className="bg-[#FFFFFF] text-[#000000] font-bold px-4 py-3 rounded-xl text-sm focus:outline-none shadow-inner" />
                <button type="submit" className="bg-gradient-to-r from-[#8B5CF6] to-[#4F46E5] px-5 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center text-white shadow-[0_5px_20px_rgba(139,92,246,0.4)] hover:-translate-y-1 transition-transform"><Plus className="w-6 h-6" /></button>
              </form>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
