function TalkApiTest(){
    const talk = new TalkAPi();
    const input = "こんにちは。";
    const resp = talk.getResponse(input);
    console.log(resp);
}