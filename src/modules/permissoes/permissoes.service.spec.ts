import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  mockConsultas,
  mockTransacaoSequencial,
} from '../../test/helpers/postgres-mock';
import type { PermissaoDto } from './dto/create-permissao.dto';
import { PermissoesService } from './permissoes.service';

describe('Serviço de permissões', () => {
  const service = new PermissoesService();
  const permissaoMock: PermissaoDto = {
    id: 10,
    nome: 'Criar usuário',
    descricao: 'Permite criar novos usuários',
    criadoporusuarioid: 1,
    datacriacao: new Date(),
    atualizadoporusuarioid: 1,
    atualizadoem: new Date(),
  };

  afterEach(() => jest.restoreAllMocks());

  it('deve criar uma permissão', async () => {
    const query = mockConsultas([[permissaoMock]]);

    await expect(
      service.create(
        { nome: 'Criar usuário', descricao: 'Permite criar novos usuários' },
        1,
      ),
    ).resolves.toEqual(permissaoMock);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar uma permissão sem nome', async () => {
    await expect(
      service.create({ nome: '', descricao: 'Descrição' }, 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve consultar uma permissão pelo identificador', async () => {
    const query = mockConsultas([[permissaoMock]]);

    await expect(service.findOne(10)).resolves.toEqual(permissaoMock);
    expect(query).toHaveBeenCalledWith(expect.any(String), [10]);
  });

  it('deve informar quando a permissão não for encontrada', async () => {
    mockConsultas([[]]);
    await expect(service.findOne(10)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve listar todas as permissões cadastradas', async () => {
    const permissoes = [permissaoMock];
    mockConsultas([permissoes]);
    await expect(service.findAll()).resolves.toEqual(permissoes);
  });

  it('deve atualizar uma permissão', async () => {
    const permissaoAtualizada = {
      ...permissaoMock,
      nome: 'Editar usuário',
      descricao: 'Permite editar usuários',
      atualizadoporusuarioid: 2,
    };
    const query = mockConsultas([[permissaoAtualizada]]);

    await expect(
      service.update(
        10,
        { nome: 'Editar usuário', descricao: 'Permite editar usuários' },
        2,
      ),
    ).resolves.toEqual(permissaoAtualizada);
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'Editar usuário',
      'Permite editar usuários',
      2,
      10,
    ]);
  });

  it('deve excluir os vínculos antes de excluir a permissão', async () => {
    const { query, release } = mockTransacaoSequencial([
      {},
      {},
      { rowCount: 1 },
      {},
    ]);

    await service.remove(10);

    expect(query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM perfil_permissao WHERE permissaoid = $1',
      [10],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      'DELETE FROM permissoes WHERE id = $1 RETURNING id',
      [10],
    );
    expect(query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('deve desfazer a exclusão quando a permissão não existir', async () => {
    const { query, release } = mockTransacaoSequencial([
      {},
      {},
      { rowCount: 0 },
      {},
    ]);

    await expect(service.remove(10)).rejects.toBeInstanceOf(NotFoundException);
    expect(query).toHaveBeenNthCalledWith(4, 'ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
