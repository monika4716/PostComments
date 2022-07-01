
/**** Listen all message from popup and background*****/
chrome.runtime.onMessage.addListener(function(message,sender,senderResponse){
	if(message.type == 'getLoggedInId' && message.from == 'background'){
		if(message.loggedInUserId != undefined && message.loggedInUserId != '' && message.loggedInUserId != 0){
			console.log('post Screen show');
			$('.tabs').hide();
    		$('#post-screen').show();
    		$('#save-post-btn').text('Processing...');

    		chrome.storage.local.get(['postStorage'],function(result){
    			if(result.postStorage != undefined && result.postStorage != ''){
    				$('#message').val(result.postStorage.message);
    				$('#save-post-btn').text('Processing...');
    				$('#post_url').val(result.postStorage.url);
    				if (result.postStorage.keywords != null) {
			            if (result.postStorage.keywords.value != '') {
			                var keywordsArray = result.postStorage.keywords;
			                keywordsArray.forEach(function(item) {
			                    $('#post-keyword').tagsinput('add', item);
			                })
			            }
			        }
    			}else{
    				$('#save-post-btn').text('Save');
    			}
    		})
		}else{
			console.log('Please login');
			$('.tabs').hide();
    		$('#login-screen').show();
    		$('#login-screen').html('<a class="btn" href="https://facebook.com" target="/blank"><button>Please login facebook</button></a>');
		}
	}
})

/****** Check active tab facebook page and display popup according****/
chrome.tabs.query({
    	active: true,
    	currentWindow: true
	}, function(tabs) {
    	if(tabs[0].url.indexOf('facebook.com') > -1){
    		console.log('on facebook page');
    		chrome.runtime.sendMessage({'type':'getActiveUser','from':'popup'});
    	}else{
    		$('.tabs').hide();
    		$('#facebook-screen').show();
			$('#facebook-screen').html('<a class="btn" href="https://facebook.com" target="/blank"><button>Open facebook page</button></a>');
    	}
	}
)

/****Popup action perform and details save in storage-> postStorage****/
$('#save-post-btn').on('click',function(){
	$(this).text('Processing...');
	keywords  = [];
	var postUrl  = $.trim($('#post_url').val());
	var message = $('#message').val();
	$("#post-keyword option").each(function() {
	  keywords.push($(this).val().toLowerCase());
	});
	var data = {};
	data.keywords = keywords;
	data.message = message;
	data.url = postUrl;
	chrome.runtime.sendMessage({'type':'postUrl','data':data});
	chrome.storage.local.set({'postStorage':data});
	setTimeout(()=>{
		window.close();
	},1000);
})
