FROM node:16 as onboard

WORKDIR /usr/app/onboard/
COPY ./onboard/package*.json ./

RUN npm install -qy

# Copy patches
COPY ./patch/onboard ../patch/onboard
# Apply patches
RUN for f in ../patch/onboard/*.patch; do patch -p0 -N < "$f"; done

COPY ./onboard ./
RUN npm run build

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

COPY --from=onboard /usr/app/onboard/www/ ./onboard/
COPY --from=client /usr/app/frontend/www/ ./www/
COPY ./backend/server.js ./

EXPOSE 26799

ENV NODE_ENV production

CMD [ "node", "server.js" ]
