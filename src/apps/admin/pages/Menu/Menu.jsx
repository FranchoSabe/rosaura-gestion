import React, { useState, useEffect } from 'react';
import { ChefHat, Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, X, Settings } from 'lucide-react';
import { 
  subscribeToProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  updateProductAvailability,
  clearAllProducts 
} from '../../../../firebase.js';
import { Input } from '../../../../shared/components/ui/Input';
import { Modal } from '../../../../shared/components/ui/Modal';
import { ConfirmationModal } from '../../../../shared/components/ui';
// Importaciones de initializeData removidas - no necesarias para menú real
import { getAvailableModifiers } from '../../../../shared/constants/modifiers';
import styles from './Menu.module.css';

/**
 * Página para gestión del menú del restaurante
 * Permite crear, editar, eliminar y gestionar disponibilidad de productos
 */
const Menu = ({ 
  showNotification, 
  showConfirmation 
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [systemInitialized, setSystemInitialized] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Categorías disponibles
  const categories = [
    { value: 'entrada', label: 'Entradas' },
    { value: 'principal', label: 'Principales' },
    { value: 'postre', label: 'Postres' },
    { value: 'bebida', label: 'Bebidas' },
    { value: 'otros', label: 'Otros' }
  ];

  // Sistema siempre inicializado para menú real
  useEffect(() => {
    setSystemInitialized(true);
  }, []);

  // Suscripción a productos
  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (productsData) => {
        setProducts(productsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar productos:', error);
        showNotification('Error al cargar productos', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe && unsubscribe();
  }, [showNotification]);

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Manejar creación/edición de producto
  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        showNotification('Producto actualizado exitosamente', 'success');
      } else {
        await addProduct(productData);
        showNotification('Producto creado exitosamente', 'success');
      }
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      showNotification('Error al guardar producto', 'error');
    }
  };

  // Manejar eliminación de producto
  const handleDeleteProduct = async () => {
    try {
      await deleteProduct(productToDelete.id);
      showNotification('Producto eliminado exitosamente', 'success');
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showNotification('Error al eliminar producto', 'error');
    }
  };

  // Manejar cambio de disponibilidad
  const handleToggleAvailability = async (product) => {
    try {
      await updateProductAvailability(product.id, !product.disponible);
      showNotification(
        `Producto ${!product.disponible ? 'activado' : 'desactivado'} exitosamente`,
        'success'
      );
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
      showNotification('Error al cambiar disponibilidad', 'error');
    }
  };

  // Abrir modal de edición
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  // Abrir modal de eliminación
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Abrir modal de creación
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  // Manejar inicialización del sistema
  const handleInitializeSystem = async () => {
    setIsInitializing(true);
    try {
      const success = await initializeSystemData();
      if (success) {
        showNotification('Sistema inicializado exitosamente con datos de ejemplo', 'success');
        setSystemInitialized(true);
      } else {
        showNotification('Error al inicializar el sistema', 'error');
      }
    } catch (error) {
      console.error('Error al inicializar:', error);
      showNotification('Error al inicializar el sistema', 'error');
    } finally {
      setIsInitializing(false);
    }
  };

  // Manejar limpieza de la base de datos
  const handleClearDatabase = async () => {
    if (!showConfirmation) {
      if (!confirm('¿Estás seguro de que quieres eliminar todos los productos? Esta acción no se puede deshacer.')) {
        return;
      }
    }
    
    setIsClearing(true);
    try {
      await clearAllProducts();
      showNotification('Base de datos limpiada exitosamente', 'success');
      setSystemInitialized(false);
    } catch (error) {
      console.error('Error al limpiar base de datos:', error);
      showNotification('Error al limpiar la base de datos', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className={styles.menuPage}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <ChefHat className={styles.titleIcon} />
            <div>
              <h1 className={styles.title}>Gestión de Menú</h1>
              <p className={styles.subtitle}>Administrar productos, precios y disponibilidad</p>
            </div>
          </div>
          <div className={styles.headerButtons}>
            <button 
              className={styles.addButton}
              onClick={handleAddProduct}
            >
              <Plus size={20} />
              Agregar Producto
            </button>
            
            {products.length > 0 && (
              <button 
                className={styles.clearButton}
                onClick={handleClearDatabase}
                disabled={isClearing}
                title="Limpiar base de datos de productos"
              >
                {isClearing ? 'Limpiando...' : 'Limpiar BD'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Inicialización del sistema */}
        {!systemInitialized && products.length === 0 && (
          <div className={styles.initializationBanner}>
            <div className={styles.initializationContent}>
              <h3>Sistema sin datos</h3>
              <p>El sistema no tiene productos cargados. Inicializa con datos de ejemplo para comenzar.</p>
              <button 
                onClick={handleInitializeSystem}
                disabled={isInitializing}
                className={styles.initializeButton}
              >
                {isInitializing ? 'Inicializando...' : 'Inicializar Sistema'}
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterContainer}>
            <Filter className={styles.filterIcon} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de productos */}
        <div className={styles.productsGrid}>
          {filteredProducts.map(product => (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.productHeader}>
                <h3 className={styles.productName}>{product.nombre}</h3>
                <div className={styles.productActions}>
                  <button
                    onClick={() => handleToggleAvailability(product)}
                    className={`${styles.toggleButton} ${product.disponible ? styles.available : styles.unavailable}`}
                    title={product.disponible ? 'Desactivar' : 'Activar'}
                  >
                    {product.disponible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className={styles.editButton}
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product)}
                    className={styles.deleteButton}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className={styles.productInfo}>
                <div className={styles.productCategory}>
                  {categories.find(cat => cat.value === product.categoria)?.label || product.categoria}
                </div>
                <div className={styles.productPrice}>
                  ${product.precio?.toLocaleString('es-AR')}
                </div>
              </div>
              
              {product.descripcion && (
                <p className={styles.productDescription}>{product.descripcion}</p>
              )}
              
              <div className={styles.productMeta}>
                <span className={`${styles.availabilityBadge} ${product.disponible ? styles.available : styles.unavailable}`}>
                  {product.disponible ? 'Disponible' : 'No disponible'}
                </span>
                {product.tiempoPreparacion && (
                  <span className={styles.prepTime}>
                    {product.tiempoPreparacion} min
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className={styles.emptyState}>
            <ChefHat size={48} className={styles.emptyIcon} />
            <h3>No hay productos</h3>
            <p>
              {searchTerm || selectedCategory 
                ? 'No se encontraron productos con los filtros aplicados'
                : 'Comienza agregando productos al menú'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de producto */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <ConfirmationModal
          title="Eliminar Producto"
          message={`¿Estás seguro de que deseas eliminar "${productToDelete?.nombre}"?`}
          onConfirm={handleDeleteProduct}
          onCancel={() => {
            setShowDeleteModal(false);
            setProductToDelete(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Modal para crear/editar productos
 */
const ProductModal = ({ product, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: product?.nombre || '',
    categoria: product?.categoria || 'principal',
    precio: product?.precio || '',
    descripcion: product?.descripcion || '',
    tiempoPreparacion: product?.tiempoPreparacion || '',
    ingredientes: product?.ingredientes?.join(', ') || '',
    alergenos: product?.alergenos?.join(', ') || ''
  });

  const [selectedModifiers, setSelectedModifiers] = useState(product?.modifiers || []);
  const [errors, setErrors] = useState({});
  const availableModifiers = getAvailableModifiers();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Funciones para gestionar modificadores globales
  const addModifier = (globalModifierId) => {
    const globalModifier = availableModifiers.find(mod => mod.id === globalModifierId);
    if (!globalModifier) return;
    
    // Verificar si ya está agregado
    if (selectedModifiers.some(mod => mod.id === globalModifierId)) {
      return;
    }
    
    setSelectedModifiers([...selectedModifiers, { ...globalModifier }]);
  };

  const removeModifier = (modifierId) => {
    setSelectedModifiers(selectedModifiers.filter(mod => mod.id !== modifierId));
  };

  const getUnselectedModifiers = () => {
    return availableModifiers.filter(global => 
      !selectedModifiers.some(selected => selected.id === global.id)
    );
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.precio || formData.precio <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    }
    
    if (!formData.categoria) {
      newErrors.categoria = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const productData = {
      nombre: formData.nombre.trim(),
      categoria: formData.categoria,
      precio: parseFloat(formData.precio),
      descripcion: formData.descripcion.trim(),
      tiempoPreparacion: formData.tiempoPreparacion ? parseInt(formData.tiempoPreparacion) : null,
      ingredientes: formData.ingredientes ? formData.ingredientes.split(',').map(i => i.trim()).filter(Boolean) : [],
      alergenos: formData.alergenos ? formData.alergenos.split(',').map(a => a.trim()).filter(Boolean) : [],
      modifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined
    };

    onSave(productData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={product ? 'Editar Producto' : 'Agregar Producto'}
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className={styles.productForm}>
        <div className={styles.formGroup}>
          <Input
            label="Nombre del producto"
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={errors.nombre}
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Categoría</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={styles.select}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.categoria && <span className={styles.error}>{errors.categoria}</span>}
          </div>

          <div className={styles.formGroup}>
            <Input
              label="Precio"
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              error={errors.precio}
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Descripción"
            type="textarea"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Tiempo de preparación (minutos)"
            type="number"
            name="tiempoPreparacion"
            value={formData.tiempoPreparacion}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Ingredientes (separados por comas)"
            type="text"
            name="ingredientes"
            value={formData.ingredientes}
            onChange={handleChange}
            placeholder="Ej: Tomate, Lechuga, Queso"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            label="Alérgenos (separados por comas)"
            type="text"
            name="alergenos"
            value={formData.alergenos}
            onChange={handleChange}
            placeholder="Ej: Gluten, Lactosa"
          />
        </div>

        {/* Sección de Modificadores */}
        <div className={styles.modifiersSection}>
          <div className={styles.modifiersHeader}>
            <h3 className={styles.modifiersTitle}>
              <Settings size={20} />
              Modificadores
            </h3>
            
            {getUnselectedModifiers().length > 0 && (
              <div className={styles.modifierSelector}>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      addModifier(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className={styles.select}
                >
                  <option value="">Seleccionar modificador...</option>
                  {getUnselectedModifiers().map(modifier => (
                    <option key={modifier.id} value={modifier.id}>
                      {modifier.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {selectedModifiers.length > 0 && (
            <div className={styles.modifiersList}>
              {selectedModifiers.map((modifier) => (
                <div key={modifier.id} className={styles.modifierCard}>
                  <div className={styles.modifierHeader}>
                    <div className={styles.modifierInfo}>
                      <h4 className={styles.modifierName}>{modifier.name}</h4>
                      <div className={styles.modifierMeta}>
                        <span className={styles.modifierType}>
                          {modifier.type === 'single_choice' ? 'Selección única' : 'Múltiple selección'}
                        </span>
                        {modifier.required && (
                          <span className={styles.requiredBadge}>Requerido</span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => removeModifier(modifier.id)}
                      className={styles.removeModifierButton}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className={styles.optionsDisplay}>
                    <h5 className={styles.optionsTitle}>Opciones disponibles:</h5>
                    <div className={styles.optionsList}>
                      {modifier.options.map((option) => (
                        <div key={option.id} className={styles.optionDisplay}>
                          <span className={styles.optionName}>{option.name}</span>
                          {option.price > 0 && (
                            <span className={styles.optionPrice}>+${option.price}</span>
                          )}
                          {option.hasIngredients && (
                            <span className={styles.optionSpecial}>Con ingredientes personalizables</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedModifiers.length === 0 && (
            <div className={styles.noModifiers}>
              <p>No hay modificadores seleccionados para este producto.</p>
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton}>
            {product ? 'Actualizar' : 'Crear'} Producto
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default Menu; 