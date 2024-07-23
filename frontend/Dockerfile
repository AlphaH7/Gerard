# Use the official Node.js image
FROM node:18

# Create and change to the app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application files
# COPY . .

# Build the application
# RUN npm run build

# format the application
# RUN npm run format

# Expose the port the app runs on
EXPOSE 7777

# # Start the application
CMD ["npm", "start"]

# Intermediately Start the application
# CMD ["npm", "dev-secure"]