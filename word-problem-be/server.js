const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ==================== IN-MEMORY DATA STORAGE ====================

// In-memory data stores
let problems = [
  {
    _id: "68dd3fb4e6adc62510431120",
    title: "Apple Basket",
    story: "Sarah has 5 apples in her basket. Her friend gives her 3 more apples. How many apples does Sarah have now?",
    difficulty: "easy",
    correctAnswer: 8,
    steps: [
      "Start with 5 apples",
      "Add 3 more apples",
      "5 + 3 = 8 apples total"
    ],
    visualType: "apples",
    initialCount: 5,
    addCount: 3,
    operation: "addition",
    createdAt: new Date("2025-10-01T14:50:28.568Z")
  },
  {
    _id: "68dd3fb4e6adc62510431121",
    title: "Cookie Jar",
    story: "Mom baked 12 cookies. The family ate 7 cookies. How many cookies are left in the jar?",
    difficulty: "easy",
    correctAnswer: 5,
    steps: [
      "Start with 12 cookies",
      "Subtract 7 cookies that were eaten",
      "12 - 7 = 5 cookies remaining"
    ],
    visualType: "cookies",
    initialCount: 12,
    removeCount: 7,
    operation: "subtraction",
    createdAt: new Date("2025-10-01T14:50:28.573Z")
  },
  {
    _id: "68dd3fb4e6adc62510431122",
    title: "Toy Cars",
    story: "Tim has 4 toy cars. He gets 2 cars for his birthday and 3 more from his grandma. How many toy cars does Tim have in total?",
    difficulty: "medium",
    correctAnswer: 9,
    steps: [
      "Start with 4 toy cars",
      "Add 2 cars from birthday",
      "Add 3 cars from grandma",
      "4 + 2 + 3 = 9 toy cars"
    ],
    visualType: "cars",
    initialCount: 4,
    addCount: 5,
    operation: "addition",
    createdAt: new Date("2025-10-01T14:50:28.575Z")
  },
  {
    _id: "68dd3fb4e6adc62510431123",
    title: "Gift Boxes",
    story: "Emma wrapped 15 gift boxes. She gave away 6 boxes to her friends and 4 boxes to her family. How many gift boxes does she have left?",
    difficulty: "medium",
    correctAnswer: 5,
    steps: [
      "Start with 15 gift boxes",
      "Subtract 6 boxes given to friends",
      "Subtract 4 boxes given to family",
      "15 - 6 - 4 = 5 gift boxes left"
    ],
    visualType: "gifts",
    initialCount: 15,
    removeCount: 10,
    operation: "subtraction",
    createdAt: new Date("2025-10-01T14:50:28.576Z")
  }
];

let progressData = [];
let submissions = [];

// Helper function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== ROUTES ====================

