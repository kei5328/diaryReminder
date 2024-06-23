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

class OpenAi extends Bot{
constructor(){
    const OPEN_AI_URL = 'https://api.openai.com/v1/chat/completions';
    const OPEN_AI_API_KEY = PropertiesService.getScriptProperties().getProperty("OPEN_AI_API_KEY")
    super(OPEN_AI_API_KEY, OPEN_AI_URL);
    this.model_list = ['gpt-3.5-turbo', 'gpt-4o'];
}
/**
* Gets the response from the talk api.
* @param {str} input_str 
* @returns response
*/
getResponse(input_str){
  var payload = {
    model: this.model_list[1],
    messages: [{"role": "user", "content": input_str}],
    temperature: 0.7,
    max_tokens: 1000,
  };

  var options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + this.api_key,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };

  try {
    var response = UrlFetchApp.fetch(this.url, options);
    Logger.log(response);
    var json = JSON.parse(response.getContentText());
    Logger.log(json);
    if (response.getResponseCode() == 200) {
      let resp = json.choices[0].message.content.trim();
      let resp2 = json.choices[0].message.content;
      
      Logger.log('Response from GPT-3.5 Turbo:' + json.choices[0].message.content.trim());
      Logger.log('Response from GPT-3.5 Turbo:' + resp2);

      return resp;
    } else {
      Logger.log('Error: ' + response.getResponseCode() + ' - ' + json.error.message);
    }
  } catch (e) {
    Logger.log('Failed to fetch the response. Please check your API key and try again.');
    Logger.log('Error: ' + e.message);
  }
}
}