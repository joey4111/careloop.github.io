// =============================================
// CARELOOP FRONTEND - API INTEGRATED VERSION
// This version connects to the backend API instead of localStorage
// =============================================

// Sample caregiver data structure (for reference only - data comes from API now)
const caregivers = [];

// Global variables
let selectedCaregiver = null;
let currentUser = null;
let currentCaregiver = null;
let acceptedJobs = [];
let completedJobs = [];
let uploadedCertificates = [];
let uploadedIdFile = null;
let bookingHistory = [];
let currentRating = 0;
let currentJobToRate = null;
let currentChatPerson = null;
let currentChatRole = null;
let currentThreadId = null;
let dashboardRefreshInterval = null;

// Initialize app
async function initializeApp() {
    // Check if user or caregiver is logged in (stored in sessionStorage temporarily)
    const storedUser = sessionStorage.getItem('currentUser');
    const storedCaregiver = sessionStorage.getItem('currentCaregiver');
    
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        document.getElementById('user-profile-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
        showPage('browse-caregivers');
    } else if (storedCaregiver) {
        currentCaregiver = JSON.parse(storedCaregiver);
        document.getElementById('caregiver-profile-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
        showPage('caregiver-dashboard');
    } else {
        showPage('home');
    }
}

// Global variable for selected care type
let selectedCareType = '';

// Select care type and browse caregivers
function selectCareType(careType) {
    selectedCareType = careType;
    
    // Store in sessionStorage
    sessionStorage.setItem('selectedCareType', careType);
    
    // Update care type select if it exists
    const careTypeSelect = document.getElementById('care-type');
    if (careTypeSelect) {
        careTypeSelect.value = careType;
    }
    
    // Go to browse caregivers page
    showPage('browse-caregivers');
}

// Toggle location input
function toggleLocationInput() {
    const locationInput = document.getElementById('booking-location');
    const defaultDisplay = document.getElementById('default-location-display');
    const customRadio = document.querySelector('input[name="location-option"][value="custom"]');
    
    if (customRadio && customRadio.checked) {
        locationInput.style.display = 'block';
    } else {
        locationInput.style.display = 'none';
    }
}

// =============================================
// USER AUTHENTICATION
// =============================================

// User login
async function loginUser() {
    const email = document.getElementById('user-login-email').value.trim();
    const password = document.getElementById('user-login-password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.USER_LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        currentUser = response.user;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        document.getElementById('user-profile-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
        
        // Show care type selection page instead of directly browsing
        showPage('care-type-selection');
    } catch (error) {
        alert('Invalid email or password. Please try again or sign up for a new account.');
        console.error('Login error:', error);
    }
}

// User signup
async function completeUserSignup() {
    const name = document.getElementById('user-name').value.trim();
    const gender = document.getElementById('user-gender').value;
    const email = document.getElementById('user-email').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const location = document.getElementById('user-location').value.trim();
    const password = document.getElementById('user-password').value;

    if (!name || !gender || !email || !phone || !location || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.USER_REGISTER, {
            method: 'POST',
            body: JSON.stringify({ name, gender, email, phone, location, password })
        });
        
        currentUser = response.user;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

        document.getElementById('user-profile-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
        
        showPage('care-details');
    } catch (error) {
        alert(error.message || 'Registration failed. Please try again.');
        console.error('Registration error:', error);
    }
}

// =============================================
// CAREGIVER AUTHENTICATION
// =============================================

// Caregiver login
async function loginCaregiver() {
    const email = document.getElementById('caregiver-login-email').value.trim();
    const password = document.getElementById('caregiver-login-password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.CAREGIVER_LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        currentCaregiver = response.caregiver;
        sessionStorage.setItem('currentCaregiver', JSON.stringify(currentCaregiver));
        
        document.getElementById('caregiver-profile-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
        
        showSuccess('Welcome Back!', `Hi ${currentCaregiver.Name}! You have successfully logged in.`, 'caregiver-dashboard');
    } catch (error) {
        alert('Invalid email or password. Please try again or sign up for a new account.');
        console.error('Caregiver login error:', error);
    }
}

// Caregiver signup
async function submitCaregiverSignup() {
    const name = document.getElementById('caregiver-name').value.trim();
    const email = document.getElementById('caregiver-email').value.trim();
    const phone = document.getElementById('caregiver-phone').value.trim();
    const location = document.getElementById('caregiver-location').value.trim();
    const experience = document.getElementById('caregiver-experience').value;
    const rate = document.getElementById('caregiver-rate').value;
    const idNumber = document.getElementById('caregiver-id').value.trim();
    const password = document.getElementById('caregiver-password').value;

    if (!name || !email || !phone || !location || !experience || !rate || !idNumber || !password) {
        alert('Please fill in all required fields');
        return;
    }

    if (!uploadedIdFile) {
        alert('Please upload your ID document');
        return;
    }

    const specialtyCheckboxes = document.querySelectorAll('input[name="specialty"]:checked');
    const specialties = Array.from(specialtyCheckboxes).map(cb => cb.value);

    if (specialties.length === 0) {
        alert('Please select at least one specialty');
        return;
    }

    try {
        const response = await apiCall(API_CONFIG.ENDPOINTS.CAREGIVER_REGISTER, {
            method: 'POST',
            body: JSON.stringify({
                name,
                email,
                password,
                phone,
                location,
                experience,
                rate,
                specialties,
                certifications: uploadedCertificates,
                languages: ['English', 'Malay'], // Default languages
                idNumber
            })
        });

        // Fetch the complete caregiver profile
        const caregiverProfile = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVERS}/${response.caregiverId}`);
        currentCaregiver = caregiverProfile;
        sessionStorage.setItem('currentCaregiver', JSON.stringify(currentCaregiver));

        document.getElementById('caregiver-profile-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';

        showSuccess('Verification Successful!', 'Your account has been verified! You can now start accepting jobs.', 'caregiver-dashboard');
    } catch (error) {
        alert(error.message || 'Registration failed. Please try again.');
        console.error('Caregiver registration error:', error);
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        currentCaregiver = null;
        bookingHistory = [];
        acceptedJobs = [];
        
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentCaregiver');
        
        document.getElementById('user-profile-btn').style.display = 'none';
        document.getElementById('caregiver-profile-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';

         // Stop auto-refresh when leaving caregiver dashboard
        if (pageName !== 'caregiver-dashboard' && dashboardRefreshInterval) {
            clearInterval(dashboardRefreshInterval);
            dashboardRefreshInterval = null;
        }

        showPage('home');
    }
}


// =============================================
// USER PROFILE MANAGEMENT
// =============================================

// Show user profile
async function showUserProfile() {
    if (!currentUser) return;
    
    // Refresh user data from API
    try {
        const userData = await apiCall(`${API_CONFIG.ENDPOINTS.USER_PROFILE}/${currentUser.UserID}`);
        currentUser = userData;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        refreshUserProfile();
        showPage('user-profile');
    } catch (error) {
        console.error('Error fetching user profile:', error);
        refreshUserProfile();
        showPage('user-profile');
    }
}

// Refresh user profile display
function refreshUserProfile() {
    document.getElementById('user-profile-avatar').textContent = currentUser.Avatar;
    document.getElementById('user-profile-name').textContent = currentUser.Name;
    document.getElementById('user-profile-gender').textContent = currentUser.Gender;
    document.getElementById('user-profile-email').textContent = currentUser.Email;
    document.getElementById('user-profile-phone').textContent = currentUser.Phone;
    document.getElementById('user-profile-location').textContent = currentUser.Location;
    
    loadBookingHistory();
}

// Load booking history from API
async function loadBookingHistory() {
    if (!currentUser) return;
    
    try {
        bookingHistory = await apiCall(`${API_CONFIG.ENDPOINTS.USER_BOOKINGS}/${currentUser.UserID}`);
        updateBookingHistoryDisplay();
    } catch (error) {
        console.error('Error loading booking history:', error);
        document.getElementById('booking-history').innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">Failed to load booking history</p>';
    }
}

// Update booking history display
function updateBookingHistoryDisplay() {
    const historyContainer = document.getElementById('booking-history');
    if (!historyContainer) return;
    
    if (bookingHistory.length === 0) {
        historyContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem;">No bookings yet</p>';
    } else {
        historyContainer.innerHTML = bookingHistory.map((booking, index) => `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>${booking.caregiverName}</strong>
                    <span style="color: #9333ea; font-weight: 600;">RM ${booking.total}</span>
                </div>
                <p style="color: #6b7280; font-size: 0.875rem;">${formatDate(booking.date)} • ${booking.hours} hours</p>
                
                ${booking.status === 'completed' && !booking.rated ? 
                    `<button class="btn btn-primary" style="margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem;" onclick="openRatingModal(${index})">⭐ Rate & Review</button>` :
                    booking.status === 'completed' && booking.rated ?
                    `<div style="margin-top: 0.5rem;">
                        <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #dcfce7; color: #166534; border-radius: 1rem; font-size: 0.875rem;">✓ Completed & Rated</span>
                        <div style="margin-top: 0.5rem; color: #eab308;">⭐ ${booking.userRating}/5</div>
                        ${booking.userReview ? `<p style="margin-top: 0.5rem; color: #6b7280; font-size: 0.875rem; font-style: italic;">"${booking.userReview}"</p>` : ''}
                    </div>` :
                    booking.status === 'pending_completion' ?
                    `<button class="btn btn-primary" style="margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem;" onclick="finishJob(${booking.bookingId})">✓ Confirm Job Completed</button>` :
                    `<div style="margin-top: 0.5rem;">
                        <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #fef3c7; color: #92400e; border-radius: 1rem; font-size: 0.875rem;">⏳ In Progress</span>
                        <button class="btn btn-outline" style="margin-left: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="simulateJobCompletion(${booking.bookingId})">🚀 Fast Forward (Demo)</button>
                    </div>`
                }
                <button class="btn btn-outline" style="margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem;" onclick="openChatWithCaregiver('${booking.caregiverName}', ${booking.caregiverId})">
                    💬 Chat
                </button>
            </div>
        `).join('');
    }
}

// Enable edit profile
function enableEditProfile() {
    document.getElementById('profile-view-mode').style.display = 'none';
    document.getElementById('profile-edit-mode').style.display = 'block';

    document.getElementById('edit-user-name').value = currentUser.Name;
    document.getElementById('edit-user-gender').value = currentUser.Gender;
    document.getElementById('edit-user-email').value = currentUser.Email;
    document.getElementById('edit-user-phone').value = currentUser.Phone;
    document.getElementById('edit-user-location').value = currentUser.Location;
}

// Cancel edit profile
function cancelEditProfile() {
    document.getElementById('profile-view-mode').style.display = 'block';
    document.getElementById('profile-edit-mode').style.display = 'none';
}

// Save user profile
async function saveUserProfile() {
    const name = document.getElementById('edit-user-name').value.trim();
    const gender = document.getElementById('edit-user-gender').value;
    const email = document.getElementById('edit-user-email').value.trim();
    const phone = document.getElementById('edit-user-phone').value.trim();
    const location = document.getElementById('edit-user-location').value.trim();

    if (!name || !gender || !email || !phone || !location) {
        alert('Please fill in all fields');
        return;
    }

    try {
        await apiCall(`${API_CONFIG.ENDPOINTS.USER_PROFILE}/${currentUser.UserID}`, {
            method: 'PUT',
            body: JSON.stringify({ name, gender, email, phone, location })
        });

        currentUser.Name = name;
        currentUser.Gender = gender;
        currentUser.Email = email;
        currentUser.Phone = phone;
        currentUser.Location = location;
        currentUser.Avatar = name.charAt(0).toUpperCase();
        
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        refreshUserProfile();

        document.getElementById('profile-view-mode').style.display = 'block';
        document.getElementById('profile-edit-mode').style.display = 'none';

        alert('Profile updated successfully!');
    } catch (error) {
        alert('Failed to update profile. Please try again.');
        console.error('Profile update error:', error);
    }
}

// =============================================
// CAREGIVER BROWSING & SELECTION
// =============================================

// Display caregivers with filtering
async function displayCaregivers() {
    const careTypeSelect = document.getElementById('care-type');
    const careType = careTypeSelect ? careTypeSelect.value : '';
    
    try {
        let endpoint = API_CONFIG.ENDPOINTS.CAREGIVERS;
        if (careType) {
            endpoint += `?careType=${encodeURIComponent(careType)}`;
        }
        
        const caregivers = await apiCall(endpoint);
        
        const countElement = document.getElementById('caregiver-count');
        if (countElement) {
            countElement.innerHTML = `Found ${caregivers.length} verified caregivers${careType ? ' <span style="color: #9333ea; font-weight: 600;">specializing in ' + careType + ' Care</span>' : ''}`;
        }
        
        const list = document.getElementById('caregiver-list');
        if (list) {
            if (caregivers.length === 0) {
                list.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem; grid-column: 1/-1;">No caregivers found for this category. Try a different care type.</p>';
            } else {
                list.innerHTML = caregivers.map(caregiver => `
                    <div class="caregiver-card" onclick="selectCaregiver(${caregiver.id})">
                        <div class="caregiver-header">
                            <div class="caregiver-info">
                                <div class="avatar">${caregiver.avatar}</div>
                                <div>
                                    <h3 style="font-size: 1.125rem; margin-bottom: 0.25rem;">${caregiver.name}</h3>
                                    <p style="color: #6b7280; font-size: 0.875rem;">📍 ${caregiver.distance}</p>
                                </div>
                            </div>
                            <svg style="width: 20px; height: 20px; color: #16a34a;" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="rating" style="margin-bottom: 1rem;">
                            <span>⭐</span>
                            <span>${caregiver.rating}</span>
                            <span style="color: #6b7280;">(${caregiver.reviews} reviews)</span>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">⏱️ ${caregiver.experience} experience</p>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                ${caregiver.specialties.map(s => `<span class="badge badge-specialty">${s}</span>`).join('')}
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                            <span style="font-size: 1.5rem; font-weight: bold; color: #9333ea;">${caregiver.rateDisplay}</span>
                            <span class="badge badge-available">${caregiver.availability}</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading caregivers:', error);
        const list = document.getElementById('caregiver-list');
        if (list) {
            list.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem; grid-column: 1/-1;">Failed to load caregivers. Please try again.</p>';
        }
    }
}

// Select caregiver and show profile
async function selectCaregiver(caregiverId) {
    try {
        selectedCaregiver = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVERS}/${caregiverId}`);
        showPage('caregiver-profile');
    } catch (error) {
        console.error('Error loading caregiver:', error);
        alert('Failed to load caregiver profile. Please try again.');
    }
}

// Display caregiver profile
function displayCaregiverProfile() {
    if (!selectedCaregiver) return;

    document.getElementById('profile-avatar').textContent = selectedCaregiver.Avatar;
    document.getElementById('profile-name').textContent = selectedCaregiver.Name;
    document.getElementById('profile-rating').innerHTML = `<span>⭐</span><span>${selectedCaregiver.AverageRating}</span><span style="color: #6b7280;">(${selectedCaregiver.TotalReviews} reviews)</span>`;
    document.getElementById('profile-experience').textContent = `⏱️ ${selectedCaregiver.Experience} experience`;
    document.getElementById('profile-rate').textContent = `RM ${selectedCaregiver.HourlyRate}/hour`;
    document.getElementById('profile-availability').textContent = selectedCaregiver.AvailabilityStatus;

    document.getElementById('profile-specialties').innerHTML = selectedCaregiver.specialties
        .map(s => `<span class="badge badge-specialty">${s}</span>`)
        .join('');

    document.getElementById('profile-certifications').innerHTML = selectedCaregiver.certifications
        .map(c => `<li style="margin-bottom: 0.5rem;">✓ ${c}</li>`)
        .join('');

    document.getElementById('profile-languages').innerHTML = selectedCaregiver.languages
        .map(l => `<span class="badge" style="background: #f3f4f6; color: #374151;">${l}</span>`)
        .join('');
}

// =============================================
// BOOKING MANAGEMENT
// =============================================

// Update price calculation
function updatePrice() {
    if (!selectedCaregiver) return;
    
    const hours = parseInt(document.getElementById('booking-hours').value) || 1;
    const insuranceChecked = document.getElementById('insurance-checkbox').checked;
    
    const hourlyRate = selectedCaregiver.HourlyRate;
    const subtotal = hourlyRate * hours;
    const insurance = insuranceChecked ? 6 : 0;
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + insurance + serviceFee;
    
    document.getElementById('hourly-rate').textContent = `RM ${hourlyRate}/hour`;
    document.getElementById('duration-display').textContent = `${hours} hours`;
    document.getElementById('subtotal').textContent = `RM ${subtotal}`;
    document.getElementById('service-fee').textContent = `RM ${serviceFee}`;
    document.getElementById('total-price').textContent = `RM ${total}`;
    
    const insuranceRow = document.getElementById('insurance-row');
    if (insuranceChecked) {
        insuranceRow.style.display = 'flex';
    } else {
        insuranceRow.style.display = 'none';
    }
}

// Toggle insurance checkbox
function toggleInsurance() {
    const checkbox = document.getElementById('insurance-checkbox');
    checkbox.checked = !checkbox.checked;
    
    const insuranceBox = document.getElementById('insurance-box');
    if (checkbox.checked) {
        insuranceBox.style.borderColor = '#9333ea';
        insuranceBox.style.background = '#faf5ff';
    } else {
        insuranceBox.style.borderColor = '#e5e7eb';
        insuranceBox.style.background = 'white';
    }
    
    updatePrice();
}

// Confirm booking
async function confirmBooking() {
    if (!currentUser || !selectedCaregiver) {
        alert('Please login first');
        return;
    }

    const hours = parseInt(document.getElementById('booking-hours').value) || 1;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const insurance = document.getElementById('insurance-checkbox').checked;
    
    // Get location
    const customRadio = document.querySelector('input[name="location-option"][value="custom"]');
    let location;
    if (customRadio && customRadio.checked) {
        location = document.getElementById('booking-location').value.trim();
        if (!location) {
            alert('Please enter the service address');
            return;
        }
    } else {
        location = currentUser.Location;
    }
    
    // Get special needs
    const specialNeeds = document.getElementById('booking-special-needs').value.trim();
    
    if (!date || !time) {
        alert('Please select both date and time for your booking');
        return;
    }
    
    const hourlyRate = selectedCaregiver.HourlyRate;
    const subtotal = hourlyRate * hours;
    const insuranceFee = insurance ? 6 : 0;
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + insuranceFee + serviceFee;
    
    try {
        // Create booking
        const bookingResponse = await apiCall(API_CONFIG.ENDPOINTS.BOOKINGS, {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUser.UserID,
                caregiverId: selectedCaregiver.CaregiverID,
                bookingDate: date,
                bookingTime: time,
                hours: hours,
                hourlyRate: hourlyRate,
                subtotal: subtotal,
                insuranceFee: insuranceFee,
                serviceFee: serviceFee,
                totalAmount: total,
                hasInsurance: insurance
            })
        });
        
        // Also create a job request so caregiver can see it
        await apiCall(API_CONFIG.ENDPOINTS.JOBS, {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUser.UserID,
                userName: currentUser.Name,
                userAvatar: currentUser.Avatar,
                careType: selectedCareType || 'General Care',
                hourlyRate: hourlyRate,
                hours: hours,
                startDate: `${date} at ${time}`,
                phone: currentUser.Phone,
                address: location,
                distance: 'Near you',
                specialRequests: specialNeeds || 'No special requests'
            })
        });
        
        let message = `Your booking with <strong>${selectedCaregiver.Name}</strong> has been confirmed!<br><br>`;
        message += `<strong>Duration:</strong> ${hours} hours<br>`;
        message += `<strong>Date:</strong> ${date}<br>`;
        message += `<strong>Time:</strong> ${time}<br>`;
        message += `<strong>Location:</strong> ${location}<br>`;
        if (specialNeeds) {
            message += `<strong>Special Requests:</strong> ${specialNeeds}<br><br>`;
        }
        message += `<strong>Total Amount:</strong> <span style="color: #9333ea; font-weight: bold;">RM ${total}</span><br><br>`;
        
        // Escrow system notice
        message += `<div style="background: #fef3c7; border: 1px solid #fde047; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">`;
        message += `<strong style="color: #92400e;">🔒 Escrow Payment Protection</strong><br>`;
        message += `<p style="color: #92400e; font-size: 0.875rem; margin-top: 0.5rem;">`;
        message += `Your payment is held securely in escrow. The caregiver will receive payment only after:<br>`;
        message += `1️⃣ The caregiver marks the job as completed<br>`;
        message += `2️⃣ You confirm the job completion<br><br>`;
        message += `This ensures both parties are protected!`;
        message += `</p></div><br>`;
        
        message += `The caregiver will contact you soon!<br><br>`;
        
        showSuccess('Payment Successful!', message, 'user-profile');
    } catch (error) {
        alert('Booking failed. Please try again.');
        console.error('Booking error:', error);
    }
}

// Finish job (user confirms completion)
async function finishJob(bookingId) {
    try {
        await apiCall(`${API_CONFIG.ENDPOINTS.BOOKINGS}/${bookingId}/confirm`, {
            method: 'POST'
        });
        
        loadBookingHistory();
    } catch (error) {
        alert('Failed to confirm job completion. Please try again.');
        console.error('Job completion error:', error);
    }
}

// Simulate job completion for DEMO purposes
async function simulateJobCompletion(bookingId) {
    try {
        await apiCall(`${API_CONFIG.ENDPOINTS.BOOKINGS}/${bookingId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'pending_completion' })
        });
        
        loadBookingHistory();
    } catch (error) {
        console.error('Simulation error:', error);
    }
}

