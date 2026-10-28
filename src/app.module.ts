import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth/auth.controller';
import { CommentsController } from './comments/comments.controller';
import { Env, validarEntorno } from './config/env';
import { HealthController } from './health/health.controller';
import { IngredientsController } from './ingredients/ingredients.controller';
import { MessagingModule } from './messaging/messaging.module';
import { RecipesController } from './recipes/recipes.controller';
import { TagsController } from './tags/tags.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => [
        { ttl: 60000, limit: config.get('RATE_LIMIT', { infer: true }) },
      ],
    }),
    MessagingModule,
  ],
  controllers: [
    HealthController,
    AuthController,
    UsersController,
    RecipesController,
    IngredientsController,
    TagsController,
    CommentsController,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
