FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @prospecting/db generate && pnpm --filter @prospecting/core build && pnpm --filter @prospecting/worker build
CMD ["pnpm","--filter","@prospecting/worker","start"]