// =============================================
// RATING & REVIEW SYSTEM
// =============================================

// Open rating modal
function openRatingModal(bookingIndex) {
    const booking = bookingHistory[bookingIndex];
    currentJobToRate = { ...booking, bookingIndex };
    
    document.getElementById('rating-caregiver-name').textContent = booking.caregiverName;
    document.getElementById('rating-modal').classList.add('active');
    resetRating();
}

// Set rating
function setRating(stars) {
    currentRating = stars;
    const starButtons = document.querySelectorAll('.star-btn');
    const ratingTexts = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    
    starButtons.forEach((btn, index) => {
        btn.style.opacity = index < stars ? '1' : '0.3';
    });
    
    document.getElementById('rating-text').textContent = ratingTexts[stars - 1];
}

// Reset rating
function resetRating() {
    currentRating = 0;
    document.querySelectorAll('.star-btn').forEach(btn => btn.style.opacity = '0.3');
    document.getElementById('rating-text').textContent = 'Select a rating';
    document.getElementById('review-text').value = '';
}

// Submit rating
async function submitRating() {
    if (currentRating === 0) {
        alert('Please select a rating');
        return;
    }

    const review = document.getElementById('review-text').value.trim();
    
    if (!currentJobToRate) return;

    try {
        await apiCall(API_CONFIG.ENDPOINTS.REVIEWS, {
            method: 'POST',
            body: JSON.stringify({
                bookingId: currentJobToRate.bookingId,
                userId: currentUser.UserID,
                caregiverId: currentJobToRate.caregiverId,
                rating: currentRating,
                reviewText: review
            })
        });
        
        closeModal('rating-modal');
        loadBookingHistory();
        
        showSuccess('Thank You!', `Your ${currentRating}-star review has been submitted successfully!${review ? '<br><br>Your feedback: "' + review + '"' : ''}<br><br>Thank you for helping other users!`);
        
        currentJobToRate = null;
        currentRating = 0;
    } catch (error) {
        alert('Failed to submit review. Please try again.');
        console.error('Review submission error:', error);
    }
}

