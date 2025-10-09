// utils/emailTemplates.js
function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Layout commun avec styles inline pour compatibilité email
function layout({ subject, bodyHtml }) {
  return `<!doctype html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${esc(subject)}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f6f7fb;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" 
           style="max-width:600px;margin:0 auto;background:#ffffff;
                  border-radius:8px;border:1px solid #e8e8ef;
                  font-family:'Trebuchet MS','Lucida Sans Unicode','Lucida Grande','Lucida Sans',Arial,sans-serif;
                  color:#0b0c1a;">
      <tr>
        <td style="border-radius:8px;background:#0b0c1a;color:#1ad4ff;padding:16px 20px;font-weight:700;font-size:18px;">
          Useless True Stuff
        </td>
      </tr>
      <tr>
        <td style="padding:20px;line-height:1.6;font-size:16px;">
          ${bodyHtml}
          <hr style="height:1px;background:#e8e8ef;border:0;margin:16px 0;" />
          <p style="color:#6b7280;font-size:13px;">
            Si vous n’êtes pas à l’origine de cette action, vous pouvez ignorer ce message.
          </p>
          <p style="font-size:13px;color:#6b7280;margin-top:20px;">
            Gérer mes préférences de notification : 
            <a href="https://www.uselesstruestuff.info/account" 
              style="color:#6b7280;text-decoration:underline;cursor:pointer;">
              Mon compte
            </a>
          </p>

        </td>
        
      </tr>
      <tr>
        <td style="padding:14px 20px;font-size:12px;color:#6b7280;">
          © ${new Date().getFullYear()} Useless True Stuff
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

const templates = {
  // 1) Confirmation d'inscription
  signup_confirmation: (ctx) => {
    const subject = "Bienvenue sur Useless True Stuff 🎉";
    const text = `Bonjour ${ctx.firstName || ""},
  
Ton inscription est confirmée !
Nous sommes heureux de te compter parmi nous.
  
— L’équipe UTS`;
    const bodyHtml = `
      <p>Bonjour ${esc(ctx.firstName || "")},</p>
      <p><strong>Ton inscription est confirmée !</strong></p>
      <p>Nous sommes heureux de te compter parmi nous.</p>
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
          ? `<p><a href="${esc(ctx.factUrl)}" 
                 style="display:inline-block;padding:10px 16px;border-radius:8px;
                        text-decoration:none;background:#1ad4ff;color:#0b0c1a;
                        font-weight:700;">Voir l’info publiée</a></p>`
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
  
Après vérification par l'IA, ton info "${ctx.title || "Ton info"}" n’a pas été validée.
Raison : ${reason}
  
Tu peux la retravailler et la soumettre à nouveau.
— L’équipe UTS`;
    const bodyHtml = `
      <p>Bonjour,</p>
      <p>Après vérification par l'IA, ton info "<strong>${esc(
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
    const expires = ctx.validityDelay
      ? `Ce lien expire dans ${ctx.validityDelay * 60} minutes.`
      : "Ce lien expire bientôt.";
    const text = `Bonjour,
  
Tu as demandé la réinitialisation de ton mot de passe.
Lien : ${ctx.resetUrl}
  
${expires}
— L’équipe UTS`;
    const bodyHtml = `
      <p>Bonjour,</p>
      <p>Tu as demandé la réinitialisation de ton mot de passe.</p>
      <p><a href="${esc(ctx.resetUrl || "#")}" 
            style="display:inline-block;padding:10px 16px;border-radius:8px;
                   text-decoration:none;background:#1ad4ff;color:#0b0c1a;
                   font-weight:700;">Réinitialiser mon mot de passe</a></p>
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
          ? `<p><a href="${esc(ctx.loginUrl)}" 
                 style="display:inline-block;padding:10px 16px;border-radius:8px;
                        text-decoration:none;background:#1ad4ff;color:#0b0c1a;
                        font-weight:700;">Me connecter</a></p>`
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
  
Ton compte a bien été supprimé :
- tes données personnelles sont supprimées définitivement 
- tes données publiques (commentaires et likes) sont anonymisées
  
Merci d’avoir fait partie de la communauté.
— L’équipe UTS`;
    const bodyHtml = `
      <p>Bonjour,</p>
      <p>Ton compte a bien été supprimé :</p>
      <p>- tes données personnelles sont supprimées définitivement</p>
      <p>- tes données publiques (commentaires et likes) sont anonymisées</p>
      <p>Merci d’avoir fait partie de la communauté.</p>
      <p>— L’équipe UTS</p>
    `;
    return { subject, text, html: layout({ subject, bodyHtml }) };
  },

  // 8) Notification quotidienne du nouveau fact
  dailyFact_notificationEmail: (ctx) => {
    const subject = `L'info toute fraîche : "${ctx.factTitle}"`;
    const text = `Hello !
  
  Ta petite dose d'info du jour :
  
  ${ctx.factTitle}
  ${ctx.factDescription}
  
  Pour un petit like, c'est par là : ${ctx.factUrl}
  Et pour en découvrir plein d'autres, c'est sur www.uselesstruestuff.info !
  
  — L’équipe UTS`;
    const bodyHtml = `
      <p>Hello !</p>
      <p>Ta petite dose d'info du jour :</p>
  
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" 
             style="background:#f0f9ff;border-radius:8px;padding:12px;margin:16px 0;">
        <tr>
          <td style="vertical-align:top;">
            <a href="${esc(ctx.factUrl || "#")}" target="_blank" 
               style="color:#0b0c1a;text-decoration:none;">
              <h2 style="margin:0;font-size:18px;font-weight:bold;">${esc(
                ctx.factTitle
              )}</h2>
            </a>
            <div style="margin-top:8px;font-size:14px;line-height:1.5;color:#0b0c1a;">
              <a href="${esc(ctx.factUrl || "#")}" target="_blank" 
                 style="color:#0b0c1a;text-decoration:none;">
                ${esc(ctx.factDescription)}
              </a>
            </div>
            <div style="margin-top:8px;font-size:14px;line-height:1.5;color:#0b0c1a;">
              <a href="${esc(ctx.factUrl || "#")}" target="_blank" 
                 style="color:#0b0c1a;text-decoration:none;">
               Ca t'intéresse ? Like et commente en cliquant <span style =" text-decoration: underline;">ici</span> 
              </a>
            </div>
          </td>
        </tr>
      </table>
  
      <p style="display:flex;flex-direction:column;gap:8px;">
        <span>Et pour en découvrir plein d'autres, c'est par ici :</span>
        <a href="https://www.uselesstruestuff.info"
            style="padding:10px 16px;border-radius:8px;text-decoration:none;
            background:#1ad4ff;color:#0b0c1a;font-weight:700;
            max-width:fit-content;">Découvrir plus d'infos</a>
      </p>
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
