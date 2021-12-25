import axios from 'axios';
import { ebayBaseURL,getAppToken, askForUserToken } from './token.js';


const search = async (query, appToken) => {

	if (!appToken) appToken = await getAppToken();

	console.log('searching for:', query)
	return axios({
		method: 'get',
		url: `https://${ebayBaseURL}/buy/browse/v1/item_summary/search?q=${query}=&limit=2`,
		headers: {
			'Authorization': `Bearer ${appToken}`,
			'Content-Type': 'application/json'
		}
	})
	.then(resp => {
		let summary = resp.data.itemSummaries.map(v => ({
			itemId: v.itemId,
			title: v.title,
			price: `${v.price.value} ${v.price.currency}`,
			itemWebUrl: v.itemWebUrl,
		}));
		console.log(summary);
		return summary;
	})
	.catch(err => console.log(err.response))
}

const getUser = (userToken) => {
	let base = ebayBaseURL.replace('api.', 'apiz.');

	axios({
		method: 'get',
		url: `https://${base}/commerce/identity/v1/user/`,
		headers: {
			'Authorization': `Bearer ${userToken}`,
			'Content-Type': 'application/json'
		}
	})
	.then(resp => {
		console.log(resp.data);
	})
	.catch(err => console.log(err))
}


const listInventory = (userToken) => {
	axios({
		method: 'get',
		url: `https://${ebayBaseURL}/sell/inventory/v1/inventory_item&limit=3`,
		headers: {
			'Authorization': `Bearer ${userToken}`,
			'Content-Type': 'application/json'
		}
	})
	.then(resp => {
		console.log(resp.data);
	})
	.catch(err => console.log(err))
}


(async () => {

	// Search
	// let query = 'Topps Project 70 Card 386 - 1990 Catfish Hunter by Claw Money GOLD FRAME'
	// search(query)

	// Show inventory of a user
	let userToken = await askForUserToken()
	// console.log(userToken)

	getUser(userToken)
	// listInventory(userToken)
})();
