import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AliyunASR } from './lib/aliyunAsr';

function getRequestBody(req: any): Promise<Buffer> {
  if (req.body && Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const appKey = process.env.ALIYUN_ASR_APPKEY || '';
    const token = process.env.ALIYUN_ASR_TOKEN || '';

    if (!appKey || !token) {
      return res.status(500).json({ error: 'Aliyun ASR credentials not configured' });
    }

    const asr = new AliyunASR(appKey, token);
    const audioBuffer = await getRequestBody(req);
    const text = await asr.recognize(audioBuffer, 'wav', 16000);
    console.log(`[ASR] ${text}`);
    
    res.status(200).json({ text });
  } catch (error) {
    console.error('[ASR] Error:', error);
    res.status(500).json({ error: 'ASR failed' });
  }
}
