import express from 'express';
import path from 'path';
import Youch from 'youch';
import * as Sentry from '@sentry/node';
// Essa vc importa dessa maneira porque o express por padrao nao vai passar para o sentry os erros que der em operacoes async
import 'express-async-errors';
import routes from './routes';
import sentryConfig from './config/sentry';

import './database';

class App {
  constructor() {
    this.server = express();

    // Isso eh para verificacao de erros... Tipo um gerenciador de erros
    Sentry.init(sentryConfig);

    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(Sentry.Handlers.requestHandler());
    // Middlewares global
    this.server.use(express.json());
    // libernado para que vc consiga clicar nos links das fotos e abrir elas
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
    this.server.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    // Quando um middleware recebe quatro parametros, quer dizer que ele eh uma middleware de tratamento de excecoes
    this.server.use(async (err, req, res, next) => {
      const errors = await new Youch(err, req).toJSON();

      return res.status(500).json(errors);
    });
  }
}

export default new App().server;
