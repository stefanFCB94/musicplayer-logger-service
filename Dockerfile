FROM node:11-alpine

EXPOSE 80
EXPOSE 443
EXPOSE 8080
EXPOSE 8443

WORKDIR /opt/service

VOLUME [ "/opt/service/config" ]
VOLUME [ "/opt/service/logs" ]

COPY . .

RUN npm install
RUN npm run compile

ENV NODE_ENV production
RUN npm prune --production

CMD ["node", "dist/index.js"]
