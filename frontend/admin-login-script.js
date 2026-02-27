// Demo admin credentials (in production, this would be verified against a backend database)
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
        // Validate credentials (demo version - in production use backend API)
        if (adminId === DEMO_CREDENTIALS.adminId && adminPassword === DEMO_CREDENTIALS.password) {
            // Store admin session in localStorage
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminId', adminId);
            localStorage.setItem('adminLoginTime', new Date().toISOString());
            
            // Redirect to dashboard
            window.location.href = 'admin-dashboard.html';
        } else {
            alert('Invalid Admin ID or Password');
            document.getElementById('adminPassword').value = '';
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}
