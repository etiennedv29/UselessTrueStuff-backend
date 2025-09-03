// utils/emailTemplates.js
function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Layout commun
function layout({ subject, bodyHtml }) {
  return `<!doctype html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${esc(subject)}</title>
    <style>
      .wrapper { background:#f6f7fb; padding:24px; }
      .container {
        max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px;
        border:1px solid #e8e8ef; overflow:hidden;
        font-family: "Trebuchet MS","Lucida Sans Unicode","Lucida Grande","Lucida Sans",Arial,sans-serif;
        color:#0b0c1a;
      }
      .header { background:#0b0c1a; color:#1ad4ff; padding:16px 20px; font-weight:700; font-size:18px; }
      .content { padding:20px; line-height:1.6; font-size:16px; }
      .cta {
        display:inline-block; padding:10px 16px; border-radius:8px; text-decoration:none;
        background:#1ad4ff; color:#0b0c1a; font-weight:700;
      }
      .muted { color:#6b7280; font-size:13px; }
      .divider { height:1px; background:#e8e8ef; border:0; margin:16px 0; }
      .footer { padding:14px 20px; font-size:12px; color:#6b7280; }
    </style>
  </head>
  <body className="wrapper">
    <table role="presentation" className="container" cellpadding="0" cellspacing="0" width="100%">
      <tr><td className="header">Useless True Stuff</td></tr>
      <tr><td className="content">
        ${bodyHtml}
        <hr className="divider" />
        <p className="muted">Si vous n’êtes pas à l’origine de cette action, vous pouvez ignorer ce message.</p>
      </td></tr>
      <tr><td className="footer">© ${new Date().getFullYear()} Useless True Stuff</td></tr>
    </table>
  </body>
  </html>`;
}

