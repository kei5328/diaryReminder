class StreakManager{
    constructor(){
      this.message_sender_ = new LineMessageSender();
      this.prop_manager_ = new PropertyManager();
    }
    /**
     * This method checks the latest entry of the diary from the spreadsheet and returns the date and timezone.
     * @returns 
     */
    static getLatestEntryDate()
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
    /**
     * Sends the message for missed streak.
     */
    sendMissedStreakMsg()
    {
        var payload = {
        to: this.prop_manager_.MY_ID,
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
      this.message_sender_.sendMessage(payload);
    }
    /**
     * Sends the message for updated streak.
     * @param {int} curr_streak 
     */
    sendStreakMessage(curr_streak)
    {
      // get new streak payload
        var payload;
        if ((curr_streak+1)%100==0)// every 100 days of streaks. 
        {
          Logger.log("100s days");
          payload = {
          to: this.prop_manager_.MY_ID,
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
          to: this.prop_manager_.MY_ID,
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
          to: this.prop_manager_.MY_ID,
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
          to: this.prop_manager_.MY_ID,
          messages: [
            {
              "type": "text",
              "text": "You just had the first amazing step for your habit! Let's see how long you can continue!"
            }
          ]
          };
        }
        this.message_sender_.sendMessage(payload);
    }
    /**
     * Checks if the latest entry was from today. returns true if there was no entry from today(or future dates). false otherwise.
     * @param {*} latest_date 
     * @param {string} tz_string 
     * @returns {boolean} hasTodayEntry
     */
    noTodayEntry(latest_date, tz_string)
    {
        // convert the input date(raw) with tz string 
        var cnv_latest_date = TimeZoneManager.convertTZ(latest_date, tz_string);
        var date = new Date();
        date = TimeZoneManager.convertTZ(date,PropertiesService.getScriptProperties().getProperty("TZ"));
        Logger.log("current date our: " + date.getHours());
        Logger.log("latest input year is: " + latest_date.getFullYear() + "," + latest_date.getMonth() + "," + latest_date.getDay());
        Logger.log("converted input year is: " + cnv_latest_date.getFullYear() + "," + cnv_latest_date.getMonth() + "," + cnv_latest_date.getDay());
        
        // the entry is available from today or future date: return true. 
        var hasTodayEntry = (cnv_latest_date>=date); 
        hasTodayEntry |= (cnv_latest_date.getFullYear()===date.getFullYear() && cnv_latest_date.getMonth()===date.getMonth() && cnv_latest_date.getDay()===date.getDay());
        Logger.log("Result: " + hasTodayEntry);
        return !hasTodayEntry;
    }
    /**
     *This function checks the latest entry of the diary and update the status. If the latest input is not from today and hasLatestEntry field is true, decrease the current streak value by 1. 
     */
    updateLatestEntryStatusByData()
    {
      var latest_entry = StreakManager.getLatestEntryDate();
      var latest_date = latest_entry.latest_date;
      var latest_tz = latest_entry.timezone;
      let status = PropertiesService.getScriptProperties().getProperty("hasLatetEntry");
      if (this.noTodayEntry(latest_date, latest_tz))
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
    /**
     * Updates the streak, to be called at the EOD.
     */
    updateStreak(){
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
    
        if (max_streak<curr_streak) // Update the max streak
          PropertiesService.getScriptProperties().setProperty("max_streak", curr_streak);
      }
      else if(curr_grace>0)
      {
        PropertiesService.getScriptProperties().setProperty("grace_period", curr_grace-1);
        PropertiesService.getScriptProperties().setProperty("real_streak", 0);
        this.sendMissedStreakMsg();
      }
      else 
      {
        PropertiesService.getScriptProperties().setProperty("curr_streak", 0);
        PropertiesService.getScriptProperties().setProperty("real_streak", 0);
      }
      // after the last run, reset the latest entry field. 
      PropertiesService.getScriptProperties().setProperty("hasLatestEntry", false);
    }
  }