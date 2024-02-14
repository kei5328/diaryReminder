//****GLOBALS****
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SpreadsheetID");
const SHEET_NAME = PropertiesService.getScriptProperties().getProperty("SheetName");
const ACCESSTOKEN = PropertiesService.getScriptProperties().getProperty("ACCESSTOKEN");
const myLineID = PropertiesService.getScriptProperties().getProperty("MY_ID");
const remindMsg = ["Have you input your diary yet? Don't lose your streak and make it " +  (parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"))+1) + " consecutive days! Do it now from here: " +  PropertiesService.getScriptProperties().getProperty("DIARY_FORM_LINK"), 
  "Don't forget to input your diary. You don't wanna miss it. You can input it from here, eazy peezy: " + PropertiesService.getScriptProperties().getProperty("DIARY_FORM_LINK"), 
  "Hey, this might be your last chance to get your streak going to "+ (parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"))+1) + "days. Input your diary now: " +  PropertiesService.getScriptProperties().getProperty("DIARY_FORM_LINK")];


function testSendStreakMessage()
{
  //printOutMessage("hello");
  //printOutMessage(atSpecHour(parseInt(PropertiesService.getScriptProperties().getProperty("REMINDER_TIME"))+1));
  sendStreakMessage(6);
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
  var real_streak = parseInt(PropertiesService.getScriptProperties().getProperty("real_streak"));

  if (status === "false")
  {
    PropertiesService.getScriptProperties().setProperty("hasLatestEntry", true);
    PropertiesService.getScriptProperties().setProperty("curr_streak", curr_streak+1);
    if (real_streak < 30)
      PropertiesService.getScriptProperties().setProperty("real_streak", real_streak+1);

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
    if (input_date.getHours()!=system_date.getHours() || input_date.getMinutes()!=system_date.getMinutes())
    {
      Logger.log("input date: " + latest_tz);
      Logger.log("system date: " + PropertiesService.getScriptProperties().getProperty("TZ"));
      Logger.log("system_date hour" + system_date.getHours() + ",input date hours: "+ input_date.getHours());
      //sendTzUpdateSuggestion(latest_tz);
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
  Logger.log("time of the latest input: " + latest_date);
  
  return {
    'latest_date': latest_date,
    'timezone': tz
  };
}

// main reminder function. 
function myFunction() {
  const rem_time = parseInt(PropertiesService.getScriptProperties().getProperty("REMINDER_TIME"));
  var shift=-1; 
  for (let i = 0; i < 3; i++) 
  {
    if (atSpecHour(rem_time+i)===true)
    {
      shift = i; 
      break; 
    }
  }
  if (shift<0) return; 
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
        { type: 'text', text: remindMsg[shift] }
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
  
  var curr_grace = parseInt(PropertiesService.getScriptProperties().getProperty("grace_period"));
  Logger.log(curr_grace);
  if (PropertiesService.getScriptProperties().getProperty("hasLatestEntry")=="true")
  {
    var curr_streak = parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"));
    var max_streak = parseInt(PropertiesService.getScriptProperties().getProperty("max_streak"));
    // you can earn grace period every 7 consecutive successful entry, upto 4 
    var real_streak = parseInt(PropertiesService.getScriptProperties().getProperty("real_streak"));
    if (real_streak>0 && real_streak%7==0)
    {
      if (curr_grace<4)
        PropertiesService.getScriptProperties().setProperty("grace_period", curr_grace+1); 
    }

    if (max_streak<curr_streak) // update the max streak
      PropertiesService.getScriptProperties().setProperty("max_streak", curr_streak);
  }
  else if(curr_grace>0)
  {
    PropertiesService.getScriptProperties().setProperty("grace_period", curr_grace-1);
    PropertiesService.getScriptProperties().setProperty("real_streak", 0);
    sendMissedStreakMsg();
  }
  else 
  {
    PropertiesService.getScriptProperties().setProperty("curr_streak", 0);
    PropertiesService.getScriptProperties().setProperty("real_streak", 0);
  }
  // after the last run, reset the latest entry field. 
  PropertiesService.getScriptProperties().setProperty("hasLatestEntry", false);
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

// constructs a response with the current streak informaiton with the lastet input. 
function getResponseForStreak()
{
  var response = "";
  var latest_entry = getLatestEntryDate();
  var latest_date = latest_entry.latest_date;
  var curr_streak = parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"));
  if (latest_date=="")// no entry at all
    response = "まだ日記のエントリーがありません。";
  else 
  {
    response = "今" + curr_streak + "日連続で日記を続けています。\n最後のエントリーは" + latest_date + "です。";
    if (PropertiesService.getScriptProperties().getProperty("hasLatestEntry") == "true")
    {
      response += "明日も是非とも日記をつけましょう！";
    }
    else 
    {
      response += "今日も一日の最後に日記をつけましょう！リマインドしますね。";
    }
  }
  Logger.log(response);
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

