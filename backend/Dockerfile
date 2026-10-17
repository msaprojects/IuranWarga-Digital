# syntax=docker/dockerfile:1

########## Stage 1: install dependencies ##########
FROM oven/bun:1 AS deps
WORKDIR /app

# Install only what is needed first; cache by lockfile.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

########## Stage 2: build the bundle ##########
FROM oven/bun:1 AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `contract.json` is inlined into the bundle at build time (see src/prisma/db.ts),
# so the produced dist/server.js is self-contained.
RUN bun run build

########## Stage 3: runtime ##########
FROM oven/bun:1 AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# The build bundles all application + dependency code into dist/server.js.
COPY --from=build /app/dist ./dist

# Directory where generated QR code images are written at runtime.
RUN mkdir -p /app/uploads/qrcodes

EXPOSE 3000

CMD ["bun", "dist/server.js"]
