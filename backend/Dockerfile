# Use official Playwright image with browsers preinstalled
FROM mcr.microsoft.com/playwright:v1.55.0-jammy

WORKDIR /app

# Copy only package files first for better caching
COPY package*.json ./

ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN npm ci --omit=dev

# Copy source
COPY src ./src

EXPOSE 10000

CMD ["npm", "start"]

