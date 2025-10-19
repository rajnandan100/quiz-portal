// Quiz Logic - quiz.js

let currentQuestion = 0;
let quizData = null;
let userAnswers = {};
let markedForReview = new Set();
let timer = null;
let timeRemaining = 0;
let autoSaveInterval = null;

window.addEventListener("DOMContentLoaded", () => {
  loadQuiz();
});

function loadQuiz() {
  const session = JSON.parse(localStorage.getItem("userSession") || "{}");
  if (!session.currentQuizId) {
    alert("No quiz selected. Redirecting to home.");
    window.location.href = "index.html";
    return;
  }

  const quizzes = JSON.parse(localStorage.getItem("quizzes") || "[]");
  quizData = quizzes.find((q) => q.quizId === session.currentQuizId);

  if (!quizData) {
    alert("Quiz data not found. Redirecting to home.");
    window.location.href = "index.html";
    return;
  }

  localStorage.setItem("currentQuiz", JSON.stringify(quizData));
  document.getElementById("userName").textContent = session.userName;
  document.getElementById("subjectName").textContent = quizData.subject;
  document.getElementById("totalQuestions").textContent = quizData.totalQuestions;

  // Initialize state from saved quizState if any
  const savedState = JSON.parse(localStorage.getItem(`quizState_${quizData.quizId}`) || "{}");
  if (savedState && savedState.quizId === quizData.quizId) {
    currentQuestion = savedState.currentQuestion || 0;
    userAnswers = savedState.userAnswers || {};
    markedForReview = new Set(savedState.markedForReview || []);
    timeRemaining = savedState.timeRemaining || quizData.timeLimit;
  } else {
    currentQuestion = 0;
    userAnswers = {};
    markedForReview = new Set();
    timeRemaining = quizData.timeLimit;
  }

  startTimer();
  generateQuestionPalette();
  loadQuestion(currentQuestion);
  setupAutoSave();
  setupEventListeners();
}

function startTimer() {
  updateTimerDisplay();
  timer = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining === 300) {
      // 5 minutes warning (optional)
    }
    if (timeRemaining === 120) {
      showTimeWarning();
    }
    if (timeRemaining <= 0) {
      clearInterval(timer);
      autoSubmitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerEl = document.getElementById("timer");
  timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (timeRemaining <= 120) {
    timerEl.classList.remove("bg-success");
    timerEl.classList.add("bg-danger");
  } else if (timeRemaining <= 300) {
    timerEl.classList.remove("bg-success");
    timerEl.classList.add("bg-warning");
  } else {
    timerEl.classList.remove("bg-warning", "bg-danger");
    timerEl.classList.add("bg-success");
  }
}

function showTimeWarning() {
  let modal = new bootstrap.Modal(document.getElementById("timeWarningModal"));
  modal.show();
}

function generateQuestionPalette() {
  const container = document.getElementById("questionNumbers");
  container.innerHTML = "";
  for (let i = 0; i < quizData.totalQuestions; i++) {
    const btn = document.createElement("button");
    btn.className = "question-num-btn";
    btn.textContent = i + 1;
    btn.onclick = () => loadQuestion(i);
    container.appendChild(btn);
  }
}

function loadQuestion(index) {
  if (index < 0 || index >= quizData.totalQuestions) return;
  currentQuestion = index;
  const question = quizData.questions[index];

  document.getElementById("currentQuestionIndex").textContent = index + 1;
  const questionTextEl = document.getElementById("questionText");
  questionTextEl.innerHTML = `<p>${question.question}</p>`;

  const optionsContainer = document.getElementById("optionsContainer");
  optionsContainer.innerHTML = "";
  question.options.forEach((option, idx) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option-item";
    if (userAnswers[index] === idx) optionDiv.classList.add("selected");

    const radioInput = document.createElement("input");
    radioInput.type = "radio";
    radioInput.name = "answer";
    radioInput.value = idx;
    radioInput.id = `option${idx}`;
    radioInput.checked = userAnswers[index] === idx;
    radioInput.style.marginRight = "12px";
    radioInput.onchange = () => {
      userAnswers[currentQuestion] = idx;
      updateQuestionPalette();
      updateProgress();
    };

    const label = document.createElement("label");
    label.htmlFor = `option${idx}`;
    label.textContent = `${String.fromCharCode(65 + idx)}. ${option}`;

    optionDiv.appendChild(radioInput);
    optionDiv.appendChild(label);

    optionsContainer.appendChild(optionDiv);
  });

  // Update mark for review button
  const markBtn = document.getElementById("markForReviewBtn");
  if (markedForReview.has(index)) {
    markBtn.classList.add("active");
    markBtn.innerHTML = `<i class="fas fa-flag me-1"></i>Marked`;
  } else {
    markBtn.classList.remove("active");
    markBtn.innerHTML = `<i class="fas fa-flag me-1"></i>Mark for Review`;
  }

  updateQuestionPalette();
  updateProgress();

  // Disable/enable prev & next buttons
  document.getElementById("prevBtn").disabled = index === 0;
  document.getElementById("nextBtn").disabled = index === quizData.totalQuestions - 1;
}

