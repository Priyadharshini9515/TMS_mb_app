import React, { useEffect, useState, useContext } from 'react';
import { complaintService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css';

const ComplaintsDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignTarget, setAssignTarget] = useState({ complaintId: null, assignee: '' });
  const [statusTarget, setStatusTarget] = useState({ complaintId: null, status: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setListLoading(true);
        const res = await complaintService.getAll();
        setComplaints(res.data || []);
        // fetch stats too
        try {
          const s = await complaintService.getStats();
          setStats(s.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
        } catch (e) { }
      } catch (err) {
        setError('Failed to load complaints');
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      userService.getAll().then((res) => setUsers(res.data || [])).catch(() => { });
    }
  }, [user]);

  const refresh = async () => {
    try {
      const res = await complaintService.getAll();
      setComplaints(res.data || []);
      try {
        const s = await complaintService.getStats();
        setStats(s.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
      } catch (e) { }
    } catch (e) { }
  };

  const handleAssignClick = (id) => setAssignTarget({ complaintId: id, assignee: '' });
  const handleAssignSubmit = async () => {
    if (!assignTarget.assignee) return setError('Select an assignee');
    try {
      await complaintService.assign(assignTarget.complaintId, assignTarget.assignee);
      setAssignTarget({ complaintId: null, assignee: '' });
      refresh();
    } catch (err) { setError('Failed to assign'); }
  };

  const handleStatusClick = (id) => setStatusTarget({ complaintId: id, status: '' });
  const handleStatusSubmit = async () => {
    if (!statusTarget.status) return setError('Select a status');
    try {
      await complaintService.updateStatus(statusTarget.complaintId, statusTarget.status);
      setStatusTarget({ complaintId: null, status: '' });
      refresh();
    } catch (err) { setError('Failed to update status'); }
  };

  const handleClose = async (id) => {
    try {
      await complaintService.updateStatus(id, 'Closed');
      refresh();
    } catch (err) { setError('Failed to close'); }
  };

  return (
    <div className="master-screen">
      <div className="screen-header"><h1>Complaints Dashboard</h1></div>
      {error && <div className="error-message">{error}</div>}

      <div style={{ marginTop: 12 }}>
        <div className="dashboard-stats">
          <div className="stat-card total">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Complaints</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card assigned">
            <div className="stat-value">{stats.assigned}</div>
            <div className="stat-label">Active Assigned</div>
          </div>
          <div className="stat-card closed">
            <div className="stat-value">{stats.closed}</div>
            <div className="stat-label">Successfully Closed</div>
          </div>
        </div>
        {listLoading ? <p>Loading...</p> : (
          <div className="table-container">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Assigned To</th>
                  <th>Attachment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const isAssignee = c.assignedTo && String(c.assignedTo._id || c.assignedTo) === String(user?.id || user?._id);
                  const canManage = user?.role === 'SuperAdmin' || isAssignee;
                  return (
                    <tr key={c._id}>
                      <td>{new Date(c.createdAt).toLocaleString()}</td>
                      <td>{c.blockName}</td>
                      <td>{c.roomNumber}</td>
                      <td>{c.complaintType}</td>
                      <td>{c.remarks || '-'}</td>
                      <td>
                        <span className={`status-badge status-${(c.status || '').toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{c.createdBy?.username || c.createdBy?.email || '-'}</td>
                      <td>{c.assignedTo?.username ? `${c.assignedTo.username} (${c.assignedTo.role || 'Staff'})` : <span style={{ color: '#e74c3c' }}>Unassigned</span>}</td>
                      <td>{c.attachment ? (<a href={`http://localhost:5000${c.attachment}`} target="_blank" rel="noreferrer">View</a>) : '-'}</td>
                      <td>
                        <div className="actions-cell" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {/* Quick 1-click status buttons */}
                          {canManage && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {c.status !== 'In-Progress' && (
                                <button
                                  onClick={async () => { await complaintService.updateStatus(c._id, 'In-Progress'); refresh(); }}
                                  style={{ padding: '4px 8px', fontSize: 11, background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: 4, cursor: 'pointer' }}
                                >
                                  ⚙️ In-Progress
                                </button>
                              )}
                              {c.status !== 'Onhold' && (
                                <button
                                  onClick={async () => { await complaintService.updateStatus(c._id, 'Onhold'); refresh(); }}
                                  style={{ padding: '4px 8px', fontSize: 11, background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', borderRadius: 4, cursor: 'pointer' }}
                                >
                                  ⏸️ On Hold
                                </button>
                              )}
                              {c.status !== 'Closed' && (
                                <button
                                  onClick={async () => { await complaintService.updateStatus(c._id, 'Closed'); refresh(); }}
                                  style={{ padding: '4px 8px', fontSize: 11, background: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 4, cursor: 'pointer' }}
                                >
                                  ✅ Close
                                </button>
                              )}
                            </div>
                          )}

                          {/* SuperAdmin Assign control */}
                          {user?.role === 'SuperAdmin' && (
                            assignTarget.complaintId === c._id ? (
                              <div className="actions-cell">
                                <select value={assignTarget.assignee} onChange={(e) => setAssignTarget({ ...assignTarget, assignee: e.target.value })} style={{ minWidth: 140 }}>
                                  <option value="">Select staff</option>
                                  {users.filter(u => u.role !== 'SuperAdmin' && u.role !== 'User').map(u => (
                                    <option key={u._id} value={u._id}>{u.username} ({u.role})</option>
                                  ))}
                                </select>
                                <button onClick={handleAssignSubmit} className="btn-primary btn-sm">Assign</button>
                                <button onClick={() => setAssignTarget({ complaintId: null, assignee: '' })} className="btn-secondary btn-sm">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => handleAssignClick(c._id)} className="btn-primary btn-sm" style={{ width: '100%' }}>👤 Assign Staff</button>
                            )
                          )}

                          {/* Detailed Status Selector */}
                          {canManage && (
                            statusTarget.complaintId === c._id ? (
                              <div className="actions-cell">
                                <select className="status-select" value={statusTarget.status} onChange={(e) => setStatusTarget({ ...statusTarget, status: e.target.value })}>
                                  <option value="">Select status</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Assigned">Assigned</option>
                                  <option value="In-Progress">In-Progress</option>
                                  <option value="Onhold">Onhold</option>
                                  <option value="Closed">Closed</option>
                                </select>
                                <button onClick={handleStatusSubmit} className="btn-primary btn-sm">Save</button>
                                <button onClick={() => setStatusTarget({ complaintId: null, status: '' })} className="btn-secondary btn-sm">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => handleStatusClick(c._id)} className="btn-secondary btn-sm" style={{ width: '100%' }}>🔄 Status Dropdown</button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsDashboardPage;
