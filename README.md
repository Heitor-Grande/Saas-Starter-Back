# SaaS Starter — Backend

## Visão geral

O backend do SaaS Starter é uma base genérica e reutilizável para o desenvolvimento de aplicações SaaS, construída com **NestJS e TypeScript**.

Seu objetivo é fornecer uma estrutura sólida, organizada e escalável, permitindo desenvolver diferentes produtos SaaS sem a necessidade de reconstruir a arquitetura a cada novo projeto.

O backend não deve possuir regras de negócio específicas de um segmento, mantendo sua estrutura preparada para diferentes aplicações.

## Tecnologias

- Node.js
- NestJS
- TypeScript
- PostgreSQL

## Arquitetura

O projeto seguirá os princípios de **Domain-Driven Design (DDD)**, **Clean Architecture** e **Clean Code**.

A arquitetura deverá priorizar a separação de responsabilidades, o baixo acoplamento e a independência das regras de negócio em relação às tecnologias utilizadas.

O DDD será adotado como referência central, respeitando seus principais conceitos:

- **Entities:** representam os objetos de domínio e suas regras de negócio.
- **Value Objects:** representam conceitos de domínio definidos por seus valores e garantem suas invariantes.
- **Use Cases:** coordenam as operações e os fluxos da aplicação.
- **Domain Services:** encapsulam regras de domínio que não pertencem naturalmente a uma entidade ou Value Object.
- **Repositories:** abstraem o acesso e a persistência dos dados.
- **Aggregates:** organizam entidades e garantem a consistência das regras de negócio.

A organização do código deverá respeitar os limites entre domínio, aplicação, infraestrutura e apresentação.

## Princípios de desenvolvimento

- Aplicar DDD de forma consistente.
- Seguir os princípios de Clean Architecture e Clean Code.
- Manter as regras de negócio independentes de frameworks e banco de dados.
- Priorizar código legível, testável e de fácil manutenção.
- Respeitar o princípio da responsabilidade única.
- Evitar acoplamento entre módulos.
- Utilizar injeção de dependências.
- Priorizar reutilização sem criar abstrações desnecessárias.
- Desenvolver funcionalidades com foco em evolução e escalabilidade.
- Manter o backend independente do frontend.

## Organização e modularidade

O backend será estruturado como um **monólito modular**, permitindo que diferentes funcionalidades sejam desenvolvidas e mantidas de maneira independente.

Cada módulo deverá possuir responsabilidades bem definidas e respeitar os princípios arquiteturais estabelecidos.

A estrutura deverá facilitar a expansão do sistema sem comprometer a organização e a manutenção do código.

## Objetivo final

Construir uma fundação backend robusta, reutilizável e preparada para evolução, utilizando NestJS e TypeScript com uma arquitetura fiel aos conceitos de DDD.

O resultado deverá permitir a criação de diferentes produtos SaaS, mantendo qualidade de código, organização arquitetural e facilidade de manutenção.