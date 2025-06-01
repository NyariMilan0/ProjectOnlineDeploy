# Stage 1: Build the Angular app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --prod

# Stage 2: Serve with http-server
FROM node:20-alpine

WORKDIR /app

RUN npm install -g http-server

# Copy built files from the previous stage
COPY --from=build /app/dist/raktarproject/browser .

EXPOSE 8080

CMD ["http-server", ".", "-p", "8080"]
