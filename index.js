const tmi = require("tmi.js");
const v3 = require("node-hue-api").v3;

const boiData = require("./boi_items.json");

const USERNAME = process.env.HUE_USERNAME;
const LIGHT_ID = 1;

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN,
  },
  channels: [process.env.CHANNEL_NAME],
};

//Create a client with our options
const client = new tmi.client(opts);

client.on("message", (target, context, msg, self) => {
  command = msg.trim();

  switch (msg.split(" ")[0]) {
    case "!lightOff":
      turnLightOff();
      break;
    case "!lightOn":
      turnLightOn();
      break;
    case "!blue":
      turnLightBlue();
      break;
    case "!red":
      turnLightRed();
      break;
    case "!alert":
      client.say(target, "COZY ALERT COZY ALERT");
      createAlert();
      break;
    case "!changeColor":
      chatChangesColor(target, msg);
      break;
    case "!changeBrightness":
      changeBrightness(target, msg);
      break;
    case "!item":
      getItemInfo(target, msg);
      break;
    case "!help":
      showHelpMessages(target);
      break;
  }
});

function showHelpMessages(target) {
  client.say(
    target,
    "!lightOff\n!lightOn\n!blue\n!red\n!alert\n!changeColor {0.0-1.0} {0.0-1.0}\n!changeBrightness {1-100}\n !item {item name} (binding of isaac only)"
  );
}

async function changeLightColor(x, y) {
  updateLightWithOptions({ xy: [x, y] });
}

async function createAlert() {
  updateLightWithOptions({ alert: "lselect" });
}

async function turnLightRed() {
  changeLightColor(0.6531, 0.2834);
}

async function turnLightBlue() {
  changeLightColor(0.139, 0.081);
}

async function turnLightOff() {
  updateLightWithOptions({ on: false });
}

async function turnLightOn() {
  updateLightWithOptions({ on: true });
}

function chatChangesColor(target, xyvalues) {
  splitMessage = xyvalues.split(" ");

  if (splitMessage.length != 3) {
    client.say(target, "You did the command wrong dummy. Do !changeColor x y");
  }

  xValue = splitMessage[1];
  yValue = splitMessage[2];

  if (
    isValueFloatBetweenZeroAndOne(xValue) &&
    isValueFloatBetweenZeroAndOne(yValue)
  ) {
    changeLightColor(xValue, yValue);
  } else {
    client.say(target, "You didn't pass in two float values between 0 and 1");
  }
}

function isValueFloatBetweenZeroAndOne(value) {
  let numberValue = Number(value);
  isFloat = numberValue == value && value % 1 !== 0;
  if (isFloat) {
    return numberValue > 0 && numberValue < 1;
  } else {
    return false;
  }
}

function changeBrightness(target, msg) {
  if (msg.split(" ").length != 2) {
    client.say(target, "You're a dummy");
  } else {
    let originalValue = msg.split(" ")[1];
    let numberValue = Number(originalValue);

    if (
      numberValue == originalValue &&
      numberValue >= 1 &&
      numberValue <= 100
    ) {
      brightness = numberValue / 100;
      actualBrightness = brightness * 254;
      updateLightWithOptions({ bri: actualBrightness });
    }
  }
}

async function updateLightWithOptions(options) {
  const results = await v3.discovery
    .nupnpSearch()
    .then((searchResults) => {
      const host = searchResults[0].ipaddress;
      return v3.api.createLocal(host).connect(USERNAME);
    })
    .then((api) => {
      return api.lights.setLightState(LIGHT_ID, options);
    });
}

//Binding Of Isaac Items Functions
function getItemInfo(target, msg) {
  messageArray = msg.split(" ");
  messageWithoutCommand = messageArray.splice(1);

  itemDescription = boiData[messageWithoutCommand.join(" ").toLowerCase()];

  if (itemDescription != null) {
    client.say(target, itemDescription);
  }
}

client.connect();
