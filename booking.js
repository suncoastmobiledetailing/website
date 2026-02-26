// ===== SUNCOAST MOBILE DETAILING — BOOKING SYSTEM =====

// ===== FIREBASE CONFIG =====
// TODO: Replace with your Firebase config from the Firebase console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "suncoast-crm.firebaseapp.com",
    projectId: "suncoast-crm",
    storageBucket: "suncoast-crm.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== STATE =====
const state = {
    step: 1,
    vehicleType: 'sedan',
    selectedPackage: null,
    selectedDate: null,
    selectedTime: null,
    customer: {},
    formLoadTime: Date.now() // for anti-spam timing check
};

// Package definitions
const PACKAGES = {
    basic: { name: 'Basic', tier: 'ESSENTIALS', sedan: 50, suv: 60 },
    wax: { name: 'Basic + Wax Add-On', tier: 'ENHANCED', sedan: 75, suv: 75 },
    full: { name: 'Full Package', tier: 'PREMIUM', sedan: 120, suv: 150 }
};

// ===== MOBILE NAV =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });
}

// ===== VEHICLE TYPE TOGGLE =====
document.querySelectorAll('.vehicle-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.vehicle-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        state.vehicleType = opt.dataset.type;
        updatePrices();
    });
});

function updatePrices() {
    const type = state.vehicleType;
    document.querySelectorAll('.package-card').forEach(card => {
        const price = card.dataset[type];
        card.querySelector('.price-amount').textContent = price;
    });
}

