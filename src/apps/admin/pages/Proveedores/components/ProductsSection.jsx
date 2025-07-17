import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Search, DollarSign } from 'lucide-react';
import { 
  getProviderProducts, 
  addProviderProduct, 
  updateProvider, 
  deleteProvider 
} from '../../../../../firebase';
import { Button, Input, ConfirmationModal } from '../../../../../shared/components/ui';
import styles from './ProductsSection.module.css';

/**
 * Sección para gestionar productos de un proveedor
 * @param {Object} props - Propiedades del componente
 * @param {string} props.providerId - ID del proveedor
 * @param {string} props.providerName - Nombre del proveedor
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {boolean} props.isOpen - Si la sección está abierta
 */
const ProductsSection = ({ 
  providerId, 
  providerName, 
  showNotification, 
  isOpen = false 
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    unidad: '',
    categoria: '',
    codigoProducto: '',
    observaciones: ''
  });

  // Cargar productos cuando se abre la sección
  useEffect(() => {
    if (isOpen && providerId) {
      loadProducts();
    }
  }, [isOpen, providerId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsData = await getProviderProducts(providerId);
      setProducts(productsData);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      showNotification?.('error', 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.precio) {
      showNotification?.('error', 'El nombre y precio son requeridos');
      return;
    }

    try {
      const productData = {
        ...formData,
        precio: parseFloat(formData.precio),
        status: 'available'
      };

      if (editingProduct) {
        // Actualizar producto existente
        await updateProvider(editingProduct.id, productData);
        showNotification?.('success', 'Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        await addProviderProduct(providerId, productData);
        showNotification?.('success', 'Producto agregado exitosamente');
      }

      // Recargar productos
      loadProducts();
      resetForm();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      showNotification?.('error', 'Error al guardar el producto');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      precio: product.precio?.toString() || '',
      unidad: product.unidad || '',
      categoria: product.categoria || '',
      codigoProducto: product.codigoProducto || '',
      observaciones: product.observaciones || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProvider(productToDelete.id);
      showNotification?.('success', 'Producto eliminado exitosamente');
      loadProducts();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showNotification?.('error', 'Error al eliminar el producto');
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      unidad: '',
      categoria: '',
      codigoProducto: '',
      observaciones: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unidades = [
    { value: 'unidad', label: 'Unidad' },
    { value: 'kg', label: 'Kilogramo' },
    { value: 'litro', label: 'Litro' },
    { value: 'caja', label: 'Caja' },
    { value: 'pack', label: 'Pack' },
    { value: 'otro', label: 'Otro' }
  ];

  const categorias = [
    { value: 'ingredientes', label: 'Ingredientes' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'equipos', label: 'Equipos' },
    { value: 'otros', label: 'Otros' }
  ];

  if (!isOpen) return null;

  return (
    <div className={styles.productsSection}>
      <div className={styles.sectionHeader}>
        <h3>Productos de {providerName}</h3>
        <Button 
          variant="primary" 
          size="small"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} />
          Agregar Producto
        </Button>
      </div>

      {/* Búsqueda */}
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Formulario para agregar/editar producto */}
      {showAddForm && (
        <div className={styles.addForm}>
          <h4>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h4>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre del Producto *</label>
                <Input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Precio *</label>
                <div className={styles.priceInput}>
                  <DollarSign size={16} />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Unidad</label>
                <select
                  value={formData.unidad}
                  onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                  className={styles.select}
                >
                  <option value="">Seleccionar unidad</option>
                  {unidades.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  className={styles.select}
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Código del Producto</label>
                <Input
                  type="text"
                  value={formData.codigoProducto}
                  onChange={(e) => setFormData({...formData, codigoProducto: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className={styles.textarea}
                  rows={2}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  className={styles.textarea}
                  rows={2}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingProduct ? 'Actualizar' : 'Agregar'} Producto
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de productos */}
      <div className={styles.productsList}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={48} />
            <h4>No hay productos</h4>
            <p>
              {searchTerm 
                ? 'No se encontraron productos que coincidan con la búsqueda.'
                : 'Este proveedor aún no tiene productos agregados.'}
            </p>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productHeader}>
                  <h5>{product.nombre}</h5>
                  <div className={styles.productActions}>
                    <button 
                      onClick={() => handleEdit(product)}
                      className={styles.editButton}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => openDeleteModal(product)}
                      className={styles.deleteButton}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.productInfo}>
                  <div className={styles.priceInfo}>
                    <span className={styles.price}>${product.precio}</span>
                    {product.unidad && (
                      <span className={styles.unit}>/ {product.unidad}</span>
                    )}
                  </div>
                  
                  {product.categoria && (
                    <div className={styles.categoryBadge}>
                      {categorias.find(c => c.value === product.categoria)?.label || product.categoria}
                    </div>
                  )}
                </div>

                {product.descripcion && (
                  <p className={styles.description}>{product.descripcion}</p>
                )}

                {product.codigoProducto && (
                  <div className={styles.productCode}>
                    Código: {product.codigoProducto}
                  </div>
                )}

                {product.observaciones && (
                  <div className={styles.observations}>
                    <strong>Observaciones:</strong> {product.observaciones}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que quieres eliminar el producto "${productToDelete?.nombre}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ProductsSection; 