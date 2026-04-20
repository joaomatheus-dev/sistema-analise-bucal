# Sistema de Analise Bucal

Aplicacao web para biblioteca de posts odontologicos com area administrativa, cadastro de categorias, gerenciamento de imagens e autenticacao de usuarios.

## Requisitos

- Node.js 18 ou superior
- PostgreSQL em execucao

## Configuracao de ambiente

1. Crie um arquivo `.env` na raiz do projeto.
2. Use o arquivo `.env.example` como referencia.
3. Defina a string de conexao do PostgreSQL no formato abaixo:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

Exemplo:

```env
DATABASE_URL=postgresql://postgres:minha_senha@127.0.0.1:5432/analise_bucal
```

## Instalacao

```bash
npm install
```

## Executando em desenvolvimento

Backend:

```bash
npm run dev:server
```

Frontend:

```bash
npm run dev
```

## Build de producao

```bash
npm run build
npm start
```

## Acesso padrao

Administrador inicial:

- E-mail: `admin@analisebucal.com`
- Senha: `Admin@123`

## Observacoes

- O banco deve estar acessivel antes de iniciar o backend.
- As tabelas iniciais sao criadas automaticamente na inicializacao do servidor.
- O arquivo `.env.example` serve apenas como modelo e nao deve conter credenciais reais.
