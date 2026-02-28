// ===== SUNCOAST MOBILE DETAILING — BOOKING SYSTEM =====

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

// ===== EMAILJS CONFIG =====
// TODO: Replace with your actual EmailJS public key, service ID, and template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

// ===== STATE =====
const state = {
    step: 1,
    vehicles: ['sedan'],  // Array of vehicle types, e.g. ['sedan','suv','sedan']
    selectedService: null,   // 'reset' or 'maintenance'
    selectedFrequency: null, // 'weekly', 'biweekly', 'monthly' (only for maintenance)
    selectedDate: null,
    selectedTime: null,
    customer: {},
    formLoadTime: Date.now()
};

const SERVICES = {
    reset: { name: 'Full Reset Detail', sedan: 120, suv: 150 },
    maintenance: { name: 'Maintenance Visit', sedan: 50, suv: 60 }
};

// Helper to get total from vehicle breakdown
function calcTotal() {
    if (!state.selectedService) return 0;
    const svc = SERVICES[state.selectedService];
    return state.vehicles.reduce((sum, v) => sum + svc[v], 0);
}

function getNumCars() { return state.vehicles.length; }

// Duration in minutes based on number of cars
const DURATION_MAP = {
    1: 60,   // 45-60 min → use 60
    2: 120,  // 90-120 min → use 120
    3: 180,  // 120-180 min → use 180
    4: 180   // 120-180 min → use 180
};

const COMMUTE_BUFFER = 45; // minutes

// ===== MOBILE NAV =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });
}

// ===== SERVICE CARD PRICES (show range since per-car type now) =====
function updatePrices() {
    document.querySelectorAll('.package-card').forEach(card => {
        const sedanPrice = card.dataset.sedan;
        const suvPrice = card.dataset.suv;
        card.querySelector('.price-amount').textContent = sedanPrice + '-$' + suvPrice;
    });
}
updatePrices();

// ===== VEHICLE BUILDER =====
const MAX_VEHICLES = 4;

function addVehicle() {
    if (state.vehicles.length >= MAX_VEHICLES) return;
    state.vehicles.push('sedan');
    renderVehicleCards();
}

function removeVehicle() {
    if (state.vehicles.length <= 1) return;
    state.vehicles.pop();
    renderVehicleCards();
}

function toggleVehicleType(index) {
    state.vehicles[index] = state.vehicles[index] === 'sedan' ? 'suv' : 'sedan';
    renderVehicleCards();
}

function renderVehicleCards() {
    const container = document.getElementById('vbCards');
    const countEl = document.getElementById('vbCount');
    const totalEl = document.getElementById('vbTotal');
    const minusBtn = document.getElementById('vbMinus');
    const plusBtn = document.getElementById('vbPlus');

    countEl.textContent = state.vehicles.length;
    minusBtn.disabled = state.vehicles.length <= 1;
    plusBtn.disabled = state.vehicles.length >= MAX_VEHICLES;

    let html = '';
    state.vehicles.forEach((type, i) => {
        const isSedan = type === 'sedan';
        html += '<div class="vb-card">';
        html += '<span class="vb-car-num">Vehicle ' + (i + 1) + '</span>';
        html += '<div class="vb-type-toggle">';
        html += '<button type="button" class="vb-type-btn' + (isSedan ? ' active' : '') + '" onclick="toggleVehicleType(' + i + ')">';
        html += '\u{1F697} Sedan</button>';
        html += '<button type="button" class="vb-type-btn' + (!isSedan ? ' active' : '') + '" onclick="toggleVehicleType(' + i + ')">';
        html += '\u{1F699} SUV/Truck</button>';
        html += '</div>';
        if (state.selectedService) {
            const price = SERVICES[state.selectedService][type];
            html += '<span class="vb-car-price">$' + price + '</span>';
        }
        html += '</div>';
    });
    container.innerHTML = html;

    // Update total
    if (state.selectedService) {
        const total = calcTotal();
        const sedanCount = state.vehicles.filter(v => v === 'sedan').length;
        const suvCount = state.vehicles.filter(v => v === 'suv').length;
        let breakdown = '';
        if (sedanCount > 0 && suvCount > 0) {
            breakdown = sedanCount + ' sedan' + (sedanCount > 1 ? 's' : '') + ' + ' + suvCount + ' SUV' + (suvCount > 1 ? 's' : '');
        } else if (suvCount > 0) {
            breakdown = suvCount + ' SUV' + (suvCount > 1 ? 's' : '');
        } else {
            breakdown = sedanCount + ' sedan' + (sedanCount > 1 ? 's' : '');
        }
        totalEl.innerHTML = '<span class="vb-total-label">' + breakdown + '</span><span class="vb-total-price">Total: $' + total + '</span>';
    } else {
        totalEl.innerHTML = '';
    }
}

