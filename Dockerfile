# 使用 Node.js 20 作为基础镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有源代码
COPY . .

# 暴露端口
EXPOSE 5173
EXPOSE 3001

# 启动命令
CMD ["npm", "run", "dev"]
