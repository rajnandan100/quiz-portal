// Main Application Logic - app.js

// =========================================
// REMOVED SAMPLE DATA INITIALIZATION
// =========================================
// Sample data function removed - quizzes now only come from admin panel or Google Sheets

window.addEventListener('DOMContentLoaded', function () {
  // Don't initialize sample data anymore
  // initializeSampleData(); // ← REMOVED THIS LINE
  
  loadQuizDates();
  setupSubjectSelection();
  setupFormValidation();
  loadQuizDashboard();
  setupFilters();
  updateStats();
  
  // Sync from Google Sheets if API is available
  syncQuizzesFromServer();
});

function loadQuizDates() {
  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const dateSelect = document.getElementById('quizDate');
  if (!dateSelect) return;

  const uniqueDates = [...new Set(quizzes.map((q) => q.date))].sort().reverse();
  dateSelect.innerHTML = '<option value="">Choose date...</option>';
  uniqueDates.forEach((date) => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    dateSelect.appendChild(option);
  });
  
  console.log(`📅 Loaded ${uniqueDates.length} quiz dates`);
}

function setupSubjectSelection() {
  const subjectCards = document.querySelectorAll('.subject-card');
  const selectedSubjectInput = document.getElementById('selectedSubject');
  if (!subjectCards.length) return;

  subjectCards.forEach((card) => {
    card.addEventListener('click', function () {
      subjectCards.forEach((c) => c.classList.remove('selected'));
      this.classList.add('selected');
      if (selectedSubjectInput) {
        selectedSubjectInput.value = this.dataset.subject;
      }
      validateForm();
    });
  });
}

function setupFormValidation() {
  const form = document.getElementById('preQuizForm');
  if (!form) return;

  const inputs = form.querySelectorAll('input, select');
  inputs.forEach((input) => {
    input.addEventListener('input', validateForm);
    input.addEventListener('change', validateForm);
  });

  form.addEventListener('submit', handleQuizStart);
}

function validateForm() {
  const fullName = document.getElementById('fullName');
  const email = document.getElementById('email');
  const quizDate = document.getElementById('quizDate');
  const selectedSubject = document.getElementById('selectedSubject');
  const startBtn = document.getElementById('startQuizBtn');

  if (!startBtn) return;

  const isValid =
    fullName &&
    fullName.value.length >= 3 &&
    email &&
    email.validity.valid &&
    quizDate &&
    quizDate.value &&
    selectedSubject &&
    selectedSubject.value;

  if (isValid) {
    startBtn.disabled = false;
    startBtn.classList.remove('disabled');
  } else {
    startBtn.disabled = true;
    startBtn.classList.add('disabled');
  }
}

