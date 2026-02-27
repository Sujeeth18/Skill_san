// Store registered students in localStorage
const DEMO_STUDENTS = {
    'student@hostel.com': {
        password: 'Student@123',
        fullName: 'Demo Student',
        rollNumber: 'CS001',
        roomNumber: 'A-101',
        phone: '9876543210'
    }
};

// Initialize demo students in localStorage if not already present
function initializeDemoData() {
    const existingStudents = localStorage.getItem('registeredStudents');
    if (!existingStudents) {
        localStorage.setItem('registeredStudents', JSON.stringify(DEMO_STUDENTS));
    }
}

// ============ STUDENT REGISTRATION ============
async function studentRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const rollNumber = document.getElementById('rollNumber').value;
    const roomNumber = document.getElementById('roomNumber').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    if (!isValidPhone(phone)) {
        alert('Please enter a valid phone number');
        return;
    }
    
    try {
        // Get existing students
        const studentsJSON = localStorage.getItem('registeredStudents');
        const students = studentsJSON ? JSON.parse(studentsJSON) : {};
        
        // Check if email already exists
        if (students[email]) {
            alert('Email already registered. Please login or use a different email.');
            return;
        }
        
        // Add new student
        students[email] = {
            password: password,
            fullName: fullName,
            rollNumber: rollNumber,
            roomNumber: roomNumber,
            phone: phone,
            registeredDate: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('registeredStudents', JSON.stringify(students));
        
        alert('Registration successful! Please login with your credentials.');
        window.location.href = 'student-login.html';
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

// ============ STUDENT LOGIN ============
async function studentLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        initializeDemoData();
        
        // Get stored students
        const studentsJSON = localStorage.getItem('registeredStudents');
        const students = studentsJSON ? JSON.parse(studentsJSON) : {};
        
        // Check if student exists and password matches
        if (!students[email]) {
            alert('Email not found. Please register first.');
            return;
        }
        
        if (students[email].password !== password) {
            alert('Invalid password. Please try again.');
            document.getElementById('password').value = '';
            return;
        }
        
        // Store student session
        localStorage.setItem('studentLoggedIn', 'true');
        localStorage.setItem('studentEmail', email);
        localStorage.setItem('studentName', students[email].fullName);
        localStorage.setItem('studentRoomNumber', students[email].roomNumber);
        localStorage.setItem('studentRollNumber', students[email].rollNumber);
        localStorage.setItem('studentLoginTime', new Date().toISOString());
        
        // Redirect to student portal
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// ============ STUDENT LOGOUT ============
function studentLogout() {
    localStorage.removeItem('studentLoggedIn');
    localStorage.removeItem('studentEmail');
    localStorage.removeItem('studentName');
    localStorage.removeItem('studentRoomNumber');
    localStorage.removeItem('studentRollNumber');
    localStorage.removeItem('studentLoginTime');
    window.location.href = 'student-login.html';
}

// ============ CHECK STUDENT SESSION ============
function checkStudentSession() {
    const isLoggedIn = localStorage.getItem('studentLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'student-login.html';
    }
}

// ============ GET STUDENT DETAILS ============
function getStudentDetails() {
    return {
        email: localStorage.getItem('studentEmail'),
        name: localStorage.getItem('studentName'),
        roomNumber: localStorage.getItem('studentRoomNumber'),
        rollNumber: localStorage.getItem('studentRollNumber')
    };
}

// ============ VALIDATION FUNCTIONS ============
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeDemoData();
});
