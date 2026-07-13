FROM node:20-bookworm-slim AS dependencies

WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY tsconfig.json ./
COPY src ./src
COPY frontend ./frontend
RUN pnpm run build
RUN pnpm run build:web
RUN pnpm prune --prod

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-web ./dist-web

EXPOSE 8080

CMD ["node", "dist/index.js"]
