# Stage 1: Build the Vite + TypeScript app
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install

COPY . .

ARG ENVIRONMENT
ARG NODE_OPTIONS
ENV NODE_OPTIONS=${NODE_OPTIONS}

RUN npm run build -- --mode ${ENVIRONMENT}

# Stage 2: Serve using nginx
FROM nginx:stable

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]