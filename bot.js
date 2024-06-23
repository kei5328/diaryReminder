class Bot{
    constructor(api_key, url){
        this.api_key = api_key;
        this.url = url
    }
}

class TalkAPi extends Bot{
    constructor(){
        const TALK_URL="https://api.a3rt.recruit.co.jp/talk/v1/smalltalk";
        const TALK_API_KEY = PropertiesService.getScriptProperties().getProperty("TALK_API_KEY")
        super(TALK_API_KEY, TALK_URL);
    }
  /**
   * Gets the response from the talk api.
   * @param {str} input_str 
   * @returns response
   */
    getResponse(input_str){
        const payload = {
          'apikey': this.api_key,
          'query' : input_str
        };
        let params = {
          'method': 'post',
          'payload': payload
        };
        let response = "";
        try
        {
          let res = UrlFetchApp.fetch(this.url, params).getContentText();
          Logger.log(res);
          res = JSON.parse(res);
          if (res.status==0) response = res.results[0].reply;
        }
        catch (err)
        {
          console.error(err);
          response = "いまはちょっとはなせません。。。ごめんね。";
        }
        Logger.log("お前:" + input_str + "\n AI:" + response);
        return response;
    }
}