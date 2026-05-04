# ZapFaturamento

Descubra quanto seu WhatsApp esta faturando de verdade.

SaaS para agencias, prestadores, afiliados e operacoes que vendem por
WhatsApp. O fluxo principal e:

`Anuncio -> /w/[slug] -> lead -> CRM/Kanban -> venda -> dashboard -> ROAS`

## O que o sistema faz

- Captura UTMs e identificadores de clique em `/w/[slug]`
- Dispara Meta Pixel, GTM, GA4 e Google Ads
- Envia `Lead` pela Meta CAPI quando configurada
- Salva cada lead no banco interno
- Envia para a Kommo quando o cliente usa CRM
- Atualiza Kanban e faturamento
- Consolida investimento, leads e vendas em dashboard de performance

## Rotas principais

- `/login`
- `/dashboard`
- `/dashboard/kanban`
- `/dashboard/performance`
- `/dashboard/investimentos`
- `/dashboard/clinicas`
- `/dashboard/academia`
- `/w/[slug]`

## Instalacao

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env.local` com base em `.env.example`.

3. Rode localmente:

```bash
npm run dev
```

## Variaveis de ambiente

Obrigatorias:

```env
DATABASE_URL=
DASHBOARD_PASSWORD=
```

Opcionais para clientes com Kommo:

```env
KOMMO_SUBDOMAIN=
KOMMO_LONG_LIVED_TOKEN=
KOMMO_BASE_URL=
DEFAULT_KOMMO_PIPELINE_ID=
DEFAULT_KOMMO_STATUS_ID=
```

Observacoes:

- `DATABASE_URL` e obrigatoria para persistir clientes, leads, usuarios,
  investimentos e Kanban.
- `DASHBOARD_PASSWORD` libera o login administrativo inicial.
- As variaveis da Kommo so sao necessarias para clientes com CRM ativo.
- Clientes sem Kommo continuam funcionando normalmente sem essas variaveis.

## Banco de dados

Banco recomendado para producao na Vercel: Postgres compativel com
`DATABASE_URL`.

Migrations atuais:

```text
database/migrations/001_create_whatsapp_leads.sql
database/migrations/002_create_clients.sql
database/migrations/003_extend_clients_and_leads.sql
database/migrations/004_saas_core.sql
database/migrations/005_meta_capi_and_logo_support.sql
```

Para executar:

```bash
npm run db:migrate
```

Principais tabelas:

- `clients`
- `whatsapp_leads`
- `ad_spend`
- `users`

## Login e multiusuario

Perfis:

- `agency_admin`: ve tudo, cria clientes e cria usuarios
- `client_user`: ve apenas os dados do proprio cliente

Fluxo inicial:

1. Defina `DASHBOARD_PASSWORD`.
2. Entre em `/login`.
3. Crie usuarios reais em `/dashboard/usuarios`.
4. Opcionalmente mantenha a senha administrativa apenas como bootstrap.

Senhas de usuarios sao salvas com `bcryptjs`.

## Cadastro de cliente

Use `/dashboard/clinicas` para listar clientes e `/dashboard/clinicas/nova`
para cadastrar um novo.

Cada cliente pode ter:

- nome
- slug
- logo
- WhatsApp
- mensagem padrao
- Meta Pixel
- Meta CAPI
- GTM
- GA4
- Google Ads
- Kommo opcional
- status ativo/inativo

O redirect sempre prioriza clientes salvos no banco. Se nao encontrar no banco,
usa fallback de `lib/clients.ts`.

## Logos dos clientes

No campo de logo, voce pode usar:

- URL direta de imagem
- link publico do Google Drive

Formatos aceitos e convertidos automaticamente:

- `https://drive.google.com/file/d/ID/view`
- `https://drive.google.com/open?id=ID`
- `https://drive.google.com/uc?id=ID`

O sistema converte para o formato:

```text
https://drive.google.com/uc?export=view&id=ID
```

Se a imagem falhar:

