import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token ❌');
    }
    const token = auth.split(' ')[1];
    try {
      const user = this.jwtService.verify(token);
      req.user = user; // ✅ attach user at runtime
      return true;
    } catch {
      throw new UnauthorizedException('Bad token ❌');
    }
  }
}
