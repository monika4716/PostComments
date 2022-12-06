var totalComentorsArray = [];
var keywords = [];
var	counter = 0;
var delay = 5000; 
var postMessage = '';
var userFbId = '';
var profileName = '';
var userName = '';
var commentProgressPopUp = `<div class="text"><h3>Send Reply</h3></div>
							<div class="text"><h2><span id="processed-members-one">0</span> <i>of</i> <span class="total-friends-one" id="limit">0</span></h2></div>
							<div class="block" id="post_comment-msgs">Processing</div>`;

$("body").append('<div  id="overlay-one"><div id="post_comment_model"><div id="post_comment_model_content">'+commentProgressPopUp+'</div></div></div>');

/************************ click event ***************************/
jQuery.fn.extend({
	'mclick': function () {
		var click_event = document.createEvent('MouseEvents')
		click_event.initMouseEvent("click", true, true, window,
        0, 0, 0, 0, 0,
        false, false, false, false,
        0, null);
		return $(this).each(function () {
			$(this)[0].dispatchEvent(click_event)
		})
	}	
});

/************************ Listener ***************************/
chrome.runtime.onMessage.addListener(function(message,sender,senderResponse){
	console.log(message);
	if(message.type == 'startReadingPost'){
		keywords = message.keywords;
		postMessage = message.message;
		startLoadingComments(keywords);
	}else if(message.from == 'background' && message.subject == 'triggerRequestMessage'){
		welcomeMessageText = message.welcomeMessageText;
		triggerRequestSendMessage(welcomeMessageText);
	}
})

/************** Trigger message (input - message text) **************/
function triggerRequestSendMessage(welcomeMessageText) {
	isNameSet = setInterval(()=>{
		if ($('.mToken').length > 0 && $('.mToken').text().length > 0) {
			clearInterval(isNameSet)
			$('textarea').val(welcomeMessageText);
			setTimeout(()=>{		
				setTimeout(()=>{
					if ($('button[name="Send"]').length > 0) {
						$('button[name="Send"]').mclick();
					}else if($('input[name="Send"]').length > 0){
						$('input[name="Send"]').mclick();
					}
					setTimeout(()=>{
						chrome.runtime.sendMessage({'type': "closeRequestMessageTab"});
					},1000);
				}, 200)
								
			},2000);
		}else{
			chrome.runtime.sendMessage({'type': "closeRequestMessageTab"});
		}
	},200)
	setTimeout(()=>{
		console.log('close');	
	},30000);
}

/*****Start loading main comments and replied comments too *********/


function startLoadingComments(keywords) {



	profileName = $.trim($('.story_body_container header:eq(0)').find('strong a').text());

	
	console.log('startLoadingComments : '+profileName);
	if ($('a:contains("View previous")').length > 0 || $('a:contains("View more comments")').length > 0) {
		console.log('if');
		if($('a:contains("View previous")').length > -1){
			$('a:contains("View previous")').mclick(); 
		}else{
			$('a:contains("View more comments")').mclick();	
		}
		var foundNewComments = setInterval(()=>{
			if ($('div[data-sigil="comment"]:not("add-comment-list-item")').length > 0) {
				clearInterval(foundNewComments);
				startLoadingComments(); 
			}
		}, 200)
	}else{
		/**************** Get all main comment Div**********************************/
		totalMainComments = $('div[data-sigil="comment"]:not("add-comment-list-item")').length;
		$('div[data-sigil="comment"]:not("add-comment-list-item")').each(function (currentIndex) {
			multiplier = currentIndex+1;
			/*show progress on popup*/
			progrssBarPopupOnPost(counter, totalMainComments);
			setTimeout(()=>{
				$(this).addClass('add-comment-list-item');
				console.log($(this));
				repliedDiv = $(this).find('a:contains(replied)');
				/*If there replied comments*/
				if(repliedDiv.length > 0){
					/*get all replied comments*/
					console.log('in repliedDiv')
					counter = counter+1;
					/*show progress on popup*/
					progrssBarPopupOnPost(counter, totalMainComments,userName)
					$(this).find('a:contains(replied)').mclick();
					setTimeout(()=>{
						var childDiv =$(this).find('.composerClosed').parent().prev();
						childDiv.find('div[data-commentid]').each(function(item){
							if(profileName != $.trim($(this).prev().find('a').text())){
								console.log('last comment by another profile');
								userFbIdhref = $(this).prev().find('a').attr('href');
								userName = $(this).prev().find('a').text();
								/*get users fbId*/
								if(userFbIdhref != undefined){
									if(userFbIdhref.indexOf('profile.php') > -1){
										userFbIdArray = userFbIdhref.split('?id=');
										userFbIdArray = userFbIdArray[1].split('&');
										userFbId = userFbIdArray[0];
									}else{
										userFbIdArray = userFbIdhref.split('?');
										userFbIdArray = userFbIdArray[0].split('/');
										userFbId = userFbIdArray[1];
									}
								}
								console.log('userFbId : '+userFbId);	
								console.log('userName : '+userName);	
								comment = $.trim($(this).text().toLowerCase());
								selectorBtn = $(this).parent().parent().next('div').find('a:contains(Reply)');
								/*show progress on popup*/
								progrssBarPopupOnPost(counter, totalMainComments,userName)
								/*get vaild comment after check keywords*/
								getValidComment(comment,selectorBtn,$(this));
							}else{
								console.log('last comment by same profile')
							}
						})
					},2000);
				}else{
					/*************Scrap main comments*******************/
					counter=counter+1;
					console.log($(this).find('div[data-commentid]'));
					userName = $.trim($(this).find('div[data-commentid]').prev().find('a').text());
					userFbIdhref = $(this).find('div[data-commentid]').prev().find('a').attr('href');
					if(userFbIdhref){
						if(userFbIdhref.indexOf('profile.php') > -1){
							if(userFbIdhref.indexOf('?id=') > -1){
								userFbIdArray = userFbIdhref.split('?id=');
								userFbIdArray = userFbIdArray[1].split('&');
								userFbId = userFbIdArray[0];
							}
							
						}else{
							userFbIdArray = userFbIdhref.split('?');
							userFbIdArray = userFbIdArray[0].split('/');
							userFbId = userFbIdArray[1];
						}
					}
					console.log('userFbId : '+userFbId);
					console.log('userName : '+userName);
					progrssBarPopupOnPost(counter, totalMainComments,userName)
					comment = $.trim($(this).find('a:eq(1)').parent().next('div').text().toLowerCase());
					selectorBtn = $(this).find('a:contains(Reply)');
					getValidComment(comment,selectorBtn,$(this));
				}
			},delay);
			delay = parseInt(delay)+ 10000;
		});
	}
}

