import { getUserByEmail, saveData, hashingPasswords, comparePasswords, generateToken } from "../services/auth.services.js";

export const getLoginPage = (req, res) => {
  return res.render("auth/login");
};

export const getRegistrationPage = (req, res) => {
  return res.render("auth/register");
};

export const postLogin = async (req, res) => {
  const {email, password} = req.body;
  
  const user = await getUserByEmail(email);
  if(!user) {
    res.status(401).send("User with this email does not exists");
  }

  const isPasswordValidate = await comparePasswords(password, user.password);
  if(!isPasswordValidate) {
    res.status(401).send("Wrong Password");
  }

  const token = await generateToken({
    id : user.id,
    name : user.name,
    email : user.email
  });
  
  res.cookie('access_token', token);
  return res.redirect("/");
};

export const postRegistrationPage = async (req, res) => {
  try {
    const { name, email, password } = req.body;
  
    //to check if data already exists
    const existingUser = await getUserByEmail(email);
    if(existingUser) {
      res.status(409).send("User with this same email Already Exists");
    }
    const hashedPassword = await hashingPasswords(password);
    //if not then store it in database
    await saveData({name, email, password : hashedPassword});
  
    res.redirect("/login");
  } catch (error) {
      console.error("Error posting registration data", error);
      res.send("Error posting registration data");
  }
}