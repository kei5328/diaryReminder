/*const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SpreadsheetID");
const SHEET_NAME = PropertiesService.getScriptProperties().getProperty("SheetName");
const ACCESSTOKEN = PropertiesService.getScriptProperties().getProperty("ACCESSTOKEN");
const myLineID = PropertiesService.getScriptProperties().getProperty("MY_ID");
const remindMsg = "Have you input your diary yet? Don't lose your streak! Do it now from here: " +  PropertiesService.getScriptProperties().getProperty("DIARY_FORM_LINK");
*/
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

function replyMsg(payload)
{
  const REPLY_URL = "https://api.line.me/v2/bot/message/reply";
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

function replyTimeZoneUpadate(event, updated)
{
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
  replyMsg(payload);
}

// this function handles the location message sent from user.
// if it's my ID, sends the confirmation message for updating the tz. if not, let the user know their tz. 
function replyLocationMsg(event)
{
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
  replyMsg(payload);
}


function matchTest()
{
  // get the response from talk api.
  //= /[A-Z]/g;
  const kei_exp = /streak/g; 
  const fu_exp = /ふみ(た|ざ(ぶろう|えもん))/g;

  var text = "ふみざぶろう";

  if(text.match(kei_exp)!=null)
    Logger.log(text + " match with kei");
  else if (text.match(fu_exp)!=null)
  {
    Logger.log(text + " match with fu");
  }
  else 
  {
    Logger.log(text + " does not match");
  }
}

// reply to the message sent.  
function replyTextMsg(event) {
  // get the response from talk api.
  const kei_exp = /けい(ち|すけ)/g; 
  const fu_exp = /ふみ(た|ざ(ぶろう|えもん))/g;
  const st_exp = /(streak|record|information|記録.*教え)/g;
  let response =""
  if (event.message.text.startsWith("ふみた")　|| (event.message.text.match(fu_exp)!=null))
    response = getResponseFromFumitanQuotes();
  else if (event.message.text.startsWith("けいち") || (event.message.text.match(kei_exp)!=null))
    response = getResponseFromKeiQuotes(); 
  else if (event.message.text.match(st_exp)!=null)
    response = getResponseForStreak();
  else 
    response = getResponseFromTalkApi(event.message.text);
  const payload = {
      "replyToken": event.replyToken,
      "messages": [{
        "type": "text",
        "text": response,
      }],
    };
  replyMsg(payload);
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
      var st = (weeks>1) ? "s" : "";
      var stickerId = "";
      const stickerList = [10855, 10857, 10859, 10863, 10866, 10867, 10869, 10870, 10871, 10873, 10874, 10892, 10868, 10878];
      var idx = weeks%stickerList.length;
      payload = {
      to: myLineID,
      messages: [
        {
          "type": "text",
          "text": "WONDERFUL! Now you've completed " + weeks + " week" + st +"("+ (curr_streak+1) +  "days)" + " of diary habit."
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
          "text": "GREAT! You did it again! Now you have " + (curr_streak+1) + " days of diary habit being built up."
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
function sendMissedStreakMsg()
{
      payload = {
      to: myLineID,
      messages: [
        {
          "type": "text",
          "text": "日記、つけ忘れましたね。。。。もう後がないですよ。。。明日は絶対に忘れずにするのです。。。"
        },
        {
          "type": "sticker",
          "packageId": "446",
          "stickerId": "2005"
        }
      ]
      };
}