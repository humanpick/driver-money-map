import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, PlusCircle, History, AlertTriangle, Fuel,
  CreditCard, Receipt, Building2, Bell, PieChart, Calendar,
  Users, Download, Settings, Search, CheckCircle2, X, Plus,
  Send, Copy, ChevronRight, Menu, Car, Map, User, Edit, Trash2
} from 'lucide-react';

// --- INITIAL MOCK DATA ---
const INITIAL_COMPANIES = [
  { id: 'c1', name: 'SK로드탁송', contact: '010-1234-5678', cycle: '매주 금요일', defaultFee: 180000 },
  { id: 'c2', name: '카카오대리', contact: '1588-0000', cycle: '당일 정산', defaultFee: 45000 },
];

const INITIAL_TRIPS = [
  {
    id: 'TRIP-1001', date: '2026-11-07', startTime: '14:00', endTime: '17:30',
    type: '로드탁송', company: 'SK로드탁송', customer: '홍길동', phone: '010-8888-9999',
    vehicleNo: '12가 3456', vehicleType: '제네시스 G80', from: '서울 강남구', to: '부산 해운대구',
    freightFee: 180000, fuelFee: 70000, fuelPaidBy: 'driver_prepaid',
    dueDate: '2026-11-14', status: '정산 대기', paidFreight: 0, paidFuel: 0,
    memo: '주유비 7만원선결제 (영수증 첨부완료)'
  },
  {
    id: 'TRIP-1003', date: '2026-11-05', startTime: '09:00', endTime: '12:00',
    type: '로드탁송', company: '오토원탁송', customer: '성춘향', phone: '010-7777-1111',
    vehicleNo: '77다 1234', vehicleType: 'K8 Hybrid', from: '경기 수원', to: '대전 유성구',
    freightFee: 200000, fuelFee: 50000, fuelPaidBy: 'driver_prepaid',
    dueDate: '2026-11-06', status: '부분 입금', paidFreight: 100000, paidFuel: 0,
    memo: '탁송비 1차 10만원 입금됨, 잔액 10만+주유 5만 미수'
  }
];

const INITIAL_EXPENSES = [
  { id: 'e1', date: '2026-11-07', category: '통행료', amount: 15400, memo: '서울-부산 톨게이트' },
  { id: 'e2', date: '2026-11-07', category: '복귀 교통비', amount: 32000, memo: 'KTX 부산-서울' },
];

