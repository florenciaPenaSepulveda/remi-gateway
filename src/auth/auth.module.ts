// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigType } from '@nestjs/config';
import { AuthController } from './auth.controller';
import appconfig from '../config/app.config';

@Module({
  imports: [
    forwardRef(() => UsersModule), // 👈 cambio clave
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [appconfig.KEY],
      useFactory: (config: ConfigType<typeof appconfig>) => ({
        secret: config.jwt_secret,
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
