import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  Wallet, Calendar, Clock, MapPin, TrendingUp, DollarSign, FileText, User, LogOut,
  KeyRound, X, CheckCircle2, AlertCircle, PlusCircle, CreditCard, Receipt, Trash2,
  Copy, Car, Filter, RotateCcw, CalendarDays, ShieldCheck, ChevronRight, Smartphone,
  Fuel, AlertTriangle, MessageSquare, Check, Edit2, Coins, Sparkles, Phone,
  RefreshCw, UserX, ShieldAlert, BarChart3, Megaphone, Users, Download,
  Award, Crown, BookmarkPlus, Radio, Send, Building2, Info, Map, Target, Navigation, Search
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_DEFAULT_EMAIL = 'beat4989@naver.com';
const ADMIN_DEFAULT_NAME = '김탁송'; 
const ADMIN_DEFAULT_PHONE = '01091417586';

const getTodayKST = () => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split('T')[0];
};

const formatNumberWithComma = (val: string | number) => {
  if (val === '' || val === null || val === undefined) return '';
  const numStr = String(val).replace(/[^0-9]/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('ko-KR');
};

const cleanNumber = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return Number(String(val).replace(/,/g, '')) || 0;
};

const formatPhoneNumber = (val: string) => {
  if (!val) return '';
  const num = val.replace(/[^0-9]/g, '');
  if (num.length === 11) return num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  else if (num.length === 10) return num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return num;
};

interface DrivingRecord {
  id: string; userId?: string; date: string; startTime: string; endTime: string;
  departure: string; destination: string; grossAmount: number; feeRate: number;
  fuelAmount: number; extraExpenseAmount: number; tipAmount: number; 
  isGrossPaid: boolean; isExpensePaid: boolean; // 분리 미수금 적용
  netAmount: number; totalClaimAmount: number;
}
interface ExpenseRecord { id: string; date: string; category: string; amount: number; memo: string; }
interface BankAccount { id: string; bankName: string; accountNumber: string; holder: string; }
interface MemberProfile { id: string; email: string; name: string; phone: string; role: string; createdAt: string; lastLoginAt?: string; loginCount?: number; recordCount?: number; }
interface NoticeItem { id: string; title: string; content: string; isActive: boolean; updatedAt?: string; }

// 전국 주요 자동차 매매단지
const TRADE_CENTERS = [
  { id: '1', name: '수원 도이치오토월드', tier: 'S', region: '수도권', addr: '경기 수원시 권선구 권선로 308-5', desc: '전국 최대 실내 복합단지. 지하~지상 층별 상사 밀집 (전국 탁송 출고 최다 지역)' },
  { id: '2', name: '수원 SK V1 모터스', tier: 'S', region: '수도권', addr: '경기 수원시 권선구 평동로79번길 45', desc: '도이치오토월드 바로 옆 대형 실내 단지. 탁송 콜 집중 발생 구역.' },
  { id: '3', name: '인천 엠파크 (허브/타워)', tier: 'S', region: '수도권', addr: '인천 서구 봉수대로 158', desc: '인천 권역 최대 메가 허브. 허브동과 타워동 위치 구분 필수.' },
  { id: '4', name: '용인 오토허브', tier: 'S', region: '수도권', addr: '경기 용인시 기흥구 중부대로 242', desc: '경부고속도로 신갈IC 인근. 접근성 매우 우수한 초대형 복합단지.' },
  { id: '5', name: '서울 서서울모터리움', tier: 'A', region: '수도권', addr: '서울 강서구 양천로53길 30', desc: '서울 서부권 최대 실내 자동차 백화점. 올림픽대로/가양대교 인접 출고 활발.' },
  { id: '6', name: '김포 국민차매매단지 (공항점)', tier: 'A', region: '수도권', addr: '경기 김포시 고촌읍 아라육로152번길 45', desc: '김포 아라뱃길 물류축 위치. 수도권 서북부 대형 실내 단지.' },
  { id: '7', name: '부산 경동오토필드', tier: 'A', region: '영남권', addr: '부산 기장군 장안읍 반룡산단3로 95', desc: '영남 최대 3만6천평급 실내 백화점식 복합단지. 동해고속도로 장안IC 인근 상행 콜 다수.' },
  { id: '8', name: '대구 엠월드', tier: 'A', region: '영남권', addr: '대구 서구 문화로 37', desc: '대구 및 경북권 최대 규모 실내 매매단지. 서대구역 인근 위치.' },
  { id: '9', name: '부산 사직오토랜드', tier: 'A', region: '영남권', addr: '부산 연제구 경기장로 15', desc: '부산 권역 전통 대표 매매단지. 도심 내 장거리 종착 및 신규 출발 요충지.' },
  { id: '10', name: '대전 디오토몰', tier: 'A', region: '충청권', addr: '대전 유성구 복용동로 35', desc: '충청권 핵심 실내 단지. 영호남 이동 시 중간 복귀콜 환적 전초기지.' },
  { id: '11', name: '대전 오토월드', tier: 'A', region: '충청권', addr: '대전 유성구 유성대로 510', desc: '디오토몰 인근 복용동 매매단지 핵심 거점. 풍부한 지방 이동 콜.' },
  { id: '12', name: '광주 풍암매매단지', tier: 'A', region: '호남권', addr: '광주 서구 매월1로 50', desc: '호남권 최대 중고차 거래 거점. 대규모 단지 및 상사 밀집.' },
  { id: '13', name: '광주 엠플러스 (M-PLUS)', tier: 'A', region: '호남권', addr: '광주 서구 매월1로62번길 24', desc: '풍암지구 내 신축 대형 실내 복합 백화점. 호남권 딜러 출고 집중지.' },
  { id: '14', name: '부천 국민차매매단지', tier: 'B', region: '수도권', addr: '경기 부천시 송내대로 450', desc: '수도권 서부권역 주요 전통 매매단지.' },
  { id: '15', name: '부천 DY카랜드', tier: 'B', region: '수도권', addr: '경기 부천시 신흥로 399번길 50', desc: '경인고속도로 부천IC 인접. 오정동 대형 매매단지.' },
  { id: '16', name: '천안 북천안매매단지', tier: 'B', region: '충청권', addr: '충남 천안시 서북구 번영로 608', desc: '천안아산역 인근 위치. 수도권 복귀콜이 자주 발생하는 곳.' },
  { id: '17', name: '전주 장동매매단지', tier: 'B', region: '호남권', addr: '전북 전주시 덕진구 장동유통로 12', desc: '전북 권역 핵심 단지. 호남IC 인근 접근성 양호.' },
  { id: '18', name: '창원 디오토몰', tier: 'B', region: '영남권', addr: '경남 창원시 성산구 공단로 18', desc: '경남 지역의 대표적인 신축 실내 복합 매매단지.' }
];

