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
    this.open_ai_api_ = new OpenAi();
    this.reserve_ = new CarReserveHandler();
  }

  generateReplyFromResp(event, response){
    const payload = {
      "replyToken": event.replyToken,
      "messages": [{
        "type": "text",
        "text": response,
      }],
    };
    return payload;
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
    const car_exp = /(reserve the car|車を使う|車を予約)/g;


    // Initialize payload
    let payload; 
    if (event.message.text.startsWith("ふみた") || (event.message.text.match(fu_exp)!=null)){
      const response = this.getResponseFromFumitanQuotes();
      payload = this.generateReplyFromResp(event, response);
    }else if (event.message.text.startsWith("けいち") || (event.message.text.match(kei_exp)!=null)){
      const response = this.getResponseFromKeiQuotes(); 
      payload = this.generateReplyFromResp(event, response);
    }else if (event.message.text.match(st_exp)!=null){
      const response = this.getResponseForStreak();
      payload = this.generateReplyFromResp(event, response);
    }else if (event.message.text.startsWith("車を")|| event.message.text.startsWith("くるまを") || event.message.text.match(car_exp)!=null){
      // For car reserve, we have to reply the button.
      payload = this.generateCarReservePayload(event);
    }else{
      const response = this.open_ai_api_.getResponse(event.message.text);
      payload = this.generateReplyFromResp(event, response);
    }
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
                "data": "action=tzUpdate&newTz=" + newTz,
                "displayText": "Yes, update to " + newTz,
              },
              {
                "type": "postback",
                "label": "No",
                "data": "action=tzUpdate&newTz=-1",
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


  generateReserveListResponse(user_id){
    var upcoming = this.reserve_.getUserUpcoming(user_id);
    let i = 0;
    let response = "";
    if (upcoming.length == 0){
      response = "まだ予約はしてないよ。"
    }else{
      upcoming.sort(function(a, b) {
        const sortColumnIndex = 3;
        if (a[sortColumnIndex] < b[sortColumnIndex]) {
          return -1;
        }
        if (a[sortColumnIndex] > b[sortColumnIndex]) {
          return 1;
        }
        return 0;
      });
      response = "予約が入ってる日付は\n"
      for (let row of upcoming){
        let map = this.reserve_.parseRow(row);
        response  = response + "" + this.generateDateStringFromInt(map.get("reserve_date_int")) + "\n";
      }
      response = response + "だよ。";
    }
    return response; 
  }
  /**
   * 
   */
  generateReserveCancelCarousel(event){
    let user_id  = event.source.userId;
    var upcoming = this.reserve_.getUserUpcoming(user_id);
    upcoming.sort(function(a, b) {
      const sortColumnIndex = 3;
      if (a[sortColumnIndex] < b[sortColumnIndex]) {
        return -1;
      }
      if (a[sortColumnIndex] > b[sortColumnIndex]) {
        return 1;
      }
      return 0;
    });
    let columns = [];
    for (let row of upcoming){
      let map = this.reserve_.parseRow(row);
      let raw_date = map.get("reserve_date_int");
      let text  = this.generateDateStringFromInt(raw_date);


      let column = {
          title: text,
          text: text + "の予約をキャンセルする?",
          "actions": [
              {
                "type": "postback",
                "label": "Cancel",
                "data": "action=carReserveCancel&id=" + map.get("id") + "&day=" + raw_date,
              },
            ]
      };
      columns.push(column);
    }
    
    var payload = {
      "replyToken": event.replyToken,
      "messages":[{
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
          "type": "carousel",
          "columns": columns,
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }]
    }
    return payload;
  }

  generateDateStringFromInt(date_int){
    let int_str = "" + date_int;
    return int_str.substring(0, 4) + "/" + int_str.substring(4,6) + "/" + int_str.substring(6,8);
  }
  /**
   * 
   */
  generateReserveCancelCarouselMessage(user_id){
    var upcoming = this.reserve_.getUserUpcoming(user_id);
    upcoming.sort(function(a, b) {
      const sortColumnIndex = 3;
      if (a[sortColumnIndex] < b[sortColumnIndex]) {
        return -1;
      }
      if (a[sortColumnIndex] > b[sortColumnIndex]) {
        return 1;
      }
      return 0;
    });
    let columns = [];
    for (let row of upcoming){
      let map = this.reserve_.parseRow(row);
      let raw_date = map.get("reserve_date_int");
      let text  = this.generateDateStringFromInt(raw_date);


      let column = {
          title: text,
          text: text + "の予約をキャンセルする?",
          "actions": [
              {
                "type": "postback",
                "label": "Cancel",
                "data": "action=carReserveCancel&id=" + map.get("id") + "&day=" + raw_date,
              },
            ]
      };
      columns.push(column);
    }
    
    var payload = {
      "to": this.prop_manager_.MY_ID,
      "messages":[{
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
          "type": "carousel",
          "columns": columns,
          "imageAspectRatio": "rectangle",
          "imageSize": "cover"
        }
      }]
    }
    return payload;
  }


  /**
   * 
   */
  generateCarReservePayload(event){
    var payload = {
      "replyToken": event.replyToken,
      "messages": [{
      "type": "template",
      "altText": "this is a buttons template",
      "template": {
          "type": "buttons",
          "title": "車つかう？",
          "text": "Please select",
          "actions": [
              {
                "type": "datetimepicker",
                "label": "つかう！",
                "mode": "date",
                "data": "action=carReserve&selectId=1"
              },
              {
                "type": "postback",
                "label": "いまは予約しない。",
                "data": "action=carReserve&selectId=2"
              },
              {
                "type": "postback",
                "label": "予約をキャンセルする。",
                "data": "action=carReserve&selectId=3"
              },
              {
                "type": "postback",
                "label": "いつ予約してたか確認する。",
                "data": "action=carReserve&selectId=4"
              },
          ]
      }
    }]};
    return payload;
  }

  generateReservePayload(){
      let payload = {
      "to": this.prop_manager_.MY_ID,
      "messages": [{
      "type": "template",
      "altText": "this is a buttons template",
      "text": "some text",
      "template": {
          "type": "buttons",
          "title": "車使う？",
          "text": "Please select",
          "actions": [
              {
                "type": "datetimepicker",
                "label": "OK",
                "mode": "date",
                "data": "action=carReserve&selectId=1"
              },
              {
                "type": "postback",
                "label": "いまは予約しない。",
                "data": "action=carReserve&selectId=2"
              },
              {
                "type": "postback",
                "label": "Cancel Existing",
                "data": "action=carReserve&selectId=3"
              },
              {
                "type": "postback",
                "label": "List upcoming",
                "data": "action=carReserve&selectId=4"
              },
          ]
      }
    }]};
    return payload;

  }
  /**
   * This function parses action string and returns a map
   * @param {string} action_str 
   */
  parsePostBackAction(action_str){
    const query_params = action_str.split("&");
    const action_map = new Map();
    for (const q of query_params){
      console.log(q);
      const p = q.split("=");
      action_map.set(p[0], p[1]);
    }
    return action_map;
  }
  /**
   * 
   * @param {*} event 
   */
  sendReserveMessage(event, response){
      let payload = this.generateReplyFromResp(event, response);
      this.message_sender_.replyMessage(payload);
  }
  /**
   * 
   */
  handlePostBack(event){
    const paramsString = event.postback.data;
    const action_map = this.parsePostBackAction(paramsString);
    if (action_map.has("action")){
      const action = action_map.get("action");
      if (action == "tzUpdate"){
        this.message_sender_.sendMessage(genPayloadFromMsg("tzUpdate"));
        if (event.source.userId == this.prop_manager_.MY_ID){
          if (action_map.has("newTz")){
            const new_tz = action_map.get("newTz");
            if (new_tz == "-1"){
              this.replyTimeZoneUpdate(event, false);
            }else{
              TimeZoneManager.updateTZ(newTz);
              this.replyTimeZoneUpdate(event, true);
            }
          }
        }
      }else if(action == "carReserve"){
        if (true /* TODO: implement the function to check the registered user id */ ){
          
          if (action_map.has("selectId")){
            const select_id = action_map.get("selectId");
            if (parseInt(select_id) == 1){
              // Reserve the car
              const user_date_str = event.postback.params.date;
              this.message_sender_.sendMessage(genPayloadFromMsg(user_date_str));
              const date_res = user_date_str.split('-');
              const date_int = parseInt(date_res[0])*10000 + parseInt(date_res[1])*100 + parseInt(date_res[2]);
              const result = this.reserve_.addNew(date_int, event.source.userId);
              if (result == "Success"){
                // Send success 
                const response =  "カローラを\n" + user_date_str + "\nに予約したよ。\n";
                this.sendReserveMessage(event, response);
              }else{
                // Send others
                const response = "Failed to make a reservation because " + result;
                this.sendReserveMessage(event, response);
              }
            }else if (parseInt(select_id) == 2){
              // Do not reserve a car.
              const response = "また気が向いたら予約してね。";
              this.sendReserveMessage(event, response);
            }else if (parseInt(select_id) == 3){
              // Cancel existing reservation. 
              // Generate carousel. 
              let payload = this.generateReserveCancelCarousel(event);
              this.message_sender_.replyMessage(payload);
            }else if (parseInt(select_id) == 4){
              // List upcoming
              const response = this.generateReserveListResponse(event.source.userId);
              this.sendReserveMessage(event, response);
            }else{

            }
          }
        }
      }else if(action == "carReserveCancel"){
        const id = parseInt(action_map.get("id"));
        const cancel_date = action_map.get("day");
        const cancelled_date_str = this.generateDateStringFromInt(parseInt(cancel_date));
        const result = this.reserve_.cancelExisting(id, event.source.userId);
        const res_map = this.reserve_.getReservationFromId(id);
        
        if (result == "Success"){
          if (res_map.get("active")){
            const response = cancelled_date_str + "\nの予約のキャンセルに失敗したみたい…ごめんね。管理者に連絡してみて。";
            this.sendReserveMessage(event, response);
          }else{
            const response = cancelled_date_str + "\nの予約をキャンセルしたよ。";
            this.sendReserveMessage(event, response);
          }
        }else{
          const response = "Failed to cancel\n" + cancelled_date_str + "\nreservation because " + result;
        }
      }
    }
  }
  /**
   * Handles the post event from the user.
   * @param {*} event 
   */
  handleMessage(event){
    if((event.type == "message")){
        if (event.message.type == "text"){
          this.handleTextMessage(event);
        }else if (event.message.type == "location"){
          Logger.log(event);
          this.handleLocationMessage(event);
        }
      }else if (event.type == "postback"){
        this.handlePostBack(event);
      }
    }
}

