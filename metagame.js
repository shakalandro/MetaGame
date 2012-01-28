/*
Roy McElmurry, Erik Nelson, Eric Spishak
MetaGame
UW hangout Hangout Hackathon, Winter 2012
*/


var MOCHI_GAME_SERVICE = 'http://catalog.mochimedia.com/feeds/query/';

gapi.hangout.onApiReady.add(function(eventObj){
	if (eventObj.isApiReady) {
	    startApp();
	}
});

function startApp() {
    initBridge();
    getGames(function(gs) {
        var choice = selectGame(gs);
	    console.log(choice);
        embedGame(choice.url);
    });
}

function initBridge() {
    var options = {partnerID: "2d828d02099b26a8", id: "leaderboard_bridge"};
    options.callback = function (params) {
        console.log(params.username + " (" + params.sessionID + ") just scored " + params.score + "!");
    };
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
    // http://games.mochiads.com/c/g/highway-traveling/Highway.swf
    swfobject.embedSWF(url, "game", "720", "480", "9.0.0");
}

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