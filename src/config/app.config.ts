import { registerAs } from '@nestjs/config';

export default registerAs('appconfig', () => ({
  app_port: process.env.PORT || 3000,
  amqp_uri: process.env.AMQP_URI || 'amqp://localhost:5672',
  jwt_secret: process.env.JWT_SECRET || 'supersecret',
  recipe_queue: process.env.RECIPE_QUEUE || 'recipes_queue',
  user_queue: process.env.USER_QUEUE || 'users_queue',
}));
