import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  mockClienteTransacional,
  mockConsultas,
} from '../../test/helpers/postgres-mock';
import { MinhaOrganizacaoService } from './minha-organizacao.service';

const organizacao = {
  id: 2,
  nome: 'Organização Exemplo',
  cnpj: '12345678000199',
  planoid: 1,
  plano: 'Starter',
  usuarioresponsavelid: 3,
  cep: '01000000',
  logradouro: 'Rua Exemplo',
  numero: '100',
  complemento: null,
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
};

const dto = {
  nome: 'Organização Atualizada',
  cnpj: '12.345.678/0001-99',
  planoid: 1,
  usuarioresponsavelid: 3,
  cep: '01000-000',
  logradouro: 'Rua Exemplo',
  numero: '100',
  complemento: '',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'sp',
};

describe('Serviço da organização autenticada', () => {
  const service = new MinhaOrganizacaoService();

  afterEach(() => jest.restoreAllMocks());

  it('deve carregar a organização, seus usuários e os planos', async () => {
    mockConsultas([
      [organizacao],
      [{ id: 3, nome: 'Maria' }],
      [{ id: 1, nome: 'Starter' }],
    ]);

    await expect(service.findById(2)).resolves.toEqual({
      ...organizacao,
      usuarios: [{ id: 3, nome: 'Maria' }],
      planos: [{ id: 1, nome: 'Starter' }],
    });
  });

  it('deve retornar 404 quando a organização não existe', async () => {
    mockConsultas([[]]);
    await expect(service.findById(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve atualizar os campos permitidos e registrar o log', async () => {
    const atualizada = { ...organizacao, nome: dto.nome };
    const { query } = mockClienteTransacional((sql) => {
      if (sql.startsWith('SELECT * FROM organizacoes'))
        return { rows: [organizacao] };
      if (sql.startsWith('SELECT id FROM planos')) return { rows: [{ id: 1 }] };
      if (sql.startsWith('SELECT id FROM usuarios'))
        return { rows: [{ id: 3 }] };
      if (
        sql.includes('FROM organizacoes') &&
        sql.includes('INNER JOIN planos')
      )
        return { rows: [atualizada] };
      if (sql.startsWith('SELECT id, nome FROM usuarios'))
        return { rows: [{ id: 3, nome: 'Maria' }] };
      if (sql.startsWith('SELECT id, nome FROM planos'))
        return { rows: [{ id: 1, nome: 'Starter' }] };
      return {};
    });

    await expect(service.update(2, 3, dto)).resolves.toEqual({
      ...atualizada,
      usuarios: [{ id: 3, nome: 'Maria' }],
      planos: [{ id: 1, nome: 'Starter' }],
    });

    const updateCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('UPDATE organizacoes'),
    );
    expect(updateCall?.[1]).toEqual([
      dto.nome,
      '12345678000199',
      1,
      3,
      '01000000',
      dto.logradouro,
      dto.numero,
      '',
      dto.bairro,
      dto.cidade,
      'SP',
      3,
      2,
    ]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO log'),
      expect.arrayContaining([2, 3, expect.any(Date), 'PUT']),
    );
  });

  it('deve rejeitar responsável que não pertence à organização', async () => {
    mockClienteTransacional((sql) => {
      if (sql.startsWith('SELECT * FROM organizacoes'))
        return { rows: [organizacao] };
      if (sql.startsWith('SELECT id FROM planos')) return { rows: [{ id: 1 }] };
      return {};
    });

    await expect(service.update(2, 3, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
