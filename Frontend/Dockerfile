FROM node:20-alpine as build-step

RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
RUN npm run build --prod


FROM nginx:1.25.1-alpine as runtime-image
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-step /app/dist/frontend /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]