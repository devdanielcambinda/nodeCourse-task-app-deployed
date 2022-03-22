const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email,name) => {
    sgMail.send({
        to:email,
        from: process.env.SENDGRID_FROM,
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know you get along with the app.`
    })
}

const sendCancelationEmail = (email,name)=>{
    sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM,
      subject: "Sorry to see you go!",
      text: `Goodbye, ${name}. I hope to see you back sometime soon.`,
    });
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}