// Main Application Logic - app.js

// Initialize sample quizzes on first load
function initializeSampleData() {
  if (!localStorage.getItem('quizzes')) {
    const sampleQuizzes = [
      {
        quizId: 'quiz_sample_1',
        date: '2025-10-18',
        subject: 'General Knowledge',
        totalQuestions: 30,
        timeLimit: 1800,
        createdAt: new Date().toISOString(),
        questions: generateSampleQuestions('General Knowledge', 30),
      },
      {
        quizId: 'quiz_sample_2',
        date: '2025-10-19',
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

// Generate sample questions for a subject
function generateSampleQuestions(subject, count) {
  const questions = [];
  const sampleTemplates = {
    'General Knowledge': [
      {
        q: 'What is the capital of India?',
        opts: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
        ans: 1,
        exp: 'New Delhi is the capital of India.',
      },
      {
        q: 'Who is known as the Father of the Nation in India?',
        opts: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Sardar Patel', 'Subhas Chandra Bose'],
        ans: 1,
        exp: 'Mahatma Gandhi is called the Father of the Nation.',
      },
      {
        q: 'Which is the largest state in India by area?',
        opts: ['Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh'],
        ans: 1,
        exp: 'Rajasthan is the largest state by area.',
      },
    ],
    English: [
      {
        q: 'Choose the correct spelling:',
        opts: ['Accommodate', 'Accomodate', 'Acommodate', 'Acomodate'],
        ans: 0,
        exp: 'Accommodate is the correct spelling.',
      },
      {
        q: "What is the synonym of 'happy'?",
        opts: ['Sad', 'Joyful', 'Angry', 'Tired'],
        ans: 1,
        exp: 'Joyful means happy.',
      },
      {
        q: "Choose the antonym of 'difficult':",
        opts: ['Hard', 'Tough', 'Easy', 'Complex'],
        ans: 2,
        exp: 'Easy is the opposite of difficult.',
      },
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
});

// Load quiz dates into dropdown
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

// Subject card selection
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

// Form validation and enable/disable Start Quiz button
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

// Handle quiz start, save user session, and redirect to quiz
function handleQuizStart(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const quizDate = document.getElementById('quizDate').value;
  const subject = document.getElementById('selectedSubject').value;

  // Find matching quiz
  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const quiz = quizzes.find((q) => q.date === quizDate && q.subject === subject);

  if (!quiz) {
    alert('Quiz not found for selected date and subject');
    return;
  }

  // Save user session
  localStorage.setItem(
    'userSession',
    JSON.stringify({
      userName: fullName,
      email: email,
      currentQuizId: quiz.quizId,
    })
  );

  // Navigate to quiz page
  window.location.href = 'quiz.html';
}

// Load quiz dashboard showing quizzes with status and start/retry buttons
function loadQuizDashboard() {
  const quizCardsContainer = document.getElementById('quizCards');
  if (!quizCardsContainer) return;

  const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
  const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');

  if (quizzes.length === 0) {
    quizCardsContainer.innerHTML =
      '<div class="col-12 text-center"><p>No quizzes available yet.</p></div>';
    return;
  }

  quizCardsContainer.innerHTML = quizzes
    .map((quiz) => {
      const attempt = attempts.find((a) => a.quizId === quiz.quizId);
      const attempted = !!attempt;
      const statusBadge = attempted
        ? '<span class="badge bg-success">Completed</span>'
        : '<span class="badge bg-secondary">Pending</span>';
      const score = attempted ? `Score: ${attempt.score}/${quiz.totalQuestions}` : '';

      return `
        <div class="col-md-6 col-lg-4">
          <div class="card quiz-card">
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <h5 class="card-title mb-0">${quiz.subject}</h5>
                ${statusBadge}
              </div>
              <p class="text-muted mb-2">
                <i class="fas fa-calendar me-2"></i>${new Date(quiz.date).toLocaleDateString()}
              </p>
              <div class="d-flex justify-content-between text-muted small mb-3">
                <span><i class="fas fa-question-circle me-1"></i>${quiz.totalQuestions} Questions</span>
                <span><i class="fas fa-clock me-1"></i>${Math.ceil(quiz.timeLimit / 60)} min</span>
              </div>
              ${score ? `<p class="text-success fw-bold">${score}</p>` : ''}
              <button class="btn btn-primary btn-sm w-100" onclick="startQuiz('${quiz.quizId}')">
                ${attempted ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Start quiz action for dashboard buttons
function startQuiz(quizId) {
  const userName = prompt('Enter your name:');
  const email = prompt('Enter your email:');

  if (!userName || !email) return;

  localStorage.setItem(
    'userSession',
    JSON.stringify({
      userName,
      email,
      currentQuizId: quizId,
    })
  );

  window.location.href = 'quiz.html';
}

// Logout and clear user data
function clearSession() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userSession');
    localStorage.removeItem('currentQuizResults');
    window.location.href = 'index.html';
  }
}
