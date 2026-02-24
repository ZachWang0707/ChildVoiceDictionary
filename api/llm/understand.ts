import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ArkLLM } from '../lib/arkLlm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { history, currentInput } = req.body;

    console.log('[API /api/llm/understand] Received request');
    console.log('[API /api/llm/understand] Current input:', currentInput?.substring(0, 100));

    if (!currentInput) {
      return res.status(400).json({ success: false, error: 'Missing currentInput' });
    }

    const apiKey = process.env.ARK_API_KEY || '';
    const baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    const endpointId = process.env.ARK_ENDPOINT_ID || '';

    if (!apiKey || !endpointId) {
      return res.status(500).json({ success: false, error: 'ARK credentials not configured' });
    }

    const llm = new ArkLLM(apiKey, baseUrl, endpointId);
    const result = await llm.understandIntent(history || [], currentInput);
    console.log('[API /api/llm/understand] Intent result:', result);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[API /api/llm/understand] Error:', error);
    res.status(500).json({
      success: false,
      intent: 'unclear',
      response: '出错了，请重试'
    });
  }
}
