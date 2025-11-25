import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import appConfig from 'src/config/app.config';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => AuthModule), // ✅ mantiene la referencia diferida
    ClientsModule.registerAsync([
      {
        name: 'USERS_SERVICE',
        imports: [ConfigModule],
        inject: [appConfig.KEY],
        useFactory: (config: ConfigType<typeof appConfig>) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.amqp_uri],
            queue: config.user_queue,
            queueOptions: {
              durable: false,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, ClientsModule],
})
export class UsersModule {}
