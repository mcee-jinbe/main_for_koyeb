FROM node:24

# アプリケーションディレクトリを作成する
WORKDIR /usr/src/app

# アプリケーションの依存関係をインストールする
# package.jsonをコピーする
COPY package.json ./
COPY . .

RUN npm install --omit=dev

EXPOSE 8000
CMD [ "node", "index.js" ]