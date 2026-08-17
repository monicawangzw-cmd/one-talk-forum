# 用 Node 20 官方镜像（Alpine 版更小、部署更快）
FROM node:20-alpine AS base

# ============ 第一阶段：安装依赖 ============
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# ============ 第二阶段：构建 ============
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 构建时需要的环境变量（Sealos 上以后在控制台填）
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ============ 第三阶段：运行（最终镜像，尽量小） ============
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 非 root 用户运行，更安全
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# 复制构建产物和依赖
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 数据目录（本地存储用，Sealos 容器重启数据会丢，所以推荐配 Upstash）
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

# 容器对外端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
