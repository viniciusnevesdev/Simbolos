# Símbolos — teste isolado de IndexedDB

Branch: `teste-indexeddb` — **NÃO mesclar na main antes de validar**.

## Endereços
- Teste: https://simbolos-idb-teste.pages.dev/
- Oficial: https://viniciusnevesdev.github.io/Simbolos/

## Isolamento dos dados
O teste usa IndexedDB com o banco `simbolos-teste-indexeddb-v1`.
A biblioteca oficial continua armazenada no localStorage do GitHub Pages. O preview também tem outro domínio e não acessa os dados antigos automaticamente.

## Como testar no iPhone
1. Abra o endereço de teste em uma aba do Safari.
2. Importe o JSON de 23 MB **descompactado** do ZIP.
3. Confira a contagem de 7.306 símbolos, a busca, o copiar SVG e os grupos.
4. Feche e reabra a aba; os ícones devem continuar salvos.
5. Experimente editar um ícone, recarregar e testar exportar backup.

## Reverter
Pare de usar o endereço de teste e continue no endereço oficial. A branch `main` não foi modificada.

## Observações
- A lista limita a 18 cartões inicialmente por grupo e oferece "Mostrar mais" para evitar milhares de SVGs no DOM simultaneamente.
- Ainda é um protótipo a ser testado no Safari do iPhone com 7.306 ícones.
- Faça backup dos dados oficiais antes de testar.
- Os 7.306 SVGs importados são dados de teste; não são incorporados ao GitHub.
