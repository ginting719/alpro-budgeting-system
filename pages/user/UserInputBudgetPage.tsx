import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../hooks/useAuth';
import { useLoading } from '../../hooks/useLoading';
import { getProducts, submitBudget } from '../../services/api';
import { Product, BudgetItem } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const UserInputBudgetPage: React.FC = () => {
    usePageTitle('Input Budget');
    const { user } = useAuth();
    const { setIsLoading } = useLoading();

    const [allProducts, setAllProducts] = useState<BudgetItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);


    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError('');
                const productsData = await getProducts();

                const budgetItems = productsData.map(p => ({
                    productId: p.id,
                    productName: p.name,
                    productImage: p.imageUrl,
                    unit: p.unit,
                    price: p.price,
                    qty: 0,
                    total: 0
                }));
                setAllProducts(budgetItems);
            } catch (err) {
                setError('Failed to fetch initial data. Please try refreshing the page.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [setIsLoading]);

    const handleQuantityChange = (productId: string, newQtyString: string) => {
        const newQty = parseInt(newQtyString, 10);

        if (isNaN(newQty)) {
             setAllProducts(prev => prev.map(item =>
                item.productId === productId
                    ? { ...item, qty: 0, total: 0 }
                    : item
            ));
            return;
        }

        if (newQty < 0) return;

        setAllProducts(prev => prev.map(item =>
            item.productId === productId
                ? { ...item, qty: newQty, total: newQty * item.price }
                : item
        ));
    };

    const filteredItems = useMemo(() => {
        return allProducts.filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allProducts, searchTerm]);

    const itemsToSubmit = useMemo(() => {
        return allProducts.filter(item => item.qty > 0);
    }, [allProducts]);

    const grandTotal = useMemo(() => {
        return itemsToSubmit.reduce((sum, item) => sum + item.total, 0);
    }, [itemsToSubmit]);

    const handleOpenConfirmModal = () => {
        setError('');
        if (itemsToSubmit.length === 0) {
            setError("Cannot submit an empty request. Please add a quantity for at least one item.");
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!user) {
            setError("User session expired. Please log in again.");
            setIsConfirmModalOpen(false);
            return;
        }
        
        setIsLoading(true);
        setIsConfirmModalOpen(false);

        try {
            await submitBudget({
                userId: user.id,
                userName: user.name,
                department: user.department,
                items: itemsToSubmit,
                total: grandTotal,
                managerApproverId: user.managerId,
                bodApproverId: user.bodId,
            });
            setIsSuccessModalOpen(true);
            setAllProducts(prev => prev.map(item => ({ ...item, qty: 0, total: 0 })));

        } catch (err) {
            setError('Failed to submit budget request. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full">
            <Card className="flex flex-col h-full">
                 <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-text-primary flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Product List
                    </h2>
                    <input
                        type="text"
                        placeholder="Search item name..."
                        className="w-full sm:w-72 p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-primary transition-shadow"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-grow overflow-y-auto rounded-lg border border-border-color">
                    <table className="min-w-full bg-surface table-fixed">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider w-32">Kode Item</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider w-1/3">Nama Item</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider w-24">Gambar</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider w-40">Harga</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider w-40">Satuan</th>
                                <th className="py-3 px-4 text-center text-xs font-bold text-text-secondary uppercase tracking-wider w-28">Qty</th>
                                <th className="py-3 px-4 text-right text-xs font-bold text-text-secondary uppercase tracking-wider w-40">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {error && !allProducts.length ? (
                                <tr><td colSpan={7} className="text-center py-10 text-danger">{error}</td></tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.productId} className={`${index % 2 === 0 ? 'bg-surface' : 'bg-background'} hover:bg-gray-100 transition-colors`}>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm font-mono text-gray-500">{item.productId}</td>
                                        <td className="py-4 px-4 text-sm font-medium text-text-primary whitespace-normal break-words">{item.productName}</td>
                                        <td className="py-4 px-4">
                                            <img 
                                                src={item.productImage} 
                                                alt={item.productName} 
                                                className="w-10 h-10 object-cover rounded-md cursor-pointer transition-transform hover:scale-110"
                                                onClick={() => setZoomedImage({ src: item.productImage, alt: item.productName })}
                                            />
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm text-text-secondary">{formatCurrency(item.price)}</td>
                                        <td className="py-4 px-4 whitespace-normal break-words text-sm text-text-secondary">{item.unit}</td>
                                        <td className="py-4 px-4">
                                            <input
                                                type="number"
                                                value={item.qty === 0 ? '' : item.qty}
                                                onChange={e => handleQuantityChange(item.productId, e.target.value)}
                                                className="w-20 p-1 border border-gray-600 bg-gray-700 text-white rounded-md text-center mx-auto block focus:ring-2 focus:ring-primary"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm text-right font-semibold text-primary">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="flex-shrink-0 border-t border-border-color mt-auto pt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-lg">
                            <span className="font-medium text-text-secondary">Grand Total: </span>
                            <span className="font-bold text-2xl text-primary">{formatCurrency(grandTotal)}</span>
                        </div>
                        <div className="w-full sm:w-auto mt-4 sm:mt-0">
                             {error && <p className="text-danger text-sm text-center mb-2">{error}</p>}
                            <Button 
                                variant="primary"
                                className="w-full" 
                                onClick={handleOpenConfirmModal} 
                                disabled={itemsToSubmit.length === 0}
                            >
                                Submit Budget
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Budget Submission">
                <div>
                    <p className="mb-4 text-text-primary">Are you sure you want to submit this budget request with a total of:</p>
                    <p className="text-3xl font-bold text-center text-primary mb-6">{formatCurrency(grandTotal)}</p>
                    <div className="flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>No, Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>Yes, Submit</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="Submission Successful">
                <div className="text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-secondary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-md text-text-primary">
                        Selamat budgeting anda sudah selesai dibuat, tinggal menunggu untuk approval dari atasan anda, terimakasih.
                    </p>
                    <div className="mt-6">
                        <Button variant="primary" onClick={() => setIsSuccessModalOpen(false)}>
                            OK
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!zoomedImage} onClose={() => setZoomedImage(null)} title={zoomedImage?.alt || 'Product Image'}>
                {zoomedImage && (
                    <div className="flex justify-center items-center">
                        <img src={zoomedImage.src} alt={zoomedImage.alt} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserInputBudgetPage;