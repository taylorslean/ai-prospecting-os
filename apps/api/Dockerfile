FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @prospecting/db generate && pnpm --filter @prospecting/core build && pnpm --filter @prospecting/api build
CMD ["sh","-c","pnpm --filter @prospecting/db migrate && pnpm --filter @prospecting/db seed && pnpm --filter @prospecting/api start"]