FROM node:16 as client

WORKDIR /usr/app/client/
COPY ./frontend/package*.json ./

#TODO combine all runs to one command
RUN npm install -qy
COPY ./frontend ./
RUN npm run build

FROM node:16

WORKDIR /usr/src/app

COPY ./backend/package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY --from=client /usr/app/client/www/ ./
COPY ./backend/server.js ./

EXPOSE 26799

CMD [ "node", "server.js" ]