// =============================================
// CAREGIVER DASHBOARD
// =============================================

// Update caregiver dashboard
async function updateCaregiverDashboard() {
    if (!currentCaregiver) return;

    // Use the values from currentCaregiver directly
    const caregiverId = currentCaregiver.CaregiverID || currentCaregiver.id;
    const caregiverName = currentCaregiver.Name || currentCaregiver.name;
    const totalEarnings = currentCaregiver.TotalEarnings || currentCaregiver.totalEarnings || 0;
    const totalJobs = currentCaregiver.TotalJobs || currentCaregiver.totalJobs || 0;
    const avgRating = currentCaregiver.AverageRating || currentCaregiver.averageRating || currentCaregiver.rating || 5.0;
    const totalReviews = currentCaregiver.TotalReviews || currentCaregiver.totalReviews || currentCaregiver.reviews || 0;

    document.getElementById('caregiver-dashboard-name').textContent = caregiverName;
    document.getElementById('total-earnings').textContent = 'RM ' + parseFloat(totalEarnings).toFixed(2);
    document.getElementById('completed-jobs').textContent = totalJobs;
    document.getElementById('weekly-jobs').textContent = Math.min(totalJobs, 3) + ' this week';
    document.getElementById('caregiver-rating').textContent = '⭐ ' + parseFloat(avgRating).toFixed(1);
    document.getElementById('rating-count').textContent = totalReviews;

    // Load job requests
    await loadJobRequests();
    
    // Load accepted jobs
    await loadAcceptedJobs();

     // NEW: Set up auto-refresh every 10 seconds
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
    }
    
    dashboardRefreshInterval = setInterval(async () => {
        console.log('🔄 Auto-refreshing job requests...');
        await loadJobRequests();
        await loadAcceptedJobs();
    }, 10000); // Refresh every 10 seconds
}

