$(document).ready(function () {
    $('#results').empty;
    var userID = localStorage['userID'];
    var Snapster;
    var playlists = [];
    // $("#filename").focus(function (event) {
    $('#infoHeader').empty();
    $('#infoHeader').append("Upcoming Songs");
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
            if (playlists.indexOf("Partify") != -1 && data.items[partyPlaylist].id === localStorage['Snapster']) {
                for (i = 0; i < data.items.length; i++) {
                    localStorage['Snapster'] = data.items[partyPlaylist].id;
                    Snapster = localStorage['Snapster'];
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
                            $('#results').append("<header alt='0' class='songLinkCurrent'>" + currentPLData.items[i].track.artists[0].name + "<br />" + currentPLData.items[i].track.name + "</header><br>");
                            $(".songLinkCurrent").eq(i).on("click", function () {
                                $(".songLinkCurrent").eq(i).append("alt", "100");
                                alert("Clicked");
                            });
                        }
                        
                    }
                });
                playlists = [];
            }
        }
    
  //  });
    });
});