'use client'

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  X,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useRouter } from 'next/navigation'

import PedidoCard, {
  type Pedido,
  type PedidoApi,
  type ResolucaoEstoque,
  type StatusPedido,
} from '@/app/admin/pedidos/pedidoCard/PedidoCard'

import styles from './Pedidos.module.css'

// =========================================================
// TIPOS
// =========================================================

type StatusFiltro =
  | 'todos'
  | 'recebido'
  | 'confirmado'
  | 'em_preparo'
  | 'saiu_para_entrega'
  | 'concluido'
  | 'cancelado'
  | 'atencao'

type RespostaPedidos = {
  pedidos?: PedidoApi[]
  data?: PedidoApi[]
  items?: PedidoApi[]
}

// =========================================================
// OPÇÕES DE STATUS
// =========================================================

const STATUS_OPTIONS: {
  value: Exclude<
    StatusFiltro,
    'todos' | 'atencao'
  >
  label: string
}[] = [
  {
    value: 'recebido',
    label: 'Recebidos',
  },
  {
    value: 'confirmado',
    label: 'Confirmados',
  },
  {
    value: 'em_preparo',
    label: 'Em preparo',
  },
  {
    value: 'saiu_para_entrega',
    label: 'Em entrega',
  },
  {
    value: 'concluido',
    label: 'Concluídos',
  },
  {
    value: 'cancelado',
    label: 'Cancelados',
  },
]

// =========================================================
// CONFIGURAÇÃO
// =========================================================

const LIMITE_PEDIDOS_VISIVEIS = 20

// =========================================================
// UTILITÁRIOS
// =========================================================

type Registro = Record<string, unknown>

function registro(
  valor: unknown,
): Registro {
  return valor !== null &&
    typeof valor === 'object'
    ? (valor as Registro)
    : {}
}

function texto(
  valor: unknown,
  fallback = '',
): string {
  if (
    valor === null ||
    valor === undefined
  ) {
    return fallback
  }

  const resultado =
    String(valor).trim()

  return resultado || fallback
}

function numero(
  valor: unknown,
  fallback = 0,
): number {
  if (
    typeof valor === 'number' &&
    Number.isFinite(valor)
  ) {
    return valor
  }

  if (typeof valor === 'string') {
    const limpo = valor
      .trim()
      .replace(/R\$\s*|BRL/gi, '')
      .replace(/\s/g, '')

    if (
      limpo.includes(',') &&
      limpo.includes('.')
    ) {
      const normalizado =
        limpo
          .replace(/\./g, '')
          .replace(',', '.')

      const resultado =
        Number(normalizado)

      return Number.isFinite(
        resultado,
      )
        ? resultado
        : fallback
    }

    if (limpo.includes(',')) {
      const resultado =
        Number(
          limpo.replace(
            ',',
            '.',
          ),
        )

      return Number.isFinite(
        resultado,
      )
        ? resultado
        : fallback
    }
  }

  const resultado =
    Number(valor)

  return Number.isFinite(
    resultado,
  )
    ? resultado
    : fallback
}

function dataValida(
  valor: unknown,
): string {
  if (!valor) {
    return new Date().toISOString()
  }

  const data = new Date(
    String(valor),
  )

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return new Date().toISOString()
  }

  return data.toISOString()
}

// =========================================================
// STATUS
// =========================================================

function normalizarStatus(
  valor: unknown,
): StatusPedido {
  const status = texto(
    valor,
    'recebido',
  )
    .toLowerCase()
    .trim()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')

  if (
    [
      'cancelado',
      'cancelada',
      'cancelled',
    ].includes(status)
  ) {
    return 'cancelado'
  }

  if (
    [
      'confirmado',
      'confirmada',
      'confirmed',
    ].includes(status)
  ) {
    return 'confirmado'
  }

  if (
    [
      'em_preparo',
      'em_preparacao',
      'preparando',
      'preparing',
    ].includes(status)
  ) {
    return 'em_preparo'
  }

  if (
    [
      'saiu_para_entrega',
      'saiu_entrega',
      'em_entrega',
      'out_for_delivery',
    ].includes(status)
  ) {
    return 'saiu_para_entrega'
  }

  if (
    [
      'concluido',
      'concluida',
      'completed',
      'complete',
    ].includes(status)
  ) {
    return 'concluido'
  }

  return 'recebido'
}

function normalizarResolucaoEstoque(
  valor: unknown,
): ResolucaoEstoque {
  const raw = texto(
    valor,
    'pendente',
  )
    .toLowerCase()
    .trim()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')

  if (
    [
      'devolvido',
      'devolvida',
      'returned',
      'devolvido_ao_estoque',
      'returned_to_stock',
    ].includes(raw)
  ) {
    return 'devolvido'
  }

  if (
    [
      'nao_devolver',
      'não_devolver',
      'naodevolver',
      'nao_devolvido',
      'não_devolvido',
      'not_returned',
      'not_return',
    ].includes(raw)
  ) {
    return 'nao_devolver'
  }

  return 'pendente'
}

// =========================================================
// ITENS
// =========================================================

function encontrarItens(
  pedido: unknown,
): unknown[] {
  const dados =
    registro(pedido)

  const candidatos = [
    dados.itens,
    dados.items,
    dados.produtos,
    dados.products,
    dados.order_items,
    dados.orderItems,
    dados.itensPedido,
    dados.orderProducts,
  ]

  for (
    const candidato of candidatos
  ) {
    if (
      Array.isArray(candidato)
    ) {
      return candidato
    }
  }

  return []
}

