//****GLOBALS****
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SpreadsheetID");
var SHEET_NAME = PropertiesService.getScriptProperties().getProperty("SheetName");
const ACCESSTOKEN = PropertiesService.getScriptProperties().getProperty("ACCESSTOKEN");
const myLineID = PropertiesService.getScriptProperties().getProperty("MY_ID");
const remindMsg = "Have you input your diary yet? Don't lose your streak! Do it now from here: " +  PropertiesService.getScriptProperties().getProperty("DIARY_FORM_LINK");


function testSendStreakMessage()
{
  printOutMessage("hello");
  //sendStreakMessage(0);
}

/**
 * Creates a trigger for when a spreadsheet opens.
 * @see https://developers.google.com/apps-script/guides/triggers/installable
 */
function createSpreadsheetEditTrigger() 
{
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  ScriptApp.newTrigger("latestEntry")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
}


// this function returns true if current time is at specified hour of the day. 
function atSpecHour(specHour)
{
  var date = new Date();
  date = convertTZ(date,PropertiesService.getScriptProperties().getProperty("TZ"));
  return (date.getHours()==specHour)
}

// this function checks the latest entry of the diary and update the status.  
// if the latest input is not from today and hasLatestEntry field is true, decrease the current streak value by 1. 
function updateLatestEntryStatusByData()
{
  var latest_entry = getLatestEntryDate();
  var latest_date = latest_entry.latest_date;
  var latest_tz = latest_entry.timezone;
  let status = PropertiesService.getScriptProperties().getProperty("hasLatetEntry");
  if (noTodayEntry(latest_date, latest_tz))
  {
    if (status==="true")
    {
      let curr_streak = parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"));
      if (curr_streak>0) PropertiesService.getScriptProperties().setProperty("curr_streak", curr_streak-1);
    }
    PropertiesService.getScriptProperties().setProperty("hasLatestEntry", false);
  }
  else 
  {
    if (status==="false")
    {
      let curr_streak = parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"));
      PropertiesService.getScriptProperties().setProperty("curr_streak", curr_streak+1);
    }
    PropertiesService.getScriptProperties().setProperty("hasLatestEntry", true);
  }
}

// this funciton updates the hasLatestEntry field: when we have the input through the form to the spreadsheet. 
function latestEntry()
{
  Logger.log("Latest Entry function was run ");
  let status = PropertiesService.getScriptProperties().getProperty("hasLatestEntry");
  var curr_streak = parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"));

  if (status === "false")
  {
    PropertiesService.getScriptProperties().setProperty("hasLatestEntry", true);
    PropertiesService.getScriptProperties().setProperty("curr_streak", curr_streak+1);
    sendStreakMessage(curr_streak); // send teh 
  }
  checkLatestTz();
}

// this function checks the latest entry and check if the timezone is different from the systems tz. 
function checkLatestTz()
{
  // let's check if the latest entry is has the same timezone as the set timezone. 
  var latest_entry = getLatestEntryDate();
  var latest_tz = latest_entry.timezone;
  Logger.log(latest_tz);
  if (latest_tz!="")
  {
    var curr_date = new Date();
    var input_date = convertTZ(curr_date, latest_tz);
    var system_date = convertTZ(curr_date, PropertiesService.getScriptProperties().getProperty("TZ"));
    if (input_date.getHours()!=system_date.getHours() || input_date.getMinutes()!=input_date.getMinutes())
    {
      sendTzUpdateSuggestion(latest_tz);
    }
  }
}


// this function gets the latest entry(bottom row) date of the spreadsheet. 
function getLatestEntryDate()
{
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  var sheet = ss.getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow(); // get the last row number 
  var latest_date;
  var tz; 
  if (lastRow>1)
  {
    latest_date = sheet.getRange(lastRow, 1).getValue(); // get the latest entry cell. 
    tz = sheet.getRange(lastRow, 2).getValue(); 
  }
  else 
  {
    latest_date = "";
    tz = "";
  }
  Logger.log("tz of the latest input: " + tz);
  return {
    'latest_date': latest_date,
    'timezone': tz
  };
}

