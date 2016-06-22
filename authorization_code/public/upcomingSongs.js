$(document).ready(function () {
    $('#results').empty;
    var userID;
    var Snapster;
    var playlists = [];
    $(window).load(function () {
            localStorage['userID'] = $('#userID2').html();
            userID = localStorage['userID'];
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
                    partyPlaylist = playlists.indexOf("Partify");
                    if (playlists.indexOf("Partify") != -1) {
                        for (i = 0; i < data.items.length; i++) {
                            Snapster = data.items[partyPlaylist].id;
                        }
                        $("#results").css("text-align", "center");
                        $.ajax({
                            type: "GET",
                            url: "https://api.spotify.com/v1/users/" + userID + "/playlists/" + Snapster + "/tracks",
                            headers: { 'Authorization': 'Bearer ' + access_token },
                            dataType: "json",
                            data: "formdata",
                            success: function (currentPLData) {
                            $('#results').empty();
                                for (i = 0; i < currentPLData.items.length; i++) {
                                    $('#results').append("<header class='songLink'>" + currentPLData.items[i].track.artists[0].name + "<br />" + currentPLData.items[i].track.name + "</header><br/>");
                                }
                            }
                        });
                    }
                }
            });
    
    });
});