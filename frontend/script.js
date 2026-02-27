const API_URL = "http://localhost:5000/api/complaints";

// ============ INITIALIZATION ============
function init() {
    // Check student session
    checkStudentSession();
    
    // Display student info
    displayStudentInfo();
    
    // Load complaints
    loadComplaints();
    
    // Auto-refresh every 30 seconds
    setInterval(loadComplaints, 30000);
}

// ============ SESSION MANAGEMENT ============
function checkStudentSession() {
    const isLoggedIn = localStorage.getItem('studentLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'student-login.html';
    }
}

function displayStudentInfo() {
    const studentName = localStorage.getItem('studentName');
    const studentRoom = localStorage.getItem('studentRoomNumber');
    const studentInfo = document.getElementById('studentInfo');
    if (studentInfo) {
        studentInfo.textContent = `Welcome, ${studentName} | Room: ${studentRoom}`;
    }
}

function studentLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('studentLoggedIn');
        localStorage.removeItem('studentEmail');
        localStorage.removeItem('studentName');
        localStorage.removeItem('studentRoomNumber');
        localStorage.removeItem('studentRollNumber');
        localStorage.removeItem('studentLoginTime');
        window.location.href = 'student-login.html';
    }
}

// Fetch all complaints
async function loadComplaints() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch complaints");
        const data = await response.json();

        const list = document.getElementById("complaintList");
        list.innerHTML = "";

        if (data.length === 0) {
            list.innerHTML = "<div class='empty-state'>No complaints yet</div>";
            return;
        }

        data.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "complaint-card " + (item.priority || "Normal").toLowerCase();
            
            const id = item._id || "#" + (index + 1);
            const name = item.studentName || "Unknown";
            const room = item.roomNumber || "N/A";
            const desc = item.description || "No description";
            const category = item.category || "General";
            const priority = item.priority || "Normal";
            const status = item.status || "Pending";
            const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";
            
            card.innerHTML = `
                <div class="complaint-header">
                    <div>
                        <div class="complaint-student">${name}</div>
                        <div class="complaint-room">Room: ${room}</div>
                    </div>
                    <span class="complaint-status status-${status.toLowerCase()}">${status}</span>
                    <span class="complaint-priority priority-${priority.toLowerCase()}">${priority}</span>
                </div>
                <div class="complaint-description">${desc}</div>
                <div class="complaint-details">
                    <div class="detail-item">
                        <span class="detail-label">Category</span>
                        ${category}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Submitted</span>
                        ${createdAt}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">ID</span>
                        ${id.substring(0, 8)}...
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading complaints:", error);
        document.getElementById("complaintList").innerHTML = "<div class='empty-state'>Error loading complaints. Check backend connection.</div>";
    }
}

// Add new complaint
async function addComplaint(event) {
    event.preventDefault();
    try {
        const text = document.getElementById("complaintText").value;
        const category = document.getElementById("category").value;
        const priority = document.getElementById("priority").value;
        
        // Get student info from session
        const studentName = localStorage.getItem('studentName');
        const roomNumber = localStorage.getItem('studentRoomNumber');
        
        if (!text.trim()) {
            alert("Please enter a complaint description");
            return;
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                studentName: studentName,
                roomNumber: roomNumber,
                category: category,
                description: text,
                priority: priority
            })
        });

        if (!response.ok) throw new Error("Failed to add complaint");

        document.getElementById("complaintText").value = "";
        loadComplaints();
        alert("Complaint submitted successfully!");
    } catch (error) {
        console.error("Error adding complaint:", error);
        alert("Error adding complaint. Check backend connection.");
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);