import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  Wallet, Calendar, Clock, MapPin, TrendingUp, DollarSign, FileText, User, LogOut,
  KeyRound, X, CheckCircle2, AlertCircle, PlusCircle, CreditCard, Receipt, Trash2,
  Copy, Car, Filter, RotateCcw, CalendarDays, ShieldCheck, ChevronRight, Smartphone,
  Fuel, AlertTriangle, MessageSquare, Check, Edit2, Coins, Sparkles, Phone,
  RefreshCw, UserX, ShieldAlert, BarChart3, Megaphone, Users, Download,
  Award, Crown, BookmarkPlus, Radio, Send, Building2, Info, Map, Target, Navigation, Search, PieChart, Activity, ChevronLeft
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
  const numStr = String(val).replace(/[^0-9]/g, '');
  return Number(numStr) || 0;
};

const formatPhoneNumber = (val: string) => {
  if (!val) return '';
  const num = val.replace(/[^0-9]/g, '');
  if (num.length === 11) return num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  else if (num.length === 10) return num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return num;
};

const parseImportedRow = (row: any) => {
  const keys = Object.keys(row);
  const dateKey = keys.find(k => k.includes('일') || k.includes('날짜') || k.includes('date'));
  const depKey = keys.find(k => k.includes('출발') || k.includes('시작'));
  const destKey = keys.find(k => k.includes('도착') || k.includes('종료'));
  const grossKey = keys.find(k => k.includes('요금') || k.includes('매출') || k.includes('탁송료') || k.includes('수입'));
  const feeKey = keys.find(k => k.includes('수수료') || k.includes('차감'));
  
  let parsedDate = getTodayKST();
  if (dateKey && row[dateKey]) {
    const rawDate = String(row[dateKey]).replace(/[\.\/]/g, '-');
    const match = rawDate.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) parsedDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  const gross = cleanNumber(row[grossKey]) || 0;
  const fee = cleanNumber(row[feeKey]) || 0;
  const net = gross - fee;

  return {
    date: parsedDate,
    departure: row[depKey] ? String(row[depKey]).substring(0,20) : '출발지 미상',
    destination: row[destKey] ? String(row[destKey]).substring(0,20) : '도착지 미상',
    grossAmount: gross,
    feeRate: gross > 0 ? Math.round((fee / gross) * 100) : 20,
    fuelAmount: 0,
    extraExpenseAmount: 0,
    tipAmount: 0,
    netAmount: net,
    totalClaimAmount: gross,
    paymentMethod: '현금'
  };
};

interface DrivingRecord {
  id: string; userId?: string; date: string; startTime: string; endTime: string;
  departure: string; destination: string; grossAmount: number; feeRate: number;
  fuelAmount: number; extraExpenseAmount: number; tipAmount: number; 
  isGrossPaid: boolean; isExpensePaid: boolean;
  netAmount: number; totalClaimAmount: number;
  paymentMethod?: '현금' | '카드';
}
interface ExpenseRecord { id: string; date: string; category: string; amount: number; memo: string; }
interface BankAccount { id: string; bankName: string; accountNumber: string; holder: string; }
interface MemberProfile { id: string; email: string; name: string; phone: string; role: string; createdAt: string; lastLoginAt?: string; loginCount?: number; recordCount?: number; monthlyGross?: number; }
interface NoticeItem { id: string; title: string; content: string; isActive: boolean; updatedAt?: string; }

const TRADE_CENTERS = [
  { id: '1', name: '수원 도이치오토월드', tier: 'S', region: '수도권', addr: '경기 수원시 권선구 권선로 308-5', desc: '전국 최대 실내 복합단지.' },
  { id: '2', name: '수원 SK V1 모터스', tier: 'S', region: '수도권', addr: '경기 수원시 권선구 평동로79번길 45', desc: '도이치오토월드 옆.' },
  { id: '3', name: '인천 엠파크', tier: 'S', region: '수도권', addr: '인천 서구 봉수대로 158', desc: '인천 권역 최대 메가 허브.' },
  { id: '4', name: '용인 오토허브', tier: 'S', region: '수도권', addr: '경기 용인시 기흥구 중부대로 242', desc: '경부 신갈IC 인근 초대형 복합단지.' },
  { id: '5', name: '서울 서서울모터리움', tier: 'A', region: '수도권', addr: '서울 강서구 양천로53길 30', desc: '서울 서부권 최대 실내.' },
  { id: '6', name: '김포 국민차매매단지', tier: 'A', region: '수도권', addr: '경기 김포시 고촌읍 아라육로152번길 45', desc: '수도권 서북부 대형 실내.' },
  { id: '7', name: '부산 경동오토필드', tier: 'A', region: '영남권', addr: '부산 기장군 장안읍 반룡산단3로 95', desc: '영남 최대.' },
  { id: '8', name: '대구 엠월드', tier: 'A', region: '영남권', addr: '대구 서구 문화로 37', desc: '대구 경북 최대.' },
  { id: '9', name: '부산 사직오토랜드', tier: 'A', region: '영남권', addr: '부산 연제구 경기장로 15', desc: '전통 대표 단지.' },
  { id: '10', name: '대전 디오토몰', tier: 'A', region: '충청권', addr: '대전 유성구 복용동로 35', desc: '충청권 핵심.' }
];

const AUCTION_SCHEDULES = [
  { day: '월요일', hex: '#38BDF8', locations: [{ name: '안성 롯데렌탈', tier: 'S', addr: '경기 안성시 내가천리 12', tag: '롯데' }, { name: '진천 광혜원 오토보이', tier: 'B', addr: '충북 진천군 금천길 37', tag: '오토보이' }] },
  { day: '화요일', hex: '#EC4899', locations: [{ name: '시화 현대글로비스', tier: 'S', addr: '경기 시흥시 정왕천로 271', tag: '글로비스' }, { name: '오포 현대글로비스', tier: 'S', addr: '경기 광주시 능평리 174-25', tag: '글로비스' }, { name: '세종 K Car', tier: 'A', addr: '세종 부강면 문곡리 산 249', tag: '케이카' }, { name: '천안 SK경매장', tier: 'B', addr: '충남 천안시 구성동', tag: 'SK' }] },
  { day: '수요일', hex: '#10B981', locations: [{ name: '안성 오토허브', tier: 'S', addr: '경기 안성시 문터길 60', tag: '오토허브' }] },
  { day: '목요일', hex: '#F59E0B', locations: [{ name: '양산 현대글로비스', tier: 'S', addr: '경남 양산시 산막동 572-1', tag: '글로비스' }, { name: '오산 K Car', tier: 'A', addr: '경기 오산시 은계동 7-30', tag: '케이카' }] },
  { day: '금요일', hex: '#8B5CF6', locations: [{ name: '시화 현대글로비스', tier: 'S', addr: '경기 시흥시 정왕동 2122-4', tag: '글로비스' }] }
];

