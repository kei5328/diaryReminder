class PropertyManager{
    constructor(){
        this.ACCESSTOKEN = PropertiesService.getScriptProperties().getProperty("ACCESSTOKEN");
        this.DIARY_FORM_LINK = PropertiesService.getScriptProperties().getProperty("DIARY_FORM_LINK");
        this.FumiQuotes = PropertiesService.getScriptProperties().getProperty("FumiQuotes");
        this.GOOGLE_MAP_API_KEY = PropertiesService.getScriptProperties().getProperty("GOOGLE_MAP_API_KEY");
        this.KeiQuotes = PropertiesService.getScriptProperties().getProperty("KeiQuotes");
        this.MY_ID = PropertiesService.getScriptProperties().getProperty("MY_ID");
        this.REMINDER_TIME = PropertiesService.getScriptProperties().getProperty("REMINDER_TIME");
        this.REPLY_URL = PropertiesService.getScriptProperties().getProperty("REPLY_URL");
        this.STREAK_CHECK_TIME = PropertiesService.getScriptProperties().getProperty("STREAK_CHECK_TIME");
        this.SheetName = PropertiesService.getScriptProperties().getProperty("SheetName");
        this.SpreadsheetID = PropertiesService.getScriptProperties().getProperty("SpreadsheetID");
        this.TZ = PropertiesService.getScriptProperties().getProperty("TZ");
        this.curr_streak = PropertiesService.getScriptProperties().getProperty("curr_streak");
        this.grace_period = PropertiesService.getScriptProperties().getProperty("grace_period");
        this.hasLatestEntry = PropertiesService.getScriptProperties().getProperty("hasLatestEntry");
        this.max_streak = PropertiesService.getScriptProperties().getProperty("max_streak");
        this.real_streak = PropertiesService.getScriptProperties().getProperty("real_streak");
        this.car_reserve_sheet_id = PropertiesService.getScriptProperties().getProperty("CAR_RESERVE_SHEET_ID");
        this.car_reserve_sheet_name = PropertiesService.getScriptProperties().getProperty("CAR_RESERVE_SHEET_NAME");
        this.reserve_check_time = PropertiesService.getScriptProperties().getProperty("RESERVE_CHECK_TIME");
        this.registered_id = JSON.parse(PropertiesService.getScriptProperties().getProperty("registered_id"));
        this.registered_user_set = new Set();
        for (let id of this.registered_id){
            this.registered_user_set.add(id);
        }
    }
}

