import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 64
const ITERATIONS = 10000
const DIGEST = 'sha512'

export class AESHelper {
  /**
   * 生成随机盐值
   * @returns 十六进制格式的盐值
   */
  static generateSalt(): string {
    return crypto.randomBytes(SALT_LENGTH).toString('hex')
  }

  /**
   * 从密码派生密钥
   * @param password 原始密码
   * @param salt 盐值
   * @returns 派生密钥Buffer
   */
  static deriveKey(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
  }

  /**
   * AES加密
   * @param plainText 明文
   * @param key 加密密钥（Buffer格式）
   * @param iv 初始化向量（可选）
   * @returns 包含密文和IV的对象
   */
  static encrypt(
    plainText: string,
    key: Buffer,
    iv?: Buffer
  ): {
    cipherText: string
    iv: string
  } {
    try {
      const usedIv = iv || crypto.randomBytes(IV_LENGTH)
      const cipher = crypto.createCipheriv(ALGORITHM, key, usedIv)

      let encrypted = cipher.update(plainText, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      return {
        cipherText: encrypted,
        iv: usedIv.toString('hex')
      }
    } catch (error) {
      throw new Error(`加密失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * AES解密
   * @param cipherText 密文（十六进制格式）
   * @param key 加密密钥（Buffer格式）
   * @param iv 初始化向量（十六进制格式）
   * @returns 解密后的明文
   */
  static decrypt(cipherText: string, key: Buffer, iv: string): string {
    try {
      const ivBuffer = Buffer.from(iv, 'hex')
      const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer)

      let decrypted = decipher.update(cipherText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(
        `解密失败: ${error instanceof Error ? error.message : '密文可能被篡改或密钥错误'}`
      )
    }
  }

  /**
   * 生成随机IV
   * @returns 十六进制格式的IV
   */
  static generateIV(): string {
    return crypto.randomBytes(IV_LENGTH).toString('hex')
  }
}
