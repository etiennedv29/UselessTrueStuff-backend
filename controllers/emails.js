const { sendTransactional,sendEmailSafe } = require("../utils/emails");

const sendEmails = async (req, res) => {
  console.log("emails controller - sendEmails");
  try {
    const {to, type, ctx} = req.body;
    //const { to, subject, text, html } = req.body;
    //if (!to || !subject) {
    if (!to || !type) {
      return res
        .status(400)
        .json({ ok: false, error: "Champs 'to' manquant ou 'type' de mail manquant" });
    }

    //const result = await sendTransactional({ to, subject, text, html });
    const result = await sendTransactional({ to, type, ctx});
    res.json({ ok: true, id: result.id });
  } catch (e) {
    console.error(`controller - erreur envoi du mail ${type}`,e)
    res.status(500).json({ ok: false, error: e.message });
  }
};

module.exports = { sendEmails };
