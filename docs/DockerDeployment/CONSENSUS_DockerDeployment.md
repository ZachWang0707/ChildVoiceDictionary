# Docker 部署 - 共识文档

## 明确的需求描述
- 使用工程改动规模最小的办法，把系统用 Docker 部署在轻量服务器上
- 将可选的优化建议，作为后续版本的 TODO 项，放在合适的文档位置

## 验收标准
- ✅ 创建必要的 Docker 配置文件（Dockerfile、.dockerignore、docker-compose.yml）
- ✅ 修改必要的配置（vite.config.ts 添加 host: '0.0.0.0'）
- ✅ 更新 TODO_ChildVoiceDictionary.md，添加后续优化项
- ✅ 可以在本地成功构建和运行 Docker 容器
- ✅ 可以通过 http://localhost:5173 访问应用

## 技术实现方案
- **方案**：最小改动 Docker 部署
- **架构**：开发模式直接打包进 Docker，和本地运行一致
- **核心改动**：
  - 新增 3 个文件：Dockerfile、.dockerignore、docker-compose.yml
  - 修改 1 个配置：vite.config.ts
- **后续优化**：记录在 TODO_ChildVoiceDictionary.md 中

## 技术约束
- 保持与现有代码结构兼容
- 最小化代码改动
- 确保在 Docker 容器中能正常运行

## 任务边界限制
- 不进行大规模架构重构
- 不修改业务逻辑代码（除了必要的配置调整）
- 不实现生产级别的高可用、负载均衡等高级特性

## 验收标准（重复强调）
1. Docker 配置文件创建完成
2. 本地可以成功构建和运行 Docker 容器
3. 应用功能正常可用
4. 后续优化项已记录在 TODO 文档中
