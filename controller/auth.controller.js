import { sendEmail } from "../lib/nodemailer.js";
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
  updateUsersTableInDB
} from "../services/auth.services.js";
import { registrationSchema, loginUserSchema, verifyEmailSchema, nameSchema } from "../validators/auth-validators.js";

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
       
    const {data, error} = nameSchema.safeParse(req.body);

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