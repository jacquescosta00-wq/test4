# Deploy na Vercel - Estrutura Otimizada

Esta pasta contém a estrutura PERFEITA para deploy na Vercel.

## 📁 Estrutura

```
vercelnew/
├── api/
│   └── index.js          # Serverless Functions
├── assets/               # Arquivos estáticos (imagens, vídeos)
├── chat/                 # Página do chat
├── adminpanel/           # Painel admin
├── maptest/              # Testes
├── index.html            # Página principal
├── checkout.html         # Checkout
├── pix.html              # Página PIX
├── style.css             # Estilos
├── package.json          # Dependências
├── vercel.json           # Configuração Vercel (OTIMIZADA)
└── README.md             # Documentação
```

## 🚀 Como fazer deploy

### Opção 1: Upload direto no GitHub
1. Faça upload de TODOS os arquivos desta pasta para o GitHub
2. Conecte o repositório na Vercel
3. A Vercel detectará automaticamente

### Opção 2: Via CLI Vercel
```bash
cd vercelnew
vercel
```

## ⚙️ Configuração

### Variáveis de Ambiente (Configurar na Vercel)
- `ELEVENLABS_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (opcional, padrão: gpt-4o-mini)
- `GOOGLE_MAPS_API_KEY`
- `PIX_API_KEY`
- `KODEXPERT_API_USER` (opcional)

## ✅ Diferenças desta versão

- ✅ `vercel.json` otimizado com sintaxe moderna
- ✅ Estrutura limpa e organizada
- ✅ Configuração perfeita para arquivos estáticos
- ✅ Serverless functions configuradas corretamente
- ✅ Rotas otimizadas para performance

## 🔍 Testes

Após o deploy, teste:
- `https://seu-projeto.vercel.app/` → index.html
- `https://seu-projeto.vercel.app/chat` → chat/index.html
- `https://seu-projeto.vercel.app/api/debug/status` → API funcionando
