FROM node:11-alpine

WORKDIR /opt/service

VOLUME [ "/opt/service/config" ]
VOLUME [ "/opt/service/logs" ]

COPY . .

RUN npm install
RUN npm run compile

ENV NODE_ENV production
RUN npm prune --production

