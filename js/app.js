// Main Application Logic with Email Uniqueness - app.js

function initializeSampleData() {
  if (!localStorage.getItem('quizzes')) {
    const sampleQuizzes = [
      {
        quizId: 'quiz_sample_1',
        date: '2025-10-19',
        subject: 'General Knowledge',
        totalQuestions: 30,
        timeLimit: 1800,
        createdAt: new Date().toISOString(),
        questions: generateSampleQuestions('General Knowledge', 30),
      },
      {
        quizId: 'quiz_sample_2',
        date: '2025-10-20',
        subject: 'English',
        totalQuestions: 30,
        timeLimit: 1800,
        createdAt: new Date().toISOString(),
        questions: generateSampleQuestions('English', 30),
      },
    ];
    localStorage.setItem('quizzes', JSON.stringify(sampleQuizzes));
  }
}

function generateSampleQuestions(subject, count) {
  const questions = [];
  const sampleTemplates = {
    'General Knowledge': [
      { q: 'What is the capital of India?', opts: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], ans: 1, exp: 'New Delhi is the capital of India.' },
      { q: 'Who is known as the Father of the Nation in India?', opts: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Sardar Patel', 'Subhas Chandra Bose'], ans: 1, exp: 'Mahatma Gandhi is called the Father of the Nation.' },
      { q: 'Which is the largest state in India by area?', opts: ['Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh'], ans: 1, exp: 'Rajasthan is the largest state by area.' },
    ],
    English: [
      { q: 'Choose the correct spelling:', opts: ['Accommodate', 'Accomodate', 'Acommodate', 'Acomodate'], ans: 0, exp: 'Accommodate is the correct spelling.' },
      { q: "What is the synonym of 'happy'?", opts: ['Sad', 'Joyful', 'Angry', 'Tired'], ans: 1, exp: 'Joyful means happy.' },
      { q: "Choose the antonym of 'difficult':", opts: ['Hard', 'Tough', 'Easy', 'Complex'], ans: 2, exp: 'Easy is the opposite of difficult.' },
    ],
  };

  const templates = sampleTemplates[subject] || sampleTemplates['General Knowledge'];

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    questions.push({
      question: `${template.q}`,
      options: template.opts,
      correctAnswer: template.ans,
      explanation: template.exp,
      timeAllocation: 60,
    });
  }

  return questions;
}

window.addEventListener('DOMContentLoaded', function () {
  initializeSampleData();
  loadQuizDates();
  setupSubjectSelection();
  setupFormValidation();
  loadQuizDashboard();
  updateStats();
});

function loadQuizDates() {
  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const dateSelect = document.getElementById('quizDate');
  if (!dateSelect) return;

  const uniqueDates = [...new Set(quizzes.map((q) => q.date))].sort();
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
      text: `You have already taken this quiz on ${alreadyAttempted.date}. Your score: ${alreadyAttempted.score}/${alreadyAttempted.total}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Retake Quiz',
      cancelButtonText: 'View Results'
    }).then((result) => {
      if (result.isConfirmed) {
        startQuizSession(fullName, email, quiz);
      } else {
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

  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
  const session = JSON.parse(localStorage.getItem('userSession') || '{}');

  if (quizzes.length === 0) {
    quizCardsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No quizzes available yet. Check back later!</p></div>';
    return;
  }

  document.getElementById('quizCount').textContent = quizzes.length;

  quizCardsContainer.innerHTML = quizzes
    .map((quiz) => {
      const attempt = attempts.find((a) => a.quizId === quiz.quizId && a.email === session.email);
      const attempted = !!attempt;
      const statusBadge = attempted
        ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Completed</span>'
        : '<span class="badge bg-secondary"><i class="fas fa-clock me-1"></i>Pending</span>';
      const score = attempted ? `<p class="text-success fw-bold mb-2"><i class="fas fa-award me-1"></i>Score: ${attempt.score}/${quiz.totalQuestions}</p>` : '';

      return `
        <div class="col-lg-4 col-md-6">
          <div class="card quiz-card h-100 shadow-sm hover-lift">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <h5 class="card-title mb-0 fw-bold">
                  <i class="fas fa-book-reader me-2 text-primary"></i>${quiz.subject}
                </h5>
                ${statusBadge}
              </div>
              <p class="text-muted mb-2">
                <i class="fas fa-calendar-alt me-2"></i>${new Date(quiz.date).toLocaleDateString('en-IN')}
              </p>
              <div class="d-flex justify-content-between text-muted small mb-3">
                <span><i class="fas fa-question-circle me-1"></i>${quiz.totalQuestions} Questions</span>
                <span><i class="fas fa-hourglass-half me-1"></i>${Math.ceil(quiz.timeLimit / 60)} min</span>
              </div>
              ${score}
              <button class="btn ${attempted ? 'btn-outline-primary' : 'btn-primary'} w-100" onclick="startQuizFromCard('${quiz.quizId}')">
                <i class="fas ${attempted ? 'fa-redo' : 'fa-play'} me-2"></i>${attempted ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function startQuizFromCard(quizId) {
  const userName = prompt('Enter your name:');
  if (!userName) return;
  
  const email = prompt('Enter your email:');
  if (!email || !email.includes('@')) {
    Swal.fire('Error', 'Please enter a valid email address', 'error');
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
      text: `You have already taken this quiz. Your previous score: ${alreadyAttempted.score}/${alreadyAttempted.total}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Retake Anyway',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        startQuizSession(userName, email, quiz);
      }
    });
    return;
  }

  startQuizSession(userName, email, quiz);
}

function clearSession() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userSession');
    localStorage.removeItem('currentQuizResults');
    window.location.href = 'index.html';
  }
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
  if (totalUsersEl) totalUsersEl.textContent = uniqueEmails.size + '+';
}