function normalizarItem(
  item: unknown,
  indice: number,
) {
  const dados =
    registro(item)

  const produto =
    registro(
      dados.produto ??
        dados.product ??
        dados.productData ??
        dados.produtoData,
    )

  const id = texto(
    dados.id ??
      dados.itemId ??
      dados.produtoId ??
      dados.productId ??
      dados.product_id ??
      produto.id ??
      produto.productId,
    `item-${indice}`,
  )

  const nome = texto(
    dados.nome ??
      dados.product_name ??
      dados.productName ??
      dados.name ??
      dados.produtoNome ??
      produto.nome ??
      produto.name ??
      produto.title,
    'Produto',
  )

  const quantidade =
    numero(
      dados.quantidade ??
        dados.quantity ??
        dados.qtd ??
        dados.qty,
      1,
    )

  const precoUnitario =
    numero(
      dados.precoUnitario ??
        dados.unit_price ??
        dados.preco ??
        dados.price ??
        dados.valorUnitario ??
        produto.preco ??
        produto.price,
    )

  const subtotalInformado =
    numero(
      dados.subtotal ??
        dados.total ??
        dados.valorTotal ??
        dados.line_total,
    )

  const subtotal =
    subtotalInformado > 0
      ? subtotalInformado
      : precoUnitario *
        quantidade

  return {
    id,
    nome,
    quantidade,
    precoUnitario,
    subtotal,
  }
}

// =========================================================
// NORMALIZA PEDIDO
// =========================================================

function normalizarPedido(
  pedido: PedidoApi,
): Pedido {
  const dados =
    registro(pedido)

  const clienteApi =
    registro(
      dados.cliente ??
        dados.customer,
    )

  const entregaApi =
    registro(
      dados.entrega ??
        dados.delivery,
    )

  const pagamentoApi =
    registro(
      dados.pagamento ??
        dados.payment,
    )

  const id = texto(
    dados.id ??
      dados.pedidoId ??
      dados.orderId,
    texto(
      dados.numeroPedido ??
        dados.order_number,
      '',
    ),
  )

  const itens =
    encontrarItens(pedido).map(
      normalizarItem,
    )

  const resolucaoEstoque =
    normalizarResolucaoEstoque(
      dados.resolucaoEstoque ??
        dados.estoqueResolucao ??
        dados.stock_resolution ??
        dados.stockResolution ??
        dados.resolucao_estoque,
    )

  const numeroPedido =
    texto(
      dados.numeroPedido ??
        dados.numero ??
        dados.order_number ??
        dados.orderNumber,
      id
        ? `#${id}`
        : '#—',
    )

  const tipoEntrega =
    texto(
      entregaApi.tipo ??
        entregaApi.type ??
        dados.tipoEntrega ??
        dados.delivery_type ??
        dados.deliveryType,
      'delivery',
    )

  const pagamentoMetodo =
    texto(
      pagamentoApi.metodo ??
        pagamentoApi.forma ??
        pagamentoApi.method ??
        pagamentoApi.type ??
        dados.metodoPagamento ??
        dados.formaPagamento ??
        dados.payment_method ??
        dados.paymentMethod,
      'Não informado',
    )

  const telefone =
    texto(
      clienteApi.telefone ??
        clienteApi.celular ??
        clienteApi.whatsapp ??
        clienteApi.phone ??
        dados.telefone ??
        dados.customer_whatsapp ??
        dados.customer_phone,
    )

  const enderecoCompleto =
    texto(
      entregaApi.endereco ??
        entregaApi.address ??
        dados.endereco ??
        dados.address,
    )

  const enderecoPartes = [
    enderecoCompleto,
    texto(
      entregaApi.rua ??
        entregaApi.street ??
        dados.rua ??
        dados.street,
    ),
    texto(
      entregaApi.numero ??
        entregaApi.number ??
        dados.numeroEndereco ??
        dados.number,
    ),
  ].filter(Boolean)

  const endereco =
    enderecoPartes
      .filter(
        (
          valor,
          indice,
          array,
        ) =>
          array.indexOf(
            valor,
          ) === indice,
      )
      .join(', ')

  return {
    id,

    numeroPedido,

    status:
      normalizarStatus(
        dados.status,
      ),

    cliente: {
      nome: texto(
        clienteApi.nome ??
          clienteApi.name ??
          dados.nomeCliente ??
          dados.customer_name ??
          dados.customerName,
        'Cliente',
      ),

      telefone,
    },

    entrega: {
      tipo:
        tipoEntrega.toLowerCase() ===
        'pickup'
          ? 'pickup'
          : 'delivery',

      endereco:
        endereco || undefined,

      complemento:
        texto(
          entregaApi.complemento ??
            entregaApi.complement ??
            dados.complemento ??
            dados.complement,
        ) || undefined,

      bairro:
        texto(
          entregaApi.bairro ??
            entregaApi.neighborhood ??
            dados.bairro ??
            dados.neighborhood,
        ) || undefined,

      cidade:
        texto(
          entregaApi.cidade ??
            entregaApi.city ??
            dados.cidade ??
            dados.city,
        ) || undefined,
    },

    pagamento: {
      metodo:
        pagamentoMetodo,

      status:
        texto(
          pagamentoApi.status ??
            dados.statusPagamento ??
            dados.payment_status,
        ) || undefined,
    },

    itens,

    subtotal:
      numero(
        dados.subtotal ??
          dados.sub_total,
      ),

    taxaEntrega:
      numero(
        entregaApi.taxaEntrega ??
          entregaApi.taxa ??
          entregaApi.deliveryFee ??
          dados.taxaEntrega ??
          dados.taxa ??
          dados.frete ??
          dados.shipping ??
          dados.delivery_fee,
      ),

    total:
      numero(
        dados.total ??
          dados.valorTotal ??
          dados.totalAmount,
      ),

    resolucaoEstoque,

    criadoEm:
      dataValida(
        dados.criadoEm ??
          dados.createdAt ??
          dados.dataCriacao ??
          dados.created_at,
      ),

    atualizadoEm:
      dados.atualizadoEm ??
      dados.updatedAt ??
      dados.updated_at
        ? dataValida(
            dados.atualizadoEm ??
              dados.updatedAt ??
              dados.updated_at,
          )
        : undefined,
  }
}

