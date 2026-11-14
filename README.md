# vivIA — Conecta Soluções

Protótipo do Hackathon 7.0 Connect, desafio FACESP.

A vivIA transforma a necessidade de um pequeno negócio em uma demanda clara e a conecta a fornecedores de tecnologia, com apoio da associação comercial. A pessoa responsável pelo negócio explica o que está acontecendo, por áudio ou texto, sem precisar saber o nome da tecnologia. A plataforma organiza o relato, confirma o entendimento, mostra caminhos, permite comparar propostas e acompanha o pedido até o piloto.

> **Demonstração.** Fornecedores, preços, propostas, retornos e contagens do Radar são fictícios e estão rotulados no app. Não há integração com WhatsApp, catálogo real de parceiros nem resultado de piloto medido.

## Jornada principal

| Etapa | Rota | O que acontece |
| --- | --- | --- |
| Início | `/` | "Gravar áudio" ou "Prefiro escrever", em até dois toques |
| Relato | `/relatar` | Fala (reconhecimento do navegador, limite de 90 s) ou texto; aviso de privacidade antes de começar |
| Entendimento | `/entendimento` | Resumo editável: objetivo, situação, tipo de solução, restrições, urgência e resultado esperado; nada segue sem confirmação |
| Caminhos | `/caminhos` | Até três caminhos, ordenados por adequação, com o que resolve, por que combina e o que confirmar |
| Comparar | `/comparar` | Fornecedores fictícios lado a lado; dado ausente aparece como "Não informado — confirmar com o fornecedor" |
| Acompanhar | `/acompanhar` | Linha de status da demanda, com correção e cancelamento |
| Radar | `/radar` | Visão agregada da associação por tema, segmento e município, sem relato individual |

As telas do protótipo anterior (diagnóstico em formulário, teste interativo, painel completo da associação e área de startups) continuam disponíveis em "Apresentar à banca", na página inicial.

## Diretrizes de UX/UI

- A linguagem usa **negócio** quando se refere à operação da pessoa usuária. **Loja física**, **loja virtual** e **balcão** continuam sendo usados apenas quando descrevem um canal específico.
- A jornada principal é apresentada em uma ação por vez: contar a necessidade, revisar o resumo e escolher os próximos caminhos.
- Os textos de apoio explicam o que acontece antes da ação, evitam jargões e deixam claro quando uma informação é opcional.
- A pessoa usuária revisa o relato e autoriza o compartilhamento antes de qualquer encaminhamento.

## Como a demo funciona

- **Voz:** usa o reconhecimento de fala do próprio navegador para gerar texto. O áudio não é gravado nem guardado. Sem microfone ou sem permissão, o fluxo segue por texto, e há uma transcrição de exemplo identificada como demonstração.
- **Entendimento e recomendações:** motor de regras local (`src/lib/jornada/interpretar.ts`) sobre um catálogo fictício curado (`src/lib/jornada/catalogo.ts`). Não é um modelo de linguagem.
- **Estado da jornada:** fica no `localStorage` do aparelho (`src/lib/jornada/store.ts`).
- **Radar:** grupos com menos de três demandas não aparecem; a demanda do lojista só entra na contagem se ele autorizar.

## Stack

React 19, Vite, TypeScript, Tailwind CSS, Shadcn UI e React Router, com PocketBase no backend das telas do protótipo anterior. Projeto criado com o [Skip](https://goskip.dev).

## Rodar localmente

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # gera dist/
pnpm lint
```

## Equipe

Hackathon 7.0 Connect · FACESP.
