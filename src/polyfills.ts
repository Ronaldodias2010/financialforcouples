/**
 * Polyfills para navegadores antigos
 * Corrige o erro "Failed to execute 'removeChild' on 'Node'" em dispositivos móveis antigos
 */

// Polyfill para Element.prototype.remove
if (!Element.prototype.remove) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}

// Polyfill para NodeList.prototype.forEach
if (typeof NodeList !== 'undefined' && NodeList.prototype && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach as any;
}

// Polyfill para Element.prototype.closest
if (!Element.prototype.closest) {
  Element.prototype.closest = function(selector: string): Element | null {
    let el: Element | null = this;
    while (el) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };
}

// Polyfill para Element.prototype.matches
if (!Element.prototype.matches) {
  Element.prototype.matches =
    (Element.prototype as any).msMatchesSelector ||
    (Element.prototype as any).webkitMatchesSelector;
}

// Polyfill para Object.assign
if (typeof Object.assign !== 'function') {
  Object.assign = function(target: any, ...sources: any[]) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    const to = Object(target);
    for (const source of sources) {
      if (source != null) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            to[key] = source[key];
          }
        }
      }
    }
    return to;
  };
}

// Polyfill para Array.prototype.includes
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement: any, fromIndex?: number) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    const o = Object(this);
    const len = o.length >>> 0;
    if (len === 0) {
      return false;
    }
    const n = fromIndex | 0;
    let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (o[k] === searchElement) {
        return true;
      }
      k++;
    }
    return false;
  };
}

// Polyfill para String.prototype.includes
if (!String.prototype.includes) {
  String.prototype.includes = function(search: string, start?: number): boolean {
    if (typeof start !== 'number') {
      start = 0;
    }
    if (start + search.length > this.length) {
      return false;
    }
    return this.indexOf(search, start) !== -1;
  };
}

// Polyfill para Promise (básico)
if (typeof Promise === 'undefined') {
  console.warn('Promise não suportado neste navegador. Algumas funcionalidades podem não funcionar.');
}

// Safe removeChild wrapper para evitar erros em navegadores antigos
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function<T extends Node>(child: T): T {
  if (child && child.parentNode === this) {
    return originalRemoveChild.call(this, child) as T;
  }
  // Se o nó não for filho, apenas retorne o child sem erro
  console.warn('removeChild chamado em nó que não é filho. Ignorando silenciosamente.');
  return child;
};

// Safe insertBefore wrapper
const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
  try {
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  } catch (e) {
    console.warn('insertBefore falhou. Tentando appendChild como fallback.');
    try {
      return this.appendChild(newNode) as T;
    } catch {
      return newNode;
    }
  }
};

// Detectar navegador antigo e avisar
export function isOldBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  
  // Detectar versões antigas de navegadores
  const isOldChrome = /chrome\/([0-9]+)/.exec(ua)?.[1] && parseInt(/chrome\/([0-9]+)/.exec(ua)![1]) < 60;
  const isOldSafari = /version\/([0-9]+)/.exec(ua)?.[1] && /safari/.test(ua) && parseInt(/version\/([0-9]+)/.exec(ua)![1]) < 11;
  const isOldAndroid = /android ([0-9.]+)/.exec(ua)?.[1] && parseFloat(/android ([0-9.]+)/.exec(ua)![1]) < 7;
  const isOldiOS = /os ([0-9_]+)/.exec(ua)?.[1] && parseFloat(/os ([0-9_]+)/.exec(ua)![1].replace(/_/g, '.')) < 11;
  
  return !!(isOldChrome || isOldSafari || isOldAndroid || isOldiOS);
}

// Exportar versão do navegador detectada
export function getBrowserInfo(): { name: string; version: string; isOld: boolean } {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  
  if (/chrome/i.test(ua)) {
    name = 'Chrome';
    version = /chrome\/([0-9.]+)/i.exec(ua)?.[1] || 'Unknown';
  } else if (/safari/i.test(ua)) {
    name = 'Safari';
    version = /version\/([0-9.]+)/i.exec(ua)?.[1] || 'Unknown';
  } else if (/firefox/i.test(ua)) {
    name = 'Firefox';
    version = /firefox\/([0-9.]+)/i.exec(ua)?.[1] || 'Unknown';
  }
  
  return { name, version, isOld: isOldBrowser() };
}

console.log('[Polyfills] Carregados com sucesso. Navegador:', getBrowserInfo());
