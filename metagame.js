/*
Roy McElmurry, Erik Nelson, Eric Spishak
MetaGame
UW hangout Hangout Hackathon, Winter 2012
*/

var localState = {};

gapi.hangout.onApiReady.add(function(eventObj){
	if (eventObj.isApiReady) {
		
		gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
          updateLocalStateData(stateChangeEvent.addedKeys,
                               stateChangeEvent.removedKeys);
        });

		
	    startApp();
	}
});

function updateLocalStateData(added, removed){
	alert("HASH TAG WHADDAP!!!");
	/*for (var i = 0, iLen = add.length; i < iLen; ++i) {
		var hangoutId = getHangoutIdFromUserKey_(add[i].key);
		if (hangoutId) {
		  var avatar = Avatar.deserialize(add[i].value);
		  var currAvatar = avatarMap_[hangoutId];
		  if (avatar && (!currAvatar || avatar.getId() !== currAvatar.getId())) {
			alert(avatar)
		  }
		}
	}*/

}
function startApp() {

    $('#app_body').append($("<h1 id='header'> META GAME </h1>"));

	var v = document.createElement("input");
	v.type = "submit";
	v.value = "Play Game";
	v.onclick = playGame;
	$('#app_body').append(v);
	
	var gameBox = document.createElement("input");
	gameBox.type = "text";
	gameBox.id = "gameBox";
	gameBox.value = "hellow";
	$('#app_body').append(gameBox);
	$('#gameBox').hide();
}

function playGame(){
	var value = $('#gameBox').val(); // store the url
    var state = {};
    state["GameChoice"] = value;
	gapi.hangout.data.submitDelta(state);
	
	$('#app_body').empty();
	$('#app_body').append(value);
}

/**************************STOLEN METHODS**************************/

/**
 * Gets the user's hangoutId from the userKey. This is the oppposite operation
 * of makeUserKey_.
 * @return {?string} The user's hangoutId, or null if the userKey isn't
 *     correctly formatted.
 * @see #makeUserKey_
 * @private
 */
function getHangoutIdFromUserKey_(userKey) {
  if (typeof userKey === 'string') {
    var idx = userKey.lastIndexOf(':');

    if (idx >= 0) {
      if ('avatar' === userKey.substr(idx + 1)) {
        return userKey.substr(0, idx);
      }
    }
  }
  return null;
}
