/**
 * Gestor Centralizado de Smooth Scroll (Lenis Multi-Instancia)
 * Sistema AMEX Courier
 *
 * Características:
 * - Soporte para múltiples scrollers independientes (Main, Sidebar, Modales).
 * - Aislamiento estricto: eventsTarget siempre es el elemento, NUNCA window.
 * - lerp: 0.18 (rápido y sutil, optimizado para operaciones logísticas).
 * - syncTouch: false (scroll táctil 100% nativo para pistolas/móviles).
 * - Bucle RAF único compartido para máximo rendimiento a 60/120Hz.
 * - Desconexión automática en Live Sheets o elementos con data-lenis-prevent.
 * - Soporte para prefers-reduced-motion y kill-switch NEXT_PUBLIC_SMOOTH_SCROLL=off.
 */

import Lenis from 'lenis';

export const LENIS_CONFIG = {
  lerp: 0.1, // Suavizado sedoso tipo premium (deslizamiento continuo, elegante y fluido)
  smoothWheel: true,
  syncTouch: false, // Táctil 100% nativo sin interceptar gestos táctiles
  allowNestedScroll: false, // Evita que contenedores horizontales (tablas) bloqueen la propagación vertical
  naiveDimensions: true, // Recalcula scrollHeight - clientHeight en tiempo real dinámicamente (evita límites congelados)
  overscroll: false,
} as const;

export const SCROLL_ATTRIBUTE = 'data-lenis-scroll';
export const PREVENT_ATTRIBUTE = 'data-lenis-prevent';
export const SCROLL_SELECTOR = `[${SCROLL_ATTRIBUTE}], .modal-body, .pkg-body`;
export const MODAL_BACKDROP_SELECTOR = '.modal-backdrop, .acta-modal-backdrop';

interface ManagedScroller {
  element: HTMLElement;
  lenis: Lenis;
  isBackground: boolean;
  contentObserver?: ResizeObserver;
}

class SmoothScrollManager {
  private instances = new Map<HTMLElement, ManagedScroller>();
  private rafId: number | null = null;
  private modalLockCount = 0;
  private openModalTokens = new Set<HTMLElement | string>();
  private observer: MutationObserver | null = null;
  private resizeDebounceTimer: any = null;
  private onWindowResize: (() => void) | null = null;
  private isInitialized = false;

  /**
   * Determina si el entorno actual permite smooth scroll.
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;

    // 1. Kill-switch por variable de entorno
    if (process.env.NEXT_PUBLIC_SMOOTH_SCROLL === 'off') {
      return false;
    }

    // 2. Respetar accesibilidad de usuarios con preferencia de movimiento reducido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }

    return true;
  }

  /**
   * Bucle RAF único y centralizado para todas las instancias activas.
   */
  private onRaf = (time: number) => {
    this.instances.forEach(({ lenis }) => {
      lenis.raf(time);
    });

    if (this.instances.size > 0 && typeof window !== 'undefined') {
      this.rafId = window.requestAnimationFrame(this.onRaf);
    } else {
      this.rafId = null;
    }
  };

  private startRafIfNeeded() {
    if (this.rafId === null && this.instances.size > 0 && typeof window !== 'undefined') {
      this.rafId = window.requestAnimationFrame(this.onRaf);
    }
  }

