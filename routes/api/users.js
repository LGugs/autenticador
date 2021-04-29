const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const jwt = require('jsonwebtoken');
const blacklist = require('express-jwt-blacklist');
//const { final } = require('pino');

// POST para criar novos usuários (opcional, todos tem acesso)
router.post('/create', auth.optional, async (req, res) => {
  const { body: { user } } = req;

  if(!user.login){
    return res.status(404).json({
      errors: {
        login: 'não informado'
      },
    });
  }

  if(!user.password){
    return res.status(404).json({
      errors: {
        password: 'não informado'
      },
    });
  }

  // verificar se já existe tal usuário (ou podemos deixar isso na mão da base de dados?)
  const usercheck = await Users.findOne({login: user.login});

  if (usercheck){
    return res.status(406).json({
      errors: {
        usuário: 'já existe!'
      },
    });
  }

  const finalUser = new Users(user);

  //console.log(finalUser);

  finalUser.setPassword(user.password);

  //console.log(finalUser);

  //return finalUser.save().then(() => res.status(201).json({ user: finalUser.toAuthJSON() }));

  return finalUser.save().then(() => res.status(201).json({ user: finalUser.toAuthJSON() })).catch((error) => { console.log(error); res.sendStatus(400);});


});

// POST rota para login (opcional, todos tem acesso)
router.post('/login', auth.optional, (req, res, next) => {
  const { body: { user }} = req;
  if(!user.login){
    return res.status(406).json({
      errors: {
        login: 'não informado'
      },
    });
  }

  if(!user.password) {
   return res.status(406).json({
     errors: {
       senha: 'não informado'
     },
   });
 }

// onde tem { session: false } posso acrescentar sucessRedirect: '/' e failureRedirect: '/login' para os casos de dar certo o login ou não.
 return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
     if(err) {
       return next(err);
     }

     if(passportUser) {
       const user = passportUser;
       user.token = passportUser.generateJWT();

       // teste2 -> id "5e4e73261d39f54dd8268cd5"
       return res.json({token: user.token}); // retorna o token
       //return res.json({ user: user.toAuthJSON() }); -> toAuthJSON regera o token, não é legal da forma que está
     }

     return res.status(401).json(info);
   })(req, res, next);

});

// tentar implementar o verify ou check do jwt -> FUNCIONANDO!! for test porpuse only!
router.get('/checkAuth', (req,res) => {
  jwt.verify(auth.getTokenFromHeaders(req), 'secret', (err, verifiedJwt) => {
    if(err){
      res.status(418).send(err.message);
      //console.log('come');
      //res.send(err.message); // "invalid signature"
    }else{
      //res.send('token válido');
      res.send(verifiedJwt);
    }
  });
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, async (req, res) => {
  const { payload: { id } } = req;

  const user = await Users.findById(id);

  if (!user) {
    //console.log('Usuário Não encontrado!');
    return res.sendStatus(400);
  }

  //Se o for fornecido o jwt de um usuário válido, mas já expirado? R: o proprio auth.required cuida disso!


  //console.log('Usuário encontrado!');
  return res.json({ user: user.login });
});

// implementar o logout utilizando um blacklist do jwt -> FUNCIONANDO!!!
router.get('/logout', auth.required, (req, res) => {
  // o verify me retorna o token decodificado se tudo ok, ele serve para alimentar o metodo revoke logo abaixo. Encontrar possível melhoria para agilizar a decodificação do token?
  // OBS: ao derrubar o servidor e restartar, os tokens com revoke são removidos e livres para atuar novamente. Devo fazer persistência de dados? Se sim, poderei perder eficiência.
  jwt.verify(auth.getTokenFromHeaders(req), 'secret', (err, verifiedJwt) => {
    if(err){
      return res.send(err.message);
    }
    blacklist.revoke(verifiedJwt, (err, ok) => {
      if(err){ // dificilmente chegará aqui, mas é bom verificar
        res.send(err.message);
      }else{
        res.send(ok);
      }
    });
  });

});

module.exports = router;
