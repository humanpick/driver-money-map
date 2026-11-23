import React, { useState, useEffect, useRef } from 'react';
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

const APP_VERSION = '1.0.12';
const ADMIN_DEFAULT_EMAIL = 'beat4989@naver.com';
const ADMIN_DEFAULT_NAME = '김탁송';
const ADMIN_DEFAULT_PHONE = '01091417586';
const KAKAO_CHAT_URL = 'https://open.kakao.com/o/gshehyWi';

const PLATFORMS = [
  { name: '로지', defaultFee: '20' },
  { name: '아이콘', defaultFee: '20' },
  { name: '오픈마일', defaultFee: '20' },
  { name: '카카오T', defaultFee: '20' },
  { name: '티맵', defaultFee: '20' },
  { name: '기타어플', defaultFee: '20' },
];

const EXPENSE_PLATFORMS = ['공통', ...PLATFORMS.map(p => p.name)];

const getTodayKST = () => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split('T')[0];
};

const getPrevMonthPrefix = (monthPrefix: string) => {
  const [y, m] = monthPrefix.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getDayOfWeekKor = (dateStr: string) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const [y, m, d] = dateStr.split('-').map(Number);
  return days[new Date(y, m - 1, d).getDay()];
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

// 구버전 캐시 완전 삭제 후 강제 새로고침
const forceClearAndReload = async () => {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } catch (e) {}
  window.location.reload();
};

interface DrivingRecord {
  id: string; userId?: string; date: string; startTime: string; endTime: string;
  departure: string; destination: string; grossAmount: number; feeRate: number;
  fuelAmount: number; extraExpenseAmount: number; tipAmount: number;
  isGrossPaid: boolean; isExpensePaid: boolean;
  netAmount: number; totalClaimAmount: number;
  paymentMethod?: '현금' | '카드';
  platform?: string;
  memo?: string;
  claimSentAt?: string;
  paidAt?: string;
}
interface ExpenseRecord { id: string; date: string; category: string; amount: number; memo: string; platform?: string; }
interface BankAccount { id: string; bankName: string; accountNumber: string; holder: string; }
interface MemberProfile {
  id: string; email: string; name: string; phone: string; role: string; createdAt: string;
  lastLoginAt?: string; loginCount?: number; recordCount?: number; monthlyGross?: number;
  lastMonthGross?: number; recoveredAmount?: number; recoveredCount?: number;
  joinType?: 'group' | 'referral'; kakaoId?: string; referrer?: string;
  approvalStatus?: 'pending' | 'approved'; marketingAgreed?: boolean;
}
interface NoticeItem { id: string; title: string; content: string; isActive: boolean; updatedAt?: string; }
interface MonthlyFixed { id: string; memo: string; amount: number; platform?: string; }

const TRADE_CENTERS = [
  { id: '1', name: '수원 도이치오토월드', tier: 'S', region: '수도권', addr: '경기 수원시 권선구 권선로 308-5', desc: '전국 최대 실내 복합단지.' },
  { id: '2', name: '수원 SK V1 모터스', tier: 'S', region: '수도권', addr: '경기 수원시 권선구 평동로79번길 45', desc: '도이치오토월드 옆.' },
  { id: '3', name: '인천 엠파크 (허브/타워)', tier: 'S', region: '수도권', addr: '인천 서구 봉수대로 158', desc: '인천 권역 최대 메가 허브.' },
  { id: '4', name: '용인 오토허브', tier: 'S', region: '수도권', addr: '경기 용인시 기흥구 중부대로 242', desc: '경부 신갈IC 인근 초대형 복합단지.' },
  { id: '5', name: '부천 KB차차차 (국민차매매단지)', tier: 'S', region: '수도권', addr: '경기 부천시 오정구 송내대로 450', desc: '부천/인천 권역 핵심 단지.' },
  { id: '6', name: '서울 서서울모터리움', tier: 'A', region: '수도권', addr: '서울 강서구 양천로53길 30', desc: '서울 서부권 최대 실내 단지.' },
  { id: '7', name: '서울 가양 오토플렉스', tier: 'A', region: '수도권', addr: '서울 강서구 양천로 390', desc: '가양동 중고차 매매 중심지.' },
  { id: '8', name: '서울 장한평 중고차매매시장', tier: 'A', region: '수도권', addr: '서울 성동구 자동차시장1길 94', desc: '대한민국 중고차 시장의 원조.' },
  { id: '9', name: '김포 국민차매매단지', tier: 'A', region: '수도권', addr: '경기 김포시 고촌읍 아라육로152번길 45', desc: '수도권 서북부 대형 실내.' },
  { id: '10', name: '부산 경동오토필드', tier: 'A', region: '영남권', addr: '부산 기장군 장안읍 반룡산단3로 95', desc: '영남권 최대 규모.' },
  { id: '11', name: '대구 엠월드', tier: 'A', region: '영남권', addr: '대구 서구 문화로 37', desc: '대구 경북 권역 최대 실내 단지.' },
  { id: '12', name: '부산 사직오토랜드', tier: 'A', region: '영남권', addr: '부산 연제구 경기장로 15', desc: '전통의 부산 대표 단지.' },
  { id: '13', name: '창원 디오오토갤러리', tier: 'B', region: '영남권', addr: '경남 창원시 마산회원구 무역로 21', desc: '경남권 핵심 매매단지.' },
  { id: '14', name: '대전 디오토몰', tier: 'A', region: '충청권', addr: '대전 유성구 복용동로 35', desc: '충청권 최대 실내 복합단지.' },
  { id: '15', name: '청주 오토월드', tier: 'B', region: '충청권', addr: '충북 청주시 청원구 2순환로 50', desc: '충북권 탁송 콜 다수 발생.' },
  { id: '16', name: '광주 엠플러스 (M Plus)', tier: 'A', region: '호남권', addr: '광주 서구 매월1로62번길 16', desc: '호남권 최대 프리미엄 실내 단지.' },
  { id: '17', name: '광주 풍암매매단지', tier: 'A', region: '호남권', addr: '광주 서구 송암로 73', desc: '호남권 전통의 중고차 중심지.' },
  { id: '18', name: '전주 월드컵매매단지', tier: 'B', region: '호남권', addr: '전북 전주시 덕진구 온고을로 860', desc: '전북권 핵심 거점.' }
];

// 고정 탁송 경매일 데이터 (시/도 포함 정확한 지도 검색용 주소 반영)
const AUCTION_SCHEDULES = [
  { day: '월요일', hex: '#38BDF8', locations: [
    { name: '안성 롯데렌탈', tier: 'S', addr: '경기도 안성시 공도읍 내가천리 12', tag: '롯데' },
    { name: '광혜원 오토보이', tier: 'B', addr: '충북 진천군 광혜원면 금천길 37', tag: '오토보이' }
  ] },
  { day: '화요일', hex: '#EC4899', locations: [
    { name: '분당 현대글로비스', tier: 'S', addr: '경기도 광주시 능평로 167', tag: '글로비스' },
    { name: '부강 케이카', tier: 'A', addr: '세종특별자치시 부강면 문곡리 산 249', tag: '케이카' },
    { name: '시화 현대글로비스', tier: 'S', addr: '경기도 시흥시 정왕천로 271', tag: '글로비스' },
    { name: '천안 구성동 sk경매장', tier: 'B', addr: '충남 천안시 동남구 구성동', tag: 'SK' }
  ] },
  { day: '수요일', hex: '#10B981', locations: [
    { name: '안성오토허브 (구)aj옥션셀카옥션', tier: 'S', addr: '경기도 안성시 원곡면 문터길 60', tag: '오토허브' }
  ] },
  { day: '목요일', hex: '#F59E0B', locations: [
    { name: '오산 케이카', tier: 'A', addr: '경기도 오산시 은계동 7-30', tag: '케이카' },
    { name: '양산 현대글로비스', tier: 'S', addr: '경남 양산시 산막동 572-1', tag: '글로비스' },
    { name: '광혜원 오토보이', tier: 'B', addr: '충북 진천군 광혜원면 금천길 37', tag: '오토보이' },
    { name: '인천 현대글로비스', tier: 'S', addr: '인천광역시 서구 가좌동 173-203', tag: '글로비스' }
  ] },
  { day: '금요일', hex: '#8B5CF6', locations: [
    { name: '시화 현대글로비스', tier: 'S', addr: '경기도 시흥시 정왕천로 271', tag: '글로비스' },
    { name: '분당 현대글로비스', tier: 'S', addr: '경기도 광주시 능평로 167', tag: '글로비스' }
  ] }
];

const calcRecoveredForRecord = (r: { claimSentAt?: string; isGrossPaid: boolean; isExpensePaid: boolean; grossAmount: number; fuelAmount: number; extraExpenseAmount: number }) => {
  if (!r.claimSentAt) return 0;
  return (r.isGrossPaid ? r.grossAmount : 0) + (r.isExpensePaid ? (r.fuelAmount + r.extraExpenseAmount) : 0);
};

