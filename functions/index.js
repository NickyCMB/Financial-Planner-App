// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
const db = admin.firestore();

const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Make sure you've replaced this!

exports.exportToSheet = functions.region("europe-west1").https.onCall(async (_data, _context) => {
  const transactionsSnapshot = await db.collection("transactions").orderBy("createdAt", "asc").get();

  if (transactionsSnapshot.empty) {
    return { success: true, message: "No transactions to export." };
  }

  const transactionsData = transactionsSnapshot.docs.map((doc) => {
    const transaction = doc.data();
    const date = transaction.createdAt.toDate().toLocaleDateString("de-DE");
    return [
      date,
      transaction.description,
      transaction.type,
      transaction.amount,
    ];
  });

  const exportData = [
    ["Datum", "Beschreibung", "Typ", "Betrag"],
    ...transactionsData,
  ];

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1",
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: exportData,
      },
    });

    return { success: true, message: "Data exported successfully!" };
  } catch (error) {
    console.error("Error exporting to Google Sheets:", error);
    throw new functions.https.HttpsError("internal", "Unable to export data.", error);
  }
});