import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { readFileSync } from 'fs';
import * as readline from 'readline';
import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';
import clipboard from 'clipboardy';

// let environment = 'SANDBOX';
let environment = 'PRODUCTION';

const ebayConfigFile = 'config.json';
const env = JSON.parse(readFileSync(ebayConfigFile))[environment];
const ebayBaseURL = env.baseUrl;
const ebayAuthToken = new EbayAuthToken({filePath:ebayConfigFile});
console.log(`Starting application with env ${environment} - ${ebayBaseURL}`)

// Simple local storage
// const keyv = new Keyv();
const keyv = new Keyv({store: new KeyvFile({ filename: 'kevydb.json', writeDelay: 0,})});
keyv.on('error', err => console.log('Connection Error', err));
const tokenDBKey = (type) => `token-${type}-${environment}`
const updateToken = async (type, value) => await keyv.set(tokenDBKey(type), value);
const lastToken = async (type) => await keyv.get(tokenDBKey(type));

const expirationKey = 'expireDate'
const extractAccessToken = (token) => JSON.parse(token)['access_token'];
const tokenExpired = (token) => {
	if (!token)
		return true

	let parsed = JSON.parse(token);
	let expirationDateStr = parsed[expirationKey]
	if (!expirationDateStr)
		return true

	let expirationDate = new Date(JSON.parse(expirationDateStr));
	let bufferSeconds = 5;

	let now = new Date(new Date().getTime() - (bufferSeconds * 100))
	if (expirationDate > now)
		return false

	return true
}

const addExpirationDate = (token, creationTime) => {
	if (!token)
		return token

	let parsed = JSON.parse(token)
	let expirationSeconds = parsed['expires_in']
	if (!expirationSeconds)
		return token

	let expirationDate = new Date(creationTime.getTime() + (parseInt(expirationSeconds) * 100))
	parsed[expirationKey] = JSON.stringify(expirationDate)

	return JSON.stringify(parsed);
}

const getAppToken = async () => {
	let tokenType = 'app';
	let rawToken = await lastToken(tokenType);
	if (tokenExpired(rawToken)) {
		// TOOD get refresh token
		let now = new Date()
		rawToken = await ebayAuthToken.getApplicationToken(environment);
		rawToken = addExpirationDate(rawToken, now)
		await updateToken(tokenType, rawToken)
	}
	return extractAccessToken(rawToken);
}

const askForUserToken = async () => {
	let tokenType = 'user';
	let rawToken = await lastToken(tokenType);

	if (tokenExpired(rawToken)) {
		const scopes = [
			'https://api.ebay.com/oauth/api_scope/sell.inventory',
			'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly'
		];

		const authUrl = ebayAuthToken.generateUserAuthorizationUrl(environment, scopes);
		console.log("Log in using this URL and copy the 'code' query parameter")
		console.log(authUrl);
		clipboard.writeSync(authUrl);
		console.log('url copied to clipboard')

		const code = await askQuestion("Type in the code from the query parameter: ");

		let now = new Date()
		rawToken = await ebayAuthToken.exchangeCodeForAccessToken(environment, code);
		rawToken = addExpirationDate(rawToken, now)
		await updateToken(tokenType, rawToken)
	}

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