// =========================================================
// MESCLA PEDIDOS
// =========================================================

function mesclarPedidos(
  principal: Pedido,
  secundario: Pedido,
): Pedido {
  const itens =
    secundario.itens.length > 0
      ? secundario.itens
      : principal.itens

  const resolucaoEstoque =
    secundario.resolucaoEstoque !==
    'pendente'
      ? secundario.resolucaoEstoque
      : principal.resolucaoEstoque

  return {
    ...principal,
    ...secundario,

    cliente: {
      nome:
        secundario.cliente.nome !==
        'Cliente'
          ? secundario.cliente.nome
          : principal.cliente.nome,

      telefone:
        secundario.cliente
          .telefone ||
        principal.cliente.telefone,
    },

    entrega: {
      ...principal.entrega,
      ...secundario.entrega,

      endereco:
        secundario.entrega
          .endereco ||
        principal.entrega.endereco,

      complemento:
        secundario.entrega
          .complemento ||
        principal.entrega.complemento,

      bairro:
        secundario.entrega.bairro ||
        principal.entrega.bairro,

      cidade:
        secundario.entrega.cidade ||
        principal.entrega.cidade,
    },

    status:
      secundario.status !==
        'recebido' ||
      principal.status ===
        'recebido'
        ? secundario.status
        : principal.status,

    pagamento: {
      ...principal.pagamento,
      ...secundario.pagamento,

      metodo:
        secundario.pagamento
          .metodo !==
        'Não informado'
          ? secundario.pagamento
              .metodo
          : principal.pagamento
              .metodo,

      status:
        secundario.pagamento
          .status ||
        principal.pagamento.status,
    },

    itens,

    subtotal:
      secundario.subtotal !== 0
        ? secundario.subtotal
        : principal.subtotal,

    taxaEntrega:
      secundario.taxaEntrega !== 0
        ? secundario.taxaEntrega
        : principal.taxaEntrega,

    total:
      secundario.total !== 0
        ? secundario.total
        : principal.total,

    resolucaoEstoque,

    criadoEm:
      principal.criadoEm ||
      secundario.criadoEm,

    atualizadoEm:
      secundario.atualizadoEm ||
      principal.atualizadoEm,
  }
}

// =========================================================
// BUSCA
// =========================================================

function normalizarBusca(
  valor: string,
) {
  return valor
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .trim()
}

function somenteNumeros(
  valor: string,
) {
  return valor.replace(
    /\D/g,
    '',
  )
}

function numeroPedidoNormalizado(
  pedido: Pedido,
) {
  return somenteNumeros(
    pedido.numeroPedido,
  )
}

function textoPesquisavel(
  pedido: Pedido,
) {
  return [
    pedido.id,
    pedido.numeroPedido,
    pedido.cliente.nome,
    pedido.cliente.telefone,
    pedido.entrega.endereco,
    pedido.entrega.bairro,
    pedido.entrega.cidade,
  ]
    .filter(Boolean)
    .join(' ')
}

// =========================================================
// COMPONENTE
// =========================================================

