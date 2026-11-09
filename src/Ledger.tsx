import { useState, useEffect } from 'react';
import { db, type Record } from './db';

export default function Ledger() {
  const [records, setRecords] = useState<Record[]>([]);
  const [type, setType] = useState<'수입' | '지출'>('수입');
  const [category, setCategory] = useState('로드탁송');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const loadRecords = async () => {
    const data = await db.records.where('date').equals(today).toArray();
    setRecords(data);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    setCategory(type === '수입' ? '로드탁송' : '주유비');
  }, [type]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    await db.records.add({
      date: today,
      type,
      category,
      amount: Number(amount),
      memo
    });

    setAmount('');
    setMemo('');
    loadRecords();
  };

  const totalIncome = records.filter(r => r.type === '수입').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = records.filter(r => r.type === '지출').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="flex flex-col h-full gap-5">
      {/* 1. 오늘의 요약 (글래스 패널) */}
      <div className="glass-panel p-5 flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-400 mb-1">오늘의 순수익 ({today})</p>
          {/* 에메랄드 그린 컬러 적용 */}
          <h2 className="text-3xl font-black text-[#10B981]">{netProfit.toLocaleString()}원</h2>
        </div>
        <div className="text-right text-sm font-semibold flex flex-col gap-1">
          {/* 스카이블루 컬러 적용 */}
          <p className="text-[#38BDF8]">수입: +{totalIncome.toLocaleString()}원</p>
          {/* 핑크 컬러 적용 */}
          <p className="text-[#EC4899]">지출: -{totalExpense.toLocaleString()}원</p>
        </div>
      </div>

      {/* 2. 입력 폼 (화이트 폼 규격) */}
      <form onSubmit={handleSave} className="glass-panel p-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as '수입'|'지출')} className="w-1/3 text-center">
            <option value="수입">수입</option>
            <option value="지출">지출</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-2/3">
            {type === '수입' ? (
              <>
                <option value="로드탁송">로드탁송</option>
                <option value="대리운전">대리운전</option>
                <option value="기타수입">기타수입</option>
              </>
            ) : (
              <>
                <option value="주유비">주유비</option>
                <option value="교통비">교통비 (톨비/택시)</option>
                <option value="식대">식대</option>
                <option value="기타지출">기타지출</option>
              </>
            )}
          </select>
        </div>
        <input 
          type="number" 
          placeholder="금액을 입력하세요 (원)" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          className="w-full text-right"
        />
        <input 
          type="text" 
          placeholder="메모 (출발지-도착지 등)" 
          value={memo} 
          onChange={(e) => setMemo(e.target.value)} 
          className="w-full"
        />
        {/* 사이버펑크 버튼 규격 적용 */}
        <button 
          type="submit" 
          className="cyber-button mt-3 w-full py-4 rounded-xl text-lg tracking-wider"
        >
          장부에 기록하기
        </button>
      </form>

      {/* 3. 오늘 내역 리스트 */}
      <div className="flex-1 overflow-y-auto glass-panel p-5">
        <h3 className="font-bold mb-4 text-[#CBD5E1]">오늘의 운행 상세내역</h3>
        <div className="flex flex-col gap-3">
          {records.length === 0 ? (
            <p className="text-center text-slate-500 py-10 text-sm font-medium">아직 입력된 내역이 없습니다.</p>
          ) : (
            records.slice().reverse().map((r) => (
              <div key={r.id} className="flex justify-between items-center p-4 rounded-xl bg-[#0f172a]/80 border border-white/5 shadow-inner">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded mr-2 ${r.type === '수입' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-[#EC4899]/20 text-[#EC4899]'}`}>
                    {r.category}
                  </span>
                  <span className="text-[15px] text-white font-medium">{r.memo}</span>
                </div>
                <span className={`font-black tracking-wide ${r.type === '수입' ? 'text-[#38BDF8]' : 'text-[#EC4899]'}`}>
                  {r.type === '수입' ? '+' : '-'}{r.amount.toLocaleString()}원
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}