const Complaint = require('../models/Complaint');
const User = require('../models/User');
const path = require('path');

exports.createComplaint = async (req, res) => {
  try {
    const { blockName, roomNumber, complaintType, remarks, userId } = req.body;

    if (!blockName || !roomNumber || !complaintType) {
      return res.status(400).json({ message: 'Missing required fields: Block name, Room number, and Complaint type are required' });
    }

    let creatorId = req.user?.id || userId;
    if (!creatorId) {
      const firstUser = await User.findOne();
      if (firstUser) {
        creatorId = firstUser._id;
      }
    }

    const complaint = new Complaint({
      blockName: String(blockName).trim(),
      roomNumber: String(roomNumber).trim(),
      complaintType: String(complaintType).trim(),
      remarks: remarks ? String(remarks).trim() : '',
      createdBy: creatorId,
    });

    if (req.file) {
      complaint.attachment = `/uploads/${req.file.filename}`;
    }

    await complaint.save();

    res.status(201).json({ message: 'Complaint created successfully', complaint });
  } catch (error) {
    console.error('Failed to create complaint:', error);
    res.status(500).json({ message: 'Failed to create complaint', error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    const isSuperAdmin = requester.role && requester.role.toLowerCase() === 'superadmin';

    // SuperAdmin: global stats
    if (isSuperAdmin) {
      const all = await Complaint.find();
      const total = all.length;
      const pending = all.filter((c) => c.status === 'Pending').length;
      const assigned = all.filter((c) => c.status === 'Assigned' || c.status === 'In-Progress' || c.status === 'Onhold').length;
      const inProgress = all.filter((c) => c.status === 'In-Progress').length;
      const onhold = all.filter((c) => c.status === 'Onhold').length;
      const closed = all.filter((c) => c.status === 'Closed').length;
      return res.json({ total, pending, assigned, inProgress, onhold, closed });
    }

    // For all other roles: stats for complaints created by or assigned to them
    const requesterId = requester.id || requester._id;
    let orConditions = [
      { createdBy: requesterId },
      { assignedTo: requesterId },
    ];

    if (requester.department) {
      const sameDeptStaff = await User.find({ department: requester.department }).select('_id');
      const staffIds = sameDeptStaff.map((u) => u._id);
      orConditions.push({ assignedTo: { $in: staffIds } });
    }

    const list = await Complaint.find({ $or: orConditions });
    const total = list.length;
    const pending = list.filter((c) => c.status === 'Pending').length;
    const assigned = list.filter((c) => c.status === 'Assigned' || c.status === 'In-Progress' || c.status === 'Onhold').length;
    const inProgress = list.filter((c) => c.status === 'In-Progress').length;
    const onhold = list.filter((c) => c.status === 'Onhold').length;
    const closed = list.filter((c) => c.status === 'Closed').length;
    res.json({ total, pending, assigned, inProgress, onhold, closed });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

exports.listComplaints = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    const isSuperAdmin = requester.role && requester.role.toLowerCase() === 'superadmin';

    // SuperAdmin: all complaints
    if (isSuperAdmin) {
      const complaints = await Complaint.find()
        .populate({ path: 'createdBy', select: 'username email department', populate: { path: 'department', select: 'name' } })
        .populate({ path: 'assignedTo', select: 'username email role department', populate: { path: 'department', select: 'name' } })
        .sort({ createdAt: -1 });
      return res.json(complaints);
    }

    // For all other users (User, Staff, Student, etc.): return complaints created by them or assigned to them
    const requesterId = requester.id || requester._id;
    let orConditions = [
      { createdBy: requesterId },
      { assignedTo: requesterId },
    ];

    if (requester.department) {
      const sameDeptStaff = await User.find({ department: requester.department }).select('_id');
      const staffIds = sameDeptStaff.map((u) => u._id);
      orConditions.push({ assignedTo: { $in: staffIds } });
    }

    const complaints = await Complaint.find({ $or: orConditions })
      .populate({ path: 'createdBy', select: 'username email department', populate: { path: 'department', select: 'name' } })
      .populate({ path: 'assignedTo', select: 'username email role department', populate: { path: 'department', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list complaints', error: error.message });
  }
};

// SuperAdmin assigns complaint to a staff user
exports.assignComplaint = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Only SuperAdmin can assign complaints' });
    }

    const complaintId = req.params.id;
    const { assignedTo } = req.body; // user id
    if (!assignedTo) return res.status(400).json({ message: 'assignedTo is required' });

    const assignee = await User.findById(assignedTo);
    if (!assignee) return res.status(404).json({ message: 'Assignee not found' });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.assignedTo = assignee._id;
    complaint.status = 'Assigned';
    await complaint.save();

    const updated = await Complaint.findById(complaintId).populate('assignedTo', 'username email role');
    res.json({ message: 'Assigned successfully', complaint: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign complaint', error: error.message });
  }
};

// Update complaint status (SuperAdmin, Assigned staff, or Creator)
exports.updateStatus = async (req, res) => {
  try {
    const requester = req.user;
    const complaintId = req.params.id;
    let { status } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required' });

    // Normalize common variations
    if (status === 'Completed') status = 'Closed';
    if (status.toLowerCase() === 'in progress' || status.toLowerCase() === 'inprogress') status = 'In-Progress';
    if (status.toLowerCase() === 'on hold' || status.toLowerCase() === 'onhold') status = 'Onhold';
    if (status.toLowerCase() === 'pending') status = 'Pending';
    if (status.toLowerCase() === 'assigned') status = 'Assigned';
    if (status.toLowerCase() === 'closed') status = 'Closed';

    const allowedStatuses = ['Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate('assignedTo', '_id username email role')
      .populate('createdBy', '_id username email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // SuperAdmin can change to any status
    if (requester.role === 'SuperAdmin') {
      complaint.status = status;
      await complaint.save();
      const updated = await Complaint.findById(complaintId)
        .populate('assignedTo', 'username email role')
        .populate('createdBy', 'username email');
      return res.json({ message: 'Status updated successfully', complaint: updated });
    }

    // Staff / Assignee / Creator check
    const isAssignee = complaint.assignedTo && String(complaint.assignedTo._id) === String(requester.id);
    const isCreator = complaint.createdBy && String(complaint.createdBy._id || complaint.createdBy) === String(requester.id);

    if (!isAssignee && !isCreator) {
      return res.status(403).json({ message: 'Only assigned staff, SuperAdmin, or complaint creator can update status' });
    }

    if (isAssignee) {
      const staffAllowed = ['In-Progress', 'Onhold', 'Closed'];
      if (!staffAllowed.includes(status)) {
        return res.status(403).json({ message: 'Assigned staff can only set In-Progress, Onhold, or Closed' });
      }
    }

    if (isCreator && !isAssignee) {
      const creatorAllowed = ['Pending', 'Closed'];
      if (!creatorAllowed.includes(status)) {
        return res.status(403).json({ message: 'Creator can only set Pending or Closed' });
      }
    }

    complaint.status = status;
    await complaint.save();
    const updated = await Complaint.findById(complaintId)
      .populate('assignedTo', 'username email role')
      .populate('createdBy', 'username email');
    res.json({ message: 'Status updated successfully', complaint: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// SuperAdmin: generate filtered reports
exports.generateReport = async (req, res) => {
  try {
    const requester = req.user;
    const isSuperAdmin = requester && requester.role && ['superadmin', 'admin'].includes(requester.role.toLowerCase());
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Only SuperAdmin can generate reports' });
    }

    const { department, programme, complaintType, status, assignee } = req.query;

    const filter = {};
    if (complaintType && complaintType !== 'All' && complaintType.trim()) {
      filter.complaintType = new RegExp(`^${complaintType.trim()}$`, 'i');
    }
    if (status && status !== 'All' && status.trim()) {
      filter.status = new RegExp(`^${status.trim()}$`, 'i');
    }
    if (assignee && assignee.trim()) {
      filter.assignedTo = assignee.trim();
    }

    // If department or programme are provided, filter by users in that department/programme
    if (department || programme) {
      const userQuery = {};
      if (department && department.trim()) userQuery.department = department.trim();
      if (programme && programme.trim()) userQuery.programme = programme.trim();

      const matchedUsers = await User.find(userQuery).select('_id');
      const userIds = matchedUsers.map((u) => u._id);

      if (userIds.length > 0) {
        filter.$or = [
          { createdBy: { $in: userIds } },
          { assignedTo: { $in: userIds } },
        ];
      }
    }

    const complaints = await Complaint.find(filter)
      .populate({
        path: 'createdBy',
        select: 'username email role department programme',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'programme', select: 'name' },
        ],
      })
      .populate({
        path: 'assignedTo',
        select: 'username email role department',
        populate: { path: 'department', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    console.error('Failed to generate report:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};
