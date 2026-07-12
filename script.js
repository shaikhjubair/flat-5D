/* ==========================================================================
   Flat 5D - Smart Meal Management System
   JavaScript Logic - Part 1 of 3 (Total Part 7 of 9)
   ========================================================================== */

/**
 * --------------------------------------------------------------------------
 * 1. Application State & LocalStorage Management
 * --------------------------------------------------------------------------
 * This section handles the core data structure of the application.
 * It defines the default members, their roles, and initializes
 * the 31-day data structure for meals, bazaar, vacations, and notices.
 */

const defaultState = {
    isAdmin: false,
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
    activeUserId: null,
    guestMeals: {},
    vacations: {},
    members: [
        { 
            id: 1, 
            name: "Abid", 
            role: "admin_eligible", 
            image: "images/abid.jpg" 
        },
        { 
            id: 2, 
            name: "Rifat", 
            role: "user", 
            image: "images/rifat.jpg" 
        },
        { 
            id: 3, 
            name: "Jubair", 
            role: "admin_eligible", 
            image: "images/jubair.jpg" 
        },
        { 
            id: 4, 
            name: "Maimun", 
            role: "user", 
            image: "images/maimun.jpg" 
        },
        { 
            id: 5, 
            name: "Onon", 
            role: "user", 
            image: "images/onon.jpg" 
        },
        { 
            id: 6, 
            name: "Sakib", 
            role: "user", 
            image: "images/sakib.jpg" 
        },
        { 
            id: 7, 
            name: "Mostakim", 
            role: "user", 
            image: "images/mostakim.jpg" 
        }
    ],
    bazaarRecords: [],
    notices: [],
    meals: {},
    history: {}
};

// Initialize empty days data for the default state dynamically
const initialDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
for (let i = 1; i <= initialDays; i++) {
    defaultState.meals[i] = {
        morning: {},
        night: {},
        khalaStatus: {
            morning: 'pending',
            night: 'pending'
        }
    };
    
    // By default, everyone's meal is ON (1)
    defaultState.members.forEach(function(member) {
        defaultState.meals[i].morning[member.id] = 1;
        defaultState.meals[i].night[member.id] = 1;
    });
}

// Clone default state into AppState
let AppState = JSON.parse(JSON.stringify(defaultState));

// Load data from LocalStorage
const savedData = localStorage.getItem('flat5d_data');
if (savedData) {
    try {
        const parsedData = JSON.parse(savedData);
        Object.assign(AppState, parsedData);
        AppState.isAdmin = false; 
    } catch (error) {
        console.error("Error loading local data", error);
    }
}

// --------------------------------------------------------------------------
// 🔥 FIREBASE REAL-TIME DATABASE SETUP (LIVE SYNC)
// --------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBOFjoltjSiYcmIPyl4Qn8giEytyWiw828",
  authDomain: "flat-5d.firebaseapp.com",
  databaseURL: "https://flat-5d-default-rtdb.firebaseio.com",
  projectId: "flat-5d",
  storageBucket: "flat-5d.firebasestorage.app",
  messagingSenderId: "119045539173",
  appId: "1:119045539173:web:2fb4ddac0df43b1f370d8c"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let lastSavedString = ""; 
let isCloudSynced = false; 

// ১. ফায়ারবেস থেকে রিয়েল-টাইম ডেটা পড়া (Read & Sync)
// ১. ফায়ারবেস থেকে রিয়েল-টাইম ডেটা পড়া (Read & Sync)
database.ref('flat5d_data').on('value', (snapshot) => {
    isCloudSynced = true; 
    const data = snapshot.val();
    if (!data) return; 
    
    const incomingString = JSON.stringify(data);
    if (incomingString === lastSavedString) return; 
    
    lastSavedString = incomingString;
    
    const currentUserId = AppState.activeUserId;
    const currentAdminStatus = AppState.isAdmin;
    
    // ফিক্স ১: ক্লাউডের ডেটা দিয়ে লোকাল ডেটা পুরোপুরি মুছে নতুন করে বসানো
    AppState = JSON.parse(JSON.stringify(defaultState));
    Object.assign(AppState, data);

    // ফিক্স ২: ফায়ারবেস Array কে Object বানিয়ে ফেললে, সেটাকে জোর করে ঠিক করা
    if (AppState.members && !Array.isArray(AppState.members)) {
        AppState.members = Object.values(AppState.members);
    }
    if (AppState.bazaarRecords && !Array.isArray(AppState.bazaarRecords)) {
        AppState.bazaarRecords = Object.values(AppState.bazaarRecords);
    }
    if (AppState.notices && !Array.isArray(AppState.notices)) {
        AppState.notices = Object.values(AppState.notices);
    }
    
    AppState.activeUserId = currentUserId;
    AppState.isAdmin = currentAdminStatus;

    // ফিক্স ৩: ক্লাউড থেকে আসা লেটেস্ট ডেটা ফোনের মেমোরিতেও সেভ করে রাখা
    localStorage.setItem('flat5d_data', incomingString);

    // ফিক্স ৪: ড্রপডাউন মেনুগুলো এবং অন্যান্য UI রেন্ডার করা
    if(typeof populateMemberDropdowns === 'function') populateMemberDropdowns(); 
    
    if(typeof updateDashboardStats === 'function') updateDashboardStats();
    if(typeof updateNextMealDisplay === 'function') updateNextMealDisplay();
    if(typeof updateQuickMealToggle === 'function') updateQuickMealToggle();
    if(typeof renderCalendar === 'function') renderCalendar();
    if(typeof renderBazaarList === 'function') renderBazaarList();
    if(typeof renderGuestMealBox === 'function') renderGuestMealBox();
    if(typeof renderVacationBox === 'function') renderVacationBox();
    if(typeof renderMonthlySummary === 'function') renderMonthlySummary();
    if(typeof updateKhalaUI === 'function') updateKhalaUI();
    
    // 🔥 এই সেই নতুন লাইন যা ক্যালেন্ডারের মাসের ড্রপডাউনটি ঠিক করবে:
    if(typeof populateCalendarMonthDropdown === 'function') populateCalendarMonthDropdown();
    
    // ফায়ারবেস থেকে ডেটা লোড হওয়ার পরই কেবল মাস চেঞ্জ হওয়ার চেক করবে
    if(typeof checkAndResetNewMonth === 'function') checkAndResetNewMonth();
});

// ২. সেভ করার সময় ফায়ারবেসে পাঠানো (Write to Cloud)
function saveData() {
    if (!isCloudSynced) return; 

    try {
        const cloudState = JSON.parse(JSON.stringify(AppState));
        cloudState.activeUserId = null;
        cloudState.isAdmin = false;
        
        const newString = JSON.stringify(cloudState);
        if (newString === lastSavedString) return; 
        
        lastSavedString = newString;
        database.ref('flat5d_data').set(cloudState); 
        localStorage.setItem('flat5d_data', newString); 
        
    } catch (error) {
        console.error("Error saving data to Firebase:", error);
    }
}

/**
 * --------------------------------------------------------------------------
 * 2. Utility & Helper Functions
 * --------------------------------------------------------------------------
 */

/**
 * Converts English numbers to Bengali digits
 * @param {number|string} engNum - The English number
 * @returns {string} - The Bengali number
 */
function convertToBanglaNumber(engNum) {
    const banglaDigits = {
        '0': '০',
        '1': '১',
        '2': '২',
        '3': '৩',
        '4': '৪',
        '5': '৫',
        '6': '৬',
        '7': '৭',
        '8': '৮',
        '9': '৯'
    };
    
    return String(engNum).replace(/[0-9]/g, function(match) {
        return banglaDigits[match];
    });
}

/**
 * Formats a Date object into a readable Bengali date string
 * @param {Date} dateObj - The Date object
 * @returns {string} - Formatted Bengali date (e.g., ১৬ মে, ২০২৬)
 */
function getBengaliDate(dateObj) {
    const months = [
        "জানুয়ারি", 
        "ফেব্রুয়ারি", 
        "মার্চ", 
        "এপ্রিল", 
        "মে", 
        "জুন", 
        "জুলাই", 
        "আগস্ট", 
        "সেপ্টেম্বর", 
        "অক্টোবর", 
        "নভেম্বর", 
        "ডিসেম্বর"
    ];
    
    const days = [
        "রবিবার", 
        "সোমবার", 
        "মঙ্গলবার", 
        "বুধবার", 
        "বৃহস্পতিবার", 
        "শুক্রবার", 
        "শনিবার"
    ];
    
    const dayName = days[dateObj.getDay()];
    const dateNum = convertToBanglaNumber(dateObj.getDate());
    const monthName = months[dateObj.getMonth()];
    const yearNum = convertToBanglaNumber(dateObj.getFullYear());
    
    return `${dateNum} ${monthName}, ${yearNum} (${dayName})`;
}

/**
 * Formats a numeric amount into Bengali Currency format
 * @param {number} amount - The amount in English digits
 * @returns {string} - Formatted Bengali currency (e.g., ১২.০০ ৳)
 */
function formatCurrency(amount) {
    if (isNaN(amount)) return "০.০০ ৳";
    return convertToBanglaNumber(amount.toFixed(2)) + " ৳";
}

/**
 * Displays a Toast Notification on the screen
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('success' or 'error')
 */
function showToast(message, type = 'success') {
    const msgBox = document.getElementById('toastMessage');
    const msgText = document.getElementById('toastText');
    
    if (!msgBox || !msgText) return;
    
    msgText.innerText = message;
    
    if (type === 'error') {
        msgBox.classList.add('error');
    } else {
        msgBox.classList.remove('error');
    }
    
    msgBox.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(function() {
        msgBox.classList.remove('show');
    }, 3000);
}

/**
 * Displays a Custom Confirmation Modal (Updated with safety validation)
 * @param {string} message - The question to ask the user
 * @param {Function} onConfirm - Callback function if user clicks "Yes"
 * @param {string} validationWord - (Optional) Word user must type to confirm
 */
window.customConfirm = function(message, onConfirm, validationWord = null) {
    const modal = document.getElementById('customConfirmModal');
    const msgEl = document.getElementById('customConfirmMessage');
    const inputEl = document.getElementById('customConfirmInput');
    const errorEl = document.getElementById('customConfirmError');
    
    if (!modal || !msgEl) return;
    
    msgEl.innerText = message;
    modal.classList.add('show');
    
    // ইনপুট বক্স শো/হাইড করার লজিক
    if (validationWord) {
        if (inputEl) {
            inputEl.style.display = 'block';
            inputEl.value = ''; // আগের লেখা ক্লিয়ার করে দেওয়া
        }
        if (errorEl) errorEl.style.display = 'none';
    } else {
        if (inputEl) inputEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
    }
    
    const okBtn = document.getElementById('customConfirmOk');
    const cancelBtn = document.getElementById('customConfirmCancel');
    
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    
    okBtn.replaceWith(newOkBtn);
    cancelBtn.replaceWith(newCancelBtn);
    
    newCancelBtn.addEventListener('click', function() {
        modal.classList.remove('show');
    });
    
    newOkBtn.addEventListener('click', function() {
        if (validationWord) {
            // যদি validationWord দেওয়া থাকে, তবে চেক করতে হবে
            if (inputEl && inputEl.value.trim().toLowerCase() === validationWord.toLowerCase()) {
                modal.classList.remove('show');
                if (typeof onConfirm === 'function') onConfirm();
            } else {
                if (errorEl) errorEl.style.display = 'block'; // ভুল লিখলে এরর দেখাবে
            }
        } else {
            // যদি ইনপুট না লাগে, সরাসরি কাজ করবে
            modal.classList.remove('show');
            if (typeof onConfirm === 'function') onConfirm();
        }
    });
};

/**
 * --------------------------------------------------------------------------
 * 3. User Authentication & Initial Setup logic
 * --------------------------------------------------------------------------
 */

/**
 * Populates the user selection dropdowns across the application
 */
function populateMemberDropdowns() {
    const activeSelect = document.getElementById('activeUserSelect');
    const bazaarSelect = document.getElementById('bazaarMemberSelect');
    
    if (activeSelect) {
        activeSelect.innerHTML = '<option value="" disabled selected>আপনার নাম সিলেক্ট করুন...</option>';
    }
    
    if (bazaarSelect) {
        bazaarSelect.innerHTML = '';
    }
    
    if (AppState.members && Array.isArray(AppState.members)) {
        AppState.members.forEach(function(member) {
            const optionHTML = `<option value="${member.id}">${member.name}</option>`;
            
            if (activeSelect) {
                activeSelect.insertAdjacentHTML('beforeend', optionHTML);
            }
            if (bazaarSelect) {
                bazaarSelect.insertAdjacentHTML('beforeend', optionHTML);
            }
        });
    }
}

// User Login Logic (Entering the website)
const enterBtn = document.getElementById('enterWebsiteBtn');

