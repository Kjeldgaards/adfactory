FROM node:20-slim

# Install Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    fonts-dejavu-core \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Google Fonts subset (most common)
RUN apt-get update && apt-get install -y \
    fonts-open-sans \
    fonts-roboto \
    fonts-lato \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --production

# Copy app
COPY . .

# Create directories
RUN mkdir -p templates data

EXPOSE 3000

CMD ["node", "server.js"]