// main reminder function. 
function myFunction() {
  if (atSpecHour(parseInt(PropertiesService.getScriptProperties().getProperty("REMINDER_TIME")))==false) 
    return; 
  var latest_entry = getLatestEntryDate();
  var latest_date = latest_entry.latest_date;
  var latest_tz = latest_entry.timezone;
  let has_latest_entry = PropertiesService.getScriptProperties().getProperty("hasLatestEntry");
  Logger.log("latest entry status: " + has_latest_entry);
  Logger.log(latest_date + "," + latest_tz + " is the latest entry");
  if (has_latest_entry=='false')
  {
    const payload = {
      to: myLineID,
      messages: [
        { type: 'text', text: remindMsg }
      ]
    };
    sendMsg(payload); // sends a line message: 
  }
  else
    Logger.log("Today's input is already in");  
}

// checks if the latest entry was from today. 
// returns true if there was no entry from today(or future dates). false otherwise. 
function noTodayEntry(latest_date, tz_string)
{
    // convert the input date(raw) with tz string 
    var cnv_latest_date = convertTZ(latest_date, tz_string);
    var date = new Date();
    date = convertTZ(date,PropertiesService.getScriptProperties().getProperty("TZ"));
    Logger.log("current date our: " + date.getHours());
    Logger.log("latest input year is: " + latest_date.getFullYear() + "," + latest_date.getMonth() + "," + latest_date.getDay());
     Logger.log("converted input year is: " + cnv_latest_date.getFullYear() + "," + cnv_latest_date.getMonth() + "," + cnv_latest_date.getDay());
    
    // the entry is available from today or future date: return true. 
    var hasTodayEntry = (cnv_latest_date>=date); 
    hasTodayEntry |= (cnv_latest_date.getFullYear()===date.getFullYear() && cnv_latest_date.getMonth()===date.getMonth() && cnv_latest_date.getDay()===date.getDay());
    Logger.log("Result: " + hasTodayEntry);
    return !hasTodayEntry;
}

/*
This function needs to be run after midnight;  
*/
function checkForStreaks()
{
  if (atSpecHour(parseInt(PropertiesService.getScriptProperties().getProperty('STREAK_CHECK_TIME')))==false) 
    return; 
  if (PropertiesService.getScriptProperties().getProperty("hasLatestEntry"))
  {
    var curr_streak = parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"));
    var max_streak = parseInt(PropertiesService.getScriptProperties().getProperty("max_streak"));
    if (max_streak<curr_streak) // update the max streak
      PropertiesService.getScriptProperties().setProperty("max_streak", curr_streak);
  }
  else 
    PropertiesService.getScriptProperties().setProperty("curr_streak", 0);
  // after the last run, reset the latest entry field. 
  PropertiesService.getScriptProperties().setProperty("hasLatestEntry", false);
}

// utility functions
function convertTZ(date, tzString) 
{
  return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
}

// this function sets the new time zone. 
function updateTZ(tz)
{
  if (PropertiesService.getScriptProperties().getProperty('TZ')!=tz)
  {
    PropertiesService.getScriptProperties().setProperty('TZ', tz);
    Logger.log("new tz was set to: " + tz);
    updateLatestEntryStatusByData();
    return true; 
  }
  else 
    return false; 
}

/* message handling */
// this function sends a reminder via Line Bot 
function sendMsg(payload)
{
    const PUSH_URL = 'https://api.line.me/v2/bot/message/push';
    const params = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + ACCESSTOKEN
      },
      payload: JSON.stringify(payload)
    };
    UrlFetchApp.fetch(PUSH_URL, params);
}

// handling when message was sent from the user. 
function doPost(e) {
  var events = JSON.parse(e.postData.contents).events;
  events.forEach(function(event) {
    if((event.type == "message"))
    {
      if (event.message.type == "text")
      {
        replyTextMsg(event);
      }
      else if (event.message.type == "location")
      {
        Logger.log(event);
        replyLocationMsg(event);
      }
    }
    else if (event.type == "postback")
    {
      if (event.source.userId == myLineID)
      {
        let newTz = event.postback.data;
        if (newTz!="noTzUpdate")
        {
          updateTZ(newTz);
          replyTimeZoneUpadate(event, true);
        }
        else
          replyTimeZoneUpadate(event, false);
      }
    }
  });
}

