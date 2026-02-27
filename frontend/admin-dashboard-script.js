const API_URL = "http://localhost:5000/api/complaints";
let allComplaints = [];
let currentComplaintId = null;

// ============ INITIALIZATION ============
function init() {
    // Check if admin is logged in
    checkAdminSession();
    
    // Load complaints on page load
    loadAllComplaints();
    
    // Set admin name
    const adminId = localStorage.getItem('adminId') || 'Admin';
    document.getElementById('adminName').textContent = adminId;
    
    // Refresh complaints every 30 seconds
    setInterval(loadAllComplaints, 30000);
}

// ============ SESSION MANAGEMENT ============
function checkAdminSession() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (!isLoggedIn) {
        window.location.href = 'admin-login.html';
    }
}

function adminLogout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminLoginTime');
    window.location.href = 'admin-login.html';
}

// ============ LOAD ALL COMPLAINTS ============
async function loadAllComplaints() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch complaints");
        
        allComplaints = await response.json();
        
        // Update statistics
        updateStatistics();
        
        // Display complaints
        displayComplaints(allComplaints);
        
    } catch (error) {
        console.error("Error loading complaints:", error);
        document.getElementById('complaintsTableBody').innerHTML = 
            '<tr><td colspan="9" class="loading">Error loading complaints. Check backend connection.</td></tr>';
    }
}

// ============ STATISTICS ============
function updateStatistics() {
    const total = allComplaints.length;
    const pending = allComplaints.filter(c => c.status === 'Pending').length;
    const resolved = allComplaints.filter(c => c.status === 'Resolved').length;
    const urgent = allComplaints.filter(c => c.priority === 'Urgent').length;
    
    document.getElementById('totalComplaints').textContent = total;
    document.getElementById('pendingComplaints').textContent = pending;
    document.getElementById('resolvedComplaints').textContent = resolved;
    document.getElementById('urgentComplaints').textContent = urgent;
}

// ============ DISPLAY COMPLAINTS ============
function displayComplaints(complaints) {
    const tbody = document.getElementById('complaintsTableBody');
    
    if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No complaints found</td></tr>';
        return;
    }
    
    tbody.innerHTML = complaints.map((complaint, index) => {
        const id = complaint._id || "#" + (index + 1);
        const name = complaint.studentName || "Unknown";
        const room = complaint.roomNumber || "N/A";
        const category = complaint.category || "General";
        const description = complaint.description || "No description";
        const priority = complaint.priority || "Normal";
        const status = complaint.status || "Pending";
        const createdAt = complaint.createdAt ? 
            new Date(complaint.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) : "N/A";
        
        return `
            <tr>
                <td><code>${id.substring(0, 8)}...</code></td>
                <td>${name}</td>
                <td>${room}</td>
                <td>${category}</td>
                <td title="${description}">${description.substring(0, 30)}${description.length > 30 ? '...' : ''}</td>
                <td><span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span></td>
                <td><span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">${status}</span></td>
                <td>${createdAt}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn update-status-btn" onclick="openStatusModal('${complaint._id}', '${name}', '${description}')">Update</button>
                        <button class="action-btn view-details-btn" onclick="openDetailsModal('${complaint._id}')">Details</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============ FILTERS ============
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    const priorityFilter = document.getElementById('filterPriority').value;
    
    let filtered = allComplaints;
    
    if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(c => c.category === categoryFilter);
    }
    
    if (priorityFilter) {
        filtered = filtered.filter(c => c.priority === priorityFilter);
    }
    
    displayComplaints(filtered);
}

function clearFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterPriority').value = '';
    displayComplaints(allComplaints);
}

// ============ STATUS UPDATE MODAL ============
function openStatusModal(complaintId, studentName, description) {
    currentComplaintId = complaintId;
    
    document.getElementById('modalComplaintId').textContent = complaintId.substring(0, 12) + '...';
    document.getElementById('modalStudentName').textContent = studentName;
    document.getElementById('modalDescription').textContent = description;
    document.getElementById('newStatus').value = 'Pending';
    document.getElementById('adminNotes').value = '';
    
    document.getElementById('statusModal').classList.add('show');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('show');
    currentComplaintId = null;
}

async function saveStatusUpdate() {
    const newStatus = document.getElementById('newStatus').value;
    const adminNotes = document.getElementById('adminNotes').value;
    
    if (!currentComplaintId) {
        alert('Error: Complaint ID not found');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${currentComplaintId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                adminNotes: adminNotes,
                updatedAt: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error("Failed to update complaint");
        
        closeStatusModal();
        alert('Complaint status updated successfully!');
        loadAllComplaints(); // Reload to show changes
        
    } catch (error) {
        console.error("Error updating complaint:", error);
        alert('Error updating complaint. Please try again.');
    }
}

// ============ DETAILS MODAL ============
function openDetailsModal(complaintId) {
    const complaint = allComplaints.find(c => c._id === complaintId);
    
    if (!complaint) {
        alert('Complaint not found');
        return;
    }
    
    const createdAt = complaint.createdAt ? 
        new Date(complaint.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
    
    const detailsHtml = `
        <div class="details-grid">
            <div class="detail-row">
                <div class="detail-label">Complaint ID</div>
                <div class="detail-value"><code>${complaintId}</code></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Student Name</div>
                <div class="detail-value">${complaint.studentName || 'Unknown'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Room Number</div>
                <div class="detail-value">${complaint.roomNumber || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Category</div>
                <div class="detail-value">${complaint.category || 'General'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Priority</div>
                <div class="detail-value"><span class="priority-badge priority-${(complaint.priority || 'Normal').toLowerCase()}">${complaint.priority || 'Normal'}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status</div>
                <div class="detail-value"><span class="status-badge status-${(complaint.status || 'Pending').toLowerCase().replace(' ', '-')}">${complaint.status || 'Pending'}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Submitted Date</div>
                <div class="detail-value">${createdAt}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Updated Date</div>
                <div class="detail-value">${complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString('en-US') : 'N/A'}</div>
            </div>
        </div>
        
        <div class="description-section">
            <h3>Complaint Description</h3>
            <p>${complaint.description || 'No description provided'}</p>
        </div>
        
        ${complaint.adminNotes ? `
            <div class="description-section" style="border-left-color: #667eea;">
                <h3>Admin Notes</h3>
                <p>${complaint.adminNotes}</p>
            </div>
        ` : ''}
    `;
    
    document.getElementById('detailsModalBody').innerHTML = detailsHtml;
    document.getElementById('detailsModal').classList.add('show');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('show');
}

// ============ MODAL CLOSE ON OUTSIDE CLICK ============
window.onclick = function(event) {
    const statusModal = document.getElementById('statusModal');
    const detailsModal = document.getElementById('detailsModal');
    
    if (event.target === statusModal) {
        statusModal.classList.remove('show');
    }
    
    if (event.target === detailsModal) {
        detailsModal.classList.remove('show');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
