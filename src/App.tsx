import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, Plus, Building2, Trash2, Edit3, X, Save, CheckCircle2, AlertCircle, Clock, Wallet, LayoutDashboard, MapPin, Navigation, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Percent } from 'lucide-react';

// --- Types ---
interface DrivingRecord {
  id: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  duration: string;   // 소요 시간
  departure: string;
  destination: string;
  grossAmount: number; // 총 단가
  feeRate: number;     // 수수료율
  netAmount: number;   // 실수령액
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
  // --- 날짜 관리 (캘린더) ---
  const getToday = () => {
    const today = new Date();
    // 로컬 시간대 기준으로 YYYY-MM-DD 추출
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
    return localISOTime;
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

  // --- State: 운행 기록 ---
  const [records, setRecords] = useState<DrivingRecord[]>([
    { id: '1', date: getToday(), startTime: '09:30', endTime: '10:45', duration: '1시간 15분', departure: '서울 강남', destination: '경기 성남', grossAmount: 50000, feeRate: 20, netAmount: 40000 },
    { id: '2', date: getToday(), startTime: '14:15', endTime: '16:00', duration: '1시간 45분', departure: '경기 수원', destination: '인천 송도', grossAmount: 80000, feeRate: 20, netAmount: 64000 },
  ]);
  
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [startTime, setStartTime] = useState(getCurrentTime());
  const [endTime, setEndTime] = useState('');
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [feeRate, setFeeRate] = useState(20); // 기본 수수료 20%

  // 소요시간 계산기
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60; // 자정 넘김 처리
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h > 0 ? h + '시간 ' : ''}${m}분`;
  };

  const currentDuration = calculateDuration(startTime, endTime);
  const currentNetAmount = grossAmount ? Number(grossAmount) * (1 - feeRate / 100) : 0;
  const currentFee = grossAmount ? Number(grossAmount) * (feeRate / 100) : 0;

  // 선택된 날짜의 기록만 필터링
  const filteredRecords = records.filter(r => r.date === selectedDate);
  const dailyTotalNetAmount = filteredRecords.reduce((sum, r) => sum + r.netAmount, 0);

  // --- State: 정산 및 미수금 관리 ---
  const [settlements, setSettlements] = useState<Settlement[]>([
    { id: '1', company: '로지 플랫폼', amount: 145000, expectedDate: '2026-11-10', status: 'pending' },
    { id: '2', company: '아이원 플랫폼', amount: 98000, expectedDate: '2026-11-05', status: 'overdue' },
  ]);

  const totalPending = settlements.filter(s => s.status !== 'completed').reduce((sum, s) => sum + s.amount, 0);
  const totalOverdue = settlements.filter(s => s.status === 'overdue').reduce((sum, s) => sum + s.amount, 0);

  // --- State: 송금 계좌 관리 ---
  const [accounts, setAccounts] = useState<RemittanceAccount[]>([
    { id: '1', agencyName: '로지 충전계좌', bankName: '국민은행', accountNumber: '123456-04-789012', holder: '(주)로지소프트' },
  ]);
  
  const [newAgency, setNewAgency] = useState('');
  const [newBank, setNewBank] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newHolder, setNewHolder] = useState('');
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAgency, setEditAgency] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editHolder, setEditHolder] = useState('');

  // --- Handlers: 운행 기록 추가 ---
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departure || !destination || !grossAmount) return;

    const newRecord: DrivingRecord = {
      id: Date.now().toString(),
      date: selectedDate,
      startTime: startTime || getCurrentTime(),
      endTime: endTime || getCurrentTime(),
      duration: currentDuration || '0분',
      departure,
      destination,
      grossAmount: Number(grossAmount),
      feeRate: feeRate,
      netAmount: currentNetAmount,
    };

    setRecords([newRecord, ...records]);
    setDeparture('');
    setDestination('');
    setGrossAmount('');
    setStartTime(getCurrentTime());
    setEndTime('');
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  // --- Handlers: 송금 계좌 ---
  const handleCopy = (id: string, accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgency || !newAccount) return;
    const newItem: RemittanceAccount = {
      id: Date.now().toString(),
      agencyName: newAgency,
      bankName: newBank || '미입력',
      accountNumber: newAccount,
      holder: newHolder || '미입력',
    };
    setAccounts([newItem, ...accounts]);
    setNewAgency(''); setNewBank(''); setNewAccount(''); setNewHolder('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 송금 계좌를 삭제하시겠습니까?')) {
      setAccounts(accounts.filter(acc => acc.id !== id));
    }
  };

  const handleStartEdit = (acc: RemittanceAccount) => {
    setEditingId(acc.id);
    setEditAgency(acc.agencyName);
    setEditBank(acc.bankName);
    setEditAccount(acc.accountNumber);
    setEditHolder(acc.holder);
  };

  const handleSaveEdit = (id: string) => {
    setAccounts(accounts.map(acc => acc.id === id ? {
      ...acc, agencyName: editAgency, bankName: editBank, accountNumber: editAccount, holder: editHolder
    } : acc));
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-['Pretendard'] w-full flex justify-center p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-[1400px] flex flex-col gap-6">
        
        {/* --- Header (JunDriver) --- */}
        <header className="flex items-center justify-between py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-[#38BDF8] bg-clip-text text-transparent">
                JunDriver
              </h1>
              <p className="text-xs sm:text-sm text-[#38BDF8]">스마트 탁송 가계부 & 물류 허브</p>
            </div>
          </div>
        </header>

        {/* --- 1. 운행 일지 & 캘린더 섹션 --- */}
        <section className="bg-slate-900/40 backdrop-blur-[12px] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#8B5CF6]" />
              <h2 className="text-lg sm:text-xl font-bold">운행 일지</h2>
            </div>
            
            {/* 날짜 선택 (캘린더 네비게이션) */}
            <div className="flex items-center gap-3 bg-[#0B1120]/80 p-2 rounded-xl border border-slate-700 w-fit">
              <button onClick={handlePrevDay} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#38BDF8]" />
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <button onClick={handleNextDay} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          {/* 운행 요약 통계 */}
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900/20 to-transparent border border-emerald-500/20 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-400">{selectedDate} 순수익 합계</p>
              <p className="text-2xl font-bold text-emerald-400">{dailyTotalNetAmount.toLocaleString()}원</p>
            </div>
            <div className="text-right text-sm text-slate-400">
              <p>운행: <span className="font-bold text-white">{filteredRecords.length}</span>건</p>
            </div>
          </div>

          {/* 운행 기록 입력 폼 (White Form Style) */}
          <form onSubmit={handleAddRecord} className="bg-[#0B1120]/60 p-4 rounded-xl border border-slate-700 mb-6 flex flex-col gap-3">
            {/* 1열: 시간 및 동선 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
                <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-xs text-slate-500 shrink-0">출발</span>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-transparent focus:outline-none" />
              </div>
              <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
                <Clock className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="text-xs text-slate-500 shrink-0">도착</span>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-transparent focus:outline-none" />
              </div>
              <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <input type="text" placeholder="출발지" value={departure} onChange={e => setDeparture(e.target.value)} className="w-full bg-transparent focus:outline-none" />
              </div>
              <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <input type="text" placeholder="도착지" value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-transparent focus:outline-none" />
              </div>
            </div>

            {/* 2열: 금액 및 수수료 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center border-t border-slate-700/50 pt-3 mt-1">
              <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
                <span className="text-xs text-slate-500 shrink-0">단가(총액)</span>
                <input type="number" placeholder="예: 50000" value={grossAmount} onChange={e => setGrossAmount(e.target.value)} className="w-full bg-transparent focus:outline-none focus:shadow-[0_0_10px_#8B5CF6]" />
              </div>
              
              <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
                <Percent className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 shrink-0">수수료율</span>
                <input type="number" value={feeRate} onChange={e => setFeeRate(Number(e.target.value))} className="w-full bg-transparent focus:outline-none" />
                <span className="text-xs">%</span>
              </div>

              <div className="flex flex-col justify-center px-2">
                <span className="text-xs text-slate-400">예상 소요: <span className="text-[#38BDF8]">{currentDuration || '-'}</span></span>
                <span className="text-xs text-slate-400">수수료 뗌: <span className="text-[#EC4899]">{currentFee.toLocaleString()}원</span></span>
                <span className="text-sm font-bold text-emerald-400">실수령: {currentNetAmount.toLocaleString()}원</span>
              </div>

              <button type="submit" className="bg-gradient-to-r from-[#8B5CF6] to-[#4F46E5] hover:-translate-y-1 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-transform text-white shadow-lg h-full">
                <Plus className="w-4 h-4" /> 입력 완료
              </button>
            </div>
          </form>

          {/* 일자별 운행 리스트 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs">
                  <th className="py-3 px-2">시간 (소요)</th>
                  <th className="py-3 px-2">동선 (출발➔도착)</th>
                  <th className="py-3 px-2">단가 (총액)</th>
                  <th className="py-3 px-2">수수료</th>
                  <th className="py-3 px-2">실수령액</th>
                  <th className="py-3 px-2 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">해당 날짜의 운행 기록이 없습니다.</td></tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-mono text-[#38BDF8]">{r.startTime} ~ {r.endTime}</div>
                        <div className="text-xs text-slate-400">{r.duration}</div>
                      </td>
                      <td className="py-3 px-2 font-medium flex items-center gap-1.5 h-full mt-2">
                        <span className="text-slate-200">{r.departure}</span>
                        <span className="text-[#8B5CF6] text-xs">➔</span>
                        <span className="text-slate-200">{r.destination}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-300">{r.grossAmount.toLocaleString()}원</td>
                      <td className="py-3 px-2 text-[#EC4899] text-xs">({r.feeRate}%) -{(r.grossAmount - r.netAmount).toLocaleString()}원</td>
                      <td className="py-3 px-2 font-bold text-emerald-400">{r.netAmount.toLocaleString()}원</td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => handleDeleteRecord(r.id)} className="text-slate-400 hover:text-[#EC4899] transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- 2. 플랫폼 정산 및 미수금 관리 섹션 --- */}
        <section className="bg-slate-900/40 backdrop-blur-[12px] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <LayoutDashboard className="w-5 h-5 text-[#38BDF8]" />
            <h2 className="text-lg sm:text-xl font-bold">플랫폼 정산 및 미수금 현황</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0B1120]/60 p-4 rounded-xl border border-[#38BDF8]/30">
              <span className="text-sm text-slate-400">입금 대기 총액</span>
              <p className="text-2xl font-bold text-[#38BDF8] mt-1">{totalPending.toLocaleString()}원</p>
            </div>
            <div className="bg-[#0B1120]/60 p-4 rounded-xl border border-[#EC4899]/30">
              <span className="text-sm text-[#EC4899] flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> 주의 요망 미수금
              </span>
              <p className="text-2xl font-bold text-[#EC4899] mt-1">{totalOverdue.toLocaleString()}원</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                  <th className="py-3 px-4">플랫폼명</th>
                  <th className="py-3 px-4">청구 금액</th>
                  <th className="py-3 px-4">입금 예정일</th>
                  <th className="py-3 px-4">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {settlements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#8B5CF6]" /> {item.company}
                    </td>
                    <td className="py-3 px-4 font-bold">{item.amount.toLocaleString()}원</td>
                    <td className="py-3 px-4 text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {item.expectedDate}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === 'completed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 입금완료</span>}
                      {item.status === 'pending' && <span className="text-[#38BDF8] flex items-center gap-1"><Clock className="w-4 h-4" /> 대기중</span>}
                      {item.status === 'overdue' && <span className="text-[#EC4899] flex items-center gap-1 font-bold animate-pulse"><AlertCircle className="w-4 h-4" /> 미수금</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- 3. 송금 계좌 관리 섹션 --- */}
        <section className="bg-slate-900/40 backdrop-blur-[12px] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Send className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-lg sm:text-xl font-bold">플랫폼 송금 계좌 (원클릭 복사)</h2>
          </div>

          <form onSubmit={handleAddAccount} className="bg-[#0B1120]/60 p-4 rounded-xl border border-slate-700 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" placeholder="플랫폼명 (예: 로지 충전)" value={newAgency} onChange={e => setNewAgency(e.target.value)}
              className="bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-2 rounded-lg text-sm focus:outline-none focus:shadow-[0_0_10px_#8B5CF6]" />
            <input type="text" placeholder="은행명 (예: 국민)" value={newBank} onChange={e => setNewBank(e.target.value)}
              className="bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-2 rounded-lg text-sm focus:outline-none focus:shadow-[0_0_10px_#8B5CF6]" />
            <input type="text" placeholder="계좌번호 (- 포함)" value={newAccount} onChange={e => setNewAccount(e.target.value)}
              className="bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-2 rounded-lg text-sm focus:outline-none focus:shadow-[0_0_10px_#8B5CF6]" />
            <div className="flex gap-2">
              <input type="text" placeholder="예금주" value={newHolder} onChange={e => setNewHolder(e.target.value)}
                className="bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-2 rounded-lg text-sm flex-1 focus:outline-none focus:shadow-[0_0_10px_#8B5CF6]" />
              <button type="submit" className="bg-gradient-to-r from-[#8B5CF6] to-[#4F46E5] hover:-translate-y-1 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-[#0B1120]/60 p-4 rounded-xl border border-slate-700 hover:border-[#8B5CF6]/50 transition-all flex flex-col justify-between">
                {editingId === acc.id ? (
                  <div className="space-y-3">
                    <input type="text" value={editAgency} onChange={e => setEditAgency(e.target.value)} className="w-full bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-1.5 rounded-lg text-sm" placeholder="플랫폼명" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={editBank} onChange={e => setEditBank(e.target.value)} className="bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-1.5 rounded-lg text-sm" placeholder="은행명" />
                      <input type="text" value={editHolder} onChange={e => setEditHolder(e.target.value)} className="bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-1.5 rounded-lg text-sm" placeholder="예금주" />
                    </div>
                    <input type="text" value={editAccount} onChange={e => setEditAccount(e.target.value)} className="w-full bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-1.5 rounded-lg text-sm font-mono" placeholder="계좌번호" />
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1"><X className="w-3.5 h-3.5" /> 취소</button>
                      <button onClick={() => handleSaveEdit(acc.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold flex items-center gap-1 text-white"><Save className="w-3.5 h-3.5" /> 저장</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-[#8B5CF6] flex items-center gap-1.5 text-base">
                          <Building2 className="w-4 h-4 text-[#EC4899]" /> {acc.agencyName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-600">{acc.bankName}</span>
                          <button onClick={() => handleStartEdit(acc)} className="text-slate-400 hover:text-[#38BDF8] transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(acc.id)} className="text-slate-400 hover:text-[#EC4899] transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="text-xl font-mono font-bold text-[#38BDF8] tracking-wide my-1">{acc.accountNumber}</p>
                      <p className="text-xs text-slate-400">예금주: <span className="text-slate-200 font-medium">{acc.holder}</span></p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700/80 flex justify-between items-center">
                      <span className="text-xs text-slate-500">클립보드 즉시 복사</span>
                      <button onClick={() => handleCopy(acc.id, acc.accountNumber)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${copiedId === acc.id ? 'bg-emerald-500 text-white scale-95' : 'bg-gradient-to-r from-[#8B5CF6] to-[#4F46E5] hover:-translate-y-1'}`}>
                        {copiedId === acc.id ? <><Check className="w-4 h-4" /> 복사 완료!</> : <><Copy className="w-4 h-4" /> 계좌번호 복사</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