// Load job requests for caregiver
async function loadJobRequests() {
    if (!currentCaregiver) return;
    
    const caregiverId = currentCaregiver.CaregiverID || currentCaregiver.id;
    
    try {
        const jobs = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVER_JOBS}/${caregiverId}`);
        
        const container = document.getElementById('new-job-requests');
        if (jobs.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem;">No job requests available at the moment</p>';
        } else {
            container.innerHTML = jobs.map(job => `
                <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>${job.UserName}</strong>
                        <strong style="color: #9333ea;">RM ${parseFloat(job.HourlyRate).toFixed(2)}/hour</strong>
                    </div>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">${job.CareType} • ${job.StartDate}</p>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">📍 ${job.Distance || 'Near you'}</p>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" style="flex: 1;" onclick="acceptJob(${job.JobRequestID})">Accept Job</button>
                        <button class="btn btn-outline" style="flex: 1;" onclick="showJobDetails(${job.JobRequestID})">View Details</button>
                        <button class="btn btn-outline" onclick="openCaregiverChat('${job.UserName}', 'user')">💬</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading job requests:', error);
        document.getElementById('new-job-requests').innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">Failed to load job requests. Please refresh the page.</p>';
    }
}

// Load accepted jobs
async function loadAcceptedJobs() {
    if (!currentCaregiver) return;
    
    const caregiverId = currentCaregiver.CaregiverID || currentCaregiver.id;
    
    try {
        acceptedJobs = await apiCall(`${API_CONFIG.ENDPOINTS.ACCEPTED_JOBS}/${caregiverId}`);
        
        const container = document.getElementById('accepted-jobs');
        if (acceptedJobs.length === 0) {
            container.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem;">No accepted jobs yet. Accept a job from the requests above!</p>';
        } else {
            container.innerHTML = acceptedJobs.map(job => `
                <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; background: #f0fdf4;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>${job.UserName}</strong>
                        <strong style="color: #16a34a;">✓ Accepted</strong>
                    </div>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">${job.CareType} • ${job.StartDate}</p>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem;">📍 ${job.Distance || 'Near you'}</p>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline" style="flex: 1;" onclick="completeJob(${job.AcceptedJobID})">Mark as Complete</button>
                        <button class="btn btn-outline" onclick="openCaregiverChat('${job.UserName}', 'user')">💬 Chat</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading accepted jobs:', error);
        document.getElementById('accepted-jobs').innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">Failed to load accepted jobs</p>';
    }
}

// Accept job
async function acceptJob(jobId) {
    if (!currentCaregiver) return;
    
    try {
        await apiCall(`${API_CONFIG.ENDPOINTS.JOBS}/${jobId}/accept`, {
            method: 'POST',
            body: JSON.stringify({ caregiverId: currentCaregiver.CaregiverID })
        });
        
        const job = await apiCall(`${API_CONFIG.ENDPOINTS.JOBS}/${jobId}`);
        showSuccess('Job Accepted!', `You have successfully accepted the job request from ${job.UserName}. You can now chat with them to discuss details.`, 'caregiver-dashboard');
    } catch (error) {
        alert('Failed to accept job. Please try again.');
        console.error('Job acceptance error:', error);
    }
}

// Complete job
async function completeJob(acceptedJobId) {
    if (!currentCaregiver) return;
    
    if (!confirm('Are you sure you want to mark this job as completed?')) {
        return;
    }
    
    try {
        const response = await apiCall(`${API_CONFIG.ENDPOINTS.JOBS}/accepted/${acceptedJobId}/complete`, {
            method: 'POST'
        });
        
        // Refresh caregiver data to show updated earnings
        const caregiverId = currentCaregiver.CaregiverID || currentCaregiver.id;
        const updatedProfile = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVERS}/${caregiverId}`);
        
        // Update current caregiver object
        currentCaregiver.TotalJobs = updatedProfile.TotalJobs;
        currentCaregiver.TotalEarnings = updatedProfile.TotalEarnings;
        sessionStorage.setItem('currentCaregiver', JSON.stringify(currentCaregiver));
        
        // Show success with earnings info
        let message = 'Job marked as completed successfully!<br><br>';
        message += `<strong>Your Earnings:</strong> RM ${response.earnings.toFixed(2)}<br>`;
        message += `<small style="color: #6b7280;">After 15% commission (RM ${response.commission.toFixed(2)})</small><br><br>`;
        message += `<div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">`;
        message += `<strong style="color: #166534;">💰 Payment Released from Escrow</strong><br>`;
        message += `<p style="color: #15803d; font-size: 0.875rem; margin-top: 0.5rem;">`;
        message += `Your earnings have been released and added to your total earnings!`;
        message += `</p></div>`;
        
        showSuccess('Job Completed!', message, 'caregiver-dashboard');
    } catch (error) {
        alert('Failed to complete job. Please try again.');
        console.error('Job completion error:', error);
    }
}

// Show job details modal
async function showJobDetails(jobId) {
    try {
        const job = await apiCall(`${API_CONFIG.ENDPOINTS.JOBS}/${jobId}`);
        
        const modalContent = document.querySelector('#job-details-modal .modal-content');
        const grossEarnings = job.HourlyRate * job.Hours;
        const commission = Math.round(grossEarnings * 0.15);
        const netEarnings = grossEarnings - commission;
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.5rem;">Job Request Details</h2>
                <button onclick="closeModal('job-details-modal')" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <h3 style="margin-bottom: 0.5rem;">${job.UserName}</h3>
                <p style="color: #9333ea; font-weight: 600;">${job.CareType}</p>
            </div>

            <div class="grid grid-2" style="margin-bottom: 1.5rem;">
                <div>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Contact Number</p>
                    <p style="font-weight: 600;">${job.Phone}</p>
                </div>
                <div>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Estimated Payment</p>
                    <p style="font-weight: 600; color: #9333ea;">RM ${grossEarnings} (${job.Hours} hours)</p>
                </div>
                <div>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Start Date</p>
                    <p style="font-weight: 600;">${job.StartDate}</p>
                </div>
                <div>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">Distance</p>
                    <p style="font-weight: 600;">${job.Distance}</p>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">Address</p>
                <p style="font-weight: 600;">${job.Address}</p>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem;">Special Requests</p>
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.5rem; padding: 1rem;">
                    <p style="color: #1e40af;">${job.SpecialRequests}</p>
                </div>
            </div>

            <div style="background: #fef3c7; border: 1px solid #fde047; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;">
                <p style="color: #92400e; font-size: 0.875rem;">
                    <strong>Commission Notice:</strong> 15% commission fee will be deducted from the total payment. Your actual earning will be RM ${netEarnings} (RM ${grossEarnings} - 15% commission).
                </p>
            </div>

            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-primary" style="flex: 1;" onclick="acceptJobFromModal(${job.JobRequestID})">Accept Job</button>
                <button class="btn btn-outline" style="flex: 1;" onclick="closeModal('job-details-modal')">Close</button>
            </div>
        `;
        
        document.getElementById('job-details-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading job details:', error);
        alert('Failed to load job details. Please try again.');
    }
}

function acceptJobFromModal(jobId) {
    closeModal('job-details-modal');
    acceptJob(jobId);
}

// =============================================
// CAREGIVER PROFILE VIEW
// =============================================

// Show caregiver profile
async function showCaregiverProfile() {
    if (!currentCaregiver) return;
    
    try {
        // Refresh caregiver data
        const updatedProfile = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVERS}/${currentCaregiver.CaregiverID}`);
        currentCaregiver = updatedProfile;
        sessionStorage.setItem('currentCaregiver', JSON.stringify(currentCaregiver));
        
        showCaregiverProfileView();
    } catch (error) {
        console.error('Error loading caregiver profile:', error);
        showCaregiverProfileView();
    }
}

