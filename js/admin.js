// Admin Panel JavaScript - admin.js

// Check authentication on load
window.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('quizAdmin') === 'authenticated') {
        document.getElementById('adminContent').style.display = 'block';
        initializeAdminPanel();
    } else {
        var loginModal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
        loginModal.show();
    }
});

// Admin Login
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    
    if (password === 'admin123' || password.length >= 6) {
        localStorage.setItem('quizAdmin', 'authenticated');
        bootstrap.Modal.getInstance(document.getElementById('adminLoginModal')).hide();
        document.getElementById('adminContent').style.display = 'block';
        initializeAdminPanel();
        
        Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: 'Welcome to Admin Panel',
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        document.getElementById('loginErrorText').textContent = 'Invalid password!';
        document.getElementById('loginError').style.display = 'block';
    }
});

// Initialize Admin Panel
function initializeAdminPanel() {
    checkAPIConnection();
    updateDashboardStats();
    loadAllQuizzes();
    loadAllAttempts();
    setupAutoCalculation();
}

// Check API Status
async function checkAPIConnection() {
    const statusText = document.getElementById('apiStatusText');
    const statusAlert = document.getElementById('apiStatusAlert');
    
    try {
        if (window.QuizAPI && typeof window.QuizAPI.checkStatus === 'function') {
            statusText.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Checking...';
            
            const isConnected = await window.QuizAPI.checkStatus();
            
            if (isConnected) {
                statusText.innerHTML = '<i class="fas fa-check-circle me-2"></i>Google Sheets API Connected';
                statusAlert.classList.remove('alert-info', 'alert-warning');
                statusAlert.classList.add('alert-success');
            } else {
                throw new Error('Connection failed');
            }
        } else {
            throw new Error('API not loaded');
        }
    } catch (error) {
        statusText.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>API Offline - Data saved locally';
        statusAlert.classList.remove('alert-info');
        statusAlert.classList.add('alert-warning');
    }
}

// Update Dashboard Statistics
function updateDashboardStats() {
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    
    // Total Quizzes
    document.getElementById('totalQuizzesCount').textContent = quizzes.length;
    
    // Total Attempts
    document.getElementById('totalAttemptsCount').textContent = attempts.length;
    
    // Today's Quizzes
    const today = new Date().toISOString().split('T')[0];
    const todayQuizzes = quizzes.filter(q => q.date === today);
    document.getElementById('todayQuizzesCount').textContent = todayQuizzes.length;
    
    // Total Questions
    const totalQuestions = quizzes.reduce((sum, q) => sum + q.totalQuestions, 0);
    document.getElementById('totalQuestionsCount').textContent = totalQuestions;
    
    console.log('📊 Dashboard stats updated');
}

// Auto-calculate question count and time
function setupAutoCalculation() {
    document.getElementById('questionsJson').addEventListener('input', function() {
        try {
            const questions = JSON.parse(this.value);
            if (Array.isArray(questions)) {
                document.getElementById('questionCount').textContent = questions.length;
                const totalMinutes = Math.ceil(questions.reduce((sum, q) => sum + (q.timeAllocation || 60), 0) / 60);
                document.getElementById('totalTime').textContent = totalMinutes + ' min';
            }
        } catch(e) {
            // Ignore during typing
        }
    });
}

// Validate JSON
function validateJSON() {
    const jsonText = document.getElementById('questionsJson').value;
    try {
        const questions = JSON.parse(jsonText);
        if (!Array.isArray(questions)) throw new Error('Must be an array');
        
        questions.forEach((q, i) => {
            if (!q.question || !q.options || !q.explanation) {
                throw new Error(`Question ${i+1} missing required fields`);
            }
            if (!Array.isArray(q.options) || q.options.length !== 4) {
                throw new Error(`Question ${i+1} must have 4 options`);
            }
            if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
                throw new Error(`Question ${i+1} invalid correctAnswer`);
            }
        });
        
        document.getElementById('questionCount').textContent = questions.length;
        const totalMinutes = Math.ceil(questions.reduce((sum, q) => sum + (q.timeAllocation || 60), 0) / 60);
        document.getElementById('totalTime').textContent = totalMinutes + ' min';
        
        Swal.fire({
            icon: 'success',
            title: 'Valid JSON!',
            text: `${questions.length} questions validated`,
            timer: 2000
        });
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid JSON',
            text: err.message
        });
    }
}

