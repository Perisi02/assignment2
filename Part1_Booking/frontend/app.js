const map = document.getElementById('map');
const loader = document.getElementById('loader');
const popup = document.getElementById('popup');
const visitorName = document.getElementById('visitorName');
const visitorPartySize = document.getElementById('visitorPartySize');
const bookingsContainer = document.getElementById('bookingsContainer');

let tours = [];
let userBookings = [];

// Load tours from backend
async function loadTours() {
    try {
        const res = await fetch('http://localhost:3000/api/tours');
        if (!res.ok) throw new Error('Failed to fetch tours');
        tours = await res.json();

        loader.classList.add('d-none');
        map.classList.remove('d-none');
        map.innerHTML = '';

        tours.forEach((tour) => {
            const div = document.createElement('div');
            div.className = 'marina';
            div.style.left = tour.x + 'px';
            div.style.top = tour.y + 'px';

            // Set dot color based on available capacity (hue)
            const maxCapacity = Math.max(...tour.capacity);
            const requested = parseInt(visitorPartySize.value || 1);
            let hue = 120; // green
            if (maxCapacity === 0) hue = 0; // red
            else if (maxCapacity < requested) hue = 30; // orange
            div.style.backgroundColor = `hsl(${hue} 80% 50%)`;

            // Show popup function
            const showPopup = () => {
                const currentTour = tours.find(t => t.x === parseInt(div.style.left) && t.y === parseInt(div.style.top));
                if (!currentTour) return;
                
                popup.classList.remove('d-none');
                popup.innerHTML = '';
                popup.style.left = (currentTour.x + 25) + 'px';
                popup.style.top = (currentTour.y - 10) + 'px';
                // decide if the tour can handle the requested party size
                const reqNow = parseInt(visitorPartySize.value || 1);
                const canAccommodate = Math.max(...currentTour.capacity) >= reqNow;

                popup.innerHTML = `
                    <img src="${currentTour.image}" alt="${currentTour.operator} at ${currentTour.marina}" onerror="this.style.display='none'">
                    <div class="popup-content">
                        <h4 class="mb-2">${currentTour.operator}</h4>
                        <p class="mb-1"><strong>Marina:</strong> ${currentTour.marina}</p>
                        <p class="mb-1"><strong>Times:</strong> ${currentTour.times.join(', ')}</p>
                        <p class="mb-2"><strong>Capacity:</strong> ${currentTour.capacity.join(', ')}</p>
                        <div id="popupError" class="text-danger small mb-2" style="display: ${canAccommodate ? 'none' : 'block'};">Cannot accommodate party size of ${reqNow}</div>
                        <button class="bookNowBtn btn btn-primary btn-block" data-tour-id="${currentTour.id}" ${canAccommodate ? '' : 'disabled'}>Book Now</button>
                    </div>
                `;

                const btn = popup.querySelector('.bookNowBtn');
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        const tourId = parseInt(e.target.dataset.tourId);
                        openBookingForm(tourId);
                        popup.classList.add('d-none');
                    });
                }
            };

            // Hover events
            let hideTimeout;
            
            const clearHideTimeout = () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
            };

            const startHideTimeout = () => {
                clearHideTimeout();
                hideTimeout = setTimeout(() => {
                    if (!popup.matches(':hover') && !div.matches(':hover')) {
                        popup.classList.add('d-none');
                    }
                }, 300);
            };

            div.addEventListener('mouseenter', () => {
                clearHideTimeout();
                showPopup();
            });

            popup.addEventListener('mouseenter', () => {
                clearHideTimeout();
            });

            div.addEventListener('mouseleave', startHideTimeout);
            popup.addEventListener('mouseleave', startHideTimeout);

            map.appendChild(div);
        });

    } catch (err) {
        console.error(err);
    }
}

loadTours();

