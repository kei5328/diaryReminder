/**
 * Simple class to send and reply messages. 
 */
class LineMessageSender{
  constructor(){
    this.prop_manager_ = new PropertyManager();
    this.push_url = "https://api.line.me/v2/bot/message/push";
    this.reply_url = "https://api.line.me/v2/bot/message/reply";
    this.access_token = this.prop_manager_.ACCESSTOKEN;
  }
  sendMessage(payload){
   
    const params = {
      method: 'post',
      contentType: "application/json; charset=UTF-8",
      headers: {
        Authorization: 'Bearer ' + this.access_token,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };
    const res = UrlFetchApp.fetch(this.push_url, params);
    Logger.log(res);
  }
  replyMessage(reply_payload){
    const params = {
      "headers": {
        "Content-Type": "application/json; charset=UTF-8",
        "Authorization": "Bearer " + this.access_token,
      },
      "method": "post",
      "payload": JSON.stringify(reply_payload),
    }
    UrlFetchApp.fetch(this.reply_url, params);
  }
}

class MessageHandler{
  constructor(){
    this.message_sender_ = new LineMessageSender();
    this.prop_manager_ = new PropertyManager();
    this.talk_api_ = new TalkAPi();
  }

  /**
   * Handles the text message event from the user and makes a reply based on the condition.
   * @param {*} event 
   */
  handleTextMessage(event){
    // get the response from talk api.
    const kei_exp = /けい(ち|すけ)/g; 
    const fu_exp = /ふみ(た|ざ(ぶろう|えもん))/g;
    const st_exp = /(streak|record|information|記録.*教え)/g;
    let response =""
    if (event.message.text.startsWith("ふみた") || (event.message.text.match(fu_exp)!=null))
      response = this.getResponseFromFumitanQuotes();
    else if (event.message.text.startsWith("けいち") || (event.message.text.match(kei_exp)!=null))
      response = this.getResponseFromKeiQuotes(); 
    else if (event.message.text.match(st_exp)!=null)
      response = this.getResponseForStreak();
    else 
      response = this.talk_api_.getResponseFromTalkApi(event.message.text);
    const payload = {
        "replyToken": event.replyToken,
        "messages": [{
          "type": "text",
          "text": response,
        }],
      };
    this.message_sender_.replyMessage(payload);
  }
  /**
   * Handles the location event from the user and makes a reply.
   * @param {*} event 
   */
  handleLocationMessage(event){
    var response;
    var payload;
    let newTz = TimeZoneManager.getTzFromMessage(event);
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
    else if (event.source.userId != this.prop_manager_.MY_ID)
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
    this.message_sender_.replyMessage(payload);
  }

  /**
   * Handles the post back event from the user for updating the timezone.
   * @param {*} event 
   * @param {boolean} updated 
   */
  replyTimeZoneUpdate(event, updated)
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
      message_sender_.replyMessage(payload);
  }
  /**
   * Checks the status of the diary and makes a response.
   * @returns response(payload)
   */
  getResponseForStreak()
  {
    var response = "";
    var latest_entry = StreakManager.getLatestEntryDate();
    var latest_date = latest_entry.latest_date;
    var curr_streak = parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"));
    if (latest_date=="")// no entry at all
      response = "まだ日記のエントリーがありません。";
    else 
    {
      response = "今" + curr_streak + "日連続で日記を続けています。最後のエントリーは" + latest_date + "です。";
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
  /**
   * Makes a response from a list of quotes. 
   * @returns response(payload)
   */
  getResponseFromFumitanQuotes()
  {
    var quotes = JSON.parse(PropertiesService.getScriptProperties().getProperty("FumiQuotes"));
    var idx = Math.floor(Math.random() * quotes.length);
    Logger.log("idx=" + idx + ", response=" + quotes[idx]);
    return quotes[idx];
  }
  /**
   * Makes a response from a list of quotes. 
   * @returns response(payload)
   */
  getResponseFromKeiQuotes()
  {
    var quotes = JSON.parse(PropertiesService.getScriptProperties().getProperty("KeiQuotes"));
    var idx = Math.floor(Math.random() * quotes.length);
    Logger.log("idx=" + idx + ", response=" + quotes[idx]);
    return quotes[idx];
  }
  /**
   * Handles the post event from the user.
   * @param {*} event 
   */
  handleMessage(event){
    if((event.type == "message"))
      {
        if (event.message.type == "text")
        {
          this.handleTextMessage(event);
        }
        else if (event.message.type == "location")
        {
          Logger.log(event);
          this.handleLocationMessage(event);
        }
      }
      else if (event.type == "postback")
      {
        if (event.source.userId == this.prop_manager_.MY_ID)
        {
          let newTz = event.postback.data;
          if (newTz!="noTzUpdate")
          {
            TimeZoneManager.updateTZ(newTz);
            this.replyTimeZoneUpdate(event, true);
          }
          else
            this.replyTimeZoneUpdate(event, false);
        }
      }
    }
}

// this function sends the tailored streak message depending on the streak number. 
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
      to: this.prop_manager_.MY_ID,
      messages: [
        { type: 'text', 
          text: text, 
           "quickReply": { // ②
            "items": [q_reply]
         }
        }
      ]
    };sendMsg
  (payload);
}