# 🐙 Taverna RPG — Call of Cthulhu

App de gestão de fichas para Call of Cthulhu 7ª edição.  
Jogadores editam suas fichas em tempo real e o Mestre vê tudo ao vivo.

---

## Pré-requisitos

- Node.js 18+ instalado
- Conta gratuita no [Supabase](https://supabase.com)
- Conta gratuita no [Vercel](https://vercel.com) (para publicar)

---

## 1. Configurar o Supabase

1. Crie um projeto no Supabase
2. Vá em **SQL Editor → New Query** e rode o conteúdo de `supabase_schema.sql`
3. Vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon public key`

---

## 2. Configurar o projeto local

```bash
# Clone ou baixe o projeto
cd taverna-rpg

# Instale as dependências
npm install

# Crie o arquivo de variáveis de ambiente
cp .env.example .env
```

Edite o `.env` com suas chaves:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

---

## 3. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:5173`

---

## 4. Publicar no Vercel

```bash
# Inicializar git e subir para GitHub
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/SEU-USUARIO/taverna-rpg.git
git push -u origin main
```

No Vercel:
1. Importe o repositório
2. Adicione as variáveis de ambiente (as mesmas do `.env`)
3. Clique em Deploy

---

## Estrutura de arquivos

```
src/
  lib/
    supabase.js          ← cliente Supabase
    AuthContext.jsx      ← estado de autenticação global
    characterFields.js   ← definição de todos os campos da ficha CoC
  components/
    Toast.jsx            ← notificações
  pages/
    LoginPage.jsx        ← tela de login/cadastro
    LobbyPage.jsx        ← lista e criação de campanhas
    PlayerPage.jsx       ← ficha completa do jogador
    MasterPage.jsx       ← visão do mestre (todos os jogadores)
  styles/
    global.css           ← tema gótico escuro
  App.jsx                ← roteador entre páginas
  main.jsx               ← entrada da aplicação
```

---

## Como funciona o realtime

O Supabase Realtime usa WebSockets para ouvir mudanças no banco.

- **Jogador edita** a ficha → salva no Supabase
- **Mestre vê** a atualização automaticamente sem recarregar a página
- **Mestre pode ver** características, perícias e status de todos

---

## Telas do app

| Tela | Quem vê | O que faz |
|------|---------|-----------|
| Login | Todos | Criar conta / entrar |
| Lobby | Todos | Ver campanhas, criar, entrar com código |
| Ficha (Jogador) | Jogador | Editar status, características e perícias |
| Visão do Mestre | Mestre | Ver todos os investigadores em tempo real |
