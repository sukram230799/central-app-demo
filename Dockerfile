FROM node:16 as client

WORKDIR /usr/app/frontend/
COPY ./frontend/package*.json ./

RUN npm install -qy

# Copy patches
COPY ./patch/frontend ../patch/frontend
# Apply patches
RUN for f in ../patch/frontend/*.patch; do patch -p0 -N < "$f"; done

COPY ./frontend ./
RUN npm run build


FROM node:16

WORKDIR /usr/src/app

COPY ./backend/package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY --from=client /usr/app/frontend/www/ ./www/
COPY ./backend/server.js ./

EXPOSE 26799

ENV NODE_ENV production

CMD [ "node", "server.js" ]
