// Demo admin credentials (fallback when backend is not reachable)
const DEMO_CREDENTIALS = {
    adminId: 'admin001',
    password: 'Admin@123'
};

// Admin login function
async function adminLogin(event) {
    event.preventDefault();
    
    const adminId = document.getElementById('adminId').value;
    const adminPassword = document.getElementById('adminPassword').value;
    
    try {
        // attempt backend authentication first
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId, password: adminPassword })
        });

        if (response.ok) {
            // successful login
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminId', adminId);
            localStorage.setItem('adminLoginTime', new Date().toISOString());
            window.location.href = 'admin-dashboard.html';
            return;
        } else {
            // if server rejects, parse message
            const err = await response.json();
            alert(err.message || 'Invalid Admin ID or Password');
            document.getElementById('adminPassword').value = '';
            return;
        }
    } catch (error) {
        console.warn('Backend login failed, falling back to demo credentials:', error);
        // fallback to hardcoded demo account (useful when backend not running locally)
        if (adminId === DEMO_CREDENTIALS.adminId && adminPassword === DEMO_CREDENTIALS.password) {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminId', adminId);
            localStorage.setItem('adminLoginTime', new Date().toISOString());
            window.location.href = 'admin-dashboard.html';
            return;
        }
        alert('Invalid Admin ID or Password');
        document.getElementById('adminPassword').value = '';
    }
}