// Initialize vehicle builder
renderVehicleCards();

// ===== FREQUENCY SELECTOR =====
document.querySelectorAll('.freq-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.freq-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        state.selectedFrequency = opt.dataset.freq;
    });
});

// ===== SERVICE SELECTION =====
function selectService(svc) {
    // For maintenance, require frequency selection
    if (svc === 'maintenance' && !state.selectedFrequency) {
        // Highlight frequency selector
        const freqSel = document.getElementById('freqSelector');
        freqSel.classList.add('freq-required');
        setTimeout(() => freqSel.classList.remove('freq-required'), 1500);
        return;
    }

    state.selectedService = svc;
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    const el = document.querySelector('[data-package="' + svc + '"]');
    if (el) el.classList.add('selected');
    setTimeout(() => goToStep(2), 350);
}

// Keep old function name for backward compat
function selectPackage(pkg) { selectService(pkg); }

// ===== STEP NAVIGATION =====
function goToStep(step) {
    if (step === 2 && !state.selectedService) return;
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

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const maxBookingDate = new Date(today);
    maxBookingDate.setDate(maxBookingDate.getDate() + 60); // Extended for recurring bookings

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

// ===== TIME SLOT LOGIC WITH DURATION & COMMUTE BUFFER =====
const ALL_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

function parseSlotToMinutes(slotStr) {
    const match = slotStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
}

function isSlotBlocked(slotMinutes, bookedBlocks) {
    // Check if this slot (1-hour window) overlaps with any booked block (including commute buffer)
    const slotStart = slotMinutes;
    const slotEnd = slotMinutes + 60; // each selectable slot represents 1 hour

    for (const block of bookedBlocks) {
        const blockStart = block.start - COMMUTE_BUFFER; // commute before
        const blockEnd = block.end + COMMUTE_BUFFER;     // commute after

        // Check overlap
        if (slotStart < blockEnd && slotEnd > blockStart) {
            return true;
        }
    }
    return false;
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

        // Build booked blocks with duration
        const bookedBlocks = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.archived) {
                const slotMinutes = parseSlotToMinutes(data.timeSlot);
                const numCars = data.numCars || 1;
                const duration = DURATION_MAP[numCars] || 60;
                bookedBlocks.push({
                    start: slotMinutes,
                    end: slotMinutes + duration
                });
            }
        });

        slots.forEach(s => {
            const slotMinutes = parseSlotToMinutes(s.dataset.slot);
            if (isSlotBlocked(slotMinutes, bookedBlocks)) {
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
        // numCars is now from vehicle builder
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
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        errEmail.textContent = 'Enter a valid email address';
        email.classList.add('invalid');
        valid = false;
    } else { errEmail.textContent = ''; email.classList.remove('invalid'); }

    const errNumCars = document.getElementById('errNumCars');
    if (state.vehicles.length < 1) {
        errNumCars.textContent = 'Please add at least one vehicle';
        valid = false;
    } else { errNumCars.textContent = ''; }

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

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function fetchAddressSuggestions(query) {
    const url = 'https://photon.komoot.io/api/?' + new URLSearchParams({
        q: query, limit: 7, lat: PARKLAND_LAT, lon: PARKLAND_LNG, lang: 'en'
    });
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Geocoding failed');
    const data = await resp.json();
    return data.features.filter(function (f) {
        var p = f.properties;
        return p.state && p.state.toLowerCase().includes('florida');
    });
}

function formatPhotonAddress(feature) {
    var p = feature.properties;
    var parts = [];
    if (p.housenumber && p.street) parts.push(p.housenumber + ' ' + p.street);
    else if (p.street) parts.push(p.street);
    else if (p.name && p.name !== p.city) parts.push(p.name);
    if (p.city) parts.push(p.city);
    if (p.state) parts.push(p.state);
    if (p.postcode) parts.push(p.postcode);
    return parts.join(', ');
}

function showDropdown() { addressDropdown.classList.add('visible'); }
function hideDropdown() { addressDropdown.classList.remove('visible'); highlightedIndex = -1; }

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
        var main = '';
        if (p.housenumber && p.street) main = p.housenumber + ' ' + p.street;
        else if (p.street) main = p.street;
        else if (p.name) main = p.name;
        var secondaryParts = [];
        if (p.city && p.city !== main) secondaryParts.push(p.city);
        if (p.county) secondaryParts.push(p.county);
        if (p.state) secondaryParts.push(p.state);
        if (p.postcode) secondaryParts.push(p.postcode);
        var secondary = secondaryParts.join(', ');
        item.innerHTML =
            '<span class="suggestion-main">' + escapeHtml(main || p.name || 'Unknown') + '</span>' +
            '<span class="suggestion-secondary">' + escapeHtml(secondary) + '</span>';
        item.addEventListener('click', function () { selectAddress(result); });
        item.addEventListener('mouseenter', function () { highlightedIndex = index; updateHighlight(); });
        addressDropdown.appendChild(item);
    });
    showDropdown();
}

