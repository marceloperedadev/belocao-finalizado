import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { exigirAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await exigirAdmin()

    /*
     * =========================================================
     * DASHBOARD ADMINISTRATIVO
     * =========================================================
     *
     * Esta rota existe exclusivamente para as métricas
     * administrativas.
     *
     * Não depende dos últimos 100 pedidos carregados pela
     * tela de pedidos.
     *
     * Todas as métricas são calculadas diretamente no banco.
     * =========================================================
     */

    const [
      resumoHoje,
      resumoGeral,
      clientes,
      pedidosHojePorStatus,
      statusGeral,
      pendenciasEstoque,
    ] = await Promise.all([
      /*
       * =======================================================
       * MÉTRICAS DE HOJE
       * =======================================================
       */

      sql`
        SELECT
          COUNT(*) FILTER (
            WHERE created_at >= CURRENT_DATE
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
          )::int AS pedidos_hoje,

          COALESCE(
            SUM(total) FILTER (
              WHERE created_at >= CURRENT_DATE
                AND created_at < CURRENT_DATE + INTERVAL '1 day'
                AND status <> 'cancelado'
            ),
            0
          )::numeric AS faturamento_hoje,

          COALESCE(
            AVG(total) FILTER (
              WHERE created_at >= CURRENT_DATE
                AND created_at < CURRENT_DATE + INTERVAL '1 day'
                AND status <> 'cancelado'
            ),
            0
          )::numeric AS ticket_medio_hoje,

          COUNT(*) FILTER (
            WHERE created_at >= CURRENT_DATE
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
              AND status = 'cancelado'
          )::int AS cancelamentos_hoje,

          COUNT(*) FILTER (
            WHERE created_at >= CURRENT_DATE
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
              AND status = 'recebido'
          )::int AS aguardando_hoje,

          COUNT(*) FILTER (
            WHERE created_at >= CURRENT_DATE
              AND created_at < CURRENT_DATE + INTERVAL '1 day'
              AND status IN (
                'confirmado',
                'em_preparo',
                'saiu_para_entrega'
              )
          )::int AS em_andamento_hoje

        FROM orders
      `,

      /*
       * =======================================================
       * VISÃO GERAL DA OPERAÇÃO
       * =======================================================
       */

      sql`
        SELECT
          COUNT(*)::int AS total_pedidos,

          COUNT(*) FILTER (
            WHERE status = 'recebido'
          )::int AS aguardando,

          COUNT(*) FILTER (
            WHERE status IN (
              'confirmado',
              'em_preparo',
              'saiu_para_entrega'
            )
          )::int AS em_andamento,

          COUNT(*) FILTER (
            WHERE status = 'concluido'
          )::int AS concluidos,

          COUNT(*) FILTER (
            WHERE status = 'cancelado'
          )::int AS cancelados,

          COALESCE(
            SUM(total) FILTER (
              WHERE status <> 'cancelado'
            ),
            0
          )::numeric AS faturamento_total

        FROM orders
      `,

      /*
       * =======================================================
       * CLIENTES
       * =======================================================
       */

      sql`
        SELECT
          COUNT(*)::int AS total_clientes,

          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1
              FROM orders o
              WHERE o.customer_id = c.id
            )
          )::int AS clientes_com_pedidos,

          COUNT(*) FILTER (
            WHERE NOT EXISTS (
              SELECT 1
              FROM orders o
              WHERE o.customer_id = c.id
            )
          )::int AS clientes_sem_pedidos

        FROM customers c
      `,

      /*
       * =======================================================
       * STATUS DOS PEDIDOS DE HOJE
       * =======================================================
       */

      sql`
        SELECT
          status,
          COUNT(*)::int AS quantidade

        FROM orders

        WHERE created_at >= CURRENT_DATE
          AND created_at < CURRENT_DATE + INTERVAL '1 day'

        GROUP BY status

        ORDER BY quantidade DESC
      `,

      /*
       * =======================================================
       * STATUS DE TODA A OPERAÇÃO
       * =======================================================
       */

      sql`
        SELECT
          status,
          COUNT(*)::int AS quantidade

        FROM orders

        GROUP BY status

        ORDER BY quantidade DESC
      `,

      /*
       * =======================================================
       * ESTOQUE PENDENTE
       * =======================================================
       *
       * Cancelados cujo estoque ainda não foi resolvido.
       *
       * Valores válidos:
       *
       * pendente
       * devolvido
       * nao_devolver
       *
       * =======================================================
       */

      sql`
        SELECT
          COUNT(*)::int AS total

        FROM orders

        WHERE status = 'cancelado'

          AND COALESCE(
            stock_resolution,
            'pendente'
          ) = 'pendente'
      `,
    ])

    /*
     * =========================================================
     * NORMALIZAÇÃO DOS RESULTADOS
     * =========================================================
     */

    const hoje = resumoHoje[0] ?? {}
    const geral = resumoGeral[0] ?? {}
    const baseClientes = clientes[0] ?? {}

    /*
     * Tipagem explícita para evitar erro do TypeScript
     * quando a consulta de estoque não possuir resultado.
     */

    const estoque = pendenciasEstoque[0] as
      | {
          total?: number | string | null
        }
      | undefined

    /*
     * =========================================================
     * MÉTRICAS DE HOJE
     * =========================================================
     */

    const pedidosHoje = Number(
      hoje.pedidos_hoje ?? 0,
    )

    const faturamentoHoje = Number(
      hoje.faturamento_hoje ?? 0,
    )

    const ticketMedioHoje = Number(
      hoje.ticket_medio_hoje ?? 0,
    )

    const cancelamentosHoje = Number(
      hoje.cancelamentos_hoje ?? 0,
    )

    const aguardandoHoje = Number(
      hoje.aguardando_hoje ?? 0,
    )

    const emAndamentoHoje = Number(
      hoje.em_andamento_hoje ?? 0,
    )

    /*
     * =========================================================
     * TAXA DE CANCELAMENTO
     * =========================================================
     */

    const taxaCancelamentoHoje =
      pedidosHoje > 0
        ? (cancelamentosHoje / pedidosHoje) * 100
        : 0

    /*
     * =========================================================
     * OPERAÇÃO
     * =========================================================
     */

    const totalPedidos = Number(
      geral.total_pedidos ?? 0,
    )

    const aguardando = Number(
      geral.aguardando ?? 0,
    )

    const emAndamento = Number(
      geral.em_andamento ?? 0,
    )

    const concluidos = Number(
      geral.concluidos ?? 0,
    )

    const cancelados = Number(
      geral.cancelados ?? 0,
    )

    const faturamentoTotal = Number(
      geral.faturamento_total ?? 0,
    )

    /*
     * =========================================================
     * TAXA DE CONCLUSÃO
     * =========================================================
     */

    const taxaConclusao =
      totalPedidos > 0
        ? (concluidos / totalPedidos) * 100
        : 0

    /*
     * =========================================================
     * PENDÊNCIAS
     * =========================================================
     */

    const pendenciasEstoqueTotal = Number(
      estoque?.total ?? 0,
    )

    /*
     * Tudo que exige alguma ação administrativa.
     */

    const acaoNecessaria =
      aguardando + pendenciasEstoqueTotal

    /*
     * =========================================================
     * RESPOSTA
     * =========================================================
     */

    return NextResponse.json({
      sucesso: true,

      periodo: {
        inicioHoje: new Date()
          .toISOString()
          .slice(0, 10),

        descricao: 'Hoje',
      },

      /*
       * =======================================================
       * HOJE
       * =======================================================
       */

      hoje: {
        pedidos: pedidosHoje,

        faturamento: faturamentoHoje,

        ticketMedio: ticketMedioHoje,

        cancelamentos: cancelamentosHoje,

        taxaCancelamento: Number(
          taxaCancelamentoHoje.toFixed(1),
        ),

        aguardando: aguardandoHoje,

        emAndamento: emAndamentoHoje,
      },

      /*
       * =======================================================
       * OPERAÇÃO
       * =======================================================
       */

      operacao: {
        totalPedidos,

        aguardando,

        emAndamento,

        concluidos,

        cancelados,

        faturamentoTotal,

        taxaConclusao: Number(
          taxaConclusao.toFixed(1),
        ),
      },

      /*
       * =======================================================
       * CLIENTES
       * =======================================================
       */

      clientes: {
        total: Number(
          baseClientes.total_clientes ?? 0,
        ),

        comPedidos: Number(
          baseClientes.clientes_com_pedidos ?? 0,
        ),

        semPedidos: Number(
          baseClientes.clientes_sem_pedidos ?? 0,
        ),
      },

      /*
       * =======================================================
       * PENDÊNCIAS
       * =======================================================
       */

      pendencias: {
        total: acaoNecessaria,

        aguardando,

        estoque: pendenciasEstoqueTotal,
      },

      /*
       * =======================================================
       * DISTRIBUIÇÃO DOS PEDIDOS DE HOJE
       * =======================================================
       */

      pedidosHojePorStatus:
        pedidosHojePorStatus.map(
          (item) => ({
            status: String(
              item.status,
            ),

            quantidade: Number(
              item.quantidade ?? 0,
            ),
          }),
        ),

      /*
       * =======================================================
       * DISTRIBUIÇÃO GERAL
       * =======================================================
       */

      statusGeral:
        statusGeral.map(
          (item) => ({
            status: String(
              item.status,
            ),

            quantidade: Number(
              item.quantidade ?? 0,
            ),
          }),
        ),
    })
  } catch (error) {
    console.error(
      'Erro ao carregar métricas do dashboard:',
      error,
    )

    return NextResponse.json(
      {
        sucesso: false,

        erro:
          'Não foi possível carregar as métricas do dashboard.',
      },
      {
        status: 500,
      },
    )
  }
}