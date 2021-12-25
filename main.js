import axios from 'axios';
import { ebayBaseURL,getAppToken, askForUserToken } from './token.js';


const search = async (query, appToken) => {
	if (!appToken) appToken = await getAppToken();

	console.log('searching for:', query)
	return axios({
		method: 'get',
		url: `https://${ebayBaseURL}/buy/browse/v1/item_summary/search?q=${query}=&limit=30&sort=price`,
		headers: {
			'Authorization': `Bearer ${appToken}`,
			'Content-Type': 'application/json'
		}
	})
	.then(resp => {
		let summary = resp.data.itemSummaries
		.map(v => ({
			itemId: v.itemId,
			title: v.title,
			price: `${v.price.value} ${v.price.currency}`,
			itemWebUrl: v.itemWebUrl,
			seller: v.seller.username,
		}));
		console.log(summary);
		return summary;
	},
	(err) => {
		console.log(err.response.status, err.response.statusText)
		console.log(JSON.stringify(err.response.data, '', ' '))
	})}

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
	},
	(err) => {
		console.log(err.response.status, err.response.statusText)
		console.log(JSON.stringify(err.response.data, '', ' '))
	})
}

const migrateInventory = (skus, userToken) => {
	// https://developer.ebay.com/api-docs/sell/inventory/resources/listing/methods/bulkMigrateListing#_samples
	let body = { requests: skus.map(v => ({listingId: v})) };

	axios({
		method: 'post',
		url: `https://${ebayBaseURL}/sell/inventory/v1/bulk_migrate_listing`,
		headers: {
			'Authorization': `Bearer ${userToken}`,
			'Content-Type': 'application/json'
		},
		data: body,
	})
	.then(resp => {
		console.log(resp.data);
	},
	(err) => {
		console.log(err.response.status, err.response.statusText)
		console.log(JSON.stringify(err.response.data, '', ' '))
	})
}

const listInventory = (userToken) => {
	axios({
		method: 'get',
		url: `https://${ebayBaseURL}/sell/inventory/v1/inventory_item?limit=3`,
		headers: {
			'Authorization': `Bearer ${userToken}`,
			'Content-Type': 'application/json'
		}
	})
	.then(resp => {
		console.log(resp.data);
	},
	(err) => {
		console.log(err.response.status, err.response.statusText)
		console.log(JSON.stringify(err.response.data, '', ' '))
	})
}


(async () => {

	// Search
	let query = '2020 139 topps now christian pache'
	search(query)

	// Show inventory of a user
	// let userToken = await askForUserToken()
	// console.log(userToken)

	// getUser(userToken)
	// migrateInventory([''], userToken)
	// listInventory(userToken)
})();
