# Dockerfile pour le frontend Next.js
FROM node:20-alpine

WORKDIR /app

# Installer les dépendances
COPY package.json package-lock.json ./
RUN npm install

# Copier le code source
COPY . .

# Builder le frontend
RUN npm run build

# Exposer le port Next.js
EXPOSE 3000

# Lancer le serveur Next.js
CMD ["npm", "start"] 