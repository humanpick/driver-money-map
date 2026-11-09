-- 1. 운행 일지 테이블 생성
create table if not exists public.driving_records (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  date text not null,
  start_time text,
  end_time text,
  departure text not null,
  destination text not null,
  gross_amount numeric not null default 0,
  fee_rate numeric not null default 20,
  fuel_amount numeric not null default 0,
  extra_expense_amount numeric not null default 0,
  tip_amount numeric not null default 0,
  receipt_image text,
  is_paid boolean not null default false,
  net_amount numeric not null default 0,
  total_claim_amount numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 일반 경비 장부 테이블 생성
create table if not exists public.expenses (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  date text not null,
  category text not null,
  amount numeric not null default 0,
  memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Row Level Security(RLS) 활성화 (본인 데이터만 조회/수정/삭제 가능하도록 보안 설정)
alter table public.driving_records enable row level security;
alter table public.expenses enable row level security;

-- driving_records 보안 정책 생성
create policy "Users can manage their own driving records"
  on public.driving_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- expenses 보안 정책 생성
create policy "Users can manage their own expenses"
  on public.expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
