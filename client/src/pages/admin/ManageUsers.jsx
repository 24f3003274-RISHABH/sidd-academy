import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, toggleUserStatus } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import { FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role);
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error('Error updating role');
    }
  };

  const handleStatusToggle = async (id) => {
    try {
      await toggleUserStatus(id);
      toast.success('Status updated');
      fetchUsers();
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Users</h1>
      </div>

      <div className="card-glass" style={{ padding: '1.5rem' }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Name</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Email</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Role</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Joined</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0' }}>{user.name}</td>
                  <td style={{ padding: '1rem 0' }}>{user.email}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <select 
                      className="form-select" 
                      style={{ padding: '0.2rem 0.5rem', width: 'auto', backgroundColor: 'transparent' }} 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    >
                      <option value="user" style={{ color: 'black' }}>User</option>
                      <option value="admin" style={{ color: 'black' }}>Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem 0' }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span className={`badge ${user.isActive !== false ? 'badge-success' : 'badge-paid'}`}>
                      {user.isActive !== false ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <button onClick={() => handleStatusToggle(user._id)} className={`btn btn-sm ${user.isActive !== false ? 'btn-danger' : 'btn-primary'}`}>
                      {user.isActive !== false ? 'Ban' : 'Unban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
