import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtAuthenticatedRequest } from '../../middleware/jwt-auth/jwt-auth.middleware';
import { verificaPermissaoUsuario } from '../../util/verificaPermissaoUsuario/verificaPermissaoUsuario';

export const PERMISSAO_NECESSARIA_KEY = 'permissaoNecessaria';

@Injectable()
export class PermissaoGuard implements CanActivate {
  /**
   * Recebe o leitor de metadados usado para identificar a permissão da rota.
   * @param reflector Serviço de reflexão fornecido pelo NestJS.
   * @returns Uma instância do guard de permissão.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * Autoriza a requisição quando o usuário possui a permissão exigida pela rota.
   * @param context Contexto que contém a rota e a requisição autenticada.
   * @returns true quando não há permissão configurada ou quando o usuário tem acesso.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissao = this.reflector.getAllAndOverride<string>(
      PERMISSAO_NECESSARIA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissao) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<JwtAuthenticatedRequest>();
    const usuarioId = request.jwtPayload?.usuarioid;

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new UnauthorizedException('Usuário do token JWT inválido.');
    }

    const possuiPermissao = await verificaPermissaoUsuario(
      usuarioId,
      permissao,
    );

    if (!possuiPermissao) {
      throw new ForbiddenException(
        'Usuário não possui permissão para realizar esta ação.',
      );
    }

    return true;
  }
}
