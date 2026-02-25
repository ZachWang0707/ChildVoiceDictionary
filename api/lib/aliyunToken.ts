import Core from '@alicloud/pop-core';

interface TokenInfo {
  id: string;
  expireTime: number;
}

export class AliyunTokenManager {
  private accessKeyId: string;
  private accessKeySecret: string;
  private client: Core;
  private cachedToken: TokenInfo | null = null;
  private bufferSeconds: number = 300;

  constructor(accessKeyId: string, accessKeySecret: string, bufferSeconds: number = 300) {
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.bufferSeconds = bufferSeconds;

    console.log('[Token] 初始化 TokenManager，AccessKeyId:', this.accessKeyId.substring(0, 8) + '...');

    this.client = new Core({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      endpoint: 'https://nls-meta.cn-shanghai.aliyuncs.com',
      apiVersion: '2019-02-28',
    });
  }

  private async fetchToken(): Promise<TokenInfo> {
    console.log('[Token] 正在获取新的阿里云 Token...');
    try {
      const result = await this.client.request('CreateToken', {}, {
        method: 'POST',
        formatParams: false,
      });

      console.log('[Token] 阿里云 API 响应:', JSON.stringify(result, null, 2));

      if (!result.Token || !result.Token.Id || !result.Token.ExpireTime) {
        throw new Error(`Failed to get token from Aliyun. Response: ${JSON.stringify(result)}`);
      }

      const tokenInfo: TokenInfo = {
        id: result.Token.Id,
        expireTime: result.Token.ExpireTime,
      };

      console.log('[Token] 成功获取 Token，过期时间:', new Date(tokenInfo.expireTime * 1000).toLocaleString());
      return tokenInfo;
    } catch (error) {
      console.error('[Token] 获取 Token 失败:', error);
      throw error;
    }
  }

  private isTokenExpired(token: TokenInfo): boolean {
    const now = Math.floor(Date.now() / 1000);
    return token.expireTime - now < this.bufferSeconds;
  }

  async getToken(): Promise<string> {
    if (!this.cachedToken || this.isTokenExpired(this.cachedToken)) {
      this.cachedToken = await this.fetchToken();
    }
    return this.cachedToken.id;
  }
}
