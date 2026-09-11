'use client'

import Image from 'next/image'
import {
  ArrowUpRight,
  Coffee,
  Heart,
  MapPin,
  Scissors,
} from 'lucide-react'

import styles from './Espaco.module.css'

export function Espaco() {
  return (
    <section
      id="espaco"
      className={styles.section}
      aria-labelledby="espaco-title"
    >
      <div className={styles.shell}>
        <div className={styles.stickyFrame}>
          {/* =====================================================
              CABEÇALHO
          ===================================================== */}
          <div className={styles.header}>
            <div className={styles.eyebrow}>
              <span className={styles.number}>02</span>

              <span className={styles.line} aria-hidden="true" />

              <span>O ESPAÇO</span>
            </div>

            <div className={styles.headerGrid}>
              <div className={styles.heading}>
                <h2 id="espaco-title">
                  ONDE ELES
                  <br />
                  <span>GOSTAM DE</span>
                  <br />
                  FICAR.
                </h2>
              </div>

              <div className={styles.intro}>
                <p>
                  Mais do que um lugar para banho e tosa.
                  <strong>
                    {' '}
                    Um espaço pensado para eles ficarem bem
                    enquanto você também aproveita.
                  </strong>
                </p>

                <a
                  href="#especialidades"
                  className={styles.textLink}
                >
                  <span>conhecer o Belo Cão</span>

                  <span
                    className={styles.textLinkIcon}
                    aria-hidden="true"
                  >
                    <ArrowUpRight size={16} strokeWidth={2.3} />
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* =====================================================
              COMPOSIÇÃO VISUAL
          ===================================================== */}
          <div className={styles.composition}>
            {/* FOTO PRINCIPAL */}
            <div className={styles.mainPhoto}>
              <div className={styles.photoMeta}>
                <span>01</span>
                <span>POR AQUI</span>
              </div>

              <Image
                src="/images/cao-cliente.jpg"
                alt="Cão cliente no espaço Belo Cão"
                fill
                sizes="(max-width: 700px) 100vw, 58vw"
                className={styles.image}
              />

              <div
                className={styles.photoOverlay}
                aria-hidden="true"
              />

              <div className={styles.photoCaption}>
                <Heart
                  size={15}
                  fill="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <span>eles gostam daqui</span>
              </div>
            </div>

            {/* FOTOS SECUNDÁRIAS */}
            <div className={styles.sidePhotos}>
              <div className={styles.secondaryPhoto}>
                <div className={styles.photoPlaceholder}>
                  <Scissors
                    size={24}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />

                  <span>foto da estética</span>
                </div>

                <div className={styles.photoLabel}>
                  <span>02</span>
                  <strong>ESTÉTICA</strong>
                </div>
              </div>

              <div className={styles.secondaryPhoto}>
                <div className={styles.photoPlaceholder}>
                  <Coffee
                    size={24}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />

                  <span>foto do pet coffee</span>
                </div>

                <div className={styles.photoLabel}>
                  <span>03</span>
                  <strong>PET COFFEE</strong>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              CARACTERÍSTICAS
          ===================================================== */}
          <div className={styles.bottom}>
            <div className={styles.location}>
              <MapPin
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />

              <div>
                <span>TAUBATÉ · SP</span>
                <strong>Um espaço feito para pets e pessoas.</strong>
              </div>
            </div>

            <div className={styles.features}>
              <div className={styles.feature}>
                <span>01</span>
                <strong>Cuidado</strong>
                <p>Cada pet no seu tempo.</p>
              </div>

              <div className={styles.feature}>
                <span>02</span>
                <strong>Conforto</strong>
                <p>Um ambiente pensado para eles.</p>
              </div>

              <div className={styles.feature}>
                <span>03</span>
                <strong>Experiência</strong>
                <p>Café, cuidado e companhia.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}