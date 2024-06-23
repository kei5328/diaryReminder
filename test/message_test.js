function genPayloadFromMsg(response){
    const prop = new PropertyManager();
    const payload = {
        "to": prop.MY_ID,
        "messages": [{
          "type": "text",
          "text": response,
        }],
      };
    return payload;
}

function testMessage(){
    const msg_handler = new MessageHandler();
    const msg_sender = new LineMessageSender();
    const payload = msg_handler.getResponseForStreak();
    console.log(payload);
    msg_sender.sendMessage(genPayloadFromMsg(payload));
    const payload_f = msg_handler.getResponseFromFumitanQuotes();
    msg_sender.sendMessage(genPayloadFromMsg(payload_f));
    const payload_k = msg_handler.getResponseFromKeiQuotes();
    msg_sender.sendMessage(genPayloadFromMsg(payload_k));
}