if (enterBtn) {
    enterBtn.addEventListener('click', function() {
        const selectedId = document.getElementById('activeUserSelect').value;
        
        if (!selectedId) {
            showToast('দয়া করে আপনার নাম সিলেক্ট করুন!', 'error');
            return;
        }
        
        AppState.activeUserId = parseInt(selectedId);
        const activeUser = AppState.members.find(m => m.id === AppState.activeUserId);
        
        if (activeUser) {
            const greetingEl = document.getElementById('greetingText');
            if (greetingEl) {
                greetingEl.innerText = "Welcome, " + activeUser.name + "!";
            }
            
            // Reset Admin Status
            AppState.isAdmin = false;
            
            const adminBtn = document.getElementById('adminLoginBtn');
            if (adminBtn) {
                adminBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px; height:20px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg> <span class="admin-btn-text">অ্যাডমিন লগিন</span>`;
                adminBtn.style.background = '';
            }
            
            // Hide admin-only elements
            document.querySelectorAll('.admin-only-btn').forEach(function(btn) {
                btn.style.display = 'none';
            });
        }
        
        const loginModal = document.getElementById('userLoginModal');
        if (loginModal) {
            loginModal.classList.remove('show');
        }
        
        showToast('সিস্টেমে সফলভাবে প্রবেশ করেছেন!', 'success');
        
        // Call global refresh if available
        if (typeof window.refreshAll === 'function') {
            window.refreshAll();
        }
    });
}

// Admin Login Button Click
const adminLoginBtn = document.getElementById('adminLoginBtn');

if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', function() {
        if (AppState.isAdmin) {
            // Logout logic
            AppState.isAdmin = false;
            adminLoginBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px; height:20px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg> <span class="admin-btn-text">অ্যাডমিন লগিন</span>`;
            adminLoginBtn.style.background = '';
            
            document.querySelectorAll('.admin-only-btn').forEach(function(btn) {
                btn.style.display = 'none';
            });
            
            showToast("অ্যাডমিন প্যানেল থেকে লগআউট করা হয়েছে।", "success");
            
            if (typeof window.refreshAll === 'function') {
                window.refreshAll();
            }
        } else {
            // Show Login Modal
            const adminModal = document.getElementById('adminLoginModal');
            if (adminModal) {
                adminModal.classList.add('show');
                document.getElementById('adminPasswordInput').value = '';
                document.getElementById('passwordError').style.display = 'none';
            }
        }
    });
}

// Verify Admin Password
const verifyPasswordBtn = document.getElementById('verifyPasswordBtn');

if (verifyPasswordBtn) {
    verifyPasswordBtn.addEventListener('click', function() {
        const passwordInput = document.getElementById('adminPasswordInput');
        const errorEl = document.getElementById('passwordError');
        
        if (passwordInput && passwordInput.value === "flat5dadmin") {
            AppState.isAdmin = true;
            
            const adminModal = document.getElementById('adminLoginModal');
            if (adminModal) {
                adminModal.classList.remove('show');
            }
            
            const adminBtn = document.getElementById('adminLoginBtn');
            if (adminBtn) {
                adminBtn.innerHTML = `<span class="admin-btn-text">লগআউট (Admin)</span>`;
                adminBtn.style.background = 'var(--danger-color)';
                adminBtn.style.borderColor = 'var(--danger-color)';
            }
            
            document.querySelectorAll('.admin-only-btn').forEach(function(btn) {
                btn.style.display = 'block';
            });
            
            showToast("অ্যাডমিন প্যানেলে সফলভাবে লগিন হয়েছেন!", "success");
            
            if (typeof window.refreshAll === 'function') {
                window.refreshAll();
            }
        } else {
            if (errorEl) {
                errorEl.style.display = 'block';
            }
        }
    });
}

/* ==========================================================================
   Flat 5D - Smart Meal Management System
   JavaScript Logic - Part 2 of 3 (Total Part 8 of 9)
   ========================================================================== */

/**
 * --------------------------------------------------------------------------
 * 4. Navigation & Modal Triggers
 * --------------------------------------------------------------------------
 * Handles switching between different sections (Dashboard, Calendar, etc.)
 * and opening/closing all pop-up modals smoothly.
 */

// Universal Close Modal Logic
document.querySelectorAll('.close-modal').forEach(function(button) {
    button.addEventListener('click', function() {
        const modalOverlay = button.closest('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('show');
        }
    });
});

// Setup Add Buttons to open specific Modals with form reset
const modalTriggers = [
    { buttonId: 'addBazaarBtn', formId: 'addBazaarForm', modalId: 'addBazaarModal' },
    { buttonId: 'addNoticeBtn', formId: 'addNoticeForm', modalId: 'addNoticeModal' },
    { buttonId: 'addMemberBtn', formId: 'addMemberForm', modalId: 'addMemberModal' }
];

modalTriggers.forEach(function(trigger) {
    const btn = document.getElementById(trigger.buttonId);
    if (btn) {
        btn.addEventListener('click', function() {
            // Reset the form inside the modal to clear previous inputs
            const form = document.getElementById(trigger.formId);
            if (form) {
                form.reset();
            }
            // Show the target modal
            const modal = document.getElementById(trigger.modalId);
            if (modal) {
                modal.classList.add('show');
            }
        });
    }
});

// Sidebar Navigation Menu Logic
document.querySelectorAll('.nav-item').forEach(function(navItem) {
    navItem.addEventListener('click', function() {
        
        // Remove active class from all navigation items
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.classList.remove('active');
        });
        
        // Add active class to the currently clicked item
        navItem.classList.add('active');
        
        // Get target section ID from data attribute
        const targetSectionId = navItem.getAttribute('data-target');
        
        // Hide all main content sections
        document.querySelectorAll('.content-section').forEach(function(section) {
            section.classList.remove('active-section');
            // Small timeout to allow fade-out animation if needed
            setTimeout(function() {
                section.style.display = 'none';
            }, 50);
        });
        
        // Show the target section with animation
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            setTimeout(function() {
                targetSection.style.display = 'block';
                // Trigger reflow for animation
                void targetSection.offsetWidth; 
                targetSection.classList.add('active-section');
            }, 60);
        }
        
        // Refresh data whenever a tab is switched to ensure fresh data
        if (typeof window.refreshAll === 'function') {
            window.refreshAll();
        }
    });
});

/**
 * --------------------------------------------------------------------------
 * 5. Core Time Logic & Calculations
 * --------------------------------------------------------------------------
 * Calculates meal rates, total costs, and checks if a meal time has passed.
 */

/**
 * Strictly checks if the time for a specific meal slot has passed.
 * Morning Meal deadline: 8:00 AM
 * Night Meal deadline: 6:00 PM (18:00)
 * * @param {number} day - The date of the month (1-31)
 * @param {string} type - 'morning' or 'night'
 * @returns {boolean} - True if time is passed, false otherwise
 */

function isTimePassedStrictly(day, type) {
    if (!AppState.meals[day]) return false;

    const now = new Date();
    const realDay = now.getDate();
    const realMonth = now.getMonth() + 1;
    const realYear = now.getFullYear();

    // ফিক্স: যদি বর্তমান স্টেট অতীতের কোনো মাসের হয়, তবে ওই মাসের সব দিনই লকড (অতীত)!
    if (AppState.currentYear < realYear || (AppState.currentYear === realYear && AppState.currentMonth < realMonth)) {
        return true;
    }

    if (day < realDay) return true;

    return AppState.meals[day].khalaStatus[type] !== 'pending';
}

function isMealLocked(day, type) {
    if (AppState.isAdmin) return false; // অ্যাডমিন সবসময় এডিট করতে পারবে
    return isTimePassedStrictly(day, type);
}

/**
 * Calculates the total bazaar, total active meals, and the current meal rate.
 * Updated Logic: Counts meals if time has passed OR if khala is confirmed 'yes'.
 * @returns {Object} { totalBazaar, totalMeals, currentMealRate }
 */
function calculateTotals() {
    let totalBazaar = 0;
    let totalMeals = 0;

    if (AppState.bazaarRecords) {
        AppState.bazaarRecords.forEach(record => totalBazaar += (record.amount || 0));
    }

    const now = new Date();
    const realDay = now.getDate();
    const realMonth = now.getMonth() + 1;
    const realYear = now.getFullYear();

    // ফিক্স: যদি অ্যাপটি আগের মাসের ডেটায় আটকে থাকে, তবে ওই মাসের সব দিনকেই কাউন্ট করতে হবে
    const isPastMonth = (AppState.currentYear < realYear) || (AppState.currentYear === realYear && AppState.currentMonth < realMonth);

    const daysInMonth = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        if (AppState.meals[day]) {
            ['morning', 'night'].forEach(type => {
                const isConfirmed = AppState.meals[day].khalaStatus[type] === 'yes';
                // ফিক্স: আগের মাস হলে সব দিনই অতীত (true), নাহলে শুধু আজকের আগের দিনগুলো
                const isPastDay = isPastMonth ? true : (day < realDay);

                if (isPastDay || isConfirmed) {
                    AppState.members.forEach(member => {
                        totalMeals += (AppState.meals[day][type][member.id] || 0);
                    });
                }
            });
        }
    }

    const currentMealRate = totalMeals > 0 ? (totalBazaar / totalMeals) : 0;
    return { totalBazaar, totalMeals, currentMealRate };
}

/**
 * Animates a number counting up from start to end.
 * Used for Dashboard top premium cards.
 * * @param {string} elementId - Target DOM element ID
 * @param {number} start - Starting number
 * @param {number} end - Ending number
 * @param {number} duration - Duration in milliseconds
 * @param {boolean} isCurrency - If true, formats as currency (e.g. ৳)
 */
function animateValue(elementId, start, end, duration, isCurrency = false) {
    const obj = document.getElementById(elementId);
    if (!obj) return;
    
    let startTimestamp = null;
    
    const step = function(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function for smooth slowdown at the end (easeOutQuart)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentVal = (easeOutQuart * (end - start)) + start;
        
        if (isCurrency) {
            obj.innerText = formatCurrency(currentVal);
        } else {
            // Use Math.floor for integer counts (like total meals)
            obj.innerText = convertToBanglaNumber(Math.floor(currentVal));
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Ensure exact final value at the end of animation
            if (isCurrency) {
                obj.innerText = formatCurrency(end);
            } else {
                obj.innerText = convertToBanglaNumber(end);
            }
        }
    };
    
    window.requestAnimationFrame(step);
}

/**
 * --------------------------------------------------------------------------
 * 6. Rendering Main Dashboard Data
 * --------------------------------------------------------------------------
 */

/**
 * Updates the top stat cards and the member cards grid on the Dashboard.
 */

