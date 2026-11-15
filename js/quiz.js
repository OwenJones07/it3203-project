/* quiz.js - logic for the IT self-assessment quiz (Milestone 2) */

/* ---------- Settings ---------- */
// The quiz is limited to 10 minutes, stored in seconds.
const TIME_LIMIT_SECONDS = 10 * 60;

// Percent needed to pass.
const PASS_PERCENT = 70;

/* ---------- Answer key ----------
   One object per question.
   type:        "text" (fill-in-the-blank), "single" (radio), or "multi" (checkboxes)
   answers:     the accepted answers, all lowercase. Text questions can accept several variations.
   display:     the correct answer in readable form, shown on the results screen
   explanation: one sentence shown after submission */
const questions = [
  {
    id: "q1", type: "text", answers: ["infrastructure"],
    display: "Infrastructure",
    explanation: "Infrastructure is the set of systems IT professionals manage so an organization can function."
  },
  {
    id: "q2", type: "text", answers: ["deployment"],
    display: "Deployment",
    explanation: "Deployment is a practical IT task: setting up software or systems so users can use them."
  },
  {
    id: "q3", type: "text", answers: ["machinery"],
    display: "Machinery",
    explanation: "The ACM is the professional society that describes the computing disciplines."
  },
  {
    id: "q4", type: "single", answers: ["b"],
    display: "Computer Science",
    explanation: "CS emphasizes the principles of computation, such as algorithms and data structures."
  },
  {
    id: "q5", type: "single", answers: ["c"],
    display: "Computer Engineering",
    explanation: "Computer engineers design processors, embedded systems, and computer systems."
  },
  {
    id: "q6", type: "single", answers: ["a"],
    display: "Analyzing stored data to predict customer behavior",
    explanation: "Data Science extracts insights from data, while IT keeps the database available and secure."
  },
  {
    id: "q7", type: "single", answers: ["c"],
    display: "Implementing, managing, and supporting technology in real-world environments",
    explanation: "IT is the practical field of making technology work for people and organizations."
  },
  {
    id: "q8", type: "multi", answers: ["a", "b", "d"],
    display: "Networks, Cybersecurity, Databases",
    explanation: "These are all IT areas. Processor design belongs to Computer Engineering."
  },
  {
    id: "q9", type: "multi", answers: ["a", "c"],
    display: "Troubleshooting hardware and software problems; Configuring computers for users",
    explanation: "Troubleshooting and configuring systems are core IT work. Algorithms are CS and embedded hardware is CE."
  },
  {
    id: "q10", type: "single", answers: ["false"],
    display: "False",
    explanation: "The site presents these fields as pieces of one connected computing ecosystem."
  }
];

/* ---------- Page elements ---------- */
const form = document.getElementById("quiz-form");
const timeLeftEl = document.getElementById("time-left");
const resultsSection = document.getElementById("results");
const resultStatusEl = document.getElementById("result-status");
const totalScoreEl = document.getElementById("total-score");
const timeSpentEl = document.getElementById("time-spent");
const resultsListEl = document.getElementById("results-list");

/* ---------- Timer ---------- */
const startTime = Date.now();   // when the page loaded, used to measure time spent
let timerId = null;             // holds the interval so we can stop it later
let submitted = false;          // prevents grading twice (manual submit + timer running out)

// Turns a number of seconds into text like "9:05".
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ":" + String(seconds).padStart(2, "0");
}

// Runs once per second: updates the display and auto-submits at zero.
function tick() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = Math.max(TIME_LIMIT_SECONDS - elapsed, 0);
  timeLeftEl.textContent = formatTime(remaining);

  if (remaining === 0) {
    submitQuiz();
  }
}

timerId = setInterval(tick, 1000);

/* ---------- Grading helpers ---------- */

// Reads what the user entered for one question.
// Text: the typed string (trimmed, lowercase). Radio: the chosen value or "". Checkboxes: an array of values.
function getUserAnswer(q) {
  if (q.type === "text") {
    return form.elements[q.id].value.trim().toLowerCase();
  }
  const checked = form.querySelectorAll('input[name="' + q.id + '"]:checked');
  if (q.type === "single") {
    return checked.length > 0 ? checked[0].value : "";
  }
  return Array.from(checked).map(function (box) { return box.value; });
}

// Returns true if the user's answer matches the key.
function isCorrect(q, userAnswer) {
  if (q.type === "multi") {
    // Must pick every correct box and nothing else (all-or-nothing).
    return userAnswer.length === q.answers.length &&
           userAnswer.every(function (v) { return q.answers.includes(v); });
  }
  return q.answers.includes(userAnswer);
}

// Builds readable text for what the user picked, for the results screen.
function describeUserAnswer(q) {
  if (q.type === "text") {
    const typed = form.elements[q.id].value.trim();
    return typed === "" ? "(left blank)" : typed;
  }
  const checked = form.querySelectorAll('input[name="' + q.id + '"]:checked');
  if (checked.length === 0) return "(no answer)";
  return Array.from(checked).map(function (input) {
    return input.parentElement.textContent.trim();   // the label text next to the input
  }).join("; ");
}

/* ---------- Submitting ---------- */
function submitQuiz() {
  if (submitted) return;        // ignore repeat calls
  submitted = true;
  clearInterval(timerId);       // stop the countdown

  const secondsSpent = Math.min(
    Math.floor((Date.now() - startTime) / 1000),
    TIME_LIMIT_SECONDS
  );

  // Grade every question, 1 point each.
  let score = 0;
  resultsListEl.innerHTML = "";   // clear any old results

  questions.forEach(function (q, index) {
    const correct = isCorrect(q, getUserAnswer(q));
    if (correct) score++;

    // Build one result card for this question.
    const item = document.createElement("div");
    item.className = "result-item " + (correct ? "correct" : "incorrect");

    const heading = document.createElement("strong");
    heading.textContent = "Question " + (index + 1) + ": " +
      (correct ? "Correct (1/1)" : "Incorrect (0/1)");

    const yours = document.createElement("p");
    yours.textContent = "Your answer: " + describeUserAnswer(q);

    const right = document.createElement("p");
    right.textContent = "Correct answer: " + q.display;

    const why = document.createElement("p");
    why.textContent = q.explanation;

    item.append(heading, yours, right, why);
    resultsListEl.appendChild(item);
  });

  // Overall result.
  const percent = Math.round((score / questions.length) * 100);
  const passed = percent >= PASS_PERCENT;

  resultStatusEl.textContent = passed ? "PASS" : "FAIL";
  resultStatusEl.className = passed ? "correct" : "incorrect";
  totalScoreEl.textContent = score + " / " + questions.length + " (" + percent + "%)";
  timeSpentEl.textContent = formatTime(secondsSpent);

  // Lock the inputs so answers can't change after grading (Step 6 unlocks them on reset).
  Array.from(form.elements).forEach(function (el) {
    if (el.id !== "reset-btn") el.disabled = true;
  });

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

// The form's submit event fires when the Submit button is clicked.
form.addEventListener("submit", function (event) {
  event.preventDefault();       // stop the browser from reloading the page
  submitQuiz();
});