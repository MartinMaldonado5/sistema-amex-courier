import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { smoothScrollManager, PREVENT_ATTRIBUTE } from '@/lib/smooth-scroll/manager';

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

class MockElement {
  public tagName: string;
  public className: string = '';
  public attributes: Record<string, string> = {};
  public classList = {
    contains: (cls: string) => this.className.split(' ').includes(cls),
  };

  constructor(tagName: string = 'div') {
    this.tagName = tagName.toUpperCase();
  }

  setAttribute(name: string, val: string = '') {
    this.attributes[name] = val;
  }

  hasAttribute(name: string) {
    return name in this.attributes;
  }

  closest(selector: string) {
    if (selector.includes(PREVENT_ATTRIBUTE) && this.hasAttribute(PREVENT_ATTRIBUTE)) {
      return this;
    }
    return null;
  }
}

describe('Módulo 11: Invoice Scroll Protection & Lenis Isolation', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SMOOTH_SCROLL;

    (globalThis as any).window = {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
      })),
      requestAnimationFrame: vi.fn(() => 1),
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
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  });

  it('protege automáticamente los paneles de factura con data-lenis-prevent en scanDOM', () => {
    const panel = new MockElement('aside') as unknown as HTMLElement;
    panel.className = 'invoice-control-panel';

    const body = new MockElement('div') as unknown as HTMLElement;
    body.className = 'invoice-panel-body';

    const root = {
      querySelectorAll: vi.fn((sel: string) => {
        if (sel.includes('.invoice-control-panel')) {
          return [panel, body];
        }
        return [];
      }),
    } as unknown as ParentNode;

    smoothScrollManager.scanDOM(root);

    expect(panel.hasAttribute(PREVENT_ATTRIBUTE)).toBe(true);
    expect(body.hasAttribute(PREVENT_ATTRIBUTE)).toBe(true);
  });

  it('no registra instancias de Lenis en elementos que tienen data-lenis-prevent (aislamiento estricto)', () => {
    const panel = new MockElement('aside') as unknown as HTMLElement;
    panel.className = 'invoice-control-panel';
    panel.setAttribute(PREVENT_ATTRIBUTE, '');

    const instance = smoothScrollManager.register(panel);
    expect(instance).toBeNull();
    expect(smoothScrollManager.get(panel)).toBeUndefined();
  });
});
