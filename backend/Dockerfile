FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install clean production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