// Quiz Creation Form
document.getElementById('quizCreationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const date = document.getElementById('quizDateInput').value;
    const subject = document.getElementById('subjectInput').value;
    const questionsJson = document.getElementById('questionsJson').value;
    
    try {
        const questions = JSON.parse(questionsJson);
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Questions must be a non-empty array');
        }
        
        const quizId = 'quiz_' + Date.now();
        const quizData = {
            quizId,
            date,
            subject,
            questions,
            totalQuestions: questions.length,
            timeLimit: questions.reduce((sum, q) => sum + (q.timeAllocation || 60), 0),
            createdAt: new Date().toISOString()
        };
        
        // Save locally
        let quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        quizzes.push(quizData);
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        
        // Send to Google Sheets
        try {
            if (window.QuizAPI && typeof window.QuizAPI.createQuiz === 'function') {
                Swal.fire({
                    title: 'Creating Quiz...',
                    html: '<i class="fas fa-spinner fa-spin fa-3x text-primary"></i>',
                    allowOutsideClick: false,
                    showConfirmButton: false
                });

                await window.QuizAPI.createQuiz(quizData);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Quiz Created!',
                    html: `<strong>Successfully saved!</strong><br><br>` +
                          `Questions: ${quizData.totalQuestions}<br>` +
                          `Duration: ${Math.ceil(quizData.timeLimit/60)} minutes`,
                    confirmButtonColor: '#dc3545'
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Saved Locally',
                    text: 'Google Sheets API not connected'
                });
            }
        } catch (apiError) {
            console.error('API Error:', apiError);
            Swal.fire({
                icon: 'warning',
                title: 'Partial Success',
                text: 'Saved locally but failed to sync with Google Sheets'
            });
        }
        
        // Reset form and update UI
        document.getElementById('quizCreationForm').reset();
        document.getElementById('questionCount').textContent = '0';
        document.getElementById('totalTime').textContent = '0 min';
        updateDashboardStats();
        loadAllQuizzes();
        
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message
        });
    }
});

