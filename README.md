# Sistema de Análise Bucal

Aplicação web para biblioteca de posts odontológicos com área administrativa, cadastro de categorias, gerenciamento de imagens e autenticação de usuários.

## Requisitos

- Node.js 18 ou superior
- PostgreSQL em execução

## Configuração de ambiente

1. Crie um arquivo `.env` na raiz do projeto.
2. Use o arquivo `.env.example` como referência.
3. Defina a string de conexão do PostgreSQL no formato abaixo:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

Exemplo:

```env
DATABASE_URL=postgresql://postgres:minha_senha@127.0.0.1:5432/analise_bucal
```

## Instalação

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

## Build de produção

```bash
npm run build
npm start
```

## Acesso padrão

Administrador inicial:

- E-mail: `admin@analisebucal.com`
- Senha: `Admin@123`

## Observações

- O banco deve estar acessível antes de iniciar o backend.
- As tabelas iniciais são criadas automaticamente na inicialização do servidor.
- O arquivo `.env.example` serve apenas como modelo e não deve conter credenciais reais.
