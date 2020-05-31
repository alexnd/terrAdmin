# TODO: extend linux and install node and mono
FROM node:12
WORKDIR /usr/src/app
COPY . .
RUN npm install && npm run build
EXPOSE 7878
CMD [ "node", "app.js" ]