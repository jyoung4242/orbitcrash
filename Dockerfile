FROM node:18

WORKDIR /app

COPY . .
RUN cd src; cd Server; npm ci
RUN cd src; cd Server; npx tsc server.ts --module esnext --target esnext --moduleResolution node

CMD ["node", "--experimental-specifier-resolution=node", "src/Server/server.js"]