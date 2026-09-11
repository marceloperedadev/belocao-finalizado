
'use client'

import {
  ArrowUpRight,
  Camera,
  Coffee,
  Heart,
  MapPin,
  Scissors,
  X,
} from 'lucide-react'

import styles from './SpaceExperience.module.css'

type SpaceExperienceProps = {
  isOpen: boolean
  onClose: () => void
}

export function SpaceExperience({
  isOpen,
  onClose,
}: SpaceExperienceProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="space-title"
      onClick={onClose}
    >
      <div
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
      >
        {/* =====================================================
            BOTÃO FECHAR
        ===================================================== */}

        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar conhecer o espaço"
        >
          <X
            size={20}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        {/* =====================================================
            CABEÇALHO
        ===================================================== */}

        <header className={styles.header}>
          <div className={styles.eyebrow}>
            <span>02</span>

            <i aria-hidden="true" />

            <span>O ESPAÇO</span>
          </div>

          <div className={styles.headerContent}>
            <div>
              <h2 id="space-title">
                ONDE ELES
                <br />
                <span>GOSTAM DE FICAR.</span>
              </h2>
            </div>

            <div className={styles.description}>
              <p>
                Um espaço pensado para banho,
                cuidado, café e bons momentos.
              </p>

              <div className={styles.location}>
                <MapPin
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <span>TAUBATÉ · SP</span>
              </div>
            </div>
          </div>
        </header>

        {/* =====================================================
            GALERIA
        ===================================================== */}

        <div className={styles.gallery}>
          {/* FOTO PRINCIPAL */}

          <div className={styles.mainPhoto}>
            <div className={styles.placeholder}>
              <Camera
                size={30}
                strokeWidth={1.5}
                aria-hidden="true"
              />

              <span>Foto principal do espaço</span>

              <small>
                Fachada, ambiente ou uma foto marcante
              </small>
            </div>

            <div className={styles.photoNumber}>
              01
            </div>

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

          <div className={styles.sideGallery}>
            <div className={styles.smallPhoto}>
              <div className={styles.placeholder}>
                <Scissors
                  size={24}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                <span>Estética Animal</span>

                <small>
                  Foto do banho e tosa
                </small>
              </div>

              <div className={styles.photoNumber}>
                02
              </div>
            </div>

            <div className={styles.smallPhoto}>
              <div className={styles.placeholder}>
                <Coffee
                  size={24}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                <span>Pet Coffee</span>

                <small>
                  Foto do café e ambiente
                </small>
              </div>

              <div className={styles.photoNumber}>
                03
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            RODAPÉ
        ===================================================== */}

        <footer className={styles.footer}>
          <div className={styles.footerText}>
            <span>UM LUGAR DIFERENTE</span>

            <strong>
              Cuidado para eles.
              <br />
              Conforto para você.
            </strong>
          </div>

          <div className={styles.services}>
            <span>
              <Scissors
                size={14}
                strokeWidth={2}
                aria-hidden="true"
              />
              Estética
            </span>

            <span>
              <Coffee
                size={14}
                strokeWidth={2}
                aria-hidden="true"
              />
              Pet Coffee
            </span>

            <span>
              <Heart
                size={14}
                strokeWidth={2}
                aria-hidden="true"
              />
              Cuidado
            </span>
          </div>

          <button
            type="button"
            className={styles.continue}
            onClick={onClose}
          >
            <span>continuar navegando</span>

            <ArrowUpRight
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </footer>
      </div>
    </div>
  )
}
