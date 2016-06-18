$(document).ready(function(){
    var SpotifyWebApi = require('spotify-web-api-node');
    var spotifyApi = new SpotifyWebApi();
    var myData;
    var j;
    $("#test").on("click", function(){
        for (var j = 0; j < 20; j++) {
        spotifyApi.searchTracks(document.getElementById('filename').value)
        .then(function (data) {
                while (j < 20){
                $("#results").after("<header class='songLink'>" + data.body.tracks.items[j].artists[0].name + " ////////// " + data.body.tracks.items[j].name + "</header><br/>");
                $(".songLink").eq(j).attr("id", "songLink" + j);
                $(".songLink").eq(j).attr("name", baseURL + userID + "/playlists/" + Snapster + "/tracks?position=0&uris=spotify%3Atrack%3A" + data.body.tracks.items[j].id);
                $('#songLink' + j).on("click", function () {
                    $.ajax({
                        type: "POST",
                        url: $(this).attr('name'),
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        dataType: "json",
                        data: "formdata",
                        success: function (dataFirst) {
                            console.log(Snapster);
                        }
                    });
                });
                        }
            })
        , function (err) {
        console.error(err);
    };
        }
        
        });
    });
