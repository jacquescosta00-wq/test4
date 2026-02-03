# Shopee Chat - E-commerce com Chatbot

Sistema de e-commerce com chatbot interativo, integração com APIs de CPF, Google Maps, PIX e TTS.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta no GitHub
- Conta na Vercel (gratuita)
- APIs configuradas (ElevenLabs, OpenAI, Google Maps, PIX)

### Passo a Passo

1. **Criar repositório no GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```

2. **Conectar na Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub
   - Clique em "Add New Project"
   - Importe o repositório do GitHub
   - A Vercel detectará automaticamente a configuração

3. **Configurar Variáveis de Ambiente**
   Na Vercel, vá em Settings > Environment Variables e adicione:
   - `ELEVENLABS_API_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (opcional, padrão: gpt-4o-mini)
   - `KODEXPERT_API_USER` (opcional, já tem padrão)
   - `GOOGLE_MAPS_API_KEY`
   - `PIX_API_KEY`

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar
   - Seu site estará online!

## 📁 Estrutura do Projeto

```
/
├── api/
│   └── index.js          # Serverless functions (Vercel)
├── assets/               # Imagens, vídeos, SVGs
├── chat/                 # Página do chat
├── adminpanel/          # Painel administrativo
├── maptest/             # Testes do Google Maps
├── index.html           # Página principal do produto
├── checkout.html        # Página de checkout
├── pix.html             # Página de pagamento PIX
├── server.js            # Servidor Express (local)
├── vercel.json          # Configuração Vercel
├── package.json         # Dependências
└── .env.example         # Exemplo de variáveis de ambiente
```

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Criar arquivo .env com suas chaves
cp .env.example .env
# Edite o .env com suas chaves

# Iniciar servidor
npm start
```

## 📝 APIs Utilizadas

- **ElevenLabs**: Text-to-Speech
- **OpenAI**: Formatação de texto para TTS
- **Kodexpert**: Verificação de CPF
- **Google Maps**: Geocoding e mapas
- **ViaCEP**: Busca de endereços por CEP
- **Duttyfy PIX**: Geração de códigos PIX

## 🌐 URLs de Produção

Após o deploy, você terá:
- Site principal: `https://seu-projeto.vercel.app`
- Chat: `https://seu-projeto.vercel.app/chat`
- Checkout: `https://seu-projeto.vercel.app/checkout.html`
- PIX: `https://seu-projeto.vercel.app/pix.html`

## ⚠️ Notas Importantes

- A Vercel usa serverless functions, então o `server.js` foi adaptado para `api/index.js`
- Arquivos estáticos são servidos automaticamente pela Vercel
- Variáveis de ambiente devem ser configuradas no painel da Vercel
- O projeto funciona tanto localmente (com `server.js`) quanto na Vercel (com `api/index.js`)
