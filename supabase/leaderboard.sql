-- ตารางคะแนน + กรรมการกลาง (ZenityX Game Creator Kit)
-- ใช้: Supabase → โปรเจกต์ของคุณ → SQL Editor → วางไฟล์นี้ทั้งไฟล์ → Run (ครั้งเดียวต่อโปรเจกต์)
-- 1 โปรเจกต์เก็บได้หลายเกม แยกด้วย game (= ONLINE.GAME_ID ใน public/config.js)
-- หรือบอก AI: "ต่อตารางคะแนน Supabase ให้เกมนี้ ใช้ supabase/leaderboard.sql" (ใช้ Supabase MCP)

-- กติกากรรมการของแต่ละเกม: เล่นสั้นสุดกี่วินาที · ได้คะแนนเร็วสุดกี่แต้มต่อวินาที
create table if not exists public.game_rules (
  game text primary key,
  min_seconds numeric not null default 3,
  max_points_per_second numeric not null default 150,
  bonus numeric not null default 200
);
alter table public.game_rules enable row level security;          -- ไม่มี policy = แก้ได้จาก SQL Editor/MCP เท่านั้น
revoke all on public.game_rules from anon, authenticated;

create table if not exists public.game_runs (
  id uuid primary key default gen_random_uuid(),
  game text not null,
  started_at timestamptz not null default now(),
  finished boolean not null default false
);
alter table public.game_runs enable row level security;            -- ใช้ผ่านฟังก์ชันเท่านั้น
revoke all on public.game_runs from anon, authenticated;

create table if not exists public.game_scores (
  id bigint generated always as identity primary key,
  game text not null,
  name text not null check (char_length(name) between 1 and 12),
  score int not null check (score >= 0),
  play_seconds numeric(7,1) not null,
  created_at timestamptz not null default now()
);
alter table public.game_scores enable row level security;
revoke insert, update, delete, truncate on public.game_scores from anon, authenticated;   -- เกมเขียนตรงไม่ได้
drop policy if exists "game_scores: everyone can read" on public.game_scores;
create policy "game_scores: everyone can read" on public.game_scores
  for select to anon, authenticated using (true);                                         -- แต่อ่านได้ทุกคน (หน้า Top 10)
create index if not exists game_scores_top_idx on public.game_scores (game, score desc, created_at);

-- 1) เริ่มเล่น: เซิร์ฟเวอร์จดเวลาเริ่มเอง (ผู้เล่นแก้เวลาไม่ได้)
create or replace function public.game_start(p_game text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare rid uuid;
begin
  if p_game is null or char_length(p_game) not between 1 and 40 then raise exception 'bad game'; end if;
  delete from public.game_runs where started_at < now() - interval '1 hour';
  insert into public.game_runs (game) values (p_game) returning id into rid;
  return rid;
end $$;

-- 2) จบเกม: กรรมการกลางตรวจก่อนบันทึก
create or replace function public.game_submit(p_run uuid, p_name text, p_score int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.game_runs;
  rule public.game_rules;
  secs numeric;
  max_ok numeric;
  clean text;
  my_rank int;
begin
  select * into r from public.game_runs where id = p_run for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'ไม่พบรอบเล่นนี้'); end if;
  if r.finished then return jsonb_build_object('ok', false, 'reason', 'รอบนี้ส่งคะแนนไปแล้ว'); end if;
  update public.game_runs set finished = true where id = p_run;                  -- ใช้ได้ครั้งเดียว

  select * into rule from public.game_rules where game = r.game;
  if not found then rule := row(r.game, 3, 150, 200)::public.game_rules; end if; -- ค่าเริ่มต้นถ้ายังไม่ได้ตั้ง

  secs := extract(epoch from now() - r.started_at);
  if secs > 1800 then return jsonb_build_object('ok', false, 'reason', 'รอบเล่นหมดอายุ'); end if;
  if secs < rule.min_seconds then return jsonb_build_object('ok', false, 'reason', 'เล่นสั้นเกินจริง'); end if;

  max_ok := floor(secs * rule.max_points_per_second) + rule.bonus;
  if p_score is null or p_score < 0 or p_score > max_ok then
    return jsonb_build_object('ok', false, 'reason', 'คะแนนสูงเกินจริง', 'max', max_ok);
  end if;

  clean := left(btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>]', '', 'g')), 12);
  if clean = '' then clean := 'ผู้เล่น'; end if;

  insert into public.game_scores (game, name, score, play_seconds) values (r.game, clean, p_score, round(secs, 1));
  select count(*) + 1 into my_rank from public.game_scores where game = r.game and score > p_score;
  return jsonb_build_object('ok', true, 'rank', my_rank, 'score', p_score, 'seconds', round(secs, 1));
end $$;

revoke all on function public.game_start(text) from public;
revoke all on function public.game_submit(uuid, text, int) from public;
grant execute on function public.game_start(text) to anon, authenticated;
grant execute on function public.game_submit(uuid, text, int) to anon, authenticated;

-- หน้า Top 10 อัปเดตสด
do $$ begin
  alter publication supabase_realtime add table public.game_scores;
exception when duplicate_object then null; end $$;

-- ตั้งกติกากรรมการของเกมคุณ (ให้ AI วัดจาก ?bot=1 แล้วใส่ตัวเลข):
-- insert into public.game_rules (game, min_seconds, max_points_per_second, bonus) values ('my-game', 3, 120, 200)
--   on conflict (game) do update set min_seconds = excluded.min_seconds, max_points_per_second = excluded.max_points_per_second, bonus = excluded.bonus;
-- ล้างคะแนนของเกม: delete from public.game_scores where game = 'my-game';
