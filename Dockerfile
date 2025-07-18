FROM node:20.10.0

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

CMD ["node","-e","require('./controllers/facts').dailyFactGenerator().catch(err=>{console.error(err);process.exit(1)})"]

