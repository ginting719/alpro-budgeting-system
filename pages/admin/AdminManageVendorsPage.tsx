import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLoading } from '../../hooks/useLoading';
import { getVendors, addVendor, updateVendor, deleteVendor } from '../../services/api';
import { Vendor } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const AdminManageVendorsPage: React.FC = () => {
    usePageTitle('Manage Vendors');
    const { setIsLoading } = useLoading();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Partial<Vendor> | null>(null);

    const fetchVendors = async () => {
        setIsLoading(true);
        try {
            const data = await getVendors();
            setVendors(data);
        } catch (error) {
            console.error("Failed to fetch vendors", error);
            alert("Could not fetch vendors. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const openModal = (vendor: Vendor | null = null) => {
        setEditingVendor(vendor || { vendorName: '', vendorAddress: '', vendorContact: '', termOfPayment: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingVendor(null);
    };

    const handleSave = async () => {
        if (!editingVendor || !editingVendor.vendorName || !editingVendor.vendorAddress) {
            alert("Vendor Name and Address are required.");
            return;
        }

        setIsLoading(true);
        closeModal();
        try {
            if ('vendorId' in editingVendor && editingVendor.vendorId) {
                await updateVendor(editingVendor as Vendor);
            } else {
                await addVendor(editingVendor as Omit<Vendor, 'vendorId'>);
            }
            await fetchVendors();
        } catch (error) {
            console.error("Failed to save vendor", error);
            alert(`Could not save vendor: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (vendorId: string) => {
        if (window.confirm("Are you sure you want to delete this vendor?")) {
            setIsLoading(true);
            try {
                await deleteVendor(vendorId);
                setVendors(prev => prev.filter(v => v.vendorId !== vendorId));
            } catch (error) {
                console.error("Failed to delete vendor", error);
                alert("Could not delete vendor. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingVendor) return;
        const { name, value } = e.target;
        setEditingVendor({ ...editingVendor, [name]: value });
    };

    return (
        <Card title="Vendor Management">
            <div className="flex justify-end mb-4">
                <Button onClick={() => openModal()}>Add New Vendor</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-surface">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Vendor ID</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Name</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Address</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Contact</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Term of Payment</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {vendors.map(v => (
                            <tr key={v.vendorId} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-sm font-mono text-gray-500">{v.vendorId}</td>
                                <td className="py-4 px-6 text-sm font-medium text-text-primary">{v.vendorName}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{v.vendorAddress}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{v.vendorContact}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{v.termOfPayment}</td>
                                <td className="py-4 px-6 space-x-2 whitespace-nowrap">
                                    <Button variant="ghost" onClick={() => openModal(v)}>Edit</Button>
                                    <Button variant="danger" onClick={() => handleDelete(v.vendorId)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingVendor && 'vendorId' in editingVendor ? 'Edit Vendor' : 'Add Vendor'}>
                {editingVendor && (
                    <div className="space-y-4">
                        <input name="vendorName" value={editingVendor.vendorName || ''} onChange={handleChange} placeholder="Vendor Name" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="vendorAddress" value={editingVendor.vendorAddress || ''} onChange={handleChange} placeholder="Vendor Address" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="vendorContact" value={editingVendor.vendorContact || ''} onChange={handleChange} placeholder="Vendor Contact (Phone/Email)" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="termOfPayment" value={editingVendor.termOfPayment || ''} onChange={handleChange} placeholder="Term of Payment (e.g., 30 days)" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
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

export default AdminManageVendorsPage;