export default function PedidosPage() {
  const router =
    useRouter()

  const [
    todosPedidos,
    setTodosPedidos,
  ] = useState<Pedido[]>([])

  const [
    filtroStatus,
    setFiltroStatus,
  ] =
    useState<StatusFiltro>(
      'todos',
    )

  const [
    busca,
    setBusca,
  ] = useState('')

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

  const [
    pedidosAbertos,
    setPedidosAbertos,
  ] =
    useState<Set<string>>(
      new Set(),
    )

  const [
    statusSalvando,
    setStatusSalvando,
  ] =
    useState<string | null>(
      null,
    )

  const [
    statusSucesso,
    setStatusSucesso,
  ] =
    useState<string | null>(
      null,
    )

  const [
    estoqueSalvando,
    setEstoqueSalvando,
  ] =
    useState<string | null>(
      null,
    )

  const [
    estoqueSucesso,
    setEstoqueSucesso,
  ] =
    useState<string | null>(
      null,
    )

  // =======================================================
  // TOGGLE
  // =======================================================

  const togglePedido =
    useCallback(
      (pedidoId: string) => {
        setPedidosAbertos(
          (atual) => {
            const proximo =
              new Set(atual)

            if (
              proximo.has(
                pedidoId,
              )
            ) {
              proximo.delete(
                pedidoId,
              )
            } else {
              proximo.add(
                pedidoId,
              )
            }

            return proximo
          },
        )
      },
      [],
    )

  // =======================================================
  // CARREGAR PEDIDOS
  // =======================================================

  const carregarPedidos =
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
            respostaPrincipal,
            respostaPendencias,
          ] =
            await Promise.all([
              fetch(
                '/api/admin/pedidos?limit=100',
                {
                  method: 'GET',
                  headers: {
                    Accept:
                      'application/json',
                  },
                  cache:
                    'no-store',
                },
              ),

              fetch(
                '/api/admin/pedidos?filtro=pendencias',
                {
                  method: 'GET',
                  headers: {
                    Accept:
                      'application/json',
                  },
                  cache:
                    'no-store',
                },
              ),
            ])

          if (
            !respostaPrincipal.ok
          ) {
            const dados =
              await respostaPrincipal
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

          const principal =
            (await respostaPrincipal.json()) as RespostaPedidos

          const pendencias =
            respostaPendencias.ok
              ? ((await respostaPendencias.json()) as RespostaPedidos)
              : null

          const pedidosPrincipal =
            principal.pedidos ??
            principal.data ??
            principal.items ??
            []

          const pedidosPendencias =
            pendencias?.pedidos ??
            pendencias?.data ??
            pendencias?.items ??
            []

          const pedidos =
            pedidosPrincipal.map(
              normalizarPedido,
            )

          const pendenciasExternas =
            pedidosPendencias.map(
              normalizarPedido,
            )

          const mapa =
            new Map<
              string,
              Pedido
            >()

          pedidos.forEach(
            (pedido) => {
              mapa.set(
                pedido.id,
                pedido,
              )
            },
          )

          pendenciasExternas.forEach(
            (pedido) => {
              const existente =
                mapa.get(
                  pedido.id,
                )

              mapa.set(
                pedido.id,
                existente
                  ? mesclarPedidos(
                      existente,
                      pedido,
                    )
                  : pedido,
              )
            },
          )

          const resultado =
            Array.from(
              mapa.values(),
            ).sort(
              (
                a,
                b,
              ) =>
                new Date(
                  b.criadoEm,
                ).getTime() -
                new Date(
                  a.criadoEm,
                ).getTime(),
            )

          setTodosPedidos(
            resultado,
          )
        } catch (
          error
        ) {
          console.error(
            'Erro ao carregar pedidos:',
            error,
          )

          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os pedidos.',
          )
        } finally {
          setCarregando(false)
          setAtualizando(false)
        }
      },
      [],
    )

  useEffect(() => {
    carregarPedidos()
  }, [
    carregarPedidos,
  ])

  useEffect(() => {
    const intervalo =
      window.setInterval(
        () => {
          carregarPedidos(true)
        },
        30000,
      )

    return () =>
      window.clearInterval(
        intervalo,
      )
  }, [
    carregarPedidos,
  ])

  // =======================================================
  // MÉTRICAS
  // =======================================================

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

  const pedidosAguardando =
    useMemo(
      () =>
        todosPedidos.filter(
          (pedido) =>
            pedido.status ===
            'recebido',
        ),
      [todosPedidos],
    )

  const pedidosEmAndamento =
    useMemo(
      () =>
        todosPedidos.filter(
          (pedido) =>
            pedido.status ===
              'confirmado' ||
            pedido.status ===
              'em_preparo' ||
            pedido.status ===
              'saiu_para_entrega',
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

  // =======================================================
  // BUSCA
  // =======================================================

  const termoBusca =
    normalizarBusca(
      busca,
    )

  const pedidosEncontrados =
    useMemo(() => {
      if (!termoBusca) {
        return todosPedidos
      }

      const termoNumerico =
        somenteNumeros(
          termoBusca,
        )

      /*
       * Se o usuário digitou somente números,
       * primeiro procuramos pelo número exato
       * do pedido.
       *
       * Exemplo:
       * "32" -> pedido #32.
       */
      if (termoNumerico) {
        const pedidosNumeroExato =
          todosPedidos.filter(
            (pedido) =>
              numeroPedidoNormalizado(
                pedido,
              ) ===
              termoNumerico,
          )

        if (
          pedidosNumeroExato.length >
          0
        ) {
          return pedidosNumeroExato
        }
      }

      /*
       * Busca textual:
       * cliente, telefone, ID, endereço etc.
       */
      return todosPedidos
        .filter(
          (pedido) => {
            const textoPedido =
              normalizarBusca(
                textoPesquisavel(
                  pedido,
                ),
              )

            if (
              textoPedido.includes(
                termoBusca,
              )
            ) {
              return true
            }

            if (
              termoNumerico
            ) {
              const textoSomenteNumeros =
                somenteNumeros(
                  textoPedido,
                )

              return textoSomenteNumeros.includes(
                termoNumerico,
              )
            }

            return false
          },
        )
        .sort(
          (a, b) => {
            if (
              termoNumerico
            ) {
              const numeroA =
                numeroPedidoNormalizado(
                  a,
                )

              const numeroB =
                numeroPedidoNormalizado(
                  b,
                )

              const exatoA =
                numeroA ===
                termoNumerico

              const exatoB =
                numeroB ===
                termoNumerico

              if (
                exatoA &&
                !exatoB
              ) {
                return -1
              }

              if (
                !exatoA &&
                exatoB
              ) {
                return 1
              }
            }

            return (
              new Date(
                b.criadoEm,
              ).getTime() -
              new Date(
                a.criadoEm,
              ).getTime()
            )
          },
        )
    }, [
      todosPedidos,
      termoBusca,
    ])

  // =======================================================
  // FILTROS
  // =======================================================

  const pedidosFiltrados =
    useMemo(
      () => {
        let resultado =
          pedidosEncontrados

        if (
          filtroStatus ===
          'atencao'
        ) {
          resultado =
            resultado.filter(
              (pedido) =>
                pedido.status ===
                  'cancelado' &&
                pedido.resolucaoEstoque ===
                  'pendente',
            )
        } else if (
          filtroStatus !==
          'todos'
        ) {
          resultado =
            resultado.filter(
              (pedido) =>
                pedido.status ===
                filtroStatus,
            )
        }

        return [...resultado]
          .sort(
            (a, b) =>
              new Date(
                b.criadoEm,
              ).getTime() -
              new Date(
                a.criadoEm,
              ).getTime(),
          )
          .slice(
            0,
            LIMITE_PEDIDOS_VISIVEIS,
          )
      },
      [
        filtroStatus,
        pedidosEncontrados,
      ],
    )

  // =======================================================
  // ALTERAR STATUS
  // =======================================================

  const alterarStatus =
    useCallback(
      async (
        pedidoId: string,
        status: StatusPedido,
      ) => {
        try {
          setStatusSalvando(
            pedidoId,
          )

          setStatusSucesso(null)
          setErro('')

          const resposta =
            await fetch(
              '/api/admin/pedidos',
              {
                method: 'PATCH',
                headers: {
                  'Content-Type':
                    'application/json',
                  Accept:
                    'application/json',
                },
                body:
                  JSON.stringify({
                    pedidoId,
                    status,
                  }),
              },
            )

          const dados =
            await resposta
              .json()
              .catch(
                () => null,
              )

          if (
            !resposta.ok
          ) {
            throw new Error(
              dados?.message ||
                dados?.erro ||
                'Não foi possível alterar o status do pedido.',
            )
          }

          setTodosPedidos(
            (pedidos) =>
              pedidos.map(
                (pedido) =>
                  pedido.id ===
                  pedidoId
                    ? {
                        ...pedido,
                        status,
                        atualizadoEm:
                          new Date().toISOString(),
                        resolucaoEstoque:
                          status ===
                          'cancelado'
                            ? 'pendente'
                            : pedido.resolucaoEstoque,
                      }
                    : pedido,
              ),
          )

          setStatusSucesso(
            pedidoId,
          )

          window.setTimeout(
            () => {
              setStatusSucesso(
                (atual) =>
                  atual ===
                  pedidoId
                    ? null
                    : atual,
              )
            },
            1800,
          )
        } catch (
          error
        ) {
          console.error(
            'Erro ao alterar status:',
            error,
          )

          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível alterar o status do pedido.',
          )
        } finally {
          setStatusSalvando(
            null,
          )
        }
      },
      [],
    )

  // =======================================================
  // ESTOQUE
  // =======================================================

  const resolverEstoque =
    useCallback(
      async (
        pedidoId: string,
        acao:
          | 'devolver'
          | 'nao_devolver',
      ) => {
        try {
          setEstoqueSalvando(
            pedidoId,
          )

          setEstoqueSucesso(null)
          setErro('')

          const resposta =
            await fetch(
              '/api/admin/pedidos/estoque',
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                    'application/json',
                  Accept:
                    'application/json',
                },
                body:
                  JSON.stringify({
                    pedidoId,
                    acao,
                  }),
              },
            )

          const dados =
            await resposta
              .json()
              .catch(
                () => null,
              )

          if (
            resposta.status ===
            409
          ) {
            await carregarPedidos(
              true,
            )

            setEstoqueSucesso(
              pedidoId,
            )

            return
          }

          if (
            !resposta.ok
          ) {
            throw new Error(
              dados?.message ||
                dados?.erro ||
                'Não foi possível resolver o estoque.',
            )
          }

          const resolucao:
            ResolucaoEstoque =
            acao ===
            'devolver'
              ? 'devolvido'
              : 'nao_devolver'

          setTodosPedidos(
            (pedidos) =>
              pedidos.map(
                (pedido) =>
                  pedido.id ===
                  pedidoId
                    ? {
                        ...pedido,
                        resolucaoEstoque:
                          resolucao,
                      }
                    : pedido,
              ),
          )

          setEstoqueSucesso(
            pedidoId,
          )

          await carregarPedidos(
            true,
          )

          window.setTimeout(
            () => {
              setEstoqueSucesso(
                (atual) =>
                  atual ===
                  pedidoId
                    ? null
                    : atual,
              )
            },
            1800,
          )
        } catch (
          error
        ) {
          console.error(
            'Erro ao resolver estoque:',
            error,
          )

          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível resolver o estoque.',
          )
        } finally {
          setEstoqueSalvando(
            null,
          )
        }
      },
      [
        carregarPedidos,
      ],
    )

  // =======================================================
  // WHATSAPP
  // =======================================================

  const abrirWhatsApp =
    useCallback(
      (
        pedido: Pedido,
      ) => {
        const numero =
          texto(
            pedido.cliente
              ?.telefone,
          ).replace(
            /\D/g,
            '',
          )

        if (!numero) {
          setErro(
            'Este pedido não possui WhatsApp cadastrado.',
          )

          return
        }

        const mensagem =
          `Olá, ${pedido.cliente.nome}! ` +
          `Estamos entrando em contato sobre o pedido ${pedido.numeroPedido}.`

        const url =
          `https://wa.me/${numero}` +
          `?text=${encodeURIComponent(
            mensagem,
          )}`

        window.open(
          url,
          '_blank',
          'noopener,noreferrer',
        )
      },
      [],
    )

  // =======================================================
  // VOLTAR
  // =======================================================

  const voltar =
    useCallback(() => {
      router.back()
    }, [
      router,
    ])

  // =======================================================
  // COMPONENTE CARD
  // =======================================================

  const renderPedidoCard =
    (pedido: Pedido) => (
      <PedidoCard
        key={pedido.id}
        pedido={pedido}
        aberto={pedidosAbertos.has(
          pedido.id,
        )}
        statusSalvando={
          statusSalvando
        }
        statusSucesso={
          statusSucesso
        }
        estoqueSalvando={
          estoqueSalvando
        }
        estoqueSucesso={
          estoqueSucesso
        }
        onToggle={
          togglePedido
        }
        onStatusChange={
          alterarStatus
        }
        onResolverEstoque={
          resolverEstoque
        }
        onWhatsApp={
          abrirWhatsApp
        }
      />
    )

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <main
      className={
        styles.page
      }
    >
      <div
        className={
          styles.container
        }
      >
        {/* HEADER */}

        <header
          className={
            styles.header
          }
        >
          <div
            className={
              styles.headerLeft
            }
          >
            <button
              type="button"
              className={
                styles.backButton
              }
              onClick={
                voltar
              }
              aria-label="Voltar"
            >
              <ArrowLeft
                size={18}
              />
            </button>

            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Administração
              </span>

              <h1
                className={
                  styles.title
                }
              >
                Pedidos
              </h1>

              <p
                className={
                  styles.subtitle
                }
              >
                Acompanhe e gerencie
                os pedidos da loja.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={
              styles.refreshButton
            }
            onClick={() =>
              carregarPedidos(
                true,
              )
            }
            disabled={
              atualizando
            }
          >
            {atualizando ? (
              <Loader2
                size={17}
                className={
                  styles.spin
                }
              />
            ) : (
              <RefreshCw
                size={17}
              />
            )}

            <span>
              Atualizar
            </span>
          </button>
        </header>

        {/* ALERTA */}

        {pedidosAtencao.length >
          0 && (
          <section
            className={
              styles.alerta
            }
          >
            <div
              className={
                styles.alertaIcone
              }
            >
              <AlertTriangle
                size={20}
              />
            </div>

            <div
              className={
                styles.alertaTexto
              }
            >
              <strong>
                Atenção necessária
              </strong>

              <span>
                {pedidosAtencao.length ===
                1
                  ? 'Existe 1 pedido cancelado aguardando resolução do estoque.'
                  : `Existem ${pedidosAtencao.length} pedidos cancelados aguardando resolução do estoque.`}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setFiltroStatus(
                  'atencao',
                )
              }
              className={
                styles.alertaButton
              }
            >
              Ver pedidos
            </button>
          </section>
        )}

        {/* ERRO */}

        {erro && (
          <section
            className={
              styles.error
            }
          >
            <AlertTriangle
              size={18}
            />

            <span>
              {erro}
            </span>

            <button
              type="button"
              onClick={() =>
                setErro('')
              }
              aria-label="Fechar erro"
            >
              <X size={17} />
            </button>
          </section>
        )}

        {/* MÉTRICAS */}

        <section
          className={
            styles.metricas
          }
        >
          <div
            className={
              styles.metrica
            }
          >
            <div
              className={
                styles.metricaIcone
              }
            >
              <ShoppingBag
                size={18}
              />
            </div>

            <div>
              <span>
                Total
              </span>

              <strong>
                {
                  todosPedidos.length
                }
              </strong>
            </div>
          </div>

          <div
            className={
              styles.metrica
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

            <div>
              <span>
                Aguardando
              </span>

              <strong>
                {
                  pedidosAguardando.length
                }
              </strong>
            </div>
          </div>

          <div
            className={
              styles.metrica
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

            <div>
              <span>
                Em andamento
              </span>

              <strong>
                {
                  pedidosEmAndamento.length
                }
              </strong>
            </div>
          </div>

          <div
            className={
              styles.metrica
            }
          >
            <div
              className={
                styles.metricaIcone
              }
            >
              <Check
                size={18}
              />
            </div>

            <div>
              <span>
                Concluídos
              </span>

              <strong>
                {
                  pedidosConcluidos.length
                }
              </strong>
            </div>
          </div>

          <div
            className={[
              styles.metrica,
              pedidosAtencao.length >
              0
                ? styles.metricaAtencao
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div
              className={
                styles.metricaIcone
              }
            >
              <AlertTriangle
                size={18}
              />
            </div>

            <div>
              <span>
                Atenção
              </span>

              <strong>
                {
                  pedidosAtencao.length
                }
              </strong>
            </div>
          </div>
        </section>

        {/* BUSCA */}

        <section
          className={
            styles.buscaArea
          }
        >
          <div
            className={
              styles.buscaWrapper
            }
          >
           

            <input 
              type="search"
              value={busca}
              onChange={(event) =>
                setBusca(
                  event.target
                    .value,
                )
              }
              placeholder="Buscar por cliente, telefone ou código do pedido..."
              className={
                styles.buscaInput
              }
              aria-label="Buscar pedido"
            />
            

            {busca && (
              <button
                type="button"
                className={
                  styles.limparBusca
                }
                onClick={() =>
                  setBusca('')
                }
                aria-label="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div
            className={
              styles.buscaInfo
            }
          >
            {termoBusca ? (
              <>
                <Search
                  size={14}
                />

                <span>
                  {
                    pedidosFiltrados.length
                  }{' '}
                  resultado
                  {pedidosFiltrados.length ===
                  1
                    ? ''
                    : 's'}{' '}
                  encontrado
                  {pedidosFiltrados.length ===
                  1
                    ? ''
                    : 's'}
                </span>
              </>
            ) : (
              <>
                <Package
                  size={14}
                />

                <span>
                  Mostrando os{' '}
                  {Math.min(
                    LIMITE_PEDIDOS_VISIVEIS,
                    todosPedidos.length,
                  )}{' '}
                  pedidos mais recentes
                </span>
              </>
            )}
          </div>
        </section>

        {/* FILTROS */}

        <section
          className={
            styles.filtros
          }
        >
          <button
            type="button"
            className={[
              styles.filtro,
              filtroStatus ===
              'todos'
                ? styles.filtroAtivo
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() =>
              setFiltroStatus(
                'todos',
              )
            }
          >
            Todos

            <span>
              {
                todosPedidos.length
              }
            </span>
          </button>

          <button
            type="button"
            className={[
              styles.filtro,
              filtroStatus ===
              'atencao'
                ? styles.filtroAtivo
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() =>
              setFiltroStatus(
                'atencao',
              )
            }
          >
            Atenção

            <span>
              {
                pedidosAtencao.length
              }
            </span>
          </button>

          {STATUS_OPTIONS.map(
            (opcao) => {
              const quantidade =
                todosPedidos.filter(
                  (pedido) =>
                    pedido.status ===
                    opcao.value,
                ).length

              return (
                <button
                  key={
                    opcao.value
                  }
                  type="button"
                  className={[
                    styles.filtro,
                    filtroStatus ===
                    opcao.value
                      ? styles.filtroAtivo
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() =>
                    setFiltroStatus(
                      opcao.value,
                    )
                  }
                >
                  {
                    opcao.label
                  }

                  <span>
                    {
                      quantidade
                    }
                  </span>
                </button>
              )
            },
          )}
        </section>

        {/* CONTEÚDO */}

        {carregando ? (
          <section
            className={
              styles.loading
            }
          >
            <Loader2
              size={28}
              className={
                styles.spin
              }
            />

            <span>
              Carregando pedidos...
            </span>
          </section>
        ) : pedidosFiltrados.length ===
          0 ? (
          <section
            className={
              styles.empty
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <Package
                size={28}
              />
            </div>

            <h2>
              {termoBusca
                ? 'Nenhum pedido encontrado'
                : 'Nenhum pedido'}
            </h2>

            <p>
              {termoBusca
                ? 'Tente buscar por outro nome, telefone ou código do pedido.'
                : 'Não existem pedidos para o filtro selecionado.'}
            </p>

            {termoBusca && (
              <button
                type="button"
                className={
                  styles.emptyButton
                }
                onClick={() =>
                  setBusca('')
                }
              >
                Limpar busca
              </button>
            )}
          </section>
        ) : filtroStatus ===
          'todos' ? (
          <>
            {/* =================================================
                AGUARDANDO
                ================================================= */}

            {pedidosFiltrados.some(
              (pedido) =>
                pedido.status ===
                'recebido',
            ) && (
              <section
                className={
                  styles.secao
                }
              >
                <div
                  className={
                    styles.secaoHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.secaoEyebrow
                      }
                    >
                      Operação
                    </span>

                    <h2
                      className={
                        styles.secaoTitulo
                      }
                    >
                      Aguardando
                    </h2>
                  </div>

                  <span
                    className={
                      styles.secaoContador
                    }
                  >
                    {
                      pedidosFiltrados.filter(
                        (pedido) =>
                          pedido.status ===
                          'recebido',
                      ).length
                    }
                  </span>
                </div>

                <div
                  className={
                    styles.lista
                  }
                >
                  {pedidosFiltrados
                    .filter(
                      (pedido) =>
                        pedido.status ===
                        'recebido',
                    )
                    .map(
                      renderPedidoCard,
                    )}
                </div>
              </section>
            )}

            {/* =================================================
                EM ANDAMENTO
                ================================================= */}

            {pedidosFiltrados.some(
              (pedido) =>
                pedido.status ===
                  'confirmado' ||
                pedido.status ===
                  'em_preparo' ||
                pedido.status ===
                  'saiu_para_entrega',
            ) && (
              <section
                className={
                  styles.secao
                }
              >
                <div
                  className={
                    styles.secaoHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.secaoEyebrow
                      }
                    >
                      Operação
                    </span>

                    <h2
                      className={
                        styles.secaoTitulo
                      }
                    >
                      Em andamento
                    </h2>
                  </div>

                  <span
                    className={
                      styles.secaoContador
                    }
                  >
                    {
                      pedidosFiltrados.filter(
                        (pedido) =>
                          pedido.status ===
                            'confirmado' ||
                          pedido.status ===
                            'em_preparo' ||
                          pedido.status ===
                            'saiu_para_entrega',
                      ).length
                    }
                  </span>
                </div>

                <div
                  className={
                    styles.lista
                  }
                >
                  {pedidosFiltrados
                    .filter(
                      (pedido) =>
                        pedido.status ===
                          'confirmado' ||
                        pedido.status ===
                          'em_preparo' ||
                        pedido.status ===
                          'saiu_para_entrega',
                    )
                    .map(
                      renderPedidoCard,
                    )}
                </div>
              </section>
            )}

            {/* =================================================
                ATENÇÃO
                ================================================= */}

            {pedidosFiltrados.some(
              (pedido) =>
                pedido.status ===
                  'cancelado' &&
                pedido.resolucaoEstoque ===
                  'pendente',
            ) && (
              <section
                className={
                  styles.secao
                }
              >
                <div
                  className={
                    styles.secaoHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.secaoEyebrow
                      }
                    >
                      Estoque
                    </span>

                    <h2
                      className={
                        styles.secaoTitulo
                      }
                    >
                      Atenção necessária
                    </h2>
                  </div>

                  <span
                    className={
                      styles.secaoContador
                    }
                  >
                    {
                      pedidosFiltrados.filter(
                        (pedido) =>
                          pedido.status ===
                            'cancelado' &&
                          pedido.resolucaoEstoque ===
                            'pendente',
                      ).length
                    }
                  </span>
                </div>

                <div
                  className={
                    styles.lista
                  }
                >
                  {pedidosFiltrados
                    .filter(
                      (pedido) =>
                        pedido.status ===
                          'cancelado' &&
                        pedido.resolucaoEstoque ===
                          'pendente',
                    )
                    .map(
                      renderPedidoCard,
                    )}
                </div>
              </section>
            )}

            {/* =================================================
                CONCLUÍDOS
                ================================================= */}

            {pedidosFiltrados.some(
              (pedido) =>
                pedido.status ===
                'concluido',
            ) && (
              <section
                className={
                  styles.secao
                }
              >
                <div
                  className={
                    styles.secaoHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.secaoEyebrow
                      }
                    >
                      Histórico
                    </span>

                    <h2
                      className={
                        styles.secaoTitulo
                      }
                    >
                      Concluídos
                    </h2>
                  </div>

                  <span
                    className={
                      styles.secaoContador
                    }
                  >
                    {
                      pedidosFiltrados.filter(
                        (pedido) =>
                          pedido.status ===
                          'concluido',
                      ).length
                    }
                  </span>
                </div>

                <div
                  className={
                    styles.lista
                  }
                >
                  {pedidosFiltrados
                    .filter(
                      (pedido) =>
                        pedido.status ===
                        'concluido',
                    )
                    .map(
                      renderPedidoCard,
                    )}
                </div>
              </section>
            )}

            {/* =================================================
                CANCELADOS
                ================================================= */}

            {pedidosFiltrados.some(
              (pedido) =>
                pedido.status ===
                'cancelado',
            ) && (
              <section
                className={
                  styles.secao
                }
              >
                <div
                  className={
                    styles.secaoHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.secaoEyebrow
                      }
                    >
                      Histórico
                    </span>

                    <h2
                      className={
                        styles.secaoTitulo
                      }
                    >
                      Cancelados
                    </h2>
                  </div>

                  <span
                    className={
                      styles.secaoContador
                    }
                  >
                    {
                      pedidosFiltrados.filter(
                        (pedido) =>
                          pedido.status ===
                          'cancelado',
                      ).length
                    }
                  </span>
                </div>

                <div
                  className={
                    styles.lista
                  }
                >
                  {pedidosFiltrados
                    .filter(
                      (pedido) =>
                        pedido.status ===
                        'cancelado',
                    )
                    .map(
                      renderPedidoCard,
                    )}
                </div>
              </section>
            )}
          </>
        ) : (
          /* =================================================
             FILTRO ESPECÍFICO
             ================================================= */

          <section
            className={
              styles.secao
            }
          >
            <div
              className={
                styles.secaoHeader
              }
            >
              <div>
                <span
                  className={
                    styles.secaoEyebrow
                  }
                >
                  Pedidos
                </span>

                <h2
                  className={
                    styles.secaoTitulo
                  }
                >
                  {filtroStatus ===
                  'atencao'
                    ? 'Atenção necessária'
                    : STATUS_OPTIONS.find(
                        (
                          opcao,
                        ) =>
                          opcao.value ===
                          filtroStatus,
                      )?.label ||
                      'Pedidos'}
                </h2>
              </div>

              <span
                className={
                  styles.secaoContador
                }
              >
                {
                  pedidosFiltrados.length
                }
              </span>
            </div>

            <div
              className={
                styles.lista
              }
            >
              {pedidosFiltrados.map(
                renderPedidoCard,
              )}
            </div>
          </section>
        )}

        {/* FOOTER */}

        <footer
          className={
            styles.footer
          }
        >
          <div>
            <span
              className={
                styles.footerDot
              }
            />

            <span>
              Atualização automática
              a cada 30 segundos
            </span>
          </div>

          <span>
            {
              todosPedidos.length
            }{' '}
            {todosPedidos.length ===
            1
              ? 'pedido'
              : 'pedidos'}{' '}
            carregados
          </span>
        </footer>
      </div>
    </main>
  )
}