/*
Roy McElmurry, Erik Nelson, Eric Spishak
MetaGame
UW hangout Hangout Hackathon, Winter 2012
*/

var localState = {};
var MOCHI_GAME_SERVICE = 'http://catalog.mochimedia.com/feeds/query/';

gapi.hangout.onApiReady.add(function(eventObj){
	if (eventObj.isApiReady) {
	    gapi.hangout.data.onStateChanged.add(function(event) {
		    $.each(event.addedKeys, function(idx, entry) {
			    console.log(idx, entry);
			    if (entry.key == 'game') {
				console.log('playing: ' + entry.value);
				playGame(entry.value);
			    } else if (entry.key == 'gameScores') {
				var gameScores = JSON.parse(entry.value);
				console.log(gameScores);
				receiveScores(gameScores);
			    }
			});
		});
	    startApp();
	}
    });

function receiveScores(gameScores) {
    var count = 0;
    $.each(gameScores, function() {
	    count++;
	});
    if (count == gapi.hangout.getParticipants().length) {
	gameOver();
    }
}

function gameOver() {
    alert('game over');
}

function startApp() {
    initBridge();
    var game = gapi.hangout.data.getValue('game');
    if (!game) {
        $('#app_content').append($("<h1 id='header'> META GAME </h1>"));
		fillGameList();
        $('#app_content').append($('<button>Play Game</button>').click(function() {
            getGames(function(games) {
                var g = selectGame(games);
                console.log(games, g);
                gapi.hangout.data.setValue('game', g.url);
                playGame(g);
            });
        }));
    } else {
        playGame(game);
    }
}

function fillGameList(){
	$('#app_content').append($("<ul id='gamelist'></ul>"));
	//var games = import game list
	//Adjust for styling of games list
	var games = {0:{'name':"World of Warcraft", 'id':"00001001"}, 1:{'name':"Batman Returns", 'id':"001232"}};
	var game;
	for(game in games){
		$('#gamelist').append($("<li value=\"" + games[game].id + "\"> " + games[game].name + " </li>"));
	}
	
	
	//$('#app_content').append($("</ul>"));
}

function playGame(game){
    $('#app_content').empty();
    embedGame(game);
}

function initBridge() {
    var options = {partnerID: "2d828d02099b26a8", id: "leaderboard_bridge"};
    var options = {partnerID: "2d828d02099b26a8", id: "leaderboard_bridge"};
    options.callback = scoreCallback;
    var id = gapi.hangout.getParticipantId();
    options.sessionID = id;
    var part = gapi.hangout.getParticipantById(id);
    options.username = part.person.displayName;
    Mochi.addLeaderboardIntegration(options);
}


function selectGame(game_options) {
    var idx = Math.round(Math.random() * game_options.length);
    return game_options[idx];
}

function embedGame(url) {
    //var url = 'http://games.mochiads.com/c/g/highway-traveling/Highway.swf';
    swfobject.embedSWF(url, "game", "720", "350", "9.0.0");
}

function scoreCallback(params) {
    console.log(params.name + " (" + params.sessionID + ") just scored " + params.score + "!");
    var gameScores = gapi.hangout.data.getValue('gameScores');
    if (gameScores) {
	gameScores = JSON.parse(gameScores);
    } else {
	gameScores = {};
    }
    gameScores[ gapi.hangout.getParticipantId() ] = params.score;
    gapi.hangout.data.setValue('gameScores', JSON.stringify(gameScores));
};


/*
Calls cb with a list of lists in the following format:

[
   {'name': ..., 'url': ...}
]
*/
function getGames(cb) {
    $.ajax({
	    'url': MOCHI_GAME_SERVICE,
	    'data': {'q': 'leaderboard_enabled', 'limit': '100'},
	    'dataType': 'jsonp',
       	    'success': function(data, textStatus, crap) {
		var res = [];
		$.each(data.games, function(idx, value) {
			res.push({'name': value.name, 'url': value.swf_url});
		    }
		);
		cb(res);
	    },
	    'error': function() {
            // Catch failure
	    } 
    });
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
