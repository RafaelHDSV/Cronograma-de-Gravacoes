import { defineInstitucionalConfig } from '@vieira/institucional'

/**
 * Host documentado em `.env.example` (`RENDER_APP_URL`).
 * `VITE_PUBLIC_URL` substitui se o serviço no Render usar outro nome.
 */
const publicUrl = (
  import.meta.env.VITE_PUBLIC_URL || 'https://cronograma-gravacoes.onrender.com'
).replace(/\/$/, '')

export const institucionalConfig = defineInstitucionalConfig({
  appName: 'Cronograma de Gravações',
  appSlug: 'gravacoes',
  publicUrl,
  hasAccount: false,
  legalPages: true,
  legalVersion: '2026-10-25',
  description: 'o painel interno do cronograma de gravações da equipe',
  dataInventory: [
    {
      group: 'Cronograma da equipe',
      items: [
        'nomes das pessoas do catálogo',
        'tópicos, datas, horários e status das sessões',
        'notas escritas na sessão'
      ],
      purpose: 'mostrar e organizar as gravações da equipe',
      basis: 'legitimo_interesse'
    },
    {
      group: 'Modo editor',
      items: [
        'senha compartilhada da equipe, conferida no servidor e não gravada no navegador',
        'token de sessão do editor neste navegador'
      ],
      purpose: 'restringir quem altera datas, status e notas',
      basis: 'legitimo_interesse'
    }
  ],
  processors: [
    { name: 'Render', purpose: 'hospedagem do site e da API' },
    { name: 'Supabase', purpose: 'banco das sessões e da ordem de tópicos por pessoa' },
    { name: 'Vieira Analytics', purpose: 'contagem anônima de visitas' },
    { name: 'Google Fonts', purpose: 'arquivos de fonte carregados na página' },
    {
      name: 'Sentry',
      purpose: 'registro de erros técnicos do painel, sem e-mail, IP, senha ou notas'
    }
  ],
  domainNotices: [
    'O painel é de uso da equipe. Os nomes vêm do catálogo mantido pelo responsável, não de um cadastro feito pela própria pessoa.',
    'Não há conta individual. O modo editor é uma senha compartilhada e um token neste navegador.'
  ]
})
