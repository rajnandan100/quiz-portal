// Google Sheets API Integration - api.js

// 🔴 IMPORTANT: Replace this URL with your actual Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6B8oeyy7hVKvc0b_cjnkOawVmdMEicZipWD7j-Q8rMhUZH8wYvywjAceFbulrT8VM/exec';





// =========================================================
// FETCH ALL QUIZZES FROM GOOGLE SHEETS (NEW)
// =========================================================
async function getQuizzesAPI() {
  try {
    console.log('📥 Fetching quizzes from Google Sheets...');
    
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getQuizzes`, {
      method: 'GET',
      redirect: 'follow'
    });
    
    const result = await response.json();
    console.log('📊 Quizzes fetch response:', result);
    
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

// =========================================================
// CREATE QUIZ
// =========================================================
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

// =========================================================
// SUBMIT QUIZ ATTEMPT
// =========================================================
async function submitQuizAPI(attemptData) {
  try {
    console.log('📤 Submitting quiz attempt to Google Sheets...');

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

// =========================================================
// CHECK API STATUS
// =========================================================
async function checkAPIStatus() {
  try {
    console.log('🔍 Checking API connection to:', GOOGLE_APPS_SCRIPT_URL);
    
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

// =========================================================
// SYNC QUIZZES FROM GOOGLE SHEETS (NEW)
// =========================================================
async function syncQuizzesFromGoogleSheets() {
  try {
    console.log('🔄 Syncing quizzes from Google Sheets...');
    const serverQuizzes = await getQuizzesAPI();
    
    if (serverQuizzes && serverQuizzes.length > 0) {
      // Merge with local quizzes
      const localQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      
      // Create a map to avoid duplicates
      const quizMap = new Map();
      
      // Add server quizzes first (they are authoritative)
      serverQuizzes.forEach(quiz => {
        quizMap.set(quiz.quizId, quiz);
      });
      
      // Add local quizzes that don't exist on server
      localQuizzes.forEach(quiz => {
        if (!quizMap.has(quiz.quizId)) {
          quizMap.set(quiz.quizId, quiz);
        }
      });
      
      // Save merged quizzes
      const mergedQuizzes = Array.from(quizMap.values());
      localStorage.setItem('quizzes', JSON.stringify(mergedQuizzes));
      
      console.log(`✅ Synced ${serverQuizzes.length} quizzes from server`);
      console.log(`📊 Total quizzes after merge: ${mergedQuizzes.length}`);
      return true;
    }
    
    console.log('⚠️ No quizzes found on server');
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
  checkStatus: checkAPIStatus,
  sync: syncQuizzesFromGoogleSheets
};

// Auto-check connection on page load
window.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 QuizAPI Loaded');
  
  if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID_HERE')) {
    console.warn('⚠️ IMPORTANT: Please configure your Google Apps Script URL in api.js');
  } else {
    checkAPIStatus().then(isConnected => {
      if (isConnected) {
        console.log('✅ Google Sheets API is READY');
        // Auto-sync quizzes
        syncQuizzesFromGoogleSheets();
      } else {
        console.warn('⚠️ Google Sheets API is not responding');
      }
    });
  }
});
