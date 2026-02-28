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

// ===== PASSWORD (SHA-256 hashed) =====
const ADMIN_PW_HASH = 'ff3fe453efdbd3361fd3b50d9a6c9b92d91df2abfe204f8053b8cb3bae7365be';
let allBookings = [];

// Duration in minutes based on number of cars
const DURATION_MAP = {
    1: 60,   // 45-60 min
    2: 120,  // 90-120 min
    3: 180,  // 120-180 min
    4: 180   // 120-180 min
};
const COMMUTE_BUFFER = 45; // minutes from Parkland

// Service names
const SERVICE_NAMES = {
    reset: 'Full Reset Detail',
    maintenance: 'Maintenance Visit',
    // Legacy package names
    basic: 'Basic',
    wax: 'Basic + Wax Add-On',
    full: 'Full Package'
};

const FREQ_LABELS = {
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
    monthly: 'Monthly'
};

async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

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
        renderArchiveBookings();
    } catch (err) {
        console.error('Error loading bookings:', err);
    }
}

// ===== STATS (exclude archived) =====
function updateStats() {
    const today = formatDate(new Date());
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = formatDate(weekStart);

    let todayCount = 0, weekCount = 0, pendingCount = 0, revenue = 0;

    allBookings.forEach(b => {
        if (b.archived) return; // Exclude archived from stats
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
    const panelId = 'tab' + tab.charAt(0).toUpperCase() + tab.slice(1);
    document.getElementById(panelId).classList.add('active');
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

    // Group non-archived bookings by date
    const bookingsByDate = {};
    allBookings.forEach(b => {
        if (b.archived) return;
        const [y, m] = b.date.split('-').map(Number);
        if (y === adminYear && m === adminMonth + 1) {
            if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
            bookingsByDate[b.date].push(b);
        }
    });

    const container = document.getElementById('adminCalDays');
    container.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'admin-day empty';
        container.appendChild(empty);
    }

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

    bookings.sort((a, b) => parseTimeForSort(a.timeSlot) - parseTimeForSort(b.timeSlot));
    bookings.forEach(b => container.appendChild(createBookingCard(b)));

    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeDayDetail() {
    document.getElementById('dayDetail').style.display = 'none';
}

// ===== TODAY'S BOOKINGS =====
function renderTodayBookings() {
    const today = formatDate(new Date());
    const todayBookings = allBookings.filter(b => b.date === today && !b.archived);
    const container = document.getElementById('todayList');
    container.innerHTML = '';

    if (todayBookings.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🌴</div><p>No appointments today — enjoy the break!</p></div>';
        return;
    }

    todayBookings.sort((a, b) => parseTimeForSort(a.timeSlot) - parseTimeForSort(b.timeSlot));
    todayBookings.forEach(b => container.appendChild(createBookingCard(b)));
}

// ===== ALL BOOKINGS (non-archived) =====
function renderAllBookings() {
    const filter = document.getElementById('statusFilter').value;
    let filtered = allBookings.filter(b => !b.archived);
    if (filter !== 'all') {
        filtered = filtered.filter(b => b.status === filter);
    }

    const container = document.getElementById('allList');
    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No bookings found</p></div>';
        return;
    }

    filtered.forEach(b => container.appendChild(createBookingCard(b, true)));
}

// ===== ARCHIVED BOOKINGS =====
function renderArchiveBookings() {
    const archived = allBookings.filter(b => b.archived);
    const container = document.getElementById('archiveList');
    container.innerHTML = '';

    if (archived.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>No archived bookings</p></div>';
        return;
    }

    archived.forEach(b => container.appendChild(createBookingCard(b, true, true)));
}

// ===== BOOKING CARD =====
function createBookingCard(booking, showDate = false, isArchiveView = false) {
    const card = document.createElement('div');
    card.className = 'booking-card';
    if (isArchiveView) card.classList.add('archived');

    // Determine service/package display name
    const serviceName = booking.serviceName ||
        SERVICE_NAMES[booking.serviceType] ||
        SERVICE_NAMES[booking.package] ||
        booking.packageName ||
        booking.package ||
        'Unknown';

    const statusLabels = {
        pending: 'PENDING', confirmed: 'CONFIRMED',
        completed: 'COMPLETED', cancelled: 'CANCELLED'
    };

    // Estimate duration
    const numCars = booking.numCars || 1;
    const duration = DURATION_MAP[numCars] || 60;
    const durationStr = duration >= 120
        ? (duration / 60) + ' hrs'
        : duration + ' min';

    const timeDiv = document.createElement('div');
    timeDiv.className = 'booking-time';
    timeDiv.innerHTML = `
    <span class="time-val">${booking.timeSlot || 'N/A'}</span>
    ${showDate ? `<span class="time-date">${formatDateShort(booking.date)}</span>` : ''}
    <span class="time-duration">~${durationStr}</span>
  `;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'booking-info';

    // Build vehicle breakdown
    let vehicleDisplay = '';
    if (booking.vehicles && Array.isArray(booking.vehicles)) {
        const sedans = booking.vehicles.filter(v => v === 'sedan').length;
        const suvs = booking.vehicles.filter(v => v === 'suv').length;
        if (sedans > 0) vehicleDisplay += '🚗 ' + sedans + ' Sedan' + (sedans > 1 ? 's' : '');
        if (sedans > 0 && suvs > 0) vehicleDisplay += ' + ';
        if (suvs > 0) vehicleDisplay += '🚙 ' + suvs + ' SUV' + (suvs > 1 ? 's' : '');
    } else {
        vehicleDisplay = booking.vehicleType === 'suv' ? '🚙 SUV/Truck' : '🚗 Sedan';
    }

    let metaHtml = `
    <h4>${booking.name || 'Unknown'}</h4>
    <div class="booking-meta">
      <span>📦 ${serviceName}</span>
      <span>${vehicleDisplay}</span>
      <span>💰 $${booking.price || 0}</span>
    </div>
    <div class="booking-meta">
      <span>🚗 ${numCars} car${numCars > 1 ? 's' : ''}</span>`;

    if (booking.frequency && booking.serviceType === 'maintenance') {
        metaHtml += `<span>🔄 ${FREQ_LABELS[booking.frequency] || booking.frequency}</span>`;
    }

    if (booking.recurring && booking.recurringTotal) {
        metaHtml += `<span>📋 Visit ${(booking.recurringIndex || 0) + 1} of ${booking.recurringTotal}</span>`;
    }

    metaHtml += `
    </div>
    <div class="booking-meta">
      <span>📱 ${booking.phone || 'N/A'}</span>
      ${booking.email ? `<span>📧 ${booking.email}</span>` : ''}
    </div>
    <div class="booking-meta">
      <span>📍 ${booking.address || 'N/A'}</span>
    </div>
    ${booking.notes ? `<div class="booking-meta"><span>📝 ${booking.notes}</span></div>` : ''}`;

    infoDiv.innerHTML = metaHtml;

    const statusDiv = document.createElement('div');
    statusDiv.className = 'booking-status-wrap';

    let actionsHtml = '';
    if (isArchiveView) {
        actionsHtml = `<button class="btn-status btn-unarchive" onclick="unarchiveBooking('${booking.id}')">📤 Unarchive</button>`;
    } else {
        actionsHtml = `
      ${booking.status !== 'confirmed' ? `<button class="btn-status btn-confirm-status" onclick="updateStatus('${booking.id}','confirmed')">✓ Confirm</button>` : ''}
      ${booking.status !== 'completed' ? `<button class="btn-status btn-complete-status" onclick="updateStatus('${booking.id}','completed')">✅ Done</button>` : ''}
      ${booking.status !== 'cancelled' ? `<button class="btn-status btn-cancel-status" onclick="updateStatus('${booking.id}','cancelled')">✕ Cancel</button>` : ''}
      <button class="btn-status btn-archive" onclick="archiveBooking('${booking.id}')">📦 Archive</button>
    `;
    }

    statusDiv.innerHTML = `
    <span class="status-badge status-${booking.status || 'pending'}">${statusLabels[booking.status] || 'PENDING'}</span>
    <div class="status-actions">
      ${actionsHtml}
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
        const booking = allBookings.find(b => b.id === bookingId);
        if (booking) booking.status = newStatus;
        refreshAll(booking);
    } catch (err) {
        console.error('Error updating status:', err);
        alert('Failed to update status. Please try again.');
    }
}

// ===== ARCHIVE / UNARCHIVE =====
async function archiveBooking(bookingId) {
    try {
        await db.collection('bookings').doc(bookingId).update({ archived: true });
        const booking = allBookings.find(b => b.id === bookingId);
        if (booking) booking.archived = true;
        refreshAll(booking);
    } catch (err) {
        console.error('Error archiving booking:', err);
        alert('Failed to archive booking. Please try again.');
    }
}

async function unarchiveBooking(bookingId) {
    try {
        await db.collection('bookings').doc(bookingId).update({ archived: false });
        const booking = allBookings.find(b => b.id === bookingId);
        if (booking) booking.archived = false;
        refreshAll(booking);
    } catch (err) {
        console.error('Error unarchiving booking:', err);
        alert('Failed to unarchive booking. Please try again.');
    }
}

function refreshAll(booking) {
    updateStats();
    renderAdminCalendar();
    renderTodayBookings();
    renderAllBookings();
    renderArchiveBookings();
    // Refresh day detail if open
    const detail = document.getElementById('dayDetail');
    if (detail.style.display !== 'none' && booking) {
        const dayBookings = allBookings.filter(b => b.date === booking.date && !b.archived);
        showDayDetail(booking.date, dayBookings);
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
