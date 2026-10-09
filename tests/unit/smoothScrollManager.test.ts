import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  smoothScrollManager,
  LENIS_CONFIG,
  SCROLL_ATTRIBUTE,
  PREVENT_ATTRIBUTE,
  SCROLL_SELECTOR,
  MODAL_BACKDROP_SELECTOR,
} from '@/lib/smooth-scroll/manager';

// Mock simple de Lenis
vi.mock('lenis', () => {
  return {
    default: class MockLenis {
      public options: any;
      public isStopped = false;
      public isDestroyed = false;

      constructor(options: any) {
        this.options = options;
      }

      raf = vi.fn();
      stop = vi.fn(() => {
        this.isStopped = true;
      });
      start = vi.fn(() => {
        this.isStopped = false;
      });
      resize = vi.fn();
      scrollTo = vi.fn();
      destroy = vi.fn(() => {
        this.isDestroyed = true;
      });
    },
  };
});

// Mock liviano de HTMLElement para entorno node de vitest
class MockElement {
  public tagName: string;
  public className: string = '';
  public attributes: Record<string, string> = {};
  public classList = {
    contains: (cls: string) => this.className.split(' ').includes(cls),
    add: (cls: string) => {
      if (!this.classList.contains(cls)) {
        this.className = `${this.className} ${cls}`.trim();
      }
    },
  };

  constructor(tagName: string = 'div') {
    this.tagName = tagName.toUpperCase();
  }

  setAttribute(name: string, val: string = '') {
    this.attributes[name] = val;
  }

  hasAttribute(name: string): boolean {
    return name in this.attributes;
  }

  getAttribute(name: string) {
    return this.attributes[name] ?? null;
  }

  closest(selector: string) {
    if (selector.includes(PREVENT_ATTRIBUTE) && this.hasAttribute(PREVENT_ATTRIBUTE)) {
      return this;
    }
    return null;
  }

  matches(selector: string): boolean {
    if (selector.includes(SCROLL_ATTRIBUTE) && this.hasAttribute(SCROLL_ATTRIBUTE)) return true;
    if (selector.includes('modal-body') && this.classList.contains('modal-body')) return true;
    if (selector.includes('modal-backdrop') && this.classList.contains('modal-backdrop')) return true;
    return false;
  }
}

