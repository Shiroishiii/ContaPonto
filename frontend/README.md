# Conta Ponto — Frontend (Administrador)

React + JavaScript + Vite + Tailwind CSS. Dados de demonstração (sem backend).

## Como rodar
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera a pasta dist
```
Login de demonstração: qualquer e-mail válido + senha com 6+ caracteres (aba Administrador).

## Estrutura
- `src/pages` — telas (Auth, Dashboard, Employees, Journeys, TimeRecords, Requests, Reports, Activities, Settings)
- `src/components` — Layout (sidebar/header), formulários e componentes de UI
- `src/context/AppContext.jsx` — estado global (tema, sessão, dados, modal, toasts)
- `src/data/mock.js` — dados fictícios; substitua por chamadas à API Node/Express
- `src/exportFiles.js` — exportação em PDF (jsPDF) e CSV
- `src/index.css` — tokens de tema (dark/light) e estilos dos componentes

A área do Funcionário será adicionada na próxima etapa.
