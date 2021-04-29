const express = require('express');
const path = require('path');
//const bodyParser = require('body-parser'); BodyParser agora é deprecated e utilizamos express.json() e express.urlencoded.
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');

// constantes referentes a logging
const pino = require('pino');
const expressPino = require('express-pino-logger');

// configura o "promise" do mongoose para global
mongoose.promise = global.Promise;

// configura a variável isProduction (no manual fica production), para que 
const isProduction = process.env.NODE_ENV === 'production';

// logging
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const expressLogger = expressPino({ logger });

// configura para a porta 8000 ou uma que esteja livre no servidor
const PORT = process.env.PORT || 8000;

// inicializa a aplicação
const app = express();

// configura a aplicação
app.use(cors());
app.use(require('morgan')('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'passaport', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false })); // configuração da sessão
app.use(expressLogger);

if(!isProduction) {
  app.use(errorHandler());
}

// configurando o mongoose
//mongoose.connect('mongodb://localhost/passaport-tutorial'); *deprecated*
mongoose.connect('mongodb://localhost:27017/userAuth', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('debug', true);

// Models e Rotas
require('./models/users');
require('./config/passport');
app.use(require('./routes'));

// configuração de retorno de erros
if(!isProduction) {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
      errors:{
        message: err.message,
        error: err,
      },
    });
  });
}

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: {},
    },
  });
});

// listen com logging
app.listen(PORT, () => logger.info('Servidor rodando em http://localhost:%d/', PORT));

//app.listen(PORT, () => console.log('Servidor rodando em http://localhost:%d/', PORT));
