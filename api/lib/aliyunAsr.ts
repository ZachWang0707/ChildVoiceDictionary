/**
 * 阿里云智能语音交互 - 一句话识别（RESTful API）
 * 文档：https://help.aliyun.com/zh/isi/developer-reference/restful-api-2
 */

interface AliyunASRResponse {
  task_id: string;
  result: string;
  status: number;
  message: string;
}

export class AliyunASR {
  private appKey: string;
  private token: string;
  private endpoint: string;

  constructor(appKey: string, token: string, endpoint: string = 'https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr') {
    this.appKey = appKey;
    this.token = token;
    this.endpoint = endpoint;
  }

  /**
   * 识别音频
   * @param audioBuffer 音频二进制数据
   * @param format 音频格式，默认 wav
   * @param sampleRate 采样率，默认 16000
   */
  async recognize(
    audioBuffer: Buffer,
    format: string = 'wav',
    sampleRate: number = 16000
  ): Promise<string> {
    const url = this.buildUrl(format, sampleRate);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-NLS-Token': this.token,
        'Content-Type': 'application/octet-stream',
        'Content-Length': audioBuffer.length.toString(),
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      throw new Error(`Aliyun ASR request failed: ${response.status}`);
    }

    const result: AliyunASRResponse = await response.json();

    if (result.status !== 20000000) {
      throw new Error(`Aliyun ASR error: ${result.message} (status: ${result.status})`);
    }

    return result.result;
  }

  /**
   * 构建请求 URL
   */
  private buildUrl(format: string, sampleRate: number): string {
    const params = new URLSearchParams({
      appkey: this.appKey,
      format,
      sample_rate: sampleRate.toString(),
      enable_punctuation_prediction: 'false',
      enable_inverse_text_normalization: 'false',
      enable_voice_detection: 'false',
    });

    return `${this.endpoint}?${params.toString()}`;
  }
}
