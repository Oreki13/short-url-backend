import express from 'express';
import auth from './auth';
import shortLink from './short_link';
import user from './user';

const v1Router = express.Router();

v1Router.use('/auth', auth);
v1Router.use('/short', shortLink);
v1Router.use('/user', user);

export default v1Router;