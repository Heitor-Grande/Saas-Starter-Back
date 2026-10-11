CREATE TABLE perfil_permissao (
    perfilid INTEGER NOT NULL,
    permissaoid INTEGER NOT NULL,
    criadoporusuarioid INTEGER,
    datacriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT perfil_permissao_primary_key PRIMARY KEY (perfilid, permissaoid)
);