export default function App() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({ onRegistered(r) {}, onRegisterError(error) {} });
  useEffect(() => { if (needRefresh) updateServiceWorker(true); }, [needRefresh, updateServiceWorker]);

  const forceUpdateChannelRef = useRef<any>(null);

  // [강제 업데이트 1번 + 무한 새로고침 방지 안전장치] version.json 자동 감지
  useEffect(() => {
    const checkServerVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const serverVersion = data?.version;
        if (!serverVersion) return;

        if (serverVersion === APP_VERSION) {
          sessionStorage.removeItem('app_reloaded_version');
          return;
        }

        const lastAttempted = sessionStorage.getItem('app_reloaded_version');
        if (lastAttempted === serverVersion) return;

        sessionStorage.setItem('app_reloaded_version', serverVersion);
        await forceClearAndReload();
      } catch (e) {}
    };

    checkServerVersion();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkServerVersion();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // [강제 업데이트 2번] 관제탑 실시간 강제 새로고침 신호 수신
  useEffect(() => {
    const channel = supabase
      .channel('app-force-update')
      .on('broadcast', { event: 'force-reload' }, () => {
        sessionStorage.removeItem('app_reloaded_version');
        forceClearAndReload();
      })
      .subscribe();
    forceUpdateChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleBroadcastForceUpdate = async () => {
    if (!window.confirm('현재 앱을 사용 중인 모든 기사님의 화면을 강제로 새로고침(최신 버전 적용) 하시겠습니까?')) return;
    if (forceUpdateChannelRef.current) {
      await forceUpdateChannelRef.current.send({
        type: 'broadcast',
        event: 'force-reload',
        payload: { version: APP_VERSION, at: Date.now() },
      });
      alert('전체 기사님께 강제 업데이트 신호를 전송했습니다.');
    }
  };

  const [session, setSession] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [currentUserProfile, setCurrentUserProfile] = useState<MemberProfile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); const [passwordConfirm, setPasswordConfirm] = useState('');
  const [kakaoId, setKakaoId] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false); const [authError, setAuthError] = useState(''); const [authSuccess, setAuthSuccess] = useState('');
  const [honeypot, setHoneypot] = useState(''); const [captchaVerified, setCaptchaVerified] = useState(false);

  const [celebrationAlert, setCelebrationAlert] = useState<{ type: 'recovery' | 'growth'; title: string; message: string } | null>(null);

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
  const [adminSelectedUser, setAdminSelectedUser] = useState<MemberProfile | null>(null);
  const [adminSelectedUserRecords, setAdminSelectedUserRecords] = useState<DrivingRecord[]>([]);

  const [editingRecord, setEditingRecord] = useState<DrivingRecord | null>(null);
  const [actionRecordId, setActionRecordId] = useState<string | null>(null);
  
  const [editDate, setEditDate] = useState('');
  const [editPlatform, setEditPlatform] = useState('로지');
  const [editFeeRate, setEditFeeRate] = useState('20');
  const [editDeparture, setEditDeparture] = useState(''); const [editDestination, setEditDestination] = useState('');
  const [editGross, setEditGross] = useState(''); const [editFuel, setEditFuel] = useState('');
  const [editExtra, setEditExtra] = useState(''); const [editTip, setEditTip] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'현금' | '카드'>('현금');

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedClaimRecord, setSelectedClaimRecord] = useState<DrivingRecord | null>(null);
  const [includeGross, setIncludeGross] = useState(true); const [includeFuel, setIncludeFuel] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true); const [claimMessageText, setClaimMessageText] = useState('');
  
  const [records, setRecords] = useState<DrivingRecord[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [lastDeletedRecords, setLastDeletedRecords] = useState<DrivingRecord[]>([]);
  const [visibleClaimCount, setVisibleClaimCount] = useState<number>(30);

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
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const [newDate, setNewDate] = useState<string>(() => getTodayKST());
  const [newPlatform, setNewPlatform] = useState<string>('로지');
  const [newStartTime, setNewStartTime] = useState(''); const [newEndTime, setNewEndTime] = useState('');
  const [newDeparture, setNewDeparture] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newGross, setNewGross] = useState('');
  const [newFeeRate, setNewFeeRate] = useState('20');
  const [newFuel, setNewFuel] = useState(''); const [newExtraExpense, setNewExtraExpense] = useState(''); const [newTip, setNewTip] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'현금' | '카드'>('현금');
  
  const [expCategory, setExpCategory] = useState('대중교통'); const [expPlatform, setExpPlatform] = useState('공통');
  const [expAmount, setExpAmount] = useState(''); const [expMemo, setExpMemo] = useState('');
  const [bankName, setBankName] = useState(''); const [accountNumber, setAccountNumber] = useState(''); const [holder, setHolder] = useState('');

  const [targetIncome, setTargetIncome] = useState<string>(() => {
    try { const s = localStorage.getItem('jundriver_target_v2'); if (s) { const parsed = JSON.parse(s); return parsed.income ? String(parsed.income) : '5,000,000'; } } catch (e) {}
    return '5,000,000';
  });
  const [targetDays, setTargetDays] = useState<string>(() => {
    try { const s = localStorage.getItem('jundriver_target_v2'); if (s) { const parsed = JSON.parse(s); return parsed.days ? String(parsed.days) : '25'; } } catch (e) {}
    return '25';
  });

  const [monthlyFixedItems, setMonthlyFixedItems] = useState<MonthlyFixed[]>(() => {
    try { const s = localStorage.getItem('jundriver_monthly_fixed_v1'); if (s) { const parsed = JSON.parse(s); if (Array.isArray(parsed)) return parsed; } } catch (e) {}
    return [];
  });
  const [newMonthlyMemo, setNewMonthlyMemo] = useState('');
  const [newMonthlyAmount, setNewMonthlyAmount] = useState('');
  const [newMonthlyPlatform, setNewMonthlyPlatform] = useState('공통');

  const cloudSettingsLoadedRef = useRef(false);

  const syncUserSettingsToCloud = async (userId: string, partial: {
    bank_accounts?: BankAccount[];
    target_settings?: { income: string; days: string };
    monthly_fixed_items?: MonthlyFixed[];
  }) => {
    if (!userId) return;
    await supabase.from('profiles').update(partial).eq('id', userId);
  };

  useEffect(() => { localStorage.setItem('jundriver_accounts_v2', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('jundriver_monthly_fixed_v1', JSON.stringify(monthlyFixedItems)); }, [monthlyFixedItems]);

  useEffect(() => {
    localStorage.setItem('jundriver_target_v2', JSON.stringify({ income: targetIncome, days: targetDays }));
    if (!session?.user?.id || !cloudSettingsLoadedRef.current) return;
    const timer = setTimeout(() => {
      syncUserSettingsToCloud(session.user.id, { target_settings: { income: targetIncome, days: targetDays } });
    }, 600);
    return () => clearTimeout(timer);
  }, [targetIncome, targetDays, session]);

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

    const resolvedApproval: 'pending' | 'approved' =
      role === 'super_admin' || role === 'manager'
        ? 'approved'
        : (profile?.approval_status || userMeta?.approval_status || 'approved');

    if (profile) {
      if (Array.isArray(profile.bank_accounts) && profile.bank_accounts.length > 0) {
        setAccounts(profile.bank_accounts);
      }
      if (profile.target_settings && typeof profile.target_settings === 'object') {
        if (profile.target_settings.income) setTargetIncome(String(profile.target_settings.income));
        if (profile.target_settings.days) setTargetDays(String(profile.target_settings.days));
      }
      if (Array.isArray(profile.monthly_fixed_items)) {
        setMonthlyFixedItems(profile.monthly_fixed_items);
      }
    }
    cloudSettingsLoadedRef.current = true;

    const currentCount = profile?.login_count || 0;
    const nowIso = new Date().toISOString();
    const profilePayload: any = {
      id: userId, email: cleanMail, name: profile?.name || metaName, phone: profile?.phone || metaPhone,
      role: role, created_at: profile?.created_at || userCreatedAt || nowIso,
      last_login_at: nowIso, login_count: currentCount + 1,
      join_type: profile?.join_type || userMeta?.join_type || 'group',
      kakao_id: profile?.kakao_id ?? userMeta?.kakao_id ?? '',
      referrer: profile?.referrer ?? userMeta?.referrer ?? '',
      approval_status: resolvedApproval,
      marketing_agreed: profile?.marketing_agreed ?? Boolean(userMeta?.marketing_agreed),
    };

    const { error: upsertErr } = await supabase.from('profiles').upsert(profilePayload);
    if (upsertErr && (upsertErr.message.includes('approval_status') || upsertErr.message.includes('join_type'))) {
      const fb = { id: profilePayload.id, email: profilePayload.email, name: profilePayload.name, phone: profilePayload.phone, role: profilePayload.role, created_at: profilePayload.created_at, last_login_at: profilePayload.last_login_at, login_count: profilePayload.login_count };
      await supabase.from('profiles').upsert(fb);
    }

    setCurrentUserProfile({
      id: userId, email: cleanMail, name: profilePayload.name, phone: profilePayload.phone, role: profilePayload.role,
      createdAt: (profilePayload.created_at || '').substring(0, 10),
      lastLoginAt: profilePayload.last_login_at, loginCount: profilePayload.login_count,
      joinType: profilePayload.join_type, kakaoId: profilePayload.kakao_id, referrer: profilePayload.referrer,
      approvalStatus: resolvedApproval, marketingAgreed: profilePayload.marketing_agreed,
    });

    if (resolvedApproval === 'pending') return;

    const { data: recordsData } = await supabase.from('driving_records').select('*').eq('user_id', userId).order('date', { ascending: true });
    if (recordsData) {
      setRecords(recordsData.map((r: any) => ({
        id: r.id, date: r.date || '-', startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
        grossAmount: Number(r.gross_amount), feeRate: Number(r.fee_rate), fuelAmount: Number(r.fuel_amount), extraExpenseAmount: Number(r.extra_expense_amount),
        tipAmount: Number(r.tip_amount), isGrossPaid: Boolean(r.is_gross_paid), isExpensePaid: Boolean(r.is_expense_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount),
        paymentMethod: r.payment_method || '현금',
        platform: r.platform || '미지정',
        memo: r.memo || '',
        claimSentAt: r.claim_sent_at || undefined,
        paidAt: r.paid_at || undefined,
      })));
    }

    const { data: expensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: true });
    if (expensesData) setExpenses(expensesData.map((e: any) => ({ id: e.id, date: e.date || '-', category: e.category, amount: Number(e.amount), memo: e.memo || '', platform: e.platform || '공통' })));
    
    if (role === 'super_admin' || role === 'manager') fetchAdminData();
  };

  const fetchAdminData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('last_login_at', { ascending: false });
    const { data: allRecs } = await supabase.from('driving_records').select('*').limit(20000);
    const currentMonthStr = getTodayKST().substring(0, 7);
    const lastMonthStr = getPrevMonthPrefix(currentMonthStr);
    
    if (profiles && allRecs) {
      const formattedRecs: DrivingRecord[] = allRecs.map((r: any) => ({
        id: r.id, userId: r.user_id, date: r.date || '-', startTime: r.start_time || '-', endTime: r.end_time || '-', departure: r.departure, destination: r.destination,
        grossAmount: Number(r.gross_amount), fuelAmount: Number(r.fuel_amount), feeRate: Number(r.fee_rate), extraExpenseAmount: Number(r.extra_expense_amount), tipAmount: Number(r.tip_amount), isGrossPaid: Boolean(r.is_gross_paid), isExpensePaid: Boolean(r.is_expense_paid), netAmount: Number(r.net_amount), totalClaimAmount: Number(r.total_claim_amount), paymentMethod: r.payment_method || '현금', platform: r.platform || '미지정', memo: r.memo || '',
        claimSentAt: r.claim_sent_at || undefined, paidAt: r.paid_at || undefined,
      }));
      setAdminAllRecords(formattedRecs);

      setAdminMemberList(profiles.map((p: any) => {
        const userRecords = formattedRecs.filter((r) => r.userId === p.id);
        const monthlyGross = userRecords.filter((r) => (r.date || '').startsWith(currentMonthStr)).reduce((sum, r) => sum + r.grossAmount, 0);
        const lastMonthGross = userRecords.filter((r) => (r.date || '').startsWith(lastMonthStr)).reduce((sum, r) => sum + r.grossAmount, 0);
        const recoveredRecs = userRecords.filter((r) => calcRecoveredForRecord(r) > 0);
        const recoveredAmount = recoveredRecs.reduce((sum, r) => sum + calcRecoveredForRecord(r), 0);
        return {
          id: p.id, email: p.email || '', name: p.name || '미상', phone: p.phone || '', role: p.role || 'user',
          createdAt: p.created_at ? p.created_at.substring(0, 10) : '-', lastLoginAt: p.last_login_at ? p.last_login_at.substring(0, 16).replace('T', ' ') : '기록없음',
          loginCount: p.login_count || 0, recordCount: userRecords.length, monthlyGross, lastMonthGross,
          recoveredAmount, recoveredCount: recoveredRecs.length,
          joinType: p.join_type || 'group', kakaoId: p.kakao_id || '', referrer: p.referrer || '',
          approvalStatus: p.approval_status || 'approved', marketingAgreed: Boolean(p.marketing_agreed),
        };
      }));
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
      else { cloudSettingsLoadedRef.current = false; setRecords([]); setExpenses([]); setCurrentUserRole('user'); setCurrentUserProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setAuthLoading(true); setAuthError(''); setAuthSuccess(''); const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password.trim() }); if (error) setAuthError('이메일 또는 비밀번호가 일치하지 않습니다.'); setAuthLoading(false); };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true); setAuthError(''); setAuthSuccess('');
    if (honeypot.trim() !== '') { setAuthLoading(false); return; }
    if (!captchaVerified) { setAuthError('보안 확인(인간 인증 체크)을 완료해 주세요.'); setAuthLoading(false); return; }
    const trimmedName = name.trim(); const cleanPhone = phone.replace(/[^0-9]/g, ''); const cleanEmail = email.trim().toLowerCase();
    const trimmedKakao = kakaoId.trim();
    if (!trimmedKakao) { setAuthError('단톡방 닉네임(아이디/생년/지역)을 톡방과 똑같이 입력해 주세요.'); setAuthLoading(false); return; }
    if (password.length < 6) { setAuthError('비밀번호는 최소 6자리 이상이어야 합니다.'); setAuthLoading(false); return; }
    if (password !== passwordConfirm) { setAuthError('비밀번호가 일치하지 않습니다.'); setAuthLoading(false); return; }
    if (!agreePrivacy) { setAuthError('[필수] 개인정보 수집 및 이용에 동의해 주세요.'); setAuthLoading(false); return; }
    if (!trimmedName || cleanPhone.length < 10) { setAuthError('이름과 휴대폰 번호를 정확히 입력해 주세요.'); setAuthLoading(false); return; }

    // 전화번호 중복 가입 차단 (승인 대기 및 기존 가입 번호 모두 차단)
    const { data: phoneExists, error: phoneCheckErr } = await supabase.rpc('check_phone_exists', {
      p_phone: cleanPhone,
    });
    if (!phoneCheckErr && phoneExists) {
      setAuthError('이미 가입되어 있거나 승인 대기 중인 휴대폰 번호입니다.');
      setAuthLoading(false);
      return;
    }

    const nowIso = new Date().toISOString();
    const initialApproval = cleanEmail === ADMIN_DEFAULT_EMAIL ? 'approved' : 'pending';
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password.trim(),
      options: {
        data: {
          name: trimmedName, phone: cleanPhone, privacy_policy_agreed: true,
          marketing_agreed: agreeMarketing, join_type: 'group',
          kakao_id: trimmedKakao,
          referrer: '',
          approval_status: initialApproval, created_at: nowIso
        }
      }
    });
    if (error) {
      setAuthError('가입 실패: ' + error.message);
    } else {
      if (data.user) {
        const profileData: any = {
          id: data.user.id, email: cleanEmail, name: trimmedName, phone: cleanPhone,
          role: cleanEmail === ADMIN_DEFAULT_EMAIL ? 'super_admin' : 'user',
          created_at: nowIso, last_login_at: nowIso, login_count: 1,
          join_type: 'group', kakao_id: trimmedKakao,
          referrer: '',
          approval_status: initialApproval, marketing_agreed: agreeMarketing
        };
        const { error: profErr } = await supabase.from('profiles').upsert([profileData]);
        if (profErr && (profErr.message.includes('approval_status') || profErr.message.includes('join_type'))) {
          await supabase.from('profiles').upsert([{ id: data.user.id, email: cleanEmail, name: trimmedName, phone: cleanPhone, role: profileData.role, created_at: nowIso, last_login_at: nowIso, login_count: 1 }]);
        }
      }
      setAuthSuccess('회원가입 신청이 접수되었습니다. 로그인하시면 승인 상태를 확인하실 수 있습니다.');
      setAuthMode('login');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setShowProfileModal(false); setActiveTab('records'); };
  
  const handleSaveNoticeTemplate = async (e: React.FormEvent) => { e.preventDefault(); if (!inputNoticeTitle.trim() || !inputNoticeContent.trim()) return; setNoticeLoading(true); const targetId = editingNoticeId || `notice_${Date.now()}`; const { error } = await supabase.from('announcements').upsert({ id: targetId, title: inputNoticeTitle.trim(), content: inputNoticeContent.trim(), is_active: editingNoticeId ? (noticeList.find(n => n.id === editingNoticeId)?.isActive || false) : false, updated_at: new Date().toISOString() }); if (!error) { alert(editingNoticeId ? '수정되었습니다.' : '저장되었습니다.'); setInputNoticeTitle(''); setInputNoticeContent(''); setEditingNoticeId(null); fetchNotices(); } setNoticeLoading(false); };
  const handleActivateNotice = async (targetNotice: NoticeItem) => { setNoticeLoading(true); await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy'); const { error } = await supabase.from('announcements').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', targetNotice.id); if (!error) { alert('메인 배너로 활성화되었습니다.'); fetchNotices(); } setNoticeLoading(false); };
  const handleDeactivateAllNotices = async () => { setNoticeLoading(true); const { error } = await supabase.from('announcements').update({ is_active: false }).neq('id', 'dummy'); if (!error) { alert('메인 배너 송출이 중단되었습니다.'); fetchNotices(); } setNoticeLoading(false); };
  const handleDeleteNotice = async (id: string) => { if (!window.confirm('삭제하시겠습니까?')) return; await supabase.from('announcements').delete().eq('id', id); fetchNotices(); };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!session) return;
    const gross = cleanNumber(newGross);
    const feeRate = newPlatform === '기타어플' ? cleanNumber(newFeeRate) : 20;
    const fuel = cleanNumber(newFuel);
    const extraExp = cleanNumber(newExtraExpense); const tip = cleanNumber(newTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + extraExp;
    const recordId = 'rec_' + Date.now().toString();
    const payload: any = { id: recordId, user_id: session.user.id, date: newDate, start_time: newStartTime || '-', end_time: newEndTime || '-', departure: newDeparture, destination: newDestination, gross_amount: gross, fee_rate: feeRate, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, is_gross_paid: false, is_expense_paid: false, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal), payment_method: newPaymentMethod, platform: newPlatform, memo: newMemo.trim() };
    const newRecord: DrivingRecord = { ...payload, startTime: payload.start_time, endTime: payload.end_time, grossAmount: gross, feeRate, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, isGrossPaid: false, isExpensePaid: false, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal), paymentMethod: newPaymentMethod, platform: newPlatform, memo: newMemo.trim() };
    
    let { error } = await supabase.from('driving_records').insert([payload]);
    if (error && (error.message.includes('payment_method') || error.message.includes('platform') || error.message.includes('memo'))) {
      const fb = { ...payload };
      if (error.message.includes('payment_method')) delete fb.payment_method;
      if (error.message.includes('platform')) delete fb.platform;
      if (error.message.includes('memo')) delete fb.memo;
      await supabase.from('driving_records').insert([fb]);
    }
    
    // 수익 마일스톤(100만 원 단위 돌파) 축하 알림 체크
    const recMonth = newDate.substring(0, 7);
    const prevMonthNet = records.filter(r => r.date.startsWith(recMonth)).reduce((s, r) => s + r.netAmount, 0);
    const nextMonthNet = prevMonthNet + Math.round(net);
    if (Math.floor(prevMonthNet / 1000000) < Math.floor(nextMonthNet / 1000000)) {
      const milestone = Math.floor(nextMonthNet / 1000000) * 100;
      setCelebrationAlert({
        type: 'growth',
        title: `🔥 ${recMonth.split('-')[1]}월 탁송 순수익 ${milestone.toLocaleString()}만 원 돌파!`,
        message: `현재 누적 순수익 ${nextMonthNet.toLocaleString()}원 달성! 안전운행으로 목표까지 화이팅하세요!`,
      });
    }

    const updated = [newRecord, ...records]; updated.sort((a, b) => a.date.localeCompare(b.date)); setRecords(updated);
    const [y, m] = newDate.split('-'); setCurrentCalDate(new Date(Number(y), Number(m) - 1, 1));
    setNewDeparture(''); setNewDestination(''); setNewGross(''); setNewFuel(''); setNewExtraExpense(''); setNewTip(''); setNewMemo(''); setNewPaymentMethod('현금');
  };

  const toggleGrossPaid = async (id: string) => {
    const target = records.find((r) => r.id === id); if (!target) return;
    const nextPaid = !target.isGrossPaid;
    const nowIso = new Date().toISOString();
    let { error } = await supabase.from('driving_records').update({ is_gross_paid: nextPaid, ...(nextPaid ? { paid_at: nowIso } : {}) }).eq('id', id);
    if (error && error.message.includes('paid_at')) {
      error = (await supabase.from('driving_records').update({ is_gross_paid: nextPaid }).eq('id', id)).error;
    }
    if (!error) {
      const nextRecords = records.map((r) => (r.id === id ? { ...r, isGrossPaid: nextPaid, paidAt: nextPaid ? nowIso : r.paidAt } : r));
      setRecords(nextRecords);
      if (nextPaid && target.claimSentAt && target.grossAmount > 0) {
        const totalRecovered = nextRecords.reduce((sum, r) => sum + calcRecoveredForRecord(r), 0);
        setCelebrationAlert({
          type: 'recovery',
          title: `🎉 탁송 운임 ${target.grossAmount.toLocaleString()}원 회수 완료!`,
          message: `지금까지 탁송대리비서 정산 문자로 총 ${totalRecovered.toLocaleString()}원의 미수금을 지켜냈습니다.`,
        });
      }
    }
  };

  const toggleExpensePaid = async (id: string) => {
    const target = records.find((r) => r.id === id); if (!target) return;
    const nextPaid = !target.isExpensePaid;
    const nowIso = new Date().toISOString();
    let { error } = await supabase.from('driving_records').update({ is_expense_paid: nextPaid, ...(nextPaid ? { paid_at: nowIso } : {}) }).eq('id', id);
    if (error && error.message.includes('paid_at')) {
      error = (await supabase.from('driving_records').update({ is_expense_paid: nextPaid }).eq('id', id)).error;
    }
    if (!error) {
      const nextRecords = records.map((r) => (r.id === id ? { ...r, isExpensePaid: nextPaid, paidAt: nextPaid ? nowIso : r.paidAt } : r));
      setRecords(nextRecords);
      const expAmt = target.fuelAmount + target.extraExpenseAmount;
      if (nextPaid && target.claimSentAt && expAmt > 0) {
        const totalRecovered = nextRecords.reduce((sum, r) => sum + calcRecoveredForRecord(r), 0);
        setCelebrationAlert({
          type: 'recovery',
          title: `🎉 대납 경비 ${expAmt.toLocaleString()}원 회수 완료!`,
          message: `지금까지 탁송대리비서 정산 문자로 총 ${totalRecovered.toLocaleString()}원의 미수금을 지켜냈습니다.`,
        });
      }
    }
  };

  const handleCopyClaimMessage = async () => {
    navigator.clipboard.writeText(claimMessageText);
    if (selectedClaimRecord) {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('driving_records').update({ claim_sent_at: nowIso }).eq('id', selectedClaimRecord.id);
      if (!error) {
        setRecords(prev => prev.map(r => r.id === selectedClaimRecord.id ? { ...r, claimSentAt: nowIso } : r));
      }
    }
    alert('정산 청구 문자가 복사되었습니다.\n입금이 완료되면 [입금 확인]을 눌러 회수 실적을 기록해 보세요!');
    setClaimModalOpen(false);
  };

  const handleOpenEditModal = (r: DrivingRecord) => {
    setEditingRecord(r); setEditDate(r.date); setEditPlatform(r.platform || '로지'); setEditFeeRate(String(r.feeRate ?? 20));
    setEditDeparture(r.departure); setEditDestination(r.destination); setEditGross(formatNumberWithComma(r.grossAmount));
    setEditFuel(formatNumberWithComma(r.fuelAmount)); setEditExtra(formatNumberWithComma(r.extraExpenseAmount));
    setEditTip(formatNumberWithComma(r.tipAmount)); setEditMemo(r.memo || ''); setEditPaymentMethod(r.paymentMethod || '현금');
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingRecord || !session) return;
    const gross = cleanNumber(editGross);
    const feeRate = editPlatform === '기타어플' ? cleanNumber(editFeeRate) : 20;
    const fuel = cleanNumber(editFuel); const extraExp = cleanNumber(editExtra); const tip = cleanNumber(editTip);
    const net = gross - (gross * (feeRate / 100)) + tip; const claimTotal = gross + fuel + extraExp;
    const payload: any = { date: editDate, platform: editPlatform, fee_rate: feeRate, departure: editDeparture, destination: editDestination, gross_amount: gross, fuel_amount: fuel, extra_expense_amount: extraExp, tip_amount: tip, net_amount: Math.round(net), total_claim_amount: Math.round(claimTotal), payment_method: editPaymentMethod, memo: editMemo.trim() };
    let { error } = await supabase.from('driving_records').update(payload).eq('id', editingRecord.id);
    if (error && (error.message.includes('payment_method') || error.message.includes('platform') || error.message.includes('memo'))) {
      const fb = { ...payload };
      if (error.message.includes('payment_method')) delete fb.payment_method;
      if (error.message.includes('platform')) delete fb.platform;
      if (error.message.includes('memo')) delete fb.memo;
      error = (await supabase.from('driving_records').update(fb).eq('id', editingRecord.id)).error;
    }
    if (!error) { const updatedList = records.map((r) => r.id === editingRecord.id ? { ...r, date: editDate, platform: editPlatform, feeRate, departure: editDeparture, destination: editDestination, grossAmount: gross, fuelAmount: fuel, extraExpenseAmount: extraExp, tipAmount: tip, netAmount: Math.round(net), totalClaimAmount: Math.round(claimTotal), paymentMethod: editPaymentMethod, memo: editMemo.trim() } : r); updatedList.sort((a, b) => a.date.localeCompare(b.date)); setRecords(updatedList); setEditingRecord(null); } else { alert('수정 실패'); }
  };

  const handleDeleteSingleRecord = async (id: string) => {
    if (!window.confirm('이 운행 기록을 삭제하시겠습니까? (삭제 직후 상단에서 복구 가능)')) return;
    const target = records.find(r => r.id === id);
    const { error } = await supabase.from('driving_records').delete().eq('id', id);
    if (!error) {
      setRecords(records.filter((r) => r.id !== id));
      if (target) setLastDeletedRecords([target]);
      setSelectedRecordIds(prev => prev.filter(rid => rid !== id));
    }
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
    const payloads = lastDeletedRecords.map(r => ({ id: r.id, user_id: session.user.id, date: r.date, start_time: r.startTime, end_time: r.endTime, departure: r.departure, destination: r.destination, gross_amount: r.grossAmount, fee_rate: r.feeRate, fuel_amount: r.fuelAmount, extra_expense_amount: r.extraExpenseAmount, tip_amount: r.tipAmount, is_gross_paid: r.isGrossPaid, is_expense_paid: r.isExpensePaid, net_amount: r.netAmount, total_claim_amount: r.totalClaimAmount, payment_method: r.paymentMethod || '현금', platform: r.platform || '미지정', memo: r.memo || '' }));
    const insertWithFallback = async (chunk: any[]) => {
      let res = await supabase.from('driving_records').insert(chunk);
      if (res.error && (res.error.message.includes('payment_method') || res.error.message.includes('platform') || res.error.message.includes('memo'))) {
        const fb = chunk.map(p => { const c = { ...p }; delete c.payment_method; delete c.platform; delete c.memo; return c; });
        res = await supabase.from('driving_records').insert(fb);
      }
      return res;
    };
    try {
      for (let i = 0; i < payloads.length; i += 50) { await insertWithFallback(payloads.slice(i, i + 50)); }
      const updated = [...records, ...lastDeletedRecords]; updated.sort((a, b) => a.date.localeCompare(b.date));
      setRecords(updated); setLastDeletedRecords([]); alert(`${lastDeletedRecords.length}건 복구 완료`);
    } catch (error: any) { alert('복구 실패: ' + error.message); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault(); const cleanAmt = cleanNumber(expAmount); if (!cleanAmt || !session) return;
    const expenseId = 'exp_' + Date.now().toString();
    const payload: any = { id: expenseId, user_id: session.user.id, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo, platform: expPlatform };
    let { error } = await supabase.from('expenses').insert([payload]);
    if (error && error.message.includes('platform')) {
      const fb = { ...payload }; delete fb.platform;
      error = (await supabase.from('expenses').insert([fb])).error;
    }
    if (!error) {
      const updatedExp = [{ id: expenseId, date: newDate, category: expCategory, amount: cleanAmt, memo: expMemo, platform: expPlatform }, ...expenses];
      updatedExp.sort((a, b) => a.date.localeCompare(b.date));
      setExpenses(updatedExp); setExpAmount(''); setExpMemo('');
    }
  };
  const handleDeleteExpense = async (id: string) => { await supabase.from('expenses').delete().eq('id', id); setExpenses(expenses.filter((e) => e.id !== id)); };
  
  const handleAddMonthlyFixedItem = () => {
    if (!newMonthlyMemo.trim() || !newMonthlyAmount) return; const amt = cleanNumber(newMonthlyAmount); if (amt <= 0) return;
    const nextItems = [...monthlyFixedItems, { id: Date.now().toString(), memo: newMonthlyMemo.trim(), amount: amt, platform: newMonthlyPlatform }];
    setMonthlyFixedItems(nextItems);
    if (session?.user?.id) syncUserSettingsToCloud(session.user.id, { monthly_fixed_items: nextItems });
    setNewMonthlyMemo(''); setNewMonthlyAmount('');
  };
  const handleDeleteMonthlyFixedItem = (id: string) => {
    const nextItems = monthlyFixedItems.filter(item => item.id !== id);
    setMonthlyFixedItems(nextItems);
    if (session?.user?.id) syncUserSettingsToCloud(session.user.id, { monthly_fixed_items: nextItems });
  };
  
  const handleApplyMonthlyFixedExpenses = async () => {
    if (!session) return;
    if (monthlyFixedItems.length === 0) { alert('등록된 월 고정비가 없습니다.'); return; }
    const totalAmt = monthlyFixedItems.reduce((acc, cur) => acc + cur.amount, 0);
    if (!window.confirm(`총 ${monthlyFixedItems.length}건의 월 고정비(합계 ${totalAmt.toLocaleString()}원)를 장부에 일괄 등록하시겠습니까?\n(등록일자: ${newDate})`)) return;
    try {
      const newExpenses = monthlyFixedItems.map((item, idx) => ({ id: `exp_mfixed_${Date.now()}_${idx}`, user_id: session.user.id, date: newDate, category: '고정비', amount: item.amount, memo: item.memo, platform: item.platform || '공통' }));
      let { error } = await supabase.from('expenses').insert(newExpenses);
      if (error && error.message.includes('platform')) {
        const fb = newExpenses.map(({ platform, ...rest }) => rest);
        error = (await supabase.from('expenses').insert(fb)).error;
      }
      if (error) throw error;
      const updatedExp = [...newExpenses.map(e => ({ ...e, id: e.id, date: e.date, category: e.category, amount: e.amount, memo: e.memo, platform: e.platform })), ...expenses];
      updatedExp.sort((a, b) => a.date.localeCompare(b.date)); setExpenses(updatedExp); alert('월 고정비가 장부에 일괄 등록되었습니다.');
    } catch (err: any) { alert('등록 실패: ' + err.message); }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault(); if (!bankName || !accountNumber) return;
    const nextAccounts = [...accounts, { id: Date.now().toString(), bankName, accountNumber, holder: holder || '김탁송' }];
    setAccounts(nextAccounts);
    if (session?.user?.id) syncUserSettingsToCloud(session.user.id, { bank_accounts: nextAccounts });
    setBankName(''); setAccountNumber(''); setHolder('');
  };
  const handleDeleteAccount = (id: string) => {
    const nextAccounts = accounts.filter(a => a.id !== id);
    setAccounts(nextAccounts);
    if (session?.user?.id) syncUserSettingsToCloud(session.user.id, { bank_accounts: nextAccounts });
  };
  const handleUpdateMemberRole = async (memberId: string, newRole: string) => { if (currentUserRole !== 'super_admin') return; await supabase.from('profiles').update({ role: newRole }).eq('id', memberId); fetchAdminData(); };
  const handleUpdateApprovalStatus = async (memberId: string, nextStatus: 'approved' | 'pending') => {
    if (!isAdminUser) return;
    const { error } = await supabase.from('profiles').update({ approval_status: nextStatus }).eq('id', memberId);
    if (error) { alert('승인 상태 변경 실패: ' + error.message); return; }
    fetchAdminData();
  };

  const handleExportMembersCSV = (targetType: 'all' | 'group' | 'referral') => {
    const filtered = adminMemberList.filter((m) => {
      if (targetType === 'group') return m.joinType !== 'referral';
      if (targetType === 'referral') return m.joinType === 'referral';
      return true;
    });
    if (filtered.length === 0) {
      alert('다운로드할 해당 구분의 회원이 없습니다.');
      return;
    }
    const esc = (val: string | number | undefined) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const roleLabel = (role: string) => {
      if (role === 'super_admin') return '최고관리자';
      if (role === 'manager') return '운영직원';
      if (role === 'vip_driver') return 'VIP기사';
      if (role === 'pro_driver') return 'PRO기사';
      return '일반기사';
    };
    const headers = ['가입구분', '단톡방닉네임', '추천인', '이름', '연락처', '이메일', '승인상태', '권한', '마케팅동의', '가입일', '최근접속', '접속횟수', '누적운행건수', '당월매출', '앱회수미수금'];
    const rows = filtered.map((m) => [
      m.joinType === 'referral' ? '지인추천' : '단톡방회원',
      esc(m.kakaoId || ''),
      esc(m.referrer || ''),
      esc(m.name || ''),
      esc(formatPhoneNumber(m.phone) || ''),
      esc(m.email || ''),
      m.approvalStatus === 'pending' ? '승인대기' : '승인완료',
      roleLabel(m.role),
      m.marketingAgreed ? '동의' : '미동의',
      m.createdAt || '-',
      m.lastLoginAt || '-',
      m.loginCount || 0,
      m.recordCount || 0,
      m.monthlyGross || 0,
      m.recoveredAmount || 0,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const labelMap = { all: '전체회원', group: '단톡방회원', referral: '지인추천회원' };
    link.download = `탁송대리비서_${labelMap[targetType]}_${getTodayKST()}.csv`;
    link.click();
  };

  const handleExportMyCSV = () => {
    if (records.length === 0) { alert('다운로드할 운행 내역이 없습니다.'); return; }
    const headers = ['프로그램', '일자', '출발지', '도착지', '운임', '수수료율', '주유비', '결제수단', '기타부대비용', '팁', '순수익', '운임입금', '대납입금', '기타사항'];
    const rows = records.map((r) => [r.platform || '미지정', r.date, `"${r.departure}"`, `"${r.destination}"`, r.grossAmount, `${r.feeRate}%`, r.fuelAmount, r.paymentMethod || '현금', r.extraExpenseAmount, r.tipAmount, r.netAmount, r.isGrossPaid ? '완료' : '미수금', r.isExpensePaid ? '완료' : '미수금', `"${(r.memo || '').replace(/"/g, '""')}"`]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `탁송대리비서_내운행장부_${getTodayKST()}.csv`; link.click();
  };

  const handleExportAdminCSV = () => { if (adminAllRecords.length === 0) return; const headers = ['프로그램', '일자', '출발지', '도착지', '운임', '수수료율', '주유비', '결제수단', '기타부대비용', '팁', '순수익', '운임입금', '대납입금', '기타사항']; const rows = adminAllRecords.map((r) => [r.platform || '미지정', r.date, `"${r.departure}"`, `"${r.destination}"`, r.grossAmount, `${r.feeRate}%`, r.fuelAmount, r.paymentMethod || '현금', r.extraExpenseAmount, r.tipAmount, r.netAmount, r.isGrossPaid ? '완료' : '미수금', r.isExpensePaid ? '완료' : '미수금', `"${(r.memo || '').replace(/"/g, '""')}"`]); const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `탁송대리비서_전체운행내역.csv`; link.click(); };

  const buildClaimText = (r: DrivingRecord, withGross: boolean, withFuel: boolean, withExtra: boolean) => {
    const pAcc = accounts[0] || { bankName: '은행', accountNumber: '계좌', holder: '예금주' }; const dPhone = formatPhoneNumber(currentUserProfile?.phone || session?.user?.user_metadata?.phone || ADMIN_DEFAULT_PHONE); const dName = currentUserProfile?.name || session?.user?.user_metadata?.name || ADMIN_DEFAULT_NAME;
    let total = 0; let iText = '';
    if (withGross) { total += r.grossAmount; iText += `* 탁송운임: ${r.grossAmount.toLocaleString()}원\n`; }
    if (withFuel && r.fuelAmount > 0) { total += r.fuelAmount; iText += `* 대납 주유비: ${r.fuelAmount.toLocaleString()}원\n`; }
    if (withExtra && r.extraExpenseAmount > 0) { total += r.extraExpenseAmount; iText += `* 기타 부대비용: ${r.extraExpenseAmount.toLocaleString()}원\n`; }
    return `[정산 요청]\n* 일자: ${r.date}\n* 구간: ${r.departure} → ${r.destination}\n${iText}-----------------\n* 총 청구금액: ${total.toLocaleString()}원\n* 계좌: ${pAcc.bankName} ${pAcc.accountNumber} (${pAcc.holder})${dPhone ? `\n* 기사: ${dName} (${dPhone})` : ''}\n감사합니다.`;
  };
  const handleToggleInclude = (type: 'gross' | 'fuel' | 'extra') => { if (!selectedClaimRecord) return; const nG = type === 'gross' ? !includeGross : includeGross; const nF = type === 'fuel' ? !includeFuel : includeFuel; const nE = type === 'extra' ? !includeExtra : includeExtra; setIncludeGross(nG); setIncludeFuel(nF); setIncludeExtra(nE); setClaimMessageText(buildClaimText(selectedClaimRecord, nG, nF, nE)); };
  
  const openClaimMessageModal = (r: DrivingRecord) => {
    setSelectedClaimRecord(r);
    const iG = !r.isGrossPaid; const iF = !r.isExpensePaid && r.fuelAmount > 0; const iE = !r.isExpensePaid && r.extraExpenseAmount > 0;
    setIncludeGross(iG); setIncludeFuel(iF); setIncludeExtra(iE);
    setClaimMessageText(buildClaimText(r, iG, iF, iE));
    setClaimModalOpen(true);
  };
  
  const openAdminUserDetail = (user: MemberProfile) => { setAdminSelectedUser(user); setAdminSelectedUserRecords(adminAllRecords.filter(r => r.userId === user.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)); };

  const currentMonthPrefix = customDate.substring(0, 7);
  const prevMonthPrefix = getPrevMonthPrefix(currentMonthPrefix);
  const unpaidRecords = records.filter((r) => !r.isGrossPaid || (!r.isExpensePaid && (r.fuelAmount > 0 || r.extraExpenseAmount > 0)));
  const totalUnpaidAmount = unpaidRecords.reduce((acc, r) => acc + (!r.isGrossPaid ? r.grossAmount : 0) + (!r.isExpensePaid ? (r.fuelAmount + r.extraExpenseAmount) : 0), 0);
  const isAdminUser = currentUserRole === 'super_admin' || currentUserRole === 'manager';
  const pendingCount = adminMemberList.filter(m => m.approvalStatus === 'pending').length;
  const groupMemberCount = adminMemberList.filter(m => m.joinType !== 'referral').length;
  const referralMemberCount = adminMemberList.filter(m => m.joinType === 'referral').length;

  // 기사님 본인: 앱으로 지켜낸 돈 (미수금 회수 실적) & 전월 대비 수익 성장
  const myRecoveredRecords = records.filter((r) => calcRecoveredForRecord(r) > 0);
  const myTotalRecoveredAmount = myRecoveredRecords.reduce((sum, r) => sum + calcRecoveredForRecord(r), 0);
  const myMonthlyRecoveredAmount = myRecoveredRecords.filter((r) => (r.date || '').startsWith(currentMonthPrefix)).reduce((sum, r) => sum + calcRecoveredForRecord(r), 0);

  // 관제탑: 플랫폼 전체 누적 회수액
  const platformRecoveredRecords = adminAllRecords.filter((r) => calcRecoveredForRecord(r) > 0);
  const platformTotalRecoveredAmount = platformRecoveredRecords.reduce((sum, r) => sum + calcRecoveredForRecord(r), 0);

  const monthlyRecords = records.filter((r) => (r.date || '').startsWith(currentMonthPrefix));
  const prevMonthlyRecords = records.filter((r) => (r.date || '').startsWith(prevMonthPrefix));
  const monthlyExpenses = expenses.filter((e) => (e.date || '').startsWith(currentMonthPrefix));
  const monthlyGross = monthlyRecords.reduce((acc, cur) => acc + cur.grossAmount, 0);
  const monthlyNet = monthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const prevMonthlyNet = prevMonthlyRecords.reduce((acc, cur) => acc + cur.netAmount, 0);
  const netGrowthDiff = monthlyNet - prevMonthlyNet;
  const netGrowthRate = prevMonthlyNet > 0 ? Math.round((netGrowthDiff / prevMonthlyNet) * 100) : null;
  const monthlyExpense = monthlyExpenses.reduce((acc, cur) => acc + cur.amount, 0);
  const monthlyProfit = monthlyNet - monthlyExpense;

  const platformSummaryList = (() => {
    const names = Array.from(new Set([
      ...PLATFORMS.map(p => p.name),
      ...monthlyRecords.map(r => r.platform || '미지정'),
      ...monthlyExpenses.map(e => e.platform || '공통'),
    ]));
    return names.map(pName => {
      const pRecs = monthlyRecords.filter(r => (r.platform || '미지정') === pName);
      const pExps = monthlyExpenses.filter(e => (e.platform || '공통') === pName);
      const gross = pRecs.reduce((s, r) => s + r.grossAmount, 0);
      const net = pRecs.reduce((s, r) => s + r.netAmount, 0);
      const exp = pExps.reduce((s, e) => s + e.amount, 0);
      return { name: pName, count: pRecs.length, gross, net, exp, profit: net - exp };
    }).filter(item => item.count > 0 || item.exp > 0);
  })();

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
    const safeKakao = m.kakaoId || ''; const safeRef = m.referrer || '';
    const matchesSearch = safeName.includes(adminSearchTerm) || safePhone.includes(adminSearchTerm) || safeEmail.includes(adminSearchTerm) || safeKakao.includes(adminSearchTerm) || safeRef.includes(adminSearchTerm);
    const isAce = (m.monthlyGross || 0) >= 1500000 || (m.recordCount || 0) >= 10;
    if (showPendingOnly && m.approvalStatus !== 'pending') return false;
    if (showScoutOnly && !isAce) return false;
    return matchesSearch;
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
  const mobileVerticalDays: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDaysArray.push(dStr);
    mobileVerticalDays.push(dStr);
  }
  const currentMonthDisplayRecords = records.filter(r => r.date.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}`));
  const currentActionRecord = actionRecordId ? records.find(r => r.id === actionRecordId) || null : null;

  const injectStyles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
      * { font-family: 'Pretendard', sans-serif !important; }
      body { background-color: #0B1120; color: white; min-height: 100vh; overflow-y: auto; overflow-x: hidden; }
      input, select, textarea { background-color: #FFFFFF !important; color: #000000 !important; font-weight: 600 !important; border: 1px solid transparent !important; transition: all 0.3s ease !important; }
      input::placeholder, textarea::placeholder { color: #94A3B8 !important; font-weight: 400 !important; }
      input:read-only { background-color: #E2E8F0 !important; color: #475569 !important; cursor: not-allowed !important; }
      input:focus, select:focus, textarea:focus { box-shadow: 0 0 12px #8B5CF6 !important; border-color: #8B5CF6 !important; outline: none !important; }
      .hp-primary-btn { background: linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%) !important; color: #FFFFFF !important; transition: transform 0.3s ease, box-shadow 0.3s ease !important; border: none !important; text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important; }
      .hp-primary-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5) !important; }
      .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
      .fade-in-text { animation: fadeIn 0.4s ease-in-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    ` }} />
  );

  const renderPrivacyModal = () => {
    if (!showPrivacyModal) return null;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowPrivacyModal(false)}>
        <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowPrivacyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#38BDF8]" />개인정보 수집·이용 동의 및 처리방침</h3>
          <div className="overflow-y-auto pr-1 space-y-3 text-xs text-slate-300 leading-relaxed flex-1">
            <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="font-bold text-white">1. 개인정보 수집 및 이용 목적</div>
              <p>회원 식별, 회원 가입 승인 확인(단톡방 회원 확인), 운행 일지·정산·경비 장부 서비스 제공 및 고객 문의 응대</p>
            </div>
            <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="font-bold text-white">2. 수집하는 개인정보 항목</div>
              <p>[필수] 이메일, 비밀번호(암호화 저장), 이름, 휴대폰 번호, 단톡방 닉네임</p>
              <p>[선택] 이벤트 및 혜택 안내 수신 동의 여부</p>
            </div>
            <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="font-bold text-white">3. 보유 및 이용 기간</div>
              <p>회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.</p>
            </div>
            <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="font-bold text-white">4. 동의 거부 권리 및 불이익</div>
              <p>이용자는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만 필수 항목 동의 거부 시 회원가입 및 서비스 이용이 제한됩니다. 선택 항목은 거부하셔도 서비스 이용에 제한이 없습니다.</p>
            </div>
            <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="font-bold text-white">5. 개인정보 처리 위탁 및 보호책임자</div>
              <p>• 클라우드 인프라 위탁: Supabase Inc. (데이터베이스 및 인증), Vercel Inc. (웹 호스팅)</p>
              <p>• 개인정보 보호책임자 및 탈퇴 문의: {ADMIN_DEFAULT_EMAIL}</p>
            </div>
          </div>
          <button onClick={() => setShowPrivacyModal(false)} className="w-full mt-4 py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">확인</button>
        </div>
      </div>
    );
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {injectStyles()}
        {renderPrivacyModal()}
        <div className="w-full max-w-[440px] glass-card rounded-2xl p-6 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 p-2.5 bg-[#0B1120] border border-[#8B5CF6]/30 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(139,92,246,0.2)]"><Car className="w-6 h-6 text-[#8B5CF6]" /></div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">탁송대리비서 <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">PRO</span></h1>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">v{APP_VERSION}</p>
          </div>
          <div className="flex bg-[#0B1120] p-1 rounded-xl border border-white/10 mb-5">
            <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${authMode === 'login' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>로그인</button>
            <button onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); setCaptchaVerified(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${authMode === 'signup' ? 'hp-primary-btn shadow' : 'text-slate-400'}`}>회원가입</button>
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 (name@driver.com)" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full px-3.5 py-2.5 rounded-lg" />
              {authError && <div className="p-3 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-lg text-[#EC4899] text-xs">{authError}</div>}
              {authSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">{authSuccess}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg cursor-pointer mt-2">{authLoading ? '로딩 중...' : '클라우드 로그인'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <input type="text" value={kakaoId} onChange={(e) => setKakaoId(e.target.value)} placeholder="단톡방 닉네임(아이디/생년/지역) 톡방과 똑같이" required className="w-full px-3.5 py-2.5 rounded-lg text-xs" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required className="w-full px-3.5 py-2.5 rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (김탁송)" required className="w-full px-3.5 py-2.5 rounded-lg" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="휴대폰번호" maxLength={11} required className="w-full px-3.5 py-2.5 rounded-lg" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호(6자리 이상)" required className="w-full px-3.5 py-2.5 rounded-lg" /><input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="비밀번호 재입력" required className="w-full px-3.5 py-2.5 rounded-lg" /></div>
              <div onClick={() => setCaptchaVerified(!captchaVerified)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${captchaVerified ? 'bg-[#38BDF8]/20 border-[#38BDF8]/50 text-[#38BDF8]' : 'bg-[#0B1120] border-white/10'}`}><div className="flex items-center gap-2.5"><div className={`w-5 h-5 rounded-md border flex items-center justify-center ${captchaVerified ? 'bg-[#38BDF8] border-[#38BDF8] text-white' : 'border-slate-600 bg-slate-800'}`}>{captchaVerified && <Check className="w-3.5 h-3.5" />}</div><span className="text-xs font-semibold">로봇이 아닙니다 (터치)</span></div></div>
              
              <div className="p-3 rounded-xl bg-[#0B1120] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="agreeChk" className="flex items-center gap-2 text-xs text-slate-200 font-medium cursor-pointer">
                    <input type="checkbox" id="agreeChk" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="w-4 h-4 rounded text-[#8B5CF6] cursor-pointer" />
                    <span>[필수] 개인정보 수집·이용 동의</span>
                  </label>
                  <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[11px] text-[#38BDF8] underline shrink-0 cursor-pointer">전문보기</button>
                </div>
                <label htmlFor="agreeMktChk" className="flex items-center gap-2 text-xs text-slate-400 font-medium cursor-pointer">
                  <input type="checkbox" id="agreeMktChk" checked={agreeMarketing} onChange={(e) => setAgreeMarketing(e.target.checked)} className="w-4 h-4 rounded text-[#8B5CF6] cursor-pointer" />
                  <span>[선택] 정식 버전 출시 후 전용 이벤트 및 혜택 안내 받기 (안 받으면 손해!)</span>
                </label>
              </div>

              {authError && <div className="p-2.5 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-lg text-[#EC4899] text-xs">{authError}</div>}
              <button type="submit" disabled={authLoading} className="w-full py-3 hp-primary-btn font-bold text-sm rounded-lg cursor-pointer mt-2">{authLoading ? '처리 중...' : '동의하고 회원가입'}</button>
            </form>
          )}
          <div className="mt-5 pt-3 border-t border-white/10 space-y-2 text-center">
            <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> 탁송대리비서 소통방 입장하기
            </a>
            <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[11px] text-slate-400 hover:text-[#38BDF8] underline cursor-pointer pt-1">개인정보 처리방침 보기</button>
          </div>
        </div>
      </div>
    );
  }

  // 가입 승인 대기 화면
  if (!isAdminUser && currentUserProfile?.approvalStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-4">
        {injectStyles()}
        {renderPrivacyModal()}
        <div className="w-full max-w-[420px] glass-card rounded-2xl p-7 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-[#8B5CF6]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">가입 승인 대기 중</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              <span className="font-bold text-[#38BDF8]">{currentUserProfile.name}</span> 기사님의 신청이 정상 접수되었습니다.<br />
              관리자가 단톡방 확인 후 승인하면 바로 이용하실 수 있습니다.
            </p>
          </div>
          <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">단톡방 닉네임</span>
              <span className="font-bold text-[#38BDF8]">{currentUserProfile.kakaoId || currentUserProfile.referrer || '-'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={() => session?.user && fetchUserData(session.user.id, session.user.email || '', session.user.user_metadata, session.user.created_at)} className="w-full py-3 hp-primary-btn font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-4 h-4" /> 승인 상태 새로고침
            </button>
            <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors">
              <MessageSquare className="w-4 h-4" /> 탁송대리비서 소통방 입장하기
            </a>
            <button onClick={handleLogout} className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer">로그아웃</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 pb-20 relative">
      {injectStyles()}
      {renderPrivacyModal()}
      <header className="sticky top-0 z-30 glass-card border-b-0 border-white/5 px-4 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] rounded-lg flex items-center justify-center shadow-[0_0_10px_#8B5CF6]"><Car className="w-4 h-4 text-white" /></div><span className="font-bold text-base text-white">탁송대리비서</span><span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#8B5CF6]/20 text-[#8B5CF6] rounded border border-[#8B5CF6]/30">PRO</span></div>
          <div className="flex items-center gap-2">
            {isAdminUser && <button onClick={() => { fetchAdminData(); setActiveTab('admin'); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all relative ${activeTab === 'admin' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20'}`}><Crown className="w-3.5 h-3.5" /><span className="hidden sm:inline">관제탑</span>{pendingCount > 0 && <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#EC4899] text-white text-[9px] font-extrabold">{pendingCount}</span>}</button>}
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-card text-xs text-slate-200 cursor-pointer"><User className="w-3.5 h-3.5 text-[#8B5CF6]" /><span className="block font-bold text-white">{currentUserProfile?.name || '기사'}님</span></button>
            <button onClick={handleLogout} className="p-1.5 rounded-lg glass-card text-slate-400 hover:text-[#EC4899] cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-5 pb-10 space-y-5 h-full">
        {/* 미수금 회수 / 수익 마일스톤 축하 알림 배너 */}
        {celebrationAlert && (
          <section className={`rounded-2xl p-4 flex items-start justify-between gap-3 fade-in-text border ${celebrationAlert.type === 'recovery' ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-[#8B5CF6]/15 border-[#8B5CF6]/50 shadow-[0_0_20px_rgba(139,92,246,0.25)]'}`}>
            <div className="flex items-start gap-3">
              <Sparkles className={`w-5 h-5 mt-0.5 shrink-0 ${celebrationAlert.type === 'recovery' ? 'text-emerald-400' : 'text-[#38BDF8]'}`} />
              <div>
                <div className="text-sm font-extrabold text-white">{celebrationAlert.title}</div>
                <div className="text-xs text-slate-200 mt-0.5">{celebrationAlert.message}</div>
              </div>
            </div>
            <button onClick={() => setCelebrationAlert(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-4 h-4" /></button>
          </section>
        )}

        {totalUnpaidAmount > 0 && activeTab !== 'admin' && (
          <section className="bg-[#EC4899]/10 border border-[#EC4899]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(236,72,153,0.1)] fade-in-text">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#EC4899] shrink-0" />
              <div>
                <span className="text-xs font-bold text-[#EC4899]">미입금 내역 ({unpaidRecords.length}건) 회수 필요</span>
                <div className="text-xl font-extrabold text-white">총 {totalUnpaidAmount.toLocaleString()}원</div>
              </div>
            </div>
            <button onClick={() => setActiveTab('claims')} className="w-full sm:w-auto px-4 py-2.5 hp-primary-btn rounded-xl text-xs font-bold cursor-pointer">청구 관리 바로가기</button>
          </section>
        )}

        <div className="bg-[#0B1120] p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap gap-1.5">
            <button onClick={() => setActiveTab('records')} className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'records' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>운행 일지</button>
            <button onClick={() => setActiveTab('claims')} className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold cursor-pointer relative transition-all ${activeTab === 'claims' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>청구 관리 {unpaidRecords.length > 0 && <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#EC4899] text-white text-[9px] font-extrabold">{unpaidRecords.length}</span>}</button>
            <button onClick={() => setActiveTab('expense')} className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'expense' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>경비 장부</button>
            <button onClick={() => setActiveTab('analytics')} className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'analytics' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>통계 요약</button>
            <button onClick={() => setActiveTab('wallet')} className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'wallet' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>계좌 관리</button>
            <button onClick={() => setActiveTab('trade_centers')} className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'trade_centers' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>매매단지</button>
            <button onClick={() => setActiveTab('auctions')} className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'auctions' ? 'hp-primary-btn shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-slate-300 hover:text-white'}`}>경매장</button>
            {isAdminUser && <button onClick={() => setActiveTab('admin')} className={`py-2.5 px-2 text-center rounded-xl text-xs font-bold cursor-pointer transition-all ${activeTab === 'admin' ? 'bg-[#38BDF8] text-[#0B1120] font-extrabold' : 'bg-[#38BDF8]/10 text-[#38BDF8]'}`}>관제탑 {pendingCount > 0 && `(${pendingCount})`}</button>}
          </div>
        </div>

        {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            {/* 배차 등록 폼 */}
            <div className="glass-card rounded-xl p-5 sm:p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#8B5CF6]" />새 운행 배차 등록</h3>
              <p className="text-[11px] text-[#38BDF8] font-medium mb-4 ml-6">기본 수수료 20% 고정 (기타어플 선택 시 직접 수정 가능)</p>
              <form onSubmit={handleAddRecord} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">배차 프로그램 선택</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => { setNewPlatform(p.name); setNewFeeRate(p.defaultFee); }}
                        className={`py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${newPlatform === p.name ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.4)]' : 'bg-[#0B1120] text-slate-400 border-white/15 hover:border-white/30'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운행 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" placeholder="예: 수원" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" placeholder="예: 부산" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">탁송료(원)</label><input type="text" placeholder="예: 150,000" value={newGross} onChange={(e) => setNewGross(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2.5 rounded-lg text-right" /></div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      수수료(%) {newPlatform !== '기타어플' && <span className="text-[10px] text-slate-400">(20% 고정)</span>}
                    </label>
                    <input
                      type="number"
                      placeholder="20"
                      value={newFeeRate}
                      readOnly={newPlatform !== '기타어플'}
                      onChange={(e) => { if (newPlatform === '기타어플') setNewFeeRate(e.target.value); }}
                      className="w-full px-3 py-2.5 rounded-lg text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">기타 부대비용 청구 입력 (선택)</label>
                  <input type="text" placeholder="통행료, 주차비 등 청구 금액" value={newExtraExpense} onChange={(e) => setNewExtraExpense(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-right" />
                </div>
                
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/20">
                  <label className="text-xs font-bold text-[#8B5CF6] flex items-center gap-1.5 mb-2"><Fuel className="w-4 h-4 text-[#8B5CF6]" />대납 주유/충전비 (100% 회수)</label>
                  <input type="text" placeholder="선결제한 주유 금액" value={newFuel} onChange={(e) => setNewFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-right mb-2.5" />
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 w-full">
                    <button type="button" onClick={() => setNewPaymentMethod('현금')} className={`w-full sm:flex-1 py-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${newPaymentMethod === '현금' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-[#0B1120] text-slate-400 border-white/20 hover:border-white/40'}`}>현금 결제</button>
                    <button type="button" onClick={() => setNewPaymentMethod('카드')} className={`w-full sm:flex-1 py-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${newPaymentMethod === '카드' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-[#0B1120] text-slate-400 border-white/20 hover:border-white/40'}`}>카드 결제</button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">기사 팁/추가운임 (선택)</label>
                  <input type="text" placeholder="예: 5,000" value={newTip} onChange={(e) => setNewTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-right" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">기타 사항 (이슈/메모)</label>
                  <textarea rows={2} placeholder="콜 관련 특이사항, 차량 이슈, 대기시간 등 기록" value={newMemo} onChange={(e) => setNewMemo(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs" />
                </div>

                <button type="submit" className="w-full py-3.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">운행 일지 등록</button>
              </form>
            </div>
            
            {/* 캘린더 영역 */}
            <div className="lg:col-span-2 glass-card rounded-xl p-4 sm:p-5 shadow-lg flex flex-col h-auto md:h-[750px]">
              <div className="flex flex-col gap-3 mb-4 border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-[#8B5CF6]" />운행 캘린더 및 정산 관리</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <button onClick={() => setCurrentCalDate(new Date(calYear, calMonth - 1, 1))} className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-slate-300"><ChevronLeft className="w-5 h-5" /></button>
                    <input type="month" value={`${calYear}-${String(calMonth + 1).padStart(2, '0')}`} onChange={(e) => { const [y, m] = e.target.value.split('-'); setCurrentCalDate(new Date(Number(y), Number(m) - 1, 1)); }} className="bg-transparent text-white text-base font-extrabold focus:outline-none cursor-pointer text-center w-36 border-0" />
                    <button onClick={() => setCurrentCalDate(new Date(calYear, calMonth + 1, 1))} className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-slate-300"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer">
                      <input type="checkbox" checked={currentMonthDisplayRecords.length > 0 && selectedRecordIds.length === currentMonthDisplayRecords.length} onChange={(e) => setSelectedRecordIds(e.target.checked ? currentMonthDisplayRecords.map(r => r.id) : [])} className="w-4 h-4 rounded text-[#8B5CF6] cursor-pointer bg-[#0B1120] border-white/20" />
                      전체선택
                    </label>
                    <div className="flex items-center gap-2">
                      {lastDeletedRecords.length > 0 && (
                        <button onClick={handleUndoDelete} className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer animate-pulse border border-indigo-500/30"><RotateCcw className="w-3.5 h-3.5" />복구 ({lastDeletedRecords.length})</button>
                      )}
                      <button onClick={handleBulkDeleteRecords} disabled={selectedRecordIds.length === 0} className={`px-3 py-1.5 text-[11px] font-bold rounded flex items-center gap-1 transition-colors ${selectedRecordIds.length > 0 ? 'bg-[#EC4899]/20 hover:bg-[#EC4899]/40 text-[#EC4899] cursor-pointer' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}><Trash2 className="w-3.5 h-3.5" />삭제 ({selectedRecordIds.length})</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 모바일 전용: 세로형 캘린더 리스트 */}
              <div className="md:hidden space-y-2.5">
                {mobileVerticalDays.map((dateStr) => {
                  const dayRecords = records.filter(r => r.date === dateStr);
                  const isToday = dateStr === getTodayKST();
                  const dateNum = parseInt(dateStr.split('-')[2]);
                  const dayKor = getDayOfWeekKor(dateStr);
                  const dayColor = dayKor === '일' ? 'text-[#EC4899]' : dayKor === '토' ? 'text-[#38BDF8]' : 'text-slate-300';

                  return (
                    <div
                      key={dateStr}
                      onClick={() => { setNewDate(dateStr); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`rounded-xl border p-3 transition-colors cursor-pointer ${isToday ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/50' : 'bg-[#0B1120] border-white/10 hover:border-white/20'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-extrabold ${isToday ? 'text-white bg-[#8B5CF6] px-2 py-0.5 rounded-full' : dayColor}`}>
                            {calMonth + 1}월 {dateNum}일 ({dayKor})
                          </span>
                          {isToday && <span className="text-[10px] font-bold text-[#38BDF8]">오늘</span>}
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">+ 배차등록</span>
                      </div>

                      {dayRecords.length === 0 ? (
                        <div className="text-[11px] text-slate-500 pl-1">운행 기록 없음 (터치하여 등록)</div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          {dayRecords.map(r => {
                            const isChecked = selectedRecordIds.includes(r.id);
                            const hasExpense = r.fuelAmount > 0 || r.extraExpenseAmount > 0;
                            const isFullyPaid = r.isGrossPaid && (!hasExpense || r.isExpensePaid);

                            return (
                              <div
                                key={r.id}
                                onClick={(e) => { e.stopPropagation(); setActionRecordId(r.id); }}
                                className={`p-3 rounded-lg border flex items-center justify-between gap-2 transition-all ${isChecked ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50' : 'bg-white/[0.03] border-white/10'}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => { e.stopPropagation(); if (e.target.checked) setSelectedRecordIds([...selectedRecordIds, r.id]); else setSelectedRecordIds(selectedRecordIds.filter(id => id !== r.id)); }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 text-[#8B5CF6] rounded bg-[#0B1120] border-white/20 cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#38BDF8] text-[9px] font-bold shrink-0">{r.platform || '미지정'}</span>
                                      <span className="text-xs font-extrabold text-white truncate">{r.departure} ➔ {r.destination}</span>
                                    </div>
                                    <div className="text-[11px] text-[#38BDF8] font-bold mt-0.5">순수익 {r.netAmount.toLocaleString()}원</div>
                                    {r.memo && <div className="text-[10px] text-slate-400 truncate mt-0.5">📝 {r.memo}</div>}
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {isFullyPaid ? (
                                    <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">정산완료</span>
                                  ) : (
                                    <span className="px-2 py-1 rounded bg-[#EC4899]/20 text-[#EC4899] text-[10px] font-bold">미수금</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PC/태블릿 전용: 7열 월간 캘린더 */}
              <div className="hidden md:flex flex-1 min-h-0 overflow-y-auto scrollbar-hide rounded-xl border border-white/10 bg-[#0B1120] flex-col">
                <div className="grid grid-cols-7 border-b border-white/10 shrink-0 sticky top-0 bg-[#0B1120] z-10">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => ( <div key={day} className={`p-2 text-center text-xs font-bold ${i === 0 ? 'text-[#EC4899]' : i === 6 ? 'text-[#38BDF8]' : 'text-slate-400'}`}>{day}</div> ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr flex-1">
                  {calendarDaysArray.map((dateStr, idx) => {
                    if (!dateStr) return <div key={`empty-${idx}`} className="border-b border-r border-white/5 bg-white/[0.01]"></div>;
                    const dayRecords = records.filter(r => r.date === dateStr);
                    const isToday = dateStr === getTodayKST(); const dateNum = parseInt(dateStr.split('-')[2]);
                    return (
                      <div key={dateStr}
                           onClick={() => { setNewDate(dateStr); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                           className={`border-b border-r border-white/5 p-1.5 flex flex-col min-h-[90px] transition-colors hover:bg-white/10 cursor-pointer ${isToday ? 'bg-[#8B5CF6]/10' : ''}`}>
                        <div className={`text-[10px] font-bold mb-1.5 ${isToday ? 'text-white bg-[#8B5CF6] w-5 h-5 rounded-full flex items-center justify-center' : 'text-slate-400 ml-1'}`}>{dateNum}</div>
                        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide pr-0.5">
                          {dayRecords.map(r => {
                            const isChecked = selectedRecordIds.includes(r.id);
                            const hasExpense = r.fuelAmount > 0 || r.extraExpenseAmount > 0;
                            const isFullyPaid = r.isGrossPaid && (!hasExpense || r.isExpensePaid);

                            return (
                              <div key={r.id} onClick={(e) => { e.stopPropagation(); setActionRecordId(r.id); }} className={`relative group p-1.5 rounded-md border flex flex-col gap-1 transition-all cursor-pointer ${isChecked ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50' : 'bg-black/40 border-white/10 hover:border-[#8B5CF6]/50'}`}>
                                <div className="flex items-start gap-1">
                                  <input type="checkbox" checked={isChecked} onChange={(e) => { e.stopPropagation(); if (e.target.checked) setSelectedRecordIds([...selectedRecordIds, r.id]); else setSelectedRecordIds(selectedRecordIds.filter(id => id !== r.id)); }} onClick={(e) => e.stopPropagation()} className="w-2.5 h-2.5 text-[#8B5CF6] rounded bg-[#0B1120] border-white/20 mt-0.5 cursor-pointer shrink-0" />
                                  <div className="min-w-0 flex-1 leading-tight">
                                    <div className="flex items-center justify-between">
                                      <div className="text-[10px] font-extrabold text-white truncate">{r.departure.substring(0, 2)}➔{r.destination.substring(0, 4)}</div>
                                      {isFullyPaid ? <span className="text-[9px] text-emerald-400 font-bold ml-1 shrink-0">완료</span> : <span className="text-[9px] text-[#EC4899] font-bold ml-1 shrink-0">미수</span>}
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span className="text-[8px] text-slate-400 truncate">{r.platform || '미지정'}{r.memo ? ' 📝' : ''}</span>
                                      <span className="text-[9px] text-[#38BDF8] font-bold">{(r.netAmount / 10000).toFixed(1)}만</span>
                                    </div>
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
        )}

        {activeTab === 'claims' && (
          <div className="glass-card rounded-xl p-5 sm:p-6 shadow-lg fade-in-text">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div><h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#8B5CF6]" />미입금 청구 대상 ({unpaidRecords.length}건)</h3><p className="text-[11px] text-[#38BDF8] font-medium mt-1 ml-6">미입금된 항목(운임 또는 주유비)만 골라서 정산 요청 문자를 생성합니다.</p></div>
              <span className="text-xs font-bold text-[#EC4899] bg-[#EC4899]/10 px-3 py-1.5 rounded-lg border border-[#EC4899]/30 text-center">총 미수금 {totalUnpaidAmount.toLocaleString()}원</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpaidRecords.length === 0 ? <div className="col-span-full text-center py-10 text-slate-500 text-xs">현재 미입금 내역이 없습니다.</div> : unpaidRecords.slice(0, visibleClaimCount).map((r) => (
                <div key={r.id} className="bg-[#0B1120] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-[#8B5CF6]/50 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#EC4899]/20 text-[#EC4899] text-[10px] font-bold rounded">청구 대기</span>
                        <span className="px-2 py-0.5 bg-[#8B5CF6]/20 text-[#38BDF8] text-[10px] font-bold rounded">{r.platform || '미지정'}</span>
                        {r.claimSentAt && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">문자발송됨</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{r.date}</span>
                    </div>
                    <div className="font-bold text-white text-sm mb-1 flex items-center gap-1.5"><span>{r.departure}</span><ChevronRight className="w-3.5 h-3.5 text-[#8B5CF6]" /><span>{r.destination}</span></div>
                    <div className="text-xs text-slate-400 mt-3 space-y-1">
                      <div className="flex justify-between"><span>탁송운임</span><span className={r.isGrossPaid ? "text-emerald-400 line-through" : "text-white"}>{r.grossAmount.toLocaleString()}원</span></div>
                      {(r.fuelAmount > 0 || r.extraExpenseAmount > 0) && (
                        <div className="flex justify-between"><span>대납 경비</span><span className={r.isExpensePaid ? "text-emerald-400 line-through" : "text-white"}>{(r.fuelAmount + r.extraExpenseAmount).toLocaleString()}원</span></div>
                      )}
                      {r.memo && <div className="text-[11px] text-slate-400 pt-1.5 border-t border-white/5">📝 {r.memo}</div>}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2.5">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button onClick={() => toggleGrossPaid(r.id)} className={`w-full sm:flex-1 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${r.isGrossPaid ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'border-[#8B5CF6]/50 text-[#8B5CF6] hover:bg-[#8B5CF6]/10'}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> 운임 {r.isGrossPaid ? '입금취소' : '입금확인'}
                      </button>
                      {(r.fuelAmount > 0 || r.extraExpenseAmount > 0) && (
                        <button onClick={() => toggleExpensePaid(r.id)} className={`w-full sm:flex-1 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${r.isExpensePaid ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'border-[#EC4899]/50 text-[#EC4899] hover:bg-[#EC4899]/10'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> 대납 {r.isExpensePaid ? '입금취소' : '입금확인'}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex gap-1.5">
                        <button onClick={() => handleOpenEditModal(r)} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors cursor-pointer" title="수정"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteSingleRecord(r.id)} className="p-2.5 bg-white/5 hover:bg-[#EC4899]/20 text-slate-300 hover:text-[#EC4899] rounded-lg transition-colors cursor-pointer" title="삭제"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => openClaimMessageModal(r)} className="px-4 py-2 hp-primary-btn text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />문자 생성</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expense' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-text">
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-5 sm:p-6 shadow-lg h-fit">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#EC4899]" />일반 경비 지출 등록</h3>
                <form onSubmit={handleAddExpense} className="space-y-3.5 mt-4">
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 일자</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">프로그램 귀속</label>
                      <select value={expPlatform} onChange={(e) => setExpPlatform(e.target.value)} className="w-full px-3 py-2.5 rounded-lg">
                        {EXPENSE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 분류</label>
                      <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-lg"><option value="대중교통">대중교통 (버스/지하철/택시)</option><option value="식대">식대/간식</option><option value="차량공유">차량공유 (쏘카/그린카)</option><option value="고정비">고정비 (프로그램/보험)</option><option value="기타">기타 경비</option></select>
                    </div>
                  </div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">지출 금액(원)</label><input type="text" placeholder="금액 입력" value={expAmount} onChange={(e) => setExpAmount(formatNumberWithComma(e.target.value))} required className="w-full px-3 py-2.5 rounded-lg text-right" /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">상세 메모 (선택)</label><input type="text" placeholder="예: 경기K패스, 광역버스" value={expMemo} onChange={(e) => setExpMemo(e.target.value)} className="w-full px-3 py-2.5 rounded-lg" /></div>
                  <button type="submit" className="w-full py-3.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">경비 등록하기</button>
                </form>
              </div>
              
              <div className="glass-card rounded-xl p-5 shadow-lg border-t-2 border-t-[#38BDF8]">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-[#38BDF8]" /> 매월 나가는 고정비 관리 <span className="text-[10px] font-normal text-[#38BDF8] ml-auto">클라우드 동기화</span></h3>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">보험료, 통신비, 프로그램비 등 매월 정기적으로 나가는 고정 지출을 프로그램별로 묶어 한 번에 장부에 등록하세요.</p>
                <div className="space-y-2 mb-3">
                  <select value={newMonthlyPlatform} onChange={(e) => setNewMonthlyPlatform(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs">
                    {EXPENSE_PLATFORMS.map(p => <option key={p} value={p}>귀속: {p}</option>)}
                  </select>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={newMonthlyMemo} onChange={(e) => setNewMonthlyMemo(e.target.value)} placeholder="항목명 (예: 로지 프로그램비)" className="w-full sm:flex-1 px-3 py-2.5 rounded-lg text-xs" />
                    <input type="text" value={newMonthlyAmount} onChange={(e) => setNewMonthlyAmount(formatNumberWithComma(e.target.value))} placeholder="금액 (원)" className="w-full sm:w-28 px-3 py-2.5 rounded-lg text-xs text-right" />
                    <button onClick={handleAddMonthlyFixedItem} className="w-full sm:w-auto px-4 py-2.5 bg-[#38BDF8] text-[#0B1120] font-bold rounded-lg text-xs hover:bg-[#38BDF8]/80 cursor-pointer">+ 추가</button>
                  </div>
                </div>
                <div className="space-y-2 mb-4 max-h-[160px] overflow-y-auto pr-1 scrollbar-hide">
                  {monthlyFixedItems.length === 0 ? <div className="text-[11px] text-slate-500 text-center py-2">등록된 고정비가 없습니다.</div> : monthlyFixedItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-[#0B1120] px-3 py-2.5 rounded border border-white/5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] text-[9px] font-bold shrink-0">{item.platform || '공통'}</span>
                        <span className="text-xs text-slate-300 truncate">{item.memo}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-white">{item.amount.toLocaleString()}원</span>
                        <button onClick={() => handleDeleteMonthlyFixedItem(item.id)} className="text-slate-500 hover:text-[#EC4899] cursor-pointer"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleApplyMonthlyFixedExpenses} className="w-full py-3 bg-white/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-sm">이번 달 장부에 일괄 등록 ({newDate} 기준)</button>
              </div>
            </div>
            
            <div className="lg:col-span-2 glass-card rounded-xl p-5 sm:p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-4">지출 내역 목록 ({expenses.length}건)</h3>
              <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {expenses.length === 0 ? <div className="text-center py-10 text-slate-500 text-xs">등록된 경비 지출이 없습니다.</div> : expenses.map((e) => (
                  <div key={e.id} className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex items-center justify-between hover:border-white/20 transition-all">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#38BDF8]/15 text-[#38BDF8] rounded text-[10px] font-bold">{e.platform || '공통'}</span>
                        <span className="px-2 py-0.5 bg-white/10 text-slate-300 rounded text-[10px] font-semibold">{e.category}</span>
                        <span className="text-sm text-white font-medium">{e.memo || '-'}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1.5">{e.date}</div>
                    </div>
                    <div className="flex items-center gap-3"><span className="text-[#EC4899] font-bold text-sm">-{e.amount.toLocaleString()}원</span><button onClick={() => handleDeleteExpense(e.id)} className="text-slate-600 hover:text-[#EC4899] p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 fade-in-text">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-2 bg-[#0B1120] p-1.5 rounded-xl border border-white/10 w-full sm:w-fit">
                <button onClick={() => setAnalyticsMode('month')} className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${analyticsMode === 'month' ? 'bg-[#8B5CF6] text-white shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'text-slate-400 hover:text-white'}`}>월간 상세 요약</button>
                <button onClick={() => setAnalyticsMode('year')} className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${analyticsMode === 'year' ? 'bg-[#8B5CF6] text-white shadow-[0_2px_10px_rgba(139,92,246,0.4)]' : 'text-slate-400 hover:text-white'}`}>연간 종합 통계</button>
              </div>
              <button onClick={handleExportMyCSV} className="w-full sm:w-auto px-4 py-2.5 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> 내 장부 엑셀(CSV) 다운로드
              </button>
            </div>

            {/* 앱으로 지켜낸 내 돈 & 수익 성장 리포트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-950/50 to-[#0B1120] border border-emerald-500/40 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 앱으로 지켜낸 내 돈 (미수금 회수)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">누적 {myRecoveredRecords.length}건</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{myTotalRecoveredAmount.toLocaleString()}원</div>
                <div className="text-[11px] text-slate-300 mt-2">
                  이번 달 회수액: <strong className="text-emerald-400">{myMonthlyRecoveredAmount.toLocaleString()}원</strong> · 정산 문자 발송 후 입금 완료된 금액 기준
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-950/50 to-[#0B1120] border border-[#38BDF8]/40 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-[#38BDF8] flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> 전월 대비 탁송 순수익 성장</span>
                  {netGrowthRate !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${netGrowthDiff >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#EC4899]/20 text-[#EC4899]'}`}>
                      {netGrowthDiff >= 0 ? `▲ +${netGrowthRate}%` : `▼ ${netGrowthRate}%`}
                    </span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {netGrowthDiff >= 0 ? `+${netGrowthDiff.toLocaleString()}` : netGrowthDiff.toLocaleString()}원
                </div>
                <div className="text-[11px] text-slate-300 mt-2">
                  지난달({prevMonthPrefix}) 순수익: <strong className="text-white">{prevMonthlyNet.toLocaleString()}원</strong> → 이번 달: <strong className="text-[#38BDF8]">{monthlyNet.toLocaleString()}원</strong>
                </div>
              </div>
            </div>

            {analyticsMode === 'month' && (
              <div className="space-y-4 fade-in-text">
                <div className="glass-card rounded-2xl p-5 md:p-6 shadow-xl border-2 border-[#8B5CF6]/40 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
                      <div><h3 className="text-base font-extrabold text-white flex items-center gap-1.5"><Target className="w-5 h-5 text-[#8B5CF6]" /> 내 목표 달성 페이스메이커</h3></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 mb-0.5 ml-1">목표 순수익(원)</span><input type="text" value={targetIncome} onChange={(e) => setTargetIncome(formatNumberWithComma(e.target.value))} className="w-full sm:w-28 px-2.5 py-2 rounded text-xs text-right bg-[#0B1120] border border-white/20 text-white" /></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 mb-0.5 ml-1">출근(일)</span><input type="number" value={targetDays} onChange={(e) => setTargetDays(e.target.value)} className="w-full sm:w-20 px-2.5 py-2 rounded text-xs text-center bg-[#0B1120] border border-white/20 text-white" /></div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-2"><span className="text-sm font-bold text-white">진행률 <span className="text-[#8B5CF6] ml-1">{achievementRate}%</span></span><span className="text-[11px] text-slate-400 font-mono">{monthlyProfit.toLocaleString()}원 / {targetIncNum.toLocaleString()}원</span></div>
                      <div className="w-full bg-[#0B1120] rounded-full h-3.5 border border-white/5 overflow-hidden"><div className="bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6] h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${achievementRate}%` }}></div></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/5"><div className="text-[10px] text-slate-400 mb-1">실제 출근 일수</div><div className="text-sm font-bold text-white">{uniqueWorkedDates}일</div></div>
                      <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/5"><div className="text-[10px] text-slate-400 mb-1">남은 금액</div><div className="text-sm font-bold text-[#EC4899]">{Math.max(0, remainingIncome).toLocaleString()}원</div></div>
                      <div className="bg-[#0B1120] p-3.5 rounded-xl border border-white/5 sm:col-span-2 flex items-center justify-between"><div><div className="text-[10px] text-[#38BDF8] mb-1 font-bold">목표 달성을 위해 오늘부터</div><div className="text-lg font-extrabold text-white">하루 <span className="text-[#38BDF8]">{dailyRequired.toLocaleString()}</span> 원 씩!</div></div></div>
                    </div>
                  </div>
                </div>
                <section className="bg-gradient-to-r from-[#0B1120] via-indigo-950/40 to-[#0B1120] border border-[#8B5CF6]/30 rounded-2xl p-5 sm:p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/10 gap-2">
                    <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#8B5CF6]" /><h2 className="text-xs font-bold text-slate-200 tracking-wide uppercase">이달의 총 누적 결산</h2></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/[0.02] p-3 rounded-xl sm:bg-transparent sm:p-0"><div className="text-[11px] text-slate-400 mb-1">총 탁송 매출</div><div className="text-xl lg:text-2xl font-extrabold text-white">{monthlyGross.toLocaleString()}원</div></div>
                    <div className="bg-white/[0.02] p-3 rounded-xl sm:bg-transparent sm:p-0"><div className="text-[11px] text-slate-400 mb-1">탁송 순수익</div><div className="text-xl lg:text-2xl font-extrabold text-[#38BDF8]">{monthlyNet.toLocaleString()}원</div></div>
                    <div className="bg-white/[0.02] p-3 rounded-xl sm:bg-transparent sm:p-0"><div className="text-[11px] text-slate-400 mb-1">일반 경비 지출</div><div className="text-xl lg:text-2xl font-extrabold text-[#EC4899]">-{monthlyExpense.toLocaleString()}원</div></div>
                    <div className="bg-white/[0.02] p-3 rounded-xl sm:bg-transparent sm:p-0"><div className="text-[11px] text-slate-400 mb-1">최종 실수령액 (예상)</div><div className="text-xl lg:text-2xl font-extrabold text-[#38BDF8]">{monthlyProfit.toLocaleString()}원</div></div>
                  </div>
                </section>

                <div className="glass-card rounded-xl p-5 border-t-2 border-t-[#38BDF8]">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-[#38BDF8]" /> 당월 프로그램별 손익 계산서</h3>
                  {platformSummaryList.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">이번 달 등록된 프로그램별 내역이 없습니다.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {platformSummaryList.map(item => (
                        <div key={item.name} className="bg-[#0B1120] border border-white/10 rounded-xl p-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="font-extrabold text-white text-sm">{item.name}</span>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-[10px] font-bold">{item.count}건</span>
                          </div>
                          <div className="flex justify-between"><span className="text-slate-400">탁송 매출</span><span className="text-white font-semibold">{item.gross.toLocaleString()}원</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">탁송 순수익</span><span className="text-[#38BDF8] font-semibold">{item.net.toLocaleString()}원</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">프로그램 지출</span><span className="text-[#EC4899] font-semibold">-{item.exp.toLocaleString()}원</span></div>
                          <div className="flex justify-between border-t border-white/10 pt-2">
                            <span className="text-slate-300 font-bold">최종 순수익</span>
                            <span className={`font-extrabold ${item.profit >= 0 ? 'text-emerald-400' : 'text-[#EC4899]'}`}>{item.profit.toLocaleString()}원</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card rounded-xl p-5 border-t-2 border-t-[#8B5CF6]">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><PieChart className="w-4 h-4 text-[#8B5CF6]" /> 당월 매출 세부 구성</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center"><span className="text-slate-400">기본 탁송 운임</span><span className="text-white font-semibold">{monthlyRecords.reduce((sum, r) => sum + r.grossAmount, 0).toLocaleString()}원</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-400">기사 팁 / 추가 운임</span><span className="text-[#38BDF8] font-semibold">+{monthlyRecords.reduce((sum, r) => sum + r.tipAmount, 0).toLocaleString()}원</span></div>
                      <div className="flex justify-between items-center border-t border-white/10 pt-3"><span className="text-slate-400">수수료 차감액 (추정)</span><span className="text-[#EC4899] font-semibold">-{monthlyRecords.reduce((sum, r) => sum + (r.grossAmount * (r.feeRate / 100)), 0).toLocaleString()}원</span></div>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 rounded-xl border border-[#8B5CF6]/30">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#8B5CF6]" /> {analyticsYear}년 종합 수익 통계</h2>
                  <select value={analyticsYear} onChange={(e) => setAnalyticsYear(e.target.value)} className="w-full sm:w-auto bg-[#0B1120] text-white border border-[#8B5CF6]/50 rounded-lg px-3 py-2 text-xs font-bold focus:border-[#8B5CF6] outline-none cursor-pointer"><option value="2026">2026년</option><option value="2025">2025년</option></select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#0B1120] border border-white/10 p-4 rounded-xl text-center shadow-lg"><div className="text-[10px] text-slate-400 mb-1">연간 총 운행</div><div className="text-lg font-bold text-white">{records.filter(r => (r.date || '').startsWith(analyticsYear)).length}회</div></div>
                  <div className="bg-[#0B1120] border border-white/10 p-4 rounded-xl text-center shadow-lg"><div className="text-[10px] text-slate-400 mb-1">연간 총 탁송매출</div><div className="text-lg font-bold text-[#8B5CF6]">{records.filter(r => (r.date || '').startsWith(analyticsYear)).reduce((sum, r) => sum + r.grossAmount, 0).toLocaleString()}원</div></div>
                  <div className="bg-[#0B1120] border border-white/10 p-4 rounded-xl text-center shadow-lg"><div className="text-[10px] text-slate-400 mb-1">연간 순수익</div><div className="text-lg font-bold text-[#38BDF8]">{records.filter(r => (r.date || '').startsWith(analyticsYear)).reduce((sum, r) => sum + r.netAmount, 0).toLocaleString()}원</div></div>
                  <div className="bg-[#0B1120] border border-white/10 p-4 rounded-xl text-center shadow-lg"><div className="text-[10px] text-slate-400 mb-1">연간 총 지출</div><div className="text-lg font-bold text-[#EC4899]">{expenses.filter(e => (e.date || '').startsWith(analyticsYear)).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}원</div></div>
                </div>

                <div className="md:hidden space-y-3">
                  {Array.from({ length: 12 }, (_, i) => {
                    const mStr = `${analyticsYear}-${String(i + 1).padStart(2, '0')}`;
                    const mRecs = records.filter(r => (r.date || '').startsWith(mStr)); const mExps = expenses.filter(e => (e.date || '').startsWith(mStr));
                    if (mRecs.length === 0 && mExps.length === 0) return null;
                    return (
                      <div key={i} className="glass-card rounded-xl p-4 border border-white/10 space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="font-extrabold text-white text-sm">{i + 1}월 결산</span>
                          <span className="text-slate-300 font-semibold">{mRecs.length}건 운행</span>
                        </div>
                        <div className="flex justify-between"><span className="text-slate-400">탁송 매출</span><span className="text-white font-semibold">{mRecs.reduce((sum, r) => sum + r.grossAmount, 0).toLocaleString()}원</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">대납(주유/경비)</span><span className="text-slate-300">{mRecs.reduce((sum, r) => sum + r.fuelAmount + r.extraExpenseAmount, 0).toLocaleString()}원</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">순수익</span><span className="text-[#38BDF8] font-bold">{mRecs.reduce((sum, r) => sum + r.netAmount, 0).toLocaleString()}원</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">지출</span><span className="text-[#EC4899] font-medium">-{mExps.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}원</span></div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block glass-card rounded-xl p-0 overflow-hidden shadow-lg border border-white/10">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#0B1120] text-slate-400 border-b border-white/10">
                        <tr><th className="p-3 text-center">월별</th><th className="p-3 text-right">운행건수</th><th className="p-3 text-right">탁송 매출</th><th className="p-3 text-right">대납(주유/경비)</th><th className="p-3 text-right text-[#38BDF8]">순수익</th><th className="p-3 text-right text-[#EC4899]">지출</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Array.from({ length: 12 }, (_, i) => {
                          const mStr = `${analyticsYear}-${String(i + 1).padStart(2, '0')}`;
                          const mRecs = records.filter(r => (r.date || '').startsWith(mStr)); const mExps = expenses.filter(e => (e.date || '').startsWith(mStr));
                          if (mRecs.length === 0 && mExps.length === 0) return null;
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
            <div className="glass-card rounded-xl p-5 sm:p-6 shadow-lg h-fit">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#38BDF8]" />정산 및 송금용 계좌 추가 <span className="text-[10px] font-normal text-[#38BDF8] ml-auto">클라우드 동기화</span></h3>
              <form onSubmit={handleAddAccount} className="space-y-3.5 mt-4">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">은행명</label><input type="text" placeholder="예: 신한은행" value={bankName} onChange={(e) => setBankName(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">계좌번호 (- 제외)</label><input type="text" placeholder="계좌번호 입력" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg font-mono" /></div>
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">예금주</label><input type="text" placeholder="예금주 성함 (예: 김탁송)" value={holder} onChange={(e) => setHolder(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg" /></div>
                <button type="submit" className="w-full py-3.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer mt-2">새 계좌 등록</button>
              </form>
            </div>
            <div className="space-y-3">
              {accounts.map((acc, idx) => (
                <div key={acc.id} className="relative bg-gradient-to-br from-[#0B1120] to-indigo-950/30 border border-[#8B5CF6]/30 rounded-xl p-5 sm:p-6 overflow-hidden shadow-lg group hover:border-[#8B5CF6] transition-colors">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4"><span className="px-2 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-bold rounded uppercase">{idx === 0 ? '대표 계좌 (청구용)' : '보조 계좌'}</span><button onClick={() => handleDeleteAccount(acc.id)} className="text-slate-500 hover:text-[#EC4899] p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button></div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-white mb-2 break-all">{acc.accountNumber}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-300"><span className="font-bold">{acc.bankName}</span> <span className="text-slate-500">|</span> <span>예금주: {acc.holder}</span></div>
                    <div className="mt-4"><button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); alert('계좌번호가 복사되었습니다.'); }} className="w-full sm:w-auto px-3 py-2 rounded-lg bg-white/10 text-xs text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-white/20"><Copy className="w-3.5 h-3.5" /> 계좌번호 복사</button></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trade_centers' && (
          <div className="space-y-5 fade-in-text">
            <div className="glass-card rounded-xl p-5 shadow-lg border border-[#8B5CF6]/30">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Building2 className="w-5 h-5 text-[#8B5CF6]" />전국 주요 매매단지 거점 현황 ({filteredTradeCenters.length}곳)</h3>
              <div className="flex flex-wrap gap-2">{['전체', 'S등급', 'A등급', '수도권', '충청권', '영남권', '호남권'].map(f => ( <button key={f} onClick={() => setTradeFilter(f as any)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${tradeFilter === f ? 'bg-[#8B5CF6] text-white shadow-[0_0_10px_rgba(139,92,246,0.4)] border-transparent' : 'bg-[#0B1120] text-slate-400 border border-white/10 hover:border-[#8B5CF6]/50'}`}>{f}</button> ))}</div>
            </div>
            <div className="flex flex-wrap gap-3 px-2 text-[10px] font-bold"><span className="text-[#F59E0B] flex items-center gap-1"><Crown className="w-3 h-3" /> S등급 (메가 허브)</span><span className="text-[#38BDF8] flex items-center gap-1"><Target className="w-3 h-3" /> A등급 (광역 핵심)</span><span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> B등급 (주요 알짜)</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {filteredTradeCenters.map((center) => (
                <div key={center.id} className={`glass-card p-4 rounded-xl border-t-2 flex flex-col gap-3 transition-all hover:bg-white/5 ${center.tier === 'S' ? 'border-t-[#F59E0B] shadow-[0_4px_15px_rgba(245,158,11,0.1)]' : center.tier === 'A' ? 'border-t-[#38BDF8]' : 'border-t-white/20'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-1.5">{center.tier === 'S' && <span className="px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-extrabold rounded flex items-center gap-0.5"><Crown className="w-3 h-3" /> S등급</span>}{center.tier === 'A' && <span className="px-1.5 py-0.5 bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-bold rounded flex items-center gap-0.5"><Target className="w-3 h-3" /> A등급</span>}{center.tier === 'B' && <span className="px-1.5 py-0.5 bg-white/10 text-slate-300 text-[10px] font-bold rounded flex items-center gap-0.5">B등급</span>}<span className="text-[10px] font-semibold text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">{center.region}</span></div></div>
                    <h4 className="text-sm font-extrabold text-white mb-1.5">{center.name}</h4><p className="text-[11px] text-slate-300 bg-[#0B1120] p-2 rounded-lg border border-white/5 leading-relaxed mb-2.5">{center.desc}</p>
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400"><MapPin className="w-3.5 h-3.5 mt-0.5 text-[#EC4899] shrink-0" /><span className="leading-tight">{center.addr}</span></div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-white/5 mt-auto">
                    <button onClick={() => window.open(`https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(center.addr)}`, '_blank')} className="w-full sm:flex-1 py-2.5 bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#03C75A] border border-[#03C75A]/30 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"><Navigation className="w-3.5 h-3.5" /> 네이버 지도</button>
                    <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(center.addr)}`, '_blank')} className="w-full sm:flex-1 py-2.5 bg-[#FEE500]/10 hover:bg-[#FEE500]/20 text-[#FEE500] border border-[#FEE500]/30 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"><Navigation className="w-3.5 h-3.5" /> 카카오 맵</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'auctions' && (
          <div className="space-y-6 fade-in-text">
            <div className="glass-card rounded-xl p-5 sm:p-6 shadow-lg border border-[#8B5CF6]/30">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-[#8B5CF6]" />탁송 오더 집중 발생 요약 (장거리 계획용)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex items-start gap-3"><Clock className="w-4 h-4 text-[#38BDF8] mt-0.5 shrink-0" /><div><div className="text-xs font-bold text-slate-300">경매 진행 시간</div><div className="text-sm font-extrabold text-white mt-1">오후 1시 ~ 오후 5시</div><div className="text-[10px] text-slate-500 mt-0.5">* 마감시간은 경매장별로 상이합니다.</div></div></div>
                <div className="bg-[#0B1120] border border-white/10 p-4 rounded-lg flex items-start gap-3"><MapPin className="w-4 h-4 text-[#EC4899] mt-0.5 shrink-0" /><div><div className="text-xs font-bold text-slate-300">오더 집중 발생 시간</div><div className="text-sm font-extrabold text-white mt-1">경매 시작 ~ 오후 6시까지</div><div className="text-[10px] text-slate-500 mt-0.5">* 익일 오전까지도 잔여 오더가 계속 발생합니다.</div></div></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 px-2 text-[10px] font-bold"><span className="text-[#F59E0B] flex items-center gap-1"><Crown className="w-3 h-3" /> S등급 (메가 옥션)</span><span className="text-[#38BDF8] flex items-center gap-1"><Target className="w-3 h-3" /> A등급 (광역 옥션)</span><span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> B등급 (지역/특화 옥션)</span></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
              {AUCTION_SCHEDULES.map((schedule, idx) => (
                <div key={idx} className="glass-card p-5 rounded-xl border-t-2 flex flex-col gap-3" style={{ borderTopColor: schedule.hex }}>
                  <div className="flex items-center gap-2 mb-2"><CalendarDays className="w-5 h-5" style={{ color: schedule.hex }} /><h4 className="font-extrabold text-base text-white">{schedule.day}</h4></div>
                  <div className="space-y-3">
                    {schedule.locations.map((loc, i) => (
                      <div key={i} className={`bg-[#0B1120] border rounded-xl p-3.5 hover:border-white/20 transition-all flex flex-col gap-3 ${loc.tier === 'S' ? 'border-[#F59E0B]/30' : loc.tier === 'A' ? 'border-[#38BDF8]/30' : 'border-white/5'}`}>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">{loc.tier === 'S' && <span className="px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-extrabold rounded flex items-center gap-0.5"><Crown className="w-3 h-3" /> S등급</span>}{loc.tier === 'A' && <span className="px-1.5 py-0.5 bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-bold rounded flex items-center gap-0.5"><Target className="w-3 h-3" /> A등급</span>}{loc.tier === 'B' && <span className="px-1.5 py-0.5 bg-white/10 text-slate-300 text-[10px] font-bold rounded flex items-center gap-0.5">B등급</span>}<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">{loc.tag}</span><span className="text-sm font-bold text-slate-100">{loc.name}</span></div>
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-400"><MapPin className="w-3 h-3 mt-0.5 text-[#38BDF8] shrink-0" /><span>{loc.addr}</span></div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-white/5">
                          <button onClick={() => window.open(`https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(loc.addr)}`, '_blank')} className="w-full sm:flex-1 py-2 bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#03C75A] border border-[#03C75A]/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors">네이버 지도</button>
                          <button onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(loc.addr)}`, '_blank')} className="w-full sm:flex-1 py-2 bg-[#FEE500]/10 hover:bg-[#FEE500]/20 text-[#FEE500] border border-[#FEE500]/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors">카카오 맵</button>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <h3 className="text-sm font-bold text-[#38BDF8] flex items-center gap-2"><Crown className="w-5 h-5" />플랫폼 관리자 (관제탑 · v{APP_VERSION})</h3>
              <button onClick={handleBroadcastForceUpdate} className="w-full sm:w-auto px-4 py-2.5 bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> ⚡ 전체 기사 강제 업데이트
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 border-b border-white/10 pb-3">
              <button onClick={() => setAdminSubTab('campaign')} className={`w-full sm:w-auto px-3 py-2 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'campaign' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>공지/이벤트 문구보관함</button>
              <button onClick={() => setAdminSubTab('members')} className={`w-full sm:w-auto px-3 py-2 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'members' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>회원 접속 현황 및 승인 {pendingCount > 0 && `(${pendingCount})`}</button>
              <button onClick={() => setAdminSubTab('analytics')} className={`w-full sm:w-auto px-3 py-2 rounded text-xs font-bold cursor-pointer transition-colors ${adminSubTab === 'analytics' ? 'bg-[#38BDF8] text-[#0B1120] shadow-[0_0_10px_#38BDF8]' : 'bg-[#0B1120] text-slate-400 hover:text-white border border-white/10'}`}>플랫폼 트래픽 및 매출 통계</button>
            </div>

            {adminSubTab === 'campaign' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card p-5 sm:p-6 rounded-xl space-y-4 h-fit">
                  <div className="flex items-center justify-between"><h4 className="font-bold text-white text-sm flex items-center gap-1.5"><BookmarkPlus className="w-4 h-4 text-[#8B5CF6]" />{editingNoticeId ? '문구 수정하기' : '새 공지 문구 저장'}</h4>{editingNoticeId && <button onClick={() => { setEditingNoticeId(null); setInputNoticeTitle(''); setInputNoticeContent(''); }} className="text-[11px] text-[#38BDF8] hover:text-white cursor-pointer">신규 작성</button>}</div>
                  <form onSubmit={handleSaveNoticeTemplate} className="space-y-3">
                    <input type="text" value={inputNoticeTitle} onChange={(e) => setInputNoticeTitle(e.target.value)} placeholder="제목 (예: 11월 프로모션 안내)" required className="w-full px-3 py-2.5 rounded-lg text-xs" />
                    <textarea rows={4} value={inputNoticeContent} onChange={(e) => setInputNoticeContent(e.target.value)} placeholder="앱 최상단 배너에 노출될 내용" required className="w-full px-3 py-2.5 rounded-lg text-xs" />
                    <button type="submit" disabled={noticeLoading} className="w-full py-3 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">{noticeLoading ? '처리 중...' : editingNoticeId ? '수정 내용 저장' : '보관함에 저장하기'}</button>
                  </form>
                  {activeNotice && <div className="pt-3 border-t border-white/10"><button onClick={handleDeactivateAllNotices} disabled={noticeLoading} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#EC4899] text-xs font-semibold rounded-lg cursor-pointer">현재 메인 배너 송출 중단</button></div>}
                </div>
                <div className="lg:col-span-2 glass-card p-5 sm:p-6 rounded-xl space-y-4">
                  <div className="flex items-center justify-between"><div><h4 className="font-bold text-white text-sm">공지 문구 라이브러리</h4></div><span className="text-xs font-mono text-[#8B5CF6] font-bold">{noticeList.length}개 보관 중</span></div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {noticeList.map((n) => (
                      <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.isActive ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'bg-[#0B1120] border-white/10'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2"><div className="flex items-center gap-2">{n.isActive ? <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#38BDF8] text-[#0B1120] rounded flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" />송출 중</span> : <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-slate-400 rounded">보관 중</span>}<h5 className="font-bold text-white text-xs">{n.title}</h5></div><span className="text-[10px] text-slate-500 font-mono">{n.updatedAt}</span></div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-[#0B1120] p-3 rounded-lg border border-white/5">{n.content}</p>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button onClick={() => { setInputNoticeTitle(n.title); setInputNoticeContent(n.content); setEditingNoticeId(n.id); }} className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] rounded font-semibold cursor-pointer flex items-center gap-1"><Edit2 className="w-3 h-3" />불러오기</button>
                          <button onClick={() => handleDeleteNotice(n.id)} className="p-1.5 text-slate-500 hover:text-[#EC4899] cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                          {!n.isActive && <button onClick={() => handleActivateNotice(n)} disabled={noticeLoading} className="px-3 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-bold rounded cursor-pointer flex items-center gap-1 shadow-md border-0"><Send className="w-3 h-3" />메인 송출</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === 'members' && (
              <div className="glass-card p-5 sm:p-6 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <input type="text" placeholder="이름 / 연락처 / 단톡방 닉네임 검색..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="px-3 py-2.5 rounded-lg text-xs w-full sm:max-w-xs" />
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowPendingOnly(!showPendingOnly)} className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${showPendingOnly ? 'bg-[#EC4899] text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-[#0B1120] text-slate-400 border border-white/10 hover:border-[#EC4899]/50'}`}>
                      <ShieldAlert className="w-4 h-4" /> 승인 대기만 ({pendingCount})
                    </button>
                    <button onClick={() => setShowScoutOnly(!showScoutOnly)} className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${showScoutOnly ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] border-0' : 'bg-[#0B1120] text-slate-400 border border-white/10 hover:border-amber-500/50'}`}>
                      <Award className="w-4 h-4" /> 🏆 에이스 기사만
                    </button>
                  </div>
                </div>

                {/* 회원 목록 구분별 엑셀(CSV) 다운로드 */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#0B1120] border border-white/10">
                  <span className="text-[11px] font-bold text-slate-300 mr-1 flex items-center gap-1"><Download className="w-3.5 h-3.5 text-[#10B981]" /> 회원 엑셀(CSV) 다운로드:</span>
                  <button onClick={() => handleExportMembersCSV('all')} className="px-3 py-1.5 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                    전체 ({adminMemberList.length}명)
                  </button>
                  <button onClick={() => handleExportMembersCSV('group')} className="px-3 py-1.5 bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/40 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                    단톡방 회원 ({groupMemberCount}명)
                  </button>
                  <button onClick={() => handleExportMembersCSV('referral')} className="px-3 py-1.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/35 text-[#C4B5FD] border border-[#8B5CF6]/40 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                    지인 추천 ({referralMemberCount}명)
                  </button>
                </div>

                <div className="md:hidden space-y-3">
                  {displayedMembers.length === 0 ? <div className="p-10 text-center text-slate-500 text-xs">검색 조건에 맞는 기사님이 없습니다.</div> : displayedMembers.map((m) => {
                    const isAce = (m.monthlyGross || 0) >= 1500000 || (m.recordCount || 0) >= 10;
                    const isPending = m.approvalStatus === 'pending';
                    return (
                      <div key={m.id} className={`p-4 rounded-xl border space-y-2.5 text-xs ${isPending ? 'bg-[#EC4899]/10 border-[#EC4899]/40' : isAce ? 'bg-amber-500/5 border-amber-500/30' : 'bg-[#0B1120] border-white/10'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white font-bold flex flex-wrap items-center gap-1.5 text-sm">
                              {m.name || '미입력'}
                              {isPending && <span className="px-1.5 py-0.5 bg-[#EC4899] text-white text-[9px] rounded font-extrabold">승인대기</span>}
                              {isAce && <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] rounded font-extrabold">🏆 에이스</span>}
                              {(m.recoveredAmount || 0) > 0 && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] rounded font-extrabold">회수 {(m.recoveredAmount || 0).toLocaleString()}원</span>}
                            </div>
                            <div className="font-mono text-[#38BDF8] text-[11px] mt-0.5">{formatPhoneNumber(m.phone) || '번호없음'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">{m.recordCount}건</div>
                            <div className="text-[#EC4899] font-semibold">{(m.monthlyGross || 0).toLocaleString()}원</div>
                          </div>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex justify-between text-[11px]">
                          <span className="text-slate-400">{m.joinType === 'referral' ? '지인추천' : '단톡방 닉네임'}</span>
                          <span className="font-bold text-[#38BDF8]">{m.joinType === 'referral' ? (m.referrer || '-') : (m.kakaoId || '-')}</span>
                        </div>
                        <div className="flex flex-col gap-2 pt-1">
                          {isPending ? (
                            <button onClick={() => handleUpdateApprovalStatus(m.id, 'approved')} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer">✔ 가입 승인하기</button>
                          ) : (
                            <button onClick={() => handleUpdateApprovalStatus(m.id, 'pending')} className="w-full py-2 bg-white/5 hover:bg-[#EC4899]/20 text-slate-400 hover:text-[#EC4899] rounded-lg text-[11px] font-semibold cursor-pointer">승인 해제(대기 전환)</button>
                          )}
                          <select value={m.role} onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)} className="w-full bg-[#0B1120] border border-white/20 text-white rounded px-3 py-2 text-xs cursor-pointer"><option value="user">일반 기사</option><option value="pro_driver">PRO 기사</option><option value="vip_driver">VIP 기사 (스카우트)</option><option value="manager">운영 직원</option><option value="super_admin">최고 관리자</option></select>
                          <button onClick={() => openAdminUserDetail(m)} className="w-full py-2.5 hp-primary-btn text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"><Search className="w-3.5 h-3.5" />상세 리포트 보기</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0B1120] text-slate-400 border-b border-white/10"><tr><th className="p-3">이름/연락처</th><th className="p-3 text-center">단톡방 닉네임 / 추천인</th><th className="p-3 text-center">승인 상태</th><th className="p-3 text-center">당월 실적 / 앱 회수액</th><th className="p-3 text-center">권한 변경</th><th className="p-3 text-right">리포트</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {displayedMembers.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-slate-500">검색 조건에 맞는 기사님이 없습니다.</td></tr> : displayedMembers.map((m) => {
                        const isAce = (m.monthlyGross || 0) >= 1500000 || (m.recordCount || 0) >= 10;
                        const isPending = m.approvalStatus === 'pending';
                        return (
                          <tr key={m.id} className={`transition-all ${isPending ? 'bg-[#EC4899]/10 hover:bg-[#EC4899]/15' : isAce ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-white/5'}`}>
                            <td className="p-3">
                              <div className="text-white font-bold flex items-center gap-1.5">
                                {m.name || '미입력'}
                                {isAce && <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] rounded font-extrabold shadow-sm">🏆 에이스</span>}
                              </div>
                              <div className="font-mono text-[#38BDF8] text-[11px] mt-1">{formatPhoneNumber(m.phone) || '번호없음'}</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${m.joinType === 'referral' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'bg-[#38BDF8]/20 text-[#38BDF8]'}`}>{m.joinType === 'referral' ? '지인추천' : '단톡방'}</span>
                              <div className="text-white font-semibold mt-1">{m.joinType === 'referral' ? (m.referrer || '-') : (m.kakaoId || '-')}</div>
                            </td>
                            <td className="p-3 text-center">
                              {isPending ? (
                                <button onClick={() => handleUpdateApprovalStatus(m.id, 'approved')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer">승인하기</button>
                              ) : (
                                <button onClick={() => handleUpdateApprovalStatus(m.id, 'pending')} className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-[#EC4899]/20 hover:text-[#EC4899] hover:border-[#EC4899]/40 rounded text-[10px] font-bold cursor-pointer">승인완료</button>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="font-bold text-white">{m.recordCount}건 · <span className="text-[#EC4899]">{(m.monthlyGross || 0).toLocaleString()}원</span></div>
                              {(m.recoveredAmount || 0) > 0 && <div className="text-emerald-400 font-bold text-[10px] mt-1">앱 회수 {(m.recoveredAmount || 0).toLocaleString()}원 ({m.recoveredCount}건)</div>}
                            </td>
                            <td className="p-3 text-center"><select value={m.role} onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)} className="bg-[#0B1120] border border-white/20 text-white rounded px-2 py-1.5 text-[11px] cursor-pointer outline-none focus:border-[#8B5CF6]"><option value="user">일반 기사</option><option value="pro_driver">PRO 기사</option><option value="vip_driver">VIP 기사 (스카우트)</option><option value="manager">운영 직원</option><option value="super_admin">최고 관리자</option></select></td>
                            <td className="p-3 text-right"><button onClick={() => openAdminUserDetail(m)} className="px-2.5 py-1.5 hp-primary-btn hover:bg-white/20 text-white rounded text-[10px] font-bold flex items-center gap-1 ml-auto cursor-pointer"><Search className="w-3 h-3" />상세</button></td>
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
                {/* 관제탑: 플랫폼 전체 누적 미수금 회수액 전광판 */}
                <div className="bg-gradient-to-r from-emerald-950/60 via-[#0B1120] to-indigo-950/60 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 탁송대리비서가 지켜낸 전체 기사님 미수금 누적 회수액</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{platformTotalRecoveredAmount.toLocaleString()}원</div>
                    <div className="text-xs text-slate-300 mt-1">총 <strong className="text-emerald-400">{platformRecoveredRecords.length}건</strong>의 미수금이 앱 정산 문자를 통해 회수 완료되었습니다.</div>
                  </div>
                  <button onClick={handleExportAdminCSV} className="w-full sm:w-auto px-4 py-2.5 bg-[#0B1120] hover:bg-white/10 border border-white/20 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0"><Download className="w-3.5 h-3.5" />전체 운행내역 CSV</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* 빠른 정산 팝업 모달 */}
      {actionRecordId && currentActionRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActionRecordId(null)}>
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setActionRecordId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><Activity className="w-4 h-4 text-[#8B5CF6]" />빠른 정산 처리</h3>
            
            <div className="bg-[#0B1120] p-4 rounded-xl border border-white/10 mb-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">{currentActionRecord.date}</span>
                <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#38BDF8] text-[10px] font-bold">{currentActionRecord.platform || '미지정'}</span>
              </div>
              <div className="text-lg font-bold text-white mb-2">{currentActionRecord.departure} ➔ {currentActionRecord.destination}</div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span className="text-xs text-slate-400">총 청구액</span>
                <span className="text-sm font-extrabold text-[#38BDF8]">{currentActionRecord.totalClaimAmount.toLocaleString()}원</span>
              </div>
              {currentActionRecord.memo && (
                <div className="mt-2 pt-2 border-t border-white/5 text-xs text-slate-300 leading-relaxed">
                  📝 {currentActionRecord.memo}
                </div>
              )}
            </div>
            
            <div className="space-y-3 mb-5">
              <button onClick={() => toggleGrossPaid(currentActionRecord.id)} className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-between px-4 transition-colors cursor-pointer border ${currentActionRecord.isGrossPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/30'}`}>
                <span className="text-xs">탁송 운임 ({currentActionRecord.grossAmount.toLocaleString()}원)</span>
                <span className="text-sm">{currentActionRecord.isGrossPaid ? '입금 취소' : '입금 확인 ✔'}</span>
              </button>
              {(currentActionRecord.fuelAmount > 0 || currentActionRecord.extraExpenseAmount > 0) && (
                <button onClick={() => toggleExpensePaid(currentActionRecord.id)} className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-between px-4 transition-colors cursor-pointer border ${currentActionRecord.isExpensePaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/30'}`}>
                  <span className="text-xs">대납 경비 ({(currentActionRecord.fuelAmount + currentActionRecord.extraExpenseAmount).toLocaleString()}원)</span>
                  <span className="text-sm">{currentActionRecord.isExpensePaid ? '입금 취소' : '입금 확인 ✔'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => { handleOpenEditModal(currentActionRecord); setActionRecordId(null); }} className="w-full sm:flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1.5 cursor-pointer"><Edit2 className="w-3.5 h-3.5" /> 전체 내역 수정</button>
              <button onClick={() => { handleDeleteSingleRecord(currentActionRecord.id); setActionRecordId(null); }} className="w-full sm:flex-1 py-3 bg-[#EC4899]/20 hover:bg-[#EC4899]/40 text-[#EC4899] rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1.5 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> 기록 삭제</button>
            </div>
          </div>
        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Edit2 className="w-4 h-4 text-[#8B5CF6]" /> 운행 내역 수정</h3><button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleUpdateRecord} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">배차 프로그램</label>
                <select value={editPlatform} onChange={(e) => { setEditPlatform(e.target.value); if (e.target.value !== '기타어플') setEditFeeRate('20'); }} className="w-full px-3 py-2.5 rounded-lg">
                  {PLATFORMS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  <option value="미지정">미지정</option>
                </select>
              </div>
              <div><label className="block text-[11px] font-semibold text-[#38BDF8] mb-1">운행 일자 변경</label><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg" required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">출발지</label><input type="text" value={editDeparture} onChange={(e) => setEditDeparture(e.target.value)} className="w-full px-3 py-2.5 rounded-lg" required /></div><div><label className="block text-[11px] font-semibold text-slate-300 mb-1">도착지</label><input type="text" value={editDestination} onChange={(e) => setEditDestination(e.target.value)} className="w-full px-3 py-2.5 rounded-lg" required /></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">운임(원)</label><input type="text" value={editGross} onChange={(e) => setEditGross(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-right" required /></div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">수수료(%)</label>
                  <input type="number" value={editFeeRate} readOnly={editPlatform !== '기타어플'} onChange={(e) => { if (editPlatform === '기타어플') setEditFeeRate(e.target.value); }} className="w-full px-3 py-2.5 rounded-lg text-right" />
                </div>
              </div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">기타 부대비용 청구 입력</label><input type="text" value={editExtra} onChange={(e) => setEditExtra(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-right" /></div>
              <div className="p-3.5 rounded-xl bg-[#0B1120] border border-white/20 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300">대납 주유비</label><input type="text" value={editFuel} onChange={(e) => setEditFuel(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-right" />
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 mt-1">
                  <button type="button" onClick={() => setEditPaymentMethod('현금')} className={`w-full sm:flex-1 py-2 rounded-md border text-[11px] font-bold cursor-pointer transition-colors ${editPaymentMethod === '현금' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm' : 'bg-transparent text-slate-400 border-white/20 hover:border-white/40'}`}>현금 결제</button>
                  <button type="button" onClick={() => setEditPaymentMethod('카드')} className={`w-full sm:flex-1 py-2 rounded-md border text-[11px] font-bold cursor-pointer transition-colors ${editPaymentMethod === '카드' ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm' : 'bg-transparent text-slate-400 border-white/20 hover:border-white/40'}`}>카드 결제</button>
                </div>
              </div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">기사 팁</label><input type="text" value={editTip} onChange={(e) => setEditTip(formatNumberWithComma(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-right" /></div>
              <div><label className="block text-[11px] font-semibold text-slate-300 mb-1">기타 사항 (이슈/메모)</label><textarea rows={2} value={editMemo} onChange={(e) => setEditMemo(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs" /></div>
              <button type="submit" className="w-full mt-2 py-3.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">수정 완료</button>
            </form>
          </div>
        </div>
      )}

      {claimModalOpen && selectedClaimRecord && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setClaimModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#8B5CF6]" />정산 청구 문자 편집 및 복사</h3>
            <p className="text-xs text-slate-400 mb-4">미입금된 내역만 자동으로 체크되어 문구가 생성됩니다. 수정한 후 복사하세요.</p>
            <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-white/10">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeGross} onChange={() => handleToggleInclude('gross')} className="rounded text-[#8B5CF6]" disabled={selectedClaimRecord.isGrossPaid} /> 기본 운임</label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeFuel} onChange={() => handleToggleInclude('fuel')} className="rounded text-[#8B5CF6]" disabled={selectedClaimRecord.fuelAmount === 0 || selectedClaimRecord.isExpensePaid} /> 주유비</label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer"><input type="checkbox" checked={includeExtra} onChange={() => handleToggleInclude('extra')} className="rounded text-[#8B5CF6]" disabled={selectedClaimRecord.extraExpenseAmount === 0 || selectedClaimRecord.isExpensePaid} /> 기타 부대비용</label>
            </div>
            <textarea rows={10} value={claimMessageText} onChange={(e) => setClaimMessageText(e.target.value)} className="w-full p-4 rounded-xl text-xs font-mono mb-4 leading-relaxed bg-[#FFFFFF] text-[#000000] focus:shadow-[0_0_12px_#8B5CF6] focus:border-[#8B5CF6] transition-all outline-none" />
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => setClaimModalOpen(false)} className="w-full sm:flex-1 py-3 bg-[#0B1120] border border-white/10 hover:bg-white/10 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors">닫기</button>
              <button onClick={handleCopyClaimMessage} className="w-full sm:flex-1 py-3 hp-primary-btn text-white font-bold rounded-lg text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"><Copy className="w-3.5 h-3.5" />복사하기</button>
            </div>
          </div>
        </div>
      )}

      {adminSelectedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-card rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setAdminSelectedUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-[#38BDF8] mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> {adminSelectedUser.name || '미상'} 기사님 상세 리포트</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-[#0B1120] p-3 rounded-lg border border-white/10 text-center"><div className="text-[10px] text-slate-400 mb-1">총 누적 운행</div><div className="font-bold text-white">{adminSelectedUser.recordCount}건</div></div>
              <div className="bg-[#0B1120] p-3 rounded-lg border border-white/10 text-center"><div className="text-[10px] text-slate-400 mb-1">당월 매출</div><div className="font-bold text-[#8B5CF6]">{(adminSelectedUser.monthlyGross || 0).toLocaleString()}원</div></div>
              <div className="bg-[#0B1120] p-3 rounded-lg border border-emerald-500/30 text-center"><div className="text-[10px] text-emerald-400 mb-1">앱 회수 미수금</div><div className="font-bold text-emerald-400">{(adminSelectedUser.recoveredAmount || 0).toLocaleString()}원</div></div>
              <div className="bg-[#0B1120] p-3 rounded-lg border border-white/10 text-center flex flex-col justify-center"><div className="text-[10px] text-slate-400 mb-1">연락처</div><div className="font-mono text-[#38BDF8] text-xs">{formatPhoneNumber(adminSelectedUser.phone) || '번호없음'}</div></div>
            </div>
            <div className="overflow-y-auto pr-2 space-y-4 flex-1 scrollbar-hide">
              <div>
                <h4 className="text-xs font-bold text-white border-b border-white/10 pb-2 mb-2">최근 운행 내역 (최대 10건)</h4>
                {adminSelectedUserRecords.map((r) => {
                  const unpaid = (!r.isGrossPaid ? r.grossAmount : 0) + (!r.isExpensePaid ? (r.fuelAmount + r.extraExpenseAmount) : 0);
                  return (
                    <div key={r.id} className="bg-[#0B1120] border border-white/10 p-3 rounded-lg text-xs mb-2">
                      <div className="flex justify-between text-slate-400 mb-1"><span>{r.date} ({r.platform || '미지정'})</span><span className={unpaid > 0 ? 'text-[#EC4899] font-bold' : 'text-emerald-400 font-bold'}>{unpaid > 0 ? `미수금 ${unpaid.toLocaleString()}원` : '전액 정산완료'}</span></div>
                      <div className="font-bold text-white mb-1">{r.departure} → {r.destination}</div>
                      {r.memo && <div className="text-[11px] text-slate-400">📝 {r.memo}</div>}
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-2xl p-6 shadow-2xl relative z-20 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><User className="w-4 h-4 text-[#8B5CF6]" />기사 프로필 및 계정 관리</h3>
            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-3.5 space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">기사 성함</span><span className="text-white font-bold">{currentUserProfile?.name || session?.user?.user_metadata?.name || '미상'}</span></div>
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">연락처</span><span className="text-[#38BDF8] font-mono font-semibold">{formatPhoneNumber(currentUserProfile?.phone || session?.user?.user_metadata?.phone || '') || '미등록'}</span></div>
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">단톡방 닉네임</span><span className="text-slate-200 font-semibold">{currentUserProfile?.kakaoId || currentUserProfile?.referrer || '-'}</span></div>
              <div className="flex justify-between items-center text-xs"><span className="text-slate-400">앱 버전</span><span className="text-emerald-400 font-mono font-bold">v{APP_VERSION}</span></div>
            </div>
            <div className="flex flex-col gap-2">
              <a href={KAKAO_CHAT_URL} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> 탁송대리비서 소통방 입장하기
              </a>
              <button onClick={() => { sessionStorage.removeItem('app_reloaded_version'); forceClearAndReload(); }} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> 최신 버전 강제 새로고침
              </button>
              <button onClick={() => setShowPrivacyModal(true)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer">개인정보 처리방침 및 탈퇴 안내</button>
              <button onClick={() => setShowProfileModal(false)} className="w-full py-2.5 hp-primary-btn font-bold rounded-lg text-xs cursor-pointer">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
