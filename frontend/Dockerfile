FROM node:20-alpine

WORKDIR /app

# Install dependencies based on package-lock
COPY package*.json ./
RUN npm install

# Copy frontend source
COPY . .

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]
