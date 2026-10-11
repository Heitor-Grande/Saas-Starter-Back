ALTER TABLE organizacoes
    DROP CONSTRAINT organizacoes_atualizadoporusuarioid_foreign,
    ADD CONSTRAINT organizacoes_atualizadoporusuarioid_foreign
    FOREIGN KEY (atualizadoporusuarioid) REFERENCES usuarios (id)
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE organizacoes
    DROP CONSTRAINT organizacoes_criadoporusuarioid_foreign,
    ADD CONSTRAINT organizacoes_criadoporusuarioid_foreign
    FOREIGN KEY (criadoporusuarioid) REFERENCES usuarios (id)
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE organizacoes
    DROP CONSTRAINT organizacoes_usuarioresponsavelid_foreign,
    ADD CONSTRAINT organizacoes_usuarioresponsavelid_foreign
    FOREIGN KEY (usuarioresponsavelid) REFERENCES usuarios (id)
    DEFERRABLE INITIALLY DEFERRED;
