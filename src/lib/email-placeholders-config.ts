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
