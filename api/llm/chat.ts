import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ArkLLM, HistoryMessage } from '../lib/arkLlm';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { history, currentInput } = req.body;

    if (!currentInput) {
      return res.status(400).json({ success: false, error: 'Missing currentInput' });
    }

    const apiKey = process.env.ARK_API_KEY || '';
    const baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    const endpointId = process.env.ARK_ENDPOINT_ID || '';

    if (!apiKey || !endpointId) {
      return res.status(500).json({ success: false, error: 'ARK credentials not configured' });
    }

    const promptPath = path.join(process.cwd(), 'api', 'prompts', 'sys_prompt_v1.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    const llm = new ArkLLM(apiKey, baseUrl, endpointId);
    const result = await llm.chat(systemPrompt, (history || []) as HistoryMessage[], currentInput);
    console.log(`[LLM] ${JSON.stringify(result)}`);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[LLM] Error:', error);
    res.status(500).json({
      success: false,
      action: 'chat',
      speech: '出错了，请重试'
    });
  }
}
