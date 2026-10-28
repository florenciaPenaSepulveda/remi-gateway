import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Env } from '../config/env';
import {
  RECIPES_SERVICE,
  Rpc,
  SOCIALS_SERVICE,
  TAGS_SERVICE,
  USERS_SERVICE,
} from './rpc';

const cola = (
  name: string,
  variable: 'USERS_QUEUE' | 'RECIPES_QUEUE' | 'TAGS_QUEUE' | 'SOCIALS_QUEUE',
) => ({
  name,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>) => ({
    transport: Transport.RMQ as const,
    options: {
      urls: [config.get('AMQP_URI', { infer: true })],
      queue: config.get(variable, { infer: true }),
      queueOptions: { durable: false },
    },
  }),
});

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      cola(USERS_SERVICE, 'USERS_QUEUE'),
      cola(RECIPES_SERVICE, 'RECIPES_QUEUE'),
      cola(TAGS_SERVICE, 'TAGS_QUEUE'),
      cola(SOCIALS_SERVICE, 'SOCIALS_QUEUE'),
    ]),
  ],
  providers: [Rpc],
  exports: [Rpc],
})
export class MessagingModule {}