function escapeHtml(str) { var div = document.createElement('div'); div.textContent = str; return div.innerHTML; }

function updateHighlight() {
    var items = addressDropdown.querySelectorAll('.address-suggestion');
    items.forEach(function (el, i) { el.classList.toggle('highlighted', i === highlightedIndex); });
}

function selectAddress(result) {
    const coords = result.geometry.coordinates;
    const lat = coords[1];
    const lng = coords[0];
    addressSelectedCoords = { lat: lat, lng: lng };
    addressInput.value = formatPhotonAddress(result);
    hideDropdown();
    const distance = haversineDistance(PARKLAND_LAT, PARKLAND_LNG, lat, lng);
    const distanceMiles = Math.round(distance * 10) / 10;
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
        var inAreaEl = document.createElement('div');
        inAreaEl.className = 'address-in-area';
        inAreaEl.textContent = '✅ Within service area (' + distanceMiles + ' miles from Parkland)';
        addressInput.closest('.form-field').appendChild(inAreaEl);
    }
}

addressInput.addEventListener('input', function () {
    var query = this.value.trim();
    addressSelectedCoords = null;
    addressIsInArea = null;
    outOfAreaBanner.style.display = 'none';
    var existingInArea = document.querySelector('.address-in-area');
    if (existingInArea) existingInArea.remove();
    if (addressDebounceTimer) clearTimeout(addressDebounceTimer);
    if (query.length < 3) { hideDropdown(); return; }
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
    } else if (e.key === 'Escape') { hideDropdown(); }
});

document.addEventListener('click', function (e) {
    if (!e.target.closest('.address-autocomplete-wrap')) hideDropdown();
});

// ===== CONFIRMATION =====
function getRecurringDates(startDateStr, frequency) {
    const intervals = { weekly: 7, biweekly: 14, monthly: 30 };
    const counts = { weekly: 4, biweekly: 2, monthly: 3 };
    const interval = intervals[frequency] || 7;
    const count = counts[frequency] || 4;

    const [y, m, d] = startDateStr.split('-').map(Number);
    const dates = [];
    for (let i = 0; i < count; i++) {
        const date = new Date(y, m - 1, d + (i * interval));
        dates.push(formatDate(date));
    }
    return dates;
}

