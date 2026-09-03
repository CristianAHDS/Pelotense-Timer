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

# rodar em desenvolvimento (frontend apenas, sem sync entre navegadores)
npm run dev

# build de produção
npm run build

# construir + subir o servidor (estático + sincronização WebSocket)
npm start

# ou apenas subir o servidor sem rebuild
npm run server
```

O servidor (em `server/index.mjs`) serve o build estático e mantém a conexão WebSocket em `/ws`.

## Sincronização

**Mesmo navegador (abas/janelas):** usa `BroadcastChannel` + `localStorage` — funciona até rodando só com `npm run dev`, sem servidor.

**Entre navegadores/máquinas diferentes** (ex.: Chrome no controle e Edge/OBS na tela): é preciso que as páginas sejam servidas pelo **servidor WebSocket** (`npm start` ou `npm run server`), todos apontando para o mesmo host/porta. O servidor recebe o estado do timer e faz broadcast em tempo real para todos os clientes conectados.

### Como usar no OBS / outra máquina

1. Rode `npm start` no computador que terá o controle (ex.: `http://MEU_IP:3000`).
2. No navegador de controle, abra `http://MEU_IP:3000/`.
3. Nas telas secundárias (OBS Browser Source, outro navegador ou outra máquina na mesma rede), aponte para:
   - `http://MEU_IP:3000/retorno` — tela cheia com fundo
   - `http://MEU_IP:3000/live` — tela cheia transparente (para sobrepor a uma transmissão)

Todas as telas sincronizam a contagem a partir do mesmo `endAt`, sem delay.

> Dica: para acesso de outras máquinas fora da rede local, use um endereço público/HTTPS (o cliente detecta automaticamente `wss://` quando a página está em HTTPS).

## Estrutura

```
server/               # servidor Node (Express + WebSocket) para sync entre navegadores
src/
├── components/       # TimerDisplay, ConfigPanel, PresetButtons, TimeInput, AddTimeInput
├── hooks/            # useTimer, useStoredTimer, storage, syncClient (WebSocket)
├── types/            # tipos do timer e configuração
├── view/             # páginas de segunda tela (Return, Live)
├── App.tsx           # página raiz
└── main.tsx          # roteamento simples por pathname
```

## Stack

- React 18
- Vite 5
- TypeScript
- Node + Express + WebSocket (`ws`)
- Web API: `BroadcastChannel`, `localStorage`