// Open booking form
function openBookingForm(tourId) {
    const tour = tours.find(t => t.id === tourId);
    const launchSelect = document.getElementById('launchTime');
    launchSelect.innerHTML = '';

    tour.times.forEach((time, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.text = `${time} (${tour.capacity[idx]} seats left)`;
        if (tour.capacity[idx] === 0) option.disabled = true;
        launchSelect.add(option);
    });

    document.getElementById('bookingForm').classList.remove('d-none');
    document.getElementById('bookingForm').dataset.tourId = tourId;

    // Prefill from top inputs
    const nameInput = document.getElementById('name');
    const partyInput = document.getElementById('partySize');
    nameInput.value = visitorName.value || '';
    partyInput.value = visitorPartySize.value || 1;

    // Clear any previous booking error
    const bookingError = document.getElementById('bookingError');
    if (bookingError) bookingError.textContent = '';

    updateLaunchOptions();
}

// Close booking form
function closeBookingForm() {
    document.getElementById('bookingForm').classList.add('d-none');
}

// Update launch options based on party size
document.getElementById('partySize').addEventListener('input', updateLaunchOptions);

function updateLaunchOptions() {
    const partySize = parseInt(document.getElementById('partySize').value);
    const tourId = parseInt(document.getElementById('bookingForm').dataset.tourId);
    const tour = tours.find(t => t.id === tourId);
    const launchSelect = document.getElementById('launchTime');

    tour.times.forEach((time, idx) => {
        launchSelect.options[idx].disabled = tour.capacity[idx] < partySize;
    });
}

// Submit booking
// Load bookings
async function loadBookings() {
    try {
        const res = await fetch('http://localhost:3000/api/bookings');
        if (!res.ok) throw new Error('Failed to fetch bookings');
        userBookings = await res.json();
        displayBookings();
    } catch (err) {
        console.error(err);
    }
}

// Display bookings in the list
function displayBookings() {
    bookingsContainer.innerHTML = userBookings.length === 0 
        ? '<p class="text-muted">No bookings yet</p>'
        : userBookings.map(booking => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${booking.operator} - ${booking.marina}</h6>
                        <small>Time: ${booking.time} | Party Size: ${booking.partySize}</small>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>
                </div>
            </div>
        `).join('');
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const res = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            loadBookings();
            loadTours();
        } else {
            alert('Failed to cancel booking');
        }
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('submitBooking').addEventListener('click', async () => {
    const tourId = parseInt(document.getElementById('bookingForm').dataset.tourId);
    const name = document.getElementById('name').value || visitorName.value || '';
    const partySize = parseInt(document.getElementById('partySize').value || visitorPartySize.value || 1);
    const timeIndex = parseInt(document.getElementById('launchTime').value);
    const bookingError = document.getElementById('bookingError');
    if (bookingError) bookingError.textContent = '';

    try {
        const res = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, tourId, timeIndex, partySize })
        });

        const data = await res.json();

        if (res.ok) {
            // show booking summary in messageArea
            const messageArea = document.getElementById('messageArea');
            if (messageArea) {
                messageArea.innerHTML = `
                    <div class="card border-success mb-3" style="max-width: 22rem;">
                        <div class="card-header bg-success text-white">Booking Confirmed</div>
                        <div class="card-body text-success">
                            <h5 class="card-title">${data.operator} — ${data.marina}</h5>
                            <p class="card-text mb-1"><strong>Time:</strong> ${data.time}</p>
                            <p class="card-text mb-1"><strong>Party Size:</strong> ${data.partySize}</p>
                        </div>
                    </div>
                `;
                // auto-clear after 6s
                setTimeout(() => { if (messageArea) messageArea.innerHTML = ''; }, 6000);
            }

            closeBookingForm();
            loadTours();
            loadBookings();
        } else {
            if (bookingError) bookingError.textContent = data.error || 'Booking failed';
        }
    } catch (err) {
        console.error(err);
    }
});

// Update dots when party size changes
visitorPartySize.addEventListener('input', () => {
    loadTours();
});

// Initial load
loadTours();
loadBookings();


