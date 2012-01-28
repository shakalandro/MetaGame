/*
Roy McElmurry, Erik Nelson, Eric Spishak
MetaGame
UW hangout Hangout Hackathon, Winter 2012
*/

var GAMES_LIST = null;
var MOCHI_GAME_SERVICE = 'http://catalog.mochimedia.com/feeds/query/';
var GAME_TIMEOUT = 30000;

gapi.hangout.onApiReady.add(function(eventObj){
	if (eventObj.isApiReady) {
		gapi.hangout.data.onStateChanged.add(function(event) {
            $.each(event.addedKeys, function(idx, entry) {
                console.log('event key: ', entry.key, entry.value);
                if (entry.key == 'game') {
                    playRound(entry.value);
                } else if (entry.key == 'scores') {
                    buildScoresPane();
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
    var highScore = 0;
    var winner;
    $.each(gameScores, function(id, score) {
	    count++;
	    if (score > highScore) {
		highScore = score;
		winner = id;
	    }
	});
    if (count == gapi.hangout.getParticipants().length) {
        gameOver(winner, gameScores);
    }
}

function gameOver(winner, gameScores) {
    if (gapi.hangout.getParticipantId() == winner) {
        addToMyScore(100);
    }
    var gameDiv = $('#game_outer');
    var result = '<h1>Game Over</h1>';
    result += '<h2>Scores</h2>';
    result += '<ul>';
    $.each(gameScores, function(id, score) {
	    result += '<li>';
	    var part = gapi.hangout.getParticipantById(id);
	    result += part.person.displayName + ': ' + score + ' points';
	    result += '</li>';
	});
    result += '</ul>';
    var part = gapi.hangout.getParticipantById(winner);
    result += '<h3>Winner: ' + part.person.displayName + '</h3>';
    gameDiv.html(result);    
    console.log('winner: ', winner);
    selectGame();
}

function startApp() {
    initBridge();
    setMyScore(0);
    var game = gapi.hangout.data.getValue('game');
    console.log('Game is: ', game);
    if (!game) {
		$('#app_content').append($("<ul id='gamelist'></ul>"));
		getGames(function(games) {
            fillGameList(games);
		});
    } else {
        buildScoresPane();
        playRound(game);
    }
}

/*
Adds the given value to your score.
*/
function addToMyScore(dx) {
    setMyScore(getMyScore() + dx);
}

/*
Sets the users score to the given value.
*/
function setMyScore(value) {
    var myId = gapi.hangout.getParticipantId();
    var scores = {};
    var shared_scores = gapi.hangout.data.getValue('scores');
    if (shared_scores) {
        scores = JSON.parse(shared_scores);
    }
    scores[myId] = value;
    gapi.hangout.data.setValue('scores', JSON.stringify(scores));
}

/*
Returns the users current score.
*/
function getMyScore() {
    var myId = gapi.hangout.getParticipantId();
    var shared_scores = gapi.hangout.data.getValue('scores');
    if (shared_scores) {
        scores = JSON.parse(shared_scores);
        if (scores['myId']) {
            return scores['myId'];
        }
    }
    return 0;
}

function buildScoresPane() {
    var scores = JSON.parse(gapi.hangout.data.getValue('scores'));
    var list = $("<ul id='scores_list'></ul>");
    $('#scores_pane').empty().append(list);
    $.each(scores, function(key, value) {
        var name = gapi.hangout.getParticipantById(key).person.displayName;
        var litem = $('<li></li>').append($('<span></span>').text(name + ': ' + value));
        var avatar = gapi.hangout.getParticipantById(key).person.image.url;
        if (avatar) {
            litem.prepend($('<img />').attr('src', avatar));
        }
        list.append(litem);
    });
}

function fillGameList(games){
	for(var i = 0; i < 10; i++){
		var game = selectGame(games);
		$('#gamelist').append($("<li onclick=playGame('" + game.url + "') > " + game.name + " </li>"));
	}
}

function playRound(url) {
    $('#app_content').empty();
    if (!url) {
        getGames(function(games) {
            var g = selectGame(games);
            console.log(games, g);
            gapi.hangout.data.setValue('game', g.url);
        });
    } else {
        embedGame(game);
    }
}

function initBridge() {
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
    swfobject.embedSWF(url, "game", "600", "400", "9.0.0");
    setTimeout(function() {
        fillGameList();
    }, GAME_TIMEOUT);
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
    if (GAMES_LIST) {
        return GAMES_LIST;
    } else {
        $.ajax({
            'url': MOCHI_GAME_SERVICE,
            'data': {'q': 'leaderboard_enabled', 'limit': '1000'},
            'dataType': 'jsonp',
            'success': function(data, textStatus, crap) {
                var res = [];
                $.each(data.games, function(idx, value) {
                    res.push({'name': value.name, 'url': value.swf_url});
                });
                GAMES_LIST = res;
                cb(res);
            },
            'error': function() {
                // Catch failure
            } 
        });
    }
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
