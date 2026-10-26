import React, { useEffect, useState, useContext, useCallback } from 'react';
import { complaintService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css';

const StatCard = ({ label, value, color, onClick }) => (
  <div
    className="stat-card"
    style={{ borderTop: `4px solid ${color}`, cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
  >
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const UserComplaintDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [myStats, setMyStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusTarget, setStatusTarget] = useState({ complaintId: null, status: '' });
  const [selectedStatus, setSelectedStatus] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await complaintService.getAll();
      const allComplaints = res.data || [];
      
      // Filter complaints for current user: either created by them or assigned to them
      const userId = user?.id || user?._id;
      const userComplaints = allComplaints.filter((c) => {
        const createdById = c.createdBy?._id || c.createdBy;
        const assignedToId = c.assignedTo?._id || c.assignedTo;
        return (
          String(createdById) === String(userId) ||
          String(assignedToId) === String(userId)
        );
      });
      setComplaints(userComplaints);

      // Calculate stats
      const stats = {
        total: userComplaints.length,
        pending: userComplaints.filter(c => c.status === 'Pending').length,
        assigned: userComplaints.filter(c => c.status === 'Assigned').length,
        inProgress: userComplaints.filter(c => c.status === 'In-Progress').length,
        onhold: userComplaints.filter(c => c.status === 'Onhold').length,
        closed: userComplaints.filter(c => c.status === 'Closed').length,
      };
      setMyStats(stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredComplaints = filterStatus === 'All' 
    ? complaints 
    : complaints.filter(c => c.status === filterStatus);

  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedStatus(complaint.status || '');
  };

  if (loading) return <div className="master-screen"><p>Loading...</p></div>;

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>My Complaints</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Complaint Status Dashboard */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: '#3b5998', marginBottom: '1.5rem', fontSize: '24px', fontWeight: '600' }}>Complaint Status Overview</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <StatCard
            label="Total Complaints"
            value={myStats.total}
            color="#3498db"
            onClick={() => setFilterStatus('All')}
          />
          <StatCard
            label="Pending Review"
            value={myStats.pending}
            color="#f39c12"
            onClick={() => setFilterStatus('Pending')}
          />
          <StatCard
            label="In Progress"
            value={myStats.inProgress || myStats.assigned}
            color="#9b59b6"
            onClick={() => setFilterStatus('In-Progress')}
          />
          <StatCard
            label="Closed"
            value={myStats.closed}
            color="#27ae60"
            onClick={() => setFilterStatus('Closed')}
          />
        </div>
      </div>

      {/* Complaints List */}
      <div className="table-container">
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#3b5998', fontSize: '18px', fontWeight: '600' }}>
            {filterStatus === 'All' ? 'All Complaints' : `${filterStatus} Complaints`}
          </h3>
          <button 
            onClick={() => setFilterStatus('All')} 
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b5998',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Reset Filter
          </button>
        </div>

        <table className="master-table">
          <thead>
            <tr>
              <th>Block</th>
              <th>Room</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Date Created</th>
              <th>Remarks</th>
              <th>Attachment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint) => (
                <tr key={complaint._id}>
                  <td>{complaint.blockName || '-'}</td>
                  <td>{complaint.roomNumber || '-'}</td>
                  <td>{complaint.complaintType || '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: 
                        complaint.status === 'Closed' ? '#d4edda' :
                        complaint.status === 'Pending' ? '#fff3cd' :
                        complaint.status === 'Assigned' ? '#f8d7da' :
                        complaint.status === 'In-Progress' ? '#e0e7ff' :
                        complaint.status === 'Onhold' ? '#f3e8ff' :
                        '#e2e3e5',
                      color:
                        complaint.status === 'Closed' ? '#155724' :
                        complaint.status === 'Pending' ? '#856404' :
                        complaint.status === 'Assigned' ? '#721c24' :
                        complaint.status === 'In-Progress' ? '#4338ca' :
                        complaint.status === 'Onhold' ? '#7e22ce' :
                        '#383d41'
                    }}>
                      {complaint.status}
                    </span>
                  </td>
                  <td>{complaint.assignedTo?.username ? `${complaint.assignedTo.username} (${complaint.assignedTo.role || 'Staff'})` : <span style={{ color: '#999' }}>Awaiting Assignment</span>}</td>
                  <td>{new Date(complaint.createdAt).toLocaleDateString()} {new Date(complaint.createdAt).toLocaleTimeString()}</td>
                  <td>{complaint.remarks || '-'}</td>
                  <td>{complaint.attachment ? (<a href={`http://localhost:5000/${complaint.attachment.replace(/^\//, '')}`} target="_blank" rel="noreferrer">View</a>) : '-'}</td>
                  <td>
                    {/* Update status control for assigned staff (not SuperAdmin) */}
                    {String(complaint.assignedTo?._id || complaint.assignedTo) === String(user?._id || user?.id) && user?.role !== 'SuperAdmin' ? (
                      <div>
                        {statusTarget.complaintId === complaint._id ? (
                          <div className={`status-action open`}>
                            <select
                              className="status-select"
                              value={statusTarget.status}
                              onChange={(e) => setStatusTarget({ ...statusTarget, status: e.target.value })}
                              aria-label="Select status"
                            >
                              <option value="">Select status</option>
                              <option value="In-Progress">In-Progress</option>
                              <option value="Onhold">Onhold</option>
                              <option value="Closed">Closed</option>
                            </select>

                            <div className="status-buttons show" style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                              <button
                                onClick={async (e) => {
                                  try {
                                    if (!statusTarget.status) return setError('Select a status');
                                    await complaintService.updateStatus(statusTarget.complaintId, statusTarget.status);
                                    await loadData();
                                    setStatusTarget({ complaintId: null, status: '' });
                                    setError('');
                                  } catch (err) {
                                    setError(err.response?.data?.message || 'Failed to update status');
                                  }
                                }}
                                className="btn-primary"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setStatusTarget({ complaintId: null, status: '' })}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setStatusTarget({ complaintId: complaint._id, status: '' })}
                            className="btn-primary"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    ) : (
                      '-' 
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No {filterStatus === 'All' ? 'complaints' : `${filterStatus.toLowerCase()} complaints`} found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .user-detail-card {
          background-color: white;
          border-radius: 16px;
          padding: 2.5rem;
          margin-bottom: 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(59, 89, 152, 0.1);
        }

        @media (max-width: 768px) {
          .user-detail-card {
            padding: 1.25rem;
            margin-bottom: 1.5rem;
            border-radius: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserComplaintDashboardPage;
