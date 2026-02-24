#!/bin/bash

# ChildVoiceDictionary 启动脚本
# 使用方法：./run.sh

echo "🚀 正在启动 ChildVoiceDictionary..."
echo ""

# 检查是否有正在运行的 npm 进程
if pgrep -f "npm run dev" > /dev/null; then
    echo "⚠️  检测到正在运行的服务，正在停止..."
    pkill -f "npm run dev"
    sleep 2
fi

# 启动服务并保存日志
echo "📝 日志将同时输出到终端和 dev.log 文件"
echo ""
npm run dev 2>&1 | tee dev.log
