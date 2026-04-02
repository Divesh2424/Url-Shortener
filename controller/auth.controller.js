// import { sendEmail } from "../lib/send-email.js";
import { sendEmail } from "../lib/gmail-smtp.js";
import {
  getUserByEmail,
  saveData,
  hashingPasswords,
  comparePasswords,
  createSession,
  createAccessToken,
  createRefreshToken,
  clearUserSession,
  authenticateFunc,
  fetchUserById,
  getAllShortLinks,
  generateRandomToken,
  insertVerifyEmailTokenInDb,
  createVerifyEmailLink,
  findVerificationEmailToken,
  verifyUserEmailAndUpdate,
  clearVerifyEmailTokens,
  sendNewVerifyEmail,
  updateUsersTableInDB,
  updatePassInDB,
  createResetPasswordLink,
  getResetPasswordToken,
  clearResetPasswordToken,
  getUserWithOauthId,
  linkUserWithoAuth,
  createUserWithoAuth,
  insertPasswordInUserRecord
} from "../services/auth.services.js";
import { registrationSchema, loginUserSchema, verifyEmailSchema, nameSchema, passwordSchema, verifyPasswordSchema, emailSchema, updateProfileSchema, resetPassEmailSchema, resetPasswordSchema, setPasswordSchema } from "../validators/auth-validators.js";
import { getHTMLFromMjmlTemplate } from "../lib/get-html-from-mjml-template.js";
import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { google } from "../lib/oauth/google.js";
import { github } from "../lib/oauth/github.js";

export const getLoginPage = (req, res) => {
   if(req.user) {
    return res.redirect("/");
  }
  return res.render("auth/login", {
    errors: req.flash("errors")
  });
};

export const getRegistrationPage = (req, res) => {
   if(req.user) {
    return res.redirect("/");
  }
  return res.render("auth/register", {
    errors: req.flash("errors")
  });
};

export const postLogin = async (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  const {data, error} = loginUserSchema.safeParse(req.body);

  if(error) {
    const err = error.issues[0].message;
    req.flash("errors", err);
    return res.redirect("/login");
  }

  const { email, password } = data;

  const user = await getUserByEmail(email);
  if (!user) {
    req.flash("errors", "Invalid email/password")
    res.redirect("/login");
  }
  if(!user.password) {
    req.flash("errors", "You have created account using social login. Please login with your social account!");
    return res.redirect("/login");
  }

  const isPasswordValidate = await comparePasswords(password, user.password);
  if (!isPasswordValidate) {
    req.flash("errors", "Invalid email/password")
    res.redirect("/login");
  }

  await authenticateFunc({req, res, user});

  return res.redirect("/");
};

export const postRegistrationPage = async (req, res) => {
  try {
    if (req.user) {
      return res.redirect("/");
    }
    
    const {data, error} = registrationSchema.safeParse(req.body);

    if(error) {
      const errors = error.issues[0].message;
      req.flash("errors", errors);
      return res.redirect("/registration");
    }
    
    const { name, email, password } = data;

    //to check if data already exists
    const existingUser = await getUserByEmail(email);

    if(existingUser) {
      req.flash("errors", "email already exists");
      return res.redirect("/registration")
    }

    const hashedPassword = await hashingPasswords(password);
    //if not then store it in database
    const newUser = await saveData({ name, email, password: hashedPassword });

    await authenticateFunc({req, res, user: newUser, name, email});

    await sendNewVerifyEmail({email, userId : newUser.id});

    return res.redirect("/login");
  } catch (error) {
    console.error("Error posting registration data", error);
    res.send("Error posting registration data");
  }
};

export const getProfilePage = async (req, res) => {
  if (!req.user) {
    return res.send("Not Logged In");
  }

  const user = await fetchUserById(req.user.id);

  if(!user) return res.redirect("/login"); 

  const userShortLinks = await getAllShortLinks(user.id);

  return res.render("auth/profile", {
    user : {
      id : user.id,
      name : user.name,
      email : user.email,
      isEmailValid : user.isEmailValid,
      hasPassword: Boolean(user.password),
      createdAt : user.createdAt,
      links : userShortLinks
    }
  })
};

export const logoutUser = async (req, res) => {
  await clearUserSession(req.user.sessionId);
  const baseConfig = {httpOnly : true, secure : true}
  res.clearCookie("access_token", baseConfig);
  res.clearCookie("refresh_token", baseConfig);
  return res.redirect("/login");
};

export const getEmailVerificationPage = (req, res) => {
  return res.render("verify-email")
}

export const resendVerificationEmail = async (req, res) => {
  
  await sendNewVerifyEmail({email : req.user.email, userId : req.user.id});

  return res.redirect("/verify-email");
}

