FROM node:20-alpine

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Make start script executable
RUN chmod +x start.sh

# Start the application
CMD ["./start.sh"]
