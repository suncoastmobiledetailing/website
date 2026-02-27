// ===== SUNCOAST MOBILE DETAILING — BOOKING SYSTEM =====

// Firebase config loaded from firebase-config.js (git-ignored)
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
    formLoadTime: Date.now()
};

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
    const el = document.querySelector('[data-package="' + pkg + '"]');
    if (el) el.classList.add('selected');
    setTimeout(() => goToStep(2), 350);
}

// ===== STEP NAVIGATION =====
function goToStep(step) {
    if (step === 2 && !state.selectedPackage) return;
    if (step === 3 && (!state.selectedDate || !state.selectedTime)) return;

    state.step = step;

    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('step' + step);
    if (panel) panel.classList.add('active');

    document.querySelectorAll('.progress-step').forEach(s => {
        const sNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'done');
        if (sNum === step) s.classList.add('active');
        else if (sNum < step) s.classList.add('done');
    });

    for (let i = 1; i <= 3; i++) {
        const fill = document.getElementById('progressFill' + i);
        if (fill) fill.style.width = (i < step ? '100%' : '0%');
    }

    document.querySelector('.booking-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (step === 4) populateConfirmation();
}

// ===== CALENDAR =====
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calMonth').textContent = monthNames[calendarMonth] + ' ' + calendarYear;

    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Earliest bookable date is tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Latest bookable date is 4 weeks from today
    const maxBookingDate = new Date(today);
    maxBookingDate.setDate(maxBookingDate.getDate() + 28);

    const container = document.getElementById('calDays');
    container.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('button');
        empty.className = 'cal-day empty';
        empty.disabled = true;
        container.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(calendarYear, calendarMonth, d);
        const btn = document.createElement('button');
        btn.className = 'cal-day';
        btn.textContent = d;

        const dateStr = formatDate(date);
        const isTooEarly = date < tomorrow;
        const isTooLate = date > maxBookingDate;

        if (isTooEarly || isTooLate) {
            btn.classList.add('disabled');
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => selectDate(dateStr, btn));
        }

        if (date.getTime() === today.getTime()) btn.classList.add('today');
        if (state.selectedDate === dateStr) btn.classList.add('selected');

        container.appendChild(btn);
    }
}

document.getElementById('calPrev').addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
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
    // Limit to 4 weeks out
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 28);
    if (calendarYear > maxDate.getFullYear() || (calendarYear === maxDate.getFullYear() && calendarMonth > maxDate.getMonth())) {
        calendarMonth = maxDate.getMonth();
        calendarYear = maxDate.getFullYear();
    }
    renderCalendar();
});

function formatDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

function formatDateDisplay(dateStr) {
    const parts = dateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

async function selectDate(dateStr, btn) {
    state.selectedDate = dateStr;
    state.selectedTime = null;

    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
    btn.classList.add('selected');

    document.getElementById('selectedDateLabel').textContent = formatDateDisplay(dateStr);

    await loadTimeSlots(dateStr);
}

async function loadTimeSlots(dateStr) {
    const slots = document.querySelectorAll('.time-slot');

    slots.forEach(s => {
        s.disabled = false;
        s.classList.remove('selected', 'booked');
    });

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
    }

    slots.forEach(s => {
        if (!s.disabled) {
            s.onclick = () => selectTimeSlot(s);
        }
    });

    document.getElementById('btnToStep3').disabled = true;
}