function handleQuizStart(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const quizDate = document.getElementById('quizDate').value;
  const subject = document.getElementById('selectedSubject').value;

  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const quiz = quizzes.find((q) => q.date === quizDate && q.subject === subject);

  if (!quiz) {
    Swal.fire('Error', 'Quiz not found for selected date and subject', 'error');
    return;
  }

  // Check if user already attempted this quiz using email
  const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
  const alreadyAttempted = attempts.find(a => a.email === email && a.quizId === quiz.quizId);

  if (alreadyAttempted) {
    Swal.fire({
      title: 'Already Attempted',
      html: `You have already taken this quiz on <strong>${alreadyAttempted.date}</strong>.<br><br>` +
            `Your score: <strong>${alreadyAttempted.score}/${alreadyAttempted.total}</strong> (${alreadyAttempted.accuracy.toFixed(2)}%)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Retake Quiz',
      cancelButtonText: 'View Leaderboard',
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#f59e0b'
    }).then((result) => {
      if (result.isConfirmed) {
        startQuizSession(fullName, email, quiz);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        window.location.href = 'leaderboard.html';
      }
    });
    return;
  }

  startQuizSession(fullName, email, quiz);
}

function startQuizSession(fullName, email, quiz) {
  localStorage.setItem(
    'userSession',
    JSON.stringify({
      userName: fullName,
      email: email,
      currentQuizId: quiz.quizId,
    })
  );

  window.location.href = 'quiz.html';
}

function loadQuizDashboard() {
  const quizCardsContainer = document.getElementById('quizCards');
  if (!quizCardsContainer) return;

  // Get all quizzes from localStorage
  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
  const session = JSON.parse(localStorage.getItem('userSession') || '{}');

  console.log(`📊 Loading ${quizzes.length} quizzes to dashboard`);

  if (quizzes.length === 0) {
    quizCardsContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fas fa-inbox fa-5x text-muted mb-3"></i>
        <h4 class="text-muted">No quizzes available yet</h4>
        <p class="text-muted">Admin will create quizzes soon. Check back later!</p>
      </div>`;
    updateQuizCount(0);
    return;
  }

  // Update quiz count badge
  updateQuizCount(quizzes.length);

  // Sort quizzes by date (newest first)
  const sortedQuizzes = quizzes.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Display quizzes
  displayQuizzes(sortedQuizzes, attempts, session);
}

function displayQuizzes(quizzes, attempts, session) {
  const quizCardsContainer = document.getElementById('quizCards');
  
  quizCardsContainer.innerHTML = quizzes.map((quiz) => {
      const attempt = attempts.find((a) => a.quizId === quiz.quizId && a.email === session.email);
      const attempted = !!attempt;
      
      const statusBadge = attempted
        ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Completed</span>'
        : '<span class="badge bg-warning text-dark"><i class="fas fa-clock me-1"></i>Pending</span>';
      
      const score = attempted 
        ? `<div class="alert alert-success py-2 mb-2">
             <i class="fas fa-award me-1"></i><strong>Score: ${attempt.score}/${quiz.totalQuestions}</strong> 
             (${attempt.accuracy.toFixed(1)}%)
           </div>` 
        : '';

      const btnClass = attempted ? 'btn-outline-primary' : 'btn-primary';
      const btnIcon = attempted ? 'fa-redo' : 'fa-play';
      const btnText = attempted ? 'Retake Quiz' : 'Start Quiz';

      return `
        <div class="col-lg-4 col-md-6 quiz-card-item" data-subject="${quiz.subject}" data-status="${attempted ? 'attempted' : 'pending'}">
          <div class="card quiz-card h-100 shadow-sm hover-lift">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <h5 class="card-title mb-0 fw-bold">
                  <i class="fas fa-book-reader me-2 text-primary"></i>${quiz.subject}
                </h5>
                ${statusBadge}
              </div>
              
              <p class="text-muted mb-2">
                <i class="fas fa-calendar-alt me-2"></i>${new Date(quiz.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              
              <div class="d-flex justify-content-between text-muted small mb-3">
                <span><i class="fas fa-question-circle me-1 text-info"></i>${quiz.totalQuestions} Questions</span>
                <span><i class="fas fa-hourglass-half me-1 text-warning"></i>${Math.ceil(quiz.timeLimit / 60)} min</span>
              </div>
              
              ${score}
              
              <button class="btn ${btnClass} w-100 mt-auto" onclick="startQuizFromCard('${quiz.quizId}')">
                <i class="fas ${btnIcon} me-2"></i>${btnText}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
}

function setupFilters() {
  const subjectFilter = document.getElementById('filterSubject');
  const statusFilter = document.getElementById('filterStatus');
  
  if (subjectFilter) {
    subjectFilter.addEventListener('change', applyFilters);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
  }
  
  console.log('✅ Filters setup complete');
}

function applyFilters() {
  const subjectFilter = document.getElementById('filterSubject');
  const statusFilter = document.getElementById('filterStatus');
  
  const selectedSubject = subjectFilter ? subjectFilter.value : '';
  const selectedStatus = statusFilter ? statusFilter.value : '';
  
  const allCards = document.querySelectorAll('.quiz-card-item');
  let visibleCount = 0;
  
  allCards.forEach(card => {
    const cardSubject = card.dataset.subject;
    const cardStatus = card.dataset.status;
    
    const subjectMatch = !selectedSubject || cardSubject === selectedSubject;
    const statusMatch = !selectedStatus || cardStatus === selectedStatus;
    
    if (subjectMatch && statusMatch) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Update count
  updateQuizCount(visibleCount);
  
  console.log(`🔍 Filters applied: ${visibleCount} quizzes visible`);
}

function updateQuizCount(count) {
  const countElement = document.getElementById('quizCount');
  if (countElement) {
    countElement.textContent = count;
  }
}

function startQuizFromCard(quizId) {
  const userName = prompt('Enter your name:');
  if (!userName || userName.trim().length < 3) {
    Swal.fire('Invalid Name', 'Please enter your full name (at least 3 characters)', 'error');
    return;
  }
  
  const email = prompt('Enter your email:');
  if (!email || !email.includes('@')) {
    Swal.fire('Invalid Email', 'Please enter a valid email address', 'error');
    return;
  }

  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const quiz = quizzes.find(q => q.quizId === quizId);

  if (!quiz) {
    Swal.fire('Error', 'Quiz not found', 'error');
    return;
  }

  // Check for duplicate attempt
  const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
  const alreadyAttempted = attempts.find(a => a.email === email && a.quizId === quizId);

  if (alreadyAttempted) {
    Swal.fire({
      title: 'Already Attempted',
      html: `You have already taken this quiz.<br><br>Previous score: <strong>${alreadyAttempted.score}/${alreadyAttempted.total}</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Retake Anyway',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#6366f1'
    }).then((result) => {
      if (result.isConfirmed) {
        startQuizSession(userName.trim(), email.trim(), quiz);
      }
    });
    return;
  }

  startQuizSession(userName.trim(), email.trim(), quiz);
}

function clearSession() {
  Swal.fire({
    title: 'Logout?',
    text: 'Are you sure you want to logout?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Logout',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ef4444'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('userSession');
      localStorage.removeItem('currentQuizResults');
      Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been logged out successfully',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = 'index.html';
      });
    }
  });
}