// Load All Quizzes
function loadAllQuizzes() {
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const tbody = document.getElementById('allQuizzesTable');
    
    if (quizzes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No quizzes created yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = quizzes.map((quiz, index) => {
        const quizAttempts = attempts.filter(a => a.quizId === quiz.quizId);
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${quiz.date}</td>
                <td><span class="badge bg-primary">${quiz.subject}</span></td>
                <td>${quiz.totalQuestions}</td>
                <td>${Math.ceil(quiz.timeLimit / 60)} min</td>
                <td><span class="badge bg-success">${quizAttempts.length}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewQuizDetails('${quiz.quizId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteQuiz('${quiz.quizId}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Load All Attempts
function loadAllAttempts() {
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const tbody = document.getElementById('allAttemptsTable');
    
    if (attempts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No attempts yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = attempts.map((attempt, index) => {
        const quiz = quizzes.find(q => q.quizId === attempt.quizId);
        const subject = quiz ? quiz.subject : 'Unknown';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${attempt.userName}</td>
                <td><small>${attempt.email}</small></td>
                <td>${subject}</td>
                <td><strong>${attempt.score}/${attempt.total}</strong></td>
                <td><span class="badge bg-success">${attempt.accuracy.toFixed(1)}%</span></td>
                <td>${attempt.date}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteAttempt('${attempt.attemptId}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// View Quiz Details
function viewQuizDetails(quizId) {
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const quiz = quizzes.find(q => q.quizId === quizId);
    
    if (quiz) {
        Swal.fire({
            title: quiz.subject,
            html: `
                <div class="text-start">
                    <p><strong>Date:</strong> ${quiz.date}</p>
                    <p><strong>Questions:</strong> ${quiz.totalQuestions}</p>
                    <p><strong>Duration:</strong> ${Math.ceil(quiz.timeLimit/60)} minutes</p>
                    <p><strong>Created:</strong> ${new Date(quiz.createdAt).toLocaleString()}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonColor: '#6366f1'
        });
    }
}

// Delete Quiz
function deleteQuiz(quizId) {
    Swal.fire({
        title: 'Delete Quiz?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            let quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
            quizzes = quizzes.filter(q => q.quizId !== quizId);
            localStorage.setItem('quizzes', JSON.stringify(quizzes));
            
            updateDashboardStats();
            loadAllQuizzes();
            
            Swal.fire('Deleted!', 'Quiz deleted successfully', 'success');
        }
    });
}

// Delete Attempt
function deleteAttempt(attemptId) {
    Swal.fire({
        title: 'Delete Attempt?',
        text: 'Remove this user attempt?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            let attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
            attempts = attempts.filter(a => a.attemptId !== attemptId);
            localStorage.setItem('quizAttempts', JSON.stringify(attempts));
            
            updateDashboardStats();
            loadAllAttempts();
            
            Swal.fire('Deleted!', 'Attempt removed', 'success');
        }
    });
}

// Delete All Quizzes
function deleteAllQuizzes() {
    Swal.fire({
        title: 'Delete ALL Quizzes?',
        text: 'This will remove all quizzes permanently!',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, Delete All'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.setItem('quizzes', '[]');
            updateDashboardStats();
            loadAllQuizzes();
            Swal.fire('Deleted!', 'All quizzes removed', 'success');
        }
    });
}

// Delete All Attempts
function deleteAllAttempts() {
    Swal.fire({
        title: 'Clear ALL Attempts?',
        text: 'This will remove all user attempts!',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, Clear All'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.setItem('quizAttempts', '[]');
            updateDashboardStats();
            loadAllAttempts();
            Swal.fire('Cleared!', 'All attempts removed', 'success');
        }
    });
}

// Copy Template
function copyTemplate() {
    const template = `[
  {
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1,
    "explanation": "Detailed explanation",
    "timeAllocation": 60
  }
]`;
    navigator.clipboard.writeText(template).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: 'Template copied to clipboard',
            timer: 1500,
            showConfirmButton: false
        });
    });
}

// Export All Data
function exportAllData() {
    const data = {
        quizzes: JSON.parse(localStorage.getItem('quizzes') || '[]'),
        attempts: JSON.parse(localStorage.getItem('quizAttempts') || '[]'),
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    Swal.fire('Exported!', 'Data downloaded successfully', 'success');
}

// Sync with Google Sheets
async function syncWithGoogleSheets() {
    try {
        Swal.fire({
            title: 'Syncing...',
            html: '<i class="fas fa-sync-alt fa-spin fa-3x"></i>',
            showConfirmButton: false
        });
        
        if (window.QuizAPI && typeof window.QuizAPI.sync === 'function') {
            await window.QuizAPI.sync();
            Swal.fire('Synced!', 'Data synced with Google Sheets', 'success');
        } else {
            throw new Error('API not available');
        }
    } catch (error) {
        Swal.fire('Error', 'Failed to sync with Google Sheets', 'error');
    }
}

// Backup Data
function backupData() {
    const backup = {
        quizzes: localStorage.getItem('quizzes'),
        attempts: localStorage.getItem('quizAttempts'),
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('backup_' + Date.now(), JSON.stringify(backup));
    Swal.fire('Success!', 'Backup created successfully', 'success');
}

// Clear All Data
function clearAllData() {
    Swal.fire({
        title: 'Clear ALL Data?',
        text: 'This will delete everything!',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, Clear Everything'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            Swal.fire('Cleared!', 'All data removed. Page will reload.', 'success').then(() => {
                location.reload();
            });
        }
    });
}

// Admin Logout
function adminLogout() {
    Swal.fire({
        title: 'Logout?',
        text: 'Are you sure?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Logout'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('quizAdmin');
            window.location.href = 'index.html';
        }
    });
}






// Set default date to today on page load
function setDefaultDate() {
    const dateInput = document.getElementById('quizDateInput');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        console.log('✅ Quiz date set to today:', today);
    }
}

// Paste from clipboard
async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('questionsJson').value = text;
        
        // Auto-validate after paste
        try {
            const questions = JSON.parse(text);
            if (Array.isArray(questions)) {
                document.getElementById('questionCount').textContent = questions.length;
                const totalMinutes = Math.ceil(questions.reduce((sum, q) => sum + (q.timeAllocation || 60), 0) / 60);
                document.getElementById('totalTime').textContent = totalMinutes + ' min';
                
                Swal.fire({
                    icon: 'success',
                    title: 'Pasted!',
                    text: `${questions.length} questions detected`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (e) {
            Swal.fire({
                icon: 'warning',
                title: 'Pasted',
                text: 'Content pasted. Please validate JSON format.',
                timer: 2000
            });
        }
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Could not paste from clipboard. Please paste manually.',
            timer: 2000
        });
    }
}

// Fill sample data for testing
function fillSampleData() {
    const sampleQuiz = [
        {
            question: "What is the capital of India?",
            options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
            correctAnswer: 1,
            explanation: "New Delhi is the capital of India since 1911. It was planned and built as the new capital after shifting from Kolkata.",
            timeAllocation: 60
        },
        {
            question: "Who is known as the Father of the Nation in India?",
            options: ["Jawaharlal Nehru", "Mahatma Gandhi", "Sardar Patel", "Subhas Chandra Bose"],
            correctAnswer: 1,
            explanation: "Mahatma Gandhi is called the Father of the Nation for his role in India's independence movement using non-violent methods.",
            timeAllocation: 60
        },
        {
            question: "Which is the largest state in India by area?",
            options: ["Maharashtra", "Rajasthan", "Madhya Pradesh", "Uttar Pradesh"],
            correctAnswer: 1,
            explanation: "Rajasthan is the largest state in India by area, covering 342,239 square kilometers.",
            timeAllocation: 60
        },
        {
            question: "In which year did India gain independence?",
            options: ["1942", "1945", "1947", "1950"],
            correctAnswer: 2,
            explanation: "India gained independence from British rule on August 15, 1947.",
            timeAllocation: 60
        },
        {
            question: "What is the national animal of India?",
            options: ["Lion", "Tiger", "Elephant", "Peacock"],
            correctAnswer: 1,
            explanation: "The Bengal Tiger is the national animal of India, symbolizing strength and agility.",
            timeAllocation: 60
        }
    ];
    
    document.getElementById('questionsJson').value = JSON.stringify(sampleQuiz, null, 2);
    document.getElementById('questionCount').textContent = sampleQuiz.length;
    document.getElementById('totalTime').textContent = Math.ceil(sampleQuiz.length * 60 / 60) + ' min';
    
    Swal.fire({
        icon: 'success',
        title: 'Sample Loaded!',
        text: '5 sample questions loaded for testing',
        timer: 2000,
        showConfirmButton: false
    });
}

// Update the Copy Template function
function copyTemplate() {
    const template = `[
  {
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1,
    "explanation": "Detailed explanation of why Option B is correct",
    "timeAllocation": 60
  },
  {
    "question": "Another sample question?",
    "options": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
    "correctAnswer": 0,
    "explanation": "Explanation for Choice 1 being the correct answer",
    "timeAllocation": 60
  }
]`;
    
    navigator.clipboard.writeText(template).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            html: 'Template copied to clipboard<br><small>Press Ctrl+V or click "Paste from Clipboard"</small>',
            timer: 2000,
            showConfirmButton: false
        });
    }).catch(() => {
        // Fallback: show template in modal if clipboard fails
        Swal.fire({
            title: 'Copy Template',
            html: `<textarea class="form-control font-monospace" rows="10" readonly>${template}</textarea>`,
            confirmButtonText: 'Close',
            width: '600px'
        });
    });
}







