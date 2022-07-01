var keywords = [];
var PostUrlTabId = 0;
var window_height = 0;
var window_width = 0;
var welcomeMessageText = '';
var url = '';
var message = '';
chrome.windows.getAll({populate : true}, function (list) {
    window_height = list[0].height;
    window_width = list[0].width;
});

//chrome.storage.local.set({'postStorage':''});

/******************** Message listerner********************/
chrome.runtime.onMessage.addListener(function(message,sender,senderResponse){
    console.log(message);
    console.log(sender);
	if(message.type == 'getActiveUser' && message.from == 'popup'){
        console.log('getActiveUser received');  
		GetFacebookLoginId();
	}else if(message.type == 'postUrl'){
        console.log('postUrl received');
        data = message.data;
        openPostWindow(data);
    }else if(message.type == 'closeWindow' && message.from == 'contentScript'){
        console.log('closeWindow received');  
        chrome.tabs.remove(sender.tab.id);
        chrome.storage.local.set({'postStorage':''});
    }else if(message.type == 'sendMessage' && message.from == 'contentScript'){
        console.log('sendMessage received');
        welcomeMessageText = message.message;
        var userFbId = message.userId;
        setTimeout(()=>{
            openMessengerWindow(userFbId);
        },500);
    }else if(message.type == 'closeRequestMessageTab'){
        console.log('closeRequestMessageTab received');
        chrome.tabs.remove(sender.tab.id);
    }
})

/***** Open messenger window with url m.facebook.com******/
function openMessengerWindow(userFbId){
    if(userFbId){
        var sendWelcomeMeesageUrl = "https://m.facebook.com/messages/compose/?ids="+userFbId;
        windowSetting = {
            url: sendWelcomeMeesageUrl,
            focused: false,
            type: "popup",
            top: Math.floor(window_height / 4 * 3),
            left: Math.floor(window_width / 4 * 3),
            height: Math.floor(window_height / 4),
            width: Math.floor(window_width / 4)
        };
        chrome.windows.create(windowSetting, function(tabs) {
            postMessageTabId = tabs.tabs[0].id;
            chrome.tabs.onUpdated.addListener(messageTabListener);
        });
    }
}

/* messenger window url update tab listener and send message to contenscript*/
function messageTabListener(tabId, changeInfo, tab){
    if (changeInfo.status === "complete" && tabId === postMessageTabId) {
       console.log(welcomeMessageText);
        setTimeout(() => {
            chrome.tabs.sendMessage(postMessageTabId, { from: 'background', subject: 'triggerRequestMessage', welcomeMessageText: welcomeMessageText });
        },2000);
        chrome.tabs.onUpdated.removeListener(messageTabListener);
    }
}

/***************** On Install Listener****************************/
chrome.runtime.onInstalled.addListener(function() {
    chrome.alarms.create('forActiveState', {periodInMinutes:1/60})
    return true;
});


/***************** Alarms Listener****************************/
chrome.alarms.onAlarm.addListener(function( alarm ) {
    if(alarm.name == 'forActiveState'){
        chrome.storage.local.get(["timer"],function(res){
            const time = res.timer ?? 0;
            chrome.storage.local.set({timer:time+1})
        })
        console.log('wake up service worker');
    }
});


/**
  # Get Both ids of Logged in user.
  # Check Url - https://www.facebook.com/help to get atleast one id( numeric or alphanumeric).
**/
function GetFacebookLoginId() {   
    return fetch('https://www.facebook.com/help').then(function (response) {
        return response.text();
    }).then(function (text) {
        var loggedInUserId = text.match(/"USER_ID":"(.*?)"/)[1];  
        console.log(loggedInUserId);     
        if(loggedInUserId != 0 && loggedInUserId != '') {
        	chrome.storage.local.set({ fb_id: loggedInUserId});
        	chrome.runtime.sendMessage({'type':'getLoggedInId','from':'background','loggedInUserId':loggedInUserId });
        }else {
            chrome.runtime.sendMessage({'type':'getLoggedInId','from':'background','loggedInUserId':loggedInUserId });
        }
    });
}

/***** Open post url window******/

function openPostWindow(data){
    console.log(data);
    url = data.url;
    message = data.message;
    keywords = data.keywords;
    mobileViewUrl = new URL(url);
    postUrl = '';
    
    if(url.indexOf('/posts/') > -1){
        console.log('if posts');
        mobileViewUrl = new URL(url);
        postUrl = "https://m.facebook.com"+mobileViewUrl.pathname;
    }else if(url.indexOf('/permalink/')){
        console.log('else permalink');
        mobileViewUrl = new URL(url);
        console.log(mobileViewUrl);
        postUrl = "https://m.facebook.com"+mobileViewUrl.pathname+mobileViewUrl.search;
    }else{
        console.log('post url not right');
    }

    if(postUrl != ''){
        windowSetting = {
            url: postUrl,
            focused: false,
            type: "popup",
            top: Math.floor(window_height / 4 * 3),
            left: Math.floor(window_width / 4 * 3),
            height: Math.floor(window_height / 4),
            width: Math.floor(window_width / 4)
        };
        chrome.windows.create(
        windowSetting, function(tabs) {
            PostUrlTabId = tabs.tabs[0].id;
            chrome.tabs.onUpdated.addListener(postUrlTabListener);
        });  
    }
} 

/******* Post url update tab listener and send message to contenscript*******/
function postUrlTabListener(tabId, changeInfo, tab){
    if (changeInfo.status === "complete" && tabId === PostUrlTabId) {
        chrome.tabs.sendMessage(PostUrlTabId, { from: 'background', type: 'startReadingPost',message:message,keywords:keywords});
        chrome.tabs.onUpdated.removeListener(postUrlTabListener);
    }
}
