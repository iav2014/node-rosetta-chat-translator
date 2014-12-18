var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var async = require('async');
var path = require('path');
var request = require('request');
var devices = [];
var SUBSCRIPTION = 0,SEND_MESSAGE = 1, LOCAL_PORT= 3000;

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'index.html'));
});
io.sockets.on('close',function (socket){
     console.log('on close detected');
} );
io.sockets.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log(msg);
    switch(msg.evt){
      case SUBSCRIPTION:
        var l=devices.length;
        for(var i=0;i<l;i++){
          if(msg.nick === devices[i].nick){
            devices[i].socket.emit('subscription confirm', {nick:msg.nick,language:msg.language,data:'rosseta: you already stay here'});
            console.log('subscription already confirmed');
            break;
          }
        }
        if(i===l){
          io.emit('subscription confirm', {nick:msg.nick,language:msg.language,data:'rosseta chat subscription successful!'});
          devices.push({socket:socket,nick:msg.nick,language:msg.language});
          console.log('new subscription confirm ');
        }
      break;
      case SEND_MESSAGE:
        async.forEach(devices,function(item,end) {
          if(item.nick !== msg.nick){
            translate(msg.data,msg.language,item.language,function(err,result){
              item.socket.emit("chat message",result);
              console.log('msg chat sent')
             end;
            });
          }
          },
          function (err) {
            console.log('async loop done!',err);
          }
        );
      break;
    }
  });
});

http.listen(LOCAL_PORT, function(){
  console.log('rosetta server listening on *:'+LOCAL_PORT);
  console.log('try http://localhost:'+LOCAL_PORT);
});

function translate(msg,from,to,callback){

  request('http://translate.google.com/translate_a/t?client=t&text='+msg+'&hl='+from+'&sl='+from+'&tl='+to+'&ie=UTF-8&oe=UTF-8&multires=1&otf=1&ssel=3&tsel=3&sc=1'
, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        callback(null,body.substring(4,body.indexOf('","')))
    }
  })
}


