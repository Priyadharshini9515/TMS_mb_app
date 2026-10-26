import React, { useContext, useEffect, useState } from 'react';
import { complaintService, departmentService, programmeService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css';

const ReportsPage = () => {
  const { user } = useContext(AuthContext);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ department: '', programme: '', complaintType: '', status: '', assignee: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'SuperAdmin') return;
    departmentService.getAll().then(r => setDepartments(r.data || [])).catch(() => {});
    programmeService.getAll().then(r => setProgrammes(r.data || [])).catch(() => {});
    userService.getAll().then(r => setUsers(r.data || [])).catch(() => {});
    
    // Load initial report
    complaintService.report({}).then(res => setResults(res.data || [])).catch(() => {});
  }, [user]);

  const fetchReport = async () => {
    setError('');
    setLoading(true);
    try {
      const params = { ...filters };
      // remove empty
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await complaintService.report(params);
      setResults(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Date','Block','Room','Type','Remarks','Status','CreatedBy','Assignee'];
    const rows = results.map(r => [new Date(r.createdAt).toLocaleString(), r.blockName, r.roomNumber, r.complaintType, (r.remarks||'').replace(/\n/g,' '), r.status, r.createdBy?.username||r.createdBy?.email||'', r.assignedTo?.username||r.assignedTo?.email||'']);
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${(''+cell).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'complaints_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (user?.role !== 'SuperAdmin') {
    return <div className="master-screen"><div className="card"><h2>Reports</h2><div className="error-message">Only SuperAdmin can generate reports.</div></div></div>;
  }

  return (
    <div className="master-screen">
      <div className="screen-header"><h1>Complaint Details Report</h1></div>
      {error && <div className="error-message">{error}</div>}
      <div className="card">
        <div className="report-filters-bar">
          <select value={filters.department} onChange={e=>setFilters({...filters, department:e.target.value})}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select value={filters.programme} onChange={e=>setFilters({...filters, programme:e.target.value})}>
            <option value="">All Programmes</option>
            {programmes.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select value={filters.complaintType} onChange={e=>setFilters({...filters, complaintType:e.target.value})}>
            <option value="">All Complaint Types</option>
            <option value="PC Hardware">PC Hardware</option>
            <option value="PC Software">PC Software</option>
            <option value="Application Issues">Application Issues</option>
            <option value="Network">Network</option>
            <option value="Electronics">Electronics</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Other">Other</option>
          </select>
          <select value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Onhold">Onhold</option>
            <option value="Closed">Closed</option>
          </select>
          <select value={filters.assignee} onChange={e=>setFilters({...filters, assignee:e.target.value})}>
            <option value="">Any Assignee</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.username} ({u.role})</option>)}
          </select>
          <button onClick={fetchReport} className="btn-primary">Generate</button>
          <button onClick={exportCSV} className="btn-secondary">Export CSV</button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? <p>Loading...</p> : (
          <div className="table-container">
            <table className="master-table">
              <thead>
                <tr><th>Date</th><th>Dept</th><th>Programme</th><th>Block</th><th>Room</th><th>Type</th><th>Status</th><th>Created By</th><th>Assignee</th></tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{r.createdBy?.department?.name || '-'}</td>
                    <td>{r.createdBy?.programme?.name || r.createdBy?.programme || '-'}</td>
                    <td>{r.blockName}</td>
                    <td>{r.roomNumber}</td>
                    <td>{r.complaintType}</td>
                    <td>{r.status}</td>
                    <td>{r.createdBy?.username || r.createdBy?.email}</td>
                    <td>{r.assignedTo?.username || r.assignedTo?.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .report-filters-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .report-filters-bar select,
        .report-filters-bar input {
          flex: 1 1 180px;
          min-width: 140px;
        }

        @media (max-width: 768px) {
          .report-filters-bar {
            flex-direction: column;
            gap: 10px;
          }

          .report-filters-bar select,
          .report-filters-bar input,
          .report-filters-bar button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