  private stopRafIfEmpty() {
    if (this.instances.size === 0 && this.rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Recalcula las dimensiones de todas las instancias activas.
   */
  public resizeAll(): void {
    this.instances.forEach(({ lenis }) => {
      try {
        lenis.resize();
      } catch {}
    });
  }

  /**
   * Registra un elemento HTML como scroller suave gobernado por Lenis.
   */
  public register(element: HTMLElement): Lenis | null {
    if (!this.isSupported() || !element) return null;

    // Si ya está registrado, retorna la instancia existente
    const existing = this.instances.get(element);
    if (existing) return existing.lenis;

    // Excluir si tiene data-lenis-prevent o está contenido en uno (ej. Live Sheets, Excel)
    if (element.hasAttribute(PREVENT_ATTRIBUTE) || element.closest(`[${PREVENT_ATTRIBUTE}]`)) {
      return null;
    }

    const isBackground =
      element.classList.contains('main-content') ||
      element.classList.contains('sap-sidebar') ||
      element.tagName.toLowerCase() === 'main';

    try {
      const lenis = new Lenis({
        wrapper: element,
        content: element,
        eventsTarget: element, // AISLAMIENTO CRUCIAL: Solo escucha eventos dentro de su contenedor
        ...LENIS_CONFIG,
      });

      // Crear ResizeObserver para detectar automáticamente cambios de tamaño del contenido interno
      let contentObserver: ResizeObserver | undefined;
      if (typeof ResizeObserver !== 'undefined') {
        contentObserver = new ResizeObserver(() => {
          try {
            lenis.resize();
          } catch {}
        });

        contentObserver.observe(element);
        if (element.firstElementChild) {
          contentObserver.observe(element.firstElementChild);
        }
      }

      // Si hay un modal abierto activo y este es un scroller de fondo, pausarlo inmediatamente
      const hasModalLock = this.modalLockCount > 0 || this.openModalTokens.size > 0;
      if (hasModalLock && isBackground) {
        lenis.stop();
      }

      this.instances.set(element, { element, lenis, isBackground, contentObserver });
      this.startRafIfNeeded();

      return lenis;
    } catch (err) {
      console.warn('[SmoothScrollManager] No se pudo inicializar Lenis en elemento:', err);
      return null;
    }
  }

  /**
   * Elimina y destruye la instancia Lenis asociada al elemento.
   */
  public unregister(element: HTMLElement): void {
    const item = this.instances.get(element);
    if (item) {
      try {
        item.contentObserver?.disconnect();
        item.lenis.destroy();
      } catch (err) {
        console.warn('[SmoothScrollManager] Error al destruir Lenis:', err);
      }
      this.instances.delete(element);
      this.stopRafIfEmpty();
    }
  }

  /**
   * Obtiene la instancia Lenis de un elemento si existe.
   */
  public get(element: HTMLElement): Lenis | undefined {
    return this.instances.get(element)?.lenis;
  }

  /**
   * Obtiene la instancia de la vista principal (.main-content)
   */
  public getMain(): Lenis | undefined {
    for (const [el, item] of this.instances.entries()) {
      if (el.classList.contains('main-content') || el.tagName.toLowerCase() === 'main') {
        return item.lenis;
      }
    }
    return undefined;
  }

  /**
   * Pausa los scrollers de fondo (Main y Sidebar) cuando un modal se abre.
   * Maneja tokens y contador seguro para evitar bloqueos permanentes.
   */
  public pushModalLock(token?: HTMLElement | string): void {
    if (token) {
      this.openModalTokens.add(token);
    } else {
      this.modalLockCount++;
    }
    this.syncModalLockState();
  }

  /**
   * Reanuda los scrollers de fondo cuando todos los modales se cierran.
   */
  public popModalLock(token?: HTMLElement | string): void {
    if (token) {
      this.openModalTokens.delete(token);
    } else {
      this.modalLockCount = Math.max(0, this.modalLockCount - 1);
    }
    this.syncModalLockState();
  }

  /**
   * Sincroniza el estado de bloqueo de fondo de forma auto-reparable.
   */
  public syncModalLockState(): void {
    if (typeof window === 'undefined') return;

    const hasDomBackdrop =
      typeof document !== 'undefined' && typeof document.querySelector === 'function'
        ? document.querySelector(MODAL_BACKDROP_SELECTOR) !== null
        : false;
    const isLocked = this.openModalTokens.size > 0 || this.modalLockCount > 0 || hasDomBackdrop;

    this.instances.forEach(({ lenis, isBackground }) => {
      if (isBackground) {
        if (isLocked && !lenis.isStopped) {
          lenis.stop();
        } else if (!isLocked && lenis.isStopped) {
          lenis.start();
          lenis.resize();
        }
      }
    });
  }

  /**
   * Escanea el DOM y registra automáticamente todos los elementos con [data-lenis-scroll].
   * También aísla automáticamente contenedores de scroll horizontal en todos los módulos del sistema.
   */
  public scanDOM(root: ParentNode = document): void {
    if (!this.isSupported()) return;

    const elements = root.querySelectorAll<HTMLElement>(SCROLL_SELECTOR);
    elements.forEach((el) => {
      this.register(el);
    });

    // Auto-protección global para todos los módulos: tablas, hojas y contenedores con scroll horizontal
    if (typeof root.querySelectorAll === 'function') {
      const horizontalElements = root.querySelectorAll<HTMLElement>(
        '.overflow-x-auto, .shalom-table-wrap, .acta-document-container, .sheet-tabs-list, [style*="overflowX"], [style*="overflow-x"]'
      );
      horizontalElements.forEach((el) => {
        if (!el.hasAttribute('data-lenis-prevent-horizontal') && !el.hasAttribute('data-lenis-prevent')) {
          el.setAttribute('data-lenis-prevent-horizontal', '');
        }
      });
    }
  }

  /**
   * Inicializa el observador de mutaciones del DOM para descubrir dinámicamente
   * modales o contenedores nuevos montados en React y actualizar tamaños.
   */
  public init(root: HTMLElement = document.body): () => void {
    if (this.isInitialized || typeof window === 'undefined') {
      return () => {};
    }

    if (!this.isSupported()) {
      return () => {};
    }

    this.isInitialized = true;
    this.scanDOM(document);

    const debouncedResize = () => {
      if (this.resizeDebounceTimer) clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = setTimeout(() => {
        this.resizeAll();
      }, 100);
    };

    this.onWindowResize = debouncedResize;
    window.addEventListener('resize', this.onWindowResize);

    // MutationObserver para capturar modales que se abren o destruyen y cambios en contenido
    this.observer = new MutationObserver((mutations) => {
      let modalStateChanged = false;
      let shouldResize = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          shouldResize = true;
        }

        // Nodos agregados
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches(MODAL_BACKDROP_SELECTOR) || node.querySelector(MODAL_BACKDROP_SELECTOR)) {
              this.openModalTokens.add(node);
              modalStateChanged = true;
            }

            if (node.matches(SCROLL_SELECTOR)) {
              this.register(node);
            }
            this.scanDOM(node);
          }
        });

