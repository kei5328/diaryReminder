function streakTest(){
    const streak = new StreakManager();
    const latest_entry = StreakManager.getLatestEntryDate();
    console.log(latest_entry['latest_date']);
    console.log(latest_entry['timezone']);

    streak.sendMissedStreakMsg();
    const days = [1, 7, 100, 700];
    for (let i = 0; i < days.length; i++){
        streak.sendStreakMessage(days[i]-1);
    }
    const res = streak.noTodayEntry(latest_entry['latest_date'], latest_entry['timezone']);
    console.log(res);
}