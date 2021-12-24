import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { readFileSync } from 'fs';
import * as readline from 'readline'

// let environment = 'SANDBOX';
let environment = 'PRODUCTION';


const ebayConfigFile = 'config.json';
const env = JSON.parse(readFileSync(ebayConfigFile))[environment];
const ebayBaseURL = env.baseUrl;
const ebayAuthToken = new EbayAuthToken({filePath:ebayConfigFile});
console.log(`Starting application with env ${environment} - ${ebayBaseURL}`)


const extractAccessToken = (token) => JSON.parse(token)['access_token'];

const getAppToken = async () => {
	let rawToken = await ebayAuthToken.getApplicationToken(environment);
	return extractAccessToken(rawToken);
}

const askForUserToken = async () => {
	const scopes = [
		'https://api.ebay.com/oauth/api_scope/sell.inventory',
		'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly'
	];

    const authUrl = ebayAuthToken.generateUserAuthorizationUrl(environment, scopes);
	console.log("Log in using this URL and copy the 'code' query parameter")
	console.log(authUrl);

	const code = await askQuestion("Type in the code from the query parameter: ");
	const rawToken = await ebayAuthToken.exchangeCodeForAccessToken('PRODUCTION', code);
	return extractAccessToken(rawToken);
}

// https://stackoverflow.com/a/50890409/2249725
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

export { ebayBaseURL, getAppToken, askForUserToken };
