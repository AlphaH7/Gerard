# Use the official Node.js image
FROM node:18

# Create and change to the app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application files
COPY . .

# format the application
RUN npm run format

# Build the application
RUN npm run build

# Build prod image
RUN npm run build-prod

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

