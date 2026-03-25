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
  clearResetPasswordToken
} from "../services/auth.services.js";
import { registrationSchema, loginUserSchema, verifyEmailSchema, nameSchema, passwordSchema, verifyPasswordSchema, emailSchema, updateProfileSchema, resetPassEmailSchema, resetPasswordSchema } from "../validators/auth-validators.js";
import { getHTMLFromMjmlTemplate } from "../lib/get-html-from-mjml-template.js";

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