export const verifyEmailToken = async (req, res) => {

  const {data, error} = verifyEmailSchema.safeParse(req.query);

  if(error) {
    return res.send("Verification link is invalid/expired");
  }

  const [token] = await findVerificationEmailToken(data);

  if(!token) res.send("Verification link is invalid/expired");

  await verifyUserEmailAndUpdate(token.email);

  await clearVerifyEmailTokens(token.email).catch(console.error);
  
  return res.redirect("/me");
}

export const getEditProfilePage = async (req, res) => {
  const user = await fetchUserById(req.user.id);

  return res.render("auth/edit-profile", {
    name : user.name,
    errors : req.flash("errors")
  });
}

export const postUpdatedProfilePage = async (req, res) => {
    try {
       
    const {data, error} = updateProfileSchema.safeParse(req.body);

    if(error) {
      const err = error.issues[0].message;
      req.flash("errors", err);
      return res.redirect("/edit-profile");
    }

    const user = await fetchUserById(req.user.id);

    await updateUsersTableInDB({userId: user.id, name : data.name});

    return res.redirect("/me");
  } catch (error) {
    console.error("Error updating data", error);
    res.send("Error updating data");
  }
  return res.redirect("/me");
}

export const getChangePassPage = async (req, res) => {
  return res.render("auth/change-pass", {
    errors : req.flash("errors")
  });
}

export const postUpdatedPassword = async (req, res) => {
  const {data, error} = verifyPasswordSchema.safeParse(req.body);

  if(error) {
    const err = error.issues[0].message;
    req.flash("errors", err);
    return res.redirect("/change-password");
  }

  const {currentPassword, newPassword} = data;

  const user = await fetchUserById(req.user.id);
  if(!user) return res.status(404).send("User not found");

  //currentpass ko match krna h 
  const isCurrPassMatched = await comparePasswords(currentPassword, user.password);
  
  if(!isCurrPassMatched) {
    req.flash("errors", {message: "Current Password don't match"});
    return res.redirect("/change-password");
  }

  //if matched then hash new pass and then store it in db
  const hashedNewPassword = await hashingPasswords(newPassword);

  await updatePassInDB({userId: user.id, password: hashedNewPassword});

  return res.redirect("/me");
}

export const getPageToEnterEmailForResetPass = async (req, res) => {
  return res.render("auth/forgot-pass", {
    formSubmitted: req.flash("formSubmitted")[0],
    errors: req.flash("errors")
  })
}

export const sendVerifyEmailForResetPass = async (req, res) => {
  const {data, error} = resetPassEmailSchema.safeParse(req.body);

  if(error) {
    const err = error.issues[0].message;
    req.flash("errors", err);
    return res.redirect("/reset-password");
  }

  const {email} = data;
  
  const user = await getUserByEmail(email);
  if(!user) return res.status(404).send("User not found!");

  const resetPasswordLink = await createResetPasswordLink({userId : user.id});

  const html = await getHTMLFromMjmlTemplate("reset-password-email", {
    name : user.name,
    link : resetPasswordLink
  });

  await sendEmail({
    to: user.email,
    subject: "Reset Your Password",
    html: html
  });

  req.flash("formSubmitted", true);
  return res.redirect("/reset-password");
}

export const getResetPasswordPage = async (req, res) => {
  // to get the token from url 
  const {token} = req.params;

  //verify the token with the token in db
  const resetPasswordData = await getResetPasswordToken(token);
  if(!resetPasswordData) res.render("auth/wrong-reset-password-token");

  //if verified, redirect to page
  return res.render("auth/reset-password", {
    formSubmitted: req.flash("formSubmitted")[0],
    errors: req.flash("errors"),
    token
  })
}

export const postResetPassword = async (req, res) => {
  // to get the token from url 
  const {token} = req.params;

  //verify the token with the token in db
  const resetPasswordData = await getResetPasswordToken(token);
  if(!resetPasswordData) res.render("auth/wrong-reset-password-token");

  const {data, error} = resetPasswordSchema.safeParse(req.body);

  if(error) {
    const err = error.issues[0].message;
    req.flash("errors", err);
    return res.redirect(`/reset-password/${token}`);
  }

  const {newPassword} = data;

  const user = await fetchUserById(resetPasswordData.userId);

  // delete previous tokens of the specific user
  await clearResetPasswordToken(user.id);

  const hashedPassword = await hashingPasswords(newPassword);

  await updatePassInDB({userId: user.id, password: hashedPassword});

  return res.redirect("/login");
}