// 전국 자동차 경매장 일정 데이터
const AUCTION_SCHEDULES = [
  { day: '월요일', hex: '#38BDF8', locations: [{ name: '안성 롯데렌탈', tier: 'S', addr: '경기 안성시 내가천리 12', tag: '롯데' }, { name: '진천 광혜원 오토보이', tier: 'B', addr: '충북 진천군 금천길 37', tag: '오토보이' }] },
  { day: '화요일', hex: '#EC4899', locations: [{ name: '시화(시흥) 현대글로비스', tier: 'S', addr: '경기 시흥시 정왕천로 271', tag: '글로비스' }, { name: '오포(분당) 현대글로비스', tier: 'S', addr: '경기 광주시 능평리 174-25', tag: '글로비스' }, { name: '세종(부강) K Car', tier: 'A', addr: '세종 부강면 문곡리 산 249', tag: '케이카' }, { name: '천안 SK경매장', tier: 'B', addr: '충남 천안시 구성동', tag: 'SK' }] },
  { day: '수요일', hex: '#10B981', locations: [{ name: '안성 오토허브 (구 AJ셀카)', tier: 'S', addr: '경기 안성시 문터길 60', tag: '오토허브' }, { name: '시화(시흥) 현대글로비스', tier: 'S', addr: '경기 시흥시 정왕동 2122-4', tag: '글로비스' }, { name: '인천 현대글로비스', tier: 'A', addr: '인천 서구 가좌동 173-203', tag: '글로비스' }] },
  { day: '목요일', hex: '#F59E0B', locations: [{ name: '양산 현대글로비스', tier: 'S', addr: '경남 양산시 산막동 572-1', tag: '글로비스' }, { name: '오산 K Car', tier: 'A', addr: '경기 오산시 은계동 7-30', tag: '케이카' }, { name: '인천 현대글로비스', tier: 'A', addr: '인천 서구 가좌동 173-203', tag: '글로비스' }, { name: '진천 광혜원 오토보이', tier: 'B', addr: '충북 진천군 금천길 37', tag: '오토보이' }] },
  { day: '금요일', hex: '#8B5CF6', locations: [{ name: '시화(시흥) 현대글로비스', tier: 'S', addr: '경기 시흥시 정왕동 2122-4', tag: '글로비스' }, { name: '오포(분당) 현대글로비스', tier: 'A', addr: '경기 광주시 능평리 174-25', tag: '글로비스' }] }
];