describe('SmoothScrollManager (Lenis Multi-Instancia)', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SMOOTH_SCROLL;

    // Configurar window mock en globalThis
    (globalThis as any).window = {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
      })),
      requestAnimationFrame: vi.fn((cb) => 1),
      cancelAnimationFrame: vi.fn(),
    };

    (globalThis as any).document = {
      body: new MockElement('body'),
      querySelectorAll: vi.fn(() => []),
      querySelector: vi.fn(() => null),
    };

    smoothScrollManager.destroy();
  });

  afterEach(() => {
    smoothScrollManager.destroy();
    vi.restoreAllMocks();
  });

  it('configura parámetros de alta fluidez: lerp 0.1 (premium), naiveDimensions true y syncTouch false (100% nativo)', () => {
    expect(LENIS_CONFIG.lerp).toBe(0.1);
    expect(LENIS_CONFIG.syncTouch).toBe(false);
    expect(LENIS_CONFIG.smoothWheel).toBe(true);
    expect(LENIS_CONFIG.allowNestedScroll).toBe(false);
    expect(LENIS_CONFIG.naiveDimensions).toBe(true);
    expect(LENIS_CONFIG.overscroll).toBe(false);
  });

  it('soporta activación cuando no hay banderas restrictivas', () => {
    expect(smoothScrollManager.isSupported()).toBe(true);
  });

  it('respeta kill-switch NEXT_PUBLIC_SMOOTH_SCROLL=off', () => {
    process.env.NEXT_PUBLIC_SMOOTH_SCROLL = 'off';
    expect(smoothScrollManager.isSupported()).toBe(false);
  });

  it('respeta preferencia de accesibilidad prefers-reduced-motion', () => {
    (globalThis as any).window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
    }));

    expect(smoothScrollManager.isSupported()).toBe(false);
  });

  it('registra un elemento HTML y asigna wrapper, content y eventsTarget al mismo elemento', () => {
    const el = new MockElement('div') as unknown as HTMLElement;
    el.setAttribute(SCROLL_ATTRIBUTE, '');

    const instance = smoothScrollManager.register(el);
    expect(instance).toBeDefined();
    expect((instance as any).options.wrapper).toBe(el);
    expect((instance as any).options.eventsTarget).toBe(el);
    expect((instance as any).options.lerp).toBe(0.1);
  });

  it('ignora elementos que tienen data-lenis-prevent (Live Sheets, Excel)', () => {
    const el = new MockElement('div') as unknown as HTMLElement;
    el.setAttribute(PREVENT_ATTRIBUTE, '');

    const instance = smoothScrollManager.register(el);
    expect(instance).toBeNull();
  });

  it('pausa y reanuda scrollers de fondo (Main y Sidebar) con modal lock stack', () => {
    const mainEl = new MockElement('main') as unknown as HTMLElement;
    mainEl.className = 'main-content';

    const mainInstance = smoothScrollManager.register(mainEl);
    expect(mainInstance).toBeDefined();

    // 1er modal se abre -> pausa fondo
    smoothScrollManager.pushModalLock();
    expect(mainInstance!.stop).toHaveBeenCalledTimes(1);

    // 2do modal se abre (anidado) -> sigue pausado sin doble reanudación
    smoothScrollManager.pushModalLock();
    expect(mainInstance!.stop).toHaveBeenCalledTimes(1);

    // 2do modal se cierra -> aún queda 1 modal abierto
    smoothScrollManager.popModalLock();
    expect(mainInstance!.start).not.toHaveBeenCalled();

    // 1er modal se cierra -> regresa a 0 -> reanuda fondo y recalcula tamaño
    smoothScrollManager.popModalLock();
    expect(mainInstance!.start).toHaveBeenCalledTimes(1);
    expect(mainInstance!.resize).toHaveBeenCalledTimes(1);
  });

  it('scanDOM registra automáticamente elementos coincidentes con el selector', () => {
    const mainEl = new MockElement('div') as unknown as HTMLElement;
    mainEl.setAttribute(SCROLL_ATTRIBUTE, '');

    const modalBody = new MockElement('div') as unknown as HTMLElement;
    modalBody.className = 'modal-body';

    const root = {
      querySelectorAll: vi.fn(() => [mainEl, modalBody]),
    } as unknown as ParentNode;

    smoothScrollManager.scanDOM(root);

    expect(smoothScrollManager.get(mainEl)).toBeDefined();
    expect(smoothScrollManager.get(modalBody)).toBeDefined();
  });

  it('unregister destruye la instancia y limpia recursos', () => {
    const el = new MockElement('div') as unknown as HTMLElement;

    const instance = smoothScrollManager.register(el);
    expect(smoothScrollManager.get(el)).toBe(instance);

    smoothScrollManager.unregister(el);
    expect(smoothScrollManager.get(el)).toBeUndefined();
    expect(instance!.destroy).toHaveBeenCalledTimes(1);
  });

  it('resizeAll invoca resize en todas las instancias activas para mantener los límites sincronizados', () => {
    const el1 = new MockElement('div') as unknown as HTMLElement;
    const el2 = new MockElement('main') as unknown as HTMLElement;
    el2.className = 'main-content';

    const inst1 = smoothScrollManager.register(el1);
    const inst2 = smoothScrollManager.register(el2);

    smoothScrollManager.resizeAll();
    expect(inst1!.resize).toHaveBeenCalled();
    expect(inst2!.resize).toHaveBeenCalled();
  });
});
