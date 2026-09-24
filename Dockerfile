# Usar imagen ligera de Node.js
FROM node:22-alpine

WORKDIR /app

# Copiar configuración
COPY package*.json ./

# Instalar dependencias ignorando conflictos estrictos de pares (peer dependencies)
RUN npm install --legacy-peer-deps

# Copiar el resto del código
COPY . .

# Ejecutar el build de Vite
RUN npm run build

# Exponer el puerto interno correspondiente a la API de monedas
EXPOSE 8081

# Ejecutar el servidor compilado
CMD ["npm", "start"]