export default function App() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();

  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [currentUserProfile, setCurrentUserProfile] = useState<MemberProfile | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false); 
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(''); const [authSuccess, setAuthSuccess] = useState('');
  const [honeypot, setHoneypot] = useState(''); const [captchaVerified, setCaptchaVerified] = useState(false);

  // 이전의 모든 탭 정상 복구
  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'analytics' | 'wallet' | 'trade_centers' | 'auctions' | 'admin'>('records');
  const [adminSubTab, setAdminSubTab] = useState<'members' | 'campaign' | 'analytics'>('members');
  
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayKST());
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);
  
  const [tradeFilter, setTradeFilter] = useState<'전체' | 'S등급' | 'A등급' | '수도권' | '충청권' | '영남권' | '호남권'>('전체');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 관제탑 기사 상세조회 (CS 모달)
  const [adminSelectedUser, setAdminSelectedUser] = useState<MemberProfile | null>(null);
  const [adminSelectedUserRecords, setAdminSelectedUserRecords] = useState<DrivingRecord[]>([]);

  // 운행 일지 수정 모달
  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDeparture, setEditDeparture] = useState(''); const [editDestination, setEditDestination] = useState('');
  const [editGross, setEditGross] = useState(''); const [editFuel, setEditFuel] = useState('');
  const [editExtra, setEditExtra] = useState(''); const [editTip, setEditTip] = useState('');

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true); const [includeFuel, setIncludeFuel] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true); const [claimMessageText, setClaimMessageText] = useState('');
  
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try { const saved = localStorage.getItem('jundriver_local_accounts_merged'); if (saved) return JSON.parse(saved); } catch (e) {}
    return [{ id: '1', bankName: '신한은행', accountNumber: '110-123-456789', holder: '김탁송' }];
  });

  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [inputNoticeTitle, setInputNoticeTitle] = useState(''); const [inputNoticeContent, setInputNoticeContent] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null); const [noticeLoading, setNoticeLoading] = useState(false);

  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // 새 운행 등록
  const [newDate, setNewDate] = useState<string>(() => getTodayKST());
  const [newStartTime, setNewStartTime] = useState(''); const [newEndTime, setNewEndTime] = useState('');
  const [newDeparture, setNewDeparture] = useState(''); const [newDestination, setNewDestination] = useState('');
  const [newGross, setNewGross] = useState(''); const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFuel, setNewFuel] = useState(''); const [newExtraExpense, setNewExtraExpense] = useState(''); const [newTip, setNewTip] = useState('');
  
  const [expCategory, setExpCategory] = useState('대중교통'); const [expAmount, setExpAmount] = useState(''); const [expMemo, setExpMemo] = useState('');
  const [bankName, setBankName] = useState(''); const [accountNumber, setAccountNumber] = useState(''); const [holder, setHolder] = useState('');

  useEffect(() => { localStorage.setItem('jundriver_local_accounts_merged', JSON.stringify(accounts)); }, [accounts]);

  const fetchNotices = async () => {
    const { data, error } = await supabase.from('announcements').select('*').order('updated_at', { ascending: false });
    if (data && !error) {
      const formatted: NoticeItem[] = data.map((d: any) => ({
        id: d.id, title: d.title, content: d.content, isActive: Boolean(d.is_active), updatedAt: d.updated_at ? d.updated_at.substring(0, 16).replace('T', ' ') : '',
      }));
      setNoticeList(formatted);
      setActiveNotice(formatted.find((n) => n.isActive) || null);
    }
  };

  const fetchUserData = async (userId: string, userEmail: string, userMeta?: any) => {
    let role = 'user';
    const cleanMail = userEmail.toLowerCase();
    const metaName = userMeta?.name || (cleanMail === ADMIN_DEFAULT_EMAIL ? ADMIN_DEFAULT_NAME : '기사님');
    const metaPhone = userMeta?.phone || (cleanMail === ADMIN_DEFAULT_EMAIL ? ADMIN_DEFAULT_PHONE : '');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    role = cleanMail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : (profile?.role || 'user');
    setCurrentUserRole(role);

    const currentCount = profile?.login_count || 0;
    const nowIso = new Date().toISOString();
    const profilePayload = {
      id: userId, email: cleanMail, name: profile?.name || metaName, phone: profile?.phone || metaPhone,
      role: role, created_at: profile?.created_at || nowIso,
      last_login_at: nowIso, login_count: currentCount + 1
    };
    await supabase.from('profiles').upsert(profilePayload);

    setCurrentUserProfile({
      id: userId, email: cleanMail, name: profilePayload.name, phone: profilePayload.phone, role: profilePayload.role,
      createdAt: (profilePayload.created_at || '').substring(0, 10),
      lastLoginAt: profilePayload.last_login_at, loginCount: profilePayload.login_count
    });

    const { data: recordsData } = await supabase.from('driving_records').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (recordsData) {
      setRecords(recordsData.map((r: any) => ({
        id: r.id, date: r.date, startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
        grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount), extraExpenseAmount: Number(r.extra_expense_amount),
        tipAmount: Number(r.tip_amount), 
        isGrossPaid: Boolean(r.is_gross_paid), isExpensePaid: Boolean(r.is_expense_paid), 
        netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
      })));
    }

    const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (expensesData) setExpenses(expensesData.map((e: any) => ({ id: e.id, date: e.date, category: e.category, amount: Number(e.amount), memo: e.memo || '' })));
    
    if (role === 'super_admin' || role === 'manager') fetchAdminData();
  };

  const fetchAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('last_login_at', { ascending: false });
    const { data: allRecs } = await supabase.from('driving_records').select('*');
    if (profiles && allRecs) {
      setAdminMemberList(profiles.map((p: any) => ({ 
        id: p.id, email: p.email, name: p.name, phone: p.phone, role: p.role || 'user', 
        createdAt: p.created_at ? p.created_at.substring(0, 10) : '-', 
        lastLoginAt: p.last_login_at ? p.last_login_at.substring(0, 16).replace('T', ' ') : '기록없음',
        loginCount: p.login_count || 0,
        recordCount: allRecs.filter((r: any) => r.user_id === p.id).length 
      })));
      setAdminAllRecords(allRecs.map((r: any) => ({ 
        id: r.id, userId: r.user_id, date: r.date, departure: r.departure, destination: r.destination, 
        grossAmount: Number(r.gross_amount), fuelAmount: Number(r.fuel_amount), feeRate: Number(r.fee_rate), extraExpenseAmount: Number(r.extra_expense_amount), tipAmount: Number(r.tip_amount), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount), isGrossPaid: Boolean(r.is_gross_paid), isExpensePaid: Boolean(r.is_expense_paid) 
      })));
    }
  };

  useEffect(() => {
    fetchNotices();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '', session.user.user_metadata);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '', session.user.user_metadata);
      else { setRecords([]); setExpenses([]); setCurrentUserRole('user'); setCurrentUserProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password.trim() });
    if (error) setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.');
    setAuthLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError('');
    if (honeypot.trim() !== '') { setAuthLoading(false); return; }
    if (!captchaVerified) { setAuthError('보안 확인을 완료해 주세요.'); setAuthLoading(false); return; }
    if (password !== passwordConfirm) { setAuthError('비밀번호가 일치하지 않습니다.'); setAuthLoading(false); return; }
    if (!agreePrivacy) { setAuthError('개인정보 수집 및 이용에 동의해 주세요.'); setAuthLoading(false); return; }
    
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password: password.trim(),
      options: { data: { name: name.trim(), phone: phone.replace(/[^0-9]/g, ''), privacy_policy_agreed: true, created_at: nowIso } }
    });

    if (error) { setAuthError('가입 실패: ' + error.message); }
    else {
      if (data.user) {
        await supabase.from('profiles').upsert([{ id: data.user.id, email: email.trim().toLowerCase(), name: name.trim(), phone: phone.replace(/[^0-9]/g, ''), role: 'user', created_at: nowIso, last_login_at: nowIso, login_count: 1 }]);
      }
      setAuthSuccess('회원가입 완료! 로그인해 주세요.'); setAuthMode('login');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setShowProfileModal(false); setActiveTab('records'); };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdLoading(true); setPwdMessage(null);
    if (newPassword.length < 6) { setPwdMessage({ type: 'error', text: '비밀번호는 최소 6자리 이상이어야 합니다.' }); setPwdLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPwdMessage({ type: 'error', text: error.message });
    else { setPwdMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' }); setNewPassword(''); }
    setPwdLoading(false);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!session) return;
    const gross = cleanNumber(newGross); const feeRate = cleanNumber(newFeeRate); const fuel = cleanNumber(newFuel);
    const extraExp = cleanNumber(newExtraExpense); const tip = cleanNumber(newTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + extraExp;
    const recordId = 'rec_' + Date.now().toString();

    const payload = { 
      id: recordId, user_id: session.user.id, date: newDate, start_time: newStartTime || '-', end_time: newEndTime || '-', departure: newDeparture, destination: newDestination, 
      gross_amount: gross, fee_rate: feeRate, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, 
      is_gross_paid: false, is_expense_paid: false, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal) 
    };
    const { error } = await supabase.from('driving_records').insert([payload]);
    if (!error) {
      const updated = [{ ...payload, startTime: payload.start_time, endTime: payload.end_time, grossAmount: gross, feeRate, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, isGrossPaid: false, isExpensePaid: false, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) }, ...records];
      updated.sort((a, b) => b.date.localeCompare(a.date));
      setRecords(updated); setSelectedDate(newDate);
      setNewDeparture(''); setNewDestination(''); setNewGross(''); setNewFuel(''); setNewExtraExpense(''); setNewTip('');
    }
  };

  const toggleGrossPaid = async (id: string) => {
    const target = records.find((r) => r.id === id); if (!target) return;
    const { error } = await supabase.from('driving_records').update({ is_gross_paid: !target.isGrossPaid }).eq('id', id);
    if (!error) setRecords(records.map((r) => (r.id === id ? { ...r, isGrossPaid: !target.isGrossPaid } : r)));
  };
  const toggleExpensePaid = async (id: string) => {
    const target = records.find((r) => r.id === id); if (!target) return;
    const { error } = await supabase.from('driving_records').update({ is_expense_paid: !target.isExpensePaid }).eq('id', id);
    if (!error) setRecords(records.map((r) => (r.id === id ? { ...r, isExpensePaid: !target.isExpensePaid } : r)));
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingRecord) return;
    const gross = cleanNumber(editGross); const fuel = cleanNumber(editFuel); const extraExp = cleanNumber(editExtra); const tip = cleanNumber(editTip);
    const net = gross - (gross * (editingRecord.feeRate / 100)) + tip; const claimTotal = gross + fuel + extraExp;
    const { error } = await supabase.from('driving_records').update({ date: editDate, departure: editDeparture, destination: editDestination, gross_amount: gross, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal) }).eq('id', editingRecord.id);
    if (!error) {
      setRecords(records.map((r) => r.id === editingRecord.id ? { ...r, date: editDate, departure: editDeparture, destination: editDestination, grossAmount: gross, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal) } : r));
      setEditingRecord(null);
    }
  };
  const handleDeleteRecord = async (id: string) => { await supabase.from('driving_records').delete().eq('id', id); setRecords(records.filter(r => r.id !== id)); };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault(); const cleanAmt = cleanNumber(expAmount); if (!cleanAmt || !session) return;
    const expenseId = 'exp_' + Date.now().toString();
    const { error } = await supabase.from('expenses').insert([{ id: expenseId, user_id: session.user.id, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }]);
    if (!error) { setExpenses([{ id: expenseId, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }, ...expenses]); setExpAmount(''); setExpMemo(''); }
  };
  const handleDeleteExpense = async (id: string) => { await supabase.from('expenses').delete().eq('id', id); setExpenses(expenses.filter((e) => e.id !== id)); };
  
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault(); if (!bankName || !accountNumber) return;
    setAccounts([...accounts, { id: Date.now().toString(), bankName, accountNumber, holder: holder || '김탁송' }]);
    setBankName(''); setAccountNumber(''); setHolder('');
  };
  const handleDeleteAccount = (id: string) => { setAccounts(accounts.filter(a => a.id !== id)); };

  // 통계 계산 로직 복구
  const currentMonthPrefix = selectedDate.substring(0, 7);
  const monthlyRecords = records.filter((r) => r.date.startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withExtra: boolean) => {
    const primaryAccount = accounts[0] || { bankName: '은행명', accountNumber: '계좌번호', holder: '예금주' };
    const driverPhone = formatPhoneNumber(currentUserProfile?.phone || '');
    let total = 0; let itemsText = '';
    if (withGross) { total += r.grossAmount; itemsText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`; }
    if (withFuel && r.fuelAmount > 0) { total += r.fuelAmount; itemsText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원\n`; }
    if (withExtra && r.extraExpenseAmount > 0) { total += r.extraExpenseAmount; itemsText += `* 대납 추가경비: ${r.extraExpenseAmount.toLocaleString()}원\n`; }
    return `[정산 요청]\n* 일자: ${r.date}\n* 구간: ${r.departure} → ${r.destination}\n${itemsText}--------------------------------\n* 청구액: ${total.toLocaleString()}원\n* 계좌: ${primaryAccount.bankName} ${primaryAccount.accountNumber} (${primaryAccount.holder})\n기사: ${currentUserProfile?.name} (${driverPhone})\n빠른 입금 부탁드립니다. 감사합니다.`;
  };

  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r); 
    const initGross = !r.isGrossPaid; 
    const initFuel = !r.isExpensePaid && r.fuelAmount > 0;
    const initExtra = !r.isExpensePaid && r.extraExpenseAmount > 0;
    setIncludeGross(initGross); setIncludeFuel(initFuel); setIncludeExtra(initExtra);
    setClaimMessageText(buildClaimText(r, initGross, initFuel, initExtra)); setClaimModalOpen(true);
  };
  const handleToggleInclude = (type: 'gross' | 'fuel' | 'extra') => {
    if (!selectedClaimRecord) return;
    const newGross = type === 'gross' ? !includeGross : includeGross; const newFuel = type === 'fuel' ? !includeFuel : includeFuel; const newExtra = type === 'extra' ? !includeExtra : includeExtra;
    setIncludeGross(newGross); setIncludeFuel(newFuel); setIncludeExtra(newExtra);
    setClaimMessageText(buildClaimText(selectedClaimRecord, newGross, newFuel, newExtra));
  };

  // 관리자 - 기사 권한 변경
  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (currentUserRole !== 'super_admin') { alert('최고 관리자만 변경 가능합니다.'); return; }
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    if (!error) { alert('권한이 변경되었습니다.'); fetchAdminData(); } else { alert('변경 실패: ' + error.message); }
  };

  const openAdminUserDetail = (user: MemberProfile) => {
    setAdminSelectedUser(user);
    const userRecs = adminAllRecords.filter(r => r.userId === user.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    setAdminSelectedUserRecords(userRecs);
  };

  const getElapsedDays = (recordDate: string) => {
    const today = new Date(getTodayKST()); const target = new Date(recordDate);
    return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredRecords = filterAllDates ? records : records.filter((r) => r.date === selectedDate);
  const unpaidRecords = records.filter((r) => !r.isGrossPaid || (!r.isExpensePaid && (r.fuelAmount > 0 || r.extraExpenseAmount > 0)));
  const totalUnpaidAmount = unpaidRecords.reduce((acc, r) => {
    let amt = 0;
    if (!r.isGrossPaid) amt += r.grossAmount;
    if (!r.isExpensePaid) amt += (r.fuelAmount + r.extraExpenseAmount);
    return acc + amt;
  }, 0);
  
  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';

  const filteredTradeCenters = TRADE_CENTERS.filter(center => {
    if (tradeFilter === '전체') return true;
    if (tradeFilter === 'S등급') return center.tier === 'S';
    if (tradeFilter === 'A등급') return center.tier === 'A';
    if (tradeFilter === '수도권') return center.region === '수도권';
    if (tradeFilter === '충청권') return center.region === '충청권';
    if (tradeFilter === '영남권') return center.region === '영남권';
    if (tradeFilter === '호남권') return center.region === '호남권';
    return true;
  });

  const injectStyles = () => (
    <style dangerouslySetInnerHTML={{__html: `
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
      * { font-family: 'Pretendard', sans-serif !important; }
      body { background-color: #0B1120; color: white; }
      input, select, textarea { background-color: #FFFFFF !important; color: #000000 !important; font-weight: 600 !important; border: 1px solid transparent !important; transition: all 0.3s ease !important; }
      input:focus, select:focus, textarea:focus { box-shadow: 0 0 12px #8B5CF6 !important; border-color: #8B5CF6 !important; outline: none !important; }
      .hp-primary-btn { background: linear-gradient(135deg, #8B5CF6, #4F46E5) !important; color: white !important; transition: transform 0.3s ease, box-shadow 0.3s ease !important; border: none !important; }
      .hp-primary-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5) !important; }
      .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
      .fade-in-text { animation: fadeIn 0.5s ease-in-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
    `}} />
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {injectStyles()}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-[#8B5CF6]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-[420px] glass-card rounded-2xl p-7 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-[#0B1120] border border-[#8B5CF6]/30 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(139,92,246,0.2)]"><Car className="w-6 h-6 text-[#8B5CF6]" /></div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">JunDriver <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">PRO</span></h1>
          </div>
          <div className="flex bg-[#0B1120] p-1 rounded-xl border border-white/10 mb-5">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>로그인</button>
            <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'signup' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>회원가입</button>
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full px-3.5 py-2.5 rounded-lg" />
              {authError && <div className="p-3 bg-[#EC4899]/10 text-[#EC4899] text-xs rounded-lg">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg mt-2">로그인</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <input type="text" className="hidden" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <div className="grid grid-cols-2 gap-2"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" required className="w-full px-3.5 py-2.5 rounded-lg" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="휴대폰번호" required className="w-full px-3.5 py-2.5 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-2"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full px-3.5 py-2.5 rounded-lg" /><input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="비밀번호 재입력" required className="w-full px-3.5 py-2.5 rounded-lg" /></div>
              <div onClick={() => setCaptchaVerified(!captchaVerified)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${captchaVerified ? 'bg-[#38BDF8]/20 border-[#38BDF8]/50 text-[#38BDF8]' : 'bg-[#0B1120] border-white/10'}`}>
                <div className="flex items-center gap-2.5"><div className={`w-5 h-5 rounded-md border flex items-center justify-center ${captchaVerified ? 'bg-[#38BDF8] border-[#38BDF8] text-white' : 'border-slate-600 bg-slate-800'}`}>{captchaVerified && <Check className="w-3.5 h-3.5" />}</div><span className="text-xs font-semibold">로봇이 아닙니다</span></div>
              </div>
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-[#0B1120] border border-white/10">
                  <div className="flex items-start gap-2.5">
                    <input type="checkbox" id="agreeChk" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6]" />
                    <label htmlFor="agreeChk" className="text-xs text-slate-200 font-medium leading-relaxed cursor-pointer">[필수] 서비스 품질 향상 및 통계 데이터 수집·활용에 동의합니다.</label>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pl-6 mt-1">
                    <span className="text-[#38BDF8]">계좌는 기기 로컬에만 보관됩니다.</span>
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[#8B5CF6] underline font-semibold">전문보기</button>
                  </div>
                </div>
              </div>
              {authError && <div className="p-2.5 bg-[#EC4899]/10 text-[#EC4899] text-xs rounded-lg">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg mt-2">동의하고 회원가입</button>
            </form>
          )}
        </div>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl relative z-20">
              <button onClick={() => setShowPrivacyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
              <h3 className="text-sm font-bold text-white mb-3">개인정보 수집 및 이용 방침</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">JunDriver는 탁송 운행 기록 및 주유비 청구 내역을 클라우드에 안전하게 보관합니다. 송금용 계좌 정보 등은 외부로 전송되지 않고 본인의 기기에만 보관됩니다.</p>
              <button type="button" onClick={() => { setAgreePrivacy(true); setShowPrivacyModal(false); }} className="w-full py-2.5 hp-primary-btn font-bold text-xs rounded-xl cursor-pointer">확인 및 동의</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const userName = currentUserProfile?.name || session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 pb-20 relative">
      {injectStyles()}
      <header className="sticky top-0 z-30 glass-card border-b-0 border-white/5 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-lg flex items-center justify-center shadow-[0_0_10px_#8B5CF6]"><Car className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-base text-white">JunDriver</span><span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#8B5CF6]/20 text-[#8B5CF6] rounded border border-[#8B5CF6]/30">PRO</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdminUser && <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30"><Crown className="w-3.5 h-3.5" /><span className="hidden sm:inline">관제탑</span></button>}
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs text-slate-200 cursor-pointer">
              <User className="w-3.5 h-3.5 text-[#8B5CF6]" /><div className="text-left"><span className="block font-bold text-white leading-tight">{userName}님</span></div>
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded-lg glass-card text-slate-400 hover:text-[#EC4899]"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-5 space-y-5 h-full">
        {/* 모든 8개 탭 정상 복구 */}
        <div className="bg-[#0B1120] p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="grid grid-cols-4 md:flex md:flex-wrap gap-1.5">
            <button onClick={() => setActiveTab('records')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'records' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>운행 일지</button>
            <button onClick={() => setActiveTab('claims')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold relative transition-all ${activeTab === 'claims' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>
              청구 관리 {unpaidRecords.length > 0 && <span className="ml-0.5 px-1 py-0.2 rounded-full bg-[#EC4899] text-white text-[9px] font-extrabold">{unpaidRecords.length}</span>}
            </button>
            <button onClick={() => setActiveTab('expense')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'expense' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>경비 장부</button>
            <button onClick={() => setActiveTab('analytics')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'analytics' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>통계 요약</button>
            
            {/* 2번째 줄 */}
            <button onClick={() => setActiveTab('wallet')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'wallet' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>계좌 관리</button>
            <button onClick={() => setActiveTab('trade_centers')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'trade_centers' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>매매단지</button>
            <button onClick={() => setActiveTab('auctions')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'auctions' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>경매장</button>
            {isAdminUser ? <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${activeTab === 'admin' ? 'bg-[#38BDF8] text-[#0B1120] font-extrabold shadow-[0_2px_10px_#38BDF8]' : 'bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30'}`}>관제탑</button> : <div className="hidden md:block"></div>}
          </div>
        </div>

        {/* 1. 운행 일지 탭 (분리 미수금 적용) */}
        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#8B5CF6]" />새 운행 배차 등록</h3>
              <form onSubmit={handleAddRecord} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label><input type="text" value={newGross} onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg text-right" /></div><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label><input type="number" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-right" /></div></div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-[#8B5CF6]/30 space-y-2.5">
                  <label className="text-xs font-bold text-[#8B5CF6] flex items-center gap-1.5"><Fuel className="w-4 h-4 text-[#8B5CF6]" />대납 주유/충전비 (100% 회수)</label>
                  <input type="text" value={newFuel} onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" />
                </div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">통행료 등 추가경비</label><input type="text" value={newExtraExpense} onChange={(e) => setNewExtraExpense(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
                <button type="submit" className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">일지 등록 (미입금 상태)</button>
              </form>
            </div>
            
            <div className="lg:col-span-2 glass-card rounded-xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-[#8B5CF6]" />운행 및 미수금 현황</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-[#0B1120] px-3 py-1.5 rounded-lg border border-white/10"><input type="checkbox" id="allDates" checked={filterAllDates} onChange={(e) => setFilterAllDates(e.target.checked)} className="w-3.5 h-3.5 rounded text-[#8B5CF6] cursor-pointer" /><label htmlFor="allDates" className="text-xs text-slate-300 font-semibold cursor-pointer">전체 누적 보기</label></div>
                  {!filterAllDates && <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white text-black font-bold text-xs px-2 py-1.5 rounded-lg border-0" />}
                </div>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {filteredRecords.length === 0 ? <div className="text-center py-12 text-slate-500 text-xs">내역이 없습니다.</div> : filteredRecords.map((r) => {
                  const hasExpense = r.fuelAmount > 0 || r.extraExpenseAmount > 0;
                  const expenseTotal = r.fuelAmount + r.extraExpenseAmount;
                  return (
                    <div key={r.id} className="glass-card p-4 rounded-xl border border-white/10 transition-all hover:bg-white/5">
                      <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]"><MapPin className="w-4 h-4" /></div><div><div className="text-sm font-bold text-white flex items-center gap-1.5"><span>{r.departure}</span><ChevronRight className="w-4 h-4 text-[#8B5CF6]" /><span>{r.destination}</span></div><div className="text-xs text-slate-400 mt-1">{r.date}</div></div></div>
                        
                        {/* 분리 미수금 뱃지 UI */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button onClick={() => toggleGrossPaid(r.id)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${r.isGrossPaid ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40' : 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/40'}`}>
                            {r.isGrossPaid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} 운임 {r.grossAmount.toLocaleString()}원
                          </button>
                          {hasExpense && (
                            <button onClick={() => toggleExpensePaid(r.id)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${r.isExpensePaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/40'}`}>
                              {r.isExpensePaid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} 주유/경비 {expenseTotal.toLocaleString()}원
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="pt-3 flex justify-between items-center text-xs">
                        <div className="flex gap-3 text-slate-400"><span>탁송료: <strong className="text-white">{r.grossAmount.toLocaleString()}원</strong></span>{hasExpense && <span className="text-[#8B5CF6]">대납: {expenseTotal.toLocaleString()}원</span>}</div>
                        <div className="flex gap-2"><button onClick={() => { setEditingRecord(r); setEditDate(r.date); setEditDeparture(r.departure); setEditDestination(r.destination); setEditGross(formatNumberWithComma(r.grossAmount)); setEditFuel(formatNumberWithComma(r.fuelAmount)); setEditExtra(formatNumberWithComma(r.extraExpenseAmount)); }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-all"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => handleDeleteRecord(r.id)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-[#EC4899] transition-all"><Trash2 className="w-3.5 h-3.5" /></button></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. 청구 문자 탭 */}
        {activeTab === 'claims' && (
          <div className="glass-card rounded-xl p-6 shadow-lg fade-in-text">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#8B5CF6]" />미입금 청구 대상 ({unpaidRecords.length}건)</h3>
              <span className="text-xs font-bold text-[#EC4899] bg-[#EC4899]/10 px-3 py-1.5 rounded-lg border border-[#EC4899]/30">총 미수금 {totalUnpaidAmount.toLocaleString()}원</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpaidRecords.length === 0 ? <div className="col-span-full text-center py-10 text-slate-500 text-xs">현재 미입금 내역이 없습니다.</div> : unpaidRecords.map((r) => (
                <div key={r.id} className="bg-[#0B1120] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-[#8B5CF6]/50 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2"><span className="px-2 py-0.5 bg-[#EC4899]/20 text-[#EC4899] text-[10px] font-bold rounded">청구 대기</span><span className="text-[10px] text-slate-400 font-mono">{r.date}</span></div>
                    <div className="font-bold text-white text-sm mb-1 flex items-center gap-1.5"><span>{r.departure}</span><ChevronRight className="w-3.5 h-3.5 text-[#8B5CF6]" /><span>{r.destination}</span></div>
                    <div className="text-xs text-slate-400 mt-3 space-y-1">
                      {!r.isGrossPaid && <div className="flex justify-between"><span>탁송운임</span><span className="text-white">{r.grossAmount.toLocaleString()}원</span></div>}
                      {!r.isExpensePaid && r.fuelAmount > 0 && <div className="flex justify-between"><span>대납 주유비</span><span className="text-white">{r.fuelAmount.toLocaleString()}원</span></div>}
                      {!r.isExpensePaid && r.extraExpenseAmount > 0 && <div className="flex justify-between"><span>대납 추가경비</span><span className="text-white">{r.extraExpenseAmount.toLocaleString()}원</span></div>}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <button onClick={() => openClaimMessageModal(r)} className="px-3 py-1.5 hp-primary-btn text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-1 ml-auto"><MessageSquare className="w-3.5 h-3.5" />문자 생성</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 경비 장부 탭 */}
        {activeTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#EC4899]" />일반 경비 지출 등록</h3>
              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 분류</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg">
                    <option value="대중교통">대중교통 (버스/지하철/택시)</option><option value="식대">식대/간식</option><option value="차량공유">차량공유 (쏘카/그린카)</option><option value="기타">기타 경비</option>
                  </select>
                </div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 금액(원)</label><input type="text" value={expAmount} onChange={(e) => setExpAmount(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg text-right" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">상세 메모 (선택)</label><input type="text" value={expMemo} onChange={(e) => setExpMemo(e.target.value)} className="w-full px-3 py-2 rounded-lg" /></div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#EC4899] to-rose-600 text-white font-bold rounded-lg text-xs mt-2 border-0">경비 등록하기</button>
              </form>
            </div>
            <div className="lg:col-span-2 glass-card rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4">지출 내역 목록 ({expenses.length}건)</h3>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {expenses.length === 0 ? <div className="text-center py-10 text-slate-500 text-xs">등록된 경비 지출이 없습니다.</div> : expenses.map((e) => (
                  <div key={e.id} className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex items-center justify-between hover:border-white/20 transition-all">
                    <div><div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-white/10 text-slate-300 rounded text-[10px] font-semibold">{e.category}</span><span className="text-sm text-white font-medium">{e.memo || '-'}</span></div><div className="text-xs text-slate-500 mt-1.5">{e.date}</div></div>
                    <div className="flex items-center gap-3"><span className="text-[#EC4899] font-bold text-sm">-{e.amount.toLocaleString()}원</span><button onClick={() => handleDeleteExpense(e.id)} className="text-slate-600 hover:text-[#EC4899] p-1"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. 통계 요약 탭 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 fade-in-text">
            <section className="bg-gradient-to-r from-[#0B1120] via-indigo-950/40 to-[#0B1120] border border-[#8B5CF6]/30 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/10 gap-2">
                <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#8B5CF6]" /><h2 className="text-xs font-bold text-slate-200 uppercase">{currentMonthPrefix.replace('-', '년 ')}월 누적 결산</h2></div>
                <span className="text-[11px] font-semibold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2.5 py-0.5 rounded-full border border-[#8B5CF6]/20">월간 집계 ({monthlyRecords.length}회 운행)</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div><div className="text-[11px] text-slate-400 mb-1">당월 탁송매출</div><div className="text-xl lg:text-2xl font-extrabold text-white">{monthlyGross.toLocaleString()}원</div></div>
                <div><div className="text-[11px] text-slate-400 mb-1">당월 순수입</div><div className="text-xl lg:text-2xl font-extrabold text-[#38BDF8]">{monthlyNet.toLocaleString()}원</div></div>
                <div><div className="text-[11px] text-slate-400 mb-1">당월 지출</div><div className="text-xl lg:text-2xl font-extrabold text-[#EC4899]">-{monthlyExpense.toLocaleString()}원</div></div>
                <div><div className="text-[11px] text-slate-400 mb-1">실수령액 (예상)</div><div className="text-xl lg:text-2xl font-extrabold text-[#38BDF8]">{monthlyProfit.toLocaleString()}원</div></div>
              </div>
            </section>
            
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">전체 기간 누적 리포트</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0B1120] border border-white/10"><span className="text-xs text-slate-400">총 운행 횟수</span><div className="text-xl font-bold text-white mt-1">{records.length}회</div></div>
                <div className="p-4 rounded-xl bg-[#0B1120] border border-white/10"><span className="text-xs text-slate-400">전체 입금 완료율</span><div className="text-xl font-bold text-[#38BDF8] mt-1">{records.length > 0 ? ((records.filter(r => r.isGrossPaid && r.isExpensePaid).length / records.length) * 100).toFixed(1) : 0}%</div></div>
                <div className="p-4 rounded-xl bg-[#0B1120] border border-[#EC4899]/30"><span className="text-xs text-slate-400">현재 미수금 총액</span><div className="text-xl font-bold text-[#EC4899] mt-1">{totalUnpaidAmount.toLocaleString()}원</div></div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 계좌 관리 탭 */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#38BDF8]" />정산 및 송금용 계좌 추가</h3>
              <form onSubmit={handleAddAccount} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">은행명</label><input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">계좌번호</label><input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required className="w-full px-3 py-2 rounded-lg font-mono" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">예금주</label><input type="text" value={holder} onChange={(e) => setHolder(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <button type="submit" className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs mt-2">새 계좌 등록</button>
              </form>
            </div>
            <div className="space-y-3">
              {accounts.map((acc, idx) => (
                <div key={acc.id} className="relative bg-gradient-to-br from-[#0B1120] to-indigo-950/30 border border-[#8B5CF6]/30 rounded-xl p-6 overflow-hidden shadow-lg group hover:border-[#8B5CF6] transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Building2 className="w-24 h-24" /></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6"><span className="px-2 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-bold rounded uppercase">{idx === 0 ? '대표 계좌' : '보조 계좌'}</span><button onClick={() => handleDeleteAccount(acc.id)} className="text-slate-500 hover:text-[#EC4899] p-1"><Trash2 className="w-4 h-4" /></button></div>
                    <div className="text-2xl font-bold font-mono tracking-wider text-white mb-2">{acc.accountNumber}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-300"><span className="font-bold">{acc.bankName}</span> <span className="text-slate-500">|</span> <span>예금주: {acc.holder}</span></div>
                    <div className="mt-4"><button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); alert('계좌번호가 복사되었습니다.'); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-slate-200 flex items-center gap-1.5 hover:bg-white/20"><Copy className="w-3.5 h-3.5" /> 복사</button></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. 전국 매매단지 안내 탭 */}
        {activeTab === 'trade_centers' && (
          <div className="space-y-5 fade-in-text">
            <div className="glass-card rounded-xl p-5 shadow-lg border border-[#8B5CF6]/30">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-[#8B5CF6]" />전국 주요 매매단지 거점 현황</h3>
              <div className="flex flex-wrap gap-2">
                {['전체', 'S등급', 'A등급', '수도권', '충청권', '영남권', '호남권'].map(f => (
                  <button key={f} onClick={() => setTradeFilter(f as any)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${tradeFilter === f ? 'bg-[#8B5CF6] text-white' : 'bg-[#0B1120] text-slate-400 border border-white/10'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTradeCenters.map((center) => (
                <div key={center.id} className={`glass-card p-4 rounded-xl border-t-2 flex flex-col gap-3 ${center.tier === 'S' ? 'border-t-[#F59E0B]' : center.tier === 'A' ? 'border-t-[#38BDF8]' : 'border-t-white/20'}`}>
                  <div>
                    <div className="flex gap-1.5 mb-2">
                      {center.tier === 'S' && <span className="px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-extrabold rounded">S등급</span>}
                      {center.tier === 'A' && <span className="px-1.5 py-0.5 bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-bold rounded">A등급</span>}
                      <span className="text-[10px] font-semibold text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">{center.region}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-1.5">{center.name}</h4>
                    <p className="text-[11px] text-slate-300 bg-[#0B1120] p-2 rounded-lg border border-white/5 mb-2.5">{center.desc}</p>
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400"><MapPin className="w-3.5 h-3.5 mt-0.5 text-[#EC4899] shrink-0" /><span>{center.addr}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. 경매장 탭 */}
        {activeTab === 'auctions' && (
          <div className="space-y-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg border border-[#8B5CF6]/30">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-[#8B5CF6]" />오더 집중 발생 요약</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex gap-3"><Clock className="w-4 h-4 text-[#38BDF8]" /><div><div className="text-xs font-bold text-slate-300">경매 진행 시간</div><div className="text-sm font-extrabold text-white mt-1">오후 1시 ~ 오후 5시</div></div></div>
                <div className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex gap-3"><div><div className="text-xs font-bold text-slate-300">오더 집중 발생</div><div className="text-sm font-extrabold text-white mt-1">경매 시작 ~ 오후 6시까지</div></div></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {AUCTION_SCHEDULES.map((schedule, idx) => (
                <div key={idx} className="glass-card p-5 rounded-xl border-t-2" style={{ borderTopColor: schedule.hex }}>
                  <div className="flex items-center gap-2 mb-3"><CalendarDays className="w-5 h-5" style={{ color: schedule.hex }} /><h4 className="font-extrabold text-base text-white">{schedule.day}</h4></div>
                  <div className="space-y-3">
                    {schedule.locations.map((loc, i) => (
                      <div key={i} className={`bg-[#0B1120] border rounded-xl p-3.5 ${loc.tier === 'S' ? 'border-[#F59E0B]/30' : 'border-white/5'}`}>
                        <div className="flex gap-2 mb-1.5"><span className="text-sm font-bold text-slate-100">{loc.name}</span></div>
                        <div className="flex items-start gap-1.5 text-[11px] text-slate-400"><MapPin className="w-3 h-3 text-[#38BDF8] shrink-0" /><span>{loc.addr}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. 관제탑 (업그레이드 버전) */}
        {activeTab === 'admin' && isAdminUser && (
          <div className="space-y-6 fade-in-text">
            <div className="mb-2"><h3 className="text-sm font-bold text-[#38BDF8] flex items-center gap-2"><Crown className="w-5 h-5" />플랫폼 관리자 관제탑 (Data Center)</h3><p className="text-[11px] text-slate-400 mt-1 ml-7">가입자의 접속 패턴과 운행 실적을 분석하여 PRO 전환 및 기사단 스카우트에 활용하세요.</p></div>
            
            <div className="flex gap-2 border-b border-white/10 pb-2">
              <button onClick={() => setAdminSubTab('members')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${adminSubTab === 'members' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>가입자 접속 현황 ({adminMemberList.length}명)</button>
              <button onClick={() => setAdminSubTab('analytics')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${adminSubTab === 'analytics' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>통계 보드</button>
            </div>

            {adminSubTab === 'members' && (
              <div className="glass-card p-6 rounded-xl space-y-4">
                <input type="text" placeholder="이름 / 전화번호 검색..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="px-3 py-2 rounded-lg text-xs w-full max-w-xs" />
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0B1120] text-slate-400 border-b border-white/10"><tr><th className="p-3">기사 이름</th><th className="p-3">가입일</th><th className="p-3">최근 앱 접속일</th><th className="p-3 text-center">누적 접속</th><th className="p-3 text-center">등록 실적</th><th className="p-3 text-center">권한</th><th className="p-3 text-right">CS 상세 열람</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {adminMemberList.filter(m => m.name.includes(adminSearchTerm) || m.phone.includes(adminSearchTerm)).map((m) => {
                        const isHighEngaged = (m.recordCount || 0) >= 10;
                        return (
                          <tr key={m.id} className="hover:bg-white/5">
                            <td className="p-3 text-white font-bold flex items-center gap-2">{m.name} {isHighEngaged && <span className="px-1.5 py-0.5 bg-[#EC4899]/20 text-[#EC4899] text-[9px] rounded font-bold">에이스</span>}</td>
                            <td className="p-3 text-slate-500 font-mono">{m.createdAt}</td>
                            <td className="p-3 text-[#38BDF8] font-mono">{m.lastLoginAt}</td>
                            <td className="p-3 text-center text-slate-300 font-bold">{m.loginCount}회</td>
                            <td className="p-3 text-center text-[#8B5CF6] font-bold">{m.recordCount}건</td>
                            <td className="p-3 text-center">{m.role === 'pro_driver' ? <span className="text-emerald-400 font-bold">PRO</span> : <span className="text-slate-400">일반</span>}</td>
                            <td className="p-3 text-right"><button onClick={() => openAdminUserDetail(m)} className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold flex items-center gap-1 ml-auto"><Search className="w-3 h-3" />상세 보기</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {adminSubTab === 'analytics' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">플랫폼 총 가입자</span><div className="text-2xl font-bold text-white mt-1">{adminMemberList.length}명</div></div>
                <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">플랫폼 누적 접속 횟수</span><div className="text-2xl font-bold text-[#8B5CF6] mt-1">{adminMemberList.reduce((acc, m) => acc + (m.loginCount || 0), 0)}회</div></div>
                <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">총 등록 운행 데이터</span><div className="text-2xl font-bold text-[#38BDF8] mt-1">{adminAllRecords.length}건</div></div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 모달: 관리자 기사 상세 조회 */}
      {adminSelectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl glass-card rounded-2xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button onClick={() => setAdminSelectedUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-[#38BDF8] mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> [ {adminSelectedUser.name} ] 기사님 상세 리포트</h3>
            <div className="flex gap-4 mb-4 text-xs text-slate-300 bg-[#0B1120] p-3 rounded-lg border border-white/10"><span>최근 접속: {adminSelectedUser.lastLoginAt}</span><span>누적 운행: {adminSelectedUser.recordCount}건</span></div>
            <div className="overflow-y-auto pr-2 space-y-3 flex-1">
              <h4 className="text-xs font-bold text-white border-b border-white/10 pb-2 mb-2">최근 운행 내역 (최대 10건)</h4>
              {adminSelectedUserRecords.length === 0 ? <div className="text-center text-xs text-slate-500 py-4">운행 기록이 없습니다.</div> : adminSelectedUserRecords.map((r) => {
                const totalClaim = r.grossAmount + r.fuelAmount + r.extraExpenseAmount;
                const unpaid = (!r.isGrossPaid ? r.grossAmount : 0) + (!r.isExpensePaid ? (r.fuelAmount + r.extraExpenseAmount) : 0);
                return (
                  <div key={r.id} className="bg-[#0B1120] border border-white/10 p-3 rounded-lg text-xs">
                    <div className="flex justify-between text-slate-400 mb-1"><span>{r.date}</span><span className={unpaid > 0 ? 'text-[#EC4899] font-bold' : 'text-emerald-400 font-bold'}>{unpaid > 0 ? `미수금 ${unpaid.toLocaleString()}원` : '전액 정산완료'}</span></div>
                    <div className="font-bold text-white">{r.departure} → {r.destination}</div>
                    <div className="text-slate-400 mt-1">청구총액: {totalClaim.toLocaleString()}원 (운임 {r.grossAmount.toLocaleString()} / 대납 {r.fuelAmount.toLocaleString()})</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setAdminSelectedUser(null)} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition-colors">닫기</button>
          </div>
        </div>
      )}

      {/* 모달: 계정 설정 및 프로필 (완벽 복구) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative z-20">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><User className="w-4 h-4 text-[#8B5CF6]" />기사 프로필 및 계정 관리</h3>
            
            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-3.5 space-y-2 mb-5">
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">기사 성함</span><span className="text-white font-bold">{currentUserProfile?.name || userName}</span></div>
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">연락처</span><span className="text-[#38BDF8] font-mono font-semibold">{formatPhoneNumber(currentUserProfile?.phone || '') || '미등록'}</span></div>
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">계정 이메일</span><span className="text-slate-200 font-mono text-[11px]">{session?.user?.email}</span></div>
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">가입 일자</span><span className="text-slate-400 font-mono">{currentUserProfile?.createdAt}</span></div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                <span className="text-slate-400">회원 등급</span>
                <div>
                  {currentUserRole === 'super_admin' ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B5CF6]/20 text-[#8B5CF6]">최고 관리자</span> :
                   currentUserRole === 'pro_driver' ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">PRO 기사</span> :
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">일반 기사</span>}
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3 mb-5">
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">새 비밀번호 변경 (6자리 이상)</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="새로운 비밀번호 입력" className="w-full px-3 py-2 rounded-lg" /></div>
              {pwdMessage && <div className={`p-2.5 rounded-lg text-xs font-semibold ${pwdMessage.type === 'success' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-[#EC4899]/20 text-[#EC4899]'}`}>{pwdMessage.text}</div>}
              <button type="submit" disabled={pwdLoading} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs cursor-pointer border border-white/10">{pwdLoading ? '변경 중...' : '비밀번호 변경'}</button>
            </form>
            <button onClick={() => setShowProfileModal(false)} className="w-full py-2.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">닫기</button>
          </div>
        </div>
      )}

      {/* 모달: 운행 일지 수정 */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Edit2 className="w-4 h-4 text-[#8B5CF6]" /> 운행 내역 수정</h3><button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleUpdateRecord} className="space-y-3.5">
              <div><label className="block text-[11px] font-semibold text-[#38BDF8] mb-1">운행 일자 변경</label><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-3 py-2 rounded-lg" required /></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" value={editDeparture} onChange={(e) => setEditDeparture(e.target.value)} className="w-full px-3 py-2 rounded-lg" required /></div><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" value={editDestination} onChange={(e) => setEditDestination(e.target.value)} className="w-full px-3 py-2 rounded-lg" required /></div></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운임(원)</label><input type="text" value={editGross} onChange={(e) => setEditGross(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" required /></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">대납 주유비</label><input type="text" value={editFuel} onChange={(e) => setEditFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
              <button type="submit" className="w-full mt-2 py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">수정 완료</button>
            </form>
          </div>
        </div>
      )}

      {/* 모달: 청구 문자 직접 편집 */}
      {claimModalOpen && selectedClaimRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setClaimModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#8B5CF6]" />정산 청구 문자 편집 및 복사</h3>
            <div className="flex gap-4 mb-4 pb-4 border-b border-white/10">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeGross} onChange={() => handleToggleInclude('gross')} className="rounded text-[#8B5CF6]" /> 기본 운임</label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeFuel} onChange={() => handleToggleInclude('fuel')} className="rounded text-[#8B5CF6]" disabled={selectedClaimRecord.fuelAmount === 0} /> 주유비</label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeExtra} onChange={() => handleToggleInclude('extra')} className="rounded text-[#8B5CF6]" disabled={selectedClaimRecord.extraExpenseAmount === 0} /> 추가경비</label>
            </div>
            <textarea rows={10} value={claimMessageText} onChange={(e) => setClaimMessageText(e.target.value)} className="w-full p-4 rounded-xl text-xs font-mono mb-4 bg-[#FFFFFF] text-[#000000] focus:shadow-[0_0_12px_#8B5CF6] transition-all outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setClaimModalOpen(false)} className="flex-1 py-3 bg-[#0B1120] border border-white/10 text-white font-semibold rounded-lg text-xs cursor-pointer">닫기</button>
              <button onClick={() => { navigator.clipboard.writeText(claimMessageText); alert('문자가 복사되었습니다.'); setClaimModalOpen(false); }} className="flex-1 py-3 hp-primary-btn text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5"><Copy className="w-3.5 h-3.5" />복사하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
