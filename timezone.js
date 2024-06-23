class TimeZoneManager{
    constructor(){
    }
    // This function sets the new time zone.
    static updateTZ(tz){
      if (PropertiesService.getScriptProperties().getProperty('TZ')!=tz)
        {
          PropertiesService.getScriptProperties().setProperty('TZ', tz);
          Logger.log("new tz was set to: " + tz);
          const streak_manager_ = new StreakManager();
          streak_manager_.updateLatestEntryStatusByData();
          return true; 
        }
        else 
          return false; 
    }
    static convertTZ(date, tzString) 
    {
      let temp = date.toLocaleString('en-US', { timeZone: tzString,  hour12: false});
      Logger.log(temp);
      let new_date = new Date(temp);
      return new_date;
    }
    static getTzFromMessage(event)
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
    static checkLatestTz()
    {
        // let's check if the latest entry is has the same timezone as the set timezone. 
        var latest_entry = getLatestEntryDate();
        var latest_tz = latest_entry.timezone;
        Logger.log(latest_tz);
        if (latest_tz!="")
        {
            var curr_date = new Date();
            var input_date = TimeZoneManager.convertTZ(curr_date, latest_tz);
            var system_date = TimeZoneManager.convertTZ(curr_date, PropertiesService.getScriptProperties().getProperty("TZ"));
            if (input_date.getHours()!=system_date.getHours() || input_date.getMinutes()!=system_date.getMinutes())
            {
                Logger.log("input date: " + latest_tz);
                Logger.log("system date: " + PropertiesService.getScriptProperties().getProperty("TZ"));
                Logger.log("system_date hour" + system_date.getHours() + ",input date hours: "+ input_date.getHours());
                //sendTzUpdateSuggestion(latest_tz);
            }
        }
    }
  }