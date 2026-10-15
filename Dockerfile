# Stage 1 - build
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 - serve
FROM nginx:1.31-alpine
COPY --from=build /app/dist/mattjarrett-dev/browser /usr/share/nginx/html
EXPOSE 80
