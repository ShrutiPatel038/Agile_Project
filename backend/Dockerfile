FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS release
# Non-root user for security
RUN addgroup -S evgo && adduser -S evgo -G evgo

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Runtime directories (not committed to git)
RUN mkdir -p uploads/invoices uploads/images logs \
    && chown -R evgo:evgo /app

USER evgo

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
