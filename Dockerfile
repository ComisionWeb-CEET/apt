FROM node:22-alpine
WORKDIR /app

# Instalamos solo las dependencias necesarias para producción
COPY package*.json ./
RUN npm install --omit=dev

# Copiamos el backend
COPY server.js ./

EXPOSE 8080
CMD ["node", "server.js"]