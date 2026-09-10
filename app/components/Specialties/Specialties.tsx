'use client'

import {
  ArrowRight,
  Bath,
  Coffee,
  Heart,
  Scissors,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'

import { Config } from '@/app/constants/config'
import styles  from './Specialties.module.css'

/* =========================================================
   BELO CÃO

   SPECIALTIES
   SERVIÇOS · EXPERIÊNCIAS · LOJINHA

   ROXO + BRANCO
   EDITORIAL · VIVO · DISCRETO
   ========================================================= */

const SPECIALTIES_DATA = [
  {
    number: '01',
    icon: Bath,
    title: 'Banho',
    description:
      'Um banho tranquilo, cuidadoso e pensado para deixar seu pet confortável.',
  },
  {
    number: '02',
    icon: Scissors,
    title: 'Tosa',
    description:
      'Tosa na máquina ou na tesoura, respeitando o estilo e as necessidades de cada pet.',
  },
  {
    number: '03',
    icon: Heart,
    title: 'Comportamento Animal',
    description:
      'Cuidado que considera o comportamento, o tempo e o jeito único de cada animal.',
  },
  {
    number: '04',
    icon: Sparkles,
    title: 'Estética Animal',
    description:
      'Cuidados completos para eles saírem bonitos, cheirosos e, principalmente, bem.',
  },
  {
    number: '05',
    icon: Coffee,
    title: 'Pet Coffee',
    description:
      'Enquanto eles ficam por aqui, você pode tomar um café e aproveitar o momento.',
  },
  {
    number: '06',
    icon: ShoppingBag,
    title: 'Lojinha',
    description:
      'Uma seleção de produtos e achadinhos para levar um pouco do Belo Cão para casa.',
  },
]

export function Specialties() {
  /* =======================================================
     LINK WHATSAPP
     ======================================================= */

  const getWhatsappLink = (
    title: string,
  ) => {
    const baseUrl =
      Config.WHATSAPP_URL

    /*
     * Se o WhatsApp não estiver configurado,
     * mantém o usuário dentro da página.
     */
    if (!baseUrl) {
      return '#contato'
    }

    const message =
      `Olá! Gostaria de saber mais sobre ${title} no Belo Cão.`

    /*
     * Mantém compatibilidade caso a URL já possua
     * parâmetros de consulta.
     */
    const separator =
      baseUrl.includes('?')
        ? '&'
        : '?'

    return `${baseUrl}${separator}text=${encodeURIComponent(
      message,
    )}`
  }

  return (
    <section
      id="especialidades"
      className={styles.specialties}
    >
      {/* =================================================
          INTRODUÇÃO
          ================================================= */}

      <div
        className={
          styles.sectionIntro
        }
      >
        <div
          className={
            styles.dentalEyebrow
          }
        >
          <span
            aria-hidden="true"
          />

          <span>
            O QUE TEM POR AQUI
          </span>
        </div>

        <h2>
          Cuidado para eles.
          <br />
          <em>
            Tempo para você.
          </em>
        </h2>

        <p>
          Do banho ao café, cada parte
          do Belo Cão foi pensada para
          deixar o momento mais gostoso.
        </p>
      </div>

      {/* =================================================
          GRID
          ================================================= */}

      <div
        className={
          styles.specialtyGrid
        }
      >
        {SPECIALTIES_DATA.map(
          (item) => {
            const Icon =
              item.icon

            const customLink =
              getWhatsappLink(
                item.title,
              )

            return (
              <article
                key={item.number}
              >
                {/* =========================================
                    NÚMERO
                    ========================================= */}

                <span
                  className={
                    styles.specialtyNumber
                  }
                  aria-hidden="true"
                >
                  {item.number}
                </span>

                {/* =========================================
                    ÍCONE
                    ========================================= */}

                <div
                  className={
                    styles.icon
                  }
                  aria-hidden="true"
                >
                  <Icon
                    size={21}
                    strokeWidth={1.9}
                  />
                </div>

                {/* =========================================
                    TÍTULO
                    ========================================= */}

                <h3>
                  {item.title}
                </h3>

                {/* =========================================
                    DESCRIÇÃO
                    ========================================= */}

                <p>
                  {item.description}
                </p>

                {/* =========================================
                    AÇÃO
                    ========================================= */}

                <a
                  href={customLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Saber mais sobre ${item.title}`}
                >
                  <span>
                    saber mais
                  </span>

                  <ArrowRight
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </a>
              </article>
            )
          },
        )}
      </div>
    </section>
  )
}