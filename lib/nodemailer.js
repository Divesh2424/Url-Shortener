import nodemailer from "nodemailer";

const testAccount =  await nodemailer.createTestAccount(); 

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
});

export const sendEmail = async ({to, subject, html}) => {
    const info = await transporter.sendMail({
        from : testAccount.user,
        to: to,
        subject: subject,
        html: html
    });
    const testEmailURL = nodemailer.getTestMessageUrl(info);
    console.log(testEmailURL);
}
