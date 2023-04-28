FROM node:14-alpine

WORKDIR /usr/app
COPY package*.json ./
COPY index.js ./
COPY .env ./
RUN npm i

# Starting the Server and exposing port 5002
CMD npm start
EXPOSE 5002