FROM node:18.15-alpine3.17

ARG INTERNAL_PORT=3000
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${INTERNAL_PORT}

CMD [ "npm", "start" ]