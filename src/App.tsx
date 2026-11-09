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
  AlertCircle
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
  duration: string;
  departure: string;
  destination: string;
  grossAmount: number;
  feeRate: number;
  tipAmount: number;
  netAmount: number;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 비밀번호 변경 모달 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 샘플 운행 기록
  const [records] = useState<DrivingRecord[]>([
    {
      id: '1',
      date: '2026-11-09',
      startTime: '08:30',
      endTime: '11:00',
      duration: '2시간 30분',
      departure: '경기 광주',
      destination: '인천 송도',
      grossAmount: 85000,
      feeRate: 20,
      tipAmount: 5000,
      netAmount: 73000,
    },
  ]);

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
      setPwdMessage({ type: 'error', text: '비밀번호 변경 실패: ' + error.message });
    } else {
      setPwdMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다!' });
      setNewPassword('');
    }
    setPwdLoading(false);
  };

  const totalGross = records.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const totalNet = records.reduce((acc, cur) => acc + cur.netAmount, 0);
  const totalTips = records.reduce((acc, cur) => acc + cur.tipAmount, 0);

  // 1. 모던 & 미니멀 하이엔드 로그인 화면
  if (!session) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 font-sans relative selection:bg-indigo-500 selection:text-white">
        {/* 미세한 앰비언트 글로우 */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* 미니멀 글래스 카드 */}
        <div className="w-full max-w-[390px] bg-[#0E1424]/90 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
          
          {/* 심플 엠블럼 & 타이틀 */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-13 h-13 p-3 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-center shadow-inner mb-4">
              <Wallet className="w-6 h-6 text-indigo-400" />
            </div>

            <div className="flex items-center gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                JunDriver
              </h1>
              <span className="text-[10px] font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1.5 tracking-tight">
              기사용 스마트 디지털 지갑 & 운행 일지
            </p>
          </div>

          {/* 폼 인터페이스 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                이메일 계정
              </label>
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
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                비밀번호
              </label>
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

            {/* 정갈한 솔리드 인디고 버튼 */}
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

  // 2. 대시보드 화면
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans pb-16">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 bg-[#0E1424]/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white">JunDriver</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
              PRO
            </span>
          </div>

          {/* 계정 관리 버튼 */}
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

      {/* 본문 콘텐츠 */}
      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-[#0E1424]/70 border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>총 매출</span>
              <DollarSign className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalGross.toLocaleString()}원</div>
          </div>

          <div className="bg-[#0E1424]/70 border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>순수익 (수수료 제외)</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{totalNet.toLocaleString()}원</div>
          </div>

          <div className="bg-[#0E1424]/70 border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>팁 & 부가수익</span>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-400">{totalTips.toLocaleString()}원</div>
          </div>
        </div>

        <div className="bg-[#0E1424]/70 border border-slate-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">최근 운행 일지</h2>
            </div>
            <span className="text-xs text-slate-400">총 {records.length}건</span>
          </div>

          <div className="space-y-2.5">
            {records.map((r) => (
              <div
                key={r.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-all"
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
                        <Calendar className="w-3.5 h-3.5" /> {r.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {r.duration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                  <div className="text-xs text-slate-400">매출 {r.grossAmount.toLocaleString()}원</div>
                  <div className="text-sm font-bold text-emerald-400">
                    순수입 +{r.netAmount.toLocaleString()}원
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 계정 관리 & 비밀번호 변경 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0E1424] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
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
                  className="flex-1 py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50"
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
