ALTER TABLE planos
    ADD CONSTRAINT planos_criadoporusuarioid_foreign
    FOREIGN KEY (criadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL,
    ADD CONSTRAINT planos_atualizadoporusuarioid_foreign
    FOREIGN KEY (atualizadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL;

ALTER TABLE perfis
    ADD CONSTRAINT perfis_criadoporusuarioid_foreign
    FOREIGN KEY (criadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL,
    ADD CONSTRAINT perfis_atualizadoporusuarioid_foreign
    FOREIGN KEY (atualizadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL;

ALTER TABLE permissoes
    ADD CONSTRAINT permissoes_criadoporusuarioid_foreign
    FOREIGN KEY (criadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL,
    ADD CONSTRAINT permissoes_atualizadoporusuarioid_foreign
    FOREIGN KEY (atualizadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL;

ALTER TABLE organizacoes
    ADD CONSTRAINT organizacoes_planoid_foreign
    FOREIGN KEY (planoid) REFERENCES planos (id) ON DELETE RESTRICT,
    ADD CONSTRAINT organizacoes_usuarioresponsavelid_foreign
    FOREIGN KEY (usuarioresponsavelid) REFERENCES usuarios (id) ON DELETE SET NULL,
    ADD CONSTRAINT organizacoes_criadoporusuarioid_foreign
    FOREIGN KEY (criadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL,
    ADD CONSTRAINT organizacoes_atualizadoporusuarioid_foreign
    FOREIGN KEY (atualizadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL;

ALTER TABLE usuarios
    ADD CONSTRAINT usuarios_organizacaoid_foreign
    FOREIGN KEY (organizacaoid) REFERENCES organizacoes (id) ON DELETE RESTRICT,
    ADD CONSTRAINT usuarios_perfilid_foreign
    FOREIGN KEY (perfilid) REFERENCES perfis (id) ON DELETE RESTRICT;

ALTER TABLE perfil_permissao
    ADD CONSTRAINT perfil_permissao_perfilid_foreign
    FOREIGN KEY (perfilid) REFERENCES perfis (id) ON DELETE CASCADE,
    ADD CONSTRAINT perfil_permissao_permissaoid_foreign
    FOREIGN KEY (permissaoid) REFERENCES permissoes (id) ON DELETE CASCADE,
    ADD CONSTRAINT perfil_permissao_criadoporusuarioid_foreign
    FOREIGN KEY (criadoporusuarioid) REFERENCES usuarios (id) ON DELETE SET NULL;

ALTER TABLE log
    ADD CONSTRAINT log_organizacaoid_foreign
    FOREIGN KEY (organizacaoid) REFERENCES organizacoes (id) ON DELETE RESTRICT,
    ADD CONSTRAINT log_feitoporusuarioid_foreign
    FOREIGN KEY (feitoporusuarioid) REFERENCES usuarios (id) ON DELETE RESTRICT;
