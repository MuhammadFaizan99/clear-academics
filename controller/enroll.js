const { google } = require("googleapis");

// Function to create an OAuth2 client with the provided credentials
const createOAuth2Client = (credentials) => {
  const { client_id, client_secret, redirect_uris } = credentials;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
};

// Function to set the refresh token for OAuth2 client
const authorizeOAuth2ClientWithRefreshToken = (oauth2Client, refresh_token) => {
  oauth2Client.setCredentials({
    refresh_token: refresh_token,
  });

  return oauth2Client;
};

const sendEmail = async (auth, emailContent, recipientEmail) => {
  const gmail = google.gmail({ version: "v1", auth });

  const raw = Buffer.from(
    `From: ${process.env.SENDER_EMAIL}\r\nTo: ${recipientEmail}\r\nSubject: Enrollment Submission\r\n\r\n${emailContent}`
  ).toString("base64");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: raw,
    },
  });
};

const createEnrollment = async (req, res) => {
  const enrollmentData = req.body;

  try {
    const credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [process.env.GOOGLE_REDIRECT_URI],
    };

    const oauth2Client = createOAuth2Client(credentials);

    const auth = authorizeOAuth2ClientWithRefreshToken(
      oauth2Client,
      process.env.GOOGLE_REFRESH_TOKEN
    );

    const recipientEmail =
      enrollmentData.parentEmail || process.env.RECIEVER_EMAIL;

    const emailContent = getEmailContent(enrollmentData);

    await sendEmail(auth, emailContent, recipientEmail);

    res.status(200).json({ message: "Enrollment submitted successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};

const refreshAccessToken = async () => {
  try {
    const credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [process.env.GOOGLE_REDIRECT_URI],
    };

    const oauth2Client = createOAuth2Client(credentials);

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const { credentials: newCredentials } =
      await oauth2Client.refreshAccessToken();

    console.log(
      "Access token refreshed successfully!",
      newCredentials.access_token
    );
  } catch (error) {
    console.error("Error refreshing access token:", error);
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

module.exports = { createEnrollment, refreshAccessToken };
