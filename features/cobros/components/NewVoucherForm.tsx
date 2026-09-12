'use client';

import React from 'react';
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Search,
  Smartphone,
  UploadCloud,
  X
} from 'lucide-react';
import { Paquete, VoucherFormValues, CobrosSubtab } from '../types';

interface NewVoucherFormProps {
  voucherFile: File | null;
  setVoucherFile: (file: File | null) => void;
  voucherPreviewUrl: string | null;
  setVoucherPreviewUrl: (url: string | null) => void;
  isDragging: boolean;
  isSubmitting: boolean;
  formValues: VoucherFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<VoucherFormValues>>;
  selectedWrs: Paquete[];
  setSelectedWrs: React.Dispatch<React.SetStateAction<Paquete[]>>;
  wrSearchQuery: string;
  setWrSearchQuery: (query: string) => void;
  paquetesDisponibles: Paquete[];
  processImageFile: (file: File) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleSaveVoucher: (e: React.FormEvent) => void;
  setSubtab: (subtab: CobrosSubtab) => void;
}

export const NewVoucherForm: React.FC<NewVoucherFormProps> = ({
  voucherFile,
  setVoucherFile,
  voucherPreviewUrl,
  setVoucherPreviewUrl,
  isDragging,
  isSubmitting,
  formValues,
  setFormValues,
  selectedWrs,
  setSelectedWrs,
  wrSearchQuery,
  setWrSearchQuery,
  paquetesDisponibles,
  processImageFile,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleSaveVoucher,
  setSubtab
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <Smartphone className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
            Registro Rápido de Voucher de Pago (WhatsApp)
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Copia la imagen en WhatsApp con <strong style={{ color: '#0f172a' }}>Ctrl + C</strong> y presiona <strong style={{ color: '#0f172a' }}>Ctrl + V</strong> en esta pantalla, o arrástrala al recuadro
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* DROPZONE / ZONA DE PEGA */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed #10b981' : voucherPreviewUrl ? '1.5px solid #10b981' : '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '20px',
            background: isDragging ? '#ecfdf5' : voucherPreviewUrl ? '#f0fdf4' : '#f8fafc',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            position: 'relative'
          }}
        >
          {voucherPreviewUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={voucherPreviewUrl}
                  alt="Voucher Preview"
                  style={{
                    maxHeight: '260px',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    objectFit: 'contain'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setVoucherFile(null);
                    setVoucherPreviewUrl(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    cursor: 'pointer',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  ✕
                </button>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803d' }}>
                ✓ Imagen cargada y lista para subir a Cloudflare R2 ({voucherFile?.name || 'Comprobante pegado'})
              </span>
            </div>
          ) : (
            <div style={{ padding: '24px 10px' }}>
              <UploadCloud className="w-12 h-12 text-slate-400" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                Arrastra aquí el comprobante o presiona <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + V</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Soporta capturas de pantalla, archivos JPG, PNG y fotos directas de WhatsApp Web
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '14px'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: '1px solid #15803d',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Camera className="w-4 h-4" />
                  📸 Tomar Foto con Celular
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processImageFile(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  🖼️ Elegir desde Galería / Archivos
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processImageFile(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* CAMPOS DEL FORMULARIO */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
              Cliente / Consignatario *
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez García"
              value={formValues.clienteNombre}
              onChange={(e) => setFormValues({ ...formValues, clienteNombre: e.target.value })}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Código Casillero</label>
            <input
              type="text"
              placeholder="Ej: CAS-4021"
              value={formValues.clienteCasillero}
              onChange={(e) => setFormValues({ ...formValues, clienteCasillero: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Teléfono / WhatsApp</label>
            <input
              type="text"
              placeholder="Ej: +51 987 654 321"
              value={formValues.clienteTelefono}
              onChange={(e) => setFormValues({ ...formValues, clienteTelefono: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Método de Pago *</label>
            <select
              value={formValues.metodoPago}
              onChange={(e) => setFormValues({ ...formValues, metodoPago: e.target.value as any })}
              className="form-control"
              required
            >
              <option value="YAPE">💜 Yape (BCP)</option>
              <option value="PLIN">💙 Plin (Interbank / BBVA / Scotiabank)</option>
              <option value="BCP">🏦 BCP Transferencia / Depósito</option>
              <option value="INTERBANK">💚 Interbank</option>
              <option value="BBVA">💙 BBVA</option>
              <option value="EFECTIVO">💵 Efectivo en Tienda Lince</option>
              <option value="OTRO">🌐 Otro / Transferencia Exterior</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Monto Pagado *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={formValues.moneda}
                onChange={(e) => setFormValues({ ...formValues, moneda: e.target.value as any })}
                className="form-control"
                style={{ width: '90px' }}
              >
                <option value="PEN">S/ Soles</option>
                <option value="USD">$ USD</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formValues.monto}
                onChange={(e) => setFormValues({ ...formValues, monto: e.target.value })}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
              N° de Operación Bancaria
            </label>
            <input
              type="text"
              placeholder="Ej: 4839201 (Opcional)"
              value={formValues.numeroOperacion}
              onChange={(e) => setFormValues({ ...formValues, numeroOperacion: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Fecha del Pago</label>
            <input
              type="date"
              value={formValues.fechaOperacion}
              onChange={(e) => setFormValues({ ...formValues, fechaOperacion: e.target.value })}
              className="form-control"
            />
          </div>
        </div>

        {/* ASOCIAR PAQUETES WRS AL PAGO */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
              📦 Paquetes / WRs Cubiertos por este Pago
            </span>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar WR o Casillero..."
                value={wrSearchQuery}
                onChange={(e) => setWrSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '32px', height: '32px', fontSize: '12px' }}
              />
            </div>
          </div>

          <div
            style={{
              maxHeight: '140px',
              overflowY: 'auto',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px'
            }}
          >
            {paquetesDisponibles.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No hay paquetes coincidentes.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
                {paquetesDisponibles.slice(0, 20).map((pkg) => {
                  const isSelected = selectedWrs.some((p) => p.id === pkg.id);
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedWrs(selectedWrs.filter((p) => p.id !== pkg.id));
                        } else {
                          setSelectedWrs([...selectedWrs, pkg]);
                          if (!formValues.clienteNombre && pkg.nombreConsignatario) {
                            setFormValues((prev) => ({
                              ...prev,
                              clienteNombre: pkg.nombreConsignatario || '',
                              clienteCasillero: pkg.codigoCasillero || ''
                            }));
                          }
                        }
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: isSelected ? '#ecfdf5' : '#ffffff',
                        border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{pkg.numeroReciboBodega}</span>
                        <span style={{ color: '#64748b', marginLeft: '4px' }}>({pkg.pesoKg || 0} Kg)</span>
                      </div>
                      <input type="checkbox" checked={isSelected} readOnly />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedWrs.length > 0 && (
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedWrs.map((p) => (
                <span
                  key={p.id}
                  style={{
                    background: '#dcfce7',
                    border: '1px solid #86efac',
                    color: '#14532d',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {p.numeroReciboBodega}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedWrs(selectedWrs.filter((x) => x.id !== p.id))}
                  />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
            O escribe los WRs manualmente:
          </label>
          <input
            type="text"
            placeholder="Ej: WR10452, WR10453"
            value={formValues.wrInput}
            onChange={(e) => setFormValues({ ...formValues, wrInput: e.target.value })}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Notas / Observaciones</label>
          <input
            type="text"
            placeholder="Ej: Pago adelantado para recojo el viernes por la tarde"
            value={formValues.notas}
            onChange={(e) => setFormValues({ ...formValues, notas: e.target.value })}
            className="form-control"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setSubtab('todos')}
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', fontWeight: 700 }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              background: '#16a34a',
              padding: '12px 24px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 className="w-5 h-5" />
            {isSubmitting ? 'Guardando en Cloudflare R2...' : 'Guardar Voucher & Confirmar Cobro'}
          </button>
        </div>
      </form>
    </div>
  );
};
