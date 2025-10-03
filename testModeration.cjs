import "dotenv/config"; 
const { Mistral } =require("@mistralai/mistralai");

const apiKey = process.env.UTS_MISTRAL_API_KEY;
const client = new Mistral({apiKey});

const response = await client.classifiers.moderate({
    model: "mistral-moderation-latest",
    inputs: ["This is bullshit"],
});

console.log(response);