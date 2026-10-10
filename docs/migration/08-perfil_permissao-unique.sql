ALTER TABLE perfil_permissao
    ADD CONSTRAINT perfil_permissao_unique
    UNIQUE (perfilid, permissaoid);
