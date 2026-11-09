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
  Sparkles
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

  // 1. 프리미엄 로그인 화면
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden selection:bg-[#8B5CF6] selection:text-white">
        {/* 사이버펑크 앰비언트 백그라운드 글로우 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-[#8B5CF6]/25 to-[#EC4899]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#38BDF8]/10 rounded-full blur-[120px] pointer-events-none" />

        {/* 글래스모피즘 메인 카드 */}
        <div className="w-full max-w-md bg-[#0F172A]/80 border border-slate-700/60 rounded-3xl p-8 sm:p-10 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.15)] relative z-10 transition-all">
          
          {/* 헤더 섹션: 엠블럼 & 선명한 로고 */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5 group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#38BDF8] rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-16 h-16 bg-[#0B1120] border border-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Wallet className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(236,72,153,0.6)]" />
              </div>
            </div>

            {/* JunDriver: 화이트 & 네온 핑크/퍼플 투톤 그라데이션 타이틀 */}
            <div className="flex items-center gap-1.5">
              <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">Jun</span>
                <span className="bg-gradient-to-r from-[#C084FC] via-[#F472B6] to-[#FB7185] bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(236,72,153,0.5)]">
                  Driver
                </span>
              </h1>
              <Sparkles className="w-4 h-4 text-[#F472B6] animate-pulse" />
            </div>

            <p className="text-xs font-medium text-slate-300 tracking-wide mt-2">
              프로 기사용 스마트 디지털 지갑 & 운행 일지
            </p>
          </div>

          {/* 화이트 폼 인터페이스 */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 tracking-wider">
                이메일 계정
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@driver.com"
                required
                className="w-full px-4 py-3.5 rounded-xl bg-[#FFFFFF] text-[#000000] font-semibold text-sm border-2 border-transparent focus:border-[#8B5CF6] focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/30 shadow-md transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 tracking-wider">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full px-4 py-3.5 rounded-xl bg-[#FFFFFF] text-[#000000] font-semibold text-sm border-2 border-transparent focus:border-[#8B5CF6] focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/30 shadow-md transition-all placeholder:text-slate-400"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* 고급 네온 그라데이션 로그인 버튼 */}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#DB2777] hover:from-[#6D28D9] hover:via-[#7E22CE] hover:to-[#BE185D] text-white font-bold text-sm tracking-wide rounded-xl shadow-[0_10px_25px_-5px_rgba(124,58,237,0.5),0_0_15px_rgba(219,39,119,0.3)] hover:shadow-[0_12px_30px_-5px_rgba(124,58,237,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {authLoading ? '시스템 연결 중...' : '클라우드 로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. 로그인 완료 메인 대시보드
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans pb-16 selection:bg-[#8B5CF6] selection:text-white">
      {/* 프리미엄 글래스 상단 헤더 */}
      <header className="sticky top-0 z-30 bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-800/90 px-4 lg:px-8 py-3.5 shadow-lg shadow-black/20">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] rounded-xl flex items-center justify-center shadow-md shadow-[#8B5CF6]/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white">
                Jun<span className="bg-gradient-to-r from-[#C084FC] to-[#F472B6] bg-clip-text text-transparent">Driver</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black bg-gradient-to-r from-[#8B5CF6]/20 to-[#EC4899]/20 text-[#C084FC] rounded-md border border-[#8B5CF6]/40 shadow-sm">
                PRO
              </span>
            </div>
          </div>

          {/* 사용자 계정 정보 배지 & 로그아웃 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowProfileModal(true);
                setPwdMessage(null);
                setNewPassword('');
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-[#8B5CF6] hover:bg-slate-800/90 transition-all text-xs text-slate-200 shadow-md group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/30 flex items-center justify-center border border-[#8B5CF6]/60 text-[#C084FC] group-hover:scale-105 transition-transform">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold max-w-[150px] truncate">{session.user.email}</span>
            </button>

            <button
              onClick={handleLogout}
              title="로그아웃"
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 대시보드 메인 본문 */}
      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-8 space-y-6">
        {/* 상단 3단 스탯 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0F172A]/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-3">
              <span>총 매출</span>
              <DollarSign className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {totalGross.toLocaleString()}<span className="text-base font-normal text-slate-400 ml-1">원</span>
            </div>
          </div>

          <div className="bg-[#0F172A]/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-3">
              <span>순수익 (수수료 제외)</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {totalNet.toLocaleString()}<span className="text-base font-normal text-slate-400 ml-1">원</span>
            </div>
          </div>

          <div className="bg-[#0F172A]/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-3">
              <span>팁 & 부가수익</span>
              <Wallet className="w-4 h-4 text-[#F472B6]" />
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-[#F472B6] tracking-tight">
              {totalTips.toLocaleString()}<span className="text-base font-normal text-slate-400 ml-1">원</span>
            </div>
          </div>
        </div>

        {/* 운행 일지 리스트 카드 */}
        <div className="bg-[#0F172A]/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#C084FC]">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">최근 운행 일지</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
              총 {records.length}건
            </span>
          </div>

          <div className="space-y-3">
            {records.map((r) => (
              <div
                key={r.id}
                className="bg-[#0B1120]/70 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 hover:bg-[#0B1120]/90 transition-all"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#C084FC] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{r.departure}</span>
                      <span className="text-[#8B5CF6]">➔</span>
                      <span>{r.destination}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" /> {r.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {r.duration}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">매출 {r.grossAmount.toLocaleString()}원</div>
                    <div className="text-sm font-bold text-emerald-400">
                      순수입 +{r.netAmount.toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 계정 관리 & 비밀번호 변경 모달 */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(139,92,246,0.2)] relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#C084FC]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">계정 및 보안 설정</h3>
                <p className="text-xs text-slate-400 mt-0.5">접속 계정: {session.user.email}</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  새 비밀번호 입력 (6자리 이상)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새로운 비밀번호"
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-[#FFFFFF] text-[#000000] font-semibold text-sm border-2 border-transparent focus:border-[#8B5CF6] focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/30 shadow-md transition-all placeholder:text-slate-400"
                />
              </div>

              {pwdMessage && (
                <div
                  className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-medium ${
                    pwdMessage.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
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

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#DB2777] hover:from-[#6D28D9] hover:via-[#7E22CE] hover:to-[#BE185D] text-white font-bold text-xs tracking-wide transition-all shadow-[0_8px_20px_-4px_rgba(124,58,237,0.5)] disabled:opacity-50 cursor-pointer"
                >
                  {pwdLoading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
