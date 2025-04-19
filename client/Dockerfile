# Use node for building
FROM node:22-slim AS build

WORKDIR /app

COPY client/package*.json ./

RUN npm install

COPY client/ .

RUN npm run build


# -------- Serve stage --------
FROM node:22-slim AS serve

RUN npm install -g serve

WORKDIR /app

COPY --from=build /app/dist .

EXPOSE 3000

CMD ["serve", "-s", ".", "-l", "3000"]