window.updateDashboardStats = function() {
    const totals = calculateTotals();
    
    animateValue('totalBazaarValue', 0, totals.totalBazaar, 1500, true);
    animateValue('totalMealsValue', 0, totals.totalMeals, 1500, false);
    animateValue('currentMealRate', 0, totals.currentMealRate, 1500, true);
    
    const gridContainer = document.getElementById('membersGrid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = ''; 
    if (!AppState.members || !Array.isArray(AppState.members)) return;
    
    AppState.members.forEach(function(member) {
        let memberBazaar = 0;
        if (AppState.bazaarRecords) {
            AppState.bazaarRecords.forEach(function(record) {
                if (record.memberId === member.id) {
                    memberBazaar += (record.amount || 0);
                }
            });
        }
        
        let memberMeals = 0;
        const daysInMonth = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {     
            if (AppState.meals[day]) {
                // Updated Logic here as well
                if (isTimePassedStrictly(day, 'morning') || AppState.meals[day].khalaStatus.morning === 'yes') {
                    memberMeals += (AppState.meals[day].morning[member.id] || 0);
                }
                if (isTimePassedStrictly(day, 'night') || AppState.meals[day].khalaStatus.night === 'yes') {
                    memberMeals += (AppState.meals[day].night[member.id] || 0);
                }
            }
        }
        
        const mealCost = memberMeals * totals.currentMealRate;
        const balance = memberBazaar - mealCost;
        
        let balanceHtml = '';
        if (balance > 1) {
            balanceHtml = `<span style="color:var(--success-color)">পাবেন: ${formatCurrency(balance)}</span>`;
        } else if (balance < -1) {
            balanceHtml = `<span style="color:var(--danger-color)">দিতে হবে: ${formatCurrency(Math.abs(balance))}</span>`;
        } else {
            balanceHtml = `<span style="color:var(--text-muted)">হিসাব সমান</span>`;
        }
        
        let deleteBtnHtml = '';
        if (AppState.isAdmin) {
            deleteBtnHtml = `
                <button 
                    onclick="removeMember(${member.id})" 
                    style="position: absolute; top: 15px; right: 15px; background: var(--danger-light); color: var(--danger-color); border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-weight: bold; font-size: 18px; display: flex; align-items: center; justify-content: center; z-index: 10; transition: 0.3s;"
                    onmouseover="this.style.background='var(--danger-color)'; this.style.color='#fff';"
                    onmouseout="this.style.background='var(--danger-light)'; this.style.color='var(--danger-color)';"
                >
                    &times;
                </button>
            `;
        }

        const cardHtml = `
            <div class="member-card">
                ${deleteBtnHtml}
                <div class="member-header">
                    <img src="${member.image}" alt="${member.name}" class="member-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff'">
                    <div class="member-info">
                        <h4 class="member-name">${member.name}</h4>
                        <p class="member-status">মোট মিল: <span class="fw-bold text-dark">${convertToBanglaNumber(memberMeals)}</span></p>
                    </div>
                </div>
                <div class="member-stats">
                    <div class="stat-row">
                        <span>জমা/বাজার:</span>
                        <span class="text-success fw-bold">${formatCurrency(memberBazaar)}</span>
                    </div>
                    <div class="stat-row">
                        <span>মিল খরচ:</span>
                        <span class="text-danger fw-bold">${formatCurrency(mealCost)}</span>
                    </div>
                </div>
                <div class="member-balance">
                    ${balanceHtml}
                </div>
            </div>
        `;
        
        gridContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
};

/**
 * --------------------------------------------------------------------------
 * 7. Guest Meals & Vacation (Absence) Logic
 * --------------------------------------------------------------------------
 * Advanced system to handle multiple guest meals for specific durations,
 * and complete absence (vacation) modes.
 */

// Format Guest Data securely on startup
if (AppState.guestMeals) {
    Object.keys(AppState.guestMeals).forEach(function(uid) {
        if (typeof AppState.guestMeals[uid] === 'number') {
            AppState.guestMeals[uid] = { 
                count: AppState.guestMeals[uid], 
                duration: null, 
                isMorning: true, 
                isNight: true 
            };
        }
    });
}

/**
 * Applies Guest Meals dynamically to the calendar (Fully Independent Logic)
 */
function applyAdvancedGuestMeals(uid, config, isAdd) {
    const count = parseInt(config.count) || 0;
    const duration = config.duration ? parseInt(config.duration) : null;
    const isMorning = config.isMorning;
    const isNight = config.isNight;
    
    let mealsApplied = 0;
    const currentDay = new Date().getDate();
    // 🔥 ফিক্স: 31 এর বদলে ডাইনামিক মাসের দিন
    const daysInMonth = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();
    
    for (let day = currentDay; day <= daysInMonth; day++) {
        if (!AppState.meals[day]) continue; // সেফটি চেক
        
        if (duration !== null && mealsApplied >= duration) break;
        
        // Morning Update 
        if (isMorning && !isTimePassedStrictly(day, 'morning')) {
            let currentMorning = parseFloat(AppState.meals[day].morning[uid]) || 0;
            if (isAdd) {
                AppState.meals[day].morning[uid] = currentMorning + count;
            } else {
                let newValue = currentMorning - count;
                AppState.meals[day].morning[uid] = newValue < 0 ? 0 : newValue;
            }
            mealsApplied++;
            if (duration !== null && mealsApplied >= duration) break;
        }
        
        // Night Update 
        if (isNight && !isTimePassedStrictly(day, 'night')) {
            let currentNight = parseFloat(AppState.meals[day].night[uid]) || 0;
            if (isAdd) {
                AppState.meals[day].night[uid] = currentNight + count;
            } else {
                let newValue = currentNight - count;
                AppState.meals[day].night[uid] = newValue < 0 ? 0 : newValue;
            }
            mealsApplied++;
            if (duration !== null && mealsApplied >= duration) break;
        }
    }
}

// Render Guest Meal Box UI
window.renderGuestMealBox = function() {
    const uid = AppState.activeUserId; 
    if (!uid) return;
    
    const config = AppState.guestMeals[uid];
    const controls = document.getElementById('guestMealControls');
    const statusBox = document.getElementById('activeGuestMealStatus');
    const detailsTxt = document.getElementById('guestMealDetailsTxt');
    
    if (config) {
        // Guest mode is ON
        if (controls) controls.style.display = 'none'; 
        if (statusBox) statusBox.style.display = 'block';
        
        if (detailsTxt) {
            let txtHtml = `<span style="font-size: 20px;">${convertToBanglaNumber(config.count)}</span> টি গেস্ট মিল<br><span style="font-size: 14px; opacity:0.9;">(`;
            
            if (config.isMorning && config.isNight) txtHtml += 'সকাল ও রাত'; 
            else if (config.isMorning) txtHtml += 'শুধু সকাল'; 
            else if (config.isNight) txtHtml += 'শুধু রাত';
            
            txtHtml += `)</span><br>`;
            
            if (config.duration) txtHtml += `<span style="font-size: 14px; opacity:0.8; margin-top:5px; display:block;">${convertToBanglaNumber(config.duration)} বেলার জন্য</span>`; 
            else txtHtml += `<span style="font-size: 14px; opacity:0.8; margin-top:5px; display:block;">আনলিমিটেড সময়</span>`;
            
            detailsTxt.innerHTML = txtHtml;
        }
    } else {
        // Guest mode is OFF
        if (controls) controls.style.display = 'block'; 
        if (statusBox) statusBox.style.display = 'none';
    }
};

// Start Guest Meal Event
const startGuestBtn = document.getElementById('startGuestMealBtn');
if (startGuestBtn) {
    startGuestBtn.addEventListener('click', function() {
        const countInput = document.getElementById('guestMealCountInput').value;
        const count = parseInt(countInput);
        const durationVal = document.getElementById('guestMealDurationInput').value;
        const duration = durationVal ? parseInt(durationVal) : null;
        
        const isMorning = document.getElementById('guestMorningCheck').checked;
        const isNight = document.getElementById('guestNightCheck').checked;
        
        if (!count || count < 1 || isNaN(count)) {
            return showToast('দয়া করে সঠিক গেস্টের সংখ্যা লিখুন!', 'error');
        }
        
        if (!isMorning && !isNight) {
            return showToast('সকাল অথবা রাত যেকোনো একটি সিলেক্ট করুন!', 'error');
        }
        
        const config = { count: count, duration: duration, isMorning: isMorning, isNight: isNight };
        
        // Save to State and Apply to Calendar
        AppState.guestMeals[AppState.activeUserId] = config; 
        applyAdvancedGuestMeals(AppState.activeUserId, config, true);
        
        showToast('গেস্ট মিল চালু হয়েছে!', 'success'); 
        
        if (typeof window.refreshAll === 'function') {
            window.refreshAll();
        }
    });
}

// Stop Guest Meal Event
const stopGuestBtn = document.getElementById('stopGuestMealBtn');
if (stopGuestBtn) {
    stopGuestBtn.addEventListener('click', function() {
        const config = AppState.guestMeals[AppState.activeUserId];
        if (config) { 
            // Remove applied meals from calendar
            applyAdvancedGuestMeals(AppState.activeUserId, config, false); 
            // Delete configuration
            delete AppState.guestMeals[AppState.activeUserId]; 
            
            showToast('গেস্ট মিল অফ করা হয়েছে!', 'success'); 
            
            if (typeof window.refreshAll === 'function') {
                window.refreshAll();
            }
        }
    });
}

/**
 * Vacation (Complete Absence) Logic
 * Turns off all future unlocked meals automatically.
 */
function applyVacation(uid, isStart) {
    const currentDay = new Date().getDate();
    // 🔥 ফিক্স: 31 এর বদলে ডাইনামিক মাসের দিন
    const daysInMonth = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();
    
    for (let day = currentDay; day <= daysInMonth; day++) {
        if (!AppState.meals[day]) continue; // সেফটি চেক, যাতে ক্র্যাশ না করে
        
        // Set meal to 0 if starting vacation, reset to 1 if stopping
        if (!isTimePassedStrictly(day, 'morning')) {
            AppState.meals[day].morning[uid] = isStart ? 0 : 1;
        }
        if (!isTimePassedStrictly(day, 'night')) {
            AppState.meals[day].night[uid] = isStart ? 0 : 1;
        }
    }
}

// Render Vacation UI Box
window.renderVacationBox = function() {
    const uid = AppState.activeUserId; 
    if (!uid) return;
    
    const isVacation = AppState.vacations[uid];
    const controls = document.getElementById('vacationControls');
    const statusBox = document.getElementById('activeVacationStatus');
    
    if (isVacation) { 
        if (controls) controls.style.display = 'none'; 
        if (statusBox) statusBox.style.display = 'block'; 
    } else { 
        if (controls) controls.style.display = 'block'; 
        if (statusBox) statusBox.style.display = 'none'; 
    }
};

// Start Vacation Event (With Guest Meal Independence Logic)
const startVacBtn = document.getElementById('startVacationBtn');
if (startVacBtn) {
    const newStartVacBtn = startVacBtn.cloneNode(true);
    startVacBtn.replaceWith(newStartVacBtn);
    
    newStartVacBtn.addEventListener('click', function() {
        window.customConfirm("ভবিষ্যতের সব আনলকড মিল ০ হয়ে যাবে। আপনি কি নিশ্চিত?", function() {
            const uid = AppState.activeUserId;
            
            // ১. আগে নিজের মিল ছুটি/অফ করা হলো
            AppState.vacations[uid] = true; 
            applyVacation(uid, true);
            
            // ২. গেস্ট মিল চেক করে ইউজারকে প্রশ্ন করা
            if (AppState.guestMeals && AppState.guestMeals[uid]) {
                if (confirm("⚠️ আপনার গেস্ট মিল চালু আছে!\n\nআপনি কি গেস্ট মিলও অফ করতে চান?\n\n'OK' দিলে গেস্ট মিল অফ হয়ে যাবে।\n'Cancel' দিলে ছুটি থাকার পরও গেস্ট মিল চলতে থাকবে।")) {
                    applyAdvancedGuestMeals(uid, AppState.guestMeals[uid], false);
                    delete AppState.guestMeals[uid];
                }
            }
            
            showToast('ছুটি চালু! সামনের সব মিল অফ করা হয়েছে।', 'success'); 
            if (typeof window.refreshAll === 'function') {
                window.refreshAll();
            }
        });
    });
}

// Stop Vacation Event
const stopVacBtn = document.getElementById('stopVacationBtn');
if (stopVacBtn) {
    stopVacBtn.addEventListener('click', function() {
        window.customConfirm("ছুটি শেষ? আগামী সব আনলকড মিল আবার চালু (১) হয়ে যাবে। নিশ্চিত?", function() {
            delete AppState.vacations[AppState.activeUserId]; 
            applyVacation(AppState.activeUserId, false);
            
            showToast('ছুটি শেষ! রেগুলার মিল চালু হয়েছে।', 'success'); 
            
            if (typeof window.refreshAll === 'function') {
                window.refreshAll();
            }
        });
    });
}

/* ==========================================================================
   Flat 5D - Smart Meal Management System
   JavaScript Logic - Part 3 of 3 (Total Part 9 of 9 - Final)
   ========================================================================== */

/**
 * --------------------------------------------------------------------------
 * 9. Monthly Summary Report & 12-Month Auto History Logic
 * --------------------------------------------------------------------------
 * Handles the automatic transition of months, saves previous months to history,
 * and renders the detailed monthly financial summary.
 */

/**
 * Gets the total number of days in a specific month and year
 * @param {number} month - The month (1-12)
 * @param {number} year - The full year (e.g., 2026)
 * @returns {number} - Number of days in the month
 */
function getDaysInMonth(month, year) {
    // Setting day to 0 of the next month gives the last day of the current month
    return new Date(year, month, 0).getDate();
}

/**
 * Checks if a new month has started.
 * If yes, it backs up the current month's data to history and resets the calendar smartly.
 */
window.checkAndResetNewMonth = function() {
    if (!AppState.history) {
        AppState.history = {};
    }

    const now = new Date();
    const realMonth = now.getMonth() + 1;
    const realYear = now.getFullYear();

    // চেক করা হচ্ছে আসল মাস এবং সেভ করা মাস আলাদা কি না
    if (AppState.currentMonth !== realMonth || AppState.currentYear !== realYear) {
        console.log("নতুন মাস শনাক্ত হয়েছে! পুরনো ডেটা আর্কাইভে পাঠানো হচ্ছে...");

        // ১. calculateTotals এখন আগের মাসের পুরো ডাটা নিখুঁতভাবে ক্যালকুলেট করবে
        const totals = calculateTotals();
        const historyKey = `${AppState.currentYear}-${String(AppState.currentMonth).padStart(2, '0')}`;

        AppState.history[historyKey] = {
            meals: JSON.parse(JSON.stringify(AppState.meals)),
            bazaarRecords: JSON.parse(JSON.stringify(AppState.bazaarRecords || [])),
            finalRate: totals.currentMealRate
        };

        // ২. নতুন মাসের জন্য স্টেট আপডেট
        AppState.currentMonth = realMonth;
        AppState.currentYear = realYear;
        AppState.bazaarRecords = [];

        // ৩. নতুন মাসের সঠিক দিনের সংখ্যা বের করা
        const daysInNewMonth = new Date(realYear, realMonth, 0).getDate();
        AppState.meals = {};

        for (let i = 1; i <= daysInNewMonth; i++) {
            AppState.meals[i] = {
                morning: {},
                night: {},
                khalaStatus: { morning: 'pending', night: 'pending' }
            };

            // ৪. স্মার্ট মিল অ্যাসাইনমেন্ট
            AppState.members.forEach(function(member) {
                const uid = member.id;
                let isMornOn = 1;
                let isNightOn = 1;

                if (AppState.vacations && AppState.vacations[uid]) {
                    isMornOn = 0;
                    isNightOn = 0;
                }
                else if (AppState.mealPreferences && AppState.mealPreferences[uid]) {
                    isMornOn = AppState.mealPreferences[uid].morning ? 1 : 0;
                    isNightOn = AppState.mealPreferences[uid].night ? 1 : 0;
                }

                AppState.meals[i].morning[uid] = isMornOn;
                AppState.meals[i].night[uid] = isNightOn;
            });
        }

        // ৫. ডেটা সেভ করে সবাইকে রিফ্রেশ করে দেওয়া
        saveData();
        showToast("নতুন মাস শুরু হয়েছে! আগের হিসাব আর্কাইভে সেভ করা হয়েছে।", "success");

        if (typeof populateMonthDropdown === 'function') populateMonthDropdown();
        if (typeof populateCalendarMonthDropdown === 'function') populateCalendarMonthDropdown();
        if (typeof renderCalendar === 'function') renderCalendar();
        refreshAll();
    }
};

/**
 * Populates the dropdown selection for viewing monthly reports.
 */
window.populateMonthDropdown = function() {
    const selectEl = document.getElementById('reportMonthSelect');
    if (!selectEl) return;
    
    selectEl.innerHTML = '';
    
    const monthNames = [
        "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", 
        "মে", "জুন", "জুলাই", "আগস্ট", 
        "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];
    
    const currentM = AppState.currentMonth; 
    const currentY = AppState.currentYear;
    
    // Generate dropdown options for all 12 months
    for (let m = 1; m <= 12; m++) {
        const historyKey = `${currentY}-${String(m).padStart(2, '0')}`;
        let optionLabel = `${monthNames[m - 1]} ${convertToBanglaNumber(currentY)}`;
        let optionValue = historyKey;
        
        if (m === currentM) {
            optionLabel += " (চলতি মাস)";
            optionValue = "current";
        } else if (m > currentM) {
            optionLabel += " (আগামী মাস)";
            optionValue = "upcoming"; 
        }
        
        const isSelected = (m === currentM) ? "selected" : "";
        const html = `<option value="${optionValue}" ${isSelected}>${optionLabel}</option>`;
        
        selectEl.insertAdjacentHTML('beforeend', html);
    }

    // Attach event listener to re-render table when month is changed
    selectEl.removeEventListener('change', renderMonthlySummary);
    selectEl.addEventListener('change', renderMonthlySummary);
};

/**
 * Renders the detailed financial summary table for the selected month.
 */
window.renderMonthlySummary = function() {
    const selectEl = document.getElementById('reportMonthSelect');
    const contentBox = document.getElementById('monthlySummaryContent');
    
    if (!selectEl || !contentBox) return;
    
    const selectedValue = selectEl.value;

    if (selectedValue === 'upcoming') {
        contentBox.innerHTML = `
            <div style="text-align:center; padding: 60px 0;">
                <svg style="width:60px; color:#a3aed1; margin-bottom:15px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 style="color:#a3aed1; font-size:22px; font-weight:700;">এই মাসের ডেটা এখনও তৈরি হয়নি!</h3>
                <p style="color:#707eae; font-size:16px;">মাস শুরু হলে তবেই হিসাব দেখা যাবে।</p>
            </div>`;
        return;
    }

    let sourceMeals = AppState.meals;
    let sourceBazaar = AppState.bazaarRecords;
    
    let targetYearStr, targetMonthStr;
    
    if (selectedValue === 'current') {
        targetYearStr = AppState.currentYear;
        targetMonthStr = String(AppState.currentMonth).padStart(2, '0');
    } else {
        const splitVal = selectedValue.split('-');
        targetYearStr = splitVal[0];
        targetMonthStr = splitVal[1];
    }
    
    let targetMonthNum = parseInt(targetMonthStr);
    let targetYearNum = parseInt(targetYearStr);
    let daysInTargetMonth = getDaysInMonth(targetMonthNum, targetYearNum);

    if (selectedValue !== 'current') {
        if (AppState.history && AppState.history[selectedValue]) {
            sourceMeals = AppState.history[selectedValue].meals;
            sourceBazaar = AppState.history[selectedValue].bazaarRecords;
        } else {
            contentBox.innerHTML = `
                <div style="text-align:center; padding: 60px 0;">
                    <svg style="width:60px; color:#fc6076; margin-bottom:15px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 style="color:#fc6076; font-size:22px; font-weight:700;">কোনো তথ্য পাওয়া যায়নি!</h3>
                    <p style="color:#707eae; font-size:16px;">এই মাসের কোনো ডেটা হিস্ট্রিতে রেকর্ড করা নেই।</p>
                </div>`;
            return;
        }
    }

    let totalBazaarAmount = 0;
    sourceBazaar.forEach(function(record) {
        totalBazaarAmount += (record.amount || 0);
    });
    
    let totalMealsCount = 0;
    for (let d = 1; d <= daysInTargetMonth; d++) {
        if (sourceMeals[d]) {
            if (selectedValue !== 'current' || isTimePassedStrictly(d, 'morning') || sourceMeals[d].khalaStatus?.morning === 'yes') {
                AppState.members.forEach(function(m) {
                    totalMealsCount += (sourceMeals[d].morning[m.id] || 0);
                });
            }
            if (selectedValue !== 'current' || isTimePassedStrictly(d, 'night') || sourceMeals[d].khalaStatus?.night === 'yes') {
                AppState.members.forEach(function(m) {
                    totalMealsCount += (sourceMeals[d].night[m.id] || 0);
                });
            }
        }
    }
    totalMealsCount = Math.round(totalMealsCount * 1000) / 1000;

    let calculatedRate = 0;
    if (totalMealsCount > 0) {
        calculatedRate = totalBazaarAmount / totalMealsCount;
    }

    let tableHtml = `
        <table class="bazaar-table">
            <thead>
                <tr>
                    <th>মেম্বার</th>
                    <th>মোট মিল</th>
                    <th>খরচ</th>
                    <th>বাজার জমা</th>
                    <th>পাবে/দিবে</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    AppState.members.forEach(function(member) {
        let memberBazaar = 0;
        sourceBazaar.forEach(function(record) {
            if (record.memberId === member.id) {
                memberBazaar += (record.amount || 0);
            }
        });
        
        let memberMeals = 0; 
        for (let d = 1; d <= daysInTargetMonth; d++) { 
            if (sourceMeals[d]) {
                if (selectedValue !== 'current' || isTimePassedStrictly(d, 'morning') || sourceMeals[d].khalaStatus?.morning === 'yes') {
                    memberMeals += (sourceMeals[d].morning[member.id] || 0); 
                }
                if (selectedValue !== 'current' || isTimePassedStrictly(d, 'night') || sourceMeals[d].khalaStatus?.night === 'yes') {
                    memberMeals += (sourceMeals[d].night[member.id] || 0); 
                }
            }
        }
        memberMeals = Math.round(memberMeals * 1000) / 1000;

        // 🔥 ম্যাজিক ফিক্স: পুরনো মাস হলে এবং মেম্বারের কোনো মিল ও বাজার না থাকলে তাকে হাইড করা হবে
        if (selectedValue !== 'current' && memberMeals === 0 && memberBazaar === 0) {
            return; // এই মেম্বারকে স্কিপ করবে, টেবিলে দেখাবে না!
        }
        
        let mealCost = memberMeals * calculatedRate;
        let balance = memberBazaar - mealCost;
        let cleanBalance = parseFloat(balance.toFixed(2));
        
        let balanceOutput = '';
        if (cleanBalance >= 0) {
            balanceOutput = `<span style="color:var(--success-color); font-weight:800; font-size:16px;">পাবে: ${formatCurrency(cleanBalance)}</span>`;
        } else {
            balanceOutput = `<span style="color:var(--danger-color); font-weight:800; font-size:16px;">দিবে: ${formatCurrency(Math.abs(cleanBalance))}</span>`;
        }
        
        tableHtml += `
            <tr>
                <td><b style="color:var(--text-primary); font-size:16px;">${member.name}</b></td>
                <td style="font-size: 18px; font-weight: 800; color:var(--text-primary);">${convertToBanglaNumber(memberMeals)}</td>
                <td class="text-danger" style="font-weight:800; font-size:16px;">${formatCurrency(mealCost)}</td>
                <td class="text-success" style="font-weight:800; font-size:16px;">${formatCurrency(memberBazaar)}</td>
                <td>${balanceOutput}</td>
            </tr>
        `;
    });
    
    tableHtml += `
            <tr class="total-row" style="background: var(--bg-sidebar); color: white;">
                <td style="font-size:18px; font-weight: 800;">সর্বমোট</td>
                <td style="font-size:22px; font-weight: 800; color: var(--warning-color);">${convertToBanglaNumber(totalMealsCount)}</td>
                <td>-</td>
                <td style="font-size:22px; font-weight: 800; color: var(--success-color);">${formatCurrency(totalBazaarAmount)}</td>
                <td style="color:var(--warning-color); font-size:18px; font-weight: 800;">রেট: ${formatCurrency(calculatedRate)}</td>
            </tr>
        </tbody>
    </table>`;
    
    contentBox.innerHTML = tableHtml;
};

/**
 * --------------------------------------------------------------------------
 * 10. Motivational Quotes Engine (Islamic & General)
 * --------------------------------------------------------------------------
 * Rotates quotes daily avoiding immediate repetition using LocalStorage.
 */

const baseMotivationalQuotes = [
    { text: "নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।", author: "- সূরা আল-ইনশিরাহ (আয়াত: ৫)" },
    { text: "আল্লাহ কারো উপর তার সাধ্যাতীত কষ্ট চাপিয়ে দেন না।", author: "- সূরা আল-বাকারা (আয়াত: ২৮৬)" },
    { text: "যে ব্যক্তি আল্লাহর উপর ভরসা করে, আল্লাহই তার জন্য যথেষ্ট।", author: "- সূরা আত-তালাক (আয়াত: ৩)" },
    { text: "জ্ঞানের চেয়ে বড় কোনো সম্পদ নেই, আর অজ্ঞতার চেয়ে বড় কোনো দারিদ্র্য নেই।", author: "- হযরত আলী (রাঃ)" },
    { text: "যে ব্যক্তি নিজের দোষ দেখতে পায়, সে অন্যের দোষ খোঁজার সময় পায় না।", author: "- হযরত উমর (রাঃ)" },
    { text: "রিজিক শুধু টাকা নয়, ভালো মানুষ, ভালো চরিত্র এবং সুস্থতাও বড় রিজিক।", author: "- ইসলামিক প্রবাদ" },
    { text: "বিপদে ধৈর্য ধারণ করা হলো সবচেয়ে বড় ইবাদত।", author: "- ইসলামিক প্রবাদ" },
    { text: "যে ব্যক্তি পরিশ্রম করে, আল্লাহ তার পরিশ্রমের ফল অবশ্যই দেন।", author: "- ইসলামিক প্রবাদ" },
    { text: "সততা এমন এক উপহার, যা সস্তা মানুষের কাছে আশা করা যায় না।", author: "- সংগৃহীত" },
    { text: "যে নিজের ভুল থেকে শেখে, সে-ই হলো প্রকৃত জ্ঞানী।", author: "- সংগৃহীত" }
];

// Dynamically generate a larger array
const allQuotes = [];
for (let i = 0; i < 30; i++) {
    allQuotes.push(...baseMotivationalQuotes);
}

window.setDailyMotivation = function() {
    try {
        let shownHistory = JSON.parse(localStorage.getItem('flat5d_shownQuotes')) || [];
        
        // Reset if we've shown everything
        if (shownHistory.length >= allQuotes.length) {
            shownHistory = []; 
        }
        
        let availableIndices = [];
        for (let i = 0; i < allQuotes.length; i++) {
            if (!shownHistory.includes(i)) {
                availableIndices.push(i);
            }
        }

        // Pick a random index from available pool
        const randomPick = Math.floor(Math.random() * availableIndices.length);
        const finalIndex = availableIndices[randomPick];
        
        // Save to history
        shownHistory.push(finalIndex);
        localStorage.setItem('flat5d_shownQuotes', JSON.stringify(shownHistory));

        // Update DOM
        const textEl = document.getElementById('quoteText');
        const authorEl = document.getElementById('quoteAuthor');
        
        if (textEl && authorEl && allQuotes[finalIndex]) {
            textEl.innerText = `"${allQuotes[finalIndex].text}"`;
            authorEl.innerText = allQuotes[finalIndex].author;
        }
    } catch (error) {
        console.error("Error setting motivation quote:", error);
    }
};

/**
 * --------------------------------------------------------------------------
 * 11. Master Refresh & System Bootstrap
 * --------------------------------------------------------------------------
 * Core functions to initialize the app and keep UI synchronized with State.
 */

window.refreshAll = function() {
    // 1. Save data to storage
    saveData();
    
    // 2. Update Dashboard Stats
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
    
    // 3. Update Next Meal Box
    if (typeof updateNextMealDisplay === 'function') {
        updateNextMealDisplay();
    }
    
    // 4. Update Quick Toggle Swipe Box
    if (typeof updateQuickMealToggle === 'function') {
        updateQuickMealToggle();
    }
    
    // 5. Render Main Calendar
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
    
    // 6. Render Bazaar Data
    if (typeof renderBazaarList === 'function') {
        renderBazaarList();
    }
    
    // 7. Render Guest Meal Controls
    if (typeof renderGuestMealBox === 'function') {
        renderGuestMealBox();
    }
    
    // 8. Render Vacation Controls
    if (typeof renderVacationBox === 'function') {
        renderVacationBox();
    }
    
    // 9. Update Monthly Report table
    if (typeof renderMonthlySummary === 'function') {
        renderMonthlySummary();
    }
    
    // 10. Render Notices
    const noticeContainer = document.getElementById('noticeContainer');
    if (noticeContainer) {
        noticeContainer.innerHTML = '';
        
        // Filter out notices older than 7 days (7 * 24 * 60 * 60 * 1000 ms)
        AppState.notices = AppState.notices.filter(function(notice) {
            return (Date.now() - notice.timestamp) <= 604800000; 
        });
        
        // Display in reverse order (newest first)
        const reversedNotices = [...AppState.notices].reverse();
        
        reversedNotices.forEach(function(notice, index) {
            let deleteBtnHtml = '';
            if (AppState.isAdmin) {
                deleteBtnHtml = `<button class="btn-delete-notice" style="background:var(--danger-light); color:var(--danger-color); border:none; width:30px; height:30px; border-radius:50%; font-size:18px; font-weight:bold; cursor:pointer;" onclick="customConfirm('এই নোটিশটি মুছে ফেলবেন?', function() { AppState.notices = AppState.notices.filter(x => x.id !== ${notice.id}); refreshAll(); })">&times;</button>`;
            }
            
            const isNew = index === 0 ? 'border-left: 5px solid var(--info-color);' : 'border-left: 5px solid #edf2f9;';
            const formattedDate = getBengaliDate(new Date(notice.timestamp));
            
            const noticeHtml = `
                <div class="notice-card" style="background:#fff; padding:20px; border-radius:15px; margin-bottom:15px; box-shadow:var(--shadow-sm); ${isNew}">
                    <div class="notice-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #edf2f9; padding-bottom:10px;">
                        <div>
                            <span style="font-size: 13px; color: var(--text-muted); font-weight:600;">${formattedDate}</span>
                            <b style="color: var(--primary-color); margin-left: 10px; font-size:16px;">${notice.author}</b>
                        </div>
                        ${deleteBtnHtml}
                    </div>
                    <p style="color: var(--text-primary); font-size: 16px; line-height: 1.6; font-weight:500;">${notice.content}</p>
                </div>
            `;
            noticeContainer.insertAdjacentHTML('beforeend', noticeHtml);
        });
    }
};

/**
 * --------------------------------------------------------------------------
 * 🔥 MISSING CORE RENDER FUNCTIONS (CALENDAR, BAZAAR, NEXT MEAL, TOGGLE) 🔥
 * --------------------------------------------------------------------------
 */

// ১. ড্রপডাউনে মাসগুলো লোড করার নতুন ফাংশন
window.populateCalendarMonthDropdown = function() {
    const selectEl = document.getElementById('calendarMonthSelect');
    if (!selectEl) return;
    selectEl.innerHTML = '';
    
    const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    
    // চলতি মাস যুক্ত করা
    selectEl.insertAdjacentHTML('beforeend', `<option value="current" selected>${monthNames[AppState.currentMonth - 1]} ${convertToBanglaNumber(AppState.currentYear)} (চলতি মাস)</option>`);
    
    // আগের সেভ করা মাসগুলো যুক্ত করা
    if (AppState.history) {
        Object.keys(AppState.history).sort().reverse().forEach(key => {
            const splitKey = key.split('-');
            const y = splitKey[0];
            const m = splitKey[1];
            const monthName = monthNames[parseInt(m) - 1];
            selectEl.insertAdjacentHTML('beforeend', `<option value="${key}">${monthName} ${convertToBanglaNumber(y)}</option>`);
        });
    }
    
    selectEl.removeEventListener('change', renderCalendar);
    selectEl.addEventListener('change', renderCalendar);
};

// ২. পুরোনো renderCalendar ফাংশনটি মুছে এই নতুনটি বসান
window.renderCalendar = function() {
    const thead = document.getElementById('mealTableHead');
    const tbody = document.getElementById('mealTableBody');
    if (!thead || !tbody) return;

    const selectEl = document.getElementById('calendarMonthSelect');
    let isHistoryView = false;
    let targetMeals = AppState.meals;
    let targetMonth = AppState.currentMonth;
    let targetYear = AppState.currentYear;

    // যদি আগের কোনো মাস সিলেক্ট করা হয়
    if (selectEl && selectEl.value !== 'current') {
        const splitVal = selectEl.value.split('-');
        targetYear = parseInt(splitVal[0]);
        targetMonth = parseInt(splitVal[1]);
        if (AppState.history && AppState.history[selectEl.value]) {
            targetMeals = AppState.history[selectEl.value].meals;
            isHistoryView = true;
        } else {
            targetMeals = null;
        }
    }

    let headHtml = `<tr>
        <th>তারিখ</th>
        <th>বেলা</th>
        <th>মোট</th>`;
    AppState.members.forEach(function(m) { 
        headHtml += `<th>${m.name}</th>`; 
    });
    headHtml += `<th>অ্যাকশন</th></tr>`;
    thead.innerHTML = headHtml;

    // ডাটা না থাকলে এরর মেসেজ
    if (!targetMeals) {
        tbody.innerHTML = `<tr><td colspan="${AppState.members.length + 4}" style="padding: 30px; font-size: 18px; color: var(--danger-color); font-weight: bold;">এই মাসের কোনো ডাটা আর্কাইভে পাওয়া যায়নি!</td></tr>`;
        return;
    }

    let bodyHtml = '';
    const daysInMonth = getDaysInMonth(targetMonth, targetYear);
    const upcomingInfo = getUpcomingMealInfo();

    const getMealCellHtml = (val, day, type, memberName) => {
        let isFuture = false;
        
        if (!isHistoryView) {
            if (day > upcomingInfo.day) {
                isFuture = true;
            } else if (day === upcomingInfo.day && upcomingInfo.type === 'morning' && type === 'night') {
                isFuture = true;
            }
        }

        let statusClass = '';
        let displayVal = '';
        
        if (val === 0) {
            statusClass = isFuture ? 'upcoming-off' : 'off'; 
            displayVal = '০';
        } else if (val === 0.5) {
            statusClass = isFuture ? 'upcoming-half' : 'half'; 
            displayVal = '০.৫';
        } else if (val === 1) {
            statusClass = isFuture ? 'upcoming-on' : 'on'; 
            displayVal = '১';
        } else {
            statusClass = isFuture ? 'upcoming-on' : 'on'; 
            displayVal = convertToBanglaNumber(val); 
        }
        return `<td class="meal-status ${statusClass}" data-name="${memberName}"><span class="meal-val-text">${displayVal}</span></td>`;
    };

    for (let day = 1; day <= daysInMonth; day++) {
        if (!targetMeals[day]) continue;

        // আগের মাস হলে এডিট বাটন পুরোপুরি লক থাকবে
        const isMornLocked = isHistoryView ? !AppState.isAdmin : isMealLocked(day, 'morning');
        const isNightLocked = isHistoryView ? !AppState.isAdmin : isMealLocked(day, 'night');

        let mornTotal = 0; let nightTotal = 0;
        AppState.members.forEach(function(m) {
            mornTotal += (targetMeals[day].morning[m.id] || 0);
            nightTotal += (targetMeals[day].night[m.id] || 0);
        });
        mornTotal = Math.round(mornTotal * 1000) / 1000;
        nightTotal = Math.round(nightTotal * 1000) / 1000;

        // Morning Row
        bodyHtml += `<tr>
            <td rowspan="2" class="date-cell">${convertToBanglaNumber(day)}</td>
            <td class="bela-cell">সকাল</td>
            <td style="font-weight:800; color:var(--primary-color);">${convertToBanglaNumber(mornTotal)}</td>`;
        AppState.members.forEach(function(m) {
            const val = targetMeals[day].morning[m.id] || 0;
            bodyHtml += getMealCellHtml(val, day, 'morning', m.name);
        });
        // Morning Row-এর বাটনটি এইভাবে আপডেট করো:
        bodyHtml += `<td><button class="btn-edit-meal ${isMornLocked ? 'locked' : ''}" onclick="openEditModal(${day}, 'morning', '${selectEl.value}')" ${isMornLocked ? 'disabled' : ''}>${isMornLocked ? 'লকড' : 'এডিট'}</button></td></tr>`;

        // Night Row
        bodyHtml += `<tr style="border-bottom: 3px solid #a3aed1;">
            <td class="bela-cell">রাত</td>
            <td style="font-weight:800; color:var(--primary-color);">${convertToBanglaNumber(nightTotal)}</td>`;
        AppState.members.forEach(function(m) {
            const val = targetMeals[day].night[m.id] || 0;
            bodyHtml += getMealCellHtml(val, day, 'night', m.name);
        });
        bodyHtml += `<td><button class="btn-edit-meal ${isNightLocked ? 'locked' : ''}" onclick="openEditModal(${day}, 'night', '${selectEl.value}')" ${isNightLocked ? 'disabled' : ''}>${isNightLocked ? 'লকড' : 'এডিট'}</button></td></tr>`;
    }
    tbody.innerHTML = bodyHtml;
};


// Edit Modal Logic (Fixed to allow any custom number like 2, 3, 5 etc.)
window.openEditModal = function(day, type, monthKey = 'current') {
    if (isMealLocked(day, type)) return;
    document.getElementById('editMealDate').innerText = convertToBanglaNumber(day);
    document.getElementById('editMealBela').innerText = type === 'morning' ? 'সকাল' : 'রাত';
    
    const form = document.getElementById('editMealForm');
    form.innerHTML = '';
    form.dataset.editDay = day;
    form.dataset.editType = type;
    form.dataset.editMonth = monthKey; // মাস সেভ করলাম

    // এখন আমাদের টার্গেট ডেটা সিলেক্ট করতে হবে (চলতি মাস নাকি হিস্ট্রি)
    let targetMeals = (monthKey === 'current') ? AppState.meals : AppState.history[monthKey].meals;

    AppState.members.forEach(function(m) {
        const currentVal = targetMeals[day][type][m.id] || 0;

        const html = `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center; background:#f8f9fa; padding:10px 15px; border-radius:10px; border: 1px solid #edf2f9;">
                <label style="margin:0; font-weight:800; color:var(--text-primary); font-size:16px;">${m.name}</label>
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="number" step="any" min="0" class="form-control" id="edit_member_${m.id}" value="${currentVal}" style="width:85px; padding:8px; font-weight:800; text-align:center; border:2px solid var(--primary-light); color:var(--primary-color); border-radius:8px;">
                    <span style="font-size:15px; font-weight:700; color:var(--text-muted);">টি</span>
                </div>
            </div>
        `;
        form.insertAdjacentHTML('beforeend', html);
    });
    document.getElementById('editMealModal').classList.add('show');
};

// Save Meal Logic (Fixed to read values from the new input field safely)
const saveMealBtn = document.getElementById('saveMealBtn');
if(saveMealBtn) {
    const newSaveBtn = saveMealBtn.cloneNode(true);
    saveMealBtn.replaceWith(newSaveBtn);
    
    newSaveBtn.addEventListener('click', function() {
        const form = document.getElementById('editMealForm');
        const day = parseInt(form.dataset.editDay);
        const type = form.dataset.editType;
        const monthKey = form.dataset.editMonth;
        
        // টার্গেট মাস খুঁজে বের করা
        let targetMeals = (monthKey === 'current') ? AppState.meals : AppState.history[monthKey].meals;
        
        AppState.members.forEach(function(m) {
            const inputEl = document.getElementById(`edit_member_${m.id}`);
            if (inputEl) {
                let val = parseFloat(inputEl.value);
                if(isNaN(val) || val < 0) val = 0; 
                targetMeals[day][type][m.id] = val; // সঠিক মাসে আপডেট হলো
            }
        });
        
        document.getElementById('editMealModal').classList.remove('show');
        showToast('মিল সফলভাবে আপডেট হয়েছে!', 'success');
        refreshAll(); // সব হিসাব আপডেট করে দিবে
    });
}

// কোন বেলার মিল চলছে তা বের করার লজিক (রাত ১০টা এবং দুপুর ১টা অনুযায়ী)
function getUpcomingMealInfo() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDate();
    
    // রাত ১০টা (22) থেকে পরদিন দুপুর ১টা (13) পর্যন্ত সকালের মিল
    if (hour >= 22 || hour < 13) {
        const displayDay = (hour >= 22) ? (day + 1 > 31 ? 1 : day + 1) : day;
        return { day: displayDay, type: 'morning', label: 'সকালের মিল আপডেট করুন' };
    } 
    // দুপুর ১টা (13) থেকে রাত ১০টা (22) পর্যন্ত রাতের মিল
    else {
        return { day: day, type: 'night', label: 'রাতের মিল আপডেট করুন' };
    }
}

// লাইভ বোর্ড আপডেট লজিক (গেস্ট মিল + নিজের মিলের সঠিক যোগফল)
window.updateNextMealDisplay = function() {
    const info = getUpcomingMealInfo();
    const labelEl = document.getElementById('nextMealLabel');
    const countEl = document.getElementById('nextMealCount');
    const boardTitle = document.getElementById('currentMealBoardTitle');
    const boardList = document.getElementById('currentMealBoardList');
    
    // খালা আসার পর যদি বক্স লক হয়, তবে লেবেল আপডেট করা
    const currentStatus = AppState.meals[info.day]?.khalaStatus[info.type] || 'pending';
    if (labelEl) {
        labelEl.innerText = currentStatus !== 'pending' ? `${info.label} (লকড)` : info.label;
    }
    
    if(boardTitle) boardTitle.innerText = `${info.label} - লাইভ অবস্থা`;
    
    let total = 0;
    let boardHtml = '';
    
    if(AppState.meals[info.day]) {
        AppState.members.forEach(function(m) {
            // ইউজারের মোট মিল (নিজের মিল + গেস্ট মিল) এখানে যোগ হয়েই আছে
            const val = parseFloat(AppState.meals[info.day][info.type][m.id]) || 0;
            total += val;
            
            let statusClass = '';
            let displayVal = '';
            
            // লাইভ বোর্ডে দেখানোর লজিক
            if (val === 0) {
                statusClass = 'off';
                displayVal = 'অফ (০)';
            } else if (val === 0.5) {
                statusClass = 'half';
                displayVal = 'হাফ (০.৫)';
            } else if (val === 1) {
                statusClass = 'on';
                displayVal = 'ফুল (১)';
            } else {
                statusClass = 'on';
                displayVal = `মোট (${convertToBanglaNumber(val)})`; // যেমন: মোট (২) বা মোট (২.৫)
            }
            
            boardHtml += `<div class="live-meal-item-small ${statusClass}">
                <span style="font-size:14px; margin-bottom:4px;">${m.name}</span>
                <span style="font-size:12px;">${displayVal}</span>
            </div>`;
        });
    }
    
    if(countEl) countEl.innerText = convertToBanglaNumber(total);
    if(boardList) boardList.innerHTML = boardHtml;
};

// Quick Meal Swipe Toggle Logic (Fixed Guest vs Personal Logic)
// Quick Meal Swipe Toggle Logic (ফেড/লক সিস্টেম সহ)
window.updateQuickMealToggle = function() {
    const uid = AppState.activeUserId;
    if(!uid) return;
    
    const info = getUpcomingMealInfo();
    const currentStatus = AppState.meals[info.day]?.khalaStatus[info.type] || 'pending';
    
    const toggleBoxOuter = document.querySelector('.quick-toggle-box-large');
    const toggleLabel = document.getElementById('quickMealLabel');
    
    // যদি খালা কনফার্ম হয়ে যায়, তবে পুরো বক্স লক (ফেড) হয়ে যাবে
    if (currentStatus !== 'pending') {
        if(toggleBoxOuter) toggleBoxOuter.classList.add('locked-section');
        if(toggleLabel) toggleLabel.innerText = `${info.label} (লক হয়ে গেছে)`;
    } else {
        if(toggleBoxOuter) toggleBoxOuter.classList.remove('locked-section');
        if(toggleLabel) toggleLabel.innerText = `${info.label} আপডেট করুন`;
    }
    
    const toggle = document.getElementById('quickMealMainToggle');
    const halfContainer = document.getElementById('halfMealOptionContainer');
    const statusTxt = document.getElementById('quickMealStatusTxt');
    const warningBox = document.getElementById('routineWarningBox');
    
    // পার্মানেন্ট রুটিন চেক
    const prefs = (AppState.mealPreferences && AppState.mealPreferences[uid]) ? AppState.mealPreferences[uid] : { morning: true, night: true };
    const isRoutineOn = info.type === 'morning' ? prefs.morning : prefs.night;
    
    // ড্যাশবোর্ডে ওয়ার্নিং মেসেজ দেখানো
    if (warningBox) {
        let warnings = [];
        if (!prefs.morning) warnings.push('সকাল');
        if (!prefs.night) warnings.push('রাত');

        if (warnings.length > 0) {
            warningBox.style.display = 'block';
            warningBox.innerHTML = `⚠️ আপনার নিয়মিত রুটিনে <b>${warnings.join(' ও ')}</b> এর মিল স্থায়ীভাবে অফ করা আছে।<br><span style="font-size:12px; color:#555;">গেস্ট মিল দিলে তা এই বেলায় অ্যাড হবে না। (আজকের জন্য চাইলে নিচে ম্যানুয়ালি অন করতে পারেন)</span>`;
        } else {
            warningBox.style.display = 'none';
        }
    }
    
    let currentVal = parseFloat(AppState.meals[info.day][info.type][uid]) || 0;
    
    // অ্যাকটিভ গেস্ট মিল আছে কি না বের করা
    let activeGuestCount = 0;
    const guestConfig = AppState.guestMeals[uid];
    if (guestConfig && isRoutineOn) {
        if ((info.type === 'morning' && guestConfig.isMorning) || (info.type === 'night' && guestConfig.isNight)) {
            activeGuestCount = parseInt(guestConfig.count) || 0;
        }
    }
    
    // নিজের বেস মিল হিসাব করা (মোট মিল থেকে গেস্ট বাদ দিয়ে)
    let baseMeal = currentVal - activeGuestCount;
    if (baseMeal < 0) baseMeal = 0;
    if (baseMeal > 1) baseMeal = 1;

    // টগল ইভেন্ট আপডেট করা
    const newToggle = toggle.cloneNode(true);
    toggle.replaceWith(newToggle);
    
    newToggle.checked = baseMeal > 0;
    if(halfContainer) halfContainer.style.display = baseMeal > 0 ? 'block' : 'none';
    
    // স্ট্যাটাস টেক্সট আপডেট
    if(baseMeal === 1) statusTxt.innerText = "আপনার নিজের মিল ফুল (১) সেট করা আছে।";
    else if(baseMeal === 0.5) statusTxt.innerText = "আপনার নিজের মিল হাফ (০.৫) সেট করা আছে।";
    else statusTxt.innerText = "আপনার নিজের মিল অফ (০) করা আছে।";

    if(activeGuestCount > 0) {
        statusTxt.innerHTML += `<br><span style="color:var(--success-color); font-size:15px; display:block; margin-top:5px; font-weight:800;">+ সাথে ${convertToBanglaNumber(activeGuestCount)} টি গেস্ট মিল যোগ করা আছে</span>`;
    }
    
    newToggle.addEventListener('change', function() {
        if(!this.checked) {
            if(halfContainer) halfContainer.style.display = 'none';
            AppState.meals[info.day][info.type][uid] = 0 + activeGuestCount;
            showToast('আপনার নিজের মিল অফ করা হয়েছে!', 'success');
            refreshAll();
        } else {
            // যদি নিয়মিত রুটিন অফ থাকে, তবে ওয়ার্নিং দিয়ে আজকের জন্য অন করার অপশন দেওয়া
            if (!isRoutineOn) {
                const waktName = info.type === 'morning' ? 'সকালের' : 'রাতের';
                window.customConfirm(`আপনার নিয়মিত রুটিনে ${waktName} মিল বন্ধ আছে।\n\nআপনি কি শুধুমাত্র আজকের জন্য মিলটি চালু করতে চান?`, function() {
                    AppState.meals[info.day][info.type][uid] = 1 + activeGuestCount;
                    showToast(`শুধুমাত্র আজকের ${waktName} মিল চালু করা হয়েছে!`, 'success');
                    refreshAll();
                });
                newToggle.checked = false; // কনফার্ম করার আগ পর্যন্ত সুইচটি অফই দেখাবে
            } else {
                // রুটিন অন থাকলে স্বাভাবিকভাবে মিল অন হবে
                if(halfContainer) halfContainer.style.display = 'block';
                AppState.meals[info.day][info.type][uid] = 1 + activeGuestCount;
                showToast('আপনার নিজের মিল চালু করা হয়েছে!', 'success');
                refreshAll();
            }
        }
    });
    
    const btnFull = document.getElementById('quickMealFullBtn');
    const btnHalf = document.getElementById('quickMealHalfBtn');
    
    if(btnFull && btnHalf) {
        const newBtnFull = btnFull.cloneNode(true);
        const newBtnHalf = btnHalf.cloneNode(true);
        btnFull.replaceWith(newBtnFull);
        btnHalf.replaceWith(newBtnHalf);
        
        if(baseMeal === 1) {
            newBtnFull.style.borderColor = 'var(--success-color)';
            newBtnHalf.style.borderColor = 'transparent';
        } else if (baseMeal === 0.5) {
            newBtnHalf.style.borderColor = 'var(--warning-color)';
            newBtnFull.style.borderColor = 'transparent';
        }
        
        newBtnFull.addEventListener('click', function() {
            AppState.meals[info.day][info.type][uid] = 1 + activeGuestCount;
            showToast('নিজের মিল ফুল (১) করা হয়েছে!', 'success');
            refreshAll();
        });
        
        newBtnHalf.addEventListener('click', function() {
            AppState.meals[info.day][info.type][uid] = 0.5 + activeGuestCount;
            showToast('নিজের মিল হাফ (০.৫) করা হয়েছে!', 'success');
            refreshAll();
        });
    }
};

// 3. Render Bazaar List
// ১. বাজার লিস্ট রেন্ডার করা (Current + History)
window.renderBazaarList = function() {
    const tbody = document.getElementById('bazaarTableBody');
    const totalEl = document.getElementById('tableTotalBazaar');
    const monthSelect = document.getElementById('bazaarMonthSelect');
    if (!tbody || !totalEl) return;

    // ড্রপডাউন পপুলেট করা (যদি নতুন করে লোড করতে হয়)
    if (monthSelect && monthSelect.options.length <= 1) {
        const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
        
        // হিস্ট্রি থেকে মাসগুলো ড্রপডাউনে আনা
        if (AppState.history) {
            Object.keys(AppState.history).sort().reverse().forEach(key => {
                const splitKey = key.split('-');
                const y = splitKey[0];
                const m = splitKey[1];
                const monthName = monthNames[parseInt(m) - 1];
                monthSelect.insertAdjacentHTML('beforeend', `<option value="${key}">${monthName} ${convertToBanglaNumber(y)}</option>`);
            });
        }
        monthSelect.removeEventListener('change', renderBazaarList);
        monthSelect.addEventListener('change', renderBazaarList);
    }

    const selectedMonth = monthSelect ? monthSelect.value : 'current';
    
    // ডেটা সোর্স নির্ধারণ (Current নাকি History)
    let targetRecords = (selectedMonth === 'current') ? AppState.bazaarRecords : (AppState.history[selectedMonth] ? AppState.history[selectedMonth].bazaarRecords : []);
    
    tbody.innerHTML = '';
    let total = 0;
    
    targetRecords.forEach(function(record) {
        const member = AppState.members.find(m => m.id === record.memberId);
        const memName = member ? member.name : 'Unknown';
        total += record.amount;
        
        let actionHtml = '';
        if (AppState.isAdmin) {
            actionHtml = `
                <button onclick="editBazaar(${record.id}, '${selectedMonth}')" style="background:var(--primary-light); color:#fff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; margin-right:5px; font-size:12px;">এডিট</button>
                <button onclick="deleteBazaar(${record.id}, '${selectedMonth}')" style="background:var(--danger-light); color:var(--danger-color); border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:12px;">মুছুন</button>
            `;
        }
        
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${record.date}</td>
                <td>${memName}</td>
                <td>${record.details}</td>
                <td style="font-weight:800; color:var(--success-color);">${formatCurrency(record.amount)}</td>
                <td>${actionHtml}</td>
            </tr>
        `);
    });
    totalEl.innerText = formatCurrency(total);
};

// ২. বাজার এডিট করা
window.editBazaar = function(id, monthKey) {
    let targetRecords = (monthKey === 'current') ? AppState.bazaarRecords : AppState.history[monthKey].bazaarRecords;
    const record = targetRecords.find(r => r.id === id);
    if(!record) return;

    // পপআপের মাধ্যমে নতুন ভ্যালু নেওয়া
    const newAmount = prompt("নতুন টাকার পরিমাণ লিখুন:", record.amount);
    const newDetails = prompt("বিবরণ আপডেট করুন:", record.details);
    
    if(newAmount !== null && !isNaN(newAmount)) {
        record.amount = parseFloat(newAmount);
        record.details = newDetails || record.details;
        
        showToast('বাজার সফলভাবে আপডেট হয়েছে!', 'success');
        refreshAll(); // এটা সব হিসাব আপডেট করে দিবে
    }
};

// ৩. বাজার ডিলিট করা
window.deleteBazaar = function(id, monthKey) {
    customConfirm('এই বাজার রেকর্ডটি মুছে ফেলবেন?', function() {
        if(monthKey === 'current') {
            AppState.bazaarRecords = AppState.bazaarRecords.filter(r => r.id !== id);
        } else if (AppState.history[monthKey]) {
            AppState.history[monthKey].bazaarRecords = AppState.history[monthKey].bazaarRecords.filter(r => r.id !== id);
        }
        showToast('বাজার রেকর্ড মুছে ফেলা হয়েছে', 'success');
        refreshAll(); // সব হিসাব আপডেট হবে
    });
};

window.removeMember = function(id) {
    window.customConfirm(
        'সতর্কতা: এই সদস্যকে সম্পূর্ণ মুছে ফেলতে চাইলে নিচের বক্সে "delete" লিখে নিশ্চিত করুন।', 
        function() {
            AppState.members = AppState.members.filter(m => m.id !== id);
            showToast('সদস্য মুছে ফেলা হয়েছে', 'success');
            refreshAll();
        },
        'delete' // <-- এই তৃতীয় প্যারামিটারটাই ইনপুট বক্স শো করাবে!
    );
};

/**
 * ========================================================================
 * 🔥 MISSING BUTTON ACTIONS, KHALA LOGIC & ADMIN ACCESS CONTROL 🔥
 * ========================================================================
 */

// ১. শুধুমাত্র জুবায়ের এবং আবিদের জন্য অ্যাডমিন বাটন শো করার লজিক
const authSection = document.querySelector('.admin-auth-section');
if (authSection) authSection.style.display = 'none'; // শুরুতে হাইড থাকবে

const mainEnterBtn = document.getElementById('enterWebsiteBtn');
if (mainEnterBtn) {
    mainEnterBtn.addEventListener('click', function() {
        const activeUser = AppState.members.find(m => m.id === AppState.activeUserId);
        if (activeUser && (activeUser.name === 'Jubair' || activeUser.name === 'Abid')) {
            if (authSection) authSection.style.display = 'block'; // শুধু জুবায়ের/আবিদ হলে দেখাবে
        } else {
            if (authSection) authSection.style.display = 'none'; // অন্যদের জন্য হাইড
        }
    });
}

// ২. নতুন মেম্বার যোগ করার লজিক
const btnSaveMem = document.getElementById('saveMemberBtn');
if (btnSaveMem) {
    btnSaveMem.addEventListener('click', function(e) {
        e.preventDefault();
        const nameInput = document.getElementById('newMemberName');
        const name = nameInput ? nameInput.value.trim() : '';
        
        if (!name) return showToast('দয়া করে নতুন মেম্বারের নাম দিন!', 'error');
        
        let newId = AppState.members.length > 0 ? Math.max(...AppState.members.map(m => m.id)) + 1 : 1;
        
        AppState.members.push({ 
            id: newId, 
            name: name, 
            role: 'user', 
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true` 
        });
        
        const daysInMonth = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();
        const currentDay = new Date().getDate(); // আজকের তারিখ বের করা হলো
        
        for (let day = 1; day <= daysInMonth; day++) { 
            if (AppState.meals[day]) {
                // 🔥 ম্যাজিক ফিক্স: দিন যদি আজকের আগের হয়, তবে মিল ০ থাকবে। নতুবা ১ হবে।
                if (day < currentDay) {
                    AppState.meals[day].morning[newId] = 0; 
                    AppState.meals[day].night[newId] = 0; 
                } else {
                    AppState.meals[day].morning[newId] = 1; 
                    AppState.meals[day].night[newId] = 1; 
                }
            }
        }
        
        document.getElementById('addMemberModal').classList.remove('show');
        showToast(`সদস্য "${name}" সফলভাবে যুক্ত হয়েছে!`, 'success'); 
        populateMemberDropdowns(); 
        refreshAll();
    });
}

// ৩. নোটিশ সাবমিট করার লজিক
const btnSubmitNot = document.getElementById('submitNoticeBtn');
if (btnSubmitNot) {
    btnSubmitNot.addEventListener('click', function(e) {
        e.preventDefault();
        const author = document.getElementById('noticeAuthorName').value.trim();
        const content = document.getElementById('noticeContent').value.trim();
        
        if (!author || !content) return showToast('নাম এবং নোটিশ দিন!', 'error');
        
        AppState.notices.push({ id: Date.now(), author: author, content: content, timestamp: Date.now() });
        
        document.getElementById('addNoticeModal').classList.remove('show');
        showToast('নতুন নোটিশ দেওয়া হয়েছে!', 'success');
        refreshAll();
    });
}

// ৪. বাজার যোগ করার লজিক
const btnSaveBazaar = document.getElementById('saveBazaarBtn');
if (btnSaveBazaar) {
    btnSaveBazaar.addEventListener('click', function(e) {
        e.preventDefault();
        const memId = parseInt(document.getElementById('bazaarMemberSelect').value);
        const details = document.getElementById('bazaarDetails').value.trim() || "-";
        const amount = parseFloat(document.getElementById('bazaarAmount').value);
        
        if (isNaN(amount) || amount <= 0) return showToast('সঠিক টাকার পরিমাণ দিন!', 'error');
        
        AppState.bazaarRecords.push({ 
            id: Date.now(), 
            memberId: memId, 
            details: details, 
            amount: amount, 
            date: new Date().toISOString().split('T')[0] 
        });
        
        document.getElementById('addBazaarModal').classList.remove('show');
        showToast('বাজার সফলভাবে যোগ হয়েছে!', 'success'); 
        refreshAll();
    });
}

// ৫. খালার স্ট্যাটাস (রান্না হবে কি হবে না) আপডেট লজিক এবং মোট মিল দেখানো (Hardcore Fade Logic)
window.updateKhalaUI = function() {
    const info = typeof getUpcomingMealInfo === 'function' ? getUpcomingMealInfo() : null;
    if (!info) return;

    const currentStatus = AppState.meals[info.day]?.khalaStatus[info.type] || 'pending';
    
    const khalaSectionContainer = document.getElementById('khalaSectionContainer');
    const khalaActions = document.getElementById('khalaActions');
    const khalaStatusText = document.getElementById('khalaStatusText');
    const resetBtn = document.getElementById('adminResetKhalaBtn');
    const questionText = document.getElementById('khalaQuestionText');

    const now = new Date();
    const hour = now.getHours();

    // বর্তমান বেলার মোট মিল বের করা
    let totalUpcomingMeals = 0;
    if (AppState.meals[info.day]) {
        AppState.members.forEach(m => {
            totalUpcomingMeals += (parseFloat(AppState.meals[info.day][info.type][m.id]) || 0);
        });
    }

    // ফ্লোটিং পয়েন্ট বাগ এড়াতে রাউন্ড করে নেওয়া হলো
    totalUpcomingMeals = Math.round(totalUpcomingMeals * 1000) / 1000;

    let isKhalaActionActive = false;
    let waitMessage = "";

    // 🔥 নতুন লজিক: যদি সবার মিল অফ থাকে (মোট মিল ০), তবে খালার আপডেট বন্ধ থাকবে
    if (totalUpcomingMeals <= 0) {
        isKhalaActionActive = false;
        waitMessage = "সবার মিল অফ থাকায় খালার আপডেট বন্ধ আছে";
    } else {
        // নির্দিষ্ট সময়ের লজিক: সকাল ৬টা-দুপুর ১টা এবং বিকাল ৫টা-রাত ১০টা
        if (info.type === 'morning') {
            if (hour >= 6 && hour < 13) {
                isKhalaActionActive = true;
            } else {
                waitMessage = "সকাল ৬ টার পর খালার আপডেট দেওয়া যাবে";
            }
        } else if (info.type === 'night') {
            if (hour >= 17 && hour < 22) {
                isKhalaActionActive = true;
            } else {
                waitMessage = "বিকাল ৫ টার পর খালার আপডেট দেওয়া যাবে";
            }
        }
    }

    if (currentStatus === 'pending') {
        if (isKhalaActionActive) {
            // বক্স স্বাভাবিক অবস্থায় থাকবে
            if(khalaSectionContainer) {
                khalaSectionContainer.style.opacity = '1';
                khalaSectionContainer.style.pointerEvents = 'auto';
                khalaSectionContainer.style.filter = 'none';
            }
            if(khalaActions) khalaActions.style.display = 'flex';
            if(khalaStatusText) khalaStatusText.style.display = 'none';
            if(questionText) {
                questionText.style.display = 'block';
                questionText.innerText = "রান্নার জন্য খালা এসেছে কি না?";
                questionText.style.color = '#fff';
            }
        } else {
            // 🔥 আল্টিমেট ফেড লজিক: বাটন গায়েব এবং বক্স পুরোপুরি ঝাপসা
            if(khalaSectionContainer) {
                khalaSectionContainer.style.opacity = '0.4';
                khalaSectionContainer.style.pointerEvents = 'none';
                khalaSectionContainer.style.filter = 'grayscale(100%)';
            }
            if(khalaActions) khalaActions.style.display = 'none'; // বাটন পুরোপুরি সরিয়ে দেওয়া হলো
            if(khalaStatusText) khalaStatusText.style.display = 'none';
            if(questionText) {
                questionText.style.display = 'block';
                questionText.innerText = waitMessage;
                questionText.style.color = '#ffeb3b'; // ওয়ার্নিং হলুদ কালার
            }
        }
    } else {
        // খালা কনফার্ম হলে বক্স স্বাভাবিক হবে কিন্তু বাটন গায়েব থাকবে
        if(khalaSectionContainer) {
            khalaSectionContainer.style.opacity = '1';
            khalaSectionContainer.style.pointerEvents = 'auto';
            khalaSectionContainer.style.filter = 'none';
        }
        if(khalaActions) khalaActions.style.display = 'none';
        if(questionText) questionText.style.display = 'none';
        if(khalaStatusText) {
            khalaStatusText.style.display = 'block';
            
            if (currentStatus === 'yes') {
                const waktName = info.type === 'morning' ? 'সকালের' : 'রাতের';
                khalaStatusText.innerHTML = `<span style="color:var(--success-color); font-size:18px;">খালা এসেছে! আজ ${waktName} মোট মিল: ${convertToBanglaNumber(totalUpcomingMeals)} টি।</span>`;
            } else {
                khalaStatusText.innerHTML = `<span style="color:var(--danger-color); font-size:18px;">খালা আসেনি! সবার মিল ০ হয়ে গেছে।</span>`;
            }
        }
    }

    if (resetBtn) {
        resetBtn.style.display = (currentStatus !== 'pending' && AppState.isAdmin) ? 'block' : 'none';
    }
};

// =======================================================================
// খালার বাটনের অ্যাকশন এবং স্মার্ট রিসেট লজিক (Backup System)
// =======================================================================

const btnKhalaYes = document.getElementById('khalaYesBtn');
if(btnKhalaYes) {
    const newYesBtn = btnKhalaYes.cloneNode(true);
    btnKhalaYes.replaceWith(newYesBtn);
    newYesBtn.addEventListener('click', function() {
        const info = getUpcomingMealInfo();
        AppState.meals[info.day].khalaStatus[info.type] = 'yes';
        
        let thisWaktTotal = 0;
        AppState.members.forEach(m => {
            thisWaktTotal += (AppState.meals[info.day][info.type][m.id] || 0);
        });

        showToast(`কনফার্ম: খালা এসেছে। ${info.label} ${convertToBanglaNumber(thisWaktTotal)} টি।`, 'success');
        refreshAll();
    });
}

const btnKhalaNo = document.getElementById('khalaNoBtn');
if(btnKhalaNo) {
    const newNoBtn = btnKhalaNo.cloneNode(true);
    btnKhalaNo.replaceWith(newNoBtn);
    newNoBtn.addEventListener('click', function() {
        window.customConfirm("খালা আসেনি? সবার মিল জিরো (০) হয়ে যাবে। নিশ্চিত?", function() {
            const info = getUpcomingMealInfo();
            
            // 🔥 স্ন্যাপশট ব্যাকআপ: মিল জিরো করার ঠিক আগের মুহূর্তের ডেটা সেভ রাখা হচ্ছে
            AppState.meals[info.day][info.type + '_backup'] = JSON.parse(JSON.stringify(AppState.meals[info.day][info.type]));

            AppState.meals[info.day].khalaStatus[info.type] = 'no';
            
            // সবার মিল ০ করে দেওয়া
            AppState.members.forEach(m => {
                AppState.meals[info.day][info.type][m.id] = 0;
            });
            showToast('খালা আসেনি! সবার মিল ০ করে দেওয়া হয়েছে।', 'error');
            refreshAll();
        });
    });
}

// খালার স্ট্যাটাস রিসেট করার লজিক (ব্যাকআপ রিস্টোর সহ)
const btnAdminResetKhala = document.getElementById('adminResetKhalaBtn');
if(btnAdminResetKhala) {
    const newResetBtn = btnAdminResetKhala.cloneNode(true);
    btnAdminResetKhala.replaceWith(newResetBtn);
    
    newResetBtn.addEventListener('click', function() {
        const info = getUpcomingMealInfo();
        const now = new Date();
        const hour = now.getHours();
        const currentDay = now.getDate();
        
        let isTimePassed = false;
        if (info.day < currentDay) {
            isTimePassed = true;
        } else if (info.day === currentDay) {
            if (info.type === 'morning' && hour >= 13) isTimePassed = true;
            if (info.type === 'night' && hour >= 22) isTimePassed = true;
        }

        if (isTimePassed) {
            AppState.meals[info.day].khalaStatus[info.type] = 'no';
            AppState.members.forEach(m => { AppState.meals[info.day][info.type][m.id] = 0; });
            showToast('সময় পার হয়ে যাওয়ায় সবার মিল ০ হয়ে গেছে!', 'error');
        } else {
            AppState.meals[info.day].khalaStatus[info.type] = 'pending';
            
            // 🔥 ব্যাকআপ থেকে রিস্টোর করা (যদি 'খালা আসেনি' চাপার কারণে ০ হয়ে থাকে)
            if (AppState.meals[info.day][info.type + '_backup']) {
                AppState.meals[info.day][info.type] = JSON.parse(JSON.stringify(AppState.meals[info.day][info.type + '_backup']));
                // রিস্টোর শেষে ব্যাকআপ মুছে ফেলা
                delete AppState.meals[info.day][info.type + '_backup']; 
                showToast('রিসেট সম্পন্ন! সবার আগের মিল ঠিকঠাক রিস্টোর করা হয়েছে।', 'success');
            } else {
                // 'খালা এসেছে' থেকে রিসেট করলে ডেটা এমনিতেই ঠিক থাকে
                showToast('রিসেট সম্পন্ন! স্ট্যাটাস আবার পেন্ডিং করা হয়েছে।', 'success');
            }
        }
        refreshAll();
    });
}

// Master Refresh-এ খালার UI যুক্ত করা
const oldRefresh = window.refreshAll;
window.refreshAll = function() {
    if(typeof oldRefresh === 'function') oldRefresh();
    if(typeof updateKhalaUI === 'function') updateKhalaUI();
};

// Initial Call
if(typeof updateKhalaUI === 'function') updateKhalaUI();

/**
 * --------------------------------------------------------------------------
 * 🚀 KHALA AUTO-TIMEOUT LOGIC (WITH AUTO BACKUP)
 * --------------------------------------------------------------------------
 */
window.checkAndApplyKhalaTimeout = function() {
    const now = new Date();
    const hour = now.getHours();
    const currentDay = now.getDate();
    let isDataChanged = false;

    for (let day = 1; day <= currentDay; day++) {
        if (!AppState.meals[day]) continue;
        
        // সকালের মিল: দুপুর ১টা (13:00) বেজে গেলে এবং খালা না এলে
        if (day < currentDay || (day === currentDay && hour >= 13)) {
            if (AppState.meals[day].khalaStatus.morning === 'pending') {
                // 🔥 ম্যাজিক: জিরো করার আগে সিক্রেট ব্যাকআপ সেভ করা হচ্ছে
                AppState.meals[day]['morning_auto_backup'] = JSON.parse(JSON.stringify(AppState.meals[day].morning));
                
                AppState.meals[day].khalaStatus.morning = 'no'; 
                AppState.members.forEach(m => { AppState.meals[day].morning[m.id] = 0; });
                isDataChanged = true;
            }
        }

        // রাতের মিল: রাত ১০টা (22:00) বেজে গেলে এবং খালা না এলে
        if (day < currentDay || (day === currentDay && hour >= 22)) {
            if (AppState.meals[day].khalaStatus.night === 'pending') {
                // 🔥 ম্যাজিক: জিরো করার আগে সিক্রেট ব্যাকআপ সেভ করা হচ্ছে
                AppState.meals[day]['night_auto_backup'] = JSON.parse(JSON.stringify(AppState.meals[day].night));
                
                AppState.meals[day].khalaStatus.night = 'no'; 
                AppState.members.forEach(m => { AppState.meals[day].night[m.id] = 0; });
                isDataChanged = true;
            }
        }
    }
    
    if (isDataChanged) {
        saveData(); 
        console.warn("টাইম পার হয়ে গেছে! মিল অটোমেটিক ০ করে দেওয়া হলো এবং রিকভারির জন্য ব্যাকআপ রাখা হলো।");
    }
};

/**
 * --------------------------------------------------------------------------
 * 🔥 PERMANENT MEAL ROUTINE LOGIC 🔥
 * --------------------------------------------------------------------------
 */

window.setupPermanentMealSettings = function() {
    const uid = AppState.activeUserId;
    if (!uid) return;

    // State a notun mealPreferences object na thakle toiri kora
    if (!AppState.mealPreferences) {
        AppState.mealPreferences = {};
    }
    
    // User er kono preference save kora na thakle default vabe dui bela on rakha
    if (!AppState.mealPreferences[uid]) {
        AppState.mealPreferences[uid] = { morning: true, night: true };
    }

    const prefs = AppState.mealPreferences[uid];
    
    const mornToggle = document.getElementById('permMorningToggle');
    const nightToggle = document.getElementById('permNightToggle');
    const settingsBox = document.getElementById('permanentMealSettingsBox');

    if (!mornToggle || !nightToggle || !settingsBox) return;

    // Shudhu user nijei nijer routine change korte parbe
    settingsBox.style.display = 'flex';

    // Clone node to remove old event listeners safely
    const newMorn = mornToggle.cloneNode(true);
    const newNight = nightToggle.cloneNode(true);
    mornToggle.replaceWith(newMorn);
    nightToggle.replaceWith(newNight);

    newMorn.checked = prefs.morning;
    newNight.checked = prefs.night;

    // Routine apply korar main function
    const applyRoutine = (type, isEnabled) => {
        window.customConfirm(`আপনি কি নিশ্চিত? এটি আগামী সব দিনের '${type === 'morning' ? 'সকালের' : 'রাতের'}' মিল ${isEnabled ? 'চালু (১)' : 'অফ (০)'} করে দিবে।`, function() {
            
            AppState.mealPreferences[uid][type] = isEnabled;
            const currentDay = new Date().getDate();
            
            // নতুন কোড (রিপ্লেস করো):
            let updatedCount = 0;
            const daysInMonth = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();
            for (let day = currentDay; day <= daysInMonth; day++) {
                if (AppState.meals[day] && !isTimePassedStrictly(day, type)) {
                    // Lock na thakle agami shob diner meal routine onujayi update korbe
                    AppState.meals[day][type][uid] = isEnabled ? 1 : 0;
                    updatedCount++;
                }
            }
            
            showToast(`রুটিন আপডেট! আগামী ${convertToBanglaNumber(updatedCount)} বেলার মিল পরিবর্তন হয়েছে।`, 'success');
            refreshAll();
            
        });
        
        // Confirm na korle jeno ager obosthai fire jay
        if(type === 'morning') newMorn.checked = !isEnabled;
        if(type === 'night') newNight.checked = !isEnabled;
    };

    newMorn.addEventListener('change', (e) => applyRoutine('morning', e.target.checked));
    newNight.addEventListener('change', (e) => applyRoutine('night', e.target.checked));
};

// Master Refresh a ei notun function ta hook kore dewa holo
const previousRefreshAll = window.refreshAll;
window.refreshAll = function() {
    if(typeof previousRefreshAll === 'function') previousRefreshAll();
    if(typeof setupPermanentMealSettings === 'function') setupPermanentMealSettings(); // Add this line
};

// Master Refresh-এ নতুন রিকভারি UI যুক্ত করা
const finalRefreshAll = window.refreshAll;
window.refreshAll = function() {
    if(typeof checkAndApplyKhalaTimeout === 'function') checkAndApplyKhalaTimeout(); 
    if(typeof finalRefreshAll === 'function') finalRefreshAll(); 
    if(typeof updateKhalaUI === 'function') updateKhalaUI(); 
    if(typeof renderMissedMeals === 'function') renderMissedMeals(); // <-- এই নতুন লাইনটা যুক্ত হলো
};

/**
 * --------------------------------------------------------------------------
 * 🚀 REAL-TIME AUTOMATION (অটোমেটিক টাইম শিফটিং)
 * --------------------------------------------------------------------------
 * প্রতি ১ মিনিট পর পর চেক করবে। 
 * কাঁটায় কাঁটায় দুপুর ১:০০ বা রাত ১০:০০ বাজলে পেজ রিলোড ছাড়াই সিস্টেম শিফট হবে।
 */
setInterval(function() {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    
    // দুপুর ১:০০ (13:00) অথবা রাত ১০:০০ (22:00) বাজলে
    if ((hour === 13 && min === 0) || (hour === 22 && min === 0)) {
        console.log("টাইম শিফট হয়েছে! ড্যাশবোর্ড আপডেট করা হচ্ছে...");
        if(typeof checkAndApplyKhalaTimeout === 'function') checkAndApplyKhalaTimeout();
        if(typeof refreshAll === 'function') refreshAll();
    }
}, 60000); // 60000 ms = ১ মিনিট

// 🚀 ULTRA HD IMAGE EXPORT LOGIC (FIXED CRASH, CORS & DOWNLOAD ISSUES) 🚀
window.exportMealCalendarToImage = function() {
    const tableElement = document.getElementById('mealTable');
    if (!tableElement) return showToast('ক্যালেন্ডার ডাটা পাওয়া যায়নি!', 'error');

    showToast('High-Quality ছবি তৈরি হচ্ছে... দয়া করে অপেক্ষা করুন।', 'success');

    // ১. মেইন ওয়েবসাইট সাময়িকভাবে গায়েব করা
    const appWrapper = document.querySelector('.app-wrapper');
    if (appWrapper) appWrapper.style.display = 'none';

    // ২. ইমেজ কন্টেইনার তৈরি করা
    const imageContainer = document.createElement('div');
    imageContainer.id = 'imageExportContainer';
    imageContainer.style.cssText = 'width: 1200px; background: #ffffff; padding: 40px; position: absolute; top: 0; left: 0; font-family: "Hind Siliguri", sans-serif; box-sizing: border-box; z-index: 999999;';

    const clonedTable = tableElement.cloneNode(true);
    const rows = clonedTable.querySelectorAll('tr');
    rows.forEach(row => {
        if (row.children.length > 0) row.removeChild(row.lastElementChild);
    });

    clonedTable.style.width = '100%';
    clonedTable.style.borderCollapse = 'collapse';

    clonedTable.querySelectorAll('th').forEach(th => {
        th.style.cssText = 'background-color: #4361ee; color: #ffffff; border: 1px solid #4361ee; padding: 15px 10px; font-size: 16px; font-weight: bold; text-align: center; white-space: nowrap;';
    });

    clonedTable.querySelectorAll('td').forEach(td => {
        td.style.cssText = 'border: 1px solid #cbd5e1; padding: 12px 10px; color: #0f172a; font-size: 15px; font-weight: bold; text-align: center; background-color: #ffffff; white-space: nowrap;';
    });

    imageContainer.innerHTML = `
        <div style="text-align:center; margin-bottom: 30px; border-bottom: 3px solid #4361ee; padding-bottom: 20px; position: relative; z-index: 2;">
            <h1 style="color:#111c43; font-size: 36px; margin:0; text-transform: uppercase;">Flat 5D - Monthly Meal Report</h1>
            <p style="color:#4361ee; font-size: 22px; margin: 8px 0 0 0; font-weight: 700;">Month: ${convertToBanglaNumber(AppState.currentMonth)} | Year: ${convertToBanglaNumber(AppState.currentYear)}</p>
        </div>
        <div id="imageWatermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; z-index: 0;">
            <img src="first.jpg" style="width: 600px;" crossorigin="anonymous">
        </div>
        <div style="position: relative; z-index: 2;">
            ${clonedTable.outerHTML}
        </div>
    `;

    document.body.appendChild(imageContainer);
    window.scrollTo(0, 0);

    // ৩. UI রিস্টোর করার সেফটি ফাংশন (যাতে কোনোভাবেই পেজ আটকে না থাকে)
    const restoreUI = () => {
        if (document.body.contains(imageContainer)) {
            document.body.removeChild(imageContainer);
        }
        if (appWrapper) appWrapper.style.display = 'flex';
    };

    // ৪. আসল কাজ করার ফাংশন
    const processImage = () => {
        setTimeout(() => {
            try {
                html2canvas(imageContainer, {
                    scale: 3, // ৩ গুণ জুম, কোয়ালিটি ফাটাবে না
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false
                }).then(canvas => {
                    try {
                        const imgData = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.download = `Flat_5D_Meal_Report_${AppState.currentMonth}_${AppState.currentYear}.png`;
                        link.href = imgData;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        showToast('High-Quality ছবি ডাউনলোড সফল হয়েছে!', 'success');
                        restoreUI();
                    } catch (err) {
                        console.error("CORS Security Error:", err);
                        // যদি লোকালহোস্টে ইমেজের জন্য সিকিউরিটি এরর দেয়, তবে জলছাপ সরিয়ে আবার ছবি তুলবে
                        const wm = document.getElementById('imageWatermark');
                        if (wm) wm.style.display = 'none';
                        
                        html2canvas(imageContainer, { scale: 3, useCORS: true, backgroundColor: "#ffffff" }).then(canvas2 => {
                            const imgData2 = canvas2.toDataURL('image/png');
                            const link2 = document.createElement('a');
                            link2.download = `Flat_5D_Meal_Report_${AppState.currentMonth}_${AppState.currentYear}_(No_Logo).png`;
                            link2.href = imgData2;
                            document.body.appendChild(link2);
                            link2.click();
                            document.body.removeChild(link2);
                            showToast('ছবি ডাউনলোড হয়েছে (সিকিউরিটির জন্য লোগো ছাড়া)', 'success');
                            restoreUI();
                        }).catch(e => { restoreUI(); showToast('ছবি তৈরিতে সমস্যা হয়েছে!', 'error'); });
                    }
                }).catch(err => {
                    console.error("html2canvas Error:", err);
                    restoreUI();
                    showToast('ক্যানভাস তৈরিতে সমস্যা হয়েছে!', 'error');
                });
            } catch(error) {
                console.error("Critical Execution Error:", error);
                restoreUI();
                showToast('সিস্টেমে ত্রুটি হয়েছে!', 'error');
            }
        }, 1000);
    };

    // ৫. চেক করা হচ্ছে html2canvas আছে কি না, না থাকলে ডাউনলোড করে নেবে!
    if (typeof html2canvas === 'undefined') {
        showToast('প্রয়োজনীয় টুল সেটআপ হচ্ছে, একটু অপেক্ষা করুন...', 'success');
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = processImage;
        script.onerror = () => {
            restoreUI();
            showToast('ইন্টারনেট সংযোগ চেক করুন!', 'error');
        };
        document.head.appendChild(script);
    } else {
        processImage();
    }
};

/**
 * --------------------------------------------------------------------------
 * 🚀 MISSED MEAL RECOVERY SYSTEM (ADMIN ONLY)
 * --------------------------------------------------------------------------
 */
window.renderMissedMeals = function() {
    const container = document.getElementById('missedMealsContainer');
    if(!container) return;
    
    if(!AppState.isAdmin) {
        container.innerHTML = `<div style="padding:40px; text-align:center; background:#fff; border-radius:15px; width:100%; grid-column: 1 / -1;"><h3 style="color:var(--danger-color);">এই পেজটি শুধুমাত্র অ্যাডমিনদের জন্য!</h3></div>`;
        return;
    }

    let html = '';
    const processMeals = (mealsObj, monthLabel, monthKey) => {
        if (!mealsObj) return;
        const days = Object.keys(mealsObj).length;
        
        for(let day = 1; day <= days; day++) {
            if(!mealsObj[day]) continue;
            ['morning', 'night'].forEach(type => {
                const status = mealsObj[day].khalaStatus[type];
                const autoBackup = mealsObj[day][type + '_auto_backup'];
                const manualBackup = mealsObj[day][type + '_backup'];
                
                if(status === 'no' && (autoBackup || manualBackup)) {
                    const backupData = autoBackup || manualBackup;
                    let totalBackupMeals = 0;
                    let detailsHtml = '';
                    
                    AppState.members.forEach(m => {
                        const val = backupData[m.id] || 0;
                        totalBackupMeals += val;
                        if(val > 0) {
                            detailsHtml += `<span style="display:inline-block; background:rgba(67,97,238,0.1); padding:5px 10px; border-radius:8px; margin:4px; font-size:12px; font-weight:800; color:var(--primary-color); border:1px solid rgba(67,97,238,0.2);">${m.name}: ${convertToBanglaNumber(val)}</span>`;
                        }
                    });

                    const waktName = type === 'morning' ? 'সকাল' : 'রাত';
                    const backupTypeStr = autoBackup ? 'টাইম শেষ হয়েছিল' : 'ভুলে "খালা আসেনি" চাপ দেওয়া হয়েছিল';

                    html += `
                    <div class="member-card" style="border-left: 6px solid var(--danger-color); display:flex; flex-direction:column; justify-content:space-between;">
                        <div style="margin-bottom:15px;">
                            <h4 style="color:#707eae; margin-bottom:5px;">${monthLabel}</h4>
                            <h3 style="color:var(--danger-color); margin-bottom:8px; font-size: 20px;">${convertToBanglaNumber(day)} তারিখ - ${waktName}</h3>
                            <p style="font-size:13px; color:var(--text-muted); font-weight:700; background:#f8f9fa; padding:6px; border-radius:8px; display:inline-block;">${backupTypeStr}</p>
                        </div>
                        <div style="margin-bottom:20px; background: #fff; border: 1px dashed var(--primary-color); padding: 12px; border-radius: 10px;">
                            <p style="font-weight:800; color:var(--text-primary); margin-bottom:8px; font-size:15px;">রিকভারি মিল: <span style="color:var(--success-color); font-size: 18px;">${convertToBanglaNumber(totalBackupMeals)} টি</span></p>
                            <div style="display:flex; flex-wrap:wrap; gap: 4px;">${detailsHtml}</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="restoreMissedMeal(${day}, '${type}', '${autoBackup ? 'auto' : 'manual'}', '${monthKey}')" style="flex:2; padding:12px; background:var(--success-color); color:#fff; font-weight:800; border-radius:10px; cursor:pointer;">রিকভার করুন</button>
                            <button onclick="deleteMissedMeal(${day}, '${type}', '${autoBackup ? 'auto' : 'manual'}', '${monthKey}')" style="flex:1; padding:12px; background:var(--danger-light); color:var(--danger-color); font-weight:800; border-radius:10px; cursor:pointer; border: 1px solid var(--danger-color);">মুছে ফেলুন</button>
                        </div>
                    </div>`;
                }
            });
        }
    };
    processMeals(AppState.meals, "চলতি মাস", "current");
    if (AppState.history) {
        Object.keys(AppState.history).forEach(key => {
            const splitKey = key.split('-');
            const monthName = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"][parseInt(splitKey[1])-1];
            processMeals(AppState.history[key].meals, `${monthName} ${convertToBanglaNumber(splitKey[0])}`, key);
        });
    }
    container.innerHTML = html || `<div style="padding:40px; text-align:center; background:#fff; border-radius:15px; width:100%; grid-column: 1 / -1;"><h3 style="color:var(--text-muted);">সব ঠিক আছে! কোনো মিসড মিল নেই।</h3></div>`;
};

window.restoreMissedMeal = function(day, type, backupType, monthKey) {
    window.customConfirm(`আপনি কি নিশ্চিত? এটি রিকভার করলে স্ট্যাটাস "খালা এসেছে" হয়ে যাবে।`, function() {
        // ডেটা কোথা থেকে নিব তা নির্ধারণ (বর্তমান মাস না হিস্ট্রি)
        let targetMeals = (monthKey === 'current') ? AppState.meals : AppState.history[monthKey].meals;
        
        const backupKey = type + (backupType === 'auto' ? '_auto_backup' : '_backup');
        const backupData = targetMeals[day][backupKey];
        
        if(backupData) {
            targetMeals[day][type] = JSON.parse(JSON.stringify(backupData));
            targetMeals[day].khalaStatus[type] = 'yes';
            
            // রিস্টোর শেষে ব্যাকআপ মোছা
            delete targetMeals[day][type + '_auto_backup'];
            delete targetMeals[day][type + '_backup'];
            
            showToast('সফলভাবে মিল রিকভার করা হয়েছে!', 'success');
            
            // রিকভারির পর হিস্ট্রি ভিউ রেন্ডার করার জন্য রিলোড বা রিফ্রেশ
            if(monthKey !== 'current') {
                 // হিস্ট্রিতে পরিবর্তন হলে ক্যালেন্ডার ভিউ আপডেট করা ভালো
                 if(typeof renderCalendar === 'function') renderCalendar();
            }
            refreshAll();
        }
    });
};


window.deleteMissedMeal = function(day, type, backupType, monthKey) {
    window.customConfirm('এই রিকভারি অপশনটি মুছে ফেলতে চান?', function() {
        // ডেটা কোথা থেকে নিব তা নির্ধারণ
        let targetMeals = (monthKey === 'current') ? AppState.meals : AppState.history[monthKey].meals;
        const backupKey = type + (backupType === 'auto' ? '_auto_backup' : '_backup');

        if(targetMeals[day] && targetMeals[day][backupKey]) {
            // ব্যাকআপ ডেটা মুছে ফেলা
            delete targetMeals[day][backupKey];
            
            showToast('রিকভারি অপশনটি সফলভাবে মুছে ফেলা হয়েছে!', 'success');
            refreshAll(); // অটোমেটিক Firebase এ সেভ হয়ে যাবে
        }
    });
};

// 🚀 TODAY'S MENU LOGIC 🚀
window.renderTodaysMenu = function() {
    const menuDisplay = document.getElementById('todaysMenuDisplay');
    if (!menuDisplay) return;
    
    // যদি স্টেট এ মেনু না থাকে, তবে ডিফল্ট লেখা দেখাবে
    const currentMenu = AppState.todaysMenu || "আজকের মেনু এখনও ঠিক করা হয়নি...";
    menuDisplay.innerText = currentMenu;
};

// এডিট বাটন ক্লিক করলে পপ-আপ ওপেন হবে
const editMenuBtn = document.getElementById('editMenuBtn');
const saveMenuBtn = document.getElementById('saveMenuBtn');
const menuInput = document.getElementById('menuInputText');
const menuModal = document.getElementById('editMenuModal');

if (editMenuBtn && menuModal) {
    editMenuBtn.addEventListener('click', function() {
        menuInput.value = AppState.todaysMenu || "";
        menuModal.classList.add('show');
    });
}

// সেভ বাটনে ক্লিক করলে ডেটা সেভ হবে
if (saveMenuBtn && menuModal) {
    saveMenuBtn.addEventListener('click', function() {
        const newMenu = menuInput.value.trim();
        if (!newMenu) return showToast('মেনু খালি রাখা যাবে না!', 'error');
        
        AppState.todaysMenu = newMenu;
        menuModal.classList.remove('show');
        showToast('আজকের মেনু সফলভাবে আপডেট হয়েছে!', 'success');
        refreshAll(); // ফায়ারবেসে সেভ করার জন্য
    });
}

// ডিলিট বাটনে ক্লিক করলে মেনু রিসেট হবে
const deleteMenuBtn = document.getElementById('deleteMenuBtn');

if (deleteMenuBtn) {
    deleteMenuBtn.addEventListener('click', function() {
        // মেনু মুছতে চাইলে আগে কনফার্মেশন চাইবে
        window.customConfirm('আপনি কি আজকের মেনু মুছে ফেলতে চান?', function() {
            AppState.todaysMenu = ""; // মেনু খালি করে দেওয়া হলো
            showToast('আজকের মেনু মুছে ফেলা হয়েছে!', 'success');
            refreshAll(); // ফায়ারবেসে সেভ করার জন্য রিফ্রেশ
        });
    });
}

// মাস্টার রিফ্রেশে মেনু রেন্ডার ফাংশন যুক্ত করা হলো
const previousRefreshForMenu = window.refreshAll;
window.refreshAll = function() {
    if(typeof previousRefreshForMenu === 'function') previousRefreshForMenu();
    if(typeof renderTodaysMenu === 'function') renderTodaysMenu();
};

// পেজ লোড হওয়ার সাথে সাথে একবার কল করা
if(typeof renderTodaysMenu === 'function') renderTodaysMenu();

/**
 * Initializes the entire application on startup.
 */

function initializeApp() {
    console.log("System Initializing: Flat 5D");
    
    // 1. Current Date Setup
    const dateEl = document.getElementById('displayCurrentDate');
    if (dateEl) {
        dateEl.innerText = getBengaliDate(new Date());
    }
    
    // 🔥 CRITICAL BUG FIX: Force month check on startup
    if (typeof window.checkAndResetNewMonth === 'function') {
        window.checkAndResetNewMonth();
    }
    
    if (typeof populateMonthDropdown === 'function') {
        populateMonthDropdown(); 
    }
    
    // 3. Populate Select Dropdowns
    if (typeof populateMemberDropdowns === 'function') {
        populateMemberDropdowns();
    }
    
    // 4. Set Daily Motivation
    if (typeof setDailyMotivation === 'function') {
        setDailyMotivation(); 
    }

    // ক্যালেন্ডার ড্রপডাউন চালু করার কোড
    if (typeof populateCalendarMonthDropdown === 'function') {
        populateCalendarMonthDropdown();
    }
    
    // 5. Run initial rendering
    refreshAll();
    
    // Fallback: Make sure Month Dropdown Year displays correctly
    const calMonthText = document.getElementById('currentMonthYear');
    if (calMonthText) {
        const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
        calMonthText.innerText = `${monthNames[AppState.currentMonth - 1]} ${convertToBanglaNumber(AppState.currentYear)}`;
    }
}

// 🔥 এই লাইনটি একদম ফাইলের শেষে যোগ করা হলো (যাতে পেজ লোড হলেই অ্যাপ চালু হয়) 🔥
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});