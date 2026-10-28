import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { Env } from '../config/env';

export const USERS_SERVICE = 'USERS_SERVICE';
export const RECIPES_SERVICE = 'RECIPES_SERVICE';
export const TAGS_SERVICE = 'TAGS_SERVICE';
export const SOCIALS_SERVICE = 'SOCIALS_SERVICE';

export interface Destino {
  enviar<T = unknown>(cmd: string, datos?: unknown): Promise<T>;
}

@Injectable()
export class Rpc {
  readonly users: Destino;
  readonly recipes: Destino;
  readonly tags: Destino;
  readonly socials: Destino;

  constructor(
    @Inject(USERS_SERVICE) users: ClientProxy,
    @Inject(RECIPES_SERVICE) recipes: ClientProxy,
    @Inject(TAGS_SERVICE) tags: ClientProxy,
    @Inject(SOCIALS_SERVICE) socials: ClientProxy,
    config: ConfigService<Env, true>,
  ) {
    const limite = config.get('RPC_TIMEOUT_MS', { infer: true });
    const destino = (cliente: ClientProxy): Destino => ({
      enviar: <T>(cmd: string, datos: unknown = {}) =>
        firstValueFrom(cliente.send<T>({ cmd }, datos).pipe(timeout(limite))),
    });
    this.users = destino(users);
    this.recipes = destino(recipes);
    this.tags = destino(tags);
    this.socials = destino(socials);
  }
}
