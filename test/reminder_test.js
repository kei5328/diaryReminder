function testReminder(){
    const rem = new Reminder();
    for (let i = 0; i < 3; i++){
        console.log(rem.getRemindMsg(i));
    }
    rem.sendReminder();
}