const jwt = require('express-jwt');
const blacklist = require('express-jwt-blacklist');

const getTokenFromHeaders = (req) => {
  const { headers: { authorization } } = req;

  if(authorization && authorization.split(' ')[0] === 'Bearer') { // ou Token
    return authorization.split(' ')[1];
  }
  return null;
};

// verificar a possibilidade de usar o Redis database ou memcache, pois memory - que é setado por padrão - não é recomendado para múltiplas instâncias
blacklist.configure({
  tokenId: 'jti'
});

const auth = {
  required: jwt({
    secret: 'secret',
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
    isRevoked: blacklist.isRevoked
  }),
  optional: jwt({
    secret: 'secret',
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
    credentialsRequired: false,
    isRevoked: blacklist.isRevoked
  }),
};

// observar metodo de exportação
module.exports = auth;
//module.exports.logout = logout;
module.exports.getTokenFromHeaders = getTokenFromHeaders;
