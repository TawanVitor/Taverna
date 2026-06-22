-- =============================================
-- TAVERNA RPG — Call of Cthulhu 7ª edição
-- Cole este SQL no Supabase > SQL Editor > New Query
-- =============================================

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  master_id uuid references auth.users(id),
  master_email text,
  master_name text,
  description text,
  invite_code text unique default
    upper(substr(md5(random()::text),1,3)) || '-' || floor(random()*900+100)::text,
  created_at timestamptz default now()
);

create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references auth.users(id),

  -- Info básica
  name text not null default 'Investigador',
  occupation text,
  age int default 25,

  -- Características
  for_forca int default 0,
  con_constituicao int default 0,
  tam_tamanho int default 0,
  des_destreza int default 0,
  apa_aparencia int default 0,
  int_inteligencia int default 0,
  pod_poder int default 0,
  edu_educacao int default 0,
  taxa_mov int default 8,

  -- Status básicos
  pv_atual int default 0,
  pv_max int default 0,
  san_atual int default 0,
  san_max int default 0,
  sorte_atual int default 0,
  sorte_max int default 0,

  -- Perícias
  pericia_antropologia int default 1,
  pericia_armas_pistolas int default 20,
  pericia_armas_rifles int default 25,
  pericia_arqueologia int default 1,
  pericia_arremessar int default 20,
  pericia_arte_oficio int default 5,
  pericia_avaliacao int default 5,
  pericia_cavalgar int default 5,
  pericia_charme int default 15,
  pericia_chaveiro int default 1,
  pericia_ciencia int default 1,
  pericia_consertos_eletricos int default 10,
  pericia_consertos_mecanicos int default 10,
  pericia_contabilidade int default 5,
  pericia_direito int default 5,
  pericia_dirigir_auto int default 20,
  pericia_disfrace int default 5,
  pericia_encontrar int default 25,
  pericia_escalar int default 20,
  pericia_escutar int default 20,
  pericia_esquivar int default 0,
  pericia_furtividade int default 20,
  pericia_historia int default 5,
  pericia_intimidacao int default 15,
  pericia_labia int default 5,
  pericia_lingua_natural int default 0,
  pericia_lingua_outra int default 1,
  pericia_lutar_brigar int default 25,
  pericia_medicina int default 1,
  pericia_mundo_natural int default 10,
  pericia_mythos_cthulhu int default 0,
  pericia_natacao int default 20,
  pericia_navegacao int default 10,
  pericia_nivel_credito int default 0,
  pericia_ocultismo int default 5,
  pericia_operar_maquinario int default 10,
  pericia_persuasao int default 10,
  pericia_pilotar int default 1,
  pericia_prestidigitacao int default 10,
  pericia_primeiros_socorros int default 30,
  pericia_psicanalise int default 1,
  pericia_psicologia int default 10,
  pericia_rastrear int default 10,
  pericia_saltar int default 20,
  pericia_sobrevivencia int default 10,
  pericia_usar_biblioteca int default 20,

  updated_at timestamptz default now()
);

-- Segurança por linha
alter table sessions enable row level security;
alter table characters enable row level security;

-- Políticas de acesso
create policy "ver_proprias_sessoes" on sessions
  for all using (master_id = auth.uid());

create policy "jogador_gerencia_ficha" on characters
  for all using (
    user_id = auth.uid()
    or session_id in (
      select id from sessions where master_id = auth.uid()
    )
  );

-- Trigger para updated_at automático
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_characters_updated
  before update on characters
  for each row execute procedure update_updated_at();

-- Habilitar realtime nas tabelas
alter publication supabase_realtime add table characters;
alter publication supabase_realtime add table sessions;
