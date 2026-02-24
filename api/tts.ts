import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DoubaoTTS } from './lib/doubaoTts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const appId = process.env.DOUBAO_VOICE_APP_ID || '';
    const accessToken = process.env.DOUBAO_VOICE_ACCESS_TOKEN || '';
    const voiceType = process.env.DOUBAO_TTS_VOICE_TYPE || 'zh_female_qingxin';

    if (!appId || !accessToken) {
      return res.status(500).json({ error: 'Doubao TTS credentials not configured' });
    }

    const tts = new DoubaoTTS(appId, accessToken, voiceType);
    
    console.log(`[TTS] 开始播报: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    const audioBuffer = await tts.synthesize(text);
    const audioBase64 = audioBuffer.toString('base64');

    res.status(200).json({ audio: audioBase64 });
  } catch (error) {
    console.error('[TTS] Error:', error);
    res.status(500).json({ error: 'TTS failed' });
  }
}