function updateStats() {
  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
  
  const totalUsersEl = document.getElementById('totalUsers');
  const totalQuizzesEl = document.getElementById('totalQuizzes');
  const totalAttemptsEl = document.getElementById('totalAttempts');
  
  if (totalQuizzesEl) totalQuizzesEl.textContent = quizzes.length + '+';
  if (totalAttemptsEl) totalAttemptsEl.textContent = attempts.length + '+';
  
  // Count unique users by email
  const uniqueEmails = new Set(attempts.map(a => a.email));
  if (totalUsersEl) totalUsersEl.textContent = uniqueEmails.size || '1000+';
  
  console.log(`📈 Stats updated: ${quizzes.length} quizzes, ${attempts.length} attempts, ${uniqueEmails.size} users`);
}

// Refresh quiz dashboard when returning to page
window.addEventListener('pageshow', function(event) {
  if (event.persisted || performance.navigation.type === 2) {
    console.log('🔄 Page restored from cache, refreshing data...');
    loadQuizDashboard();
    updateStats();
  }
});

// Sync quizzes from Google Sheets on page load
async function syncQuizzesFromServer() {
  try {
    if (window.QuizAPI && typeof window.QuizAPI.sync === 'function') {
      console.log('🔄 Syncing quizzes from Google Sheets...');
      const synced = await window.QuizAPI.sync();
      
      if (synced) {
        console.log('✅ Quizzes synced from Google Sheets');
        loadQuizDashboard(); // Reload with fresh data
        updateStats();
      }
    }
  } catch (error) {
    console.log('⚠️ Could not sync from server:', error.message);
  }
}
