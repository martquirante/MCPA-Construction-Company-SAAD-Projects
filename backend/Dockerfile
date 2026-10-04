FROM node:20-bullseye-slim

WORKDIR /app

# Install Python 3, pip, and required system libraries for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install OpenCV and NumPy for Python
RUN pip3 install --no-cache-dir opencv-python-headless numpy

# Copy dependency manifests
COPY package*.json ./

# Install clean production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

EXPOSE 5000

ENV PORT=5000
CMD ["node", "src/server.js"]
