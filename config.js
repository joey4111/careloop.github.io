// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://careloop-h9grczadetc7bxcw.malaysiawest-01.azurewebsites.net',
    ENDPOINTS: {
        USER_LOGIN: '/api/users/login',
        USER_REGISTER: '/api/users/register',
        USER_PROFILE: '/api/users',
        CAREGIVERS: '/api/caregivers',
        CAREGIVER_LOGIN: '/api/caregivers/login',
        CAREGIVER_REGISTER: '/api/caregivers/register',
        BOOKINGS: '/api/bookings',
        USER_BOOKINGS: '/api/bookings/user',
        CAREGIVER_BOOKINGS: '/api/bookings/caregiver',
        REVIEWS: '/api/reviews',
        CAREGIVER_REVIEWS: '/api/reviews/caregiver',
        JOBS: '/api/jobs',
        OPEN_JOBS: '/api/jobs/open',
        CAREGIVER_JOBS: '/api/jobs/for-caregiver',
        ACCEPTED_JOBS: '/api/jobs/accepted',
        MESSAGES: '/api/messages',
        MESSAGE_THREAD: '/api/messages/thread',
        USER_THREADS: '/api/messages/threads/user',
        CAREGIVER_THREADS: '/api/messages/threads/caregiver',
        TRAINING: '/api/training',
        TRAINING_ENROLL: '/api/training/enroll',
        CAREGIVER_TRAINING: '/api/training/caregiver'
    }
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
        console.log('🔄 API Call:', url); // DEBUG
        console.log('📦 Request:', config); // DEBUG
        
        const response = await fetch(url, config);
        
        console.log('📡 Response Status:', response.status); // DEBUG
        
        // Check if response has content
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error('❌ Non-JSON response:', text);
            throw new Error(`Expected JSON but got ${contentType}. Response: ${text}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Response Data:', data); // DEBUG
        
        if (!response.ok) {
            throw new Error(data.error || `API request failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('❌ API Call Error:', error);
        console.error('URL was:', url);
        console.error('Options were:', config);
        throw error;
    }
}