/*****get vaild comments
	comment-> scrap comment text
	selectorBtn-> reply button selector
	selectedComment-> main selected div
******/
function getValidComment(comment,selectorBtn,selectedcomment){
	console.log('for getValidComment');
	var validComment = true;
	if(keywords.length > 0){
		if(comment != ''){
			matched = keywords.filter((item) => comment.indexOf(item) > -1);
			//console.log(matched);
			if(matched.length == 0){
			 validComment = false;
			}
		}	
		if (validComment){
			console.log('validComment : '+validComment);
			selectorBtn.mclick();
			setTimeout(()=>{
				selectedTextArea = selectedcomment.find('textarea');
				if(selectedTextArea.length == 0){
					selectedTextArea = selectedcomment.parent().parent().parent().parent().parent().next('div').find('textarea');
				}
				if(selectedTextArea.length > 0){
					var evt = new Event('input', {
						bubbles: true  
					});
					var inputArray = selectedTextArea;
					var input = inputArray[0];
					input.innerHTML = postMessage;
					input.dispatchEvent(evt);
					selectedTextArea.text(postMessage);
					setTimeout(()=>{
						var selectedReplyBtn = selectedcomment.find('button[type="submit"][value="Reply"]');
						if(selectedReplyBtn.length == 0){
							selectedReplyBtn = selectedcomment.parent().parent().parent().parent().parent().next('div').find('button[type="submit"][value="Reply"]');
						}
						if(selectedReplyBtn.length > 0){
							selectedReplyBtn.addClass('clicked');
							selectedReplyBtn.mclick();
							setTimeout(()=>{
								selectedReplyBtn.mclick();
								selectedTextArea.text('');
								if(sendMessageEnable){
									console.log('sendMessage');
									progrssBarPopupOnPost(counter, totalMainComments,userName,true);
									// chrome.runtime.sendMessage({'type':'sendMessage','from':'contentScript','message':postMessage,'userId':userFbId});
								}
								
							},500);
						}
					},3000);
				}
			},3000);
		}
	}
}

/******
 *counter -> running user index
 * totalMainComments-> total main comments div
 * userName -> running comment user name
 * sendMessage-> update msg scrap to sending messsage 
 ********/
function progrssBarPopupOnPost(counter, totalMainComments,userName,sendMessage=false) { 
    $('#overlay-one').show();
    $('#processed-members-one').text(counter);
    $('.total-friends-one').text(totalMainComments);
    $('#post_comment-msgs').text('Start scanning comment.');
    if(userName != undefined && userName != ''){
    	$('#post_comment-msgs').text(userName+' scan comment.');
    }
    if(sendMessage && userName != undefined){
    	$('#post_comment-msgs').text('Sending message to '+userName);
    }

    if (counter == totalMainComments) {
        $('#post_comment-msgs').text('Completed');
        setTimeout(()=>{
       	 	chrome.runtime.sendMessage({'type':'closeWindow','from':'contentScript'})
       	 	hide_loader();
        },5000);	
    }
}

/*******Hide the progress bar popup*/
function hide_loader() {
	setTimeout(()=>{
		$('#overlay-one').hide();
	},1000);
}