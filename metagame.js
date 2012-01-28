/*
Roy McElmurry, Erik Nelson, Eric Spishak
MetaGame
UW hangout Hangout Hackathon, Winter 2012
*/

gapi.hangout.onApiReady.add(function(eventObj){
	if (eventObj.isApiReady) {
	    startApp();
	}
});

function startApp() {
    $('#app_body').append($('<p>Hello World</p>'));
}