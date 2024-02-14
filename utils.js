// utility functions

function testcovert()
{
  var latest_entry = getLatestEntryDate();
  var latest_tz = latest_entry.timezone;
  var curr_date = new Date();
  //let curr_date_str = curr_date.toLocaleString('en-US', {timeZone: "US/Pacific", hour12: false});

  //let up_date = new Date(curr_date_str);
  var input_date = convertTZ(curr_date, latest_tz);
  var system_date = convertTZ(curr_date, PropertiesService.getScriptProperties().getProperty("TZ"));
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


function convertTZ(date, tzString) 
{
  //Logger.log(date);
  //Logger.log(tzString);
  let temp = date.toLocaleString('en-US', { timeZone: tzString,  hour12: false});
  Logger.log(temp);
  let new_date = new Date(temp);
  //Logger.log(new_date);
  return new_date;
  //var new_date = new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
  //Logger.log(new_date);
  //return new_date;
}

// this function returns true if current time is at specified hour of the day. 
function atSpecHour(specHour)
{
  var date = new Date();
  date = convertTZ(date,PropertiesService.getScriptProperties().getProperty("TZ"));
  date.setMinutes(date.getMinutes() + 30); // round the time to nearest hour. 
  return (date.getHours()==specHour)
}
