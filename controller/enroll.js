const { google } = require("googleapis");

// Function to create an OAuth2 client with the provided credentials
const createOAuth2Client = (credentials) => {
  const { client_id, client_secret, redirect_uris } = credentials;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
};

// Function to authorize OAuth2 client with provided token
const authorizeOAuth2Client = (oauth2Client, token) => {
  oauth2Client.setCredentials(token);
  return oauth2Client;
};

// Function to send an email using the Gmail API
const sendEmail = async (auth, emailContent) => {
  const gmail = google.gmail({ version: "v1", auth });

  const raw = Buffer.from(
    `From: faf2001f@gmail.com\r\nTo: yassinemijane@gmail.com\r\nSubject: Enrollment Submission\r\n\r\n${emailContent}`
  ).toString("base64");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: raw,
    },
  });
};

const createEnrollment = async (req, res) => {
  // Parse enrollment data from request body
  const enrollmentData = req.body;

  try {
    // Load credentials from environment variables
    const credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [process.env.GOOGLE_REDIRECT_URI],
    };

    // Create OAuth2 client
    const oauth2Client = createOAuth2Client(credentials);

    // Authorize OAuth2 client with provided token
    const token = {
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      scope: process.env.GOOGLE_SCOPE,
      token_type: "Bearer",
      expiry_date: process.env.GOOGLE_EXPIRY_DATE,
    };
    const auth = authorizeOAuth2Client(oauth2Client, token);

    // Prepare email content based on enrollment data
    const emailContent = getEmailContent(enrollmentData);

    // Send email using Gmail API
    await sendEmail(auth, emailContent);

    // Send response to client indicating successful enrollment
    res.status(200).json({ message: "Enrollment submitted successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};

const getEmailContent = (enrollmentData) => {
  const {
    parentFirstName,
    parentLastName,
    parentEmail,
    parentPhone,
    contactTime,
    childFirstName,
    childLastName,
    childDOB,
    schoolLevel,
    schoolName,
    subjects,
    areasOfInterest,
    tutoringGoals,
    parentConsent,
    cancellationPolicy,
    privacyPolicy,
  } = enrollmentData;

  // Prepare email content based on enrollment data
  const subjectList = Array.isArray(subjects) ? subjects.join(", ") : "";
  const emailContent = `
      Dear parent/guardian,
  
      Thank you for enrolling your child with us.
  
      Parent/Guardian Information:
      - First Name: ${parentFirstName}
      - Last Name: ${parentLastName}
      - Email: ${parentEmail}
      - Phone: ${parentPhone}
      - Best Time to Contact: ${contactTime}
  
      Student Information:
      - Child's First Name: ${childFirstName}
      - Child's Last Name: ${childLastName}
      - Child's Date of Birth: ${childDOB}
      - Current School Level: ${schoolLevel}
      - School Name: ${schoolName || "N/A"}
  
      Tutoring Details:
      - Subjects for Tutoring: ${subjectList}
      - Areas of Interest/Difficulty: ${areasOfInterest}
      - Tutoring Goals: ${tutoringGoals}
  
      Consent and Policies:
      - Parent/Guardian Consent: ${parentConsent ? "Yes" : "No"}
      - Cancellation Policy Agreement: ${
        cancellationPolicy ? "Agreed" : "Not agreed"
      }
      - Privacy Policy and Terms of Service Agreement: ${
        privacyPolicy ? "Agreed" : "Not agreed"
      }
  
    `;
  return emailContent;
};

module.exports = { createEnrollment };
