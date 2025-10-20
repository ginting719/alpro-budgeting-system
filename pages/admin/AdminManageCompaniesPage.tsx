import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLoading } from '../../hooks/useLoading';
import { getCompanyProfiles, addCompanyProfile, updateCompanyProfile, deleteCompanyProfile } from '../../services/api';
import { CompanyProfile } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const AdminManageCompaniesPage: React.FC = () => {
    usePageTitle('Manage Company Profiles');
    const { setIsLoading } = useLoading();
    const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Partial<CompanyProfile> | null>(null);

    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            const data = await getCompanyProfiles();
            setProfiles(data);
        } catch (error) {
            console.error("Failed to fetch company profiles", error);
            alert("Could not fetch company profiles. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const openModal = (profile: CompanyProfile | null = null) => {
        setEditingProfile(profile || { companyName: '', companyAddress: '', npwp: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProfile(null);
    };

    const handleSave = async () => {
        if (!editingProfile || !editingProfile.companyName || !editingProfile.companyAddress || !editingProfile.npwp) {
            alert("All fields are required.");
            return;
        }

        setIsLoading(true);
        closeModal();
        try {
            if ('profileId' in editingProfile && editingProfile.profileId) {
                await updateCompanyProfile(editingProfile as CompanyProfile);
            } else {
                await addCompanyProfile(editingProfile as Omit<CompanyProfile, 'profileId'>);
            }
            await fetchProfiles();
        } catch (error) {
            console.error("Failed to save company profile", error);
            alert(`Could not save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (profileId: string) => {
        if (window.confirm("Are you sure you want to delete this company profile?")) {
            setIsLoading(true);
            try {
                await deleteCompanyProfile(profileId);
                setProfiles(prev => prev.filter(p => p.profileId !== profileId));
            } catch (error) {
                console.error("Failed to delete company profile", error);
                alert("Could not delete profile. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingProfile) return;
        const { name, value } = e.target;
        setEditingProfile({ ...editingProfile, [name]: value });
    };

    return (
        <Card title="Company Profile Management">
            <div className="flex justify-end mb-4">
                <Button onClick={() => openModal()}>Add New Company</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-surface">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Profile ID</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Company Name</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Address</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">NPWP</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {profiles.map(p => (
                            <tr key={p.profileId} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-sm font-mono text-gray-500">{p.profileId}</td>
                                <td className="py-4 px-6 text-sm font-medium text-text-primary">{p.companyName}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{p.companyAddress}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{p.npwp}</td>
                                <td className="py-4 px-6 space-x-2 whitespace-nowrap">
                                    <Button variant="ghost" onClick={() => openModal(p)}>Edit</Button>
                                    <Button variant="danger" onClick={() => handleDelete(p.profileId)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProfile && 'profileId' in editingProfile ? 'Edit Company Profile' : 'Add Company Profile'}>
                {editingProfile && (
                    <div className="space-y-4">
                        <input name="companyName" value={editingProfile.companyName || ''} onChange={handleChange} placeholder="Company Name" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="companyAddress" value={editingProfile.companyAddress || ''} onChange={handleChange} placeholder="Company Address" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="npwp" value={editingProfile.npwp || ''} onChange={handleChange} placeholder="NPWP Number" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
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

export default AdminManageCompaniesPage;