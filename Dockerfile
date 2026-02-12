# Use an official Node.js runtime as a parent image
FROM node:22-alpine
 
# Set the working directory in the container
WORKDIR /app
 
# Copy package.json and package-lock.json files
COPY package.json package-lock.json ./
 
# Install dependencies
RUN npm install
 
# Copy the rest of the application code
COPY . .
 
# Build the application
RUN npm run build
 
# Expose port 3000 for the application
EXPOSE 3000
 
# Start the application (production)
CMD ["npm", "run", "start"]