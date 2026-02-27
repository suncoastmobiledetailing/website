// ===== SUNCOAST MOBILE DETAILING — ADMIN PANEL =====

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "AIzaSyCknOSxiSKhrvOnqx_-rE8lUMyanJVy26o",
    authDomain: "suncoast-crm.firebaseapp.com",
    projectId: "suncoast-crm",
    storageBucket: "suncoast-crm.firebasestorage.app",
    messagingSenderId: "943335181837",
    appId: "1:943335181837:web:54036acd361b71fc40cf44",
    measurementId: "G-VGLDWMWP84"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== PASSWORD (SHA-256 hashed — actual password NOT stored in code) =====
const ADMIN_PW_HASH = 'ff3fe453efdbd3361fd3b50d9a6c9b92d91df2abfe204f8053b8cb3bae7365be';
let allBookings = [];

// Hash a string with SHA-256
async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check session
if (sessionStorage.getItem('sc_admin') === 'true') {
    showDashboard();
}

document.getElementById('passwordForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const pw = document.getElementById('gatePassword').value;
    const hash = await sha256(pw);
    if (hash === ADMIN_PW_HASH) {
        sessionStorage.setItem('sc_admin', 'true');
        showDashboard();
    } else {
        document.getElementById('gateError').textContent = 'Incorrect password';
        document.getElementById('gatePassword').value = '';
    }
});

function showDashboard() {
    document.getElementById('passwordGate').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadBookings();
}

function logout() {
    sessionStorage.removeItem('sc_admin');
    location.reload();
}

// ===== LOAD BOOKINGS =====
async function loadBookings() {
    try {
        const snapshot = await db.collection('bookings').orderBy('date', 'desc').get();
        allBookings = [];
        snapshot.forEach(doc => {
            allBookings.push({ id: doc.id, ...doc.data() });
        });
        updateStats();
        renderAdminCalendar();
        renderTodayBookings();
        renderAllBookings();
    } catch (err) {
        console.error('Error loading bookings:', err);
    }
}

// ===== STATS =====
function updateStats() {
    const today = formatDate(new Date());
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = formatDate(weekStart);

    let todayCount = 0, weekCount = 0, pendingCount = 0, revenue = 0;

    allBookings.forEach(b => {
        if (b.date === today) todayCount++;
        if (b.date >= weekStartStr) weekCount++;
        if (b.status === 'pending') pendingCount++;
        if (b.status === 'confirmed' || b.status === 'completed') revenue += (b.price || 0);
    });

    document.getElementById('statToday').textContent = todayCount;
    document.getElementById('statWeek').textContent = weekCount;
    document.getElementById('statPending').textContent = pendingCount;
    document.getElementById('statRevenue').textContent = '$' + revenue.toLocaleString();
}

// ===== TABS =====
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
}

// ===== ADMIN CALENDAR =====
let adminMonth = new Date().getMonth();
let adminYear = new Date().getFullYear();

function renderAdminCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('adminCalMonth').textContent = `${monthNames[adminMonth]} ${adminYear}`;

    const firstDay = new Date(adminYear, adminMonth, 1).getDay();
    const daysInMonth = new Date(adminYear, adminMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    // Group bookings by date for this month
    const bookingsByDate = {};
    allBookings.forEach(b => {
        const [y, m] = b.date.split('-').map(Number);
        if (y === adminYear && m === adminMonth + 1) {
            if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
            bookingsByDate[b.date].push(b);
        }
    });

    const container = document.getElementById('adminCalDays');
    container.innerHTML = '';

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'admin-day empty';
        container.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${adminYear}-${String(adminMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'admin-day';

        if (dateStr === todayStr) cell.classList.add('today');

        const dayNum = document.createElement('div');
        dayNum.className = 'day-num';
        dayNum.textContent = d;
        cell.appendChild(dayNum);

        const dayBookings = bookingsByDate[dateStr] || [];
        if (dayBookings.length > 0) {
            const dots = document.createElement('div');
            dots.className = 'day-dots';
            dayBookings.forEach(b => {
                const dot = document.createElement('span');
                dot.className = 'day-dot ' + (b.status || 'pending');
                dots.appendChild(dot);
            });
            cell.appendChild(dots);

            const count = document.createElement('div');
            count.className = 'day-count';
            count.textContent = dayBookings.length + ' booking' + (dayBookings.length > 1 ? 's' : '');
            cell.appendChild(count);

            cell.addEventListener('click', () => showDayDetail(dateStr, dayBookings));
        }

        container.appendChild(cell);
    }
}

document.getElementById('adminCalPrev').addEventListener('click', () => {
    adminMonth--;
    if (adminMonth < 0) { adminMonth = 11; adminYear--; }
    renderAdminCalendar();
});

document.getElementById('adminCalNext').addEventListener('click', () => {
    adminMonth++;
    if (adminMonth > 11) { adminMonth = 0; adminYear++; }
    renderAdminCalendar();
});

// ===== DAY DETAIL =====
function showDayDetail(dateStr, bookings) {
    const detail = document.getElementById('dayDetail');
    detail.style.display = 'block';

    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    document.getElementById('dayDetailTitle').textContent = date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    const container = document.getElementById('dayDetailBookings');
    container.innerHTML = '';

    if (bookings.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No bookings for this day</p></div>';
        return;
    }

    // Sort by time slot
    bookings.sort((a, b) => {
        const ta = parseTimeForSort(a.timeSlot);
        const tb = parseTimeForSort(b.timeSlot);
        return ta - tb;
    });

    bookings.forEach(b => {
        container.appendChild(createBookingCard(b));
    });

    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeDayDetail() {
    document.getElementById('dayDetail').style.display = 'none';
}

// ===== TODAY'S BOOKINGS =====
function renderTodayBookings() {
    const today = formatDate(new Date());
    const todayBookings = allBookings.filter(b => b.date === today);
    const container = document.getElementById('todayList');
    container.innerHTML = '';

    if (todayBookings.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🌴</div><p>No appointments today — enjoy the break!</p></div>';
        return;
    }

    todayBookings.sort((a, b) => parseTimeForSort(a.timeSlot) - parseTimeForSort(b.timeSlot));
    todayBookings.forEach(b => container.appendChild(createBookingCard(b)));
}

// ===== ALL BOOKINGS =====
function renderAllBookings() {
    const filter = document.getElementById('statusFilter').value;
    let filtered = allBookings;
    if (filter !== 'all') {
        filtered = allBookings.filter(b => b.status === filter);
    }

    const container = document.getElementById('allList');
    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No bookings found</p></div>';
        return;
    }

    filtered.forEach(b => container.appendChild(createBookingCard(b, true)));
}

// ===== BOOKING CARD =====
function createBookingCard(booking, showDate = false) {
    const card = document.createElement('div');
    card.className = 'booking-card';

    const packageNames = {
        basic: 'Basic', wax: 'Basic + Wax Add-On', full: 'Full Package'
    };

    const statusLabels = {
        pending: 'PENDING', confirmed: 'CONFIRMED',
        completed: 'COMPLETED', cancelled: 'CANCELLED'
    };

    const timeDiv = document.createElement('div');
    timeDiv.className = 'booking-time';
    timeDiv.innerHTML = `
    <span class="time-val">${booking.timeSlot || 'N/A'}</span>
    ${showDate ? `<span class="time-date">${formatDateShort(booking.date)}</span>` : ''}
  `;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'booking-info';
    infoDiv.innerHTML = `
    <h4>${booking.name || 'Unknown'}</h4>
    <div class="booking-meta">
      <span>📦 ${packageNames[booking.package] || booking.packageName || booking.package}</span>
      <span>${booking.vehicleType === 'suv' ? '🚙 SUV/Truck' : '🚗 Sedan'}</span>
      <span>💰 $${booking.price || 0}</span>
    </div>
    <div class="booking-meta">
      <span>📱 ${booking.phone || 'N/A'}</span>
      ${booking.email ? `<span>📧 ${booking.email}</span>` : ''}
    </div>
    <div class="booking-meta">
      <span>📍 ${booking.address || 'N/A'}</span>
    </div>
    ${booking.notes ? `<div class="booking-meta"><span>📝 ${booking.notes}</span></div>` : ''}
  `;

    const statusDiv = document.createElement('div');
    statusDiv.className = 'booking-status-wrap';
    statusDiv.innerHTML = `
    <span class="status-badge status-${booking.status || 'pending'}">${statusLabels[booking.status] || 'PENDING'}</span>
    <div class="status-actions">
      ${booking.status !== 'confirmed' ? `<button class="btn-status btn-confirm-status" onclick="updateStatus('${booking.id}','confirmed')">✓ Confirm</button>` : ''}
      ${booking.status !== 'completed' ? `<button class="btn-status btn-complete-status" onclick="updateStatus('${booking.id}','completed')">✅ Done</button>` : ''}
      ${booking.status !== 'cancelled' ? `<button class="btn-status btn-cancel-status" onclick="updateStatus('${booking.id}','cancelled')">✕ Cancel</button>` : ''}
    </div>
  `;

    card.appendChild(timeDiv);
    card.appendChild(infoDiv);
    card.appendChild(statusDiv);
    return card;
}

// ===== UPDATE STATUS =====
async function updateStatus(bookingId, newStatus) {
    try {
        await db.collection('bookings').doc(bookingId).update({ status: newStatus });
        // Update local data
        const booking = allBookings.find(b => b.id === bookingId);
        if (booking) booking.status = newStatus;
        // Re-render
        updateStats();
        renderAdminCalendar();
        renderTodayBookings();
        renderAllBookings();
        // Refresh day detail if open
        const detail = document.getElementById('dayDetail');
        if (detail.style.display !== 'none' && booking) {
            const dayBookings = allBookings.filter(b => b.date === booking.date);
            showDayDetail(booking.date, dayBookings);
        }
    } catch (err) {
        console.error('Error updating status:', err);
        alert('Failed to update status. Please try again.');
    }
}

// ===== HELPERS =====
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateShort(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseTimeForSort(timeStr) {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
}
