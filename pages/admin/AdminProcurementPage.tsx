import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../hooks/useAuth';
import { useLoading } from '../../hooks/useLoading';
import { getBudgetRequests, updateProcurementStatus, getCompanyProfiles, getDeliveryAddresses, updateBudgetProcurementDetails } from '../../services/api';
import { BudgetRequest, BudgetStatus, ProcurementStatus, BudgetItem, CompanyProfile, DeliveryAddress } from '../../types';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const AdminProcurementPage: React.FC = () => {
    usePageTitle('Procurement Management');
    const { user } = useAuth();
    const { setIsLoading } = useLoading();

    // Main data states
    const [requests, setRequests] = useState<BudgetRequest[]>([]);
    const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
    const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>([]);
    
    // UI states
    const [error, setError] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<BudgetRequest | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const fetchAllData = async () => {
        if (user) {
            try {
                setIsLoading(true);
                const [reqData, profilesData, addressesData] = await Promise.all([
                    getBudgetRequests(user),
                    getCompanyProfiles(),
                    getDeliveryAddresses()
                ]);
                
                const approvedRequests = reqData.filter(r => r.status === BudgetStatus.APPROVED);
                setRequests(approvedRequests.sort((a, b) => (b.approvedAt ? new Date(b.approvedAt).getTime() : 0) - (a.approvedAt ? new Date(a.approvedAt).getTime() : 0)));
                setCompanyProfiles(profilesData);
                setDeliveryAddresses(addressesData);

            } catch (err) {
                setError('Failed to fetch procurement data.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const handleDetailUpdate = async (budgetId: string, field: 'companyProfileId' | 'deliveryAddress', value: string) => {
        try {
            // Optimistically update UI
            setRequests(prev => prev.map(r => r.id === budgetId ? { ...r, [field === 'companyProfileId' ? 'assignedCompanyProfileId' : 'assignedDeliveryAddress']: value } : r));
            
            // Send update to backend
            await updateBudgetProcurementDetails({
                budgetId,
                companyProfileId: field === 'companyProfileId' ? value : undefined,
                deliveryAddress: field === 'deliveryAddress' ? value : undefined,
            });

        } catch (err) {
            alert('Failed to save selection. Please try again.');
            // Revert UI on failure
            fetchAllData(); 
        }
    };
    
    const handleStatusUpdate = async (budgetId: string, newStatus: ProcurementStatus) => {
        setIsLoading(true);
        try {
            await updateProcurementStatus(budgetId, newStatus);
            setRequests(prev => prev.map(r => r.id === budgetId ? { ...r, procurementStatus: newStatus } : r));
        } catch (err) {
            alert('Failed to update status.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRequests = useMemo(() => {
        if (filterStatus === 'all') return requests;
        return requests.filter(req => (req.procurementStatus || ProcurementStatus.PENDING) === filterStatus);
    }, [requests, filterStatus]);
    
    return (
        <Card title="Approved Budgets for Procurement">
            <div className="flex justify-end mb-4">
                 <div className="w-64">
                    <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                    <select
                        id="statusFilter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary"
                    >
                        <option value="all" className="bg-white text-black">All</option>
                        {Object.values(ProcurementStatus).map(status => (
                            <option key={status} value={status} className="bg-white text-black">{status}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <p className="text-center text-danger">{error}</p>}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-surface">
                     <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Request ID</th>
                            <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Department</th>
                            <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Total</th>
                            <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Assign Company</th>
                            <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Assign Address</th>
                            <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Update Status</th>
                            <th className="py-3 px-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {filteredRequests.length > 0 ? (
                            filteredRequests.map((req, index) => (
                                <tr key={req.id} className={`${index % 2 === 0 ? 'bg-surface' : 'bg-background'} hover:bg-gray-100 transition-colors`}>
                                    <td className="py-2 px-4 text-sm font-mono text-text-secondary">{req.id.substring(0, 13)}...</td>
                                    <td className="py-2 px-4 text-sm text-text-secondary">{req.department}</td>
                                    <td className="py-2 px-4 font-semibold text-sm text-text-primary">{formatCurrency(req.total)}</td>
                                    <td className="py-2 px-4">
                                        <select
                                            value={req.assignedCompanyProfileId || ''}
                                            onChange={(e) => handleDetailUpdate(req.id, 'companyProfileId', e.target.value)}
                                            className="w-full p-1.5 border border-gray-600 bg-gray-700 text-white rounded-md text-sm focus:ring-2 focus:ring-primary"
                                            disabled={req.procurementStatus !== ProcurementStatus.PENDING}
                                        >
                                            <option value="" className="bg-white text-black">-- Select PT --</option>
                                            {companyProfiles.map(p => <option key={p.profileId} value={p.profileId} className="bg-white text-black">{p.companyName}</option>)}
                                        </select>
                                    </td>
                                    <td className="py-2 px-4">
                                         <select
                                            value={req.assignedDeliveryAddress || ''}
                                            onChange={(e) => handleDetailUpdate(req.id, 'deliveryAddress', e.target.value)}
                                            className="w-full p-1.5 border border-gray-600 bg-gray-700 text-white rounded-md text-sm focus:ring-2 focus:ring-primary"
                                            disabled={req.procurementStatus !== ProcurementStatus.PENDING}
                                        >
                                            <option value="" className="bg-white text-black">-- Select Address --</option>
                                            {deliveryAddresses.map(a => <option key={a.addressId} value={a.fullAddress} className="bg-white text-black">{a.addressLabel}</option>)}
                                        </select>
                                    </td>
                                    <td className="py-2 px-4">
                                        <select
                                            value={req.procurementStatus || ProcurementStatus.PENDING}
                                            onChange={(e) => handleStatusUpdate(req.id, e.target.value as ProcurementStatus)}
                                            className="w-full p-1.5 border border-gray-600 bg-gray-700 text-white rounded-md text-sm font-semibold focus:ring-2 focus:ring-primary"
                                        >
                                            {Object.values(ProcurementStatus).map(status => (
                                                <option key={status} value={status} className="bg-white text-black">{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-2 px-4">
                                        <Button variant="ghost" onClick={() => setSelectedRequest(req)}>Details</Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={7} className="text-center py-10 text-text-secondary">
                                    No approved requests match the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Request Details">
                {selectedRequest && (
                    <div className="space-y-4 text-text-primary">
                        <p><strong>Submitted By:</strong> {selectedRequest.userName} ({selectedRequest.department})</p>
                        <p><strong>Status:</strong> <Badge status={selectedRequest.status} /></p>
                        <p><strong>Procurement:</strong> <Badge status={selectedRequest.procurementStatus || ProcurementStatus.PENDING} /></p>
                        <p><strong>Total:</strong> <span className="font-bold text-primary">{formatCurrency(selectedRequest.total)}</span></p>
                        <h4 className="font-bold mt-4 pt-4 border-t border-border-color">Items:</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                           <table className="min-w-full text-sm">
                               <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="py-2 px-3 text-left">Item Name</th>
                                        <th className="py-2 px-3 text-center">Qty</th>
                                        <th className="py-2 px-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color">
                                    {(Array.isArray(selectedRequest.items) ? selectedRequest.items : JSON.parse(selectedRequest.items as any)).map((item: BudgetItem) => (
                                        <tr key={item.productId}>
                                            <td className="py-2 px-3">{item.productName}</td>
                                            <td className="py-2 px-3 text-center">{item.qty}</td>
                                            <td className="py-2 px-3 text-right">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

export default AdminProcurementPage;