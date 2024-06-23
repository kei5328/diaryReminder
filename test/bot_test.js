function TalkApiTest(){
    const talk = new TalkAPi();
    const input = "こんにちは。";
    const resp = talk.getResponse(input);
    console.log(resp);
}

function OpenAiApiTest(){
  const ai = new OpenAi();
  const input = "肩凝ったんやけどどうしたらいいと思う？";
  const resp = ai.getResponse(input);
  console.log(resp);
}