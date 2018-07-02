require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const WebClient = require('@slack/client').WebClient;
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;

// Retrieve bot token from dotenv file
const bot_token = process.env.SLACK_BOT_TOKEN || '';
// Authorization token
const auth_token = process.env.SLACK_AUTH_TOKEN || '';
// Verification token for Events Adapter, to make sure events we receive are from Slack
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);
// Slack web client
const web = new WebClient(auth_token);
const bot = new WebClient(bot_token);

// Post message to Slack
web.chat.postMessage('#general', 'Hello, world!', function(err, info) {
	if (err) console.log(err);
});
