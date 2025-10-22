const { Resend } = require("resend");
const { buildEmail } = require("./emailTemplates");

const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM =
  process.env.MAIL_FROM || "no-reply@send.uselesstruestuff.info";

//async function sendTransactional({ to, subject, text, html }) {
async function sendTransactional({ to, type, ctx = {} }) {
  console.log("utils emails - sendTransactionnal - type - ", type, " to ", to);
  try {
    const { subject, text, html } = await buildEmail(type, ctx);

    //envoi via resend
    const result = await resend.emails.send({
      from: MAIL_FROM,
      to,
      subject,
      text,
      html: html || `<p>${(text || "").replace(/\n/g, "<br/>")}</p>`,
    });
    return result;
  } catch (err) {
    console.error("utils sendTransactional -  Erreur envoi du mail:", err);
    throw err;
  }
}

async function sendEmailSafe(args) {
  console.log("utils emails - trying to sendEmailSafe");
  try {
    console.log(sendTransactional(args));
    return await sendTransactional(args);
  } catch (e) {
    console.error("[MAIL][FAILED]", args?.type, args?.to, e?.message);
    return null;
  }
}
module.exports = { sendTransactional, sendEmailSafe };
