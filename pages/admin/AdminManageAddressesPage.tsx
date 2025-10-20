import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLoading } from '../../hooks/useLoading';
import { getDeliveryAddresses, addDeliveryAddress, updateDeliveryAddress, deleteDeliveryAddress } from '../../services/api';
import { DeliveryAddress } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const AdminManageAddressesPage: React.FC = () => {
    usePageTitle('Manage Delivery Addresses');
    const { setIsLoading } = useLoading();
    const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Partial<DeliveryAddress> | null>(null);

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            const data = await getDeliveryAddresses();
            setAddresses(data);
        } catch (error) {
            console.error("Failed to fetch delivery addresses", error);
            alert("Could not fetch delivery addresses. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const openModal = (address: DeliveryAddress | null = null) => {
        setEditingAddress(address || { addressLabel: '', fullAddress: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAddress(null);
    };

    const handleSave = async () => {
        if (!editingAddress || !editingAddress.addressLabel || !editingAddress.fullAddress) {
            alert("All fields are required.");
            return;
        }

        setIsLoading(true);
        closeModal();
        try {
            if ('addressId' in editingAddress && editingAddress.addressId) {
                await updateDeliveryAddress(editingAddress as DeliveryAddress);
            } else {
                await addDeliveryAddress(editingAddress as Omit<DeliveryAddress, 'addressId'>);
            }
            await fetchAddresses();
        } catch (error) {
            console.error("Failed to save delivery address", error);
            alert(`Could not save address: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (addressId: string) => {
        if (window.confirm("Are you sure you want to delete this address?")) {
            setIsLoading(true);
            try {
                await deleteDeliveryAddress(addressId);
                setAddresses(prev => prev.filter(a => a.addressId !== addressId));
            } catch (error) {
                console.error("Failed to delete delivery address", error);
                alert("Could not delete address. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingAddress) return;
        const { name, value } = e.target;
        setEditingAddress({ ...editingAddress, [name]: value });
    };

    return (
        <Card title="Delivery Address Management">
            <div className="flex justify-end mb-4">
                <Button onClick={() => openModal()}>Add New Address</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-surface">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Address ID</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Label</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Full Address</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {addresses.map(a => (
                            <tr key={a.addressId} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-sm font-mono text-gray-500">{a.addressId}</td>
                                <td className="py-4 px-6 text-sm font-medium text-text-primary">{a.addressLabel}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{a.fullAddress}</td>
                                <td className="py-4 px-6 space-x-2 whitespace-nowrap">
                                    <Button variant="ghost" onClick={() => openModal(a)}>Edit</Button>
                                    <Button variant="danger" onClick={() => handleDelete(a.addressId)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAddress && 'addressId' in editingAddress ? 'Edit Address' : 'Add Address'}>
                {editingAddress && (
                    <div className="space-y-4">
                        <input name="addressLabel" value={editingAddress.addressLabel || ''} onChange={handleChange} placeholder="Address Label (e.g., Head Office)" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="fullAddress" value={editingAddress.fullAddress || ''} onChange={handleChange} placeholder="Full Address" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
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

export default AdminManageAddressesPage;