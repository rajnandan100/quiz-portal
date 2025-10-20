// Google Sheets API Integration - api.js

// 🔴 IMPORTANT: Replace this URL with your actual Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxULL-mg_1ReWo5RlOB3ux1oyJKo4ABMnyMaEQHssXm_SfO05SP-KjsMRMJzEIpxafp/exec';

// =========================================================
// API FUNCTIONS
// =========================================================

/**
 * Create a new quiz in Google Sheets
 */
async function createQuizAPI(quizData) {
  try {
    console.log('📤 Sending quiz to Google Sheets...', quizData);

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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      redirect: 'follow'
    });

    const result = await response.json();
    console.log('✅ Quiz API Response:', result);

    if (result.status === 'success') {
      return { status: 'success', data: result.data };
    } else {
      throw new Error(result.message || 'Failed to create quiz');
    }
  } catch (err) {
    console.error('❌ Create Quiz API Error:', err);
    throw err;
  }
}

/**
 * Submit a quiz attempt to Google Sheets
 */
async function submitQuizAPI(attemptData) {
  try {
    console.log('📤 Submitting quiz attempt to Google Sheets...', attemptData);

    const formData = new URLSearchParams({
      action: 'submitQuiz',
      quizId: attemptData.quizId,
      userName: attemptData.userName,
      email: attemptData.email,
      answersJson: attemptData.answersJson,
      score: attemptData.score,
      percentage: attemptData.percentage,
      timeTaken: attemptData.timeTaken,
      attemptDate: attemptData.attemptDate
    });

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      redirect: 'follow'
    });

    const result = await response.json();
    console.log('✅ Submit Quiz API Response:', result);

    if (result.status === 'success') {
      return { status: 'success', data: result.data };
    } else {
      throw new Error(result.message || 'Failed to submit quiz');
    }
  } catch (err) {
    console.error('❌ Submit Quiz API Error:', err);
    throw err;
  }
}

/**
 * Fetch all available quizzes from Google Sheets
 */
async function getQuizzesAPI(filters = {}) {
  try {
    const params = new URLSearchParams({ 
      action: 'getQuizzes', 
      ...filters 
    });
    
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      redirect: 'follow'
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      return result.data.quizzes || [];
    } else {
      throw new Error(result.message || 'Failed to fetch quizzes');
    }
  } catch (err) {
    console.error('❌ Get Quizzes API Error:', err);
    return [];
  }
}

/**
 * Fetch leaderboard data from Google Sheets
 */
async function getLeaderboardAPI(quizId = 'all') {
  try {
    const params = new URLSearchParams({ 
      action: 'getLeaderboard', 
      quizId 
    });
    
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      redirect: 'follow'
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      return result.data.leaderboard || [];
    } else {
      throw new Error(result.message || 'Failed to fetch leaderboard');
    }
  } catch (err) {
    console.error('❌ Get Leaderboard API Error:', err);
    return [];
  }
}

/**
 * Check if API is accessible
 */
async function checkAPIStatus() {
  try {
    console.log('🔍 Checking API connection to:', GOOGLE_APPS_SCRIPT_URL);
    
    // Check if URL is configured
    if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID_HERE')) {
      console.error('❌ Google Apps Script URL not configured!');
      return false;
    }

    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=ping`, {
      method: 'GET',
      redirect: 'follow'
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Status Check:', result);
      return true;
    } else {
      console.error('❌ API returned non-OK status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
}

/**
 * Sync local quizzes with Google Sheets
 */
async function syncQuizzesFromGoogleSheets() {
  try {
    const serverData = await getQuizzesAPI();
    if (serverData && serverData.length > 0) {
      localStorage.setItem('quizzes', JSON.stringify(serverData));
      console.log('✅ Synced quizzes from Google Sheets');
      return true;
    }
    return false;
  } catch (e) {
    console.warn('⚠️ Could not sync from Google Sheets:', e.message);
    return false;
  }
}

// =========================================================
// EXPORT API OBJECT
// =========================================================

window.QuizAPI = {
  createQuiz: createQuizAPI,
  submitQuiz: submitQuizAPI,
  getQuizzes: getQuizzesAPI,
  getLeaderboard: getLeaderboardAPI,
  checkStatus: checkAPIStatus,
  sync: syncQuizzesFromGoogleSheets
};

// Auto-check connection on page load
window.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 QuizAPI Loaded');
  
  // Check if URL is configured
  if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID_HERE')) {
    console.warn('⚠️ IMPORTANT: Please configure your Google Apps Script URL in api.js');
    console.warn('📝 Edit js/api.js and replace YOUR_DEPLOYMENT_ID_HERE with your actual deployment ID');
  } else {
    // Check connection status
    checkAPIStatus().then(isConnected => {
      if (isConnected) {
        console.log('✅ Google Sheets API is READY');
      } else {
        console.warn('⚠️ Google Sheets API is not responding. Data will be saved locally only.');
      }
    });
  }
});
