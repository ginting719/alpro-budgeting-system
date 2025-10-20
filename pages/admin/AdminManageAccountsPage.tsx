import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLoading } from '../../hooks/useLoading';
import { getUsers, addUser, updateUser, deleteUser } from '../../services/api';
import { User, Role } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const AdminManageAccountsPage: React.FC = () => {
    usePageTitle('Manage Accounts');
    const { setIsLoading } = useLoading();
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | Partial<User> | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openModal = (user: User | null = null) => {
        setEditingUser(user || { name: '', email: '', role: 'USER', department: '', password: '', managerId: '', bodId: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSave = async () => {
        if (!editingUser) return;
        
        if (!editingUser.name || !editingUser.email || !editingUser.role) {
            alert("Name, email, and role are required.");
            return;
        }
        
        setIsLoading(true);
        closeModal();
        try {
            if ('id' in editingUser && editingUser.id) {
                await updateUser(editingUser as User);
            } else {
                await addUser(editingUser as Omit<User, 'id'>);
            }
            await fetchUsers();
        } catch(error) {
             console.error("Failed to save user", error);
             alert("Failed to save user. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (userId: string) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setIsLoading(true);
            try {
                await deleteUser(userId);
                // Update UI instantly by removing the deleted user from the state
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            } catch(error) {
                console.error("Failed to delete user", error);
                alert("Failed to delete user. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!editingUser) return;
        const { name, value } = e.target;
        setEditingUser({ ...editingUser, [name]: value });
    };
    
    return (
        <Card title="User Account Management">
            <div className="flex justify-end mb-4">
                <Button onClick={() => openModal()}>Add New User</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-surface">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Name</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Email</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Role</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Department</th>
                            <th className="py-3 px-6 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-sm font-medium text-text-primary">{u.name}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{u.email}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{u.role}</td>
                                <td className="py-4 px-6 text-sm text-text-secondary">{u.department}</td>
                                <td className="py-4 px-6 space-x-2">
                                    <Button variant="ghost" onClick={() => openModal(u)}>Edit</Button>
                                    <Button variant="danger" onClick={() => handleDelete(u.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser && 'id' in editingUser && editingUser.id ? 'Edit User' : 'Add User'}>
                {editingUser && (
                    <div className="space-y-4">
                        <input name="name" value={editingUser.name} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="email" type="email" value={editingUser.email} onChange={handleChange} placeholder="Email Address" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <input name="password" type="password" value={editingUser.password || ''} onChange={handleChange} placeholder="Password (leave blank if unchanged)" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />
                        <select name="role" value={editingUser.role} onChange={handleChange} className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-primary">
                            {(['USER', 'MANAGER', 'BOD', 'ADMIN'] as Role[]).map(r => <option key={r} value={r} className="text-black bg-white">{r}</option>)}
                        </select>
                        <input name="department" value={editingUser.department} onChange={handleChange} placeholder="Department" className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" />

                        {editingUser.role === 'USER' && (
                          <>
                            <input 
                                type="text"
                                name="managerId" 
                                value={editingUser.managerId || ''} 
                                onChange={handleChange} 
                                placeholder="Enter Manager ID" 
                                className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" 
                            />
                             <input 
                                type="text"
                                name="bodId" 
                                value={editingUser.bodId || ''} 
                                onChange={handleChange} 
                                placeholder="Enter BOD ID" 
                                className="w-full p-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded focus:ring-2 focus:ring-primary" 
                            />
                          </>
                        )}

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

export default AdminManageAccountsPage;