function selectTimeSlot(btn) {
    state.selectedTime = btn.dataset.slot;
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('btnToStep3').disabled = false;
}

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

    const name = document.getElementById('custName');
    const errName = document.getElementById('errName');
    if (!name.value.trim() || name.value.trim().length < 2) {
        errName.textContent = 'Please enter your full name';
        name.classList.add('invalid');
        valid = false;
    } else { errName.textContent = ''; name.classList.remove('invalid'); }

    const phone = document.getElementById('custPhone');
    const errPhone = document.getElementById('errPhone');
    const phoneDigits = phone.value.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        errPhone.textContent = 'Enter a valid 10-digit phone number';
        phone.classList.add('invalid');
        valid = false;
    } else { errPhone.textContent = ''; phone.classList.remove('invalid'); }

    const email = document.getElementById('custEmail');
    const errEmail = document.getElementById('errEmail');
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        errEmail.textContent = 'Enter a valid email address';
        email.classList.add('invalid');
        valid = false;
    } else { errEmail.textContent = ''; email.classList.remove('invalid'); }

    const address = document.getElementById('custAddress');
    const errAddress = document.getElementById('errAddress');
    if (!address.value.trim() || address.value.trim().length < 5) {
        errAddress.textContent = 'Please enter your address';
        address.classList.add('invalid');
        valid = false;
    } else if (addressIsInArea === false) {
        errAddress.textContent = 'This address is outside our service area';
        address.classList.add('invalid');
        valid = false;
    } else if (addressSelectedCoords === null) {
        errAddress.textContent = 'Please select an address from the dropdown suggestions';
        address.classList.add('invalid');
        valid = false;
    } else { errAddress.textContent = ''; address.classList.remove('invalid'); }

    return valid;
}

// Phone formatting
document.getElementById('custPhone').addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.length > 10) val = val.substring(0, 10);
    if (val.length >= 6) {
        this.value = '(' + val.substring(0, 3) + ') ' + val.substring(3, 6) + '-' + val.substring(6);
    } else if (val.length >= 3) {
        this.value = '(' + val.substring(0, 3) + ') ' + val.substring(3);
    }
});

// ===== ADDRESS AUTOCOMPLETE =====
const PARKLAND_LAT = 26.3101;
const PARKLAND_LNG = -80.2371;
const MAX_DISTANCE_MILES = 25;

let addressDebounceTimer = null;
let addressSelectedCoords = null;
let addressIsInArea = null;
let highlightedIndex = -1;
let currentSuggestions = [];

const addressInput = document.getElementById('custAddress');
const addressDropdown = document.getElementById('addressDropdown');
const outOfAreaBanner = document.getElementById('outOfAreaBanner');

// Haversine formula — distance in miles between two lat/lng points
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Fetch address suggestions from Photon (OSM autocomplete, free, no API key)
async function fetchAddressSuggestions(query) {
    const url = 'https://photon.komoot.io/api/?' + new URLSearchParams({
        q: query,
        limit: 7,
        lat: PARKLAND_LAT,
        lon: PARKLAND_LNG,
        lang: 'en'
    });

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Geocoding failed');
    const data = await resp.json();

    // Filter to Florida-only results
    return data.features.filter(function (f) {
        var p = f.properties;
        return p.state && p.state.toLowerCase().includes('florida');
    });
}

// Format a Photon feature into a display string
function formatPhotonAddress(feature) {
    var p = feature.properties;
    var parts = [];

    // Build street address
    if (p.housenumber && p.street) {
        parts.push(p.housenumber + ' ' + p.street);
    } else if (p.street) {
        parts.push(p.street);
    } else if (p.name && p.name !== p.city) {
        parts.push(p.name);
    }

    if (p.city) parts.push(p.city);
    if (p.state) parts.push(p.state);
    if (p.postcode) parts.push(p.postcode);

    return parts.join(', ');
}

// Show dropdown
function showDropdown() {
    addressDropdown.classList.add('visible');
}

function hideDropdown() {
    addressDropdown.classList.remove('visible');
    highlightedIndex = -1;
}

