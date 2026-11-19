# Multi-stage build: compile the Vite/React app, serve the static output with nginx.
# VITE_API_BASE_URL is baked in at build time (Vite inlines import.meta.env.* at
# build, not at container start) -- pass it as a build arg if you need to point
# the built bundle at a non-default backend URL.

FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
