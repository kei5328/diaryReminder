// utility functions

function testcovert()
{
  var latest_entry = StreakManager.getLatestEntryDate();
  var latest_tz = latest_entry.timezone;
  var curr_date = new Date();
  //let curr_date_str = curr_date.toLocaleString('en-US', {timeZone: "US/Pacific", hour12: false});

  //let up_date = new Date(curr_date_str);
  var input_date = TimeZoneManager.convertTZ(curr_date, latest_tz);
  var system_date = TimeZoneManager.convertTZ(curr_date, PropertiesService.getScriptProperties().getProperty("TZ"));
  Logger.log(input_date);
  Logger.log(system_date);
  //Logger.log(up_date);
  //Logger.log(curr_date);

/*
  let new_one = new Date(curr_date.toLocaleDateString('en-US', {timeZone: "US/Pacific"}));
  Logger.log(new_one);
  */
}

function parseUSLocaleString()
{
  let input_str = '12/21/2022, 22:23:41'
  let tmp = new Date(input_str);
  Logger.log(tmp);

  let parsedNums = input_str.split(',');
  let dates = parsedNums[0].split('/'); 
  let time = parsedNums[1].split(':');

  for (d in dates)
  {
    Logger.log(parseInt(dates[d]));
    Logger.log(parseInt(time[d]));

  }
  //Logger.log(parseInt(dates[0]));
  //Logger.log(time); 
  
  var upd_date = new Date(parseInt(dates[2]), parseInt(dates[0]),parseInt(dates[1]), parseInt(time[0]),parseInt(time[1]),parseInt(time[2]));
  Logger.log(upd_date);
}

// This function returns true if current time is at specified hour of the day. 
function atSpecHour(specHour)
{
  var date = new Date();
  date = TimeZoneManager.convertTZ(date,PropertiesService.getScriptProperties().getProperty("TZ"));
  date.setMinutes(date.getMinutes() + 30); // round the time to nearest hour. 
  return (date.getHours()==specHour)
}
