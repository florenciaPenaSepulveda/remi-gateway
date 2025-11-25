// src/auth/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('Falta el token');
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token malformado');

    try {
      const user = await this.authService.validateToken(token);
      request.user = user; // ✅ guardas el user en el request
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