// Render suggestions
function renderSuggestions(results) {
    currentSuggestions = results;
    highlightedIndex = -1;
    addressDropdown.innerHTML = '';

    if (results.length === 0) {
        addressDropdown.innerHTML = '<div class="no-results">No addresses found. Try being more specific.</div>';
        showDropdown();
        return;
    }

    results.forEach(function (result, index) {
        const item = document.createElement('div');
        item.className = 'address-suggestion';
        item.dataset.index = index;

        var p = result.properties;
        // Build main line (street address or name)
        var main = '';
        if (p.housenumber && p.street) {
            main = p.housenumber + ' ' + p.street;
        } else if (p.street) {
            main = p.street;
        } else if (p.name) {
            main = p.name;
        }

        // Build secondary line (city, state, zip)
        var secondaryParts = [];
        if (p.city && p.city !== main) secondaryParts.push(p.city);
        if (p.county) secondaryParts.push(p.county);
        if (p.state) secondaryParts.push(p.state);
        if (p.postcode) secondaryParts.push(p.postcode);
        var secondary = secondaryParts.join(', ');

        item.innerHTML =
            '<span class="suggestion-main">' + escapeHtml(main || p.name || 'Unknown') + '</span>' +
            '<span class="suggestion-secondary">' + escapeHtml(secondary) + '</span>';

        item.addEventListener('click', function () {
            selectAddress(result);
        });

        item.addEventListener('mouseenter', function () {
            highlightedIndex = index;
            updateHighlight();
        });

        addressDropdown.appendChild(item);
    });

    showDropdown();
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateHighlight() {
    var items = addressDropdown.querySelectorAll('.address-suggestion');
    items.forEach(function (el, i) {
        el.classList.toggle('highlighted', i === highlightedIndex);
    });
}

// Select an address from dropdown
function selectAddress(result) {
    // Photon uses GeoJSON: coordinates are [lng, lat]
    const coords = result.geometry.coordinates;
    const lat = coords[1];
    const lng = coords[0];
    addressSelectedCoords = { lat: lat, lng: lng };

    // Build clean display address
    addressInput.value = formatPhotonAddress(result);
    hideDropdown();

    // Calculate distance
    const distance = haversineDistance(PARKLAND_LAT, PARKLAND_LNG, lat, lng);
    const distanceMiles = Math.round(distance * 10) / 10;

    // Remove any previous in-area indicator
    var existingInArea = document.querySelector('.address-in-area');
    if (existingInArea) existingInArea.remove();

    if (distance > MAX_DISTANCE_MILES) {
        addressIsInArea = false;
        outOfAreaBanner.style.display = 'flex';
        addressInput.classList.add('invalid');
        document.getElementById('errAddress').textContent = '';
    } else {
        addressIsInArea = true;
        outOfAreaBanner.style.display = 'none';
        addressInput.classList.remove('invalid');
        document.getElementById('errAddress').textContent = '';

        // Show "in area" confirmation
        var inAreaEl = document.createElement('div');
        inAreaEl.className = 'address-in-area';
        inAreaEl.textContent = '✅ Within service area (' + distanceMiles + ' miles from Parkland)';
        addressInput.closest('.form-field').appendChild(inAreaEl);
    }
}

// Debounced input handler
addressInput.addEventListener('input', function () {
    var query = this.value.trim();

    // Reset state when user types manually after a selection
    addressSelectedCoords = null;
    addressIsInArea = null;
    outOfAreaBanner.style.display = 'none';
    var existingInArea = document.querySelector('.address-in-area');
    if (existingInArea) existingInArea.remove();

    if (addressDebounceTimer) clearTimeout(addressDebounceTimer);

    if (query.length < 3) {
        hideDropdown();
        return;
    }

    // Show loading indicator
    addressDropdown.innerHTML = '<div class="address-loading">Searching addresses</div>';
    showDropdown();

    addressDebounceTimer = setTimeout(async function () {
        try {
            var results = await fetchAddressSuggestions(query);
            renderSuggestions(results);
        } catch (err) {
            console.warn('Address lookup failed:', err);
            addressDropdown.innerHTML = '<div class="no-results">Unable to search. Please type your full address.</div>';
        }
    }, 400);
});

// Keyboard navigation
addressInput.addEventListener('keydown', function (e) {
    if (!addressDropdown.classList.contains('visible') || currentSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, currentSuggestions.length - 1);
        updateHighlight();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
        updateHighlight();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < currentSuggestions.length) {
            selectAddress(currentSuggestions[highlightedIndex]);
        }
    } else if (e.key === 'Escape') {
        hideDropdown();
    }
});

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.address-autocomplete-wrap')) {
        hideDropdown();
    }
});

