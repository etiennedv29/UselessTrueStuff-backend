const axios = require("axios");

//mise au format standard pour la recherche de trips
const firstLetterCapital = (string) =>
  string.slice(0, 1).toUpperCase() + string.slice(1);

//vérification que les points d'entrée du user ne sont pas nulles ou inutilisables avant de rechercher dans la db
const checkBody = (obj, keys) => {
  return keys.every((key) => !!obj[key]);
};

//vérification que l'email est au format correct avant toute recherche dans la db
const checkEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

async function getValidPicsumImage() {
  let url;
  let id;
  let exists = false;

  do {
    id = Math.floor(Math.random() * 1084);
    url = `https://picsum.photos/id/${id}/200/200`;
    try {
      const response = await axios.get(url, { responseType: "stream" });
      response.data.destroy(); // coupe immédiatement le téléchargement après la réception du readablefile
      exists = response.status === 200;
    } catch (err) {}
  } while (!exists);

  return url;
}
async function getRelevantImage(tags) {
  console.log("utilsFunctions - getRelevantImage - ", tags);

  // Vérification basique
  if (!tags || tags.length === 0) {
    console.warn("Fallback direct vers picsum");
    return getValidPicsumImage();
  }

  // On teste avec tous les tags puis un de moins à chaque fois
  for (let precision = tags.length; precision > 0; precision--) {
    const relevantTags = tags
      .slice(0, precision)
      .join("-")
      .toLowerCase();

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          relevantTags
        )}&orientation=square&per_page=1`,
        {
          headers: {
            Authorization: process.env.PEXELS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.warn(`Pas d'image trouvée sur pexels avec la précision ${precision} - `, response.status, response.statusText);
        continue; // on tente moins de précision
      }

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        const photo = data.photos[0];
        console.log("Image Pexels trouvée, precision = ",precision);
        return photo.src.medium || photo.src.original;
      } else {
        console.log(`Aucune image trouvée avec ${precision} tag(s).`);
      }
    } catch (error) {
      console.error(`Erreur lors de l'appel Pexels avec ${precision} tags :`, error);
    }
  }

  // Fallback final
  console.log("🔁 Aucun résultat trouvé sur Pexels. On passe à Picsum.");
  return getValidPicsumImage();
}


module.exports = {
  firstLetterCapital,
  checkBody,
  checkEmail,
  getValidPicsumImage,
  getRelevantImage,
};
