interface TTSV3RequestPayload {
  user: {
    uid: string;
  };
  req_params: {
    text: string;
    speaker: string;
    audio_params: {
      format: string;
      sample_rate: number;
    };
  };
}

interface TTSV3Response {
  reqid: string;
  code: number;
  message: string;
  data: {
    audio: string;
    duration: number;
  };
}

export class DoubaoTTS {
  private appId: string;
  private accessToken: string;
  private voiceType: string;
  private endpoint: string;

  constructor(
    appId: string,
    accessToken: string,
    voiceType: string = 'zh_female_qingxin',
    endpoint: string = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
  ) {
    this.appId = appId;
    this.accessToken = accessToken;
    this.voiceType = voiceType;
    this.endpoint = endpoint;
  }

  /**
   * 文本转语音
   * @param text 要合成的文本
   */
  async synthesize(text: string): Promise<Buffer> {
    const payload: TTSV3RequestPayload = {
      user: {
        uid: 'child-voice-dictionary',
      },
      req_params: {
        text,
        speaker: this.voiceType,
        audio_params: {
          format: 'mp3',
          sample_rate: 24000,
        },
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-Api-App-Id': this.appId,
      'X-Api-Access-Key': this.accessToken,
      'X-Api-Resource-Id': 'seed-tts-2.0',
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] Error: ${response.status}`, errorText);
      throw new Error(`TTS API failed: ${response.status} - ${errorText}`);
    }

    const rawText = await response.text();
    const lines = rawText.split('\n');
    let audioData = '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const chunk = JSON.parse(line);
          if (chunk.code !== undefined && chunk.code !== 0 && chunk.code !== 20000000) {
            console.error(`[TTS] Error: ${chunk.code} - ${chunk.message}`);
            throw new Error(`TTS error: ${chunk.message} (code: ${chunk.code})`);
          }
          if (chunk.data && typeof chunk.data === 'string') {
            audioData += chunk.data;
          }
        } catch (e) {
        }
      }
    }

    if (!audioData) {
      throw new Error('No audio data received from TTS');
    }

    return Buffer.from(audioData, 'base64');
  }
}