export default function App() {
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('dm_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('dm_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // 내 계좌번호 상태 저장
  const [accountInfo, setAccountInfo] = useState(() => {
    const saved = localStorage.getItem('dm_account');
    return saved ? JSON.parse(saved) : { bank: '', number: '', holder: '' };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal States
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [selectedTripForSms, setSelectedTripForSms] = useState<any>(null);
  const [selectedTripForDeposit, setSelectedTripForDeposit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => localStorage.setItem('dm_trips', JSON.stringify(trips)), [trips]);
  useEffect(() => localStorage.setItem('dm_expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('dm_account', JSON.stringify(accountInfo)), [accountInfo]); // 계좌정보 자동 저장

  // Financial Engine
  const stats = useMemo(() => {
    let todayCount = 0, todaySettlementTarget = 0, todayDeposit = 0;
    let totalUnpaidFreight = 0, totalUnpaidFuel = 0;
    let monthlyFreightIncome = 0, monthlyExpenses = 0;
    const todayStr = '2026-11-07';

    trips.forEach(t => {
      const freightUnpaid = t.freightFee - t.paidFreight;
      const fuelUnpaid = t.fuelPaidBy === 'driver_prepaid' ? Math.max(0, t.fuelFee - t.paidFuel) : 0;
      totalUnpaidFreight += freightUnpaid;
      totalUnpaidFuel += fuelUnpaid;
      monthlyFreightIncome += t.paidFreight;

      if (t.date === todayStr) {
        todayCount++;
        todaySettlementTarget += (t.freightFee + (t.fuelPaidBy === 'driver_prepaid' ? t.fuelFee : 0));
        todayDeposit += (t.paidFreight + t.paidFuel);
      }
    });

    expenses.forEach(e => { monthlyExpenses += Number(e.amount || 0); });

    return {
      todayCount, todaySettlementTarget, todayDeposit,
      totalUnpaidFreight, totalUnpaidFuel,
      totalUnpaid: totalUnpaidFreight + totalUnpaidFuel,
      monthlyFreightIncome, monthlyExpenses,
      netProfit: monthlyFreightIncome - monthlyExpenses
    };
  }, [trips, expenses]);

  // 입금 처리 로직
  const handleApplyDeposit = (tripId: string, freightAmt: number, fuelAmt: number) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        const newPaidFreight = t.paidFreight + freightAmt;
        const newPaidFuel = t.paidFuel + fuelAmt;
        const totalTarget = t.freightFee + (t.fuelPaidBy === 'driver_prepaid' ? t.fuelFee : 0);
        const totalPaid = newPaidFreight + newPaidFuel;
        let newStatus = '부분 입금';
        if (totalPaid >= totalTarget) newStatus = '정산 완료';
        else if (totalPaid === 0) newStatus = '정산 대기';
        
        return { ...t, paidFreight: newPaidFreight, paidFuel: newPaidFuel, status: newStatus };
      }
      return t;
    }));
    setIsDepositModalOpen(false);
  };

  // 운행 내역 삭제 로직
  const handleDeleteTrip = (tripId: string) => {
    if (window.confirm('정말 이 운행 내역을 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)')) {
      setTrips(prev => prev.filter(t => t.id !== tripId));
    }
  };

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'trip_list', label: '운행 내역', icon: History },
    { id: 'unpaid', label: '미수금 & SMS', icon: AlertTriangle, badge: trips.filter(t => (t.freightFee - t.paidFreight + (t.fuelPaidBy==='driver_prepaid'?(t.fuelFee-t.paidFuel):0)) > 0).length },
    { id: 'fuel', label: '주유비 환급', icon: Fuel },
    { id: 'expenses', label: '지출 관리', icon: Receipt },
    { id: 'analytics', label: '수익 분석', icon: PieChart },
    { id: 'backup', label: '백업/엑셀', icon: Download },
    { id: 'map', label: '콜지 지도', icon: Map },
    { id: 'profile', label: '내 정보', icon: User },
  ];

  const mobileNavItems = [
    { id: 'dashboard', label: '홈', icon: LayoutDashboard },
    { id: 'trip_list', label: '내역', icon: History },
    { id: 'unpaid', label: '미수금', icon: AlertTriangle, badge: trips.filter(t => (t.freightFee - t.paidFreight + (t.fuelPaidBy==='driver_prepaid'?(t.fuelFee-t.paidFuel):0)) > 0).length },
    { id: 'analytics', label: '분석', icon: PieChart },
    { id: 'profile', label: '정보', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased">
      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <aside className="hidden md:flex flex-col w-64 glass-panel rounded-none border-t-0 border-l-0 border-b-0 p-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg bg-gradient-to-r from-white to-[#8B5CF6] bg-clip-text text-transparent">
              DRIVER MONEY
            </h1>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive ? 'bg-[#8B5CF6]/30 text-white shadow-[0_0_10px_rgba(139,92,246,0.2)] border border-[#8B5CF6]/50' : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#8B5CF6]' : 'text-[#CBD5E1]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#EC4899] text-white font-bold">{item.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ---------------- MOBILE HEADER ---------------- */}
      <div className="md:hidden glass-panel rounded-none flex items-center justify-between px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="font-black bg-gradient-to-r from-white to-[#8B5CF6] bg-clip-text text-transparent">DRIVER MONEY</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full pb-24 md:pb-8">
        
        {/* TOP ACTION BAR */}
        <header className="mb-6 flex flex-col sm:flex-row justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              {navItems.find(n => n.id === activeTab)?.label}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/30 text-[#38BDF8]">
                2026-11-07
              </span>
            </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditingTrip(null); setIsTripModalOpen(true); }} className="cyber-button px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> 빠른 등록
            </button>
            <button onClick={() => setIsDepositModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/40 transition-all flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> 입금 처리
            </button>
          </div>
        </header>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5">
                <p className="text-xs font-bold text-[#CBD5E1]">오늘 운행/정산액</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">{stats.todayCount}건</span>
                  <span className="text-sm font-black text-[#8B5CF6]">{stats.todaySettlementTarget.toLocaleString()}원</span>
                </div>
              </div>
              <div className="glass-panel p-5 border-[#EC4899]/30 !border">
                <p className="text-xs font-bold text-[#EC4899]">미수금 총액</p>
                <div className="mt-2">
                  <span className="text-2xl font-black text-[#EC4899]">{stats.totalUnpaid.toLocaleString()}원</span>
                </div>
              </div>
              <div className="glass-panel p-5 border-[#38BDF8]/30 !border">
                <p className="text-xs font-bold text-[#38BDF8]">주유 환급대기</p>
                <div className="mt-2">
                  <span className="text-2xl font-black text-[#38BDF8]">{stats.totalUnpaidFuel.toLocaleString()}원</span>
                </div>
              </div>
              <div className="glass-panel p-5 border-[#10B981]/30 !border">
                <p className="text-xs font-bold text-[#10B981]">이번 달 순수익</p>
                <div className="mt-2">
                  <span className="text-2xl font-black text-[#10B981]">{stats.netProfit.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="font-extrabold text-base text-white mb-4">최근 운행 내역</h3>
              <div className="space-y-3">
                {trips.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#8B5CF6]/40 transition-all">
                    <div>
                      <span className="text-[10px] bg-[#8B5CF6]/20 text-[#8B5CF6] px-2 py-1 rounded font-bold mr-2">{t.company}</span>
                      <span className="text-sm text-white font-bold">{t.from} → {t.to}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#38BDF8]">{t.freightFee.toLocaleString()}원</p>
                      <p className="text-[10px] text-[#EC4899]">{t.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRIP LIST */}
        {activeTab === 'trip_list' && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="glass-panel p-4 flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="업체명, 지역, 담당자 검색..." 
                  className="w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={() => { setEditingTrip(null); setIsTripModalOpen(true); }} className="cyber-button px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> 내역 수동 등록
              </button>
            </div>
            
            <div className="space-y-3">
              {trips.filter(t => t.company.includes(searchTerm) || t.from.includes(searchTerm) || t.to.includes(searchTerm)).map(t => {
                const totalUnpaid = (t.freightFee - t.paidFreight) + (t.fuelPaidBy === 'driver_prepaid' ? (t.fuelFee - t.paidFuel) : 0);
                return (
                  <div key={t.id} className="glass-panel p-5 space-y-3 hover:border-[#8B5CF6]/40 transition-all">
                    <div className="flex justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="px-2 py-1 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-bold mr-2">{t.type}</span>
                        <span className="font-extrabold text-white text-base">{t.company}</span>
                        <p className="text-xs text-[#CBD5E1] mt-1">{t.date} | 차량: {t.vehicleType}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === '정산 완료' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EC4899]/20 text-[#EC4899]'}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 text-sm">
                      <div>
                        <p className="text-[#CBD5E1]">구간: <span className="text-white font-bold">{t.from} → {t.to}</span></p>
                        <p className="text-[#CBD5E1] mt-1">탁송비: <span className="text-[#8B5CF6] font-bold">{t.freightFee.toLocaleString()}원</span></p>
                      </div>
                      <div className="text-right flex flex-col justify-end">
                        <p className="text-xs text-[#CBD5E1]">남은 미수금</p>
                        <p className="text-lg font-black text-[#EC4899]">{totalUnpaid.toLocaleString()}원</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 mt-2 border-t border-white/10">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingTrip(t); setIsTripModalOpen(true); }} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all">
                          <Edit className="w-3.5 h-3.5" /> 수정
                        </button>
                        <button onClick={() => handleDeleteTrip(t.id)} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1 transition-all">
                          <Trash2 className="w-3.5 h-3.5" /> 삭제
                        </button>
                      </div>
                      
                      {totalUnpaid > 0 && (
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedTripForSms(t); setIsSmsModalOpen(true); }} className="px-3 py-1.5 rounded-lg bg-[#EC4899]/20 hover:bg-[#EC4899]/30 text-[#EC4899] text-xs font-bold transition-all">문자독촉</button>
                          <button onClick={() => { setSelectedTripForDeposit(t); setIsDepositModalOpen(true); }} className="px-3 py-1.5 rounded-lg bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] text-xs font-bold transition-all">입금하기</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center glass-panel p-5 border-[#EC4899]/30 !border">
              <div>
                <h3 className="font-extrabold text-base text-white">사업 지출 내역</h3>
                <p className="text-xs text-[#CBD5E1]">순수익 계산을 위한 톨게이트, 교통비 관리</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(true)} className="cyber-button px-4 py-2 rounded-xl text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> 지출 등록
              </button>
            </div>

            <div className="space-y-3">
              {expenses.map(e => (
                <div key={e.id} className="glass-panel p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-[#EC4899]/20 text-[#EC4899] text-xs font-bold">{e.category}</span>
                    <div>
                      <p className="text-white font-bold text-sm">{e.memo}</p>
                      <p className="text-[10px] text-[#CBD5E1]">{e.date}</p>
                    </div>
                  </div>
                  <span className="font-black text-[#EC4899]">-{e.amount.toLocaleString()}원</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: UNPAID & SMS */}
        {activeTab === 'unpaid' && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="glass-panel p-5 border-[#EC4899]/30 !border">
              <h3 className="font-black text-lg text-white">미수금 종합 관리 & SMS 독촉</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.filter(t => (t.freightFee - t.paidFreight + (t.fuelPaidBy==='driver_prepaid'?(t.fuelFee-t.paidFuel):0)) > 0).map(t => {
                const totalUnpaid = (t.freightFee - t.paidFreight) + (t.fuelPaidBy === 'driver_prepaid' ? (t.fuelFee - t.paidFuel) : 0);
                return (
                  <div key={t.id} className="glass-panel p-5 space-y-4">
                    <div>
                      <span className="px-2 py-1 rounded bg-[#EC4899]/20 text-[#EC4899] font-bold text-xs">예정일: {t.dueDate}</span>
                      <h4 className="font-extrabold text-base text-white mt-2">{t.company} ({t.from}→{t.to})</h4>
                      <p className="text-xs text-[#CBD5E1] mt-1">고객: {t.customer} | 미수금: <span className="text-[#EC4899] font-bold">{totalUnpaid.toLocaleString()}원</span></p>
                    </div>
                    <button
                      onClick={() => { setSelectedTripForSms(t); setIsSmsModalOpen(true); }}
                      className="cyber-button w-full py-3 rounded-xl flex justify-center items-center gap-2"
                    >
                      <Send className="w-4 h-4" /> 정산 요청 SMS 전송
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE (계좌 등록 폼 추가) */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="glass-panel p-6 max-w-xl mx-auto">
              <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-white">내 정보 설정</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1">정산받을 계좌를 등록해두면 문자에 자동 첨부됩니다.</p>
                </div>
              </div>

              <form onSubmit={(e: any) => {
                e.preventDefault();
                setAccountInfo({
                  bank: e.target.bank.value,
                  holder: e.target.holder.value,
                  number: e.target.number.value
                });
                alert('계좌 정보가 안전하게 기기에 저장되었습니다!');
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">은행명</label>
                    <input type="text" name="bank" defaultValue={accountInfo.bank} placeholder="예: 카카오뱅크" className="w-full" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1">예금주</label>
                    <input type="text" name="holder" defaultValue={accountInfo.holder} placeholder="예: 홍길동" className="w-full" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1">계좌번호 (- 포함 권장)</label>
                  <input type="text" name="number" defaultValue={accountInfo.number} placeholder="예: 3333-01-2345678" className="w-full" required />
                </div>
                <button type="submit" className="cyber-button w-full py-4 rounded-xl mt-4 text-lg">
                  계좌 정보 저장하기
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: MAP */}
        {activeTab === 'map' && (
          <div className="glass-panel p-6 flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-extrabold text-white">전국 예상 콜지 지도</h2>
            <p className="text-sm text-[#CBD5E1]">MapLibre 엔진을 이용한 실시간 지도가 연동될 영역입니다.</p>
          </div>
        )}

        {/* TAB 6: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-5">
                <p className="text-xs font-bold text-[#CBD5E1]">총 탁송 수입 (수령 완료)</p>
                <p className="text-2xl font-black text-[#8B5CF6] mt-2">{stats.monthlyFreightIncome.toLocaleString()}원</p>
              </div>
              <div className="glass-panel p-5">
                <p className="text-xs font-bold text-[#CBD5E1]">총 사업 지출</p>
                <p className="text-2xl font-black text-[#EC4899] mt-2">{stats.monthlyExpenses.toLocaleString()}원</p>
              </div>
              <div className="glass-panel p-5 border-[#10B981]/30 !border">
                <p className="text-xs font-bold text-[#CBD5E1]">실제 순수익</p>
                <p className="text-2xl font-black text-[#10B981] mt-2">{stats.netProfit.toLocaleString()}원</p>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for others */}
        {['fuel', 'backup'].includes(activeTab) && (
          <div className="glass-panel p-8 text-center space-y-3 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-white">준비 완료</h3>
            <p className="text-xs text-[#CBD5E1] max-w-md mx-auto">해당 모듈은 디자인 세팅이 완료되었습니다.</p>
          </div>
        )}
      </main>

      {/* ---------------- MODALS ---------------- */}
      
      {/* 1. Trip Registration / Edit Modal */}
      {isTripModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-black text-lg text-white">
                {editingTrip ? '✏️ 운행 내역 수정' : '⚡ 빠른 운행 등록'}
              </h3>
              <button onClick={() => { setIsTripModalOpen(false); setEditingTrip(null); }} className="text-white"><X /></button>
            </div>
            <form onSubmit={(e: any) => { 
              e.preventDefault(); 
              const formData = new FormData(e.target);
              
              const newTripData = {
                id: editingTrip ? editingTrip.id : `TRIP-${Date.now()}`,
                date: formData.get('date'),
                startTime: editingTrip ? editingTrip.startTime : '14:00',
                endTime: editingTrip ? editingTrip.endTime : '16:00',
                type: formData.get('type'),
                company: formData.get('company'),
                customer: formData.get('customer') || '미지정',
                phone: editingTrip ? editingTrip.phone : '010-0000-0000',
                vehicleNo: editingTrip ? editingTrip.vehicleNo : '12가 3456',
                vehicleType: editingTrip ? editingTrip.vehicleType : '승용차',
                from: formData.get('from'),
                to: formData.get('to'),
                freightFee: Number(formData.get('freightFee')),
                fuelFee: Number(formData.get('fuelFee')),
                fuelPaidBy: editingTrip ? editingTrip.fuelPaidBy : 'driver_prepaid',
                dueDate: editingTrip ? editingTrip.dueDate : '2026-11-14',
                status: editingTrip ? editingTrip.status : '정산 대기',
                paidFreight: editingTrip ? editingTrip.paidFreight : 0,
                paidFuel: editingTrip ? editingTrip.paidFuel : 0,
                memo: formData.get('memo')
              };

              if (editingTrip) {
                setTrips(prev => prev.map(t => t.id === editingTrip.id ? newTripData : t));
              } else {
                setTrips(prev => [newTripData, ...prev]);
              }
              
              setIsTripModalOpen(false); 
              setEditingTrip(null);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="date" name="date" defaultValue={editingTrip?.date || "2026-11-07"} className="w-full" required />
                <select name="type" defaultValue={editingTrip?.type || "로드탁송"} className="w-full"><option>로드탁송</option><option>대리운전</option></select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" name="company" defaultValue={editingTrip?.company} placeholder="업체명" className="w-full" required />
                <input type="text" name="customer" defaultValue={editingTrip?.customer} placeholder="담당자명" className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" name="from" defaultValue={editingTrip?.from} placeholder="출발지" className="w-full" required />
                <input type="text" name="to" defaultValue={editingTrip?.to} placeholder="도착지" className="w-full" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" name="freightFee" defaultValue={editingTrip?.freightFee} placeholder="탁송비 (원)" className="w-full text-right" required />
                <input type="number" name="fuelFee" defaultValue={editingTrip?.fuelFee} placeholder="주유비 (원)" className="w-full text-right" />
              </div>
              <input type="text" name="memo" defaultValue={editingTrip?.memo} placeholder="메모" className="w-full" />
              <button type="submit" className="cyber-button w-full py-4 rounded-xl mt-4">
                {editingTrip ? '내역 수정 완료' : '운행 등록 완료'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-black text-lg text-white">💳 입금 및 정산 처리</h3>
              <button onClick={() => setIsDepositModalOpen(false)} className="text-white"><X /></button>
            </div>
            <form onSubmit={(e: any) => { 
              e.preventDefault(); 
              handleApplyDeposit(e.target.tripId.value, Number(e.target.freightAmt.value), Number(e.target.fuelAmt.value)); 
            }} className="space-y-4">
              <select name="tripId" defaultValue={selectedTripForDeposit?.id || ''} className="w-full">
                {trips.map(t => (
                  <option key={t.id} value={t.id}>[{t.company}] {t.from}→{t.to}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" name="freightAmt" placeholder="탁송 입금액" className="w-full text-right" required />
                <input type="number" name="fuelAmt" placeholder="주유 환급액" defaultValue="0" className="w-full text-right" />
              </div>
              <button type="submit" className="cyber-button w-full py-4 rounded-xl mt-2">입금 적용하기</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-md space-y-4 border-[#EC4899]/50 !border">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-black text-lg text-white">🧾 사업 지출 등록</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-white"><X /></button>
            </div>
            <form onSubmit={(e: any) => { 
              e.preventDefault(); 
              setExpenses(prev => [{id: `e-${Date.now()}`, date: e.target.date.value, category: e.target.category.value, amount: Number(e.target.amount.value), memo: e.target.memo.value}, ...prev]);
              setIsExpenseModalOpen(false);
            }} className="space-y-4">
              <input type="date" name="date" defaultValue="2026-11-07" className="w-full" required />
              <select name="category" className="w-full">
                <option value="통행료">통행료 (톨게이트)</option>
                <option value="복귀 교통비">복귀 교통비 (KTX/버스)</option>
                <option value="식비">식비</option>
              </select>
              <input type="number" name="amount" placeholder="지출 금액 (원)" className="w-full text-right" required />
              <input type="text" name="memo" placeholder="상세 메모 (예: 경부고속도로)" className="w-full" />
              <button type="submit" className="cyber-button w-full py-4 rounded-xl mt-2">지출 등록 완료</button>
            </form>
          </div>
        </div>
      )}

      {/* 4. SMS Modal (계좌번호 자동 반영 로직 추가) */}
      {isSmsModalOpen && selectedTripForSms && (
        <div className="fixed inset-0 z-50 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-lg text-white">💬 자동 SMS 생성</h3>
              <button onClick={() => setIsSmsModalOpen(false)} className="text-white"><X /></button>
            </div>
            
            {(() => {
              // 내 정보(profile) 탭에 등록한 계좌정보가 있으면 문구 꼬리말에 추가
              const accountText = accountInfo.bank && accountInfo.number 
                ? `\n\n입금계좌: ${accountInfo.bank} ${accountInfo.number}\n예금주: ${accountInfo.holder}` 
                : '';

              const smsText = `안녕하세요, ${selectedTripForSms.company} ${selectedTripForSms.customer} 담당자님.\n\n${selectedTripForSms.date} 운행건 탁송비 및 주유비 정산 부탁드립니다.\n(총 미수금: ${(selectedTripForSms.freightFee - selectedTripForSms.paidFreight + selectedTripForSms.fuelFee - selectedTripForSms.paidFuel).toLocaleString()}원)${accountText}\n\n감사합니다.`;
              
              return (
                <>
                  <textarea
                    readOnly rows={8}
                    className="w-full resize-none text-sm"
                    value={smsText}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(smsText);
                        alert('계좌번호가 포함된 정산 문구가 복사되었습니다!');
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Copy className="w-4 h-4" /> 문구 복사
                    </button>
                    <button 
                      onClick={() => window.open(`sms:${selectedTripForSms.phone}?body=${encodeURIComponent(smsText)}`)}
                      className="flex-1 cyber-button py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> SMS 전송
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel rounded-none border-b-0 border-l-0 border-r-0 z-50 flex justify-around p-2">
        {mobileNavItems.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center p-2 relative ${activeTab === item.id ? 'text-[#8B5CF6]' : 'text-[#CBD5E1]'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-1 w-3 h-3 bg-[#EC4899] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}