        // Nodos removidos (limpieza de memoria y auto-unlock)
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (this.openModalTokens.has(node)) {
              this.openModalTokens.delete(node);
              modalStateChanged = true;
            }
            if (node.matches(MODAL_BACKDROP_SELECTOR) || node.querySelector(MODAL_BACKDROP_SELECTOR)) {
              modalStateChanged = true;
            }

            if (node.matches(SCROLL_SELECTOR)) {
              this.unregister(node);
            }
            const children = node.querySelectorAll<HTMLElement>(SCROLL_SELECTOR);
            children.forEach((child) => this.unregister(child));
          }
        });
      }

      if (modalStateChanged) {
        this.syncModalLockState();
      }

      if (shouldResize) {
        debouncedResize();
      }
    });

    this.observer.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => this.destroy();
  }

  /**
   * Destruye todas las instancias y limpia el observador.
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }

    if (this.onWindowResize && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onWindowResize);
      this.onWindowResize = null;
    }

    if (this.rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.instances.forEach(({ lenis, contentObserver }) => {
      try {
        contentObserver?.disconnect();
        lenis.destroy();
      } catch (err) {
        console.warn('[SmoothScrollManager] Error al destruir instancia:', err);
      }
    });

    this.instances.clear();
    this.openModalTokens.clear();
    this.modalLockCount = 0;
    this.isInitialized = false;
  }
}

// Instancia única (Singleton) para toda la aplicación
export const smoothScrollManager = new SmoothScrollManager();
