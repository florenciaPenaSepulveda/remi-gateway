import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class RpcExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        console.error('Error interceptado del microservicio:', error);

        if (error?.status && error?.message) {
          return throwError(
            () => new HttpException(error.message, Number(error.status)),
          );
        }

        if (error?.response?.status && error?.response?.message) {
          return throwError(
            () =>
              new HttpException(
                error.response.message,
                Number(error.response.status),
              ),
          );
        }

        return throwError(
          () =>
            new HttpException(
              'Error interno en comunicación con microservicio',
              HttpStatus.BAD_GATEWAY,
            ),
        );
      }),
    );
  }
}
