'use client'

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LogOut,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import styles from './Admin.module.css'

/* =========================================================
   BELO CÃO

   ADMIN — DASHBOARD

   PREMIUM · CLEAN · EMPRESARIAL
   ROXO + BRANCO
   ========================================================= */

/* =========================================================
   TIPOS
   ========================================================= */

type StatusPedido =
  | 'recebido'
  | 'confirmado'
  | 'em_preparo'
  | 'saiu_para_entrega'
  | 'concluido'
  | 'cancelado'

type ResolucaoEstoque =
  | 'pendente'
  | 'devolvido'
  | 'nao_devolver'

type Pedido = {
  id: string
  numeroPedido: string
  status: StatusPedido
  cliente: {
    nome: string
    telefone: string
  }
  total: number
  criadoEm: string
  precisaAtencao: boolean
  resolucaoEstoque: ResolucaoEstoque
}

type DashboardApi = {
  sucesso?: boolean

  hoje?: {
    pedidos?: number
    faturamento?: number
    ticketMedio?: number
    cancelamentos?: number
    taxaCancelamento?: number
    aguardando?: number
    emAndamento?: number
  }

  operacao?: {
    totalPedidos?: number
    aguardando?: number
    emAndamento?: number
    concluidos?: number
    cancelados?: number
    faturamentoTotal?: number
    taxaConclusao?: number
  }

  clientes?: {
    total?: number
    comPedidos?: number
    semPedidos?: number
  }

  pendencias?: {
    total?: number
    aguardando?: number
    estoque?: number
  }
}

type PedidosApi = {
  sucesso?: boolean
  pedidos?: unknown[]
  data?: unknown[]
  totalPedidos?: number
  valorTotal?: number

  pendencias?: {
    total?: number
    pedidos?: unknown[]
  }
}

/* =========================================================
   HELPERS
   ========================================================= */

function texto(valor: unknown): string {
  if (typeof valor === 'string') {
    return valor.trim()
  }

  if (
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  ) {
    return String(valor)
  }

  return ''
}

/*
 * IMPORTANTE:
 * Não usar "numero" como nome deste helper.
 * A versão anterior entrou em conflito com uma variável
 * usada na normalização do pedido.
 */
function converterNumero(valor: unknown): number {
  if (typeof valor === 'number') {
    return Number.isFinite(valor)
      ? valor
      : 0
  }

  if (typeof valor === 'string') {
    const valorLimpo = valor
      .replace(/R\$/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')

    const resultado = Number(valorLimpo)

    return Number.isFinite(resultado)
      ? resultado
      : 0
  }

  return 0
}

function normalizarStatus(
  valor: unknown,
): StatusPedido {
  const status = texto(valor)

  if (
    status === 'recebido' ||
    status === 'confirmado' ||
    status === 'em_preparo' ||
    status === 'saiu_para_entrega' ||
    status === 'concluido' ||
    status === 'cancelado'
  ) {
    return status
  }

  return 'recebido'
}

/*
 * Mantém compatibilidade com:
 *
 * - resolucaoEstoque
 * - stock_resolution
 * - stock_restored
 *
 * Assim o dashboard consegue interpretar corretamente
 * pedidos cancelados cuja devolução de estoque já foi feita.
 */
function normalizarResolucaoEstoque(
  valor: unknown,
  estoqueRestaurado?: unknown,
): ResolucaoEstoque {
  const resolucao = texto(valor)

  if (resolucao === 'devolvido') {
    return 'devolvido'
  }

  if (resolucao === 'nao_devolver') {
    return 'nao_devolver'
  }

  if (estoqueRestaurado === true) {
    return 'devolvido'
  }

  return 'pendente'
}

/* =========================================================
   NORMALIZA PEDIDO
   ========================================================= */

function normalizarPedido(
  valor: unknown,
): Pedido {
  const item =
    valor &&
    typeof valor === 'object'
      ? (valor as Record<string, unknown>)
      : {}

  const cliente =
    item.cliente &&
    typeof item.cliente === 'object'
      ? (item.cliente as Record<string, unknown>)
      : {}

  const numeroPedido =
    texto(item.numeroPedido) ||
    texto(item.order_number) ||
    texto(item.numero) ||
    texto(item.id)

  const status = normalizarStatus(
    item.status,
  )

  const resolucaoEstoque =
    normalizarResolucaoEstoque(
      item.resolucaoEstoque ??
        item.stock_resolution,
      item.stock_restored,
    )

  const precisaAtencao =
    status === 'cancelado' &&
    resolucaoEstoque === 'pendente'

  return {
    id:
      texto(item.id) ||
      numeroPedido,

    numeroPedido,

    status,

    cliente: {
      nome:
        texto(cliente.nome) ||
        texto(item.customer_name) ||
        'Cliente não identificado',

      telefone:
        texto(cliente.telefone) ||
        texto(item.customer_whatsapp) ||
        '',
    },

    total: converterNumero(
      item.total ??
        item.valorTotal ??
        item.total_amount,
    ),

    criadoEm:
      texto(item.criadoEm) ||
      texto(item.created_at) ||
      new Date().toISOString(),

    precisaAtencao,

    resolucaoEstoque,
  }
}

/* =========================================================
   FORMATAÇÃO
   ========================================================= */

function formatarMoeda(
  valor: number,
): string {
  return valor.toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  )
}

