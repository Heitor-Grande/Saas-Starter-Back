INSERT INTO planos (id, nome, valor, descricao)
VALUES
    (1, 'Starter', 49.90, 'Plano inicial'),
    (2, 'Growth', 129.90, 'Plano para equipes em crescimento'),
    (3, 'Scale', 299.90, 'Plano para operacoes em escala');

INSERT INTO perfis (id, nome, descricao)
VALUES
    (1, 'Administrador', 'Acesso administrativo completo'),
    (2, 'Gestor', 'Gerencia configuracoes e usuarios'),
    (3, 'Colaborador', 'Acesso operacional'),
    (4, 'Leitor', 'Acesso somente para consulta');

SELECT setval(pg_get_serial_sequence('planos', 'id'), 3, true);
SELECT setval(pg_get_serial_sequence('perfis', 'id'), 4, true);
