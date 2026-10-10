import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryService } from '@/features/inventory/services/inventory.service';
import { supabase } from '@/lib/supabase/client';

// Mock de Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

describe('Server-Side Search Unit Tests (PostgreSQL RPC & GIN Trigram)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls buscar_paquetes_servidor RPC with proper parameters', async () => {
    const mockRpcResponse = {
      data: {
        success: true,
        total: 100,
        existencias_activas: 45,
        peso_total_kg: 180.5,
        page: 1,
        page_size: 50,
        data: [
          {
            id: 'pkg-1',
            numero_recibo_bodega: 'WR-001',
            tracking: '1Z9999999999999999',
            nombre_consignatario: 'Jorge Perez',
            peso_kg: 2.5,
            ubicacion_actual: 'AmexLince',
            anaquel: 'A1',
            piso: 'P2',
            posicion_estante: 'A1-P2',
            estado_amex: 'en_almacen',
            estado_tib: 'EnAlmacen',
            creado_en: '2026-10-08T10:00:00Z'
          }
        ]
      },
      error: null
    };

    (supabase.rpc as any).mockResolvedValueOnce(mockRpcResponse);

    const result = await inventoryService.searchPaquetesServerSide({
      searchTerm: 'Jorge',
      locationFilter: 'AmexLince',
      statusAmexFilter: 'en_almacen',
      shelfFilter: 'A1',
      floorFilter: 'P2',
      page: 1,
      pageSize: 50
    });

    expect(supabase.rpc).toHaveBeenCalledWith('buscar_paquetes_servidor', {
      p_search: 'Jorge',
      p_ubicacion: 'AmexLince',
      p_estado_amex: 'en_almacen',
      p_shelf_filter: 'A1',
      p_floor_filter: 'P2',
      p_package_type: 'ALL',
      p_fecha_desde: null,
      p_fecha_hasta: null,
      p_page: 1,
      p_page_size: 50
    });

    expect(result.total).toBe(100);
    expect(result.existenciasActivas).toBe(45);
    expect(result.pesoTotalKg).toBe(180.5);
    expect(result.paquetes.length).toBe(1);
    expect(result.paquetes[0].numeroReciboBodega).toBe('WR-001');
    expect(result.paquetes[0].nombreConsignatario).toBe('Jorge Perez');
    expect(result.paquetes[0].posicionEstante).toBe('A1-P2');
  });

  it('handles server-side search error gracefully returning safe empty defaults', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database query timeout' }
    });

    const result = await inventoryService.searchPaquetesServerSide({
      searchTerm: 'inexistente',
      page: 2,
      pageSize: 25
    });

    expect(result.total).toBe(0);
    expect(result.existenciasActivas).toBe(0);
    expect(result.pesoTotalKg).toBe(0);
    expect(result.paquetes).toEqual([]);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(25);
  });
});
