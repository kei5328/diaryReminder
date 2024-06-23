/**
 * This function gets run when the new entry gets inserted into the spreadsheet. 
 */
function latestEntry()
{
  const streak_manager = new StreakManager();
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

    streak_manager.sendStreakMessage(curr_streak); // send the streak update message.
  }
  TimeZoneManager.checkLatestTz();
}

/**
 * This function gets run every one hour. This is the main reminder function.
 * @returns 
 */
function myFunction() {
  const reminder = new Reminder();
  reminder.sendReminder();
}

/**
 * This function gets run after midnight to keep track of the streak. 
 * @returns 
 */
function checkForStreaks()
{
  if (atSpecHour(parseInt(PropertiesService.getScriptProperties().getProperty('STREAK_CHECK_TIME')))==false) 
    return; 
  const streak_manager = new StreakManager();
  streak_manager.updateStreak();
}

/* message handling */
// handling when message was sent from the user. 
function doPost(e) {
  var events = JSON.parse(e.postData.contents).events;
  events.forEach(function(event) {
    const message_handler = new MessageHandler();
    message_handler.handleMessage(event);
  });
}
