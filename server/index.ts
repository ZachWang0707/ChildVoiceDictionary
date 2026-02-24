import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

import asrHandler from '../api/asr';
import ttsHandler from '../api/tts';
import llmExplainHandler from '../api/llm/explain';
import llmUnderstandHandler from '../api/llm/understand';
import llmChatHandler from '../api/llm/chat';

app.post('/api/asr', async (req, res) => {
  console.log('[API] POST /api/asr');
  try {
    const vercelReq: any = {
      method: req.method,
      body: req.body,
    };
    const vercelRes: any = {
      status: (code: number) => {
        res.status(code);
        return vercelRes;
      },
      json: (data: any) => res.json(data),
    };
    await asrHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('ASR error:', error);
    res.status(500).json({ error: 'ASR failed' });
  }
});
console.log('✅ /api/asr 已加载');

app.post('/api/tts', async (req, res) => {
  console.log('[API] POST /api/tts');
  try {
    const vercelReq: any = {
      method: req.method,
      body: req.body,
    };
    const vercelRes: any = {
      status: (code: number) => {
        res.status(code);
        return vercelRes;
      },
      json: (data: any) => res.json(data),
    };
    await ttsHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS failed' });
  }
});
console.log('✅ /api/tts 已加载');

app.post('/api/llm/explain', async (req, res) => {
  console.log('[API] POST /api/llm/explain');
  try {
    const vercelReq: any = {
      method: req.method,
      body: req.body,
    };
    const vercelRes: any = {
      status: (code: number) => {
        res.status(code);
        return vercelRes;
      },
      json: (data: any) => res.json(data),
    };
    await llmExplainHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('LLM explain error:', error);
    res.status(500).json({ error: 'LLM explain failed' });
  }
});
console.log('✅ /api/llm/explain 已加载');

app.post('/api/llm/understand', async (req, res) => {
  console.log('[API] POST /api/llm/understand');
  try {
    const vercelReq: any = {
      method: req.method,
      body: req.body,
    };
    const vercelRes: any = {
      status: (code: number) => {
        res.status(code);
        return vercelRes;
      },
      json: (data: any) => res.json(data),
    };
    await llmUnderstandHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('LLM understand error:', error);
    res.status(500).json({ error: 'LLM understand failed' });
  }
});
console.log('✅ /api/llm/understand 已加载');

app.post('/api/llm/chat', async (req, res) => {
  console.log('[API] POST /api/llm/chat');
  try {
    const vercelReq: any = {
      method: req.method,
      body: req.body,
    };
    const vercelRes: any = {
      status: (code: number) => {
        res.status(code);
        return vercelRes;
      },
      json: (data: any) => res.json(data),
    };
    await llmChatHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('LLM chat error:', error);
    res.status(500).json({ error: 'LLM chat failed' });
  }
});
console.log('✅ /api/llm/chat 已加载');

app.listen(PORT, () => {
  console.log(`\n🚀 本地后端服务器已启动: http://localhost:${PORT}`);
  console.log(`\n💡 前端会通过 Vite 代理到这个服务器\n`);
});

