import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ArkLLM } from '../lib/arkLlm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word } = req.body;

    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const apiKey = process.env.ARK_API_KEY || '';
    const baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    const endpointId = process.env.ARK_ENDPOINT_ID || '';

    if (!apiKey || !endpointId) {
      return res.status(500).json({ error: 'ARK credentials not configured' });
    }

    const llm = new ArkLLM(apiKey, baseUrl, endpointId);
    
    const explanation = await llm.explain(word);

    res.status(200).json({ explanation });
  } catch (error) {
    console.error('LLM error:', error);
    res.status(500).json({ error: 'LLM failed' });
  }
}
