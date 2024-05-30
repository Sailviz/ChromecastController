FROM node:16-alpine

ENV PORT ${PORT}

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Installing dependencies
COPY package*.json /usr/src/app/
RUN apk add --update --no-cache openssl1.1-compat
RUN npm install

# Copying source files
COPY . /usr/src/app
# Building app
RUN npm run build
EXPOSE $PORT

# Running the app
CMD "npm" "run" "start"