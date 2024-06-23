class Reminder{
    constructor(){
      this.rem_time = parseInt(PropertiesService.getScriptProperties().getProperty("REMINDER_TIME"));
      this.streak_manager_ = new StreakManager();
      this.message_sender_ = new LineMessageSender();
      this.prop_manager_ = new PropertyManager();
    }
    /**
     * Gets the reminder message from list.
     * @param {*} idx 
     * @returns string
     */
    getRemindMsg(idx){
      const NEXT_STREAK = (parseInt(PropertiesService.getScriptProperties().getProperty("curr_streak"))+1);
      const DIARY_FORM_LINK = PropertiesService.getScriptProperties().getProperty("DIARY_FORM_LINK");
      const remindMsg = ["Have you input your diary yet? Don't lose your streak and make it " +  NEXT_STREAK + " consecutive days! Do it now from here: " +  DIARY_FORM_LINK, 
        "Don't forget to input your diary. You don't wanna miss it. You can input it from here, eazy peezy: " + DIARY_FORM_LINK, 
        "Hey, this might be your last chance to get your streak going to "+ NEXT_STREAK + "days. Input your diary now: " +  DIARY_FORM_LINK];
      return remindMsg[idx];
    }
  
    /**
     * Sends a reminder if it's the time specified by the property.
     * @returns 
     */
    sendReminder(){
      var shift=-1; 
      for (let i = 0; i < 3; i++) 
      {
        if (atSpecHour(this.rem_time+i)===true)
        {
          shift = i; 
          break; 
        }
      }
      if (shift<0) return; 
      var latest_entry = StreakManager.getLatestEntryDate();
      var latest_date = latest_entry.latest_date;
      var latest_tz = latest_entry.timezone;
      let has_latest_entry = PropertiesService.getScriptProperties().getProperty("hasLatestEntry");
      Logger.log("latest entry status: " + has_latest_entry);
      Logger.log(latest_date + "," + latest_tz + " is the latest entry");
      if (has_latest_entry=='false')
      {
        const payload = {
          to: this.prop_manager_.MY_ID,
          messages: [
            { type: 'text', text: this.getRemindMsg(shift)}
          ]
        };
        this.message_sender_.sendMessage(payload); // sends a line message: 
      }else{
        Logger.log("Today's input is already in");  
      }
    }
  }
  