// ===== PACKAGE SELECTION =====
function selectPackage(pkg) {
    state.selectedPackage = pkg;
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-package="${pkg}"]`).classList.add('selected');
    // Short delay for visual feedback then advance
    setTimeout(() => goToStep(2), 350);
}

// ===== STEP NAVIGATION =====
function goToStep(step) {
    // Validate before advancing
    if (step === 2 && !state.selectedPackage) return;
    if (step === 3 && (!state.selectedDate || !state.selectedTime)) return;

    state.step = step;

    // Update panels
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('step' + step);
    if (panel) panel.classList.add('active');

    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach(s => {
        const sNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'done');
        if (sNum === step) s.classList.add('active');
        else if (sNum < step) s.classList.add('done');
    });

    // Update progress lines
    for (let i = 1; i <= 3; i++) {
        const fill = document.getElementById('progressFill' + i);
        if (fill) fill.style.width = (i < step ? '100%' : '0%');
    }

    // Scroll to top of booking section
    document.querySelector('.booking-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // If going to step 4, populate confirmation
    if (step === 4) populateConfirmation();
}

// ===== CALENDAR =====
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calMonth').textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const container = document.getElementById('calDays');
    container.innerHTML = '';

    // Empty cells for days before first
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('button');
        empty.className = 'cal-day empty';
        empty.disabled = true;
        container.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(calendarYear, calendarMonth, d);
        const btn = document.createElement('button');
        btn.className = 'cal-day';
        btn.textContent = d;

        const dateStr = formatDate(date);
        const isSunday = date.getDay() === 0;
        const isPast = date < today;

        if (isSunday || isPast) {
            btn.classList.add('disabled');
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => selectDate(dateStr, btn));
        }

        // Highlight today
        if (date.getTime() === today.getTime()) {
            btn.classList.add('today');
        }

        // Highlight selected
        if (state.selectedDate === dateStr) {
            btn.classList.add('selected');
        }

        container.appendChild(btn);
    }
}

document.getElementById('calPrev').addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    // Don't go before current month
    const now = new Date();
    if (calendarYear < now.getFullYear() || (calendarYear === now.getFullYear() && calendarMonth < now.getMonth())) {
        calendarMonth = now.getMonth();
        calendarYear = now.getFullYear();
    }
    renderCalendar();
});

document.getElementById('calNext').addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    // Max 3 months ahead
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    if (calendarYear > maxDate.getFullYear() || (calendarYear === maxDate.getFullYear() && calendarMonth > maxDate.getMonth())) {
        calendarMonth = maxDate.getMonth();
        calendarYear = maxDate.getFullYear();
    }
    renderCalendar();
});

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

async function selectDate(dateStr, btn) {
    state.selectedDate = dateStr;
    state.selectedTime = null;

    // Update calendar visual
    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
    btn.classList.add('selected');

    // Update label
    document.getElementById('selectedDateLabel').textContent = formatDateDisplay(dateStr);

    // Load booked slots for this date and enable available ones
    await loadTimeSlots(dateStr);
}

async function loadTimeSlots(dateStr) {
    const slots = document.querySelectorAll('.time-slot');

    // Reset all slots
    slots.forEach(s => {
        s.disabled = false;
        s.classList.remove('selected', 'booked');
    });

    // Fetch existing bookings for this date
    try {
        const snapshot = await db.collection('bookings')
            .where('date', '==', dateStr)
            .where('status', 'in', ['pending', 'confirmed'])
            .get();

        const bookedSlots = new Set();
        snapshot.forEach(doc => bookedSlots.add(doc.data().timeSlot));

        slots.forEach(s => {
            if (bookedSlots.has(s.dataset.slot)) {
                s.classList.add('booked');
                s.disabled = true;
            }
        });
    } catch (err) {
        console.warn('Could not load bookings:', err);
        // Still enable all slots if Firebase fails
    }

    // Add click handlers
    slots.forEach(s => {
        if (!s.disabled) {
            s.onclick = () => selectTimeSlot(s);
        }
    });

    // Update the continue button
    document.getElementById('btnToStep3').disabled = true;
}

function selectTimeSlot(btn) {
    state.selectedTime = btn.dataset.slot;
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('btnToStep3').disabled = false;
}

// Initialize calendar
renderCalendar();

// ===== FORM HANDLING =====
document.getElementById('bookingForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (validateForm()) {
        state.customer = {
            name: document.getElementById('custName').value.trim(),
            phone: document.getElementById('custPhone').value.trim().replace(/\D/g, ''),
            email: document.getElementById('custEmail').value.trim(),
            address: document.getElementById('custAddress').value.trim(),
            notes: document.getElementById('custNotes').value.trim()
        };
        goToStep(4);
    }
});

function validateForm() {
    let valid = true;

    // Name
    const name = document.getElementById('custName');
    const errName = document.getElementById('errName');
    if (!name.value.trim() || name.value.trim().length < 2) {
        errName.textContent = 'Please enter your full name';
        name.classList.add('invalid');
        valid = false;
    } else {
        errName.textContent = '';
        name.classList.remove('invalid');
    }

    // Phone - must be 10 digits (US)
    const phone = document.getElementById('custPhone');
    const errPhone = document.getElementById('errPhone');
    const phoneDigits = phone.value.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        errPhone.textContent = 'Enter a valid 10-digit phone number';
        phone.classList.add('invalid');
        valid = false;
    } else {
        errPhone.textContent = '';
        phone.classList.remove('invalid');
    }

    // Email (optional but must be valid if provided)
    const email = document.getElementById('custEmail');
    const errEmail = document.getElementById('errEmail');
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        errEmail.textContent = 'Enter a valid email address';
        email.classList.add('invalid');
        valid = false;
    } else {
        errEmail.textContent = '';
        email.classList.remove('invalid');
    }

    // Address
    const address = document.getElementById('custAddress');
    const errAddress = document.getElementById('errAddress');
    if (!address.value.trim() || address.value.trim().length < 5) {
        errAddress.textContent = 'Please enter your address';
        address.classList.add('invalid');
        valid = false;
    } else {
        errAddress.textContent = '';
        address.classList.remove('invalid');
    }

    return valid;
}

// Phone formatting
document.getElementById('custPhone').addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.length > 10) val = val.substring(0, 10);
    if (val.length >= 6) {
        this.value = `(${val.substring(0, 3)}) ${val.substring(3, 6)}-${val.substring(6)}`;
    } else if (val.length >= 3) {
        this.value = `(${val.substring(0, 3)}) ${val.substring(3)}`;
    }
});

// ===== CONFIRMATION =====
function populateConfirmation() {
    const pkg = PACKAGES[state.selectedPackage];
    const price = pkg[state.vehicleType];

    document.getElementById('confirmPackage').textContent = `${pkg.name} (${pkg.tier})`;
    document.getElementById('confirmVehicle').textContent = state.vehicleType === 'sedan' ? '🚗 Sedan' : '🚙 SUV / Truck';
    document.getElementById('confirmPrice').textContent = `$${price}`;
    document.getElementById('confirmDate').textContent = `📅 ${formatDateDisplay(state.selectedDate)}`;
    document.getElementById('confirmTime').textContent = `🕐 ${state.selectedTime}`;
    document.getElementById('confirmName').textContent = `👤 ${state.customer.name}`;
    document.getElementById('confirmPhone').textContent = `📱 ${state.customer.phone}`;
    document.getElementById('confirmEmail').textContent = state.customer.email ? `📧 ${state.customer.email}` : '';
    document.getElementById('confirmAddress').textContent = `📍 ${state.customer.address}`;
    document.getElementById('confirmNotes').textContent = state.customer.notes ? `📝 ${state.customer.notes}` : '';
}

// ===== ANTI-SPAM CHECKS =====
function checkAntiSpam() {
    // 1. Honeypot
    const honeypot = document.getElementById('website').value;
    if (honeypot) {
        console.warn('Honeypot triggered');
        return false;
    }

    // 2. Timing check — form must be on screen for at least 5 seconds
    const elapsed = Date.now() - state.formLoadTime;
    if (elapsed < 5000) {
        console.warn('Form submitted too quickly');
        return false;
    }

    // 3. Cooldown — check localStorage for recent submission
    const lastBooking = localStorage.getItem('sc_last_booking');
    if (lastBooking) {
        const diff = Date.now() - parseInt(lastBooking);
        if (diff < 600000) { // 10 minute cooldown
            alert('You recently made a booking. Please wait before booking again.');
            return false;
        }
    }

    return true;
}

// ===== SUBMIT BOOKING =====
async function submitBooking() {
    const btn = document.getElementById('btnConfirmBooking');
    const btnText = document.getElementById('confirmBtnText');
    const spinner = document.getElementById('confirmSpinner');

    // Anti-spam
    if (!checkAntiSpam()) {
        // Silently show fake success for bots
        showSuccess('SC-0000');
        return;
    }

    // Disable button
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    const pkg = PACKAGES[state.selectedPackage];
    const price = pkg[state.vehicleType];

    const booking = {
        name: state.customer.name,
        phone: state.customer.phone,
        email: state.customer.email || '',
        address: state.customer.address,
        notes: state.customer.notes || '',
        package: state.selectedPackage,
        packageName: pkg.name,
        vehicleType: state.vehicleType,
        price: price,
        date: state.selectedDate,
        timeSlot: state.selectedTime,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        honeypot: document.getElementById('website').value
    };

    try {
        // Check for duplicate booking
        const existingSnap = await db.collection('bookings')
            .where('date', '==', state.selectedDate)
            .where('timeSlot', '==', state.selectedTime)
            .where('status', 'in', ['pending', 'confirmed'])
            .get();

        if (!existingSnap.empty) {
            alert('This time slot was just booked. Please choose a different time.');
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
            goToStep(2);
            return;
        }

        // Check rate limit — max 3 bookings per phone per day
        const phoneLimitSnap = await db.collection('bookings')
            .where('phone', '==', state.customer.phone)
            .get();

        const todayBookings = [];
        const todayStr = formatDate(new Date());
        phoneLimitSnap.forEach(doc => {
            const d = doc.data();
            if (d.createdAt) {
                const created = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
                if (formatDate(created) === todayStr) todayBookings.push(d);
            }
        });

        if (todayBookings.length >= 3) {
            alert('Too many bookings from this phone number today. Please try again tomorrow or call us.');
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
            return;
        }

        // Save to Firestore
        const docRef = await db.collection('bookings').add(booking);
        const bookingId = 'SC-' + docRef.id.substring(0, 8).toUpperCase();

        // Set cooldown
        localStorage.setItem('sc_last_booking', Date.now().toString());

        showSuccess(bookingId);

    } catch (err) {
        console.error('Booking error:', err);
        alert('There was an error submitting your booking. Please try again or call us at (954) 554-7462.');
        btn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

function showSuccess(bookingId) {
    const pkg = PACKAGES[state.selectedPackage];
    const price = pkg[state.vehicleType];

    document.querySelectorAll('.step-panel').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
    const successPanel = document.getElementById('stepSuccess');
    successPanel.style.display = 'block';
    successPanel.classList.add('active');

    document.getElementById('successId').textContent = `Booking ID: ${bookingId}`;
    document.getElementById('successDetails').innerHTML = `
    <p><strong>Package:</strong> ${pkg.name}</p>
    <p><strong>Vehicle:</strong> ${state.vehicleType === 'sedan' ? 'Sedan' : 'SUV / Truck'}</p>
    <p><strong>Price:</strong> $${price} (pay in person)</p>
    <p><strong>Date:</strong> ${formatDateDisplay(state.selectedDate)}</p>
    <p><strong>Time:</strong> ${state.selectedTime}</p>
    <p><strong>Address:</strong> ${state.customer.address}</p>
  `;

    // Hide progress bar
    document.querySelector('.booking-progress').style.display = 'none';

    // Scroll to success
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== URL PARAMS FOR PRE-SELECTION =====
// e.g. booking.html?package=wax&vehicle=suv
(function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    const pkg = params.get('package');
    const vehicle = params.get('vehicle');

    if (vehicle === 'suv') {
        document.querySelectorAll('.vehicle-option').forEach(o => o.classList.remove('active'));
        document.querySelector('[data-type="suv"]').classList.add('active');
        document.querySelector('[data-type="suv"] input').checked = true;
        state.vehicleType = 'suv';
        updatePrices();
    }

    if (pkg && PACKAGES[pkg]) {
        selectPackage(pkg);
    }
})();
