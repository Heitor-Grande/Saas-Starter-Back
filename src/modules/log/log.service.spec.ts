import { mockConsultas } from '../../test/helpers/postgres-mock';
import type { LogDto } from './dto/log.dto';
import { LogService } from './log.service';

describe('Serviço de logs', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve retornar todos os registros de auditoria', async () => {
    const logs: LogDto[] = [
      {
        id: 1,
        organizacaoid: 2,
        organizacaonome: 'Empresa Alpha',
        feitoporusuarioid: 3,
        usuarionome: 'Ana Silva',
        usuarioemail: 'ana@example.com',
        perfil: 'Administrador',
        feitoem: new Date('2026-10-24T12:00:00.000Z'),
        acao: 'PUT',
        antes: { nome: 'Antigo' },
        depois: { nome: 'Novo' },
      },
    ];
    const query = mockConsultas([logs]);

    await expect(new LogService().findAll()).resolves.toEqual(logs);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM log'));
  });
});
