import { describe, expect, it } from 'vitest'

import { CryptoUtils } from './cryptoUtils'

describe('CryptoUtils', () => {
  const testToken = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456'

  describe('encryptToken', () => {
    it('should encrypt a token', () => {
      const encrypted = CryptoUtils.encryptToken(testToken)

      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(testToken)
      expect(encrypted.length).toBeGreaterThan(testToken.length)
      expect(encrypted).toContain(':') // Should contain IV separator
    })

    it('should produce different encrypted values for the same token (due to random IV)', () => {
      const encrypted1 = CryptoUtils.encryptToken(testToken)
      const encrypted2 = CryptoUtils.encryptToken(testToken)

      expect(encrypted1).not.toBe(encrypted2)
    })
  })

  describe('decryptToken', () => {
    it('should decrypt an encrypted token correctly', () => {
      const encrypted = CryptoUtils.encryptToken(testToken)
      const decrypted = CryptoUtils.decryptToken(encrypted)

      expect(decrypted).toBe(testToken)
    })

    it('should return plain text token unchanged if not encrypted', () => {
      const plainToken = 'ghp_plaintext123456789012345678901234567890'
      const result = CryptoUtils.decryptToken(plainToken)

      expect(result).toBe(plainToken)
    })

    it('should handle invalid encrypted format gracefully', () => {
      const invalidEncrypted = 'invalid:format:too:many:colons'
      const result = CryptoUtils.decryptToken(invalidEncrypted)

      // Should return the original string if decryption fails
      expect(result).toBe(invalidEncrypted)
    })

    it('should handle empty or malformed encrypted data', () => {
      const malformed = ':'
      const result = CryptoUtils.decryptToken(malformed)

      expect(result).toBe(malformed)
    })
  })

  describe('isTokenEncrypted', () => {
    it('should identify encrypted tokens', () => {
      const encrypted = CryptoUtils.encryptToken(testToken)

      expect(CryptoUtils.isTokenEncrypted(encrypted)).toBe(true)
    })

    it('should identify plain text tokens', () => {
      expect(CryptoUtils.isTokenEncrypted(testToken)).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(CryptoUtils.isTokenEncrypted('')).toBe(false)
      expect(CryptoUtils.isTokenEncrypted('short')).toBe(false)
      expect(CryptoUtils.isTokenEncrypted('no:colon:but:short')).toBe(false)
    })
  })

  describe('obfuscateToken', () => {
    it('should obfuscate a normal token', () => {
      const obfuscated = CryptoUtils.obfuscateToken(testToken)

      expect(obfuscated).toContain('ghp_')
      expect(obfuscated).toContain('3456')
      expect(obfuscated).toContain('*')
      expect(obfuscated.length).toBeLessThanOrEqual(testToken.length)
    })

    it('should handle short tokens', () => {
      const shortToken = 'short'
      const obfuscated = CryptoUtils.obfuscateToken(shortToken)

      expect(obfuscated).toBe('***')
    })

    it('should handle empty tokens', () => {
      const obfuscated = CryptoUtils.obfuscateToken('')

      expect(obfuscated).toBe('***')
    })

    it('should limit middle asterisks', () => {
      const longToken = 'a'.repeat(100)
      const obfuscated = CryptoUtils.obfuscateToken(longToken)

      // Should not have more than 20 asterisks in the middle
      const asteriskCount = (obfuscated.match(/\*/g) || []).length
      expect(asteriskCount).toBeLessThanOrEqual(20)
    })
  })

  describe('encryption/decryption round trip', () => {
    it('should maintain data integrity through multiple encrypt/decrypt cycles', () => {
      let current = testToken

      // Encrypt and decrypt multiple times
      for (let i = 0; i < 5; i++) {
        const encrypted = CryptoUtils.encryptToken(current)
        current = CryptoUtils.decryptToken(encrypted)
      }

      expect(current).toBe(testToken)
    })

    it('should work with various token formats', () => {
      const tokens = [
        'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456',
        'gho_1234567890abcdefghijklmnopqrstuvwxyz123456',
        'ghu_1234567890abcdefghijklmnopqrstuvwxyz123456',
        'ghs_1234567890abcdefghijklmnopqrstuvwxyz123456',
      ]

      tokens.forEach((token) => {
        const encrypted = CryptoUtils.encryptToken(token)
        const decrypted = CryptoUtils.decryptToken(encrypted)

        expect(decrypted).toBe(token)
      })
    })
  })
})
