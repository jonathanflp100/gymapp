# Servidor da academia (GymApp Hub): sem dependências, só Node.
FROM node:22-alpine
WORKDIR /app
COPY server.mjs ./
RUN mkdir -p /data
ENV PORT=4000 DATA_DIR=/data
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:4000/api/hub/health || exit 1
CMD ["node", "server.mjs"]
