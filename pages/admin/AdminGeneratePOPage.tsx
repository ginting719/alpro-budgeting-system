import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLoading } from '../../hooks/useLoading';
import { generatePurchaseOrders, getPurchaseOrders, createPoPdf } from '../../services/api';
import { PurchaseOrder, BudgetItem } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const AdminGeneratePOPage: React.FC = () => {
    usePageTitle('Generate Purchase Order');
    const { setIsLoading } = useLoading();
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [error, setError] = useState('');
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
    const [isConfirmGenerateOpen, setIsConfirmGenerateOpen] = useState(false);


    const fetchPOs = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getPurchaseOrders();
            setPurchaseOrders(data.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime()));
        } catch (err) {
            setError('Failed to fetch purchase orders.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPOs();
    }, []);
    
    const aggregatedItems = useMemo(() => {
        if (!selectedPO?.items) return [];

        // Ensure items are parsed if they are a JSON string
        const itemsArray: BudgetItem[] = Array.isArray(selectedPO.items) 
            ? selectedPO.items 
            : JSON.parse(selectedPO.items as any);

        const itemMap = new Map<string, BudgetItem>();

        itemsArray.forEach((item) => {
            if (itemMap.has(item.productId)) {
                const existingItem = itemMap.get(item.productId)!;
                // Aggregate quantity and total
                existingItem.qty += item.qty;
                existingItem.total += item.total;
            } else {
                // Add a copy of the item to the map to avoid mutating state
                itemMap.set(item.productId, { ...item });
            }
        });

        return Array.from(itemMap.values());
    }, [selectedPO]);


    const handleGeneratePOs = async () => {
        setIsConfirmGenerateOpen(false); // Close modal before processing
        setIsLoading(true);
        setError('');
        try {
            const newPOs = await generatePurchaseOrders();
            if (newPOs && newPOs.length > 0) {
                alert(`${newPOs.length} new Purchase Order(s) have been generated successfully.`);
                await fetchPOs(); // Refresh the list
            } else {
                alert('No new Purchase Orders were generated. Ensure items are set to "In Progress" with assigned company and address.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate Purchase Orders: ${errorMessage}`);
            alert(`Failed to generate Purchase Orders: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPdf = async (poId: string) => {
        setGeneratingPdfId(poId); // Set loading state for this specific button
        try {
            const base64Pdf = await createPoPdf(poId);
    
            if (!base64Pdf || typeof base64Pdf !== 'string' || base64Pdf.trim() === '') {
                throw new Error("API did not return a valid PDF string. Received an empty or invalid response.");
            }
    
            let processedBase64 = base64Pdf.trim();
    
            // Handle potential data URI prefixes if they exist
            const base64Marker = ';base64,';
            const base64Index = processedBase64.indexOf(base64Marker);
            if (base64Index > -1) {
                processedBase64 = processedBase64.substring(base64Index + base64Marker.length);
            }
    
            // atob can throw a DOMException if the string is not correctly encoded.
            const byteCharacters = atob(processedBase64);
            
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
            
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
            URL.revokeObjectURL(pdfUrl); // Clean up the object URL
    
        } catch (err) {
            let userMessage = 'An unexpected error occurred while generating the PDF. Please try again.';
    
            // The error from atob() is a DOMException with the name 'InvalidCharacterError'
            if (err instanceof DOMException && err.name === 'InvalidCharacterError') {
                userMessage = 'Failed to generate PDF because the server returned corrupt or invalid data. This can happen if there was an error creating the document on the server. Please contact an administrator.';
                console.error("Base64 decoding failed. The received data is not a valid Base64 string.", err);
            } else if (err instanceof Error) {
                userMessage = `Failed to generate PDF: ${err.message}`;
                console.error("PDF Generation Error:", err);
            } else {
                console.error("An unknown error occurred during PDF generation:", err);
            }
            
            alert(userMessage);
        } finally {
            setGeneratingPdfId(null); // Reset loading state
        }
    };


    return (
        <Card title="Purchase Order Management">
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsConfirmGenerateOpen(true)}>
                    Generate New POs
                </Button>
            </div>
            
            {error && <p className="text-center text-danger mb-4">{error}</p>}
            
            <div className="overflow-x-auto">
                <table className="min-w-full bg-surface">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">PO ID</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Date Issued</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Vendor</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Total Amount</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {purchaseOrders.length > 0 ? (
                            purchaseOrders.map((po, index) => (
                                <tr key={po.poId} className={`${index % 2 === 0 ? 'bg-surface' : 'bg-background'} hover:bg-gray-100 transition-colors`}>
                                    <td className="py-4 px-6 text-sm font-mono text-text-secondary">{po.poId}</td>
                                    <td className="py-4 px-6 text-sm text-text-secondary">{new Date(po.dateIssued).toLocaleDateString()}</td>
                                    <td className="py-4 px-6 text-sm font-medium text-text-primary">{po.vendorName}</td>
                                    <td className="py-4 px-6 text-sm font-semibold text-text-primary">{formatCurrency(po.totalAmount)}</td>
                                    <td className="py-4 px-6 space-x-2 whitespace-nowrap">
                                        <Button variant="ghost" onClick={() => setSelectedPO(po)}>View Details</Button>
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => handleDownloadPdf(po.poId)}
                                            disabled={generatingPdfId === po.poId}
                                        >
                                            {generatingPdfId === po.poId ? 'Generating...' : 'Generate PDF'}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-text-secondary">
                                    No Purchase Orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={!!selectedPO} onClose={() => setSelectedPO(null)} title={`Details for PO #${selectedPO?.poId}`}>
                {selectedPO && (
                    <div className="space-y-4 text-text-primary">
                        <p><strong>Vendor:</strong> {selectedPO.vendorName}</p>
                        <p><strong>Total Amount:</strong> <span className="font-bold text-primary">{formatCurrency(selectedPO.totalAmount)}</span></p>
                        {/* FIX: Safely parse relatedBudgetIds if it's a string */}
                        <p><strong>Related Budget IDs:</strong> {(Array.isArray(selectedPO.relatedBudgetIds) ? selectedPO.relatedBudgetIds : JSON.parse(selectedPO.relatedBudgetIds as any)).join(', ')}</p>
                        <p><strong>Company Profile ID:</strong> {selectedPO.companyProfileId}</p>
                        <p><strong>Delivery Address:</strong> {selectedPO.deliveryAddress}</p>
                        <h4 className="font-bold mt-4 pt-4 border-t border-border-color text-text-primary">Items:</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                           <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="py-2 px-3 text-left font-semibold text-text-secondary">Item Name</th>
                                        <th className="py-2 px-3 text-center font-semibold text-text-secondary">Qty</th>
                                        <th className="py-2 px-3 text-right font-semibold text-text-secondary">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color">
                                    {aggregatedItems.map((item: BudgetItem) => (
                                        <tr key={item.productId}>
                                            <td className="py-2 px-3 whitespace-normal text-text-primary font-medium">{item.productName}</td>
                                            <td className="py-2 px-3 text-center text-text-secondary">{item.qty}</td>
                                            <td className="py-2 px-3 text-right text-text-primary font-semibold">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>
            
            <Modal isOpen={isConfirmGenerateOpen} onClose={() => setIsConfirmGenerateOpen(false)} title="Confirm PO Generation">
                <div>
                    <p className="mb-6 text-text-primary text-center">
                        Are you sure you want to generate new POs? <br /> This will process all items currently marked as 'In Progress'.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsConfirmGenerateOpen(false)}>No, Cancel</Button>
                        <Button variant="primary" onClick={handleGeneratePOs}>Yes, Generate POs</Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

export default AdminGeneratePOPage;