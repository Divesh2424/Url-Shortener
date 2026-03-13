import {
  getUserByEmail,
  saveData,
  hashingPasswords,
  comparePasswords,
  generateToken,
} from "../services/auth.services.js";

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

  const { email, password } = req.body;

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

  const token = await generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  res.cookie("access_token", token);
  return res.redirect("/");
};

export const postRegistrationPage = async (req, res) => {
  try {
    if (req.user) {
      return res.redirect("/");
    }
    const { name, email, password } = req.body;

    //to check if data already exists
    const existingUser = await getUserByEmail(email);

    if(existingUser) {
      req.flash("errors", "email already exists");
      return res.redirect("/registration")
    }

    const hashedPassword = await hashingPasswords(password);
    //if not then store it in database
    await saveData({ name, email, password: hashedPassword });

    res.redirect("/login");
  } catch (error) {
    console.error("Error posting registration data", error);
    res.send("Error posting registration data");
  }
};

export const getProfilePage = (req, res) => {
  if (!req.user) {
    res.send("Not Logged In");
  }
  // return res.send(`<h1>Hey ${req.user.name}</h1>`);
  return res.render("auth/profile")
};

export const logoutUser = (req, res) => {
  res.clearCookie("access_token");
  return res.redirect("/login");
};
