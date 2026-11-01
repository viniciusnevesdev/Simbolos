/* Backend exclusivo da branch de teste. Nao consulta nem escreve no localStorage oficial. */
(() => {
  const DB_NAME = "simbolos-teste-indexeddb-v1";
  let connection;
  function open() {
    if (!connection) connection = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error("IndexedDB indisponível")); return; }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("data"))
          request.result.createObjectStore("data");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Não foi possível abrir IndexedDB"));
      request.onblocked = () => reject(new Error("Banco bloqueado por outra aba"));
    });
    return connection;
  }
  async function read(key, fallback) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const request = db.transaction("data", "readonly").objectStore("data").get(key);
      request.onsuccess = () => resolve(request.result ?? fallback);
      request.onerror = () => reject(request.error || new Error("Erro de leitura"));
    });
  }
  async function write(pairs) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("data", "readwrite");
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error("Erro ao salvar"));
      tx.onabort = () => reject(tx.error || new Error("Transação cancelada"));
      try { for (const [key, value] of pairs) tx.objectStore("data").put(value, key); }
      catch (error) { try { tx.abort(); } catch {} reject(error); }
    });
  }
  window.PREVIEW_STORAGE = Object.freeze({
    load: async () => {
      const [items, groupIcons] = await Promise.all([read("items", []), read("groupIcons", {})]);
      return { items, groupIcons };
    },
    writeItems: items => write([["items", items]]),
    writeGroups: groupIcons => write([["groupIcons", groupIcons]]),
    writeBoth: (items, groupIcons) => write([["items", items], ["groupIcons", groupIcons]])
  });
})();