function populateConfirmation() {
    const svc = SERVICES[state.selectedService];
    const totalPrice = calcTotal();
    const numCars = getNumCars();
    const isRecurring = state.selectedService === 'maintenance' && state.selectedFrequency;

    document.getElementById('confirmPackage').textContent = svc.name;

    // Build vehicle breakdown text
    const sedanCount = state.vehicles.filter(v => v === 'sedan').length;
    const suvCount = state.vehicles.filter(v => v === 'suv').length;
    let vehicleText = '';
    if (sedanCount > 0) vehicleText += '\u{1F697} ' + sedanCount + ' Sedan' + (sedanCount > 1 ? 's' : '');
    if (sedanCount > 0 && suvCount > 0) vehicleText += ' + ';
    if (suvCount > 0) vehicleText += '\u{1F699} ' + suvCount + ' SUV' + (suvCount > 1 ? 's' : '');
    document.getElementById('confirmVehicle').textContent = vehicleText;

    const freqEl = document.getElementById('confirmFrequency');
    if (isRecurring) {
        const freqLabels = { weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly' };
        const recurringDates = getRecurringDates(state.selectedDate, state.selectedFrequency);
        freqEl.innerHTML = '\u{1F504} Schedule: <strong>' + (freqLabels[state.selectedFrequency] || state.selectedFrequency) + '</strong> \u2014 ' + recurringDates.length + ' upcoming visits';
    } else {
        freqEl.textContent = '';
    }

    document.getElementById('confirmNumCars').textContent = '\u{1F697} ' + numCars + ' vehicle' + (numCars > 1 ? 's' : '');

    if (isRecurring) {
        const recurringDates = getRecurringDates(state.selectedDate, state.selectedFrequency);
        document.getElementById('confirmPrice').textContent = '$' + totalPrice + ' per visit \u00d7 ' + recurringDates.length + ' visits';
    } else {
        // Show per-car breakdown if mixed types
        if (numCars > 1 && sedanCount > 0 && suvCount > 0) {
            let breakdown = sedanCount + '\u00d7$' + svc.sedan + ' + ' + suvCount + '\u00d7$' + svc.suv;
            document.getElementById('confirmPrice').textContent = '$' + totalPrice + ' (' + breakdown + ')';
        } else {
            document.getElementById('confirmPrice').textContent = '$' + totalPrice;
        }
    }

    if (isRecurring) {
        document.getElementById('confirmDate').textContent = '\u{1F4C5} Starting: ' + formatDateDisplay(state.selectedDate);
        document.getElementById('confirmTime').textContent = '\u{1F550} Default time: ' + state.selectedTime;
    } else {
        document.getElementById('confirmDate').textContent = '\u{1F4C5} ' + formatDateDisplay(state.selectedDate);
        document.getElementById('confirmTime').textContent = '\u{1F550} ' + state.selectedTime;
    }

    document.getElementById('confirmName').textContent = '\u{1F464} ' + state.customer.name;
    document.getElementById('confirmPhone').textContent = '\u{1F4F1} ' + state.customer.phone;
    document.getElementById('confirmEmail').textContent = '\u{1F4E7} ' + state.customer.email;
    document.getElementById('confirmAddress').textContent = '\u{1F4CD} ' + state.customer.address;
    document.getElementById('confirmNotes').textContent = state.customer.notes ? '\u{1F4DD} ' + state.customer.notes : '';

    // Remove any previously inserted recurring editor
    const existingRecurring = document.querySelector('.confirm-recurring');
    if (existingRecurring) existingRecurring.remove();

    // Build editable visit schedule for recurring
    if (isRecurring) {
        const recurringDates = getRecurringDates(state.selectedDate, state.selectedFrequency);
        let editorHtml = '<div class="confirm-recurring">';
        editorHtml += '<h4>\u{1F4C5} Your Upcoming Visits</h4>';
        editorHtml += '<p class="recurring-hint">You can change the time for each visit below. Available slots are based on existing bookings.</p>';
        editorHtml += '<div class="recurring-visits">';
        recurringDates.forEach((d, i) => {
            editorHtml += '<div class="recurring-visit-row" data-visit-index="' + i + '" data-visit-date="' + d + '">';
            editorHtml += '<span class="visit-date">' + formatDateDisplay(d) + '</span>';
            editorHtml += '<select class="visit-time-select" id="visitTime_' + i + '" data-date="' + d + '">';
            ALL_SLOTS.forEach(slot => {
                editorHtml += '<option value="' + slot + '"' + (slot === state.selectedTime ? ' selected' : '') + '>' + slot + '</option>';
            });
            editorHtml += '</select>';
            editorHtml += '<span class="visit-status" id="visitStatus_' + i + '">Checking...</span>';
            editorHtml += '</div>';
        });
        editorHtml += '</div></div>';
        document.getElementById('confirmPrice').insertAdjacentHTML('afterend', editorHtml);

        // Load availability for each visit date
        recurringDates.forEach((d, i) => loadVisitAvailability(d, i));
    }
}

// Load availability for a specific visit date and disable taken slots
async function loadVisitAvailability(dateStr, visitIndex) {
    const select = document.getElementById('visitTime_' + visitIndex);
    const statusEl = document.getElementById('visitStatus_' + visitIndex);
    if (!select || !statusEl) return;

    try {
        const snapshot = await db.collection('bookings')
            .where('date', '==', dateStr)
            .where('status', 'in', ['pending', 'confirmed'])
            .get();

        const bookedBlocks = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.archived) {
                const slotMinutes = parseSlotToMinutes(data.timeSlot);
                const numCars = data.numCars || 1;
                const duration = DURATION_MAP[numCars] || 60;
                bookedBlocks.push({ start: slotMinutes, end: slotMinutes + duration });
            }
        });

        let availableCount = 0;
        Array.from(select.options).forEach(opt => {
            const slotMinutes = parseSlotToMinutes(opt.value);
            if (isSlotBlocked(slotMinutes, bookedBlocks)) {
                opt.disabled = true;
                opt.textContent = opt.value + ' (taken)';
                // If this was the selected one, pick the first available
                if (opt.selected) {
                    opt.selected = false;
                }
            } else {
                availableCount++;
            }
        });

        // Select first available if current is disabled
        if (select.selectedOptions[0] && select.selectedOptions[0].disabled) {
            const firstAvail = Array.from(select.options).find(o => !o.disabled);
            if (firstAvail) firstAvail.selected = true;
        }

        statusEl.textContent = availableCount > 0 ? '\u2705' : '\u274C No slots';
        statusEl.className = 'visit-status ' + (availableCount > 0 ? 'visit-ok' : 'visit-full');
    } catch (err) {
        console.warn('Could not load availability for', dateStr, err);
        statusEl.textContent = '\u2705';
        statusEl.className = 'visit-status visit-ok';
    }
}

