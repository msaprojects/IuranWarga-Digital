FROM node:26-slim
LABEL authors="msaprojects"

WORKDIR /app

COPY package.json .

RUN npm install

COPY ./dist .

EXPOSE 9000

CMD ["node", "app.js"]
