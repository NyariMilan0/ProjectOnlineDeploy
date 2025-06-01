# Base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install http-server
RUN npm install -g http-server

# Copy built Angular files into the image
COPY dist/raktarproject/browser /app

# Expose the port http-server will run on
EXPOSE 8080

# Serve the app using http-server
CMD ["http-server", ".", "-p", "8080"]
