FROM node

WORKDIR /clinicapp
COPY package.json .
RUN npm install
COPY . .
CMD node index.js