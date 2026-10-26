import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { postgresPool } from '../../shared/infrastructure/database/postgres/postgres';
import { criarLog } from '../../util/criar-log/criar-log';
import { executarEmTransacao } from '../../util/executar-em-transacao/executar-em-transacao';
import { criptografar } from '../../util/nodeCrypto/nodeCrypto';
import type {
  ConfiguracaoGlobalDto,
  UpdateConfiguracaoGlobalDto,
} from './dto/configuracao-global.dto';

@Injectable()
export class ConfiguracaoGlobalService {
  /** Carrega a única configuração global, identificada sempre pelo id 1. */
  async findOne(): Promise<ConfiguracaoGlobalDto> {
    const result = await postgresPool.query<ConfiguracaoGlobalDto>(
      `SELECT id, nome_aplicacao, email_suporte, smtp_servidor, smtp_porta,
        smtp_usuario, smtp_senha, smtp_remetente_nome, smtp_remetente_email,
        criado_em, atualizado_em, atualizadoporusuarioid
      FROM configuracao_global WHERE id = 1`,
    );
    if (!result.rows[0])
      throw new NotFoundException('Configuração global não encontrada.');
    const configuracao = result.rows[0];

    return configuracao;
  }

  /** Valida, atualiza e audita a configuração global sem expor a senha SMTP. */
  async update(
    dto: UpdateConfiguracaoGlobalDto,
    usuarioId: number,
    organizacaoId: number,
  ): Promise<ConfiguracaoGlobalDto> {
    const dados = this.validar(dto);
    const senhaCriptografada = dados.smtp_senha
      ? criptografar(dados.smtp_senha)
      : null;
    return executarEmTransacao(async (client) => {
      const anteriorResult = await client.query<ConfiguracaoGlobalDto>(
        `SELECT id, nome_aplicacao, email_suporte, smtp_servidor, smtp_porta,
          smtp_usuario, smtp_remetente_nome, smtp_remetente_email, criado_em,
          atualizado_em, atualizadoporusuarioid
        FROM configuracao_global WHERE id = 1 FOR UPDATE`,
      );
      const anterior = anteriorResult.rows[0];
      if (!anterior)
        throw new NotFoundException('Configuração global não encontrada.');
      const result = await client.query<ConfiguracaoGlobalDto>(
        `UPDATE configuracao_global SET nome_aplicacao = $1, email_suporte = $2,
          smtp_servidor = $3, smtp_porta = $4,
          smtp_usuario = $5, smtp_senha = COALESCE(NULLIF($6, ''), smtp_senha),
          smtp_remetente_nome = $7, smtp_remetente_email = $8,
          atualizado_em = CURRENT_TIMESTAMP, atualizadoporusuarioid = $9
        WHERE id = 1
        RETURNING id, nome_aplicacao, email_suporte, smtp_servidor, smtp_porta,
          smtp_usuario, smtp_remetente_nome, smtp_remetente_email, criado_em,
          atualizado_em, atualizadoporusuarioid`,
        [
          dados.nome_aplicacao,
          dados.email_suporte,
          dados.smtp_servidor,
          dados.smtp_porta,
          dados.smtp_usuario,
          senhaCriptografada,
          dados.smtp_remetente_nome,
          dados.smtp_remetente_email,
          usuarioId,
        ],
      );
      const configuracao = result.rows[0];
      await criarLog(
        {
          organizacaoid: organizacaoId,
          feitoporusuarioid: usuarioId,
          feitoem: new Date(),
          acao: 'put',
          antes: anterior,
          depois: configuracao,
        },
        client,
      );
      return configuracao;
    });
  }

  /** Normaliza e valida os campos da configuração global. */
  private validar(
    dto: UpdateConfiguracaoGlobalDto,
  ): Required<UpdateConfiguracaoGlobalDto> {
    const dados = {
      nome_aplicacao: dto.nome_aplicacao?.trim(),
      email_suporte: dto.email_suporte?.trim() || null,
      smtp_servidor: dto.smtp_servidor?.trim() || null,
      smtp_porta: dto.smtp_porta == null ? null : Number(dto.smtp_porta),
      smtp_usuario: dto.smtp_usuario?.trim() || null,
      smtp_senha: dto.smtp_senha || null,
      smtp_remetente_nome: dto.smtp_remetente_nome?.trim() || null,
      smtp_remetente_email: dto.smtp_remetente_email?.trim() || null,
    };
    if (!dados.nome_aplicacao || dados.nome_aplicacao.length > 100)
      throw new BadRequestException(
        'O nome da aplicação deve ter entre 1 e 100 caracteres.',
      );
    if (
      dados.email_suporte &&
      (dados.email_suporte.length > 255 || !dados.email_suporte.includes('@'))
    )
      throw new BadRequestException('O e-mail de suporte é inválido.');
    if (dados.smtp_servidor && dados.smtp_servidor.length > 255)
      throw new BadRequestException('O servidor SMTP é inválido.');
    if (
      dados.smtp_porta !== null &&
      (!Number.isInteger(dados.smtp_porta) ||
        dados.smtp_porta < 1 ||
        dados.smtp_porta > 65535)
    )
      throw new BadRequestException('A porta SMTP é inválida.');
    if (
      dados.smtp_remetente_email &&
      (dados.smtp_remetente_email.length > 255 ||
        !dados.smtp_remetente_email.includes('@'))
    )
      throw new BadRequestException('O e-mail do remetente é inválido.');
    return dados;
  }
}
