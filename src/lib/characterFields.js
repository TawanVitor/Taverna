// Características base do investigador (Call of Cthulhu 7ª ed.)
export const CARACTERISTICAS = [
  { key: 'for_forca',       label: 'FOR', full: 'Força' },
  { key: 'con_constituicao',label: 'CON', full: 'Constituição' },
  { key: 'tam_tamanho',     label: 'TAM', full: 'Tamanho' },
  { key: 'des_destreza',    label: 'DES', full: 'Destreza' },
  { key: 'apa_aparencia',   label: 'APA', full: 'Aparência' },
  { key: 'int_inteligencia',label: 'INT', full: 'Inteligência' },
  { key: 'pod_poder',       label: 'POD', full: 'Poder' },
  { key: 'edu_educacao',    label: 'EDU', full: 'Educação' },
  { key: 'taxa_mov',        label: 'MOV', full: 'Taxa de Mov.' },
]

// Status básicos com máximo
export const STATUS = [
  { key: 'pv',     label: 'Pontos de Vida', color: '#c0392b', icon: '❤' },
  { key: 'san',    label: 'Sanidade',       color: '#8e44ad', icon: '🧠' },
  { key: 'sorte',  label: 'Sorte',          color: '#c9922a', icon: '✦' },
]

// Perícias agrupadas por categoria
export const PERICIAS_GRUPOS = [
  {
    grupo: 'Combate',
    pericias: [
      { key: 'pericia_lutar_brigar',   label: 'Lutar (Brigar)',         base: 25 },
      { key: 'pericia_armas_pistolas', label: 'Armas de Fogo (Pistolas)', base: 20 },
      { key: 'pericia_armas_rifles',   label: 'Armas de Fogo (Rifles)', base: 25 },
      { key: 'pericia_arremessar',     label: 'Arremessar',             base: 20 },
      { key: 'pericia_esquivar',       label: 'Esquivar',               base: 0, calculado: 'des/2' },
    ],
  },
  {
    grupo: 'Movimento & Físico',
    pericias: [
      { key: 'pericia_escalar',    label: 'Escalar',    base: 20 },
      { key: 'pericia_saltar',     label: 'Saltar',     base: 20 },
      { key: 'pericia_natacao',    label: 'Natação',    base: 20 },
      { key: 'pericia_furtividade',label: 'Furtividade',base: 20 },
      { key: 'pericia_cavalgar',   label: 'Cavalgar',   base: 5  },
    ],
  },
  {
    grupo: 'Social & Influência',
    pericias: [
      { key: 'pericia_charme',      label: 'Charme',      base: 15 },
      { key: 'pericia_intimidacao', label: 'Intimidação', base: 15 },
      { key: 'pericia_labia',       label: 'Lábia',       base: 5  },
      { key: 'pericia_persuasao',   label: 'Persuasão',   base: 10 },
      { key: 'pericia_psicologia',  label: 'Psicologia',  base: 10 },
    ],
  },
  {
    grupo: 'Conhecimento & Ciência',
    pericias: [
      { key: 'pericia_historia',      label: 'História',        base: 5  },
      { key: 'pericia_ciencia',       label: 'Ciência',         base: 1  },
      { key: 'pericia_medicina',      label: 'Medicina',        base: 1  },
      { key: 'pericia_ocultismo',     label: 'Ocultismo',       base: 5  },
      { key: 'pericia_arqueologia',   label: 'Arqueologia',     base: 1  },
      { key: 'pericia_antropologia',  label: 'Antropologia',    base: 1  },
      { key: 'pericia_mythos_cthulhu',label: 'Mythos de Cthulhu', base: 0 },
      { key: 'pericia_mundo_natural', label: 'Mundo Natural',   base: 10 },
      { key: 'pericia_direito',       label: 'Direito',         base: 5  },
      { key: 'pericia_contabilidade', label: 'Contabilidade',   base: 5  },
    ],
  },
  {
    grupo: 'Investigação',
    pericias: [
      { key: 'pericia_encontrar',      label: 'Encontrar',        base: 25 },
      { key: 'pericia_escutar',        label: 'Escutar',          base: 20 },
      { key: 'pericia_usar_biblioteca',label: 'Usar Biblioteca',  base: 20 },
      { key: 'pericia_rastrear',       label: 'Rastrear',         base: 10 },
      { key: 'pericia_navegacao',      label: 'Navegação',        base: 10 },
      { key: 'pericia_avaliacao',      label: 'Avaliação',        base: 5  },
    ],
  },
  {
    grupo: 'Técnico & Prático',
    pericias: [
      { key: 'pericia_primeiros_socorros',  label: 'Primeiros Socorros',  base: 30 },
      { key: 'pericia_consertos_eletricos', label: 'Consertos Elétricos', base: 10 },
      { key: 'pericia_consertos_mecanicos', label: 'Consertos Mecânicos', base: 10 },
      { key: 'pericia_operar_maquinario',   label: 'Operar Maquinário',   base: 10 },
      { key: 'pericia_dirigir_auto',        label: 'Dirigir Auto',        base: 20 },
      { key: 'pericia_pilotar',             label: 'Pilotar',             base: 1  },
      { key: 'pericia_chaveiro',            label: 'Chaveiro',            base: 1  },
      { key: 'pericia_prestidigitacao',     label: 'Prestidigitação',     base: 10 },
    ],
  },
  {
    grupo: 'Artes & Ofícios',
    pericias: [
      { key: 'pericia_arte_oficio',   label: 'Arte/Ofício',     base: 5  },
      { key: 'pericia_disfrace',      label: 'Disfarce',        base: 5  },
      { key: 'pericia_psicanalise',   label: 'Psicanálise',     base: 1  },
      { key: 'pericia_sobrevivencia', label: 'Sobrevivência',   base: 10 },
      { key: 'pericia_nivel_credito', label: 'Nível de Crédito',base: 0  },
    ],
  },
  {
    grupo: 'Idiomas',
    pericias: [
      { key: 'pericia_lingua_natural', label: 'Língua Natural', base: 0, calculado: 'edu' },
      { key: 'pericia_lingua_outra',   label: 'Língua [Outra]', base: 1  },
    ],
  },
]

// Todos as perícias em lista plana (útil para forms)
export const TODAS_PERICIAS = PERICIAS_GRUPOS.flatMap(g => g.pericias)

// Valores default de um personagem novo
export const CHARACTER_DEFAULTS = {
  name: '',
  occupation: '',
  age: 25,
  for_forca: 0,
  con_constituicao: 0,
  tam_tamanho: 0,
  des_destreza: 0,
  apa_aparencia: 0,
  int_inteligencia: 0,
  pod_poder: 0,
  edu_educacao: 0,
  taxa_mov: 8,
  pv_atual: 0,
  pv_max: 0,
  san_atual: 0,
  san_max: 0,
  sorte_atual: 0,
  sorte_max: 0,
  ...Object.fromEntries(TODAS_PERICIAS.map(p => [p.key, p.base])),
}
