import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Rpc } from '../messaging/rpc';

export interface Identidad {
  userId: string;
  email: string;
}

export type SolicitudAutenticada = Request & { user?: Identidad };

const extraerToken = (solicitud: Request): string | undefined => {
  const [esquema, token] = (solicitud.headers.authorization ?? '').split(' ');
  return esquema?.toLowerCase() === 'bearer' && token ? token : undefined;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(protected readonly rpc: Rpc) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const solicitud = contexto
      .switchToHttp()
      .getRequest<SolicitudAutenticada>();
    const token = extraerToken(solicitud);
    if (!token) {
      throw new UnauthorizedException('Falta el token de acceso');
    }
    solicitud.user = await this.validar(token);
    return true;
  }

  protected async validar(token: string): Promise<Identidad> {
    try {
      return await this.rpc.users.enviar<Identidad>('validate_token', token);
    } catch (error) {
      if ((error as { status?: number })?.status === 401) {
        throw new UnauthorizedException('Token inválido o expirado');
      }
      throw error;
    }
  }
}

@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  override async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const solicitud = contexto
      .switchToHttp()
      .getRequest<SolicitudAutenticada>();
    if (extraerToken(solicitud)) {
      return super.canActivate(contexto);
    }
    return true;
  }
}
