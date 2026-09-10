export class Config {
  /**
   * =========================================================
   * BELO CÃO
   * CONFIGURAÇÃO CENTRAL
   * =========================================================
   */

  /**
   * Nome da loja
   */
  static readonly STORE_NAME =
    process.env.NEXT_PUBLIC_STORE_NAME || 'Belo Cão'

  /**
   * =========================================================
   * WHATSAPP
   * =========================================================
   */

  /**
   * Número oficial do WhatsApp
   *
   * Formato esperado:
   * 5512997093459
   */
  static readonly WHATSAPP_NUMBER =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') || ''

  /**
   * URL completa do WhatsApp
   */
  static readonly WHATSAPP_URL =
    process.env.NEXT_PUBLIC_WHATSAPP_URL ||
    (
      Config.WHATSAPP_NUMBER
        ? `https://wa.me/${Config.WHATSAPP_NUMBER}`
        : ''
    )

  /**
   * =========================================================
   * ENDEREÇO
   * =========================================================
   */

  /**
   * Endereço da loja para retirada
   */
  static readonly STORE_ADDRESS =
    process.env.NEXT_PUBLIC_STORE_ADDRESS || ''

  /**
   * Compatibilidade com componentes existentes
   */
  static readonly ADDRESS =
    Config.STORE_ADDRESS

  /**
   * =========================================================
   * TELEFONE
   * =========================================================
   */

  /**
   * Compatibilidade com componentes existentes.
   *
   * Usa o mesmo número oficial do WhatsApp.
   */
  static readonly PHONE =
    Config.WHATSAPP_NUMBER

  /**
   * =========================================================
   * HORÁRIO
   * =========================================================
   */

  static readonly OPENING_HOURS =
    process.env.NEXT_PUBLIC_OPENING_HOURS || ''

  /**
   * =========================================================
   * GOOGLE MAPS
   * =========================================================
   */

  static readonly GOOGLE_MAPS_EMBED_URL =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL || ''

  /**
   * =========================================================
   * INSTAGRAM
   * =========================================================
   */

  static readonly INSTAGRAM_URL =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || ''
}