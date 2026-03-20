import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({to, subject, html}) => {
    try {
        const {data, error} = await resend.emails.send({
            from : "Divesh <onboarding@resend.dev>",
            to : [to],
            subject,
            html
        }); 
        if(error) {
            console.error(error);
        }
    } catch (error) {
        console.error("Error during sending mails : ", error);
    }
}