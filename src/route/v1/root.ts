import express from 'express';
import auth from './auth';
import shortLink from './short_link';
import user from './user';
import domain from './domain';
import userActivity from './user_activity';

const v1Router = express.Router();

v1Router.use('/auth', auth);
v1Router.use('/short', shortLink);
v1Router.use('/user', user);
v1Router.use('/domain', domain);
v1Router.use('/activity', userActivity);

export default v1Router;