function updateQuestionPalette() {
  const buttons = document.querySelectorAll(".question-num-btn");
  buttons.forEach((btn, idx) => {
    btn.classList.remove("current", "answered", "marked", "not-visited");
    if (idx === currentQuestion) btn.classList.add("current");
    else if (markedForReview.has(idx)) btn.classList.add("marked");
    else if (userAnswers[idx] !== undefined) btn.classList.add("answered");
    else btn.classList.add("not-visited");
  });
}

function updateProgress() {
  const answeredCount = Object.keys(userAnswers).length;
  const percent = ((answeredCount / quizData.totalQuestions) * 100).toFixed(0);
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${percent}%`;
}

function setupEventListeners() {
  document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentQuestion > 0) loadQuestion(currentQuestion - 1);
  });
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentQuestion < quizData.totalQuestions - 1) loadQuestion(currentQuestion + 1);
  });
  document.getElementById("saveNextBtn").addEventListener("click", () => {
    saveCurrentAnswer();
    if (currentQuestion < quizData.totalQuestions - 1) loadQuestion(currentQuestion + 1);
  });
  document.getElementById("markForReviewBtn").addEventListener("click", () => {
    if (markedForReview.has(currentQuestion)) markedForReview.delete(currentQuestion);
    else markedForReview.add(currentQuestion);
    loadQuestion(currentQuestion);
  });
  document.getElementById("clearResponseBtn").addEventListener("click", () => {
    delete userAnswers[currentQuestion];
    loadQuestion(currentQuestion);
  });
  document.getElementById("submitQuizBtn").addEventListener("click", showSubmitConfirm);
  document.getElementById("confirmSubmitBtn").addEventListener("click", submitQuiz);
}

function saveCurrentAnswer() {
  const selected = document.querySelector('input[name="answer"]:checked');
  if (selected) userAnswers[currentQuestion] = parseInt(selected.value);
}

function setupAutoSave() {
  autoSaveInterval = setInterval(() => {
    saveQuizState();
  }, 5000);
}

function saveQuizState() {
  const state = {
    quizId: quizData.quizId,
    currentQuestion,
    userAnswers,
    markedForReview: Array.from(markedForReview),
    timeRemaining,
  };
  localStorage.setItem(`quizState_${quizData.quizId}`, JSON.stringify(state));
}

function showSubmitConfirm() {
  const answered = Object.keys(userAnswers).length;
  const marked = markedForReview.size;
  const notVisited = quizData.totalQuestions - answered;
  document.getElementById("answeredCount").textContent = answered;
  document.getElementById("markedCount").textContent = marked;
  document.getElementById("notVisitedCount").textContent = notVisited;

  new bootstrap.Modal(document.getElementById("confirmSubmitModal")).show();
}

function submitQuiz() {
  clearInterval(timer);
  clearInterval(autoSaveInterval);

  saveCurrentAnswer();

  const correct = quizData.questions.reduce((acc, q, i) => {
    if (userAnswers[i] === q.correctAnswer) return acc + 1;
    return acc;
  }, 0);

  const incorrect = quizData.totalQuestions - Object.keys(userAnswers).length + (Object.keys(userAnswers).length - correct);
  const unattempted = quizData.totalQuestions - Object.keys(userAnswers).length;

  const results = {
    quizId: quizData.quizId,
    total: quizData.totalQuestions,
    correct,
    incorrect,
    unattempted,
    score: correct,
    percentage: (correct / quizData.totalQuestions) * 100,
    timeTaken: formatTime(quizData.timeLimit - timeRemaining),
    answers: userAnswers,
    date: new Date().toISOString().split('T')[0],
  };

  localStorage.setItem('currentQuizResults', JSON.stringify(results));

  // Add user attempt (for leaderboard and retry purposes)
  const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
  const session = JSON.parse(localStorage.getItem('userSession') || '{}');
  attempts.push({
    attemptId: `attempt_${Date.now()}`,
    quizId: results.quizId,
    userName: session.userName,
    email: session.email,
    score: results.score,
    total: results.total,
    accuracy: results.percentage,
    time: results.timeTaken,
    date: results.date,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem('quizAttempts', JSON.stringify(attempts));

  // Clear quiz saved state
  localStorage.removeItem(`quizState_${quizData.quizId}`);
  // Navigate to results page
  window.location.href = 'results.html';
}

function autoSubmitQuiz() {
  Swal.fire({
    title: 'Time is up!',
    text: 'Your quiz will be submitted automatically.',
    icon: 'warning',
    timer: 3000,
    showConfirmButton: false,
  }).then(() => {
    submitQuiz();
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Warn user when trying to leave page during quiz
window.addEventListener('beforeunload', (e) => {
  if (timer) {
    e.preventDefault();
    e.returnValue = '';
  }
});
