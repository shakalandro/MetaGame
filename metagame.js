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
    getGames(function(gs) {
	    
    });
}


function selectGame() {
    
}

/*
Calls cb with a list of lists in the following format:

[
   [name, swf_url]
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
			res.push([value.name, value.swf_url]);
		    }
		);
		cb(res);
	    },
	    'error': function() {
		// Catch failure
	    } 
    });
}