async function showCaregiverProfileView() {
    if (!currentCaregiver) return;

    // Handle both API response formats
    const caregiverData = {
        avatar: currentCaregiver.Avatar || currentCaregiver.avatar || 'CG',
        name: currentCaregiver.Name || currentCaregiver.name || 'Caregiver',
        rating: currentCaregiver.AverageRating || currentCaregiver.averageRating || currentCaregiver.rating || 5.0,
        experience: currentCaregiver.Experience || currentCaregiver.experience || '0 years',
        rate: currentCaregiver.HourlyRate || currentCaregiver.rate || 0,
        email: currentCaregiver.Email || currentCaregiver.email || '',
        phone: currentCaregiver.Phone || currentCaregiver.phone || '',
        location: currentCaregiver.Location || currentCaregiver.location || '',
        specialties: currentCaregiver.specialties || [],
        certifications: currentCaregiver.certifications || [],
        totalJobs: currentCaregiver.TotalJobs || currentCaregiver.totalJobs || 0,
        totalEarnings: currentCaregiver.TotalEarnings || currentCaregiver.totalEarnings || 0
    };

    document.getElementById('caregiver-profile-avatar').textContent = caregiverData.avatar;
    document.getElementById('caregiver-profile-name').textContent = caregiverData.name;
    document.getElementById('caregiver-profile-rating').textContent = parseFloat(caregiverData.rating).toFixed(1);
    document.getElementById('caregiver-profile-experience').textContent = caregiverData.experience + ' experience';
    document.getElementById('caregiver-profile-rate').textContent = `RM ${caregiverData.rate}/hour`;
    document.getElementById('caregiver-profile-email').textContent = caregiverData.email;
    document.getElementById('caregiver-profile-phone').textContent = caregiverData.phone;
    document.getElementById('caregiver-profile-location').textContent = caregiverData.location;

    document.getElementById('caregiver-profile-specialties').innerHTML = caregiverData.specialties
        .map(s => `<span class="badge badge-specialty">${s}</span>`)
        .join('');

    // Load enrolled trainings from API
    const caregiverId = currentCaregiver.CaregiverID || currentCaregiver.id;
    let enrolledTrainingsList = [];

    try {
        enrolledTrainingsList = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVER_TRAINING}/${caregiverId}`);
    } catch (error) {
        console.error('Error loading enrolled trainings:', error);
    }

    const certsContainer = document.getElementById('caregiver-profile-certifications');
    if (caregiverData.certifications.length === 0 && enrolledTrainingsList.length === 0) {
        certsContainer.innerHTML = '<p style="color: #6b7280;">No certifications uploaded yet</p>';
    } else {
        let certsHTML = '';
        if (caregiverData.certifications.length > 0) {
            certsHTML += caregiverData.certifications
                .map(c => `<div style="margin-bottom: 0.5rem;">✓ ${c}</div>`)
                .join('');
        }
        if (enrolledTrainingsList.length > 0) {
            certsHTML += enrolledTrainingsList
                .map(t => `<div style="margin-bottom: 0.5rem; color: #9333ea;">🎓 ${t.Title} (${t.Status === 'completed' ? 'Completed' : 'Enrolled'})</div>`)
                .join('');
        }
        certsContainer.innerHTML = certsHTML;
    }

    document.getElementById('caregiver-total-jobs').textContent = caregiverData.totalJobs;
    document.getElementById('caregiver-total-earnings').textContent = 'RM ' + parseFloat(caregiverData.totalEarnings).toFixed(2);

    // Load reviews for this caregiver
    displayCaregiverReviews();

    showPage('caregiver-profile-view');
}

// Display reviews for caregiver to see
async function displayCaregiverReviews() {
    const reviewsContainer = document.getElementById('caregiver-reviews-section');
    if (!reviewsContainer || !currentCaregiver) return;
    
    try {
        const reviews = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVER_REVIEWS}/${currentCaregiver.CaregiverID}`);
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 2rem;">No reviews yet</p>';
        } else {
            // Calculate average rating
            const totalStars = reviews.reduce((sum, review) => sum + review.Rating, 0);
            const avgRating = (totalStars / reviews.length).toFixed(1);
            
            reviewsContainer.innerHTML = `
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 3rem; font-weight: bold; color: #eab308; margin-bottom: 0.5rem;">⭐ ${avgRating}</div>
                        <p style="color: #6b7280; font-size: 1.125rem;">${reviews.length} ${reviews.length === 1 ? 'Review' : 'Reviews'}</p>
                        <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1rem;">
                            ${[5,4,3,2,1].map(stars => {
                                const count = reviews.filter(r => r.Rating === stars).length;
                                const percentage = reviews.length > 0 ? (count / reviews.length * 100).toFixed(0) : 0;
                                return `
                                    <div style="text-align: center;">
                                        <p style="font-size: 0.75rem; color: #6b7280;">${stars}⭐</p>
                                        <div style="width: 50px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                                            <div style="width: ${percentage}%; height: 100%; background: #eab308;"></div>
                                        </div>
                                        <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${count}</p>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; gap: 1rem;">
                    ${reviews.map(review => {
                        const reviewDate = formatDate(review.CreatedAt);
                        return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; background: white;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <div class="avatar" style="width: 40px; height: 40px; font-size: 0.875rem;">${review.UserAvatar}</div>
                                        <div>
                                            <p style="font-weight: 600;">${review.UserName}</p>
                                            <p style="color: #6b7280; font-size: 0.75rem;">${reviewDate}</p>
                                        </div>
                                    </div>
                                    <div style="color: #eab308; font-weight: bold;">
                                        ${'⭐'.repeat(review.Rating)}
                                    </div>
                                </div>
                                ${review.ReviewText ? `
                                    <p style="color: #4b5563; line-height: 1.6; margin-top: 0.75rem;">${review.ReviewText}</p>
                                ` : `
                                    <p style="color: #9ca3af; font-style: italic; margin-top: 0.75rem;">No written review</p>
                                `}
                                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f3f4f6;">
                                    <p style="color: #6b7280; font-size: 0.75rem;">📅 Booking: ${formatDate(review.BookingDate)} • ${review.Hours} hours • RM ${review.TotalAmount}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsContainer.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">Failed to load reviews</p>';
    }
}

// =============================================
// TRAINING PROGRAMS
// =============================================

// Show training details modal
async function showTrainingDetails(trainingId) {
    try {
        const training = await apiCall(`${API_CONFIG.ENDPOINTS.TRAINING}/${trainingId}`);

        document.getElementById('training-title').textContent = training.Title;
        document.getElementById('training-duration').textContent = training.Duration;
        document.getElementById('training-cert').textContent = training.Certificate;
        document.getElementById('training-description').textContent = training.Description;

        const topicsList = document.getElementById('training-topics');
        topicsList.innerHTML = training.topics
            .map(topic => `
                <li style="margin-bottom: 0.75rem; display: flex; align-items: start; gap: 0.5rem;">
                    <span style="color: #16a34a; font-size: 1.25rem;">✓</span>
                    <span style="color: #6b7280;">${topic}</span>
                </li>
            `)
            .join('');

        const enrollBtn = document.getElementById('training-enroll-btn');

        // Check if caregiver is enrolled from database
        let isEnrolled = false;
        if (currentCaregiver) {
            try {
                const caregiverId = currentCaregiver.CaregiverID || currentCaregiver.id;
                const enrolled = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVER_TRAINING}/${caregiverId}`);
                isEnrolled = enrolled.some(e => e.TrainingProgramID === trainingId);
            } catch (error) {
                console.error('Error checking enrollment:', error);
            }
        }

        if (isEnrolled) {
            enrollBtn.textContent = 'Enrolled ✓';
            enrollBtn.disabled = true;
            enrollBtn.style.background = '#16a34a';
            enrollBtn.style.cursor = 'not-allowed';
        } else {
            enrollBtn.textContent = 'Enroll Now';
            enrollBtn.disabled = false;
            enrollBtn.style.background = '#9333ea';
            enrollBtn.style.cursor = 'pointer';
        }

        enrollBtn.setAttribute('data-training-id', trainingId);

        document.getElementById('training-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading training details:', error);
        alert('Failed to load training details. Please try again.');
    }
}

// Enroll in training
async function enrollTraining() {
    if (!currentCaregiver) return;
    
    const enrollBtn = document.getElementById('training-enroll-btn');
    const trainingId = parseInt(enrollBtn.getAttribute('data-training-id'));
    
    try {
        const training = await apiCall(`${API_CONFIG.ENDPOINTS.TRAINING}/${trainingId}`);
        
        // Check if already enrolled from database
        const caregiverId = currentCaregiver.CaregiverID || currentCaregiver.id;
        const enrolled = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVER_TRAINING}/${caregiverId}`);
        
        if (enrolled.some(e => e.TrainingProgramID === trainingId)) {
            alert('You are already enrolled in this training!');
            return;
        }

        // Enroll in database
        await apiCall(API_CONFIG.ENDPOINTS.TRAINING_ENROLL, {
            method: 'POST',
            body: JSON.stringify({
                caregiverId: caregiverId,
                trainingProgramId: trainingId
            })
        });

        // Update button
        enrollBtn.textContent = 'Enrolled ✓';
        enrollBtn.disabled = true;
        enrollBtn.style.background = '#16a34a';
        enrollBtn.style.cursor = 'not-allowed';

        // Update outside button
        const outsideBtn = document.getElementById('training-btn-' + trainingId);
        if (outsideBtn) {
            outsideBtn.textContent = 'Enrolled ✓';
            outsideBtn.disabled = true;
            outsideBtn.style.background = '#16a34a';
            outsideBtn.style.color = 'white';
            outsideBtn.style.borderColor = '#16a34a';
            outsideBtn.style.cursor = 'not-allowed';
            outsideBtn.onclick = null;
        }

        setTimeout(() => {
            closeModal('training-modal');
            showSuccess('Enrollment Successful!', `You are now enrolled in "${training.Title}". Check your email for course access details and schedule.`, 'caregiver-dashboard');
        }, 500);
    } catch (error) {
        alert('Enrollment failed. Please try again.');
        console.error('Enrollment error:', error);
    }
}

// =============================================
// MESSAGING SYSTEM
// =============================================

// Open chat modal
async function openChat() {
    if (!selectedCaregiver || !currentUser) return;
    
    currentChatPerson = selectedCaregiver.Name;
    currentChatRole = 'user';
    
    document.getElementById('chat-avatar').textContent = selectedCaregiver.Avatar;
    document.getElementById('chat-name').textContent = selectedCaregiver.Name;
    
    // Get or create thread
    try {
        const threadResponse = await apiCall(API_CONFIG.ENDPOINTS.MESSAGE_THREAD, {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUser.UserID,
                caregiverId: selectedCaregiver.CaregiverID
            })
        });
        
        currentThreadId = threadResponse.threadId;
        
        // Load messages
        await loadChatMessages();
        
    } catch (error) {
        console.error('Error opening chat:', error);
        document.getElementById('chat-messages').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #9ca3af;">
                <p>Start a conversation with ${selectedCaregiver.Name}</p>
            </div>
        `;
    }
    
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-modal').classList.add('active');
}

// Open chat with specific person (from booking history)
async function openChatWithCaregiver(caregiverName, caregiverId) {
    if (!currentUser) return;
    
    // If caregiverId is not provided, try to find it
    if (!caregiverId) {
        // Try to find caregiver by name
        try {
            const allCaregivers = await apiCall(API_CONFIG.ENDPOINTS.CAREGIVERS);
            const caregiver = allCaregivers.find(c => c.name === caregiverName);
            if (caregiver) {
                caregiverId = caregiver.id;
            } else {
                alert('Unable to start chat. Caregiver not found.');
                return;
            }
        } catch (error) {
            console.error('Error finding caregiver:', error);
            alert('Unable to start chat. Please try again.');
            return;
        }
    }
    
    currentChatPerson = caregiverName;
    currentChatRole = 'user';
    
    document.getElementById('chat-avatar').textContent = caregiverName.charAt(0);
    document.getElementById('chat-name').textContent = caregiverName;
    
    try {
        const threadResponse = await apiCall(API_CONFIG.ENDPOINTS.MESSAGE_THREAD, {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUser.UserID,
                caregiverId: caregiverId
            })
        });
        
        currentThreadId = threadResponse.threadId;
        await loadChatMessages();
        
    } catch (error) {
        console.error('Error opening chat:', error);
        document.getElementById('chat-messages').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #9ca3af;">
                <p>Chat with ${caregiverName}</p>
            </div>
        `;
    }
    
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-modal').classList.add('active');
}

