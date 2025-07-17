import React, { useState, useEffect } from 'react';
import { Input, Button } from '../../../../../shared/components/ui';
import { PhoneInput } from '../../../../../shared/components/ui/Input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import styles from './ProviderForm.module.css';

/**
 * Formulario para crear/editar proveedores
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.provider - Datos del proveedor (null para crear nuevo)
 * @param {Function} props.onSubmit - Función a ejecutar al enviar el formulario
 * @param {Function} props.onCancel - Función a ejecutar al cancelar
 * @param {boolean} props.isSubmitting - Indica si el formulario está siendo enviado
 */
const ProviderForm = ({ 
  provider = null, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    contacto: {
      telefono: '',
      email: '',
      direccion: ''
    },
    informacionFiscal: {
      cuit: '',
      razonSocial: '',
      tipoFactura: ''
    },
    informacionAdicional: {
      diasEntrega: '',
      periodicidadPedidos: ''
    },
    notas: ''
  });

  const [errors, setErrors] = useState({});

  // Cargar datos del proveedor si está editando
  useEffect(() => {
    if (provider) {
      setFormData({
        nombre: provider.nombre || '',
        categoria: provider.categoria || '',
        contacto: {
          telefono: provider.contacto?.telefono || '',
          email: provider.contacto?.email || '',
          direccion: provider.contacto?.direccion || ''
        },
        informacionFiscal: {
          cuit: provider.informacionFiscal?.cuit || provider.informacionFiscal?.rut || '',
          razonSocial: provider.informacionFiscal?.razonSocial || '',
          tipoFactura: provider.informacionFiscal?.tipoFactura || provider.informacionFiscal?.giro || ''
        },
        informacionAdicional: {
          diasEntrega: provider.informacionAdicional?.diasEntrega || provider.tiempoEntrega || '',
          periodicidadPedidos: provider.informacionAdicional?.periodicidadPedidos || ''
        },
        notas: provider.notas || ''
      });
    }
  }, [provider]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleNestedInputChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));

    // Limpiar error del campo
    const errorKey = `${category}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'La categoría es requerida';
    }

    if (!formData.contacto.telefono.trim()) {
      newErrors['contacto.telefono'] = 'El teléfono es requerido';
    } else if (!isValidPhoneNumber(formData.contacto.telefono)) {
      newErrors['contacto.telefono'] = 'El número de teléfono no es válido';
    }

    if (formData.contacto.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contacto.email)) {
      newErrors['contacto.email'] = 'El email no tiene un formato válido';
    }

    // Validación CUIT (formato argentino: XX-XXXXXXXX-X)
    if (formData.informacionFiscal.cuit && !/^\d{2}-\d{8}-\d{1}$/.test(formData.informacionFiscal.cuit)) {
      newErrors['informacionFiscal.cuit'] = 'El CUIT debe tener el formato 20-12345678-5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const categorias = [
    { value: 'alimentos', label: 'Alimentos' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'equipos', label: 'Equipos' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'otros', label: 'Otros' }
  ];

  const tiposFactura = [
    { value: 'A', label: 'Tipo A - Responsable Inscripto' },
    { value: 'B', label: 'Tipo B - Responsable Inscripto a Exento' },
    { value: 'C', label: 'Tipo C - Consumidor Final' }
  ];

  const periodicidades = [
    { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual', label: 'Mensual' },
    { value: 'bimestral', label: 'Bimestral' },
    { value: 'eventual', label: 'Eventual/Según necesidad' }
  ];

  return (
    <div className={styles.providerForm}>
      <form onSubmit={handleSubmit}>
        {/* Información Básica */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información Básica</h3>
          <p className={styles.sectionSubtitle}>Datos generales del proveedor</p>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nombre del Proveedor *
              </label>
              <Input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                error={errors.nombre}
                disabled={isSubmitting}
                placeholder="Nombre comercial del proveedor"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Categoría *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className={`${styles.select} ${errors.categoria ? styles.error : ''}`}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar rubro del proveedor</option>
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.categoria && (
                <span className={styles.errorMessage}>{errors.categoria}</span>
              )}
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información de Contacto</h3>
          <p className={styles.sectionSubtitle}>Datos para comunicación con el proveedor</p>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Teléfono *
              </label>
              <PhoneInput
                value={formData.contacto.telefono}
                onChange={(value) => handleNestedInputChange('contacto', 'telefono', value)}
                disabled={isSubmitting}
                placeholder="Número de contacto principal"
                isValid={formData.contacto.telefono ? isValidPhoneNumber(formData.contacto.telefono) : null}
                className={errors['contacto.telefono'] ? 'error' : ''}
              />
              {errors['contacto.telefono'] && (
                <div className={styles.errorMessage}>{errors['contacto.telefono']}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Email
              </label>
              <Input
                type="email"
                value={formData.contacto.email}
                onChange={(e) => handleNestedInputChange('contacto', 'email', e.target.value)}
                error={errors['contacto.email']}
                disabled={isSubmitting}
                placeholder="Correo electrónico de contacto"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Dirección Completa
              </label>
              <Input
                type="text"
                value={formData.contacto.direccion}
                onChange={(e) => handleNestedInputChange('contacto', 'direccion', e.target.value)}
                disabled={isSubmitting}
                placeholder="Dirección completa del proveedor"
              />
            </div>
          </div>
        </div>

        {/* Información Fiscal */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información Fiscal</h3>
          <p className={styles.sectionSubtitle}>Datos tributarios y facturación</p>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                CUIT
              </label>
              <Input
                type="text"
                value={formData.informacionFiscal.cuit}
                onChange={(e) => handleNestedInputChange('informacionFiscal', 'cuit', e.target.value)}
                error={errors['informacionFiscal.cuit']}
                disabled={isSubmitting}
                placeholder="Número de CUIT del proveedor"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Razón Social
              </label>
              <Input
                type="text"
                value={formData.informacionFiscal.razonSocial}
                onChange={(e) => handleNestedInputChange('informacionFiscal', 'razonSocial', e.target.value)}
                disabled={isSubmitting}
                placeholder="Razón social registrada"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Tipo de Factura
              </label>
              <select
                value={formData.informacionFiscal.tipoFactura}
                onChange={(e) => handleNestedInputChange('informacionFiscal', 'tipoFactura', e.target.value)}
                className={styles.select}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar tipo de facturación</option>
                {tiposFactura.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información Adicional</h3>
          <p className={styles.sectionSubtitle}>Datos operativos y logística</p>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Días de Entrega
              </label>
              <Input
                type="number"
                value={formData.informacionAdicional.diasEntrega}
                onChange={(e) => handleNestedInputChange('informacionAdicional', 'diasEntrega', e.target.value)}
                disabled={isSubmitting}
                placeholder="Días hábiles de entrega"
                min="1"
                max="30"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Periodicidad de Pedidos
              </label>
              <select
                value={formData.informacionAdicional.periodicidadPedidos}
                onChange={(e) => handleNestedInputChange('informacionAdicional', 'periodicidadPedidos', e.target.value)}
                className={styles.select}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar frecuencia de pedidos</option>
                {periodicidades.map(periodo => (
                  <option key={periodo.value} value={periodo.value}>
                    {periodo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Notas Adicionales
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => handleInputChange('notas', e.target.value)}
              disabled={isSubmitting}
              placeholder="Observaciones, condiciones especiales, comentarios..."
              className={styles.textarea}
              rows={3}
            />
          </div>
        </div>

        {/* Botones */}
        <div className={styles.formActions}>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : (provider ? 'Actualizar' : 'Crear')} Proveedor
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProviderForm; 