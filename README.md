# FL Electrics — site organizado

Site estático com HTML, CSS e JavaScript separados. Mantive as 11 páginas e as funções
originais (menu, carrossel, busca/filtros, fotos ampliáveis, pop-up e formulário para WhatsApp).

## Estrutura

```text
FL_Electrics_organizado/
├── index.html             # Página inicial
├── sobre.html
├── modelos.html
├── scooters.html
├── wd4.html
├── astur-e-plus.html
├── urban.html
├── assistencia.html
├── loja.html
├── parcerias.html
├── contato.html
├── css/
│   └── style.css          # Todos os estilos, incluindo responsividade
├── js/
│   └── script.js          # Interações e comportamentos do site
└── img/
    └── logo.png           # Logo local extraída do arquivo original
```

## Abrir e editar

1. Extraia o arquivo ZIP inteiro, mantendo essa estrutura de pastas.
2. Abra a pasta no VS Code e inicie o **index.html** com Live Server,
   ou abra o index.html diretamente no navegador.
3. Modifique as páginas em seus respectivos arquivos `.html`.
4. Edite a aparência em `css/style.css` e os comportamentos em `js/script.js`.

**Importante:** as fotos das scooters e as fontes do Google continuam vindo de URLs
externas, assim como no arquivo enviado. A internet é necessária para exibi-las.
A imagem de logo foi salva localmente para não repetir o base64 gigante em cada página.
Os formulários continuam abrindo a conversa no WhatsApp; não há servidor/backend.
