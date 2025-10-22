const mistralModeration = async (text) => {
  console.log("utils moderation - moderation verification with Le Chat - ", text?.slice(0,30));

  try {
    const responseModerationRaw = await fetch(
      "https://api.mistral.ai/v1/moderations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.UTS_MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mistral-moderation-latest", // Modèle de modération (vérifie la doc pour les versions disponibles)
          input: text,
        }),
      }
    );

    const resultModeration = await responseModerationRaw.json();

    const categories = resultModeration.results[0].categories;
    let flaggedCategories = Object.entries(categories)
      .filter(([_, flag]) => flag === true)
      .map(([category]) => category);
    let moderation = Object.values(categories).some((flag) => flag === true);

    return { moderation, flaggedCategories };
  } catch (error) {
    console.error("Error during content moderation", error);
  }
};

module.exports = { mistralModeration };
