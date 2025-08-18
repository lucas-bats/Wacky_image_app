# Forja de Imagens Malucas (Wacky Image Forge)

Bem-vindo à Forja de Imagens Malucas! Esta é uma aplicação web divertida e interativa construída com Next.js que permite aos usuários gerar imagens criativas e caóticas com base em uma seleção de palavras-chave. A aplicação utiliza o poder da IA generativa para dar vida às suas ideias mais malucas.

## Funcionalidades Principais

- **Seleção de Palavras-chave**: Escolha palavras-chave de quatro categorias distintas (Animais, Ações, Cenários e Estilos) para construir um prompt único.
- **Geração de Imagem com IA**: Utiliza o Genkit para se conectar a um modelo de IA generativa do Google, que cria uma imagem com base no seu prompt.
- **Modo Caos**: Não consegue decidir? Clique no "Modo Caos" para gerar uma combinação completamente aleatória de palavras-chave e se surpreender com o resultado!
- **Galeria Pessoal**: Cada imagem que você cria é salva automaticamente em uma galeria no seu navegador (usando `localStorage`), permitindo que você reveja suas criações anteriores.
- **Internacionalização (i18n)**: A interface está disponível em Português e Inglês, com a possibilidade de alternar entre os idiomas com um único clique.
- **Design Responsivo**: A interface foi construída para funcionar perfeitamente tanto em desktops quanto em dispositivos móveis.
- **Download e Compartilhamento**: Baixe suas imagens favoritas ou compartilhe-as usando a API Web Share do seu dispositivo.

## Tecnologias Utilizadas

Este projeto foi construído utilizando um conjunto de tecnologias modernas para desenvolvimento web e IA:

- **Framework**: [Next.js](https://nextjs.org/) (com App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Biblioteca de UI**: [React](https://react.dev/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes**: [ShadCN UI](https://ui.shadcn.com/)
- **IA Generativa**: [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
- **Ícones**: [Lucide React](https://lucide.dev/)

## Como Executar o Projeto
Acesse o link: https://studio--wacky-image-forge.us-central1.hosted.app/

Para executar este projeto localmente, siga os passos abaixo:

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DA_PASTA>
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Renomeie o arquivo `.env.local.example` para `.env.local`.
    - Preencha as variáveis de ambiente necessárias, como as chaves da API do Firebase/Google AI.

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

5.  Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação em funcionamento.
