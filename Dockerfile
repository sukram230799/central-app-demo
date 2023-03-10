FROM node:18 as onboard

WORKDIR /usr/app/onboard/
COPY ./onboard/package*.json ./

RUN npm install -qy

COPY ./onboard ./
RUN npm run build

FROM node:18 as client

WORKDIR /usr/app/frontend/
COPY ./frontend/package*.json ./

RUN npm install -qy

# Copy patches
COPY ./patch/frontend ../patch/frontend
# Apply patches
RUN for f in ../patch/frontend/*.patch; do patch -p0 -N < "$f"; done

COPY ./frontend ./
RUN npm run build


FROM node:18

WORKDIR /usr/src/app

COPY ./backend/package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

COPY --from=onboard /usr/app/onboard/www/ ./onboard/
COPY --from=client /usr/app/frontend/www/ ./www/
COPY ./backend/* ./

EXPOSE 26799

ENV NODE_ENV production

CMD [ "node", "server.js" ]
