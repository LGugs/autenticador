const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const UsersSchema = new Schema({
  login: String,
  hash: String,
  salt: String
});

UsersSchema.methods.setPassword = function(password) {
  // salt é uma técnica de produção de hash, usando valores randomicos de string com uma biblioteca chamada Crypto. Serve para guardar senhas em bancos de dados
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash; // retorna se é false ou true após realizar a mesma checagem
};

UsersSchema.methods.generateJWT = function() {
  const hoje = new Date();
  const dataExpiracao = new Date(hoje);
  dataExpiracao.setDate(hoje.getDate() + 1); // aqui define em dias a expiração do token em timestamp

  console.log(dataExpiracao.getTime());

  //console.log(parseInt(dataExpiracao.getTime()/1000, 10));

    // necessito inserir um jti (id do token)
  return jwt.sign({
    id: this._id,
    login: this.login,
    password: this.password,
    jti: crypto.randomBytes(4).toString('hex'),
    exp: parseInt(dataExpiracao.getTime()/1000, 10),
  }, 'secret');
};

// como estou utilizando o jti com randomBytes, este método abaixo gerará novos tokens pro usuário. Poderá ser utilizado para dar um refresh talvez?
UsersSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    login: this.login,
    token: this.generateJWT()
  };
};

mongoose.model('Users', UsersSchema);
