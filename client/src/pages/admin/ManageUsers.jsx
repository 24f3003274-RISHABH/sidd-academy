import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, updateUserRole, toggleUserStatus } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import { FiUsers, FiSearch, FiShield, FiCheckCircle, FiSlash, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllUsers({
        page,
        limit: 10,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });

      const data = res.data?.data || res.data || {};
      const userList = Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []);
      setUsers(userList);
      setPagination({
        total: data.total ?? data.pagination?.total ?? userList.length,
        totalPages: data.totalPages ?? data.pagination?.totalPages ?? 1,
        limit: 10,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleRoleChange = async (id, role) => {
    setUpdatingId(id);
    try {
      await updateUserRole(id, role);
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (user) => {
    const id = user.id || user._id;
    const isCurrentlyActive = user.isActive !== false && user.is_active !== false;
    const action = isCurrentlyActive ? 'suspend' : 'activate';
    
    if (window.confirm(`Are you sure you want to ${action} user "${user.name}"?`)) {
      setUpdatingId(id);
      try {
        await toggleUserStatus(id);
        toast.success(`User ${isCurrentlyActive ? 'suspended' : 'activated'} successfully`);
        fetchUsers();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error updating status');
      } finally {
        setUpdatingId(null);
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            View and manage student accounts, permissions, and status.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', maxWidth: '400px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Role:</label>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '130px' }}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {loading && <Loader />}
        
        {!loading && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <FiUsers size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                      <p>No registered users found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  users.map(user => {
                    const id = user.id || user._id;
                    const isActive = user.isActive !== false && user.is_active !== false;
                    const role = (user.role || 'student').toLowerCase();
                    const isBusy = updatingId === id;

                    return (
                      <tr key={id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user.email}</div>
                          {user.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+91 {user.phone}</div>}
                        </td>
                        <td>
                          <select 
                            className="form-input" 
                            style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.8125rem', fontWeight: 600 }} 
                            value={role}
                            disabled={isBusy}
                            onChange={(e) => handleRoleChange(id, e.target.value)}
                          >
                            <option value="student">Student</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {formatDate(user.createdAt || user.created_at)}
                        </td>
                        <td>
                          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                            {isActive ? <FiCheckCircle /> : <FiSlash />}
                            {isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleStatusToggle(user)}
                            disabled={isBusy}
                            className={`btn btn-sm ${isActive ? 'btn-outline' : 'btn-primary'}`}
                            style={{ fontSize: '0.8125rem' }}
                          >
                            {isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {page} of {pagination.totalPages} ({pagination.total} total users)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <FiChevronLeft /> Prev
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage(p => p + 1)}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
