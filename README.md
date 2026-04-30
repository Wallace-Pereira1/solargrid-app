# ☀️ SolarGrid Social Portal v2.0

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-1C1C1C?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

> **Status do Projeto:** Finalizado e Otimizado
> 
> **Engenheiro Responsável:** [Wallace Pereira](https://github.com/Wallace-Pereira1)  
> **Solicitante:** Vicente Brizola

## 📝 Sobre o Projeto
O **SolarGrid Social** é uma aplicação Fullstack moderna desenvolvida para centralizar comunicações e conteúdos corporativos. O desafio principal foi transformar uma estrutura de dados plana (JSON) em um ambiente **totalmente relacional** no Supabase, permitindo pesquisas complexas e filtragens dinâmicas com alta performance.

## 🚀 Diferenciais Técnicos
* **Arquitetura Relacional Dinâmica:** Normalização de dados externos em tabelas vinculadas (`profiles` -> `posts` -> `comments`) com integridade referencial via Supabase (PostgreSQL).
* **Filtro Inteligente de Predicados:** Sistema de busca que permite alternar o alvo da pesquisa entre Autor (Nome/Username), Empresa ou Conteúdo dos Comentários.
* **Interface Premium & Dark Mode:** UI desenvolvida com foco na paleta de cores institucional da SolarGrid, incluindo um motor de temas dinâmico via CSS Variables.
* **Modularização Profissional:** Estilização isolada com **CSS Modules**, evitando vazamento de estilos e facilitando a manutenção do código.
* **Sincronização de Estado:** Gerenciamento eficiente de estados para garantir que o feed carregue 100% dos dados de forma fluida.

## 🛠️ Stack Utilizada
* **Frontend:** React 18 + Vite (TypeScript)
* **Backend & DB:** Supabase (PostgreSQL)
* **Estilização:** CSS Modules + Custom Properties
* **Integração:** Fetch API + Supabase Client

## ⚙️ Configuração Local
1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/Wallace-Pereira1/solargrid-app.git](https://github.com/Wallace-Pereira1/solargrid-app.git)
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz:
    ```env
    VITE_SUPABASE_URL=sua_url_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anonima
    ```
4.  **Execução:**
    ```bash
    npm run dev
    ```

## 🗄️ SQL de Limpeza (Zerar Banco)
Caso precise resetar o ambiente para uma nova demonstração:
```sql
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM profiles;

