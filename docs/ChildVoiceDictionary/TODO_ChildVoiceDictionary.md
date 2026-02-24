# ChildVoiceDictionary 待办事项

## 🔥 高优先级（当前版本）

### 1. 火山引擎 TTS API 权限问题
- **问题**：当前 TTS API 返回 403 错误 - "requested resource not granted"
- **位置**：`api/lib/doubaoTts.ts`
- **说明**：浏览器 SpeechSynthesis 作为兜底可以用，但体验不如火山引擎 TTS
- **建议**：检查火山引擎控制台中豆包语音服务的权限配置

### 2. 阿里云 ASR Access Token 刷新
- **问题**：当前使用临时 Access Token，有效期24小时
- **位置**：`api/lib/aliyunAsr.ts`
- **说明**：文档参考：https://help.aliyun.com/zh/isi/getting-started/obtain-an-access-token-1/
- **建议**：实现自动刷新 Access Token 的逻辑

---

## 📋 中优先级（下一个版本）

### 3. 数据库集成
- **需求**：将生词表从 localStorage 迁移到 SQLite / Turso
- **说明**：第一版先用 localStorage，后续迭代

### 4. 交互数据记录
- **需求**：记录完整的用户交互历史（文字内容）
- **说明**：第一版先不做，后续用于产品优化

### 5. 用户账号体系
- **需求**：支持用户登录、账号管理
- **说明**：后续迭代

### 6. 单词复习功能
- **需求**：基于生词表的复习功能
- **说明**：后续迭代

---

## ✅ 已完成
- [x] 新方案重写应用
- [x] 意图驱动架构
- [x] 打断机制
- [x] 完整单词释义（读音+词性+含义+举例）
- [x] 三种按钮颜色状态
- [x] 两种按钮交互模式