function replyTimeZoneUpadate(event, updated)
{
  const REPLY_URL = "https://api.line.me/v2/bot/message/reply";
  var response;
  if (updated)
    response = "Timezone has been updated to " + event.postback.data;
  else 
    response = "Timezone was not updated.";
  const payload = {
      "replyToken": event.replyToken,
      "messages": [{
        "type": "text",
        "text": response,
      }],
    };
  const params = {
    "headers": {
      "Content-Type": "application/json; charset=UTF-8",
      "Authorization": "Bearer " + ACCESSTOKEN,
    },
    "method": "post",
    "payload": JSON.stringify(payload),
  }
  UrlFetchApp.fetch(REPLY_URL, params);
}

// this function handles the location message sent from user.
// if it's my ID, sends the confirmation message for updating the tz. if not, let the user know their tz. 
function replyLocationMsg(event)
{
  const REPLY_URL = "https://api.line.me/v2/bot/message/reply";
  var response;
  var payload;
  let newTz = getTzFromMessage(event);
  if (newTz=="-1")
  {
    response = "we can't get your timezone at this moment..... ";
    payload = {
      "replyToken": event.replyToken,
      "messages": [{
        "type": "text",
        "text": response,
    }],
    };
  }
  else if (event.source.userId != myLineID)
  {// other than the user
      response = "your timezone is: " + newTz;
      payload = {
      "replyToken": event.replyToken,
      "messages": [{
        "type": "text",
        "text": response,
      }],
      };
  }
  else 
  {
      response = "your timezone is: " + newTz;
      payload = {
      "replyToken": event.replyToken,
      "messages": [{
        "type": "template",
        "altText" : "Confirmation message",
        "template": {
          "type": "confirm",
          "text": "Do you want to update the timezone to " +  newTz  + "?",
          "actions": [
            {
              "type": "postback",
              "label": "Yes",
              "data": newTz,
              "displayText": "Yes, update to " + newTz,
            },
            {
              "type": "postback",
              "label": "No",
              "data": "noTzUpdate",
              "displayText": "No, cancel update.",
            }
          ]
        }
      }],
      };
  }
  const params = {
    "headers": {
      "Content-Type": "application/json; charset=UTF-8",
      "Authorization": "Bearer " + ACCESSTOKEN,
    },
    "method": "post",
    "payload": JSON.stringify(payload),
  }
  UrlFetchApp.fetch(REPLY_URL, params);
}

function getTzFromMessage(event)
{
  let MY_GOOGLE_KEY = PropertiesService.getScriptProperties().getProperty("GOOGLE_MAP_API_KEY");
  
  let lat = event.message.latitude; 
  let lon = event.message.longitude;
  //let lat = "54.6034810"; // comments used for testing the functionality. 
  //let lon = "-119.6822510";
  let url = "https://maps.googleapis.com/maps/api/timezone/json?location=" + lat +"%2C" + lon + "&timestamp=1331161200&key=" + MY_GOOGLE_KEY;
  try
  {
    let res = UrlFetchApp.fetch(url);
    Logger.log(res);
    res = JSON.parse(res);
    return res.timeZoneId;
  }
  catch (err)
  {
    Logger.log(err);
    return "-1";
  }
}

// this function obtains the response from the recruite talk api. 
function getResponseFromTalkApi(input_str)
{
    const TALK_URL="https://api.a3rt.recruit.co.jp/talk/v1/smalltalk";
    const payload = {
      'apikey': PropertiesService.getScriptProperties().getProperty("TALK_API_KEY"),
      'query' : input_str
    };
    let params = {
      'method': 'post',
      'payload': payload
    };
    let response = "";
    try
    {
      let res = UrlFetchApp.fetch(TALK_URL, params).getContentText();
      Logger.log(res);
      res = JSON.parse(res);
      if (res.status==0) response = res.results[0].reply;
    }
    catch (err)
    {
      console.error(err);
      response = "いまはちょっとはなせません。。。ごめんね。";
    }
    Logger.log("お前:" + input_str + "\n AI:" + response);
    return response;
}

