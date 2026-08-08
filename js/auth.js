// ============================================
// C4 SYSTEMS - Authentication
// ============================================

let currentUser = null;
let userRole = null;
let permissions = {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canRelease: false,
    canViewAll: false,
    canManageUsers: false
};

// Session Timer
let sessionTimer;
let sessionTimerInterval;

function resetSessionTimer() {
    if (sessionTimer) clearTimeout(sessionTimer);
    if (sessionTimerInterval) clearInterval(sessionTimerInterval);

    const warning = document.getElementById('sessionWarning');
    if (warning) warning.style.display = 'none';

    sessionTimer = setTimeout(() => {
        const warn = document.getElementById('sessionWarning');
        if (warn) warn.style.display = 'flex';

        let timeLeft = 300;
        sessionTimerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const timerSpan = document.getElementById('sessionTimer');
            if (timerSpan) timerSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(sessionTimerInterval);
                forceLogout();
            }
        }, 1000);
    }, 25 * 60 * 1000);

    const logoutTimer = setTimeout(() => {
        forceLogout();
    }, 30 * 60 * 1000);

    window.logoutTimer = logoutTimer;
}

function extendSession() {
    resetSessionTimer();
    showToast('Session extended for another 30 minutes', 'success');
}

async function forceLogout() {
    showToast('Session expired due to inactivity. Please login again.', 'warning');
    try {
        if (sessionTimer) clearTimeout(sessionTimer);
        if (sessionTimerInterval) clearInterval(sessionTimerInterval);
        if (window.logoutTimer) clearTimeout(window.logoutTimer);

        await auth.signOut();
        localStorage.removeItem('c4_current_user');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'login.html';
    }
}

function setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    events.forEach(event => {
        document.addEventListener(event, () => {
            resetSessionTimer();
        });
    });
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        localStorage.setItem('c4_current_user', JSON.stringify({ uid: user.uid, email: user.email }));
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                userRole = userDoc.data().role;
            } else {
                userRole = 'viewer';
                await db.collection('users').doc(user.uid).set({
                    name: user.email.split('@')[0],
                    email: user.email,
                    role: userRole,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            permissions = {
                canCreate: userRole === 'admin' || userRole === 'creator',
                canEdit: userRole === 'admin' || userRole === 'creator',
                canDelete: userRole === 'admin',
                canApprove: userRole === 'admin' || userRole === 'approver',
                canRelease: userRole === 'admin' || userRole === 'approver',
                canViewAll: userRole === 'admin' || userRole === 'approver',
                canManageUsers: userRole === 'admin'
            };
            updateUIForUser();
            document.getElementById('appContainer').style.display = 'block';

            // Initialize app
            if (typeof initApp === 'function') {
                initApp();
            }
            resetSessionTimer();
            setupActivityListeners();
        } catch (error) {
            console.error('Error loading user permissions:', error);
            showToast('Error loading user permissions: ' + error.message, 'error');
        }
    } else {
        localStorage.removeItem('c4_current_user');
        window.location.href = 'login.html';
    }
});

function updateUIForUser() {
    document.getElementById('userName').textContent = currentUser?.email?.split('@')[0] || 'User';
    document.getElementById('userAvatar').textContent = (currentUser?.email?.charAt(0) || 'U').toUpperCase();
    
    const newCommBtn = document.getElementById('newCommBtn');
    if (newCommBtn) newCommBtn.style.display = permissions.canCreate ? 'flex' : 'none';
    
    const roleBadge = document.querySelector('#userRole .role-badge');
    if (roleBadge) {
        const displayRole = userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'Viewer';
        roleBadge.className = `role-badge ${userRole}`;
        roleBadge.textContent = displayRole;
    }
}

// Logout Function
window.logout = async () => {
    const result = await Swal.fire({
        title: 'Logout?',
        text: 'Are you sure?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
        title: 'Logging out...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        await auth.signOut();
        localStorage.removeItem('c4_current_user');
        Swal.fire({
            icon: 'success',
            title: 'Logged out!',
            timer: 1000,
            showConfirmButton: false
        });
        setTimeout(() => window.location.href = 'login.html', 1000);
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
};