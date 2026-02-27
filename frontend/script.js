const API_URL = "http://localhost:5000/api/complaints";

// Fetch all complaints
async function loadComplaints() {
    const response = await fetch(API_URL);
    const data = await response.json();

    const list = document.getElementById("complaintList");
    list.innerHTML = "";

    data.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.complaintText + " - " + item.status;
        list.appendChild(li);
    });
}

// Add new complaint
async function addComplaint() {
    const text = document.getElementById("complaintText").value;

    await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ complaintText: text })
    });

    document.getElementById("complaintText").value = "";
    loadComplaints();
}

loadComplaints();