// Open chat from caregiver side
async function openCaregiverChat(userName, userType) {
    if (!currentCaregiver) return;
    
    // For demo purposes - try to find the user by name
    let userId = null;
    
    try {
        // Try to find the user from accepted jobs or job requests
        const jobRequests = await apiCall(`${API_CONFIG.ENDPOINTS.CAREGIVER_JOBS}/${currentCaregiver.CaregiverID || currentCaregiver.id}`);
        const job = jobRequests.find(j => j.UserName === userName);
        
        if (job && job.UserID) {
            userId = job.UserID;
        } else {
            // Try from accepted jobs
            const caregiverId = currentCaregiver.CaregiverID || currentCaregiver.id;
            const acceptedJobsList = await apiCall(`${API_CONFIG.ENDPOINTS.ACCEPTED_JOBS}/${caregiverId}`);
            const acceptedJob = acceptedJobsList.find(j => j.UserName === userName);
            
            if (acceptedJob && acceptedJob.UserID) {
                userId = acceptedJob.UserID;
            }
        }
        
        if (!userId) {
            // Fallback - use a default for demo
            alert('Unable to start chat at this time. Please try again after the user books you.');
            return;
        }
        
        currentChatPerson = userName;
        currentChatRole = 'caregiver';
        
        document.getElementById('chat-avatar').textContent = userName.charAt(0);
        document.getElementById('chat-name').textContent = userName;
        
        // Create or get thread
        const threadResponse = await apiCall(API_CONFIG.ENDPOINTS.MESSAGE_THREAD, {
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                caregiverId: currentCaregiver.CaregiverID || currentCaregiver.id
            })
        });
        
        currentThreadId = threadResponse.threadId;
        await loadChatMessages();
        
    } catch (error) {
        console.error('Error opening chat:', error);
        document.getElementById('chat-messages').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #9ca3af;">
                <p>Start a conversation with ${userName}</p>
            </div>
        `;
    }
    
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-modal').classList.add('active');
}

// Load chat messages
async function loadChatMessages() {
    if (!currentThreadId) return;
    
    try {
        const messages = await apiCall(`${API_CONFIG.ENDPOINTS.MESSAGE_THREAD}/${currentThreadId}`);
        
        const messagesContainer = document.getElementById('chat-messages');
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #9ca3af;">
                    <p>Start a conversation</p>
                </div>
            `;
        } else {
            messagesContainer.innerHTML = messages.map(msg => {
                const time = new Date(msg.SentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const isMyMessage = (currentChatRole === 'user' && msg.SenderType === 'user') || 
                                   (currentChatRole === 'caregiver' && msg.SenderType === 'caregiver');
                
                return `
                    <div class="chat-message ${isMyMessage ? 'user' : 'caregiver'}">
                        <div class="chat-bubble">
                            <p>${msg.MessageText}</p>
                            <p class="chat-time">${time}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Close chat modal
function closeChat() {
    document.getElementById('chat-modal').classList.remove('active');
    currentChatPerson = null;
    currentChatRole = null;
    currentThreadId = null;
}

// Send message in chat
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || !currentThreadId) return;
    
    try {
        let senderId, receiverId;
        
        if (currentChatRole === 'user') {
            senderId = currentUser.UserID;
            receiverId = selectedCaregiver ? selectedCaregiver.CaregiverID : 1; // Default for demo
        } else {
            senderId = currentCaregiver.CaregiverID;
            receiverId = 1; // This should be the actual user ID from the job
        }
        
        await apiCall(API_CONFIG.ENDPOINTS.MESSAGES, {
            method: 'POST',
            body: JSON.stringify({
                threadId: currentThreadId,
                senderType: currentChatRole,
                senderId: senderId,
                receiverType: currentChatRole === 'user' ? 'caregiver' : 'user',
                receiverId: receiverId,
                messageText: message
            })
        });
        
        input.value = '';
        
        // Reload messages
        await loadChatMessages();
        
        // Simulate response for demo
        setTimeout(async () => {
            const responses = currentChatRole === 'caregiver' ? [
                "Thank you! That sounds perfect. What time works best for you?",
                "I appreciate your help. Can you confirm the appointment details?",
                "Great! Looking forward to meeting you. Do you have any questions for me?",
                "That's good to know. My address is included in the booking details.",
                "Perfect! Please let me know if you need any additional information."
            ] : [
                "Thank you for reaching out! I'd be happy to help with your caregiving needs.",
                "I have experience with similar situations. When would you like to schedule?",
                "I'm available and looking forward to helping you!",
                "Feel free to ask me any questions about my experience or certifications.",
                "I can definitely accommodate those requirements. Let me know the details!"
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            await apiCall(API_CONFIG.ENDPOINTS.MESSAGES, {
                method: 'POST',
                body: JSON.stringify({
                    threadId: currentThreadId,
                    senderType: currentChatRole === 'user' ? 'caregiver' : 'user',
                    senderId: receiverId,
                    receiverType: currentChatRole,
                    receiverId: senderId,
                    messageText: randomResponse
                })
            });
            
            await loadChatMessages();
        }, 1000);
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
}

// Handle Enter key in chat
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Show page function
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    if (pageName === 'browse-caregivers') {
        displayCaregivers();
    }
    
    if (pageName === 'caregiver-profile' && selectedCaregiver) {
        displayCaregiverProfile();
    }

    if (pageName === 'caregiver-dashboard' && currentCaregiver) {
        updateCaregiverDashboard();
    }

    if (pageName === 'user-profile' && currentUser) {
        refreshUserProfile();
    }
    
    if (pageName === 'booking-payment' && selectedCaregiver) {
        updatePrice();
        
        // Set default location display
        if (currentUser) {
            const defaultLocationDisplay = document.getElementById('default-location-display');
            if (defaultLocationDisplay) {
                defaultLocationDisplay.textContent = currentUser.Location;
            }
        }
        
        // Reset location option to default
        const defaultRadio = document.querySelector('input[name="location-option"][value="default"]');
        if (defaultRadio) {
            defaultRadio.checked = true;
        }
        toggleLocationInput();
    }

    window.scrollTo(0, 0);
}

// Show success modal
function showSuccess(title, message, returnPage) {
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-message').innerHTML = message;
    
    const successModal = document.getElementById('success-modal');
    successModal.setAttribute('data-return-page', returnPage || 'home');
    
    successModal.classList.add('active');
}

// Close success modal
function closeSuccessModal() {
    const successModal = document.getElementById('success-modal');
    const returnPage = successModal.getAttribute('data-return-page') || 'home';
    successModal.classList.remove('active');
    
    if (returnPage && returnPage !== 'home') {
        showPage(returnPage);
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// =============================================
// FILE UPLOAD HANDLERS
// =============================================

// Handle certificate upload
function handleCertUpload(event) {
    const files = event.target.files;
    const certList = document.getElementById('cert-list');
    
    for (let file of files) {
        uploadedCertificates.push(file.name);
    }
    
    certList.innerHTML = uploadedCertificates.map((cert, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f3f4f6; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 0.875rem;">📄 ${cert}</span>
            <button onclick="removeCertificate(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
        </div>
    `).join('');
}

function removeCertificate(index) {
    uploadedCertificates.splice(index, 1);
    const certList = document.getElementById('cert-list');
    certList.innerHTML = uploadedCertificates.map((cert, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f3f4f6; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 0.875rem;">📄 ${cert}</span>
            <button onclick="removeCertificate(${idx})" style="background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
        </div>
    `).join('');
}

// Handle ID upload
function handleIdUpload(event) {
    const file = event.target.files[0];
    if (file) {
        uploadedIdFile = file.name;
        document.getElementById('id-file-name').innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #dcfce7; border: 1px solid #86efac; border-radius: 0.5rem;">
                <span style="font-size: 0.875rem; color: #166534;">✓ ${file.name} uploaded</span>
                <button onclick="removeIdFile()" style="background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
            </div>
        `;
    }
}

function removeIdFile() {
    uploadedIdFile = null;
    document.getElementById('id-file-name').innerHTML = '';
    document.getElementById('id-upload').value = '';
}

// =============================================
// INITIALIZE ON PAGE LOAD
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
    }

    // Add CSS for star rating buttons
    const style = document.createElement('style');
    style.textContent = `
        .star-btn {
            cursor: pointer;
            opacity: 0.3;
            transition: opacity 0.2s;
            user-select: none;
        }
        .star-btn:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
    
    console.log('CareLoop Frontend initialized with API integration');
    console.log('Backend URL:', API_CONFIG.BASE_URL);
});





