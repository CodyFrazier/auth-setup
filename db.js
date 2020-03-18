//TODO
/*
    1. Add Roles table
    2. create role named user and one named admin
    3. Make sure each user has a role
    4. return the role of a user form the get api/auth route
    5. add route to return all the users /api/users which can only be 
        accessed by users who have the admin role.
    6. if a user has the admin role, the front end should show a list of all the users
*/

const { Client } = require('pg');
const jwt = require('jwt-simple');
const bcrypt = require('bcrypt');

const client = new Client(process.env.DATABASE_URL || 'postgres://localhost/acme_auth_db');

client.connect();

const sync = async()=> {
  const SQL = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS roles;
  CREATE TABLE roles(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(25) NOT NULL UNIQUE,
    CHECK (char_length(name) > 0)
  );
  CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    CHECK (char_length(username) > 0),
    "roleId" UUID REFERENCES roles(id)
  );
  `;
  await client.query(SQL);
  const [admin, user] = await Promise.all([
    createRole({ name: 'admin' }),
    createRole({ name: 'user' })
  ]);
  const [lucy, moe] = await Promise.all([
    createUser({ username: 'moe', password: 'MOE', roleId: user.id}),
    createUser({ username: 'lucy', password: 'LUCY', roleId: user.id}),
    createUser({ username: 'curly', password: 'CURLY', roleId: admin.id})
  ]);
};

const createRole = async({ name }) => {
  return (await client.query('INSERT INTO roles (name) values ($1) returning *', [name])).rows[0];
};

const createUser = async({ username, password, roleId })=> {
  const hashed = await hash(password);
  return (await client.query('INSERT INTO users(username, password, "roleId") values ($1, $2, $3) returning *', [ username, hashed, roleId])).rows[0];
};

const findUserFromToken = async(token) => {
  const id = jwt.decode(token, process.env.JWT);
  return (await client.query('SELECT * FROM users WHERE id = $1', [ id ])).rows[0];
};

const readRoles = async() => {
  return (await client.query('SELECT * FROM roles'))
};

const authenticate = async({ username, password }) => {
  const user = (await client.query('SELECT * FROM users WHERE username = $1', [username])).rows[0];
  await compare({ plain: password, hashed: user.password });
  return jwt.encode({ id: user.id }, process.env.JWT);
};

const compare = async({ plain, hashed }) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plain, hashed, (err, result) => {
      if(err){
        return reject(err);
      }
      if(result === true){
        return resolve(hashed);
      }
      reject(Error('bad credentials'));
    });
  });
};

const hash = (plain)=> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(plain, 10, (err, hashed) => {
      if(err){
        return reject(err);
      }
      resolve(hashed);
    })
  })
};


module.exports = {
  sync,
  createUser,
  findUserFromToken,
  authenticate,
  compare,
  hash
};
