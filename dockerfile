FROM oven/bun:1.3-alpine

WORKDIR /app

# Copia tudo para o container
COPY . .

# Instala dependências de todas as workspaces
RUN bun install --frozen-lockfile

# Builda o frontend (turbo build → vite build → apps/frontend/dist/)
RUN bun run build

EXPOSE 3001

# Inicia o backend (que também serve o frontend)
CMD ["bun", "run", "apps/backend/src/index.ts"]