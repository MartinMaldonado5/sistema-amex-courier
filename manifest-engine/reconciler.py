from typing import Dict, List, Any

def reconcile_manifest(header_meta: Dict[str, Any], rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Motor de Cuadre Matemático y Auditoría de Integridad:
    Compara las guías y paquetes extraídos contra los totales declarados en el encabezado.
    """
    guias_declaradas = header_meta.get('guias_declaradas', 0)
    paquetes_declarados = header_meta.get('paquetes_declarados', 0)
    
    unique_guias = set()
    all_wrs = []
    guias_multi_paquete = []
    guias_sin_paquete = []
    wr_counts = {}
    
    for r in rows:
        g = r['guia']
        wrs = r.get('wrs', [])
        
        unique_guias.add(g)
        
        if len(wrs) > 1:
            guias_multi_paquete.append({
                'guia': g,
                'cantidad': len(wrs),
                'wrs': wrs
            })
        elif len(wrs) == 0:
            guias_sin_paquete.append({
                'guia': g,
                'observacion': r.get('observacion', '')
            })
            
        for wr in wrs:
            all_wrs.append(wr)
            wr_counts[wr] = wr_counts.get(wr, 0) + 1
            
    total_guias_extraidas = len(unique_guias)
    total_wrs_extraidos = len(all_wrs)
    
    # Comprobar duplicados
    wrs_duplicados = [wr for wr, count in wr_counts.items() if count > 1]
    
    # Calcular diferencias
    dif_guias = total_guias_extraidas - guias_declaradas if guias_declaradas > 0 else 0
    dif_paquetes = total_wrs_extraidos - paquetes_declarados if paquetes_declarados > 0 else 0
    
    cuadre_perfecto = (
        guias_declaradas > 0 and 
        paquetes_declarados > 0 and 
        dif_guias == 0 and 
        dif_paquetes == 0 and 
        len(wrs_duplicados) == 0
    )
    
    # Estado descriptivo
    if cuadre_perfecto:
        status_code = "CUADRE_PERFECTO"
        mensaje = f"✓ Cuadre Perfecto: 100% de coincidencia ({total_guias_extraidas} Guías / {total_wrs_extraidos} Paquetes)."
    else:
        status_code = "DESCUADRE"
        detalles = []
        if dif_guias != 0:
            detalles.append(f"Guías: {total_guias_extraidas} extraídas vs {guias_declaradas} declaradas ({'+' if dif_guias > 0 else ''}{dif_guias})")
        if dif_paquetes != 0:
            detalles.append(f"Paquetes: {total_wrs_extraidos} extraídos vs {paquetes_declarados} declarados ({'+' if dif_paquetes > 0 else ''}{dif_paquetes})")
        if wrs_duplicados:
            detalles.append(f"{len(wrs_duplicados)} WRs repetidos detectados")
        mensaje = "⚠️ Descuadre detectado: " + " • ".join(detalles)
        
    return {
        'cuadre_perfecto': cuadre_perfecto,
        'status_code': status_code,
        'mensaje': mensaje,
        'totales': {
            'guias_declaradas': guias_declaradas,
            'guias_extraidas': total_guias_extraidas,
            'diferencia_guias': dif_guias,
            'paquetes_declarados': paquetes_declarados,
            'paquetes_extraidos': total_wrs_extraidos,
            'diferencia_paquetes': dif_paquetes
        },
        'auditoria': {
            'total_guias_con_multiples_paquetes': len(guias_multi_paquete),
            'guias_multi_paquete': guias_multi_paquete,
            'total_guias_sin_paquete': len(guias_sin_paquete),
            'guias_sin_paquete': guias_sin_paquete,
            'total_wrs_duplicados': len(wrs_duplicados),
            'wrs_duplicados': wrs_duplicados
        }
    }
