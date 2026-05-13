'use client'

import { useState } from 'react'
import { TabUsuarios, type UsuarioRow } from './tab-usuarios'
import { TabTemplates, type TemplateMap } from './tab-templates'
import { TabFunil, type FunilEtapaRow } from './tab-funil'
import { TabDestinos, type PaisData, type EscolaData } from './tab-destinos'
import { TabEmailTemplates } from './tab-email-templates'
import { TabEmailPlaceholders } from './tab-email-placeholders'
import type { EmailTemplateItem } from '@/lib/actions/email-templates'
import type { EmailPlaceholderItem } from '@/lib/actions/email-placeholders'

type Tab = 'usuarios' | 'templates' | 'funil' | 'destinos' | 'emailTemplates' | 'emailPlaceholders'

const TABS: { id: Tab; label: string }[] = [
  { id: 'usuarios',          label: 'Usuários'               },
  { id: 'templates',         label: 'Templates de Checklist'  },
  { id: 'funil',             label: 'Funil'                   },
  { id: 'destinos',          label: 'Configurações do Destino' },
  { id: 'emailTemplates',    label: 'Templates de E-mail'     },
  { id: 'emailPlaceholders', label: 'Placeholders de E-mail'  },
]

type Props = {
  usuarios:         UsuarioRow[]
  templates:        TemplateMap
  etapas:           FunilEtapaRow[]
  paises:           PaisData[]
  escolas:          EscolaData[]
  emailTemplates:   EmailTemplateItem[]
  emailPlaceholders: EmailPlaceholderItem[]
}

export function ConfiguracoesAbas({ usuarios, templates, etapas, paises, escolas, emailTemplates, emailPlaceholders }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('usuarios')

  return (
    <div>
      {/* Tab nav */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Abas de configurações">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-6 py-6 sm:px-8">
        {activeTab === 'usuarios'          && <TabUsuarios          usuarios={usuarios}  />}
        {activeTab === 'templates'         && <TabTemplates         templates={templates} />}
        {activeTab === 'funil'             && <TabFunil             etapas={etapas}      />}
        {activeTab === 'destinos'          && <TabDestinos          paises={paises} escolas={escolas} />}
        {activeTab === 'emailTemplates'    && <TabEmailTemplates    templates={emailTemplates} placeholders={emailPlaceholders} />}
        {activeTab === 'emailPlaceholders' && <TabEmailPlaceholders placeholders={emailPlaceholders} />}
      </div>
    </div>
  )
}