// ===== ANTI-SPAM CHECKS =====
function checkAntiSpam() {
    // Note: honeypot check is done separately in submitBooking
    var elapsed = Date.now() - state.formLoadTime;
    if (elapsed < 3000) {
        console.warn('Form submitted too quickly (' + elapsed + 'ms)');
        alert('Please slow down and review your booking details before confirming.');
        return false;
    }
    var lastBooking = localStorage.getItem('sc_last_booking');
    if (lastBooking) {
        var diff = Date.now() - parseInt(lastBooking);
        if (diff < 120000) { // 2 minutes cooldown
            alert('You recently submitted a booking. Please wait a couple minutes before booking again.');
            return false;
        }
    }
    return true;
}

// ===== CUSTOMER RECORD (phone as user ID) =====
async function ensureCustomerRecord(customerData) {
    const phoneKey = customerData.phone; // digits only
    try {
        const customerRef = db.collection('customers').doc(phoneKey);
        const customerDoc = await customerRef.get();

        if (customerDoc.exists) {
            // Update with latest info
            await customerRef.update({
                name: customerData.name,
                email: customerData.email,
                address: customerData.address,
                lastBooking: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Create new customer record
            await customerRef.set({
                name: customerData.name,
                phone: phoneKey,
                email: customerData.email,
                address: customerData.address,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastBooking: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        return phoneKey;
    } catch (err) {
        console.warn('Customer record error:', err);
        return phoneKey;
    }
}

// ===== SEND CONFIRMATION EMAIL =====
async function sendConfirmationEmail(bookingId, bookingData, recurringDates) {
    if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.log('EmailJS not configured — skipping confirmation email');
        return;
    }

    try {
        const svc = SERVICES[bookingData.serviceType];
        const freqLabels = { weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly' };
        const frequencyText = bookingData.frequency ? freqLabels[bookingData.frequency] : 'One-time';

        let scheduleInfo = formatDateDisplay(bookingData.date) + ' at ' + bookingData.timeSlot;
        if (recurringDates && recurringDates.length > 1) {
            scheduleInfo = frequencyText + ' starting ' + formatDateDisplay(bookingData.date) + ' at ' + bookingData.timeSlot + ' (' + recurringDates.length + ' visits scheduled)';
        }

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: bookingData.email,
            to_name: bookingData.name,
            booking_id: bookingId,
            service_type: svc ? svc.name : bookingData.serviceType,
            vehicle_type: bookingData.vehicleType === 'sedan' ? 'Sedan' : 'SUV / Truck',
            frequency: frequencyText,
            num_cars: bookingData.numCars,
            date: scheduleInfo,
            time: bookingData.timeSlot,
            address: bookingData.address,
            price: '$' + bookingData.price,
            reply_to: 'mail.suncoastmobile@gmail.com'
        });
        console.log('Confirmation email sent to', bookingData.email);
    } catch (err) {
        console.warn('Email send failed:', err);
    }
}

// ===== SUBMIT BOOKING =====
async function submitBooking() {
    const btn = document.getElementById('btnConfirmBooking');
    const btnText = document.getElementById('confirmBtnText');
    const spinner = document.getElementById('confirmSpinner');

    // Honeypot check — show fake success to fool bots
    var honeypot = document.getElementById('website').value;
    if (honeypot) {
        console.warn('Honeypot triggered — likely bot submission');
        showSuccess('SC-0000');
        return;
    }

    // Real anti-spam checks — show alerts for real users
    if (!checkAntiSpam()) {
        return;
    }

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    const svc = SERVICES[state.selectedService];
    const totalPrice = calcTotal();
    const numCars = getNumCars();

    // Determine all dates to book
    const isRecurring = state.selectedService === 'maintenance' && state.selectedFrequency;
    const allDates = isRecurring
        ? getRecurringDates(state.selectedDate, state.selectedFrequency)
        : [state.selectedDate];

    // Generate a recurring group ID
    const recurringGroupId = isRecurring
        ? 'RG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
        : null;

    try {
        // Check first slot availability
        var existingSnap = await db.collection('bookings')
            .where('date', '==', state.selectedDate)
            .where('timeSlot', '==', state.selectedTime)
            .where('status', 'in', ['pending', 'confirmed'])
            .get();

        let actualConflicts = [];
        existingSnap.forEach(doc => {
            const d = doc.data();
            if (!d.archived) actualConflicts.push(d);
        });

        if (actualConflicts.length > 0) {
            alert('This time slot was just booked. Please choose a different time.');
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
            goToStep(2);
            return;
        }

        // Rate limiting by phone
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

        // Ensure customer record
        await ensureCustomerRecord(state.customer);

        // Create all bookings (single or recurring)
        let firstBookingId = null;
        const batch = db.batch();
        const visitTimes = []; // collect per-visit times for success screen

        for (let i = 0; i < allDates.length; i++) {
            const bookingDate = allDates[i];
            const docRef = db.collection('bookings').doc();

            // Get the per-visit time from the editor, fallback to default
            let visitTime = state.selectedTime;
            if (isRecurring) {
                const visitSelect = document.getElementById('visitTime_' + i);
                if (visitSelect) visitTime = visitSelect.value;
            }
            visitTimes.push(visitTime);

            const booking = {
                name: state.customer.name,
                phone: state.customer.phone,
                email: state.customer.email,
                address: state.customer.address,
                notes: state.customer.notes || '',
                serviceType: state.selectedService,
                serviceName: svc.name,
                frequency: state.selectedFrequency || null,
                numCars: getNumCars(),
                vehicles: state.vehicles.slice(), // array copy
                vehicleType: state.vehicles[0],  // primary vehicle for backward compat
                price: totalPrice,
                pricePerCar: totalPrice / getNumCars(),
                date: bookingDate,
                timeSlot: visitTime,
                status: 'pending',
                archived: false,
                recurring: isRecurring,
                recurringGroupId: recurringGroupId,
                recurringIndex: isRecurring ? i : null,
                recurringTotal: isRecurring ? allDates.length : null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                honeypot: document.getElementById('website').value
            };

            batch.set(docRef, booking);
            if (i === 0) firstBookingId = 'SC-' + docRef.id.substring(0, 8).toUpperCase();
        }

        await batch.commit();
        console.log('Created ' + allDates.length + ' booking(s)' + (recurringGroupId ? ' in group ' + recurringGroupId : ''));

        localStorage.setItem('sc_last_booking', Date.now().toString());

        // Send confirmation email (with all dates for recurring)
        const emailData = {
            name: state.customer.name,
            email: state.customer.email,
            serviceType: state.selectedService,
            vehicleType: state.vehicles[0],
            vehicles: state.vehicles.slice(),
            frequency: state.selectedFrequency,
            numCars: getNumCars(),
            date: state.selectedDate,
            timeSlot: state.selectedTime,
            address: state.customer.address,
            price: totalPrice
        };
        await sendConfirmationEmail(firstBookingId, emailData, allDates);

        showSuccess(firstBookingId, allDates, visitTimes);

    } catch (err) {
        console.error('Booking error:', err);
        alert('There was an error submitting your booking. Please try again or call us at (954) 554-7462.');
        btn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

function showSuccess(bookingId, allDates, visitTimes) {
    var svc = SERVICES[state.selectedService];
    var totalPrice = calcTotal();
    var numCars = getNumCars();
    var freqLabels = { weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly' };
    var isRecurring = state.selectedService === 'maintenance' && state.selectedFrequency;

    document.querySelectorAll('.step-panel').forEach(function (p) { p.classList.remove('active'); p.style.display = 'none'; });
    var successPanel = document.getElementById('stepSuccess');
    successPanel.style.display = 'block';
    successPanel.classList.add('active');

    document.getElementById('successId').textContent = 'Booking ID: ' + bookingId;

    // Build vehicle breakdown
    var sedanCount = state.vehicles.filter(function (v) { return v === 'sedan'; }).length;
    var suvCount = state.vehicles.filter(function (v) { return v === 'suv'; }).length;
    var vehicleText = '';
    if (sedanCount > 0) vehicleText += sedanCount + ' Sedan' + (sedanCount > 1 ? 's' : '');
    if (sedanCount > 0 && suvCount > 0) vehicleText += ', ';
    if (suvCount > 0) vehicleText += suvCount + ' SUV' + (suvCount > 1 ? 's' : '');

    var detailsHtml =
        '<p><strong>Service:</strong> ' + svc.name + '</p>' +
        '<p><strong>Vehicles:</strong> ' + vehicleText + '</p>';

    if (isRecurring) {
        detailsHtml += '<p><strong>Schedule:</strong> ' + (freqLabels[state.selectedFrequency] || state.selectedFrequency) + '</p>';
    }

    detailsHtml +=
        '<p><strong>Price:</strong> $' + totalPrice + ' per visit (pay in person)</p>' +
        '<p><strong>Address:</strong> ' + state.customer.address + '</p>';

    if (isRecurring && allDates && allDates.length > 1) {
        detailsHtml += '<div class="success-recurring"><p><strong>\u{1F4C5} ' + allDates.length + ' visits scheduled:</strong></p><ul>';
        allDates.forEach(function (d, i) {
            var time = (visitTimes && visitTimes[i]) ? visitTimes[i] : state.selectedTime;
            detailsHtml += '<li>' + formatDateDisplay(d) + ' at ' + time + '</li>';
        });
        detailsHtml += '</ul></div>';
    } else {
        detailsHtml += '<p><strong>Date:</strong> ' + formatDateDisplay(state.selectedDate) + '</p>';
        detailsHtml += '<p><strong>Time:</strong> ' + state.selectedTime + '</p>';
    }

    document.getElementById('successDetails').innerHTML = detailsHtml;

    document.querySelector('.booking-progress').style.display = 'none';
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== URL PARAMS FOR PRE-SELECTION =====
(function handleURLParams() {
    var params = new URLSearchParams(window.location.search);
    var service = params.get('service');
    var vehicle = params.get('vehicle');
    var frequency = params.get('frequency');

    // Legacy support
    var pkg = params.get('package');
    if (pkg === 'basic' || pkg === 'wax') service = 'maintenance';
    if (pkg === 'full') service = 'reset';

    if (vehicle === 'suv') {
        state.vehicles = ['suv'];
        renderVehicleCards();
    }

    if (service === 'reset') {
        // Auto-select reset and go to calendar
        state.selectedService = 'reset';
        document.querySelector('[data-package="reset"]').classList.add('selected');
        setTimeout(() => goToStep(2), 300);
    } else if (service === 'maintenance') {
        if (frequency) {
            // Pre-select frequency and auto-advance to calendar
            state.selectedFrequency = frequency;
            var freqOpt = document.querySelector('[data-freq="' + frequency + '"]');
            if (freqOpt) {
                freqOpt.classList.add('active');
                var radio = freqOpt.querySelector('input');
                if (radio) radio.checked = true;
            }
            state.selectedService = 'maintenance';
            document.querySelector('[data-package="maintenance"]').classList.add('selected');
            setTimeout(() => goToStep(2), 300);
        } else {
            // Just highlight maintenance card, user still needs to pick frequency
            document.querySelector('[data-package="maintenance"]').classList.add('selected');
        }
    }
})();
