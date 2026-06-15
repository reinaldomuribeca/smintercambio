export const CAMPOS_SISTEMA = [
  // Dados do aluno (Lead)
  { value: 'leadNome',            label: 'Nome do aluno',              grupo: 'Aluno' },
  { value: 'leadEmail',           label: 'E-mail do aluno',            grupo: 'Aluno' },
  { value: 'leadTelefone',        label: 'Telefone do aluno',          grupo: 'Aluno' },
  { value: 'leadCidade',          label: 'Cidade do aluno',            grupo: 'Aluno' },
  { value: 'leadEstado',          label: 'Estado do aluno',            grupo: 'Aluno' },
  // Responsáveis (Diagnóstico)
  { value: 'nomeResponsaveis',    label: 'Nome dos responsáveis',      grupo: 'Responsáveis' },
  { value: 'nomePai',             label: 'Nome do pai',                grupo: 'Responsáveis' },
  { value: 'nomeMae',             label: 'Nome da mãe',                grupo: 'Responsáveis' },
  { value: 'emailResponsavel',    label: 'E-mail do responsável',      grupo: 'Responsáveis' },
  { value: 'telefoneResponsavel', label: 'Telefone do responsável',    grupo: 'Responsáveis' },
  // Programa (Diagnóstico)
  { value: 'objetivoPrograma',    label: 'Objetivo do programa',       grupo: 'Programa' },
  { value: 'duracaoMeses',        label: 'Duração em meses',           grupo: 'Programa' },
  { value: 'destinosDesejados',   label: 'Destinos desejados',         grupo: 'Programa' },
  // Jornada / Escola
  { value: 'escolaNome',          label: 'Nome da escola',             grupo: 'Jornada' },
  { value: 'paisNome',            label: 'País de destino',            grupo: 'Jornada' },
  { value: 'embarqueEm',          label: 'Data de embarque',           grupo: 'Jornada' },
  { value: 'retornoEm',           label: 'Data de retorno',            grupo: 'Jornada' },
  // Equipe
  { value: 'consultorNome',       label: 'Nome do consultor',          grupo: 'Equipe' },
] as const

export type CampoSistema = typeof CAMPOS_SISTEMA[number]['value']

export const CAMPO_LABEL: Record<CampoSistema, string> = Object.fromEntries(
  CAMPOS_SISTEMA.map((c) => [c.value, c.label])
) as Record<CampoSistema, string>

// ─── Placeholders padrão ───────────────────────────────────────────────────────
// Um placeholder pronto para cada campo do sistema. Tags em pt-BR, alinhadas com
// os exemplos exibidos no editor de template. Usado pelo seed (deixa pronto p/ uso).

export const DEFAULT_EMAIL_PLACEHOLDERS: { tag: string; label: string; campoSistema: CampoSistema }[] = [
  { tag: '{{nome_aluno}}',           label: 'Nome do aluno',           campoSistema: 'leadNome' },
  { tag: '{{email_aluno}}',          label: 'E-mail do aluno',         campoSistema: 'leadEmail' },
  { tag: '{{telefone_aluno}}',       label: 'Telefone do aluno',       campoSistema: 'leadTelefone' },
  { tag: '{{cidade_aluno}}',         label: 'Cidade do aluno',         campoSistema: 'leadCidade' },
  { tag: '{{estado_aluno}}',         label: 'Estado do aluno',         campoSistema: 'leadEstado' },
  { tag: '{{nome_responsaveis}}',    label: 'Nome dos responsáveis',   campoSistema: 'nomeResponsaveis' },
  { tag: '{{nome_pai}}',             label: 'Nome do pai',             campoSistema: 'nomePai' },
  { tag: '{{nome_mae}}',             label: 'Nome da mãe',             campoSistema: 'nomeMae' },
  { tag: '{{email_responsavel}}',    label: 'E-mail do responsável',   campoSistema: 'emailResponsavel' },
  { tag: '{{telefone_responsavel}}', label: 'Telefone do responsável', campoSistema: 'telefoneResponsavel' },
  { tag: '{{programa}}',             label: 'Objetivo do programa',    campoSistema: 'objetivoPrograma' },
  { tag: '{{duracao_meses}}',        label: 'Duração em meses',        campoSistema: 'duracaoMeses' },
  { tag: '{{destinos}}',             label: 'Destinos desejados',      campoSistema: 'destinosDesejados' },
  { tag: '{{escola}}',               label: 'Nome da escola',          campoSistema: 'escolaNome' },
  { tag: '{{pais}}',                 label: 'País de destino',         campoSistema: 'paisNome' },
  { tag: '{{data_embarque}}',        label: 'Data de embarque',        campoSistema: 'embarqueEm' },
  { tag: '{{data_retorno}}',         label: 'Data de retorno',         campoSistema: 'retornoEm' },
  { tag: '{{consultor}}',            label: 'Nome do consultor',       campoSistema: 'consultorNome' },
]