// ===== CONFIRMATION =====
function populateConfirmation() {
    const pkg = PACKAGES[state.selectedPackage];
    const price = pkg[state.vehicleType];

    document.getElementById('confirmPackage').textContent = pkg.name + ' (' + pkg.tier + ')';
    document.getElementById('confirmVehicle').textContent = state.vehicleType === 'sedan' ? '\u{1F697} Sedan' : '\u{1F699} SUV / Truck';
    document.getElementById('confirmPrice').textContent = '$' + price;
    document.getElementById('confirmDate').textContent = '\u{1F4C5} ' + formatDateDisplay(state.selectedDate);
    document.getElementById('confirmTime').textContent = '\u{1F550} ' + state.selectedTime;
    document.getElementById('confirmName').textContent = '\u{1F464} ' + state.customer.name;
    document.getElementById('confirmPhone').textContent = '\u{1F4F1} ' + state.customer.phone;
    document.getElementById('confirmEmail').textContent = state.customer.email ? '\u{1F4E7} ' + state.customer.email : '';
    document.getElementById('confirmAddress').textContent = '\u{1F4CD} ' + state.customer.address;
    document.getElementById('confirmNotes').textContent = state.customer.notes ? '\u{1F4DD} ' + state.customer.notes : '';
}

// ===== ANTI-SPAM CHECKS =====
function checkAntiSpam() {
    var honeypot = document.getElementById('website').value;
    if (honeypot) { console.warn('Honeypot triggered'); return false; }

    var elapsed = Date.now() - state.formLoadTime;
    if (elapsed < 5000) { console.warn('Form submitted too quickly'); return false; }

    var lastBooking = localStorage.getItem('sc_last_booking');
    if (lastBooking) {
        var diff = Date.now() - parseInt(lastBooking);
        if (diff < 600000) {
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

    if (!checkAntiSpam()) {
        showSuccess('SC-0000');
        return;
    }

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
        var existingSnap = await db.collection('bookings')
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

        var phoneLimitSnap = await db.collection('bookings')
            .where('phone', '==', state.customer.phone)
            .get();

        var todayBookings = [];
        var todayStr = formatDate(new Date());
        phoneLimitSnap.forEach(function (doc) {
            var d = doc.data();
            if (d.createdAt) {
                var created = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
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

        var docRef = await db.collection('bookings').add(booking);
        var bookingId = 'SC-' + docRef.id.substring(0, 8).toUpperCase();

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
    var pkg = PACKAGES[state.selectedPackage];
    var price = pkg[state.vehicleType];

    document.querySelectorAll('.step-panel').forEach(function (p) { p.classList.remove('active'); p.style.display = 'none'; });
    var successPanel = document.getElementById('stepSuccess');
    successPanel.style.display = 'block';
    successPanel.classList.add('active');

    document.getElementById('successId').textContent = 'Booking ID: ' + bookingId;
    document.getElementById('successDetails').innerHTML =
        '<p><strong>Package:</strong> ' + pkg.name + '</p>' +
        '<p><strong>Vehicle:</strong> ' + (state.vehicleType === 'sedan' ? 'Sedan' : 'SUV / Truck') + '</p>' +
        '<p><strong>Price:</strong> $' + price + ' (pay in person)</p>' +
        '<p><strong>Date:</strong> ' + formatDateDisplay(state.selectedDate) + '</p>' +
        '<p><strong>Time:</strong> ' + state.selectedTime + '</p>' +
        '<p><strong>Address:</strong> ' + state.customer.address + '</p>';

    document.querySelector('.booking-progress').style.display = 'none';
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== URL PARAMS FOR PRE-SELECTION =====
(function handleURLParams() {
    var params = new URLSearchParams(window.location.search);
    var pkg = params.get('package');
    var vehicle = params.get('vehicle');

    if (vehicle === 'suv') {
        document.querySelectorAll('.vehicle-option').forEach(function (o) { o.classList.remove('active'); });
        document.querySelector('[data-type="suv"]').classList.add('active');
        document.querySelector('[data-type="suv"] input').checked = true;
        state.vehicleType = 'suv';
        updatePrices();
    }

    if (pkg && PACKAGES[pkg]) {
        selectPackage(pkg);
    }
})();
