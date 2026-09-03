# Temporizador Pelotense (Pelotense Timer)

Temporizador visual com segunda tela embutida, ideal para a Rádio/TV Pelotense e A Hora do Sul. Construído com React + Vite + TypeScript.

## Funcionalidades

- **Contador em tela cheia** com histórico visual de cores por estado (executando, pausado, finalizado)
- **Presets rápidos** (5 a 60 minutos) e **tempo personalizado** (horas:minutos:segundos)
- **Ação ao chegar em zero**: parar, reiniciar ou continuar contando
- **Adicionar tempo** (minutos e segundos) enquanto está em execução ou pausado
- **Persistência em `localStorage`**: o estado sobrevive a um refresh da página
- **Segunda tela em tempo real** via `BroadcastChannel` (as abas/janelas sincronizam sem delay)
- **Logos** flutuantes no topo (Pelotense / A Hora do Sul)

## Páginas

| Rota | Descrição |
| --- | --- |
| `/` | Controle principal (display + painel de configurações) |
| `/retorno` | Segunda tela em tela cheia com fundo (antes era `/view`) |
| `/live` | Segunda tela sem fundo (transparente), para sobrepor a uma transmissão |

- `/view` redireciona automaticamente para `/retorno`.

## Como usar

```bash
# instalar dependências
npm install

# rodar em desenvolvimento
npm run dev

# build de produção
npm run build

# pré-visualizar o build
npm run preview
```

Abra as rotas em abas/janelas separadas do mesmo navegador para ver a sincronização em tempo real entre `/` e `/retorno` (ou `/live`).

## Estrutura

```
src/
├── components/       # TimerDisplay, ConfigPanel, PresetButtons, TimeInput, AddTimeInput
├── hooks/            # useTimer, useStoredTimer, storage (persistência + broadcast)
├── types/            # tipos do timer e configuração
├── view/             # páginas de segunda tela (Return, Live)
├── App.tsx           # página raiz
└── main.tsx          # roteamento simples por pathname
```

## Stack

- React 18
- Vite 5
- TypeScript
- Web API: `BroadcastChannel`, `localStorage`
