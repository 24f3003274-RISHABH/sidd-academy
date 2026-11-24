import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, updateUserRole, toggleUserStatus } from '../../api/adminApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { FiUsers, FiSearch, FiCheckCircle, FiSlash, FiChevronLeft, FiChevronRight, FiShield, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || currentUser?._id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await getAllUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });

      const data = res.data?.data || res.data || {};
      const userList = Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []);
      setUsers(userList);
      setPagination({
        total: data.total ?? data.pagination?.total ?? userList.length,
        totalPages: data.pages ?? data.totalPages ?? data.pagination?.totalPages ?? 1,
        limit: 15,
      });
    } catch (err) {
      setError(true);
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

  const executeRoleChange = async (userObj, newRole) => {
    const id = userObj.id || userObj._id;
    setUpdatingId(id);
    try {
      await updateUserRole(id, newRole);
      toast.success(`Updated ${userObj.name}'s role to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating role');
    } finally {
      setUpdatingId(null);
      setConfirmState(null);
    }
  };

  const handleRoleSelectChange = (userObj, nextRole) => {
    const currentRole = (userObj.role || 'student').toLowerCase();
    if (nextRole === currentRole) return;
    if ((userObj.id || userObj._id) === currentUserId) {
      toast.error('You cannot change your own admin role.');
      return;
    }

    if (nextRole === 'admin' || currentRole === 'admin') {
      setConfirmState({
        title: nextRole === 'admin' ? 'Grant Admin Access?' : 'Remove Admin Access?',
        message:
          nextRole === 'admin'
            ? `Are you sure you want to promote "${userObj.name}" (${userObj.email}) to Admin? They will gain full control over courses, notes, users, and orders.`
            : `Are you sure you want to change "${userObj.name}" from Admin to ${nextRole}?`,
        confirmText: nextRole === 'admin' ? 'Promote to Admin' : `Change to ${nextRole}`,
        confirmVariant: nextRole === 'admin' ? 'primary' : 'danger',
        onConfirm: () => executeRoleChange(userObj, nextRole),
      });
    } else {
      executeRoleChange(userObj, nextRole);
    }
  };

  const handleStatusToggleClick = (userObj) => {
    const id = userObj.id || userObj._id;
    if (id === currentUserId) {
      toast.error('You cannot suspend your own account.');
      return;
    }
    const isCurrentlyActive = userObj.isActive !== false && userObj.is_active !== false;
    setConfirmState({
      title: isCurrentlyActive ? 'Suspend User Account?' : 'Reactivate User Account?',
      message: isCurrentlyActive
        ? `Suspending "${userObj.name}" (${userObj.email}) will block them from logging in until reactivated.`
        : `Reactivate "${userObj.name}" (${userObj.email}) so they can log in and access their courses again?`,
      confirmText: isCurrentlyActive ? 'Suspend Account' : 'Reactivate Account',
      confirmVariant: isCurrentlyActive ? 'danger' : 'success',
      onConfirm: async () => {
        setUpdatingId(id);
        try {
          await toggleUserStatus(id);
          toast.success(`User ${isCurrentlyActive ? 'suspended' : 'reactivated'} successfully`);
          fetchUsers();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Error updating status');
        } finally {
          setUpdatingId(null);
          setConfirmState(null);
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
            View and manage student accounts, admin roles, and account access.
          </p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}>
          <FiUsers size={13} /> {pagination.total} Total User{pagination.total === 1 ? '' : 's'}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', maxWidth: '420px', position: 'relative' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Role:</label>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '135px' }}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {(search || roleFilter) && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {loading && <Loader />}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <FiAlertCircle size={32} style={{ color: '#dc2626', marginBottom: '0.5rem' }} />
            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>Could not load user accounts.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={fetchUsers}>
              <FiRefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && (
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
                      <p style={{ margin: 0 }}>No registered users found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((userObj) => {
                    const id = userObj.id || userObj._id;
                    const isSelf = id === currentUserId;
                    const isActive = userObj.isActive !== false && userObj.is_active !== false;
                    const role = (userObj.role || 'student').toLowerCase();
                    const isBusy = updatingId === id;

                    return (
                      <tr key={id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{userObj.name}</strong>
                            {isSelf && (
                              <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                                You
                              </span>
                            )}
                            {role === 'admin' && (
                              <span className="badge badge-secondary" style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                                <FiShield size={10} /> Admin
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userObj.email}</div>
                          {userObj.phone && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{userObj.phone}</div>}
                        </td>
                        <td>
                          <select
                            className="form-select"
                            style={{ padding: '0.3rem 0.6rem', width: 'auto', fontSize: '0.8125rem', fontWeight: 600 }}
                            value={role}
                            disabled={isBusy || isSelf}
                            title={isSelf ? 'You cannot change your own role' : 'Change user role'}
                            onChange={(e) => handleRoleSelectChange(userObj, e.target.value)}
                          >
                            <option value="student">Student</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {formatDate(userObj.createdAt || userObj.created_at)}
                        </td>
                        <td>
                          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                            {isActive ? <FiCheckCircle size={12} /> : <FiSlash size={12} />}
                            {isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleStatusToggleClick(userObj)}
                            disabled={isBusy || isSelf}
                            title={isSelf ? 'You cannot suspend your own account' : undefined}
                            className={`btn btn-sm ${isActive ? 'btn-outline' : 'btn-primary'}`}
                            style={{ fontSize: '0.8rem' }}
                          >
                            {isBusy ? 'Updating...' : isActive ? 'Suspend' : 'Reactivate'}
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {page} of {pagination.totalPages} ({pagination.total} total users)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FiChevronLeft /> Prev
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmText={confirmState?.confirmText}
        confirmVariant={confirmState?.confirmVariant || 'danger'}
        loading={Boolean(updatingId)}
        onConfirm={confirmState?.onConfirm}
        onCancel={() => !updatingId && setConfirmState(null)}
      />
    </div>
  );
};

export default ManageUsers;
