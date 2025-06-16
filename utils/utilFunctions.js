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

module.exports = {
  firstLetterCapital,
  checkBody,
  checkEmail,
  getValidPicsumImage,
};