- o formulario mostra um aviso
- o sistema usa placeholder com as iniciais do cliente
- nenhuma tela exibe icone quebrado

Observacao:

- para logos, use URL direta de imagem ou link publico do Google Drive. O
  sistema tenta converter links do Drive automaticamente.

## Como cadastrar cliente com Kommo

1. Acesse `/dashboard/clinicas/nova`.
2. Preencha Identidade, WhatsApp e Tracking.
3. Em CRM, selecione `Usa Kommo/CRM`.
4. Informe:
   - `Kommo Pipeline ID`
   - `Kommo Status ID`
   - IDs de campos personalizados que quiser mapear
5. Salve.

Resultado:

- o lead sempre e salvo no banco interno
- se a Meta CAPI estiver configurada, o evento `Lead` tambem e enviado
  server-side
- a Kommo recebe o lead antes do redirect, com timeout controlado
- o redirect nunca trava
- o Kanban pode ser automatizado por webhook

## Como cadastrar cliente sem Kommo

1. Acesse `/dashboard/clinicas/nova`.
2. Preencha Identidade, WhatsApp e Tracking.
3. Em CRM, selecione `Sem CRM`.
4. Salve.

Resultado:

- o lead continua sendo salvo no banco
- Pixel, GTM, GA4 e Google Ads continuam funcionando
- a Meta CAPI continua funcionando se estiver configurada
- o Kanban pode ser movimentado manualmente
- `kommo_status` fica como `disabled`
- o redirect segue normal para o WhatsApp

## Meta CAPI / API de Conversoes

No cadastro do cliente existe a secao:

`Meta Ads - Pixel + API de Conversoes`

Campos:

- `Meta Pixel ID`
- `Meta Access Token da CAPI`
- `Test Event Code`

Regras:

- o Access Token e salvo apenas no backend/banco
- o token nao aparece novamente no front-end depois de salvo
- o token nao entra em logs de producao
- se a Meta falhar, o redirect continua normalmente

Fluxo:

1. o browser dispara Pixel
2. o backend salva o lead
3. o backend envia `Lead` para a Meta CAPI, se configurada
4. o backend tenta Kommo, se habilitada
5. o usuario segue para o WhatsApp sem travar

Deduplicacao:

- o sistema gera um `event_id` unico por lead
- o mesmo `event_id` e usado no browser Pixel e na CAPI server-side

## Redirect /w/[slug]

Ao acessar `/w/[slug]`, o sistema:

1. busca o cliente no banco
2. cai para `lib/clients.ts` se nao encontrar
3. verifica se o cliente esta ativo
4. captura UTMs, `fbclid`, `gclid`, criativo, publico e campanha
5. dispara tracking
6. salva o lead interno
7. envia Meta CAPI, se configurada
8. envia para Kommo, se habilitada
9. espera no maximo 2 segundos pela API
10. redireciona para o WhatsApp

O usuario nunca deve ficar travado.

## Kanban

Rota:

```text
/dashboard/kanban
```

Etapas:

- `novo_lead`
- `em_atendimento`
- `agendado`
- `compareceu`
- `negociacao`
- `pagamento_pendente`
- `pago`
- `finalizado`
- `perdido`

Regras:

- Sem Kommo: movimentacao manual
- Com Kommo: atualizacao automatica via `/api/webhooks/kommo`
- Ao mover para `pago`, o sistema pede valor pago e salva faturamento

## Dashboard de performance

Rota:

```text
/dashboard/performance
```

Metricas por campanha, criativo e publico:

- impressoes
- leads
- investimento
- CPL
- agendados
- compareceram
- fechados
- faturamento
- ticket medio
- taxa de agendamento
- taxa de comparecimento
- taxa de conversao
- ROAS

Formulas:

- `CPL = investimento / leads`
- `ROAS = faturamento / investimento`
- `Ticket medio = faturamento / fechados`

## Investimentos

Rota:

```text
/dashboard/investimentos
```

Cadastre por campanha:

- campanha
- criativo
- publico
- impressoes
- investimento

