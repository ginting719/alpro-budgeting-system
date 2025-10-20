import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLoading } from '../../hooks/useLoading';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../services/api';
import { Product } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const AdminMasterDataPage: React.FC = () => {
    usePageTitle('Master Data Management');
    const { setIsLoading } = useLoading();
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const openModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct({ ...product });
            setIsEditMode(true);
        } else {
            setEditingProduct({ id: '', name: '', imageUrl: '', unit: '', price: 0, vendorId: '' });
            setIsEditMode(false);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct({});
        setIsEditMode(false);
    };

    const handleSave = async () => {
        if (!editingProduct) return;
        
        if (!editingProduct.id || !editingProduct.name || !editingProduct.unit || !editingProduct.price || editingProduct.price <= 0 || !editingProduct.vendorId) {
            alert("Please fill all fields, including the ID, correctly.");
            return;
        }

        setIsLoading(true);
        closeModal();
        try {
            if (isEditMode) {
                await updateProduct(editingProduct as Product);
            } else {
                await addProduct(editingProduct as Product);
            }
            await fetchProducts();
        } catch (error) {
            console.error("Failed to save product", error);
            alert(`Could not save product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
             setIsLoading(false);
        }
    };
    
    const handleDelete = async (productId: string) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            setIsLoading(true);
            try {
                await deleteProduct(productId);
                // Update UI instantly by removing the deleted product from the state
                setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
            } catch(error) {
                console.error("Failed to delete product", error);
                alert("Could not delete product. Please try again.");
            } finally {
                 setIsLoading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingProduct) return;
        const { name, value } = e.target;
        setEditingProduct({ ...editingProduct, [name]: name === 'price' ? Number(value) : value });
    };

    return (
        <Card title="Manage Products">
            <div className="flex justify-end mb-4">
                <Button onClick={() => openModal()}>Add New Product</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-surface">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Image</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">ID</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Name</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Unit</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Price</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Vendor ID</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6"><img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-md object-cover"/></td>
                                <td className="py-4 px-6 text-sm font-mono text-gray-500">{p.id}</td>
                                <td className="py-4 px-6 text-sm font-medium text-text-primary">{p.name}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{p.unit}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{formatCurrency(p.price)}</td>
                                <td className="py-4 px-6 text-sm font-mono text-gray-500">{p.vendorId}</td>
                                <td className="py-4 px-6 space-x-2 whitespace-nowrap">
                                    <Button variant="ghost" onClick={() => openModal(p)}>Edit</Button>
                                    <Button variant="danger" onClick={() => handleDelete(p.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditMode ? 'Edit Product' : 'Add Product'}>
                {editingProduct && (
                    <div className="space-y-4">
                        <input 
                            name="id" 
                            value={editingProduct.id || ''} 
                            onChange={handleChange} 
                            placeholder="Product ID (e.g., prod-011)" 
                            className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                            disabled={isEditMode}
                        />
                        <input name="name" value={editingProduct.name || ''} onChange={handleChange} placeholder="Product Name" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="unit" value={editingProduct.unit || ''} onChange={handleChange} placeholder="Unit (e.g., Pcs, Rim)" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="price" type="number" value={editingProduct.price || 0} onChange={handleChange} placeholder="Price" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="imageUrl" value={editingProduct.imageUrl || ''} onChange={handleChange} placeholder="Image URL" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="vendorId" value={editingProduct.vendorId || ''} onChange={handleChange} placeholder="Vendor ID" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

export default AdminMasterDataPage;