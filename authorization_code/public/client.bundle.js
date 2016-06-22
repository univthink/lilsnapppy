$(document).ready(function () {
    var userID;
    var baseURL;
    var myData;
    var searchQry;
    var trackID;
    var sendInfo;
    var Snapster;
    var playlists = [];
    var total;
    var totalVariable;
    var urlData;
    var jsonData;
    var obj;
    var userLink;
    var userData;
    var jData;
    var partyPlaylist;
    $("#filename").keypress(function (event) {
        if (event.which == 13) {
            $("#results").hide().fadeIn('fast');
            $.ajax({
                type: "GET",
                url: "https://api.spotify.com/v1/search?q=" + searchQry + "&type=track,artist&market=us&limit=50&offset=0",
                headers: { 'Authorization': 'Bearer ' + access_token },
                dataType: "json",
                data: "formdata",
                success: function (myData) {
                    $.ajax({
                        type: "GET",
                        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        dataType: "json",
                        data: "formdata",
                        success: function (data) {
                            for (i = 0; i < data.items.length; i++) {
                                playlists.push(data.items[i].name);
                            }
                            if (playlists.indexOf("Partify") != -1) {
                                for (i = 0; i < data.items.length; i++) {
                                    console.log("Already Exists");
                                    Snapster = data.items[partyPlaylist].id;
                                }
                                for (i = 0; i < myData.tracks.items.length; i++) {
                                    $('#results').append("<header class='songLink'>" + myData.tracks.items[i].artists[0].name + "<br />" + myData.tracks.items[i].name + "</header><br/>");
                                    $(".songLink").eq(i).attr("id", "songLink" + i);
                                    $(".songLink").eq(i).attr("name", baseURL + userID + "/playlists/" + Snapster + "/tracks?&uris=spotify%3Atrack%3A" + myData.tracks.items[i].id);
                                    $('header#songLink' + i).on("click", function () {
                                        $.ajax({
                                            type: "POST",
                                            url: $(this).attr('name'),
                                            headers: { 'Authorization': 'Bearer ' + access_token },
                                            dataType: "json",
                                            data: "formdata",
                                            success: function (dataFirst) {
                                                console.log("playlist id=" + Snapster);
                                                console.log("song id=" + myData.tracks.items.id);
                                                $("#results").empty();
                                                $("#results").css("text-align", "center");
                                                $.ajax({
                                                    type: "GET",
                                                    url: "https://api.spotify.com/v1/users/" + userID + "/playlists/" + Snapster + "/tracks",
                                                    headers: { 'Authorization': 'Bearer ' + access_token },
                                                    dataType: "json",
                                                    data: "formdata",
                                                    success: function (currentPLData) {
                                                        for (i = 0; i < currentPLData.items.length; i++) {
                                                            $("results").empty();
                                                            $('#results').append("<header class='songLink'>" + currentPLData.items[i].track.artists[0].name + "<br />" + currentPLData.items[i].track.name + "</header><br/>");
                                                        }
                                                    }
                                                });
                                            }

                                        });
                                    });
                                }
                            }
                            partyPlaylist = [];
                        }
                    });
                }
            });    
        }
    });
});