export const getGoogleLoginPage = async (req, res) => {
  if(req.user) return res.redirect("/");

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email"
  ]);

  const cookieConfig = {
    httpOnly: true,
    secure: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: "lax"
  }

  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);

  res.redirect(url.toString());
}

export const getGoogleLoginCallback = async (req, res) => {
  const {code, state} = req.query;

  const {google_oauth_state: storedState, google_code_verifier: codeVerifier} = req.cookies;

  if(!code || !state || !storedState || !codeVerifier || state !== storedState) {
    req.flash("errors", "Could not login with google because of invalid login attempt. Please Try Again!");
    return res.redirect("/login");
  }

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (error) {
    req.flash("errors", "Could not login with google because of invalid login attempt. Please Try Again!");
    return res.redirect("/login");
  }

  const claims = decodeIdToken(tokens.idToken());
  const {sub: googleUserId, name, email} = claims;

  //if user is already linked then we will get the user 
  let user = await getUserWithOauthId({
    provider: "google",
    email
  });

  //if user exists but not linked with oAuth
  if(user && !user.providerAccountId) {
    await linkUserWithoAuth({
      userId: user.id,
      provider: "google",
      providerAccountId: googleUserId
    })
  }

  //if user doesn't exist
  if(!user) {
    user = await createUserWithoAuth({
      name, email, provider: "google", providerAccountId: googleUserId
    })
  }

  await authenticateFunc({req, res, user, name, email});

  return res.redirect("/");
}

export const getGithubLoginPage = async (req, res) => {
  if(req.user) return res.redirect("/");

  const state = generateState();

  const url = github.createAuthorizationURL(state, ["user:email"]);

  const cookieConfig = {
    httpOnly: true,
    secure: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: "lax"
  }

  res.cookie("github_oauth_state", state, cookieConfig);

  res.redirect(url.toString());
}

export const getGithubLoginCallback = async (req, res) => {
  const {code, state} = req.query;
  const {github_oauth_state: storedState} = req.cookies;

  if(!code || !state || !storedState || state !== storedState) {
    req.flash("errors", "Could not login with github because of invalid login attempt. Please Try Again!");
    return res.redirect("/login");
  }

  let tokens;
  try {
    tokens = await github.validateAuthorizationCode(code);
  } catch (error) {
    req.flash("errors", "Could not login with github because of invalid login attempt. Please Try Again!");
    return res.redirect("/login");
  }

  const githubUserResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`
    }
  })

  if(!githubUserResponse.ok) {
    req.flash("errors", "Could not login with github because of invalid login attempt. Please Try Again!");
    return res.redirect("/login");
  }

  const githubUser = await githubUserResponse.json();
  const {id: githubUserId, name} = githubUser;

  const githubEmailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`
    }
  })

  if(!githubEmailResponse.ok) {
    req.flash("errors", "Could not login with github because of invalid login attempt. Please Try Again!");
    return res.redirect("/login");
  }

  const githubEmail = await githubEmailResponse.json();
  const email = githubEmail.filter((e) => e.primary)[0].email;

  if(!email) {
    req.flash("errors", "Could not login with github because of invalid login attempt. Please Try Again!");
    return res.redirect("/login");
  }

   //if user is already linked then we will get the user 
  let user = await getUserWithOauthId({
    provider: "github",
    email
  });

  //if user exists but not linked with oAuth
  if(user && !user.providerAccountId) {
    await linkUserWithoAuth({
      userId: user.id,
      provider: "github",
      providerAccountId: githubUserId
    })
  }

  //if user doesn't exist
  if(!user) {
    user = await createUserWithoAuth({
      name, email, provider: "github", providerAccountId: githubUserId
    })
  }

  await authenticateFunc({req, res, user, name, email});

  return res.redirect("/");
}

export const getSetPasswordPage = async (req, res) => {
  if(!req.user) return res.redirect("/");

  return res.render("auth/set-password", {
    errors : req.flash("errors")
  })
}

export const postSetPassword = async (req, res) => {
  if(!req.user) return res.redirect("/");
  //get pass from frontend & zod validation
  const {data, error} = setPasswordSchema.safeParse(req.body);
  if(error) {
    const err = error.issues[0].message;
    req.flash("errors", err);
    return res.redirect("/set-password");
  }

  const {newPassword} = data;

  const user = await fetchUserById(req.user.id);
  if(user.password) {
    req.flash("errors", "You already have your password, instead change your password");
    return res.redirect("/set-password");
  }

  //hash pass and store it in db
  const hashedPassword = await hashingPasswords(newPassword);
  await insertPasswordInUserRecord({userId: user.id, password: hashedPassword});

  return res.redirect("/me");
}