function getResponseFromFumitanQuotes()
{
  var quotes = JSON.parse(PropertiesService.getScriptProperties().getProperty("FumiQuotes"));
  var idx = Math.floor(Math.random() * quotes.length);
  Logger.log("idx=" + idx + ", response=" + quotes[idx]);
  return quotes[idx];
}
function getResponseFromKeiQuotes()
{
  var quotes = JSON.parse(PropertiesService.getScriptProperties().getProperty("KeiQuotes"));
  var idx = Math.floor(Math.random() * quotes.length);
  Logger.log("idx=" + idx + ", response=" + quotes[idx]);
  return quotes[idx];
}

// reply to the message sent.  
function replyTextMsg(event) {
  const REPLY_URL = "https://api.line.me/v2/bot/message/reply";
  // get the response from talk api. 
  let response =""
  if (event.message.text.startsWith("ふみた"))
    response = getResponseFromFumitanQuotes();
  else if (event.message.text.startsWith("けいち"))
    response = getResponseFromKeiQuotes(); 
  else 
    response = getResponseFromTalkApi(event.message.text);
  const payload = {
      "replyToken": event.replyToken,
      "messages": [{
        "type": "text",
        "text": response,
      }],
    };
  const params = {
    "headers": {
      "Content-Type": "application/json; charset=UTF-8",
      "Authorization": "Bearer " + ACCESSTOKEN,
    },
    "method": "post",
    "payload": JSON.stringify(payload),
  }
  UrlFetchApp.fetch(REPLY_URL, params);
}
// this function sends the tailored streak message depending on the streak number. 
function sendStreakMessage(curr_streak)
{
  // get new streak payload
    var payload;
    if ((curr_streak+1)%100==0)// every 100 days of streaks. 
    {
      Logger.log("100s days");
      payload = {
      to: myLineID,
      messages: [
        {
          "type": "text",
          "text": "AMAZING! YOU'VE EXTENDED YOUR HABIT TO " + (curr_streak+1) + " DAYS!!"
        },
        {
          "type": "sticker",
          "packageId": "446",
          "stickerId": "1989"
        }
      ]
      };
    }
    else if ((curr_streak+1)%7==0) // every week 
    {
      var weeks = (curr_streak+1)/7;
      weeks = 3;
      var st = (weeks>1) ? "s" : "";
      var stickerId = "";
      const stickerList = [10855, 10857, 10859, 10863, 10866, 10867, 10869, 10870, 10871, 10873, 10874, 10892, 10868, 10878];
      var idx = weeks%stickerList.length;
      payload = {
      to: myLineID,
      messages: [
        {
          "type": "text",
          "text": "WONDERFUL! Now you've completed " + weeks + " week" + st +"("+ (curr_streak+1) +  "days)" + " of dairy habit."
        },
        {
          "type": "sticker",
          "packageId": "789",
          "stickerId": stickerId + stickerList[idx]
        }
      ]
      };
    }
    else if (curr_streak+1>1) // from 2nd days. 
    {
       payload = {
      to: myLineID,
      messages: [
        {
          "type": "text",
          "text": "GREAT! You did it again! Now you have " + (curr_streak+1) + " days of dairy habit being built up."
        }
      ]
      };
    }
    else // the first day.  
    {
      payload = {
      to: myLineID,
      messages: [
        {
          "type": "text",
          "text": "You just had the first amazing step for your habit! Let's see how long you can continue!"
        }
      ]
      };
    }
    sendMsg(payload);
}

function sendTzUpdateSuggestion(latest_tz)
{
  const text = "Your latest input may have a different timezone(" + latest_tz  + ") as the system timezone("+ PropertiesService.getScriptProperties().getProperty("TZ") + "). If you'd like to change it, please send the location via line.";
      const q_reply = {
        "type": "action", // ④
        "action": {
          "type": "location",
          "label": "Send location"
        }
      };
      const payload = {
      to: myLineID,
      messages: [
        { type: 'text', 
          text: text, 
           "quickReply": { // ②
            "items": [q_reply]
         }
        }
      ]
    };
  sendMsg(payload);
}