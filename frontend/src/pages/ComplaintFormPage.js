import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { complaintService, blockService, roomService, departmentService } from '../services/api';
import './MasterScreen.css';

const complaintTypes = [
  'PC Hardware',
  'PC Software',
  'Application Issues',
  'Network',
  'Electronics',
  'Plumbing',
  'Other',
];

const ComplaintFormPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [blockId, setBlockId] = useState('');
  const [customBlockName, setCustomBlockName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [allBlocksCache, setAllBlocksCache] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch departments and all blocks on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [deptResp, blockResp] = await Promise.all([
          departmentService.getAll(),
          blockService.getAll(),
        ]);
        const dData = deptResp.data;
        const dList = Array.isArray(dData) ? dData : (dData?.data || []);
        setDepartments(dList);

        const bData = blockResp.data;
        const bList = Array.isArray(bData) ? bData : (bData?.data || []);
        setAllBlocksCache(bList);
        setBlocks(bList);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      } finally {
        setLoadingData(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch blocks when department is selected
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!departmentId) {
        setBlocks(allBlocksCache);
        return;
      }
      setLoadingData(true);
      try {
        const resp = await blockService.getAll({ departmentId });
        const data = resp.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          setBlocks(list);
        } else {
          setBlocks(allBlocksCache);
        }
      } catch (err) {
        console.error('Failed to fetch blocks:', err);
        setBlocks(allBlocksCache);
      } finally {
        setLoadingData(false);
      }
    };
    fetchBlocks();
    setBlockId('');
    setCustomBlockName('');
    setRoomId('');
    setFilteredRooms([]);
  }, [departmentId, allBlocksCache]);

  // Fetch rooms when block is selected
  useEffect(() => {
    const fetchRooms = async () => {
      if (!blockId || blockId === '__manual__') {
        setFilteredRooms([]);
        setRoomId('__manual__');
        return;
      }
      setLoadingData(true);
      try {
        const resp = await roomService.getAll({ blockId });
        const data = resp.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setFilteredRooms(list);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load rooms');
      } finally {
        setLoadingData(false);
      }
    };
    fetchRooms();
    setRoomId('');
  }, [blockId]);
  const [type, setType] = useState(complaintTypes[0]);
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only allow SuperAdmin and regular Users to create complaints
  if (user && !['SuperAdmin', 'User'].includes(user.role)) {
    return (
      <div className="master-screen">
        <div className="card">
          <h2>Raise Complaint</h2>
          <div className="error-message">You do not have permission to raise complaints.</div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedDepartment = departments.find((d) => d._id === departmentId);
      const selectedBlock = blocks.find((b) => b._id === blockId);
      const selectedRoom = filteredRooms.find((r) => r._id === roomId);

      const finalBlockName = blockId === '__manual__' ? customBlockName.trim() : (selectedBlock?.name || customBlockName.trim());
      if (!finalBlockName) {
        setError('Please select or enter a block name');
        setLoading(false);
        return;
      }

      // validate room or custom room number
      const finalRoomNumber = roomId === '__manual__' ? customRoomNumber : (selectedRoom?.roomNumber || '');
      if (!finalRoomNumber) {
        setError('Please select a room or enter a room number');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('departmentName', selectedDepartment?.name || '');
      formData.append('blockName', finalBlockName);
      formData.append('roomNumber', finalRoomNumber);
      formData.append('complaintType', type);
      formData.append('remarks', remarks);
      if (attachment) formData.append('attachment', attachment);
      if (user?.id) formData.append('userId', user.id);

      await complaintService.create(formData);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-screen">
      <div className="master-form">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Raise Complaint</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required disabled={loadingData}>
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Block Name</label>
            <select value={blockId} onChange={(e) => setBlockId(e.target.value)} required disabled={loadingData}>
              <option value="">-- Select Block --</option>
              {blocks.map((block) => (
                <option key={block._id} value={block._id}>
                  {block.name}
                </option>
              ))}
              <option value="__manual__">Other (enter manually)</option>
            </select>
          </div>

          {(blockId === '__manual__' || (departmentId && blocks.length === 0)) && (
            <div className="form-group">
              <label>Enter Block Name</label>
              <input value={customBlockName} onChange={(e) => setCustomBlockName(e.target.value)} placeholder="e.g. Science Block, Mech Block" required />
            </div>
          )}

          <div className="form-group">
            <label>Room Number</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!blockId || loadingData}>
              <option value="">-- Select Room --</option>
              {filteredRooms.map((room) => {
                const blockName = room.block?.name || (blocks.find(b => String(b._id) === String(room.block))?.name) || '';
                const label = blockName ? `${blockName} - ${room.roomNumber}` : room.roomNumber;
                return (
                  <option key={room._id} value={room._id}>
                    {label}
                  </option>
                );
              })}
              <option value="__manual__">Other (enter manually)</option>
            </select>
          </div>

          {(roomId === '__manual__' || filteredRooms.length === 0) && (
            <div className="form-group">
              <label>Enter Room Number</label>
              <input value={customRoomNumber} onChange={(e) => setCustomRoomNumber(e.target.value)} placeholder="e.g. R-101" required />
            </div>
          )}

          <div className="form-group">
            <label>Complaint Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {complaintTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="4" />
          </div>

          <div className="form-group">
            <label>Attachment</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ padding: '10px 0' }} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintFormPage;
