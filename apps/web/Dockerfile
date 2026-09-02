FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @prospecting/web build
CMD ["pnpm","--filter","@prospecting/web","start"]