Esses dados alimentam CPL e ROAS.

## Meta Ads

Configuracao recomendada:

- Campanha: Trafego
- Configuracao: Manual
- Destino: Site
- Otimizacao: Conversas
- Link final: `/w/[slug]`

Padrao de UTMs:

```text
utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}
```

O painel mostra um botao para copiar esse modelo.

## Google Ads

Cenario com landing page:

```text
https://seudominio.com/w/[slug]?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gclid={gclid}&device={device}&network={network}&matchtype={matchtype}
```

Cenario sem landing page:

```text
https://seudominio.com/w/[slug]
```

Padrao de UTMs Google:

```text
utm_source=google
utm_medium=cpc
utm_campaign={campaignid}
utm_content={creative}
utm_term={keyword}
gclid={gclid}
device={device}
network={network}
matchtype={matchtype}
```

## Academia

Rota:

```text
/dashboard/academia
```

Modulos atuais:

1. Como usar o sistema
2. Como criar campanha Meta Ads
3. Como criar campanha Google Ads
4. Como configurar Pixel
5. Como configurar a API de Conversoes da Meta
6. Como configurar GTM
7. Como configurar GA4
8. Como usar UTMs
9. Como configurar logos dos clientes
10. Como analisar performance

## Como testar o sistema

### Redirect

Exemplo Meta:

```text
/w/cliente-exemplo?utm_source=facebook&utm_medium=cpc&utm_campaign=teste_meta&utm_content=criativo_01&utm_term=publico_01&fbclid=123
```

Exemplo Google:

```text
/w/cliente-exemplo?utm_source=google&utm_medium=cpc&utm_campaign=teste_google&utm_content=criativo_google&utm_term=keyword_google&gclid=123&device=m&network=s&matchtype=e
```

Confirme:

- a pagina intermediaria abriu
- houve espera de alguns segundos
- o WhatsApp recebeu a mensagem com dados da campanha
- o lead entrou no dashboard

### Logos do Google Drive

1. Copie um link publico do Drive no campo de logo do cliente
2. Veja se a previa do formulario carrega
3. Salve o cliente
4. Confira a logo em:
   - `/dashboard/clinicas`
   - `/dashboard/clinicas/[id]`
   - `/w/[slug]`

Se nao abrir, o sistema exibe as iniciais do cliente e um aviso no formulario.

### Meta Pixel

Use o Meta Pixel Helper e confirme:

- `PageView`
- `whatsapp_redirect_page_view`
- `whatsapp_lead_click`
- `Lead`

### Meta CAPI

1. Entre no Gerenciador de Eventos da Meta
2. Selecione o Pixel
3. Abra `Configuracoes`
4. Gere o Access Token da API de Conversoes
5. Preencha `Pixel ID`, `Access Token` e `Test Event Code` no cliente
6. Abra `/w/[slug]` com UTMs
7. Confira se o evento `Lead` chegou via `Browser` e `Server`
8. Confirme a deduplicacao pelo `event_id`

### GTM

Use o Preview do GTM e confirme:

- `whatsapp_redirect_page_view`
- `whatsapp_redirect`

### GA4

Use o DebugView do GA4 e confirme:

- `whatsapp_redirect_page_view`
- `whatsapp_lead_click`

## Compatibilidade com clientes antigos

`lib/clients.ts` continua existindo como fallback.

Migracao recomendada:

1. Crie o cliente pelo painel
2. Repita os dados do fallback antigo
3. Salve
4. O banco passa a ter prioridade

## Deploy

Fluxo recomendado:

```bash
npm run typecheck
npm run build
npm run db:migrate
```

Depois publique na Vercel e replique as variaveis de ambiente.

## Observacoes finais

- A landing antiga nao faz parte deste projeto.
- O foco aqui e o SaaS ZapFaturamento.
- Tokens da Kommo e da Meta CAPI nunca devem ir para o front-end.
- Logs de producao nao devem expor segredos.
- O redirect continua rapido mesmo se Meta ou Kommo falharem.
