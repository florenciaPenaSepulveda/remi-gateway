import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Identidad, SolicitudAutenticada } from './auth.guard';

export const Usuario = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): Identidad | undefined =>
    contexto.switchToHttp().getRequest<SolicitudAutenticada>().user,
);
