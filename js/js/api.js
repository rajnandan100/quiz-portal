// Google Sheets API Integration for Quiz Portal

// 🔗 Replace this with your actual Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// =========================================================
// API FUNCTIONS
// =========================================================

/**
 * Create a new quiz (Admin upload)
 */
async function createQuizAPI(quizData) {
  try {
    const formData = new URLSearchParams({
      action: 'createQuiz',
      date: quizData.date,
      subject: quizData.subject,
      questionsJson: JSON.stringify(quizData.questions),
      totalQuestions: quizData.totalQuestions,
      timeLimit: quizData.timeLimit
    });

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    const result = await response.json();
    console.log('Quiz Created:', result);
    return result;
  } catch (err) {
    console.error('Error creating quiz:', err);
    return { status: 'error', message: err.message };
  }
}

/**
 * Submit a quiz attempt
 */
async function submitQuizAPI(attemptData) {
  try {
    const formData = new URLSearchParams({
      action: 'submitQuiz',
      quizId: attemptData.quizId,
      userName: attemptData.userName,
      email: attemptData.email,
      answersJson: JSON.stringify(attemptData.answers),
      score: attemptData.score,
      percentage: attemptData.percentage,
      timeTaken: attemptData.timeTaken,
      attemptDate: attemptData.attemptDate
    });

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    const result = await response.json();
    console.log('Attempt Submitted:', result);
    return result;
  } catch (err) {
    console.error('Error submitting quiz:', err);
    return { status: 'error', message: err.message };
  }
}

/**
 * Fetch all available quizzes
 */
async function getQuizzesAPI(filters = {}) {
  const params = new URLSearchParams({ action: 'getQuizzes', ...filters });
  const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`);
  return await response.json();
}

/**
 * Fetch leaderboard data
 */
async function getLeaderboardAPI(quizId = 'all') {
  const params = new URLSearchParams({ action: 'getLeaderboard', quizId });
  const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`);
  return await response.json();
}

// =========================================================
// LOCAL HELPERS
// =========================================================

async function syncQuizzesFromGoogleSheets() {
  try {
    const serverData = await getQuizzesAPI();
    if (serverData.status === 'success') {
      localStorage.setItem('quizzes', JSON.stringify(serverData.data.quizzes || []));
      console.log('Synced quizzes from Google Sheets');
    }
  } catch (e) {
    console.warn('Could not sync from Google Sheets:', e.message);
  }
}

window.QuizAPI = {
  createQuiz: createQuizAPI,
  submitQuiz: submitQuizAPI,
  getQuizzes: getQuizzesAPI,
  getLeaderboard: getLeaderboardAPI,
  sync: syncQuizzesFromGoogleSheets
};
