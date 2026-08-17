ARG SOURCE_GIT_SHA=unknown
ARG SOURCE_BUILD_ID=unknown

FROM node:20-bookworm-slim AS dependencies

WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates python3 \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY tsconfig.json ./
COPY src ./src
COPY frontend ./frontend
COPY scripts/runPython.mjs ./scripts/runPython.mjs
COPY python ./python
# Regenerated deterministically at build time (fixed default seed in
# generate_synthetic_pdp_data.py) rather than COPY-ing a local, gitignored
# file -- guarantees local/demo/simulation all validate staff ID/sex/age
# against byte-identical synthetic HRMS data, regardless of who builds the
# image or when.
RUN pnpm run synthetic:employees
RUN pnpm run build
RUN pnpm run build:web
RUN pnpm prune --prod

FROM node:20-bookworm-slim AS runner

ARG SOURCE_GIT_SHA
ARG SOURCE_BUILD_ID

ENV NODE_ENV=production
ENV PORT=8080
ENV APP_GIT_SHA=${SOURCE_GIT_SHA}
ENV APP_BUILD_ID=${SOURCE_BUILD_ID}

LABEL org.opencontainers.image.title="AiMLTriage"
LABEL org.opencontainers.image.source="https://github.com/irisstar-tech/AiMlTriage"
LABEL org.opencontainers.image.revision=${SOURCE_GIT_SHA}
LABEL tech.irisstar.cloud-build-id=${SOURCE_BUILD_ID}

WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/dist-web ./dist-web
COPY --from=build --chown=node:node /app/data ./data
COPY --chown=node:node docs/protocol-review/data ./docs/protocol-review/data
# Scheduled operational scripts that run as Cloud Run Jobs against this same
# image (accessEntitlementReview.mjs - NFR-036/CSQ IS.17-19) - plain Node
# scripts with no build step, included as source rather than compiled.
COPY --chown=node:node scripts/accessEntitlementReview.mjs ./scripts/accessEntitlementReview.mjs
COPY --chown=node:node scripts/dastProbe.mjs ./scripts/dastProbe.mjs
COPY --chown=node:node scripts/generateMonthlySliReport.mjs ./scripts/generateMonthlySliReport.mjs

EXPOSE 8080

# Run as the non-root `node` user (built into the base image, UID 1000)
# rather than the default root - container escapes/RCE against this process
# should not grant root inside the container.
USER node

CMD ["node", "dist/index.js"]
