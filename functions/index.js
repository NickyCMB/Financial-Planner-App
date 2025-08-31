// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");
// NEW: Import the date-fns library
const { subMonths, format } = require("date-fns");

admin.initializeApp();
const db = admin.firestore();

// This is our original exportToSheet function (optional, can be deleted if you don't need it)
exports.exportToSheet = functions.region("europe-west1").https.onCall(async (_data, _context) => {
  // ... (existing exportToSheet code)
});

// --- NEW FUNCTION: calculateMonthlySummary ---
exports.calculateMonthlySummary = functions.region("europe-west1").https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const monthStr = data.month; // e.g., "2025-08"
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a valid month string 'YYYY-MM'.");
  }

  // --- 1. Get the previous month's closing balance ---
  const [year, month] = monthStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1);
  const previousMonthDate = subMonths(targetDate, 1);
  const previousMonthStr = format(previousMonthDate, "yyyy-MM");

  let openingBalance = 0;
  const prevMonthSummaryDoc = await db.collection("monthlySummaries").doc(previousMonthStr).get();
  if (prevMonthSummaryDoc.exists) {
    openingBalance = prevMonthSummaryDoc.data().closingBalance;
  }

  // --- 2. Calculate income and expense for the target month ---
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const transactionsSnapshot = await db.collection("transactions")
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<", endDate)
    .get();
  
  let totalIncome = 0;
  let totalExpense = 0;
  transactionsSnapshot.forEach((doc) => {
    const transaction = doc.data();
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    } else {
      totalExpense += transaction.amount;
    }
  });

  // --- 3. Calculate and save the new summary ---
  const closingBalance = openingBalance + totalIncome - totalExpense;

  const summaryData = {
    month: monthStr,
    openingBalance,
    totalIncome,
    totalExpense,
    closingBalance,
    calculatedAt: new Date(),
  };

  await db.collection("monthlySummaries").doc(monthStr).set(summaryData);

  return { success: true, message: `Summary for ${monthStr} calculated successfully.`, summary: summaryData };
});