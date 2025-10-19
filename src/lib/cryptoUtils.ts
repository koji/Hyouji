import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto'
import { homedir } from 'os'

/**
 * Utility class for encrypting and decrypting sensitive data like tokens
 */
export class CryptoUtils {
  private static readonly ALGORITHM = 'aes-256-cbc'
  private static readonly ENCODING: BufferEncoding = 'hex'

  /**
   * Generate a machine-specific key based on system information
   * This provides basic obfuscation without requiring user passwords
   */
  private static generateMachineKey(): Buffer {
    // Use system-specific information to generate a consistent key
    const machineInfo = [
      homedir(),
      process.platform,
      process.arch,
      process.env.USER || process.env.USERNAME || 'default',
    ].join('|')

    // Create a hash of the machine info to use as encryption key
    return createHash('sha256').update(machineInfo).digest()
  }

  /**
   * Encrypt a token using machine-specific key
   * @param token - The token to encrypt
   * @returns Encrypted token string
   */
  static encryptToken(token: string): string {
    try {
      const key = this.generateMachineKey()
      const iv = randomBytes(16)
      const cipher = createCipheriv(this.ALGORITHM, key, iv)

      let encrypted = cipher.update(token, 'utf8', this.ENCODING)
      encrypted += cipher.final(this.ENCODING)

      // Prepend IV to encrypted data
      return iv.toString(this.ENCODING) + ':' + encrypted
    } catch {
      // If encryption fails, return the original token
      // This ensures backward compatibility
      console.warn('⚠️  Token encryption failed, storing in plain text')
      return token
    }
  }

  /**
   * Decrypt a token using machine-specific key
   * @param encryptedToken - The encrypted token string
   * @returns Decrypted token string
   */
  static decryptToken(encryptedToken: string): string {
    try {
      // Check if token is encrypted (contains ':' separator)
      if (!encryptedToken.includes(':')) {
        // Token is not encrypted, return as-is for backward compatibility
        return encryptedToken
      }

      const [ivHex, encrypted] = encryptedToken.split(':')
      if (!ivHex || !encrypted) {
        // Invalid format, return as-is
        return encryptedToken
      }

      const key = this.generateMachineKey()
      const iv = Buffer.from(ivHex, this.ENCODING)
      const decipher = createDecipheriv(this.ALGORITHM, key, iv)

      let decrypted = decipher.update(encrypted, this.ENCODING, 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch {
      // If decryption fails, return the original string
      // This handles cases where the token might not be encrypted
      console.warn('⚠️  Token decryption failed, using as plain text')
      return encryptedToken
    }
  }

  /**
   * Check if a token appears to be encrypted
   * @param token - Token to check
   * @returns True if token appears to be encrypted
   */
  static isTokenEncrypted(token: string): boolean {
    // Simple check: encrypted tokens contain ':' and are longer than typical GitHub tokens
    return token.includes(':') && token.length > 50
  }

  /**
   * Obfuscate a token for display purposes (show only first/last few characters)
   * @param token - Token to obfuscate
   * @returns Obfuscated token string
   */
  static obfuscateToken(token: string): string {
    if (!token || token.length < 8) {
      return '***'
    }

    const start = token.substring(0, 4)
    const end = token.substring(token.length - 4)
    const middle = '*'.repeat(Math.min(token.length - 8, 20))

    return `${start}${middle}${end}`
  }
}
