# Dockerfile pour le backend Flask
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Exposer le port Flask
EXPOSE 5000

# Lancer le serveur Flask
CMD ["python", "-m", "backend.api.server"] 