export default function App() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({ onRegistered(r) {}, onRegisterError(error) {} });
  useEffect(() => { if (needRefresh) updateServiceWorker(true); }, [needRefresh, updateServiceWorker]);

  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [currentUserProfile, setCurrentUserProfile] = useState<MemberProfile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false); const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false); const [authError, setAuthError] = useState(''); const [authSuccess, setAuthSuccess] = useState('');
  const [honeypot, setHoneypot] = useState(''); const [captchaVerified, setCaptchaVerified] = useState(false);

  const [activeTab, setActiveTab] = useState<'records' | 'claims' | 'expense' | 'analytics' | 'wallet' | 'trade_centers' | 'auctions' | 'admin'>('records');
  const [adminSubTab, setAdminSubTab] = useState<'campaign' | 'members' | 'analytics'>('members');
  
  const [dateFilter, setDateFilter] = useState<'day' | 'month' | 'year' | 'custom'>('month');
  const [customDate, setCustomDate] = useState<string>(() => getTodayKST());
  const [currentCalDate, setCurrentCalDate] = useState<Date>(() => {
    const now = new Date(); return new Date(now.getTime() + 9 * 60 * 60 * 1000);
  });
  
  const [analyticsMode, setAnalyticsMode] = useState<'month' | 'year'>('month');
  const [analyticsYear, setAnalyticsYear] = useState<string>(new Date().getFullYear().toString());
  const [tradeFilter, setTradeFilter] = useState<'전체' | 'S등급' | 'A등급' | '수도권' | '충청권' | '영남권' | '호남권'>('전체');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [adminSelectedUser, setAdminSelectedUser] = useState<MemberProfile | null>(null);
  const [adminSelectedUserRecords, setAdminSelectedUserRecords] = useState<DrivingRecord[]>([]);

  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDeparture, setEditDeparture] = useState(''); const [editDestination, setEditDestination] = useState('');
  const [editGross, setEditGross] = useState(''); const [editFuel, setEditFuel] = useState('');
  const [editExtra, setEditExtra] = useState(''); const [editTip, setEditTip] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'현금' | '카드'>('현금'); 

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true); const [includeFuel, setIncludeFuel] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true); const [claimMessageText, setClaimMessageText] = useState('');
  
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [lastDeletedRecords, setLastDeletedRecords] = useState<DrivingRecord[]>([]);
  const [visibleRecordCount, setVisibleRecordCount] = useState<number>(30);
  const [visibleClaimCount, setVisibleClaimCount] = useState<number>(30);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try { 
      const saved = localStorage.getItem('jundriver_accounts_v2'); 
      if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return parsed; }
    } catch (e) {}
    return [{ id: '1', bankName: '신한은행', accountNumber: '110-123-456789', holder: '김탁송' }];
  });

  const [activeNotice, setActiveNotice] = useState<NoticeItem | null>(null);
  const [noticeList, setNoticeList] = useState<NoticeItem[]>([]);
  const [inputNoticeTitle, setInputNoticeTitle] = useState(''); const [inputNoticeContent, setInputNoticeContent] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null); const [noticeLoading, setNoticeLoading] = useState(false);

  const [adminMemberList, setAdminMemberList] = useState<MemberProfile[]>([]);
  const [adminAllRecords, setAdminAllRecords] = useState<DrivingRecord[]>([]);
  
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [showScoutOnly, setShowScoutOnly] = useState(false);

  const [newDate, setNewDate] = useState<string>(() => getTodayKST());
  const [newStartTime, setNewStartTime] = useState(''); const [newEndTime, setNewEndTime] = useState('');
  const [newDeparture, setNewDeparture] = useState('수원'); 
  const [newDestination, setNewDestination] = useState('부산');
  const [newGross, setNewGross] = useState('150,000'); 
  
  const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFuel, setNewFuel] = useState(''); const [newExtraExpense, setNewExtraExpense] = useState(''); const [newTip, setNewTip] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'현금' | '카드'>('현금'); 
  
  const [expCategory, setExpCategory] = useState('대중교통'); const [expAmount, setExpAmount] = useState(''); const [expMemo, setExpMemo] = useState('');
  const [bankName, setBankName] = useState(''); const [accountNumber, setAccountNumber] = useState(''); const [holder, setHolder] = useState('');

  const [targetIncome, setTargetIncome] = useState<string>(() => {
    try { const s = localStorage.getItem('jundriver_target_v2'); if (s) { const parsed = JSON.parse(s); return parsed.income ? String(parsed.income) : '5,000,000'; } } catch (e) {}
    return '5,000,000';
  });
  const [targetDays, setTargetDays] = useState<string>(() => {
    try { const s = localStorage.getItem('jundriver_target_v2'); if (s) { const parsed = JSON.parse(s); return parsed.days ? String(parsed.days) : '25'; } } catch (e) {}
    return '25';
  });
  const [fixedDailyExp, setFixedDailyExp] = useState<string>(() => {
    try { const s = localStorage.getItem('jundriver_fixed_exp_v2'); if (s) { const parsed = JSON.parse(s); return parsed.amount !== undefined ? String(parsed.amount) : '3,200'; } } catch (e) {}
    return '3,200';
  });
  const [fixedDailyMemo, setFixedDailyMemo] = useState<string>(() => {
    try { const s = localStorage.getItem('jundriver_fixed_exp_v2'); if (s) { const parsed = JSON.parse(s); return parsed.memo ? String(parsed.memo) : '일비 및 보험료'; } } catch (e) {}
    return '일비 및 보험료';
  });

  useEffect(() => { localStorage.setItem('jundriver_accounts_v2', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('jundriver_target_v2', JSON.stringify({ income: targetIncome, days: targetDays })); }, [targetIncome, targetDays]);
  useEffect(() => { localStorage.setItem('jundriver_fixed_exp_v2', JSON.stringify({ amount: fixedDailyExp, memo: fixedDailyMemo })); }, [fixedDailyExp, fixedDailyMemo]);

  useEffect(() => {
    setSelectedRecordIds([]);
    setLastDeletedRecords([]); 
  }, [currentCalDate, activeTab, dateFilter, customDate]);

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

  const fetchUserData = async (userId: string, userEmail: string, userMeta?: any, userCreatedAt?: string) => {
    let role = 'user';
    const cleanMail = (userEmail || '').toLowerCase();
    const metaName = userMeta?.name || (cleanMail === ADMIN_DEFAULT_EMAIL ? ADMIN_DEFAULT_NAME : '기사님');
    const metaPhone = userMeta?.phone || (cleanMail === ADMIN_DEFAULT_EMAIL ? ADMIN_DEFAULT_PHONE : '');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    role = cleanMail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : (profile?.role || 'user');
    setCurrentUserRole(role);

    const currentCount = profile?.login_count || 0;
    const nowIso = new Date().toISOString();
    const profilePayload = {
      id: userId, email: cleanMail, name: profile?.name || metaName, phone: profile?.phone || metaPhone,
      role: role, created_at: profile?.created_at || userCreatedAt || nowIso,
      last_login_at: nowIso, login_count: currentCount + 1
    };
    await supabase.from('profiles').upsert(profilePayload);

    setCurrentUserProfile({
      id: userId, email: cleanMail, name: profilePayload.name, phone: profilePayload.phone, role: profilePayload.role,
      createdAt: (profilePayload.created_at || '').substring(0, 10),
      lastLoginAt: profilePayload.last_login_at, loginCount: profilePayload.login_count
    });

    const { data: recordsData } = await supabase.from('driving_records').select('*').eq('user_id', userId).order('date', { ascending: true });
    if (recordsData) {
      setRecords(recordsData.map((r: any) => ({
        id: r.id, date: r.date || '-', startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
        grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount), extraExpenseAmount: Number(r.extra_expense_amount),
        tipAmount: Number(r.tip_amount), isGrossPaid: Boolean(r.is_gross_paid), isExpensePaid: Boolean(r.is_expense_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
        paymentMethod: r.payment_method || '현금', 
      })));
    }

    const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: true });
    if (expensesData) setExpenses(expensesData.map((e: any) => ({ id: e.id, date: e.date || '-', category: e.category, amount: Number(e.amount), memo: e.memo || '' })));
    
    if (role === 'super_admin' || role === 'manager') fetchAdminData();
  };

  const fetchAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('last_login_at', { ascending: false });
    const { data: allRecs } = await supabase.from('driving_records').select('*').limit(20000);
    const currentMonthStr = getTodayKST().substring(0, 7);
    
    if (profiles && allRecs) {
      setAdminMemberList(profiles.map((p: any) => {
        const userRecords = allRecs.filter((r: any) => r.user_id === p.id);
        const monthlyGross = userRecords.filter((r: any) => (r.date || '').startsWith(currentMonthStr)).reduce((sum: number, r: any) => sum + Number(r.gross_amount), 0);
        return { 
          id: p.id, email: p.email || '', name: p.name || '미상', phone: p.phone || '', role: p.role || 'user',
          createdAt: p.created_at ? p.created_at.substring(0, 10) : '-', lastLoginAt: p.last_login_at ? p.last_login_at.substring(0, 16).replace('T', ' ') : '기록없음',
          loginCount: p.login_count || 0, recordCount: userRecords.length, monthlyGross: monthlyGross
        };
      }));
      setAdminAllRecords(allRecs.map((r: any) => ({ 
        id: r.id, userId: r.user_id, date: r.date || '-', startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination, 
        grossAmount: Number(r.gross_amount), fuelAmount: Number(r.fuel_amount), feeRate: Number(r.fee_rate), extraExpenseAmount: Number(r.extra_expense_amount), tipAmount: Number(r.tip_amount), isGrossPaid: Boolean(r.is_gross_paid), isExpensePaid: Boolean(r.is_expense_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount), paymentMethod: r.payment_method || '현금' 
      })));
    }
  };

  useEffect(() => {
    fetchNotices();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '', session.user.user_metadata, session.user.created_at);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id, session.user.email || '', session.user.user_metadata, session.user.created_at);
      else { setRecords([]); setExpenses([]); setCurrentUserRole('user'); setCurrentUserProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setAuthLoading(true); setAuthError(''); setAuthSuccess(''); const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password.trim() }); if (error) setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.'); setAuthLoading(false); };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError(''); setAuthSuccess('');
    if (honeypot.trim() !== '') { setAuthLoading(false); return; }
    if (!captchaVerified) { setAuthError('보안 확인(인간 인증 체크)을 완료해 주세요.'); setAuthLoading(false); return; }
    const trimmedName = name.trim(); const cleanPhone = phone.replace(/[^0-9]/g, ''); const cleanEmail = email.trim().toLowerCase();
    if (password.length < 6) { setAuthError('비밀번호는 최소 6자리 이상이어야 합니다.'); setAuthLoading(false); return; }
    if (password !== passwordConfirm) { setAuthError('비밀번호가 일치하지 않습니다.'); setAuthLoading(false); return; }
    if (!agreePrivacy) { setAuthError('개인정보 수집 및 이용에 동의해 주세요.'); setAuthLoading(false); return; }
    if (!trimmedName || cleanPhone.length < 10) { setAuthError('이름과 휴대폰 번호를 정확히 입력해 주세요.'); setAuthLoading(false); return; }
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: password.trim(), options: { data: { name: trimmedName, phone: cleanPhone, privacy_policy_agreed: true, created_at: nowIso } } });
    if (error) { setAuthError('가입 실패: ' + error.message); } else { if (data.user) { await supabase.from('profiles').upsert([{ id: data.user.id, email: cleanEmail, name: trimmedName, phone: cleanPhone, role: cleanEmail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : 'user', created_at: nowIso, last_login_at: nowIso, login_count: 1 }]); } setAuthSuccess('회원가입이 완료되었습니다. 로그인해 주세요.'); setAuthMode('login'); }
    setAuthLoading(false);
  };
  const handleLogout = async () => { await supabase.auth.signOut(); setShowProfileModal(false); setActiveTab('records'); };
  const handlePasswordChange = async (e: React.FormEvent) => { e.preventDefault(); setPwdLoading(true); setPwdMessage(null); if (newPassword.length < 6) { setPwdMessage({ type: 'error', text: '비밀번호는 최소 6자리 이상이어야 합니다.' }); setPwdLoading(false); return; } const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) setPwdMessage({ type: 'error', text: error.message }); else { setPwdMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' }); setNewPassword(''); } setPwdLoading(false); };
  
  const handleSaveNoticeTemplate = async (e: React.FormEvent) => { e.preventDefault(); if (!inputNoticeTitle.trim() || !inputNoticeContent.trim()) return; setNoticeLoading(true); const targetId = editingNoticeId || `notice_${Date.now()}`; const { error } = await supabase.from('announcements').upsert({ id: targetId, title: inputNoticeTitle.trim(), content: inputNoticeContent.trim(), is_active: editingNoticeId ? (noticeList.find(n => n.id === editingNoticeId)?.isActive || false) : false, updated_at: new Date().toISOString() }); if (!error) { alert(editingNoticeId ? '수정되었습니다.' : '저장되었습니다.'); setInputNoticeTitle(''); setInputNoticeContent(''); setEditingNoticeId(null); fetchNotices(); } setNoticeLoading(false); };
  const handleActivateNotice = async (targetNotice: NoticeItem) => { setNoticeLoading(true); await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy'); const { error } = await supabase.from('announcements').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', targetNotice.id); if (!error) { alert('메인 배너로 활성화되었습니다.'); fetchNotices(); } setNoticeLoading(false); };
  const handleDeactivateAllNotices = async () => { setNoticeLoading(true); const { error } = await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy'); if (!error) { alert('메인 배너 송출이 중단되었습니다.'); fetchNotices(); } setNoticeLoading(false); };
  const handleDeleteNotice = async (id: string) => { if (!window.confirm('삭제하시겠습니까?')) return; await supabase.from('announcements').delete().eq('id', id); fetchNotices(); };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!session) return;
    const gross = cleanNumber(newGross); const feeRate = cleanNumber(newFeeRate); const fuel = cleanNumber(newFuel);
    const extraExp = cleanNumber(newExtraExpense); const tip = cleanNumber(newTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + extraExp;
    const recordId = 'rec_' + Date.now().toString();
    const payload = { id: recordId, user_id: session.user.id, date: newDate, start_time: newStartTime || '-', end_time: newEndTime || '-', departure: newDeparture, destination: newDestination, gross_amount: gross, fee_rate: feeRate, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, is_gross_paid: false, is_expense_paid: false, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal), payment_method: newPaymentMethod };
    const newRecord: DrivingRecord = { ...payload, startTime: payload.start_time, endTime: payload.end_time, grossAmount: gross, feeRate, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, isGrossPaid: false, isExpensePaid: false, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal), paymentMethod: newPaymentMethod };
    
    const { error } = await supabase.from('driving_records').insert([payload]);
    if (error && error.message.includes('payment_method')) { const fallbackPayload = { ...payload }; delete (fallbackPayload as any).payment_method; await supabase.from('driving_records').insert([fallbackPayload]); }
    
    const updated = [newRecord, ...records]; updated.sort((a, b) => a.date.localeCompare(b.date)); setRecords(updated); 
    const [y, m] = newDate.split('-'); setCurrentCalDate(new Date(Number(y), Number(m) - 1, 1));
    setNewDeparture('수원'); setNewDestination('부산'); setNewGross('150,000'); setNewFuel(''); setNewExtraExpense(''); setNewTip(''); setNewPaymentMethod('현금');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const XLSX = await import('xlsx'); const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const rawJson = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
          const parsedRecords = rawJson.map(parseImportedRow).filter((r: any) => r.grossAmount > 0);
          if (parsedRecords.length === 0) { alert('데이터를 변환할 수 없습니다.'); return; }
          setImportData(parsedRecords); setImportStep(2);
        } catch (error) { alert('파일 파싱 오류입니다.'); }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) { alert('변환 모듈을 불러올 수 없습니다.'); }
  };

  const handleBatchImport = async () => {
    if (!session || importData.length === 0) return; setIsImporting(true);
    try {
      const payloads = importData.map((data, idx) => ({ id: `rec_import_${Date.now()}_${idx}`, user_id: session.user.id, date: data.date, start_time: '-', end_time: '-', departure: data.departure, destination: data.destination, gross_amount: data.grossAmount, fee_rate: data.feeRate, fuel_amount: 0, extra_expense_amount: 0, tip_amount: 0, is_gross_paid: true, is_expense_paid: true, net_amount: data.netAmount, total_claim_amount: data.totalClaimAmount }));
      for (let i = 0; i < payloads.length; i += 50) { await supabase.from('driving_records').insert(payloads.slice(i, i + 50)); }
      alert('장부가 이관되었습니다!'); setImportModalOpen(false); fetchUserData(session.user.id, session.user.email || '');
    } catch (error: any) { alert('이관 실패: ' + error.message); } finally { setIsImporting(false); setImportData([]); setImportStep(1); }
  };

  const handleOpenEditModal = (r: DrivingRecord) => { setEditingRecord(r); setEditDate(r.date); setEditDeparture(r.departure); setEditDestination(r.destination); setEditGross(formatNumberWithComma(r.grossAmount)); setEditFuel(formatNumberWithComma(r.fuelAmount)); setEditExtra(formatNumberWithComma(r.extraExpenseAmount)); setEditTip(formatNumberWithComma(r.tipAmount)); setEditPaymentMethod(r.paymentMethod || '현금'); };
  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingRecord || !session) return;
    const gross = cleanNumber(editGross); const feeRate = cleanNumber(editingRecord.feeRate); const fuel = cleanNumber(editFuel); const extraExp = cleanNumber(editExtra); const tip = cleanNumber(editTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + extraExp;
    const payload = { date: editDate, departure: editDeparture, destination: editDestination, gross_amount: gross, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal), payment_method: editPaymentMethod };
    let error = (await supabase.from('driving_records').update(payload).eq('id', editingRecord.id)).error;
    if(error && error.message.includes('payment_method')) { const fb = { ...payload }; delete (fb as any).payment_method; error = (await supabase.from('driving_records').update(fb).eq('id', editingRecord.id)).error; }
    if (!error) { const updatedList = records.map((r) => r.id === editingRecord.id ? { ...r, date: editDate, departure: editDeparture, destination: editDestination, grossAmount: gross, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal), paymentMethod: editPaymentMethod } : r); updatedList.sort((a, b) => a.date.localeCompare(b.date)); setRecords(updatedList); setEditingRecord(null); } else { alert('수정 실패'); }
  };

  const handleBulkDeleteRecords = async () => {
    if (selectedRecordIds.length === 0) return; if (!window.confirm('선택한 운행 기록을 삭제하시겠습니까? (삭제 직후 상단에서 복구 가능)')) return;
    const recordsToDelete = records.filter(r => selectedRecordIds.includes(r.id));
    try {
      for (let i = 0; i < selectedRecordIds.length; i += 50) { await supabase.from('driving_records').delete().in('id', selectedRecordIds.slice(i, i + 50)); }
      setRecords(records.filter((r) => !selectedRecordIds.includes(r.id))); setLastDeletedRecords(recordsToDelete); setSelectedRecordIds([]);
    } catch (error: any) { alert('삭제 실패: ' + error.message); }
  };

  const handleUndoDelete = async () => {
    if (lastDeletedRecords.length === 0 || !session) return;
    const payloads = lastDeletedRecords.map(r => ({ id: r.id, user_id: session.user.id, date: r.date, start_time: r.startTime, end_time: r.endTime, departure: r.departure, destination: r.destination, gross_amount: r.grossAmount, fee_rate: r.feeRate, fuel_amount: r.fuelAmount, extra_expense_amount: r.extraExpenseAmount, tip_amount: r.tipAmount, is_gross_paid: r.isGrossPaid, is_expense_paid: r.isExpensePaid, net_amount: r.netAmount, total_claim_amount: r.totalClaimAmount, payment_method: r.paymentMethod || '현금' }));
    const insertWithFallback = async (chunk: any[]) => { let res = await supabase.from('driving_records').insert(chunk); if (res.error && res.error.message.includes('payment_method')) { const fb = chunk.map(p => { const { payment_method, ...rest } = p; return rest; }); res = await supabase.from('driving_records').insert(fb); } return res; };
    try {
      for (let i = 0; i < payloads.length; i += 50) { await insertWithFallback(payloads.slice(i, i + 50)); }
      const updated = [...records, ...lastDeletedRecords]; updated.sort((a, b) => a.date.localeCompare(b.date));
      setRecords(updated); setLastDeletedRecords([]); alert(`${lastDeletedRecords.length}건 복구 완료`);
    } catch (error: any) { alert('복구 실패: ' + error.message); }
  };

  const handleAddExpense = async (e: React.FormEvent) => { e.preventDefault(); const cleanAmt = cleanNumber(expAmount); if (!cleanAmt || !session) return; const expenseId = 'exp_' + Date.now().toString(); const { error } = await supabase.from('expenses').insert([{ id: expenseId, user_id: session.user.id, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }]); if (!error) { const updatedExp = [{ id: expenseId, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo }, ...expenses]; updatedExp.sort((a, b) => a.date.localeCompare(b.date)); setExpenses(updatedExp); setExpAmount(''); setExpMemo(''); } };
  const handleDeleteExpense = async (id: string) => { await supabase.from('expenses').delete().eq('id', id); setExpenses(expenses.filter((e) => e.id !== id)); };
  
  const handleApplyFixedExpenses = async () => {
    if (!session) return; const amount = cleanNumber(fixedDailyExp); if (amount <= 0 || !fixedDailyMemo.trim()) { alert('정확히 입력해주세요.'); return; }
    const cmPrefix = customDate.substring(0, 7); const cmRecords = records.filter(r => (r.date || '').startsWith(cmPrefix));
    const uniqueDates = Array.from(new Set(cmRecords.map(r => r.date))); const cmExpenses = expenses.filter(e => (e.date || '').startsWith(cmPrefix));
    const datesWithExp = new Set(cmExpenses.filter(e => e.memo === fixedDailyMemo.trim()).map(e => e.date));
    const datesToApply = uniqueDates.filter(d => !datesWithExp.has(d));
    if (datesToApply.length === 0) { alert('이미 모두 반영되어 있습니다.'); return; }
    if (!window.confirm(`${datesToApply.length}일치 고정비 일괄 등록하시겠습니까?`)) return;
    try {
      const newExpenses = datesToApply.map((date, idx) => ({ id: `exp_fixed_${Date.now()}_${idx}`, user_id: session.user.id, date: date, category: '기타', amount: amount, memo: fixedDailyMemo.trim() }));
      await supabase.from('expenses').insert(newExpenses);
      const updatedExp = [...newExpenses.map(e => ({...e, id: e.id, date: e.date, category: e.category, amount: e.amount, memo: e.memo})), ...expenses];
      updatedExp.sort((a, b) => a.date.localeCompare(b.date)); setExpenses(updatedExp); alert('자동 등록 완료');
    } catch (err: any) { alert('등록 실패: ' + err.message); }
  };

  const handleAddAccount = (e: React.FormEvent) => { e.preventDefault(); if (!bankName || !accountNumber) return; setAccounts([...accounts, { id: Date.now().toString(), bankName, accountNumber, holder: holder || '김탁송' }]); setBankName(''); setAccountNumber(''); setHolder(''); };
  const handleDeleteAccount = (id: string) => { setAccounts(accounts.filter(a => a.id !== id)); };
  const handleUpdateMemberRole = async (memberId: string, newRole: string) => { if (currentUserRole !== 'super_admin') return; await supabase.from('profiles').update({ role: newRole }).eq('id', memberId); fetchAdminData(); };
  const handleExportAdminCSV = () => { if (adminAllRecords.length === 0) return; const headers = ['일자','출발지','도착지','운임','수수료율','주유비','결제수단','추가경비','팁','순수익','운임입금','대납입금']; const rows = adminAllRecords.map((r) => [r.date, `"${r.departure}"`, `"${r.destination}"`, r.grossAmount, `${r.feeRate}%`, r.fuelAmount, r.paymentMethod || '현금', r.extraExpenseAmount, r.tipAmount, r.netAmount, r.isGrossPaid ? '완료' : '미수금', r.isExpensePaid ? '완료' : '미수금']); const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `JunDriver_운행내역.csv`; link.click(); };

  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withExtra: boolean) => {
    const pAcc = accounts[0] || { bankName: '은행', accountNumber: '계좌', holder: '예금주' }; const dPhone = formatPhoneNumber(currentUserProfile?.phone || session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE); const dName = currentUserProfile?.name || session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;
    let total = 0; let iText = '';
    if (withGross) { total += r.grossAmount; iText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`; }
    if (withFuel && r.fuelAmount > 0) { total += r.fuelAmount; iText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원\n`; }
    if (withExtra && r.extraExpenseAmount > 0) { total += r.extraExpenseAmount; iText += `* 추가경비: ${r.extraExpenseAmount.toLocaleString()}원\n`; }
    return `[정산 요청]\n* 일자: ${r.date}\n* 구간: ${r.departure} → ${r.destination}\n${iText}-----------------\n* 총 청구금액: ${total.toLocaleString()}원\n* 계좌: ${pAcc.bankName} ${pAcc.accountNumber} (${pAcc.holder})${dPhone ? `\n* 기사: ${dName} (${dPhone})` : ''}\n감사합니다.`;
  };
  const handleToggleInclude = (type: 'gross'|'fuel'|'extra') => { if (!selectedClaimRecord) return; const nG = type === 'gross' ? !includeGross : includeGross; const nF = type === 'fuel' ? !includeFuel : includeFuel; const nE = type === 'extra' ? !includeExtra : includeExtra; setIncludeGross(nG); setIncludeFuel(nF); setIncludeExtra(nE); setClaimMessageText(buildClaimText(selectedClaimRecord, nG, nF, nE)); };
  const openClaimMessageModal = (r: DrivingRecord) => { setSelectedClaimRecord(r); const iG = !r.isGrossPaid; const iF = !r.isExpensePaid && r.fuelAmount > 0; const iE = !r.isExpensePaid && r.extraExpenseAmount > 0; setIncludeGross(iG); setIncludeFuel(iF); setIncludeExtra(iE); setClaimMessageText(buildClaimText(r, iG, iF, iE)); setClaimModalOpen(true); };
  const openAdminUserDetail = (user: MemberProfile) => { setAdminSelectedUser(user); setAdminSelectedUserRecords(adminAllRecords.filter(r => r.userId === user.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10)); };

  const todayKstStr = getTodayKST();
  const currentMonthPrefix = customDate.substring(0, 7); 
  const unpaidRecords = records.filter((r) => !r.isGrossPaid || (!r.isExpensePaid && (r.fuelAmount > 0 || r.extraExpenseAmount > 0)));
  const totalUnpaidAmount = unpaidRecords.reduce((acc, r) => acc + (!r.isGrossPaid ? r.grossAmount : 0) + (!r.isExpensePaid ? (r.fuelAmount + r.extraExpenseAmount) : 0), 0);
  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';

  const monthlyRecords = records.filter((r) => (r.date || '').startsWith(currentMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => (e.date || '').startsWith(currentMonthPrefix));
  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  const targetIncNum = cleanNumber(targetIncome) || 0;
  const targetDaysNum = cleanNumber(targetDays) || 0;
  const uniqueWorkedDates = new Set(monthlyRecords.map(r => r.date)).size;
  const remainingDays = Math.max(0, targetDaysNum - uniqueWorkedDates);
  const remainingIncome = targetIncNum - monthlyProfit;
  const dailyRequired = remainingDays > 0 && remainingIncome > 0 ? Math.ceil(remainingIncome / remainingDays) : 0;
  const achievementRate = targetIncNum > 0 ? Math.min(100, Math.round((monthlyProfit / targetIncNum) * 100)) : 0;

  const filteredTradeCenters = TRADE_CENTERS.filter(center => {
    if (tradeFilter === '전체') return true; if (tradeFilter === 'S등급') return center.tier === 'S'; if (tradeFilter === 'A등급') return center.tier === 'A';
    if (tradeFilter === '수도권') return center.region === '수도권'; if (tradeFilter === '충청권') return center.region === '충청권'; if (tradeFilter === '영남권') return center.region === '영남권'; if (tradeFilter === '호남권') return center.region === '호남권'; return true;
  });

  const displayedMembers = adminMemberList.filter(m => {
    const safeName = m.name || ''; const safePhone = m.phone || ''; const safeEmail = m.email || '';
    const matchesSearch = safeName.includes(adminSearchTerm) || safePhone.includes(adminSearchTerm) || safeEmail.includes(adminSearchTerm);
    const isAce = (m.monthlyGross || 0) >= 1500000 || (m.recordCount || 0) >= 10;
    if (showScoutOnly) return matchesSearch && isAce; return matchesSearch;
  });

  const getTopDestinations = () => {
    if (adminAllRecords.length === 0) return []; const counts: Record<string, number> = {};
    adminAllRecords.forEach(r => { if (r.destination) counts[r.destination] = (counts[r.destination] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };
  const getTopEarners = () => { if (adminMemberList.length === 0) return []; return [...adminMemberList].sort((a, b) => (b.monthlyGross || 0) - (a.monthlyGross || 0)).slice(0, 5); };

  const calYear = currentCalDate.getFullYear(); const calMonth = currentCalDate.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate(); const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const calendarDaysArray: (string | null)[] = Array(firstDayIndex).fill(null);
  for (let i = 1; i <= daysInMonth; i++) { calendarDaysArray.push(`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`); }
  const currentMonthDisplayRecords = records.filter(r => r.date.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}`));

  const injectStyles = () => (
    <style dangerouslySetInnerHTML={{__html: `
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
      * { font-family: 'Pretendard', sans-serif !important; }
      body { background-color: #0B1120; color: white; min-height: 100vh; overflow-y: auto; }
      input, select, textarea { background-color: #FFFFFF !important; color: #000000 !important; font-weight: 600 !important; border: 1px solid transparent !important; transition: all 0.3s ease !important; }
      input:focus, select:focus, textarea:focus { box-shadow: 0 0 12px #8B5CF6 !important; border-color: #8B5CF6 !important; outline: none !important; }
      .hp-primary-btn { background: linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%) !important; color: #FFFFFF !important; transition: transform 0.3s ease, box-shadow 0.3s ease !important; border: none !important; text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important; }
      .hp-primary-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5) !important; }
      .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
      .fade-in-text { animation: fadeIn 0.5s ease-in-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `}} />
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {injectStyles()}
        <div className="w-full max-w-[420px] glass-card rounded-2xl p-7 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-[#0B1120] border border-[#8B5CF6]/30 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(139,92,246,0.2)]"><Car className="w-6 h-6 text-[#8B5CF6]" /></div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">JunDriver <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">PRO</span></h1>
          </div>
          <div className="flex bg-[#0B1120] p-1 rounded-xl border border-white/10 mb-5">
            <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${authMode === 'login' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>로그인</button>
            <button onClick={() => { setAuthMode('signup'); setAuthError(''); setCaptchaVerified(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${authMode === 'signup' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>회원가입</button>
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 (name@driver.com)" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full px-3.5 py-2.5 rounded-lg" />
              {authError && <div className="p-3 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-lg text-[#EC4899] text-xs">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg cursor-pointer mt-2">{authLoading ? '로딩 중...' : '클라우드 로그인'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <div className="grid grid-cols-2 gap-2"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (김탁송)" required className="w-full px-3.5 py-2.5 rounded-lg" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="휴대폰번호" maxLength={11} required className="w-full px-3.5 py-2.5 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-2"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호(6자리 이상)" required className="w-full px-3.5 py-2.5 rounded-lg" /><input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="비밀번호 재입력" required className="w-full px-3.5 py-2.5 rounded-lg" /></div>
              <div onClick={() => setCaptchaVerified(!captchaVerified)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${captchaVerified ? 'bg-[#38BDF8]/20 border-[#38BDF8]/50 text-[#38BDF8]' : 'bg-[#0B1120] border-white/10'}`}><div className="flex items-center gap-2.5"><div className={`w-5 h-5 rounded-md border flex items-center justify-center ${captchaVerified ? 'bg-[#38BDF8] border-[#38BDF8] text-white' : 'border-slate-600 bg-slate-800'}`}>{captchaVerified && <Check className="w-3.5 h-3.5" />}</div><span className="text-xs font-semibold">로봇이 아닙니다 (터치)</span></div></div>
              <div className="pt-2"><div className="p-3 rounded-xl bg-[#0B1120] border border-white/10 space-y-2"><div className="flex items-start gap-2.5"><input type="checkbox" id="agreeChk" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6] cursor-pointer" /><label htmlFor="agreeChk" className="text-xs text-slate-200 font-medium cursor-pointer">[필수] 개인정보 수집 및 운행일지 저장 동의</label></div></div></div>
              {authError && <div className="p-2.5 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-lg text-[#EC4899] text-xs">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg cursor-pointer mt-2">{authLoading ? '처리 중...' : '동의하고 회원가입'}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 pb-20 relative">
      {injectStyles()}
      <header className="sticky top-0 z-30 glass-card border-b-0 border-white/5 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-lg flex items-center justify-center shadow-[0_0_10px_#8B5CF6]"><Car className="w-4 h-4 text-white" /></div><span className="font-bold text-base text-white">JunDriver</span><span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#8B5CF6]/20 text-[#8B5CF6] rounded border border-[#8B5CF6]/30">PRO</span></div>
          <div className="flex items-center gap-2">
            {isAdminUser && <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'admin' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20'}`}><Crown className="w-3.5 h-3.5" /><span className="hidden sm:inline">관제탑</span></button>}
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs text-slate-200 cursor-pointer"><User className="w-3.5 h-3.5 text-[#8B5CF6]" /><span className="block font-bold text-white">{currentUserProfile?.name || '기사'}님</span></button>
            <button onClick={handleLogout} className="p-1.5 rounded-lg glass-card text-slate-400 hover:text-[#EC4899] cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-5 pb-10 space-y-5 h-full">
        {totalUnpaidAmount > 0 && activeTab !== 'admin' && (
          <section className="bg-[#EC4899]/10 border border-[#EC4899]/40 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(236,72,153,0.1)] fade-in-text"><div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-[#EC4899]" /><div><span className="text-xs font-bold text-[#EC4899]">미입금 내역 ({unpaidRecords.length}건) 회수 필요</span><div className="text-xl font-extrabold text-white">총 {totalUnpaidAmount.toLocaleString()}원</div></div></div><button onClick={() => setActiveTab('claims')} className="px-4 py-2 hp-primary-btn rounded-xl text-xs font-bold cursor-pointer">청구 관리</button></section>
        )}

        <div className="bg-[#0B1120] p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="grid grid-cols-4 md:flex md:flex-wrap gap-1.5">
            <button onClick={() => setActiveTab('records')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'records' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>운행 일지</button>
            <button onClick={() => setActiveTab('claims')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer relative transition-all ${activeTab === 'claims' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>청구 관리 {unpaidRecords.length > 0 && <span className="ml-0.5 px-1 py-0.2 rounded-full bg-[#EC4899] text-white text-[9px] font-extrabold">{unpaidRecords.length}</span>}</button>
            <button onClick={() => setActiveTab('expense')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'expense' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>경비 장부</button>
            <button onClick={() => setActiveTab('analytics')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'analytics' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>통계 요약</button>
            <button onClick={() => setActiveTab('wallet')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'wallet' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>계좌 관리</button>
            <button onClick={() => setActiveTab('trade_centers')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'trade_centers' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>매매단지</button>
            <button onClick={() => setActiveTab('auctions')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'auctions' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>경매장</button>
            {isAdminUser ? <button onClick={() => setActiveTab('admin')} className={`py-2 px-1 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'admin' ? 'bg-[#38BDF8] text-[#0B1120] font-extrabold' : 'bg-[#38BDF8]/10 text-[#38BDF8]'}`}>관제탑</button> : <div className="hidden md:block"></div>}
          </div>
        </div>

        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#8B5CF6]" />새 운행 배차 등록</h3>
              <p className="text-[11px] text-[#38BDF8] font-medium mb-4 ml-6">탁송 운임과 대납 비용을 기록하여 순수익을 계산합니다.</p>
              <form onSubmit={handleAddRecord} className="space-y-3.5">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label><input type="text" value={newGross} onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg text-right" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label><input type="number" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-right" /></div>
                </div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">기사 팁/추가운임 (선택)</label><input type="text" placeholder="5,000" value={newTip} onChange={(e) => setNewTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
                
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/20">
                  <label className="text-xs font-bold text-[#8B5CF6] flex items-center justify-between gap-1.5 mb-2"><div className="flex items-center gap-1.5"><Fuel className="w-4 h-4 text-[#8B5CF6]" />대납 주유/충전비 (100% 회수)</div></label>
                  <input type="text" placeholder="선결제한 주유 금액" value={newFuel} onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right mb-2" />
                  <div className="flex flex-row items-center justify-between gap-2 pt-1 w-full">
                    <button type="button" onClick={() => setNewPaymentMethod('현금')} className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${newPaymentMethod === '현금' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-[#0B1120] text-slate-400 border-white/20 hover:border-white/40'}`}>현금 결제</button>
                    <button type="button" onClick={() => setNewPaymentMethod('카드')} className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${newPaymentMethod === '카드' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-[#0B1120] text-slate-400 border-white/20 hover:border-white/40'}`}>카드 결제</button>
                  </div>
                </div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">통행료 등 기타 대납경비 (선택)</label><input type="text" placeholder="0" value={newExtraExpense} onChange={(e) => setNewExtraExpense(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
                <button type="submit" className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">운행 일지 등록</button>
              </form>
            </div>
            
            <div className="lg:col-span-2 glass-card rounded-xl p-5 shadow-lg flex flex-col h-[750px]">
              <div className="flex flex-col gap-3 mb-4 border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-[#8B5CF6]" />운행 캘린더 및 정산 관리</h3>
                  <button onClick={() => { setImportStep(1); setImportData([]); setImportModalOpen(true); }} className="px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/20 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"><Download className="w-3.5 h-3.5" />타사 장부 이관</button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentCalDate(new Date(calYear, calMonth - 1, 1))} className="p-1 hover:bg-white/10 rounded cursor-pointer text-slate-300"><ChevronLeft className="w-5 h-5" /></button>
                    <input type="month" value={`${calYear}-${String(calMonth + 1).padStart(2, '0')}`} onChange={(e) => { const [y, m] = e.target.value.split('-'); setCurrentCalDate(new Date(Number(y), Number(m) - 1, 1)); }} className="bg-transparent text-white text-base font-extrabold focus:outline-none cursor-pointer text-center w-32 border-0" />
                    <button onClick={() => setCurrentCalDate(new Date(calYear, calMonth + 1, 1))} className="p-1 hover:bg-white/10 rounded cursor-pointer text-slate-300"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 cursor-pointer border-r border-white/10 pr-2 mr-1">
                      <input type="checkbox" checked={currentMonthDisplayRecords.length > 0 && selectedRecordIds.length === currentMonthDisplayRecords.length} onChange={(e) => setSelectedRecordIds(e.target.checked ? currentMonthDisplayRecords.map(r => r.id) : [])} className="w-4 h-4 rounded text-[#8B5CF6] cursor-pointer bg-[#0B1120] border-white/20" />
                      전체선택
                    </label>
                    {lastDeletedRecords.length > 0 && (
                      <button onClick={handleUndoDelete} className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer animate-pulse border border-indigo-500/30"><RotateCcw className="w-3.5 h-3.5" />방금 삭제 ({lastDeletedRecords.length}건) 복구</button>
                    )}
                    <button onClick={handleBulkDeleteRecords} disabled={selectedRecordIds.length === 0} className={`px-2.5 py-1.5 text-[10px] font-bold rounded flex items-center gap-1 transition-colors ${selectedRecordIds.length > 0 ? 'bg-[#EC4899]/20 hover:bg-[#EC4899]/40 text-[#EC4899] cursor-pointer' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}><Trash2 className="w-3.5 h-3.5" />삭제 ({selectedRecordIds.length})</button>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-hide rounded-xl border border-white/10 bg-[#0B1120]">
                <div className="min-w-[650px] h-full flex flex-col">
                  <div className="grid grid-cols-7 border-b border-white/10 shrink-0 sticky top-0 bg-[#0B1120] z-10">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => ( <div key={day} className={`p-2 text-center text-xs font-bold ${i === 0 ? 'text-[#EC4899]' : i === 6 ? 'text-[#38BDF8]' : 'text-slate-400'}`}>{day}</div> ))}
                  </div>
                  <div className="grid grid-cols-7 auto-rows-fr flex-1">
                    {calendarDaysArray.map((dateStr, idx) => {
                      if (!dateStr) return <div key={`empty-${idx}`} className="border-b border-r border-white/5 bg-white/[0.01]"></div>;
                      const dayRecords = records.filter(r => r.date === dateStr);
                      const isToday = dateStr === getTodayKST(); const dateNum = parseInt(dateStr.split('-')[2]);
                      return (
                        // 💡 [클릭 이벤트 적용] 캘린더 날짜 클릭 시 입력폼 날짜 자동 업데이트 & 위로 스크롤
                        <div key={dateStr} 
                             onClick={() => { setNewDate(dateStr); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                             className={`border-b border-r border-white/5 p-1.5 flex flex-col min-h-[90px] transition-colors hover:bg-white/10 cursor-pointer ${isToday ? 'bg-[#8B5CF6]/10' : ''}`}>
                          <div className={`text-[10px] font-bold mb-1.5 ${isToday ? 'text-white bg-[#8B5CF6] w-5 h-5 rounded-full flex items-center justify-center' : 'text-slate-400 ml-1'}`}>{dateNum}</div>
                          <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide pr-0.5">
                            {dayRecords.map(r => {
                              const isChecked = selectedRecordIds.includes(r.id);
                              return (
                                // 💡 [클릭 방어] 캘린더 내 기존 기록 클릭 시 폼 날짜가 안 바뀌게 방어막 설정
                                <div key={r.id} onClick={(e) => e.stopPropagation()} className={`relative group p-1.5 rounded-md border flex flex-col gap-1 transition-all ${isChecked ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50' : 'bg-black/40 border-white/10 hover:border-white/30'}`}>
                                  <div className="flex items-start gap-1.5">
                                    <input type="checkbox" checked={isChecked} onChange={(e) => { e.stopPropagation(); if (e.target.checked) setSelectedRecordIds([...selectedRecordIds, r.id]); else setSelectedRecordIds(selectedRecordIds.filter(id => id !== r.id)); }} onClick={(e) => e.stopPropagation()} className="w-3 h-3 text-[#8B5CF6] rounded bg-[#0B1120] border-white/20 mt-0.5 cursor-pointer shrink-0" />
                                    <div className="min-w-0 flex-1 leading-tight">
                                      <div className="text-[10px] font-extrabold text-white truncate cursor-pointer hover:text-[#38BDF8]" onClick={(e) => { e.stopPropagation(); handleOpenEditModal(r); }}>{r.destination}</div>
                                      <div className="text-[9px] text-[#38BDF8] font-bold">{(r.netAmount / 10000).toFixed(1)}만</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="glass-card rounded-xl p-6 shadow-lg fade-in-text">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div><h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#8B5CF6]" />미입금 청구 대상 ({unpaidRecords.length}건)</h3><p className="text-[11px] text-[#38BDF8] font-medium mt-1 ml-6">미입금된 항목(운임 또는 주유비)만 골라서 정산 요청 문자를 생성합니다.</p></div>
              <span className="text-xs font-bold text-[#EC4899] bg-[#EC4899]/10 px-3 py-1.5 rounded-lg border border-[#EC4899]/30">총 미수금 {totalUnpaidAmount.toLocaleString()}원</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpaidRecords.length === 0 ? <div className="col-span-full text-center py-10 text-slate-500 text-xs">현재 미입금 내역이 없습니다.</div> : unpaidRecords.slice(0, visibleClaimCount).map((r) => (
                <div key={r.id} className="bg-[#0B1120] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-[#8B5CF6]/50 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2"><span className="px-2 py-0.5 bg-[#EC4899]/20 text-[#EC4899] text-[10px] font-bold rounded">청구 대기</span><span className="text-[10px] text-slate-400 font-mono">{r.date}</span></div>
                    <div className="font-bold text-white text-sm mb-1 flex items-center gap-1.5"><span>{r.departure}</span><ChevronRight className="w-3.5 h-3.5 text-[#8B5CF6]" /><span>{r.destination}</span></div>
                    <div className="text-xs text-slate-400 mt-3 space-y-1">
                      {!r.isGrossPaid && <div className="flex justify-between"><span>탁송운임</span><span className="text-white">{r.grossAmount.toLocaleString()}원</span></div>}
                      {!r.isExpensePaid && r.fuelAmount > 0 && <div className="flex justify-between"><span>대납 주유비</span><span className="text-white">{r.fuelAmount.toLocaleString()}원 <span className="text-[10px] text-slate-500">({r.paymentMethod || '현금'})</span></span></div>}
                      {!r.isExpensePaid && r.extraExpenseAmount > 0 && <div className="flex justify-between"><span>대납 추가경비</span><span className="text-white">{r.extraExpenseAmount.toLocaleString()}원</span></div>}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center"><button onClick={() => openClaimMessageModal(r)} className="px-3 py-1.5 hp-primary-btn text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-1 ml-auto"><MessageSquare className="w-3.5 h-3.5" />문자 생성</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#EC4899]" />일반 경비 지출 등록</h3>
                <form onSubmit={handleAddExpense} className="space-y-3.5 mt-4">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 분류</label><select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg"><option value="대중교통">대중교통 (버스/지하철/택시)</option><option value="식대">식대/간식</option><option value="차량공유">차량공유 (쏘카/그린카)</option><option value="기타">기타 경비</option></select></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 금액(원)</label><input type="text" placeholder="금액 입력" value={expAmount} onChange={(e) => setExpAmount(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2 rounded-lg text-right" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">상세 메모 (선택)</label><input type="text" placeholder="예: 경기K패스, 광역버스" value={expMemo} onChange={(e) => setExpMemo(e.target.value)} className="w-full px-3 py-2 rounded-lg" /></div>
                  <button type="submit" className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">경비 등록하기</button>
                </form>
              </div>
              <div className="glass-card rounded-xl p-5 shadow-lg border-t-2 border-t-[#38BDF8]">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-[#38BDF8]" /> 매일 나가는 고정비 세팅</h3>
                <div className="space-y-3 mt-4"><input type="text" value={fixedDailyMemo} onChange={(e) => setFixedDailyMemo(e.target.value)} placeholder="예: 프로그램 일비 및 보험료" className="w-full px-3 py-2 rounded-lg text-xs" /><div className="relative"><input type="text" value={fixedDailyExp} onChange={(e) => setFixedDailyExp(formatNumberWithComma(e.target.value))} placeholder="차감 금액 (예: 3,200)" className="w-full px-3 py-2 rounded-lg text-xs text-right pr-6" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">원</span></div><button onClick={handleApplyFixedExpenses} className="w-full py-2.5 bg-white/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-sm">이번 달 운행일에 일괄 차감 적용</button></div>
              </div>
            </div>
            <div className="lg:col-span-2 glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-4">지출 내역 목록 ({expenses.length}건)</h3>
              <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {expenses.length === 0 ? <div className="text-center py-10 text-slate-500 text-xs">등록된 경비 지출이 없습니다.</div> : expenses.map((e) => (
                  <div key={e.id} className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex items-center justify-between hover:border-white/20 transition-all">
                    <div><div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-white/10 text-slate-300 rounded text-[10px] font-semibold">{e.category}</span><span className="text-sm text-white font-medium">{e.memo || '-'}</span></div><div className="text-xs text-slate-500 mt-1.5">{e.date}</div></div>
                    <div className="flex items-center gap-3"><span className="text-[#EC4899] font-bold text-sm">-{e.amount.toLocaleString()}원</span><button onClick={() => handleDeleteExpense(e.id)} className="text-slate-600 hover:text-[#EC4899] p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 fade-in-text">
            <div className="flex gap-2 bg-[#0B1120] p-1.5 rounded-xl border border-white/10 w-fit">
              <button onClick={() => setAnalyticsMode('month')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${analyticsMode === 'month' ? 'bg-[#8B5CF6] text-white shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'text-slate-400 hover:text-white'}`}>월간 상세 요약</button>
              <button onClick={() => setAnalyticsMode('year')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${analyticsMode === 'year' ? 'bg-[#8B5CF6] text-white shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'text-slate-400 hover:text-white'}`}>연간 종합 통계</button>
            </div>
            {analyticsMode === 'month' && (
              <div className="space-y-4 fade-in-text">
                <div className="glass-card rounded-2xl p-5 md:p-6 shadow-xl border-2 border-[#8B5CF6]/40 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
                      <div><h3 className="text-base font-extrabold text-white flex items-center gap-1.5"><Target className="w-5 h-5 text-[#8B5CF6]" /> 내 목표 달성 페이스메이커</h3></div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 mb-0.5 ml-1">목표 순수익(원)</span><input type="text" value={targetIncome} onChange={(e) => setTargetIncome(formatNumberWithComma(e.target.value))} className="w-24 px-2 py-1.5 rounded text-xs text-right bg-[#0B1120] border border-white/20 text-white" /></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 mb-0.5 ml-1">출근(일)</span><input type="number" value={targetDays} onChange={(e) => setTargetDays(e.target.value)} className="w-16 px-2 py-1.5 rounded text-xs text-center bg-[#0B1120] border border-white/20 text-white" /></div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-2"><span className="text-sm font-bold text-white">진행률 <span className="text-[#8B5CF6] ml-1">{achievementRate}%</span></span><span className="text-[11px] text-slate-400 font-mono">{monthlyProfit.toLocaleString()}원 / {targetIncNum.toLocaleString()}원</span></div>
                      <div className="w-full bg-[#0B1120] rounded-full h-3.5 border border-white/5 overflow-hidden"><div className="bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${achievementRate}%` }}></div></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5"><div className="text-[10px] text-slate-400 mb-1">실제 출근 일수</div><div className="text-sm font-bold text-white">{uniqueWorkedDates}일</div></div>
                      <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5"><div className="text-[10px] text-slate-400 mb-1">남은 금액</div><div className="text-sm font-bold text-[#EC4899]">{Math.max(0, remainingIncome).toLocaleString()}원</div></div>
                      <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 md:col-span-2 flex items-center justify-between"><div><div className="text-[10px] text-[#38BDF8] mb-1 font-bold">목표 달성을 위해 오늘부터</div><div className="text-lg font-extrabold text-white">하루 <span className="text-[#38BDF8]">{dailyRequired.toLocaleString()}</span> 원 씩!</div></div></div>
                    </div>
                  </div>
                </div>
                <section className="bg-gradient-to-r from-[#0B1120] via-indigo-950/40 to-[#0B1120] border border-[#8B5CF6]/30 rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/10 gap-2">
                    <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#8B5CF6]" /><h2 className="text-xs font-bold text-slate-200 tracking-wide uppercase">이달의 총 누적 결산</h2></div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div><div className="text-[11px] text-slate-400 mb-1">총 탁송 매출</div><div className="text-xl lg:text-2xl font-extrabold text-white">{monthlyGross.toLocaleString()}원</div></div>
                    <div><div className="text-[11px] text-slate-400 mb-1">탁송 순수익</div><div className="text-xl lg:text-2xl font-extrabold text-[#38BDF8]">{monthlyNet.toLocaleString()}원</div></div>
                    <div><div className="text-[11px] text-slate-400 mb-1">일반 경비 지출</div><div className="text-xl lg:text-2xl font-extrabold text-[#EC4899]">-{monthlyExpense.toLocaleString()}원</div></div>
                    <div><div className="text-[11px] text-slate-400 mb-1">최종 실수령액 (예상)</div><div className="text-xl lg:text-2xl font-extrabold text-[#38BDF8]">{monthlyProfit.toLocaleString()}원</div></div>
                  </div>
                </section>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card rounded-xl p-5 border-t-2 border-t-[#8B5CF6]">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><PieChart className="w-4 h-4 text-[#8B5CF6]" /> 당월 매출 세부 구성</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center"><span className="text-slate-400">기본 탁송 운임</span><span className="text-white font-semibold">{monthlyRecords.reduce((sum, r) => sum + r.grossAmount, 0).toLocaleString()}원</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400">기사 팁 / 추가 운임</span><span className="text-[#38BDF8] font-semibold">+{monthlyRecords.reduce((sum, r) => sum + r.tipAmount, 0).toLocaleString()}원</span></div>
                      <div className="flex justify-between items-center border-t border-white/10 pt-3"><span className="text-slate-400">수수료 차감액 (추정)</span><span className="text-[#EC4899] font-semibold">-{monthlyRecords.reduce((sum, r) => sum + (r.grossAmount * (r.feeRate/100)), 0).toLocaleString()}원</span></div>
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-5 border-t-2 border-t-[#EC4899]">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-[#EC4899]" /> 당월 미수금 회수 현황</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center"><span className="text-slate-400">입금 완료 (정산 끝)</span><span className="text-emerald-400 font-bold">{monthlyRecords.reduce((sum, r) => sum + (r.isGrossPaid ? r.grossAmount : 0) + (r.isExpensePaid ? (r.fuelAmount + r.extraExpenseAmount) : 0), 0).toLocaleString()}원</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400">미수금 : 순수 운임</span><span className="text-[#EC4899] font-semibold">{monthlyRecords.reduce((sum, r) => sum + (!r.isGrossPaid ? r.grossAmount : 0), 0).toLocaleString()}원</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400">미수금 : 대납(주유/경비)</span><span className="text-[#EC4899] font-semibold">{monthlyRecords.reduce((sum, r) => sum + (!r.isExpensePaid ? r.fuelAmount + r.extraExpenseAmount : 0), 0).toLocaleString()}원</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {analyticsMode === 'year' && (
              <div className="space-y-4 fade-in-text">
                <div className="flex items-center justify-between glass-card p-4 rounded-xl border border-[#8B5CF6]/30">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#8B5CF6]" /> {analyticsYear}년 종합 수익 통계</h2>
                  <select value={analyticsYear} onChange={(e) => setAnalyticsYear(e.target.value)} className="bg-[#0B1120] text-white border border-[#8B5CF6]/50 rounded-lg px-3 py-1.5 text-xs font-bold focus:border-[#8B5CF6] outline-none cursor-pointer"><option value="2026">2026년</option><option value="2025">2025년</option></select>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#0B1120] border border-white/10 p-4 rounded-xl text-center shadow-lg"><div className="text-[10px] text-slate-400 mb-1">연간 총 운행</div><div className="text-lg font-bold text-white">{records.filter(r => (r.date || '').startsWith(analyticsYear)).length}회</div></div>
                  <div className="bg-[#0B1120] border border-white/10 p-4 rounded-xl text-center shadow-lg"><div className="text-[10px] text-slate-400 mb-1">연간 총 탁송매출</div><div className="text-lg font-bold text-[#8B5CF6]">{records.filter(r => (r.date || '').startsWith(analyticsYear)).reduce((sum, r) => sum + r.grossAmount, 0).toLocaleString()}원</div></div>
                  <div className="bg-[#0B1120] border border-white/10 p-4 rounded-xl text-center shadow-lg"><div className="text-[10px] text-slate-400 mb-1">연간 순수익</div><div className="text-lg font-bold text-[#38BDF8]">{records.filter(r => (r.date || '').startsWith(analyticsYear)).reduce((sum, r) => sum + r.netAmount, 0).toLocaleString()}원</div></div>
                  <div className="bg-[#0B1120] border border-white/10 p-4 rounded-xl text-center shadow-lg"><div className="text-[10px] text-slate-400 mb-1">연간 총 지출</div><div className="text-lg font-bold text-[#EC4899]">{expenses.filter(e => (e.date || '').startsWith(analyticsYear)).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}원</div></div>
                </div>
                <div className="glass-card rounded-xl p-0 overflow-hidden shadow-lg border border-white/10">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#0B1120] text-slate-400 border-b border-white/10">
                        <tr><th className="p-3 text-center">월별</th><th className="p-3 text-right">운행건수</th><th className="p-3 text-right">탁송 매출</th><th className="p-3 text-right">대납(주유/경비)</th><th className="p-3 text-right text-[#38BDF8]">순수익</th><th className="p-3 text-right text-[#EC4899]">지출</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Array.from({ length: 12 }, (_, i) => {
                          const mStr = `${analyticsYear}-${String(i + 1).padStart(2, '0')}`;
                          const mRecs = records.filter(r => (r.date || '').startsWith(mStr)); const mExps = expenses.filter(e => (e.date || '').startsWith(mStr));
                          if(mRecs.length === 0 && mExps.length === 0) return null;
                          return (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 text-center font-bold text-white bg-white/5">{i + 1}월</td>
                              <td className="p-3 text-right text-slate-300">{mRecs.length}건</td>
                              <td className="p-3 text-right text-white font-semibold">{mRecs.reduce((sum, r) => sum + r.grossAmount, 0).toLocaleString()}</td>
                              <td className="p-3 text-right text-slate-400">{mRecs.reduce((sum, r) => sum + r.fuelAmount + r.extraExpenseAmount, 0).toLocaleString()}</td>
                              <td className="p-3 text-right text-[#38BDF8] font-bold">{mRecs.reduce((sum, r) => sum + r.netAmount, 0).toLocaleString()}</td>
                              <td className="p-3 text-right text-[#EC4899] font-medium">{mExps.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#38BDF8]" />정산 및 송금용 계좌 추가</h3>
              <form onSubmit={handleAddAccount} className="space-y-3.5 mt-4">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">은행명</label><input type="text" placeholder="예: 신한은행" value={bankName} onChange={(e) => setBankName(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">계좌번호 (- 제외)</label><input type="text" placeholder="계좌번호 입력" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required className="w-full px-3 py-2 rounded-lg font-mono" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">예금주</label><input type="text" placeholder="예금주 성함 (예: 김탁송)" value={holder} onChange={(e) => setHolder(e.target.value)} required className="w-full px-3 py-2 rounded-lg" /></div>
                <button type="submit" className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">새 계좌 등록</button>
              </form>
            </div>
            <div className="space-y-3">
              {accounts.map((acc, idx) => (
                <div key={acc.id} className="relative bg-gradient-to-br from-[#0B1120] to-indigo-950/30 border border-[#8B5CF6]/30 rounded-xl p-6 overflow-hidden shadow-lg group hover:border-[#8B5CF6] transition-colors">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6"><span className="px-2 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-bold rounded uppercase">{idx === 0 ? '대표 계좌 (청구용)' : '보조 계좌'}</span><button onClick={() => handleDeleteAccount(acc.id)} className="text-slate-500 hover:text-[#EC4899] p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button></div>
                    <div className="text-2xl font-bold font-mono tracking-wider text-white mb-2">{acc.accountNumber}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-300"><span className="font-bold">{acc.bankName}</span> <span className="text-slate-500">|</span> <span>예금주: {acc.holder}</span></div>
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); alert('계좌번호가 복사되었습니다.'); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-white/20"><Copy className="w-3.5 h-3.5" /> 계좌번호 복사</button></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trade_centers' && (
          <div className="space-y-5 fade-in-text">
            <div className="glass-card rounded-xl p-5 shadow-lg border border-[#8B5CF6]/30">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Building2 className="w-5 h-5 text-[#8B5CF6]" />전국 주요 매매단지 거점 현황 ({filteredTradeCenters.length}곳)</h3>
              <div className="flex flex-wrap gap-2">{['전체', 'S등급', 'A등급', '수도권', '충청권', '영남권', '호남권'].map(f => ( <button key={f} onClick={() => setTradeFilter(f as any)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${tradeFilter === f ? 'bg-[#8B5CF6] text-white shadow-[0_0_10px_rgba(139,92,246,0.4)] border-transparent' : 'bg-[#0B1120] text-slate-400 border border-white/10 hover:border-[#8B5CF6]/50'}`}>{f}</button> ))}</div>
            </div>
            <div className="flex gap-4 px-2 text-[10px] font-bold"><span className="text-[#F59E0B] flex items-center gap-1"><Crown className="w-3 h-3" /> S등급 (메가 허브)</span><span className="text-[#38BDF8] flex items-center gap-1"><Target className="w-3 h-3" /> A등급 (광역 핵심)</span><span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> B등급 (주요 알짜)</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {filteredTradeCenters.map((center) => (
                <div key={center.id} className={`glass-card p-4 rounded-xl border-t-2 flex flex-col gap-3 transition-all hover:bg-white/5 ${center.tier === 'S' ? 'border-t-[#F59E0B] shadow-[0_4px_15px_rgba(245,158,11,0.1)]' : center.tier === 'A' ? 'border-t-[#38BDF8]' : 'border-t-white/20'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-1.5">{center.tier === 'S' && <span className="px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-extrabold rounded flex items-center gap-0.5"><Crown className="w-3 h-3" /> S등급</span>}{center.tier === 'A' && <span className="px-1.5 py-0.5 bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-bold rounded flex items-center gap-0.5"><Target className="w-3 h-3" /> A등급</span>}{center.tier === 'B' && <span className="px-1.5 py-0.5 bg-white/10 text-slate-300 text-[10px] font-bold rounded flex items-center gap-0.5">B등급</span>}<span className="text-[10px] font-semibold text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">{center.region}</span></div></div>
                    <h4 className="text-sm font-extrabold text-white mb-1.5">{center.name}</h4><p className="text-[11px] text-slate-300 bg-[#0B1120] p-2 rounded-lg border border-white/5 leading-relaxed mb-2.5">{center.desc}</p>
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400"><MapPin className="w-3.5 h-3.5 mt-0.5 text-[#EC4899] shrink-0" /><span className="leading-tight">{center.addr}</span></div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-auto">
                    <button onClick={() => window.open(`https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(center.addr)}`, '_blank')} className="flex-1 py-2 bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#03C75A] border border-[#03C75A]/30 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"><Navigation className="w-3.5 h-3.5" /> 네이버 지도</button>
                    <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(center.addr)}`, '_blank')} className="flex-1 py-2 bg-[#FEE500]/10 hover:bg-[#FEE500]/20 text-[#FEE500] border border-[#FEE500]/30 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"><Navigation className="w-3.5 h-3.5" /> 카카오 맵</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'auctions' && (
          <div className="space-y-6 fade-in-text">
            <div className="glass-card rounded-xl p-6 shadow-lg border border-[#8B5CF6]/30">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-[#8B5CF6]" />탁송 오더 집중 발생 요약 (장거리 계획용)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex items-start gap-3"><Clock className="w-4 h-4 text-[#38BDF8] mt-0.5" /><div><div className="text-xs font-bold text-slate-300">경매 진행 시간</div><div className="text-sm font-extrabold text-white mt-1">오후 1시 ~ 오후 5시</div><div className="text-[10px] text-slate-500 mt-0.5">* 마감시간은 경매장별로 상이합니다.</div></div></div>
                <div className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex items-start gap-3"><MapPin className="w-4 h-4 text-[#EC4899] mt-0.5" /><div><div className="text-xs font-bold text-slate-300">오더 집중 발생 시간</div><div className="text-sm font-extrabold text-white mt-1">경매 시작 ~ 오후 6시까지</div><div className="text-[10px] text-slate-500 mt-0.5">* 익일 오전까지도 잔여 오더가 계속 발생합니다.</div></div></div>
              </div>
            </div>
            <div className="flex gap-4 px-2 text-[10px] font-bold"><span className="text-[#F59E0B] flex items-center gap-1"><Crown className="w-3 h-3" /> S등급 (메가 옥션)</span><span className="text-[#38BDF8] flex items-center gap-1"><Target className="w-3 h-3" /> A등급 (광역 옥션)</span><span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> B등급 (지역/특화 옥션)</span></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
              {AUCTION_SCHEDULES.map((schedule, idx) => (
                <div key={idx} className="glass-card p-5 rounded-xl border-t-2 flex flex-col gap-3" style={{ borderTopColor: schedule.hex }}>
                  <div className="flex items-center gap-2 mb-2"><CalendarDays className="w-5 h-5" style={{ color: schedule.hex }} /><h4 className="font-extrabold text-base text-white">{schedule.day}</h4></div>
                  <div className="space-y-3">
                    {schedule.locations.map((loc, i) => (
                      <div key={i} className={`bg-[#0B1120] border rounded-xl p-3.5 hover:border-white/20 transition-all flex flex-col gap-3 ${loc.tier === 'S' ? 'border-[#F59E0B]/30' : loc.tier === 'A' ? 'border-[#38BDF8]/30' : 'border-white/5'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">{loc.tier === 'S' && <span className="px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-extrabold rounded flex items-center gap-0.5"><Crown className="w-3 h-3" /> S등급</span>}{loc.tier === 'A' && <span className="px-1.5 py-0.5 bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-bold rounded flex items-center gap-0.5"><Target className="w-3 h-3" /> A등급</span>}{loc.tier === 'B' && <span className="px-1.5 py-0.5 bg-white/10 text-slate-300 text-[10px] font-bold rounded flex items-center gap-0.5">B등급</span>}<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">{loc.tag}</span><span className="text-sm font-bold text-slate-100">{loc.name}</span></div>
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-400"><MapPin className="w-3 h-3 mt-0.5 text-[#38BDF8] shrink-0" /><span>{loc.addr}</span></div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button onClick={() => window.open(`https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(loc.addr)}`, '_blank')} className="flex-1 py-1.5 bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#03C75A] border border-[#03C75A]/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors">네이버 지도</button>
                          <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(loc.addr)}`, '_blank')} className="flex-1 py-1.5 bg-[#FEE500]/10 hover:bg-[#FEE500]/20 text-[#FEE500] border border-[#FEE500]/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors">카카오 맵</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdminUser && (
          <div className="space-y-6 fade-in-text">
            <div className="mb-2"><h3 className="text-sm font-bold text-[#38BDF8] flex items-center gap-2"><Crown className="w-5 h-5" />플랫폼 관리자 (관제탑)</h3></div>
            <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => setAdminSubTab('campaign')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer shrink-0 transition-colors ${adminSubTab === 'campaign' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>공지/이벤트 문구보관함</button>
              <button onClick={() => setAdminSubTab('members')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer shrink-0 transition-colors ${adminSubTab === 'members' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>회원 접속 현황 및 스카우트</button>
              <button onClick={() => setAdminSubTab('analytics')} className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer shrink-0 transition-colors ${adminSubTab === 'analytics' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>플랫폼 트래픽 및 매출 통계</button>
            </div>

            {adminSubTab === 'campaign' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-xl space-y-4 h-fit">
                  <div className="flex items-center justify-between"><h4 className="font-bold text-white text-sm flex items-center gap-1.5"><BookmarkPlus className="w-4 h-4 text-[#8B5CF6]" />{editingNoticeId ? '문구 수정하기' : '새 공지 문구 저장'}</h4>{editingNoticeId && <button onClick={() => { setEditingNoticeId(null); setInputNoticeTitle(''); setInputNoticeContent(''); }} className="text-[11px] text-[#38BDF8] hover:text-white cursor-pointer">신규 작성</button>}</div>
                  <form onSubmit={handleSaveNoticeTemplate} className="space-y-3">
                    <input type="text" value={inputNoticeTitle} onChange={(e) => setInputNoticeTitle(e.target.value)} placeholder="제목 (예: 11월 프로모션 안내)" required className="w-full px-3 py-2 rounded-lg text-xs" />
                    <textarea rows={4} value={inputNoticeContent} onChange={(e) => setInputNoticeContent(e.target.value)} placeholder="앱 최상단 배너에 노출될 내용" required className="w-full px-3 py-2 rounded-lg text-xs" />
                    <button type="submit" disabled={noticeLoading} className="w-full py-2.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">{noticeLoading ? '처리 중...' : editingNoticeId ? '수정 내용 저장' : '보관함에 저장하기'}</button>
                  </form>
                  {activeNotice && <div className="pt-3 border-t border-white/10"><button onClick={handleDeactivateAllNotices} disabled={noticeLoading} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#EC4899] text-xs font-semibold rounded-lg cursor-pointer">현재 메인 배너 송출 중단</button></div>}
                </div>
                <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="font-bold text-white text-sm">공지 문구 라이브러리</h4></div><span className="text-xs font-mono text-[#8B5CF6] font-bold">{noticeList.length}개 보관 중</span></div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {noticeList.map((n) => (
                      <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.isActive ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'bg-[#0B1120] border-white/10'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2"><div className="flex items-center gap-2">{n.isActive ? <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#38BDF8] text-[#0B1120] rounded flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" />송출 중</span> : <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-slate-400 rounded">보관 중</span>}<h5 className="font-bold text-white text-xs">{n.title}</h5></div><span className="text-[10px] text-slate-500 font-mono">{n.updatedAt}</span></div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-[#0B1120] p-3 rounded-lg border border-white/5">{n.content}</p>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setInputNoticeTitle(n.title); setInputNoticeContent(n.content); setEditingNoticeId(n.id); }} className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] rounded font-semibold cursor-pointer flex items-center gap-1"><Edit2 className="w-3 h-3" />불러오기</button>
                          <button onClick={() => handleDeleteNotice(n.id)} className="p-1 text-slate-500 hover:text-[#EC4899] cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                          {!n.isActive && <button onClick={() => handleActivateNotice(n)} disabled={noticeLoading} className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-bold rounded cursor-pointer flex items-center gap-1 shadow-md border-0"><Send className="w-3 h-3" />메인 송출</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === 'members' && (
              <div className="glass-card p-6 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <input type="text" placeholder="이름 / 전화번호 / 이메일 검색..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="px-3 py-2 rounded-lg text-xs w-full sm:max-w-xs" />
                  <div className="flex items-center gap-2"><button onClick={() => setShowScoutOnly(!showScoutOnly)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${showScoutOnly ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] border-0' : 'bg-[#0B1120] text-slate-400 border border-white/10 hover:border-amber-500/50'}`}><Award className="w-4 h-4" /> 🏆 에이스 기사만 보기</button></div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0B1120] text-slate-400 border-b border-white/10"><tr><th className="p-3">이름/연락처</th><th className="p-3 text-center">당월 실적 (건수 / 매출)</th><th className="p-3 text-center">최근 접속 / 누적</th><th className="p-3 text-center">권한 변경</th><th className="p-3 text-right">CS 열람 및 개인분석</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {displayedMembers.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-500">검색 조건에 맞는 기사님이 없습니다.</td></tr> : displayedMembers.map((m) => {
                        const isAce = (m.monthlyGross || 0) >= 1500000 || (m.recordCount || 0) >= 10;
                        return (
                          <tr key={m.id} className={`transition-all ${isAce ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-white/5'}`}>
                            <td className="p-3"><div className="text-white font-bold flex items-center gap-1.5">{m.name || '미입력'} {isAce && <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] rounded font-extrabold shadow-sm">🏆 에이스</span>}</div><div className="font-mono text-[#38BDF8] text-[11px] mt-1">{formatPhoneNumber(m.phone) || '번호없음'}</div></td>
                            <td className="p-3 text-center"><div className="font-bold text-white">{m.recordCount}건</div><div className="text-[#EC4899] font-semibold mt-1">{(m.monthlyGross || 0).toLocaleString()}원</div></td>
                            <td className="p-3 text-center"><div className="text-[#38BDF8] font-mono text-[11px]">{m.lastLoginAt}</div><div className="text-slate-400 font-bold mt-1">{m.loginCount}회 접속</div></td>
                            <td className="p-3 text-center"><select value={m.role} onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)} className="bg-[#0B1120] border border-white/20 text-white rounded px-2 py-1.5 text-[11px] cursor-pointer outline-none focus:border-[#8B5CF6]"><option value="user">일반 기사</option><option value="pro_driver">PRO 기사</option><option value="vip_driver">VIP 기사 (스카우트)</option><option value="manager">운영 직원</option><option value="super_admin">최고 관리자</option></select></td>
                            <td className="p-3 text-right"><button onClick={() => openAdminUserDetail(m)} className="px-2.5 py-1.5 hp-primary-btn hover:bg-white/20 text-white rounded text-[10px] font-bold flex items-center gap-1 ml-auto cursor-pointer"><Search className="w-3 h-3" />상세 리포트</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {adminSubTab === 'analytics' && (
              <div className="space-y-4">
                <div className="flex justify-end mb-2"><button onClick={handleExportAdminCSV} className="px-3 py-2 bg-[#0B1120] hover:bg-white/10 border border-white/20 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />전체 기사 운행내역 CSV 다운로드</button></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">플랫폼 총 가입 기사</span><div className="text-2xl font-bold text-white mt-1">{adminMemberList.length}명</div></div>
                  <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">누적 접속 횟수</span><div className="text-2xl font-bold text-[#8B5CF6] mt-1">{adminMemberList.reduce((acc, m) => acc + (m.loginCount || 0), 0)}회</div></div>
                  <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">누적 등록 운행 건수</span><div className="text-2xl font-bold text-[#38BDF8] mt-1">{adminAllRecords.length}건</div></div>
                  <div className="glass-card p-5 rounded-xl"><span className="text-xs text-slate-400">총 대납 주유비 발생액</span><div className="text-2xl font-bold text-[#EC4899] mt-1">{adminAllRecords.reduce((acc, cur) => acc + cur.fuelAmount, 0).toLocaleString()}원</div></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                  <div className="glass-card p-5 rounded-xl border-t-2 border-t-[#EC4899]">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#EC4899]" /> 플랫폼 누적 도착지 랭킹 (핫플레이스 Top 5)</h3>
                    <div className="space-y-2">
                      {getTopDestinations().map(([dest, count], idx) => (
                        <div key={dest} className="flex justify-between items-center bg-[#0B1120] p-3 rounded-lg border border-white/5"><span className="text-xs font-bold text-white"><span className="text-slate-500 mr-2">{idx + 1}위</span> {dest}</span><span className="text-[#38BDF8] font-mono text-xs font-bold">{count}건 도착</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card p-5 rounded-xl border-t-2 border-t-amber-500">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> 당월 최고 매출 기사 (리더보드 Top 5)</h3>
                    <div className="space-y-2">
                      {getTopEarners().map((m, idx) => (
                        <div key={m.id} className="flex justify-between items-center bg-[#0B1120] p-3 rounded-lg border border-white/5"><div className="flex items-center gap-2"><span className="text-slate-500 text-xs">{idx + 1}위</span><span className="text-xs font-bold text-white">{m.name || '미상'} 기사님</span></div><span className="text-amber-500 font-mono text-xs font-bold">{(m.monthlyGross || 0).toLocaleString()}원</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setImportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-[#10B981] mb-2 flex items-center gap-2"><Download className="w-5 h-5" /> 엑셀/CSV 과거 장부 이관 (원터치 환승)</h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">경쟁 앱(대리가계부 등)에서 추출한 엑셀 파일을 올리시면 JunDriver 양식으로 자동 변환되어 들어옵니다.</p>
            {importStep === 1 ? (
              <div className="border-2 border-dashed border-white/20 rounded-xl p-10 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative cursor-pointer">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <FileText className="w-10 h-10 text-slate-400 mb-3" />
                <div className="text-sm font-bold text-white mb-1">여기를 터치하여 엑셀 파일을 선택하세요</div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex justify-between items-center mb-3"><span className="text-xs font-bold text-white">자동 인식된 데이터 미리보기</span><span className="text-[11px] font-bold text-[#10B981] px-2 py-0.5 bg-[#10B981]/10 rounded">총 {importData.length}건 인식성공</span></div>
                <div className="overflow-y-auto bg-[#0B1120] border border-white/10 rounded-lg p-3 space-y-2 flex-1 scrollbar-hide mb-4">
                  {importData.slice(0, 10).map((d, i) => (
                    <div key={i} className="flex justify-between text-[11px] border-b border-white/5 pb-2"><span className="text-slate-400">{d.date}</span><span className="text-white font-semibold truncate max-w-[150px]">{d.departure} → {d.destination}</span><span className="text-[#38BDF8] font-bold">{d.grossAmount.toLocaleString()}원</span></div>
                  ))}
                </div>
                <button onClick={handleBatchImport} disabled={isImporting} className="w-full py-3 bg-gradient-to-r from-[#10B981] to-emerald-600 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] text-white font-bold rounded-lg text-xs cursor-pointer transition-all border-0">{isImporting ? '데이터를 이관하는 중...' : `${importData.length}건 일괄 등록하기`}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Edit2 className="w-4 h-4 text-[#8B5CF6]" /> 운행 내역 수정</h3><button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleUpdateRecord} className="space-y-3.5">
              <div><label className="block text-[11px] font-semibold text-[#38BDF8] mb-1">운행 일자 변경</label><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-3 py-2 rounded-lg" required /></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" value={editDeparture} onChange={(e) => setEditDeparture(e.target.value)} className="w-full px-3 py-2 rounded-lg" required /></div><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" value={editDestination} onChange={(e) => setEditDestination(e.target.value)} className="w-full px-3 py-2 rounded-lg" required /></div></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운임(원)</label><input type="text" value={editGross} onChange={(e) => setEditGross(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" required /></div>
              <div className="p-3.5 rounded-xl bg-[#0B1120] border border-white/20 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300">대납 주유비</label><input type="text" value={editFuel} onChange={(e) => setEditFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" />
                <div className="flex flex-row items-center gap-2 pt-1 mt-1">
                  <button type="button" onClick={() => setEditPaymentMethod('현금')} className={`flex-1 py-1.5 rounded-md border text-[11px] font-bold cursor-pointer transition-colors ${editPaymentMethod === '현금' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm' : 'bg-transparent text-slate-400 border-white/20 hover:border-white/40'}`}>현금 결제</button>
                  <button type="button" onClick={() => setEditPaymentMethod('카드')} className={`flex-1 py-1.5 rounded-md border text-[11px] font-bold cursor-pointer transition-colors ${editPaymentMethod === '카드' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm' : 'bg-transparent text-slate-400 border-white/20 hover:border-white/40'}`}>카드 결제</button>
                </div>
              </div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">기사 팁</label><input type="text" value={editTip} onChange={(e) => setEditTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2 rounded-lg text-right" /></div>
              <button type="submit" className="w-full mt-2 py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">수정 완료</button>
            </form>
          </div>
        </div>
      )}

      {adminSelectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-card rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setAdminSelectedUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-[#38BDF8] mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> {adminSelectedUser.name || '미상'} 기사님 상세 리포트</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#0B1120] p-3 rounded-lg border border-white/10 text-center"><div className="text-[10px] text-slate-400 mb-1">총 누적 운행</div><div className="font-bold text-white">{adminSelectedUser.recordCount}건</div></div>
              <div className="bg-[#0B1120] p-3 rounded-lg border border-white/10 text-center"><div className="text-[10px] text-slate-400 mb-1">당월 매출</div><div className="font-bold text-[#8B5CF6]">{(adminSelectedUser.monthlyGross || 0).toLocaleString()}원</div></div>
              <div className="bg-[#0B1120] p-3 rounded-lg border border-white/10 text-center col-span-2 md:col-span-2 flex flex-col justify-center"><div className="text-[10px] text-slate-400 mb-1">연락처 / 가입일</div><div className="font-mono text-[#38BDF8] text-xs">{formatPhoneNumber(adminSelectedUser.phone) || '번호없음'} <span className="text-slate-500 mx-1">|</span> {adminSelectedUser.createdAt}</div></div>
            </div>
            <div className="overflow-y-auto pr-2 space-y-4 flex-1 scrollbar-hide">
              <div>
                <h4 className="text-xs font-bold text-white border-b border-white/10 pb-2 mb-2">최근 운행 내역 (최대 10건)</h4>
                {adminSelectedUserRecords.map((r) => {
                  const totalClaim = r.grossAmount + r.fuelAmount + r.extraExpenseAmount;
                  const unpaid = (!r.isGrossPaid ? r.grossAmount : 0) + (!r.isExpensePaid ? (r.fuelAmount + r.extraExpenseAmount) : 0);
                  return (
                    <div key={r.id} className="bg-[#0B1120] border border-white/10 p-3 rounded-lg text-xs mb-2">
                      <div className="flex justify-between text-slate-400 mb-1"><span>{r.date}</span><span className={unpaid > 0 ? 'text-[#EC4899] font-bold' : 'text-emerald-400 font-bold'}>{unpaid > 0 ? `미수금 ${unpaid.toLocaleString()}원` : '전액 정산완료'}</span></div>
                      <div className="font-bold text-white mb-1.5">{r.departure} → {r.destination}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setAdminSelectedUser(null)} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer">닫기</button>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative z-20">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><User className="w-4 h-4 text-[#8B5CF6]" />기사 프로필 및 계정 관리</h3>
            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-3.5 space-y-2 mb-5">
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">기사 성함</span><span className="text-white font-bold">{currentUserProfile?.name || session?.user?.user_metadata?.name || '미상'}</span></div>
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">연락처</span><span className="text-[#38BDF8] font-mono font-semibold">{formatPhoneNumber(currentUserProfile?.phone || session?.user?.user_metadata?.phone || '') || '미등록'}</span></div>
            </div>
            <button onClick={() => setShowProfileModal(false)} className="w-full py-2.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
