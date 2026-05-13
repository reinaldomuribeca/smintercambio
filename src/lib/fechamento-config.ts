export type EtapaRole = 'CONSULTOR' | 'FINANCEIRO'

export type CampoDef = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'select' | 'radio'
  required?: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
}

export type EtapaDef = {
  numero: number
  titulo: string
  descricao: string
  role: EtapaRole
  campos: CampoDef[]
  podeDevolver?: boolean
  devolveParaNumero?: number
}

export const ETAPAS_DEF: EtapaDef[] = [
  {
    numero: 1,
    titulo: 'Envio do Contrato e Documentos',
    descricao: 'Enviar ao aluno/família: contrato, condições de pagamento, dados bancários e lista de documentos necessários.',
    role: 'CONSULTOR',
    campos: [
      { name: 'emailEnviadoEm', label: 'Data do envio', type: 'date', required: true },
      { name: 'destinatario', label: 'E-mail do destinatário', type: 'text', required: true, placeholder: 'email@dominio.com' },
      { name: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Itens adicionais enviados, acordos, etc.' },
    ],
  },
  {
    numero: 2,
    titulo: 'Comunicação de Pagamento ao Financeiro',
    descricao: 'Consultor comunica ao setor financeiro que o pagamento deve ser aguardado/processado.',
    role: 'CONSULTOR',
    campos: [
      { name: 'comunicadoEm', label: 'Data da comunicação', type: 'date', required: true },
      { name: 'formaPagamento', label: 'Forma de pagamento esperada', type: 'select', required: true,
        options: [
          { label: 'Transferência bancária', value: 'TRANSFERENCIA' },
          { label: 'PIX', value: 'PIX' },
          { label: 'Cartão de crédito', value: 'CARTAO' },
          { label: 'Outro', value: 'OUTRO' },
        ]},
      { name: 'valorBRL', label: 'Valor estimado (R$)', type: 'text', placeholder: '0,00' },
      { name: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Detalhes sobre o pagamento...' },
    ],
  },
  {
    numero: 3,
    titulo: 'Confirmação de Pagamento pelo Financeiro',
    descricao: 'Financeiro confirma o recebimento do pagamento e libera para o consultor prosseguir.',
    role: 'FINANCEIRO',
    podeDevolver: true,
    devolveParaNumero: 2,
    campos: [
      { name: 'pagamentoConfirmadoEm', label: 'Data da confirmação', type: 'date', required: true },
      { name: 'valorRecebidoBRL', label: 'Valor recebido (R$)', type: 'text', required: true, placeholder: '0,00' },
      { name: 'comprovante', label: 'Número / referência do comprovante', type: 'text', placeholder: 'Ex: TED 12345' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ],
  },
  {
    numero: 4,
    titulo: 'Envio de Documentação à Escola',
    descricao: 'Consultor envia os documentos do aluno à escola e aguarda confirmação de admissão.',
    role: 'CONSULTOR',
    campos: [
      { name: 'enviadoEm', label: 'Data do envio', type: 'date', required: true },
      { name: 'documentosEnviados', label: 'Documentos enviados', type: 'textarea', required: true, placeholder: 'Liste os documentos enviados...' },
      { name: 'previsaoResposta', label: 'Previsão de resposta da escola', type: 'date' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ],
  },
  {
    numero: 5,
    titulo: 'Recebimento da Confirmação e Invoice',
    descricao: 'Consultor recebe confirmação de admissão da escola e o invoice (gross ou net), encaminhando ao financeiro.',
    role: 'CONSULTOR',
    campos: [
      { name: 'confirmacaoRecebidaEm', label: 'Data do recebimento', type: 'date', required: true },
      { name: 'tipoInvoice', label: 'Tipo de invoice', type: 'radio', required: true,
        options: [
          { label: 'Gross (valor bruto)', value: 'GROSS' },
          { label: 'Net (valor líquido)', value: 'NET' },
        ]},
      { name: 'valorInvoice', label: 'Valor do invoice', type: 'text', required: true, placeholder: 'Ex: USD 5.000,00' },
      { name: 'moeda', label: 'Moeda', type: 'select', required: true,
        options: [
          { label: 'USD – Dólar americano', value: 'USD' },
          { label: 'GBP – Libra esterlina', value: 'GBP' },
          { label: 'EUR – Euro', value: 'EUR' },
          { label: 'CAD – Dólar canadense', value: 'CAD' },
          { label: 'AUD – Dólar australiano', value: 'AUD' },
          { label: 'NZD – Dólar neozelandês', value: 'NZD' },
          { label: 'Outra', value: 'OUTRA' },
        ]},
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ],
  },
  {
    numero: 6,
    titulo: 'Pagamento do Intercâmbio pelo Financeiro',
    descricao: 'Financeiro realiza o pagamento do intercâmbio à escola com base no invoice recebido.',
    role: 'FINANCEIRO',
    podeDevolver: true,
    devolveParaNumero: 5,
    campos: [
      { name: 'pagamentoRealizadoEm', label: 'Data do pagamento', type: 'date', required: true },
      { name: 'valorPagoOriginal', label: 'Valor pago (moeda original)', type: 'text', required: true, placeholder: 'Ex: 5.000,00' },
      { name: 'cambioUsado', label: 'Câmbio utilizado (R$/unidade)', type: 'text', required: true, placeholder: 'Ex: 5,87' },
      { name: 'valorBRL', label: 'Valor total em R$', type: 'text', required: true, placeholder: '0,00' },
      { name: 'comprovante', label: 'Número / referência do comprovante', type: 'text', placeholder: 'Ex: Remessa 98765' },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ],
  },
  {
    numero: 7,
    titulo: 'Carta de Aceitação',
    descricao: 'Escola confirma o pagamento e envia a carta de aceitação (offer letter) do aluno.',
    role: 'CONSULTOR',
    campos: [
      { name: 'cartaRecebidaEm', label: 'Data do recebimento', type: 'date', required: true },
      { name: 'observacoes', label: 'Observações', type: 'textarea', placeholder: 'Próximos passos, informações da escola...' },
    ],
  },
]