const templates = {
  // 1) Confirmation d'inscription
  signup_confirmation: (ctx) => {
    const subject = "Bienvenue sur Useless True Stuff 🎉";
    const text = `Bonjour ${ctx.firstName || ""},
  
  Votre inscription est confirmée !
  Nous sommes heureux de vous compter parmi nous.
  
  — L’équipe UTS`;
    const bodyHtml = `
        <p>Bonjour ${esc(ctx.firstName || "")},</p>
        <p><strong>Votre inscription est confirmée !</strong></p>
        <p>Nous sommes heureux de vous compter parmi nous.</p>
        <p>— L’équipe UTS</p>
      `;
    return { subject, text, html: layout({ subject, bodyHtml }) };
  },

  // 2) Info validée
  info_validated: (ctx) => {
    const subject = "Ton info a été validée 🎉";
    const text = `Bravo ${ctx.username}!
  
  Ton info "${ctx.title || "Ton info"}" a été validée et est maintenant visible.
  ${ctx.factUrl ? `Lien : ${ctx.factUrl}` : ""}
  
  Merci pour ta participation !
  — L’équipe UTS`;
    const bodyHtml = `
        <p><strong>Bravo !</strong></p>
        <p>Ton info "<strong>${esc(
          ctx.title || "Ton info"
        )}</strong>" a été validée et est maintenant visible.</p>
        ${
          ctx.factUrl
            ? `<p><a className="cta" href="${esc(
                ctx.factUrl
              )}">Voir l’info publiée</a></p>`
            : ""
        }
        <p>Merci pour ta participation !</p>
        <p>— L’équipe UTS</p>
      `;
    return { subject, text, html: layout({ subject, bodyHtml }) };
  },

  // 3) Info rejetée
  info_rejected: (ctx) => {
    const subject = "Ton info n’a pas été validée";
    const reason =
      ctx.reason || "Nous n’avons pas pu valider cette info pour le moment.";
    const text = `Bonjour,
  
  Ton info "${ctx.title || "Ton info"}" n’a pas été validée.
  Raison : ${reason}
  
  Tu peux la retravailler et la soumettre à nouveau.
  — L’équipe UTS`;
    const bodyHtml = `
        <p>Bonjour,</p>
        <p>Ton info "<strong>${esc(
          ctx.title || "Votre info"
        )}</strong>" n’a pas été validée.</p>
        <p>Raison : ${esc(reason)}</p>
        <p>Tu peux la retravailler et la soumettre à nouveau.</p>
        <p>— L’équipe UTS</p>
      `;
    return { subject, text, html: layout({ subject, bodyHtml }) };
  },

  // 4) Commentaire bien envoyé
  comment_sent: (ctx) => {
    const subject = "Ton commentaire a bien été posté 💬";
    const text = `Bonjour,
  
  Ton commentaire a bien été envoyé sur : "${ctx.factTitle || "cette info"}".
  Merci pour ta participation !
  — L’équipe UTS`;
    const bodyHtml = `
        <p>Bonjour,</p>
        <p>Ton commentaire a bien été posté sur : "<strong>${esc(
          ctx.factTitle || "cette info"
        )}</strong>".</p>
        <p>Merci pour ta participation !</p>
        <p>— L’équipe UTS</p>
      `;
    return { subject, text, html: layout({ subject, bodyHtml }) };
  },

  // 5) Mot de passe oublié
  password_reset_request: (ctx) => {
    const subject = "Réinitialisation de ton mot de passe";
    const expires = ctx.expiresInMinutes
      ? `Ce lien expire dans ${ctx.expiresInMinutes} minutes.`
      : "Ce lien expire bientôt.";
    const text = `Bonjour,
  
  Tu as demandé la réinitialisation de ton mot de passe.
  Lien : ${ctx.resetUrl}
  
  ${expires}
  — L’équipe UTS`;
    const bodyHtml = `
        <p>Bonjour,</p>
        <p>Tu as demandé la réinitialisation de ton mot de passe.</p>
        <p><a className="cta" href="${esc(
          ctx.resetUrl || "#"
        )}">Réinitialiser mon mot de passe</a></p>
        <p>${esc(expires)}</p>
        <p>— L’équipe UTS</p>
      `;
    return { subject, text, html: layout({ subject, bodyHtml }) };
  },

  // 6) Mot de passe bien réinitialisé
  password_reset_success: (ctx) => {
    const subject = "Ton mot de passe a été réinitialisé ✅";
    const text = `Bonjour,
  
  Ton mot de passe a été réinitialisé avec succès.
  ${ctx.loginUrl ? `Tu peux te connecter ici : ${ctx.loginUrl}` : ""}
  
  — L’équipe UTS`;
    const bodyHtml = `
        <p>Bonjour,</p>
        <p>Ton mot de passe a été réinitialisé avec succès.</p>
        ${
          ctx.loginUrl
            ? `<p><a className="cta" href="${esc(
                ctx.loginUrl
              )}">Me connecter</a></p>`
            : ""
        }
        <p>— L’équipe UTS</p>
      `;
    return { subject, text, html: layout({ subject, bodyHtml }) };
  },

  // 7) Suppression de compte
  account_deleted: (ctx) => {
    const subject = "Ton compte a été supprimé";
    const text = `Bonjour,
  
  Ton compte a bien été supprimé.
  ${
    ctx.feedbackUrl
      ? `Ton pouvez donner votre avis ici : ${ctx.feedbackUrl}`
      : ""
  }
  
  Merci d’avoir fait partie de la communauté.

  — L’équipe UTS`;
    const bodyHtml = `
        <p>Bonjour,</p>
        <p>Ton compte a bien été supprimé.</p>
        ${
          ctx.feedbackUrl
            ? `<p><a className="cta" href="${esc(
                ctx.feedbackUrl
              )}">Donner mon avis</a></p>`
            : ""
        }
        <p>Merci d’avoir fait partie de la communauté.</p>

        <p>— L’équipe UTS</p>
      `;
    return { subject, text, html: layout({ subject, bodyHtml }) };
  },
};

function buildEmail(type, ctx = {}) {
  const t = templates[type];
  if (!t) throw new Error(`Template inconnu: ${type}`);
  return t(ctx);
}

module.exports = { buildEmail };
