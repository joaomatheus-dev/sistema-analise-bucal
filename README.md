# Sistema de Analise Bucal

Aplicacao web para publicacao de conteudos odontologicos, galeria de imagens,
cadastro de usuarios, painel administrativo e acompanhamento de usuarios por
instituicao.

## Requisitos

- Node.js 18 ou superior
- npm
- PostgreSQL em execucao

## Como comecar

1. Clone o repositorio:

```bash
git clone https://github.com/joaomatheus-dev/sistema-analise-bucal.git
cd sistema-analise-bucal
```

2. Instale as dependencias:

```bash
npm install
```

3. Crie o arquivo `.env` na raiz do projeto:

```bash
copy .env.example .env
```

No Linux ou macOS, use:

```bash
cp .env.example .env
```

4. Edite o `.env` com a conexao do seu PostgreSQL:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
```

Exemplo local:

```env
DATABASE_URL=postgresql://postgres:minha_senha@127.0.0.1:5432/analise_bucal
```

5. Inicie o backend:

```bash
npm run dev:server
```

6. Em outro terminal, inicie o frontend:

```bash
npm run dev
```

7. Abra a URL exibida pelo Vite, normalmente:

```text
http://localhost:5173
```

## Login inicial

Na primeira execucao, o servidor cria as tabelas e o administrador padrao:

- E-mail: `admin@analisebucal.com`
- Senha: `Admin@123`

Altere essa senha depois do primeiro acesso.

## Scripts disponiveis

```bash
npm run dev
```

Inicia apenas o frontend com Vite.

```bash
npm run dev:server
```

Inicia o backend em Node.js.

```bash
npm run build
```

Gera a versao de producao em `dist/`.

```bash
npm start
```

Inicia o servidor para uso em producao.

## Banco de dados

O projeto usa PostgreSQL. As tabelas principais sao criadas automaticamente
quando o backend inicia, desde que `DATABASE_URL` esteja configurado e o banco
esteja acessivel.

## Observacoes

- Nao suba arquivos `.env`, bancos locais ou credenciais reais para o GitHub.
- A pasta `dist/` e gerada pelo build e nao precisa ser versionada.
- O aplicativo mobile sera mantido em um repositorio separado.
