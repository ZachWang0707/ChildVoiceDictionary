/**
 * 豆包语音识别（一句话识别，WebSocket 协议）
 * 注意：由于 WebSocket 在 Serverless 环境中的限制，
 * 第一版我们可以先实现一个简化版本，或者暂时使用 Mock 数据
 */

export class DoubaoASR {
  private appId: string;
  private accessToken: string;

  constructor(appId: string, accessToken: string) {
    this.appId = appId;
    this.accessToken = accessToken;
  }

  /**
   * 识别音频
   * TODO: 完整的 WebSocket 实现需要在长连接环境中运行
   * 第一版我们先返回 Mock 数据，或者使用其他方案
   */
  async recognize(audioBuffer: Buffer): Promise<string> {
    console.log('DoubaoASR: recognize called (Mock implementation)');
    
    // 第一版 Mock 实现
    return 'apple';
  }
}
