require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const WebClient = require('@slack/client').WebClient;
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
var twilio = require('twilio');
var firebase = require('firebase');

// Retrieve bot token from dotenv file
const bot_token = process.env.SLACK_BOT_TOKEN || '';
// Authorization token
const auth_token = process.env.SLACK_AUTH_TOKEN || '';
// Verification token for Events Adapter, to make sure events we receive are from Slack
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);
// Slack web client
const web = new WebClient(auth_token);
const bot = new WebClient(bot_token);

// Creates express app
const app = express();
// Use BodyParser for app
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// The port used for  Express server
const PORT = 4390;

// Channel sending messages to
const channel = '#general'

// Starts server
app.listen(PORT, function() {
	console.log('TalkBot is listening on port ' + PORT);
});

// Handles incoming SMS to Twilio number
app.post('/sms', function(req, res) {
	// Gets message from Twilio req
	let msg = req.body.Body ? req.body.Body : '';
	// Gets phone number from sender without leading plus sign
	let num = req.body.From ? req.body.From.slice(1) : '';

	getID(num)
		.then((id) => {
			if (id) {  // User exists in database
				sendThread(msg, channel, id);
			} else { // User doesn't exist -- send message and create user
				sendMessage(msg, channel, num);
			}
		})
		.catch(console.error);
});

function sendMessage(text, channel, num) {
	// Send message using Slack Web Client
	web.chat.postMessage(channel, text, function(err, info) {
		if (err) {
			console.log(err);
		}
	});
}

var config = {
	apiKey: process.env.FB_API_KEY || '',
	authDomain: process.env.FB_AUTH_DOMAIN || '',
	databaseURL: process.env.FB_DB_URL || '',
	projectId: process.env.FB_PROJECT_ID || '',
	storageBucket: process.env.FB_STORAGE_BUCKET || '',
	messagingSenderId: process.env.FB_MESSAGING_SENDER_ID || ''
};

// Firebase initialization
var db = firebase.initializeApp(config).database();

/**
 * Firebase Access Methods:
 * Channel manipulation, user manipulation, and user retrieval
 */

// Update channel
function updateChannel(id) {
	db.ref('channel/id').set(id);
}

// Get channel
function getChannel() {
	const ref = db.ref('channel/id');
	ref.on('value', (snapshot) => {
		channel = snapshot.val();
	})
}

// Create user in Firebase
function createUser(num, id) {
	db.ref('users/' + num).set(id);
}

// Delete user in Firebase
function deleteUser(num) {
	db.ref('users/').child(num).remove();
}

// Get number from message ID in Firebase
function getNum(id) {
	return db.ref('users/').orderByValue().equalTo(id).once('value').then((snapshot) => {
		if (snapshot.val()) return Object.keys(snapshot.val())[0];
		return null;
	});
}

// Get thread ID from phone number in Firebase
function getID(num) {
	return db.ref('users/').child(num).once('value').then((snapshot) => {
		return snapshot.val();
	});
}

function sendMessage(text, channel, num) {
	// Send message using Slack Web Client
	web.chat.postMessage(channel, text, function(err, info) {
		if (err) {
			console.log(err);
		} else {
			if (num) {
				// Create user in database
				createUser(num, info.ts);
			}
		}
	});
}

function sendThread(text, channel, id) {
	// Send message using Slack Web Client
	var msg = {
		thread_ts: id
	};

	web.chat.postMessage(channel, text, msg, function(err, info) {
		if (err) console.log(err);
	});
}