// 1. Get all problems
app.get('/api/problems', (req, res) => {
  try {
    const sortedProblems = [...problems].sort((a, b) => {
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
    res.json({ success: true, data: sortedProblems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get single problem by ID
app.get('/api/problems/:id', (req, res) => {
  try {
    const problem = problems.find(p => p._id === req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }
    res.json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Create new problem (for teachers)
app.post('/api/problems', (req, res) => {
  try {
    const newProblem = {
      _id: generateId(),
      ...req.body,
      createdAt: new Date()
    };
    problems.push(newProblem);
    res.status(201).json({ success: true, data: newProblem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Submit answer - MAIN LOGIC FOR VERIFICATION
app.post('/api/submit', (req, res) => {
  try {
    const { problemId, userAnswer, userId, timeTaken } = req.body;

    // Parse the answer
    const parsedAnswer = parseInt(userAnswer);
    
    if (isNaN(parsedAnswer)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid answer format. Please enter a number.' 
      });
    }

    // Get the problem
    const problem = problems.find(p => p._id === problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    // Verify correctness
    const isCorrect = parsedAnswer === problem.correctAnswer;

    // Calculate detailed feedback
    const feedback = {
      isCorrect,
      userAnswer: parsedAnswer,
      correctAnswer: problem.correctAnswer,
      difference: Math.abs(parsedAnswer - problem.correctAnswer),
      steps: problem.steps,
      explanation: generateExplanation(problem, parsedAnswer, isCorrect)
    };

    // Save submission
    const submission = {
      _id: generateId(),
      userId,
      problemId,
      userAnswer: parsedAnswer,
      isCorrect,
      timeTaken,
      timestamp: new Date()
    };
    submissions.push(submission);

    // Update user progress
    let progress = progressData.find(p => p.userId === userId && p.problemId === problemId);
    if (progress) {
      progress.attempts += 1;
      if (isCorrect) {
        progress.correctAttempts += 1;
        progress.totalScore += 10;
      }
      progress.lastAttempt = new Date();
    } else {
      progress = {
        _id: generateId(),
        userId,
        problemId,
        attempts: 1,
        correctAttempts: isCorrect ? 1 : 0,
        totalScore: isCorrect ? 10 : 0,
        lastAttempt: new Date()
      };
      progressData.push(progress);
    }

    res.json({ 
      success: true, 
      data: feedback,
      score: progress.totalScore 
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get user progress
app.get('/api/progress/:userId', (req, res) => {
  try {
    const userProgress = progressData.filter(p => p.userId === req.params.userId);
    
    // Populate problem details
    const populatedProgress = userProgress.map(p => ({
      ...p,
      problemId: problems.find(prob => prob._id === p.problemId)
    }));
    
    const totalScore = userProgress.reduce((sum, p) => sum + p.totalScore, 0);
    const totalAttempts = userProgress.reduce((sum, p) => sum + p.attempts, 0);
    const totalCorrect = userProgress.reduce((sum, p) => sum + p.correctAttempts, 0);
    
    res.json({ 
      success: true, 
      data: {
        progress: populatedProgress,
        stats: {
          totalScore,
          totalAttempts,
          totalCorrect,
          accuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Get step-by-step explanation
app.get('/api/explain/:problemId', (req, res) => {
  try {
    const problem = problems.find(p => p._id === req.params.problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Problem not found' });
    }

    const detailedExplanation = {
      steps: problem.steps,
      visualization: generateVisualization(problem),
      hints: generateHints(problem),
      relatedConcepts: getRelatedConcepts(problem)
    };

    res.json({ success: true, data: detailedExplanation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    // Group by userId
    const userStats = {};
    
    progressData.forEach(p => {
      if (!userStats[p.userId]) {
        userStats[p.userId] = {
          _id: p.userId,
          totalScore: 0,
          totalCorrect: 0,
          totalAttempts: 0
        };
      }
      userStats[p.userId].totalScore += p.totalScore;
      userStats[p.userId].totalCorrect += p.correctAttempts;
      userStats[p.userId].totalAttempts += p.attempts;
    });

    // Convert to array and sort
    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

function generateExplanation(problem, userAnswer, isCorrect) {
  if (isCorrect) {
    return {
      message: "Perfect! You got it right! 🎉",
      reasoning: `You correctly calculated that ${problem.correctAnswer} is the answer.`,
      encouragement: "Great job! Keep up the excellent work!"
    };
  } else {
    const diff = userAnswer - problem.correctAnswer;
    let hint = '';
    
    if (diff > 0) {
      hint = `Your answer is ${diff} too high. Try counting more carefully!`;
    } else {
      hint = `Your answer is ${Math.abs(diff)} too low. Did you count everything?`;
    }

    return {
      message: "Not quite right, but don't give up! 💪",
      reasoning: hint,
      encouragement: "Review the steps and try again. You can do it!"
    };
  }
}

function generateVisualization(problem) {
  return {
    type: problem.visualType,
    initialCount: problem.initialCount,
    operation: problem.addCount ? 'add' : 'subtract',
    changeCount: problem.addCount || problem.removeCount || 0,
    finalCount: problem.correctAnswer
  };
}

function generateHints(problem) {
  const hints = [];
  
  if (problem.addCount) {
    hints.push(`Start by counting the initial ${problem.visualType}`);
    hints.push(`Then add the new ${problem.visualType} one by one`);
    hints.push(`Count the total at the end`);
  } else if (problem.removeCount) {
    hints.push(`Begin with the total ${problem.visualType}`);
    hints.push(`Remove the ${problem.visualType} that are taken away`);
    hints.push(`Count what remains`);
  }
  
  return hints;
}

function getRelatedConcepts(problem) {
  const concepts = ['Addition', 'Subtraction', 'Counting'];
  
  if (problem.difficulty === 'medium' || problem.difficulty === 'hard') {
    concepts.push('Multi-step Problems', 'Mental Math');
  }
  
  return concepts;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Using in-memory storage with ${problems.length} problems loaded`);
});

module.exports = app;