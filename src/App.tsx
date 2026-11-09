import React, { useState } from 'react';
import { Send, Copy, Check, Plus, Building2, Trash2, Edit3, X, Save, CheckCircle2, AlertCircle, Clock, Wallet, LayoutDashboard, MapPin, Navigation } from 'lucide-react';

// --- Types ---
interface DrivingRecord {
  id: string;
  time: string;
  departure: string;
  destination: string;
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
  // --- State: 운행 기록 (시간 + 출발/도착 + 수입) ---
  const [records, setRecords] = useState<DrivingRecord[]>([
    { id: '1', time: '09:30', departure: '서울 강남', destination: '경기 성남', amount: 45000 },
    { id: '2', time: '14:15', departure: '경기 수원', destination: '인천 송도', amount: 65000 },
  ]);
  
  // 현재 시간을 HH:MM 형식으로 기본 세팅
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [recordTime, setRecordTime] = useState(getCurrentTime());
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [recordAmount, setRecordAmount] = useState('');

  // --- State: 정산 및 미수금 관리 ---
  const [settlements, setSettlements] = useState<Settlement[]>([
    { id: '1', company: '로지 연합대행사', amount: 145000, expectedDate: '2026-11-10', status: 'pending' },
    { id: '2', company: '아이원 물류', amount: 98000, expectedDate: '2026-11-05', status: 'overdue' },
    { id: '3', company: '한국탁송플러스', amount: 210000, expectedDate: '2026-11-01', status: 'completed' },
  ]);

  const totalPending = settlements.filter(s => s.status !== 'completed').reduce((sum, s) => sum + s.amount, 0);
  const totalOverdue = settlements.filter(s => s.status === 'overdue').reduce((sum, s) => sum + s.amount, 0);
  const totalTodayEarnings = records.reduce((sum, r) => sum + r.amount, 0);

  // --- State: 송금 계좌 관리 ---
  const [accounts, setAccounts] = useState<RemittanceAccount[]>([
    { id: '1', agencyName: '로지 연합충전계좌', bankName: '국민은행', accountNumber: '123456-04-789012', holder: '(주)로지소프트' },
    { id: '2', agencyName: '아이콘 물류비 송금', bankName: '신한은행', accountNumber: '987654-11-234567', holder: '아이콘(주)' },
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
    if (!departure || !destination || !recordAmount) return;

    const newRecord: DrivingRecord = {
      id: Date.now().toString(),
      time: recordTime || getCurrentTime(),
      departure,
      destination,
      amount: Number(recordAmount),
    };

    setRecords([newRecord, ...records]);
    setDeparture('');
    setDestination('');
    setRecordAmount('');
    setRecordTime(getCurrentTime());
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
      {/* Container: Max-width 1400px, Zero-Scroll 지향 */}
      <div className="w-full max-w-[1400px] flex flex-col gap-6">
        
        {/* --- Header (JunDriver 브랜딩) --- */}
        <header className="flex items-center justify-between py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-[#38BDF8] bg-clip-text text-transparent">
                JunDriver
              </h1>
              <p className="text-xs sm:text-sm text-[#38BDF8]">탁송 기사 전용 스마트 가계부 & 물류 허브</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400">오늘 총 수입</span>
            <p className="text-lg font-bold text-emerald-400">{totalTodayEarnings.toLocaleString()}원</p>
          </div>
        </header>

        {/* --- 1. 실시간 운행 기록 및 빅데이터 수집 섹션 (NEW) --- */}
        <section className="bg-slate-900/40 backdrop-blur-[12px] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#8B5CF6]" />
              <h2 className="text-lg sm:text-xl font-bold">운행 일지 & 콜 데이터 기록</h2>
            </div>
            <span className="text-xs text-slate-400">입력된 동선은 추후 핫스팟 분석에 활용됩니다</span>
          </div>

          {/* 운행 기록 입력 폼 (White Form Style) */}
          <form onSubmit={handleAddRecord} className="bg-[#0B1120]/60 p-4 rounded-xl border border-slate-700 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
              <Clock className="w-4 h-4 text-purple-600" />
              <input type="text" value={recordTime} onChange={e => setRecordTime(e.target.value)} placeholder="시간 (HH:MM)" className="w-full bg-transparent focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
              <MapPin className="w-4 h-4 text-pink-600" />
              <input type="text" placeholder="출발지 (예: 강남)" value={departure} onChange={e => setDeparture(e.target.value)} className="w-full bg-transparent focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 bg-[#FFFFFF] text-[#000000] px-3 py-2 rounded-lg font-semibold text-sm">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <input type="text" placeholder="도착지 (예: 분당)" value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-transparent focus:outline-none" />
            </div>
            <input type="number" placeholder="운행 수익 (원)" value={recordAmount} onChange={e => setRecordAmount(e.target.value)}
              className="bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-2 rounded-lg text-sm focus:outline-none focus:shadow-[0_0_10px_#8B5CF6]" />
            <button type="submit" className="bg-gradient-to-r from-[#8B5CF6] to-[#4F46E5] hover:-translate-y-1 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-transform text-white shadow-lg">
              <Plus className="w-4 h-4" /> 운행 기록 추가
            </button>
          </form>

          {/* 운행 기록 리스트 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                  <th className="py-3 px-4">시간</th>
                  <th className="py-3 px-4">출발지 ➔ 도착지</th>
                  <th className="py-3 px-4">수익</th>
                  <th className="py-3 px-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-[#38BDF8] font-mono font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {r.time}
                    </td>
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <span className="text-slate-200">{r.departure}</span>
                      <span className="text-[#8B5CF6]">➔</span>
                      <span className="text-slate-200">{r.destination}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{r.amount.toLocaleString()}원</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDeleteRecord(r.id)} className="text-slate-400 hover:text-[#EC4899] transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- 2. 정산 및 미수금 관리 섹션 --- */}
        <section className="bg-slate-900/40 backdrop-blur-[12px] p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <LayoutDashboard className="w-5 h-5 text-[#38BDF8]" />
            <h2 className="text-lg sm:text-xl font-bold">콜사 정산 및 미수금 현황</h2>
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
                  <th className="py-3 px-4">대행사명</th>
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
            <h2 className="text-lg sm:text-xl font-bold">송금 계좌 간편 관리 (원클릭 복사)</h2>
          </div>

          {/* 등록 폼 (White Form Style) */}
          <form onSubmit={handleAddAccount} className="bg-[#0B1120]/60 p-4 rounded-xl border border-slate-700 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" placeholder="송금처 이름 (예: 로지 충전)" value={newAgency} onChange={e => setNewAgency(e.target.value)}
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

          {/* 저장된 계좌 리스트 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-[#0B1120]/60 p-4 rounded-xl border border-slate-700 hover:border-[#8B5CF6]/50 transition-all flex flex-col justify-between">
                {editingId === acc.id ? (
                  /* 수정 폼 */
                  <div className="space-y-3">
                    <input type="text" value={editAgency} onChange={e => setEditAgency(e.target.value)} className="w-full bg-[#FFFFFF] text-[#000000] font-semibold px-3 py-1.5 rounded-lg text-sm" placeholder="송금처 이름" />
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
                  /* 일반 보기 모드 */
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