function formatarData(
  valor: string,
): string {
  const data = new Date(valor)

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return 'Data indisponível'
  }

  return data.toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function formatarNumeroPedido(
  valor: string,
): string {
  const numeroPedido = texto(valor)

  if (!numeroPedido) {
    return 'Pedido'
  }

  if (
    numeroPedido.startsWith('#')
  ) {
    return numeroPedido
  }

  return `#${numeroPedido}`
}

function nomeStatus(
  status: StatusPedido,
): string {
  const nomes: Record<
    StatusPedido,
    string
  > = {
    recebido: 'Recebido',
    confirmado: 'Confirmado',
    em_preparo: 'Em preparo',
    saiu_para_entrega:
      'Saiu para entrega',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  }

  return nomes[status]
}

function statusClasse(
  status: StatusPedido,
): string {
  return (
    styles[
      `status_${status}`
    ] || styles.status
  )
}

/* =========================================================
   PAGE
   ========================================================= */

export default function AdminPage() {
  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardApi | null>(
    null,
  )

  const [
    todosPedidos,
    setTodosPedidos,
  ] = useState<Pedido[]>([])

  const [
    carregando,
    setCarregando,
  ] = useState(true)

  const [
    atualizando,
    setAtualizando,
  ] = useState(false)

  const [
    erro,
    setErro,
  ] = useState('')

  /* =======================================================
     CARREGAR DADOS
     ======================================================= */

  const carregarDashboard =
    useCallback(
      async (
        silencioso = false,
      ) => {
        try {
          if (silencioso) {
            setAtualizando(true)
          } else {
            setCarregando(true)
          }

          setErro('')

          const [
            respostaDashboard,
            respostaPedidos,
          ] = await Promise.all([
            fetch(
              '/api/admin/dashboard',
              {
                method: 'GET',
                headers: {
                  Accept:
                    'application/json',
                },
                cache: 'no-store',
              },
            ),

            fetch(
              '/api/admin/pedidos?limit=100',
              {
                method: 'GET',
                headers: {
                  Accept:
                    'application/json',
                },
                cache: 'no-store',
              },
            ),
          ])

          if (
            !respostaDashboard.ok
          ) {
            const dados =
              await respostaDashboard
                .json()
                .catch(
                  () => null,
                )

            throw new Error(
              dados?.message ||
                dados?.erro ||
                'Não foi possível carregar o dashboard.',
            )
          }

          if (
            !respostaPedidos.ok
          ) {
            const dados =
              await respostaPedidos
                .json()
                .catch(
                  () => null,
                )

            throw new Error(
              dados?.message ||
                dados?.erro ||
                'Não foi possível carregar os pedidos.',
            )
          }

          const jsonDashboard =
            (await respostaDashboard.json()) as DashboardApi

          const jsonPedidos =
            (await respostaPedidos.json()) as PedidosApi

          const pedidosPrincipais =
            (
              jsonPedidos.pedidos ??
              jsonPedidos.data ??
              []
            ).map(
              normalizarPedido,
            )

          const pedidosPendencias =
            (
              jsonPedidos
                .pendencias
                ?.pedidos ?? []
            ).map(
              normalizarPedido,
            )

          /*
           * Pedidos cancelados com estoque pendente
           * podem estar fora dos últimos 100.
           *
           * Junta as duas fontes pelo ID.
           */
          const mapa =
            new Map<string, Pedido>()

          pedidosPrincipais.forEach(
            (pedido) => {
              mapa.set(
                pedido.id,
                pedido,
              )
            },
          )

          pedidosPendencias.forEach(
            (pedido) => {
              mapa.set(
                pedido.id,
                pedido,
              )
            },
          )

          const pedidos =
            Array.from(
              mapa.values(),
            ).sort(
              (a, b) =>
                new Date(
                  b.criadoEm,
                ).getTime() -
                new Date(
                  a.criadoEm,
                ).getTime(),
            )

          setDashboard(
            jsonDashboard,
          )

          setTodosPedidos(
            pedidos,
          )
        } catch (error) {
          console.error(
            'Erro ao carregar dashboard:',
            error,
          )

          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o dashboard.',
          )
        } finally {
          setCarregando(false)
          setAtualizando(false)
        }
      },
      [],
    )

  /* =======================================================
     INICIALIZAÇÃO
     ======================================================= */

  useEffect(() => {
    carregarDashboard()
  }, [
    carregarDashboard,
  ])

  /* =======================================================
     ATUALIZAÇÃO AUTOMÁTICA
     ======================================================= */

  useEffect(() => {
    const intervalo =
      window.setInterval(
        () => {
          carregarDashboard(
            true,
          )
        },
        30000,
      )

    return () =>
      window.clearInterval(
        intervalo,
      )
  }, [
    carregarDashboard,
  ])

  /* =======================================================
     AÇÕES
     ======================================================= */

  const abrirSite =
    useCallback(() => {
      window.open(
        '/',
        '_blank',
        'noopener,noreferrer',
      )
    }, [])

  const sair =
    useCallback(() => {
      window.location.href =
        '/admin/login'
    }, [])

  /* =======================================================
     PEDIDOS LOCAIS
     ======================================================= */

  const pedidosAtencao =
    useMemo(
      () =>
        todosPedidos.filter(
          (pedido) =>
            pedido.status ===
              'cancelado' &&
            pedido.resolucaoEstoque ===
              'pendente',
        ),
      [todosPedidos],
    )

  const pedidosConcluidos =
    useMemo(
      () =>
        todosPedidos.filter(
          (pedido) =>
            pedido.status ===
            'concluido',
        ),
      [todosPedidos],
    )

  /* =======================================================
     DADOS DO DASHBOARD
     ======================================================= */

  const hoje =
    dashboard?.hoje ?? {}

  const operacao =
    dashboard?.operacao ?? {}

  const clientes =
    dashboard?.clientes ?? {}

  const pendencias =
    dashboard?.pendencias ?? {}

  const pedidosHoje =
    converterNumero(
      hoje.pedidos,
    )

  const faturamentoHoje =
    converterNumero(
      hoje.faturamento,
    )

  const ticketMedio =
    converterNumero(
      hoje.ticketMedio,
    )

  const cancelamentosHoje =
    converterNumero(
      hoje.cancelamentos,
    )

  const taxaCancelamento =
    converterNumero(
      hoje.taxaCancelamento,
    )

  const aguardando =
    converterNumero(
      hoje.aguardando ??
        operacao.aguardando,
    )

  const emAndamento =
    converterNumero(
      hoje.emAndamento ??
        operacao.emAndamento,
    )

  const concluidos =
    converterNumero(
      operacao.concluidos,
    ) ||
    pedidosConcluidos.length

  const cancelados =
    converterNumero(
      operacao.cancelados,
    )

  const taxaConclusao =
    converterNumero(
      operacao.taxaConclusao,
    )

  const totalClientes =
    converterNumero(
      clientes.total,
    )

  const clientesComPedidos =
    converterNumero(
      clientes.comPedidos,
    )

  const clientesSemPedidos =
    converterNumero(
      clientes.semPedidos,
    )

  const totalPendencias =
    converterNumero(
      pendencias.total,
    )

  const pendenciasAguardando =
    converterNumero(
      pendencias.aguardando,
    )

  const pendenciasEstoque =
    converterNumero(
      pendencias.estoque,
    )

  /*
   * Mantém os pedidos com estoque pendente
   * separados dos pedidos aguardando ação.
   *
   * Evita esconder decisões diferentes em uma
   * única métrica operacional.
   */
  const totalAtencoes =
    pedidosAtencao.length

  const totalAcaoImediata =
    Math.max(
      aguardando,
      pendenciasAguardando,
    )

  const quantidadeItensAtencao =
    totalAtencoes +
    totalAcaoImediata

  /* =======================================================
     PEDIDOS RECENTES
     ======================================================= */

  const pedidosRecentes =
    useMemo(
      () =>
        todosPedidos.slice(
          0,
          6,
        ),
      [todosPedidos],
    )

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main className={styles.page}>
      <div
        className={styles.container}
      >
        {/* =================================================
            HEADER
            ================================================= */}

        <header
          className={styles.header}
        >
          <div
            className={
              styles.headerPrincipal
            }
          >
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                BELO CÃO · ADMIN
              </span>

              <h1
                className={
                  styles.titulo
                }
              >
                Visão geral
              </h1>

              <p
                className={
                  styles.subtitulo
                }
              >
                {new Date().toLocaleDateString(
                  'pt-BR',
                  {
                    weekday:
                      'long',
                    day: '2-digit',
                    month:
                      'long',
                  },
                )}
              </p>
            </div>

            <div
              className={
                styles.headerAcoes
              }
            >
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className={
                  styles.botaoSite
                }
                aria-label="Abrir site público"
              >
                <ExternalLink
                  size={17}
                  strokeWidth={2}
                />

                <span>
                  Ver site
                </span>
              </a>

              <button
                type="button"
                className={
                  styles.botaoSair
                }
                onClick={sair}
                aria-label="Sair do painel administrativo"
              >
                <LogOut
                  size={17}
                  strokeWidth={2}
                />

                <span>
                  Sair
                </span>
              </button>

              <button
                type="button"
                className={
                  styles.botaoAtualizar
                }
                onClick={() =>
                  carregarDashboard(
                    true,
                  )
                }
                disabled={
                  atualizando
                }
                aria-label="Atualizar dashboard"
              >
                <RefreshCw
                  size={17}
                  strokeWidth={2}
                  className={
                    atualizando
                      ? styles.girando
                      : ''
                  }
                />

                <span>
                  Atualizar
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* =================================================
            ERRO
            ================================================= */}

        {erro && (
          <div
            className={
              styles.erro
            }
            role="alert"
          >
            <AlertTriangle
              size={18}
              strokeWidth={2}
            />

            <span>
              {erro}
            </span>

            <button
              type="button"
              onClick={() =>
                carregarDashboard()
              }
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* =================================================
            AÇÃO NECESSÁRIA
            ================================================= */}

        {!carregando &&
          quantidadeItensAtencao >
            0 && (
            <section
              className={
                styles.atencao
              }
            >
              <div
                className={
                  styles.atencaoCabecalho
                }
              >
                <div
                  className={
                    styles.atencaoIcone
                  }
                >
                  <AlertTriangle
                    size={20}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <span
                    className={
                      styles.atencaoRotulo
                    }
                  >
                    AÇÃO NECESSÁRIA
                  </span>

                  <strong>
                    {
                      quantidadeItensAtencao
                    }{' '}
                    {quantidadeItensAtencao ===
                    1
                      ? 'item precisa'
                      : 'itens precisam'}{' '}
                    de atenção
                  </strong>
                </div>
              </div>

              <p>
                Priorize os pedidos que
                estão bloqueando o fluxo
                operacional.
              </p>

              <a
                href="/admin/pedidos?filtro=pendencias"
                className={
                  styles.atencaoLink
                }
              >
                Resolver agora

                <ArrowRight
                  size={16}
                />
              </a>
            </section>
          )}

        {/* =================================================
            MÉTRICAS
            ================================================= */}

        <section
          className={styles.metricas}
          aria-label="Indicadores de hoje"
        >
          <article
            className={
              styles.metricaPrincipal
            }
          >
            <div
              className={
                styles.metricaTopo
              }
            >
              <div
                className={
                  styles.metricaIcone
                }
              >
                <ShoppingBag
                  size={19}
                />
              </div>

              <span>
                Hoje
              </span>
            </div>

            <strong>
              {carregando
                ? '—'
                : pedidosHoje}
            </strong>

            <p>
              pedidos registrados hoje
            </p>
          </article>

          <article
            className={
              styles.metricaPrincipal
            }
          >
            <div
              className={
                styles.metricaTopo
              }
            >
              <div
                className={
                  styles.metricaIcone
                }
              >
                <TrendingUp
                  size={19}
                />
              </div>

              <span>
                Receita
              </span>
            </div>

            <strong>
              {carregando
                ? '—'
                : formatarMoeda(
                    faturamentoHoje,
                  )}
            </strong>

            <p>
              vendas não canceladas
            </p>
          </article>

          <article
            className={styles.metrica}
          >
            <div
              className={
                styles.metricaTopo
              }
            >
              <div
                className={
                  styles.metricaIcone
                }
              >
                <Clock3
                  size={18}
                />
              </div>

              <span>
                Aguardando
              </span>
            </div>

            <strong>
              {carregando
                ? '—'
                : aguardando}
            </strong>

            <p>
              {aguardando === 1
                ? 'ação imediata'
                : 'ações imediatas'}
            </p>
          </article>

          <article
            className={styles.metrica}
          >
            <div
              className={
                styles.metricaTopo
              }
            >
              <div
                className={
                  styles.metricaIcone
                }
              >
                <Package
                  size={18}
                />
              </div>

              <span>
                Em andamento
              </span>
            </div>

            <strong>
              {carregando
                ? '—'
                : emAndamento}
            </strong>

            <p>
              pedidos em operação
            </p>
          </article>

          <article
            className={styles.metrica}
          >
            <div
              className={
                styles.metricaTopo
              }
            >
              <div
                className={
                  styles.metricaIcone
                }
              >
                <TrendingUp
                  size={18}
                />
              </div>

              <span>
                Ticket médio
              </span>
            </div>

            <strong>
              {carregando
                ? '—'
                : formatarMoeda(
                    ticketMedio,
                  )}
            </strong>

            <p>
              média por pedido hoje
            </p>
          </article>

          <article
            className={styles.metrica}
          >
            <div
              className={
                styles.metricaTopo
              }
            >
              <div
                className={
                  styles.metricaIcone
                }
              >
                <TrendingDown
                  size={18}
                />
              </div>

              <span>
                Cancelamentos
              </span>
            </div>

            <strong>
              {carregando
                ? '—'
                : cancelamentosHoje}
            </strong>

            <p>
              {taxaCancelamento.toFixed(
                1,
              )}
              % dos pedidos
            </p>
          </article>

          <article
            className={styles.metrica}
          >
            <div
              className={
                styles.metricaTopo
              }
            >
              <div
                className={
                  styles.metricaIcone
                }
              >
                <Package
                  size={18}
                />
              </div>

              <span>
                Estoque pendente
              </span>
            </div>

            <strong>
              {carregando
                ? '—'
                : pendenciasEstoque}
            </strong>

            <p>
              decisões necessárias
            </p>
          </article>

          <article
            className={styles.metrica}
          >
            <div
              className={
                styles.metricaTopo
              }
            >
              <div
                className={
                  styles.metricaIcone
                }
              >
                <Users
                  size={18}
                />
              </div>

              <span>
                Clientes
              </span>
            </div>

            <strong>
              {carregando
                ? '—'
                : totalClientes}
            </strong>

            <p>
              {clientesComPedidos}{' '}
              com histórico
            </p>
          </article>
        </section>

        {/* =================================================
            VISÃO EXECUTIVA
            ================================================= */}

        <section
          className={
            styles.resumoExecutivo
          }
        >
          <div
            className={
              styles.resumoExecutivoCabecalho
            }
          >
            <div>
              <span
                className={
                  styles.painelRotulo
                }
              >
                VISÃO EXECUTIVA
              </span>

              <h2>
                Saúde da operação
              </h2>
            </div>
          </div>

          <div
            className={
              styles.resumoExecutivoGrid
            }
          >
            <article
              className={
                styles.resumoItem
              }
            >
              <span>
                Aguardando ação
              </span>

              <strong
                className={
                  styles.situacaoAtencao
                }
              >
                {aguardando}
              </strong>

              <small>
                pedidos recebidos
              </small>
            </article>

            <article
              className={
                styles.resumoItem
              }
            >
              <span>
                No fluxo
              </span>

              <strong
                className={
                  styles.situacaoAguardando
                }
              >
                {emAndamento}
              </strong>

              <small>
                aguardando ou em andamento
              </small>
            </article>

            <article
              className={
                styles.resumoItem
              }
            >
              <span>
                Concluídos
              </span>

              <strong
                className={
                  styles.situacaoNormal
                }
              >
                {concluidos}
              </strong>

              <small>
                {taxaConclusao.toFixed(
                  1,
                )}
                % do total
              </small>
            </article>

            <article
              className={
                styles.resumoItem
              }
            >
              <span>
                Cancelados
              </span>

              <strong
                className={
                  styles.situacao
                }
              >
                {cancelados}
              </strong>

              <small>
                histórico carregado
              </small>
            </article>

            <article
              className={
                styles.resumoItem
              }
            >
              <span>
                Clientes
              </span>

              <strong
                className={
                  styles.situacaoNormal
                }
              >
                {totalClientes}
              </strong>

              <small>
                {clientesComPedidos}{' '}
                com histórico
                {clientesSemPedidos >
                0
                  ? ` · ${clientesSemPedidos} sem pedidos`
                  : ''}
              </small>
            </article>
          </div>
        </section>

        {/* =================================================
            CONTEÚDO
            ================================================= */}

        <div
          className={
            styles.gridPrincipal
          }
        >
          {/* =================================================
              PEDIDOS RECENTES
              ================================================= */}

          <section
            className={styles.painel}
          >
            <div
              className={
                styles.painelCabecalho
              }
            >
              <div>
                <span
                  className={
                    styles.painelRotulo
                  }
                >
                  OPERAÇÃO
                </span>

                <h2>
                  Pedidos recentes
                </h2>
              </div>

              <a
                href="/admin/pedidos"
                className={
                  styles.verTodos
                }
              >
                Ver todos

                <ArrowRight
                  size={15}
                />
              </a>
            </div>

            {carregando ? (
              <div
                className={
                  styles.carregando
                }
              >
                <span
                  className={
                    styles.spinner
                  }
                />

                <span>
                  Carregando operação...
                </span>
              </div>
            ) : pedidosRecentes.length ===
              0 ? (
              <div
                className={
                  styles.vazio
                }
              >
                <ShoppingBag
                  size={26}
                />

                <strong>
                  Nenhum pedido encontrado
                </strong>

                <span>
                  Os novos pedidos aparecerão
                  aqui automaticamente.
                </span>
              </div>
            ) : (
              <div
                className={
                  styles.listaPedidos
                }
              >
                {pedidosRecentes.map(
                  (pedido) => (
                    <a
                      key={pedido.id}
                      href="/admin/pedidos"
                      className={
                        styles.pedido
                      }
                    >
                      <div
                        className={
                          styles.pedidoNumero
                        }
                      >
                        {formatarNumeroPedido(
                          pedido.numeroPedido,
                        )}
                      </div>

                      <div
                        className={
                          styles.pedidoCliente
                        }
                      >
                        <strong>
                          {
                            pedido
                              .cliente
                              .nome
                          }
                        </strong>

                        <span>
                          {pedido
                            .cliente
                            .telefone ||
                            'WhatsApp não informado'}
                        </span>

                        <small>
                          {formatarData(
                            pedido.criadoEm,
                          )}
                        </small>
                      </div>

                      <span
                        className={`${styles.pedidoStatus} ${statusClasse(
                          pedido.status,
                        )}`}
                      >
                        {nomeStatus(
                          pedido.status,
                        )}
                      </span>

                      <strong
                        className={
                          styles.pedidoTotal
                        }
                      >
                        {formatarMoeda(
                          pedido.total,
                        )}
                      </strong>

                      <ArrowRight
                        size={17}
                        className={
                          styles.pedidoSeta
                        }
                      />
                    </a>
                  ),
                )}
              </div>
            )}
          </section>

          {/* =================================================
              LATERAL
              ================================================= */}

          <aside
            className={
              styles.colunaLateral
            }
          >
            {/* =================================================
                DECISÕES
                ================================================= */}

            <section
              className={
                styles.painelAtencao
              }
            >
              <div
                className={
                  styles.painelAtencaoIcone
                }
              >
                <AlertTriangle
                  size={19}
                />
              </div>

              <div>
                <span
                  className={
                    styles.painelRotulo
                  }
                >
                  DECISÕES
                </span>

                <h3>
                  O que precisa de atenção
                </h3>
              </div>

              <div
                className={
                  styles.indicadoresDecisao
                }
              >
                <a
                  href="/admin/pedidos?filtro=recebido"
                  className={
                    styles.indicadorDecisao
                  }
                >
                  <div>
                    <Clock3
                      size={16}
                    />

                    <span>
                      Aguardando
                    </span>
                  </div>

                  <strong>
                    {aguardando}
                  </strong>
                </a>

                <a
                  href="/admin/pedidos?filtro=pendencias"
                  className={
                    styles.indicadorDecisao
                  }
                >
                  <div>
                    <Package
                      size={16}
                    />

                    <span>
                      Estoque
                    </span>
                  </div>

                  <strong>
                    {pendenciasEstoque}
                  </strong>
                </a>

                <a
                  href="/admin/pedidos?filtro=cancelado"
                  className={
                    styles.indicadorDecisao
                  }
                >
                  <div>
                    <XCircle
                      size={16}
                    />

                    <span>
                      Cancelados
                    </span>
                  </div>

                  <strong>
                    {cancelados}
                  </strong>
                </a>
              </div>

              {totalPendencias >
                0 && (
                <a
                  href="/admin/pedidos?filtro=pendencias"
                  className={
                    styles.acaoPrincipal
                  }
                >
                  Revisar pendências

                  <ArrowRight
                    size={16}
                  />
                </a>
              )}
            </section>

            {/* =================================================
                ACESSOS RÁPIDOS
                ================================================= */}

            <section
              className={styles.painel}
            >
              <div
                className={
                  styles.painelCabecalho
                }
              >
                <div>
                  <span
                    className={
                      styles.painelRotulo
                    }
                  >
                    ACESSO RÁPIDO
                  </span>

                  <h2>
                    Ações
                  </h2>
                </div>
              </div>

              <div
                className={styles.acoes}
              >
                <a
                  href="/admin/pedidos"
                  className={styles.acao}
                >
                  <span
                    className={
                      styles.acaoIcone
                    }
                  >
                    <ShoppingBag
                      size={18}
                    />
                  </span>

                  <span
                    className={
                      styles.acaoTexto
                    }
                  >
                    <strong>
                      Pedidos
                    </strong>

                    <small>
                      Gerenciar operação
                    </small>
                  </span>

                  <ArrowRight
                    size={16}
                  />
                </a>

                <a
                  href="/admin/clientes"
                  className={styles.acao}
                >
                  <span
                    className={
                      styles.acaoIcone
                    }
                  >
                    <Users
                      size={18}
                    />
                  </span>

                  <span
                    className={
                      styles.acaoTexto
                    }
                  >
                    <strong>
                      Clientes
                    </strong>

                    <small>
                      Consultar base
                    </small>
                  </span>

                  <ArrowRight
                    size={16}
                  />
                </a>

                <a
                  href="/admin/produtos"
                  className={styles.acao}
                >
                  <span
                    className={
                      styles.acaoIcone
                    }
                  >
                    <Package
                      size={18}
                    />
                  </span>

                  <span
                    className={
                      styles.acaoTexto
                    }
                  >
                    <strong>
                      Produtos
                    </strong>

                    <small>
                      Cardápio e estoque
                    </small>
                  </span>

                  <ArrowRight
                    size={16}
                  />
                </a>

                <button
                  type="button"
                  className={
                    styles.acao
                  }
                  onClick={
                    abrirSite
                  }
                >
                  <span
                    className={
                      styles.acaoIcone
                    }
                  >
                    <ExternalLink
                      size={18}
                    />
                  </span>

                  <span
                    className={
                      styles.acaoTexto
                    }
                  >
                    <strong>
                      Ver site
                    </strong>

                    <small>
                      Abrir loja pública
                    </small>
                  </span>

                  <ArrowRight
                    size={16}
                  />
                </button>
              </div>
            </section>
          </aside>
        </div>

        {/* =================================================
            FOOTER
            ================================================= */}

        <footer
          className={styles.footer}
        >
          <div>
            <span>
              Dados atualizados
              automaticamente.
            </span>

            <span>
              {atualizando
                ? 'Sincronizando...'
                : 'Sincronização a cada 30 segundos'}
            </span>
          </div>

          <div>
            <CheckCircle2
              size={15}
            />

            <span>
              Sistema operacional
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}