const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());

const db = require('./db');

app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res, next)=> res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/auth', (req, res, next) => {
  if(!req.user){
    const error = Error('bad credentials');
    error.status = 401;
    return next(error);
  }
  res.send(req.user);
});

app.get('/api/users', (req, res, next) => {
  if(req.user.roleId)
});

app.post('/api/auth', (req, res, next) => {
  db.authenticate(req.body)
  .then(token => res.send({ token }))
  .catch(ex => {
    const error = Error('bad credentials');
    error.status = 401;
    console.log(error)
    next(error);
    
  });
});

app.use((err, req, res, next)=> {
  res.status(err.status || 500).send({ message: err.message});
});


db.sync()
  .then(()=> {
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> {
      console.log(port);
    });
  });
