/*
Roy McElmurry, Erik Nelson, Eric Spishak
MetaGame
UW hangout Hangout Hackathon, Winter 2012
*/

var GAMES_LIST = null;
var MOCHI_GAME_SERVICE = 'http://catalog.mochimedia.com/feeds/query/';
var GAME_TIMEOUT = 120000;

gapi.hangout.onApiReady.add(function(eventObj){
	if (eventObj.isApiReady) {
		gapi.hangout.data.onStateChanged.add(function(event) {
            $.each(event.addedKeys, function(idx, entry) {
                console.log('event key: ', entry.key, entry.value);
                if (entry.key == 'game') {
                    playRound(JSON.parse(entry.value));
                } else if (entry.key == 'scores') {
                    buildScoresPane();
                } else if (entry.key == 'gameScores') {
                    var gameScores = JSON.parse(entry.value);
                    console.log('gamescores: ', gameScores);
                    receiveScores(gameScores);
			    }
            });
        });
	    startApp();
        
        gapi.hangout.onParticipantsRemoved.add(function() {
            var gameScores = gapi.hangout.data.getValue('gameScores');
            if (gameScores) {
                receiveScores(JSON.parse(gameScores));
            }
        });
	}
});

function receiveScores(gameScores) {
    var count = 0;
    var highScore = 0;
    var winner;
    $.each(gameScores, function(id, score) {
	    count++;
	    if (score >= highScore) {
            highScore = score;
            winner = id;
	    }
	});
    if (count >= gapi.hangout.getParticipants().length) {
        gameOver(winner, gameScores);
    }
}

var topHatOverlay;

function gameOver(winner, gameScores) {
    console.log('winner: ', winner);
    if (gapi.hangout.getParticipantId() == winner) {
        addToMyScore(parseInt(gameScores[winner]));
	topHatOverlay.setVisible(true);
    }
    gapi.hangout.hideApp();
    gapi.hangout.setDisplayedParticipant(winner);
    setTimeout(function() {
	    showApp(gameScores, winner);
	}, 10000);
}

function startApp() {
    setMyScore(0);
    //var topHat = gapi.hangout.av.effects.createImageResource('http://hangoutmediastarter.appspot.com/static/topHat.png');
    var topHat = gapi.hangout.av.effects.createImageResource('http://thebeast.hopto.org/roy/crown_alpha.png');
    topHatOverlay = topHat.createFaceTrackingOverlay(
						     {'trackingFeature':
						      gapi.hangout.av.effects.FaceTrackingFeature.NOSE_ROOT,
						      'scaleWithFace': true,
						      'rotateWithFace': true,
						      'scale': 1.0
						     });
    var game = gapi.hangout.data.getValue('game');
    console.log('Game is: ', game);
    $('#scores_pane').hide();
    if (!game) {
        newGameButton();
    } else {
        playRound(JSON.parse(game));
    }
}

function showApp(gameScores, winner) {
    gapi.hangout.showApp();
    topHatOverlay.setVisible(false);
    var gameName = JSON.parse(gapi.hangout.data.getValue('game')).name;
    var gameDiv = $('#game_outer').empty();
    var result = '<h1>Round Summary</h1>';
    result += '<h2>' + gameName + '</h2>';
    //    result += '<ul>';
    result += '<div id="scores_list">';
    $.each(gameScores, function(id, score) {
	    result += '<div class="outer_badge">';
	    var part = gapi.hangout.getParticipantById(id);
	    result += '<img src=\'' + part.person.image.url + '\'/>';
	    result += '<div class="badge">';
	    result += '<strong>' + part.person.displayName + '</strong><br />' + score + ' points';
	    result += '</div></div>';
	});
    result += '</div>';
    var part = gapi.hangout.getParticipantById(winner);
    result += '<h3>Winner: ' + part.person.displayName + '</h3>';
    gameDiv.html(result);
    newGameButton();
    buildScorePane();
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
        if (scores[myId]) {
            return scores[myId];
        }
    }
    return 0;
}

function buildScoresPane() {
    var scores = JSON.parse(gapi.hangout.data.getValue('scores'));
    var list = $("<div id='scores_list'></div>");
    $('#scores_pane').empty().append(list);
    console.log('building scores pane', scores);
    $.each(scores, function(key, value) {
        console.log(key, value);
        var participant = gapi.hangout.getParticipantById(key);
        if (participant) {
            var name = participant.person.displayName;
	    
            var litem = $('<div class="outer_badge"></div>').append($('<div class="badge"></div>').html('<strong>' + name + '</strong><br />' + value + ' points'));
            var avatar = gapi.hangout.getParticipantById(key).person.image.url;
            if (avatar) {
                litem.prepend($('<img />').attr('src', avatar));
            }
            list.append(litem);
        }
    });
}

var game_map = {};

function fillGameList() {
    game_map = {};
    $('#scores_pane').hide();
    $('#app_content').empty().append($("<ul id='gamelist'></ul>"));
    getGames(function(games) {
        for(var i = 0; i < 10; i++){
            var game = selectGame(games);
            game_map[game.name] = game;
            $('#gamelist').append($("<li onclick=\"loadGame('" + game.name + "');\" > " + game.name + " </li>").prepend($('<img />').attr('src', game.thumb)));

        }
    });
}

function loadGame(name) {
    gapi.hangout.data.setValue('gameScores', '{}');
    gapi.hangout.data.setValue('game', JSON.stringify(game_map[name]));
}

function newGameButton() {
    $('#app_content').empty()
            .append($('<div><button>Choose Next Round</button></div>').click(fillGameList))
            .append($('<a id="about_popup" href="#about_div">Help/About</a>'));
    $("a#about_popup").fancybox({'width': 600, 'height': 400, 'autoDimensions': false});
}

function playRound(game) {
    console.log('playround arg: ', game);
    $('#app_content').empty();
    $('#scores_pane').show();
    buildScoresPane();
    embedGame(game.url, game.width, game.height);
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
    var idx = Math.floor(Math.random() * game_options.length);
    return game_options[idx];
}

function embedGame(url, width, height) {
    //url = 'http://games.mochiads.com/c/g/fly-squirrel/fly-squirrel.swf';
    console.log('Playing game: ', url);
    console.log('width: ' + width + ', height: ' + height);
    $('#game_outer').empty().append($('<div id="game"></div>'));
    swfobject.embedSWF(url, "game", "" + width, "" + height, "9.0.0");
    initBridge();
    setTimeout(function() {
        console.log('rechoosing game');
        newGameButton();
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
        cb(GAMES_LIST);
    } else {
        var offset = parseInt(Math.random() * 1800);
        $.ajax({
            'url': MOCHI_GAME_SERVICE,
            'data': {'q': '(((((not category:puzzles) and leaderboard_enabled) and not category:jigsaw) and width:<=575) and height:<=450)',
                     'limit': '200',
                     'offset': '' + offset
            },
            'dataType': 'jsonp',
            'success': function(data, textStatus, crap) {
                GAMES_LIST = [];
                $.each(data.games, function(idx, value) {
                    GAMES_LIST.push({'name': value.name, 'url': value.swf_url, 'width': value.width, 'height': value.height, 'thumb': value.thumbnail_url});
                });
                cb(GAMES_LIST);
            },
            'error': function() {
                // Catch failure
            } 
        });
    }
}

