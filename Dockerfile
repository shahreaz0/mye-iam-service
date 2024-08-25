# FROM node:18.17.1-alpine
# WORKDIR /app
# COPY package.json ./
# COPY tsconfig.json ./
# RUN ls -a
# RUN npm install
# COPY src ./src
# RUN npm run build

# FROM node:18.17.1-alpine
# WORKDIR /app
# COPY package.json ./
# RUN npm install --omit=dev
# COPY --from=0 /usr/dist .
# RUN npm install pm2 -g

# EXPOSE 80
# CMD ["pm2-runtime","app.js"]


FROM node:18.17.1-alpine

WORKDIR /app

COPY package.json .
COPY tsconfig.json .

RUN npm install

COPY . .

EXPOSE 8000

CMD [ "npm", "run", "dev" ]




