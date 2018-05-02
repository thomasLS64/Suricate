# Root
FROM node

# App Directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# App Sources
COPY app /usr/src/app

# Install dependencies
RUN npm install

# Port Listener
EXPOSE 80

# Launcher
CMD ["npm", "start"]
