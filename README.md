# SaaS Starter — Backend

## Visão geral

O SaaS Starter Backend é uma base genérica e reutilizável para aplicações SaaS, construída com NestJS e TypeScript.

O objetivo é oferecer uma estrutura simples, organizada e preparada para expansão sem adicionar camadas arquiteturais antes que elas sejam necessárias.

## Tecnologias

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- `pg`
- Jest

## Arquitetura

O projeto utiliza a organização modular padrão do NestJS.

Cada funcionalidade deve possuir seu próprio diretório em `src/modules/`, contendo Controller, Service, Module, DTOs e testes relevantes.

```text
modules/
└── example/
    ├── dto/
    ├── example.controller.ts
    ├── example.controller.spec.ts
    ├── example.service.ts
    ├── example.service.spec.ts
    └── example.module.ts
```

- Controllers tratam requisições e respostas HTTP.
- Services concentram validações, regras da funcionalidade e acesso aos dados.
- Modules registram as dependências da funcionalidade.
- DTOs definem os formatos de entrada e saída.
- Recursos compartilhados permanecem em `src/shared/`.

## Princípios de desenvolvimento

- Manter módulos independentes e com responsabilidades claras.
- Utilizar injeção de dependências do NestJS.
- Priorizar código legível, testável e de fácil manutenção.
- Evitar abstrações e camadas sem necessidade real.
- Utilizar consultas PostgreSQL parametrizadas.
- Manter o backend independente do frontend.

## Organização e modularidade

Novas funcionalidades devem seguir o padrão NestJS já utilizado em `src/modules/permissoes/`.

As regras detalhadas de implementação, testes, segurança, migrations e utilities estão em `agents.md`.

## Objetivo final

Construir uma fundação backend modular, simples e reutilizável, permitindo a evolução de diferentes produtos SaaS sem comprometer a manutenção do projeto.
