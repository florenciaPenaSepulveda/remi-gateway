import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { TimeoutError } from 'rxjs';

interface ErrorRemoto {
  status: number;
  message: string | string[];
}

const esErrorRemoto = (error: unknown): error is ErrorRemoto => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { status, message } = error as Partial<ErrorRemoto>;
  return (
    Number.isInteger(status) &&
    (status as number) >= 400 &&
    (status as number) < 600 &&
    (typeof message === 'string' || Array.isArray(message))
  );
};

const nombreDelEstado = (status: number) =>
  (HttpStatus[status] ?? 'Error')
    .toLowerCase()
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

@Catch()
export class ErroresFilter implements ExceptionFilter {
  private readonly logger = new Logger('Gateway');

  catch(error: unknown, host: ArgumentsHost) {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const { status, message } = this.normalizar(error);
    if (status >= 500) {
      this.logger.error(
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      );
    }
    respuesta
      .status(status)
      .json({ statusCode: status, error: nombreDelEstado(status), message });
  }

  private normalizar(error: unknown): ErrorRemoto {
    if (error instanceof HttpException) {
      const cuerpo = error.getResponse();
      const mensaje =
        typeof cuerpo === 'string'
          ? cuerpo
          : ((cuerpo as { message?: string | string[] }).message ??
            error.message);
      return { status: error.getStatus(), message: mensaje };
    }
    if (esErrorRemoto(error)) {
      return error;
    }
    if (error instanceof TimeoutError) {
      return {
        status: HttpStatus.GATEWAY_TIMEOUT,
        message: 'El servicio no respondió a tiempo',
      };
    }
    return {
      status: HttpStatus.BAD_GATEWAY,
      message: 'No se pudo comunicar con el servicio',
    };
  }
}
